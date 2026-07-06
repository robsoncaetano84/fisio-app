// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// E XE RC IC IO M ID IA S TO RA GE
// ==========================================
// Etapa-38 F3: upload de imagem do catalogo de exercicios. Segue o padrao do
// projeto (pacientes/exame-storage): arquivo passa pelo backend -> Supabase
// Storage via REST, com fallback local quando o Supabase nao esta configurado.
import { BadGatewayException } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';

const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads', 'exercicios');
const DEFAULT_BUCKET = 'exercicios';

const getSupabaseConfig = () => {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const bucket = (
    process.env.SUPABASE_EXERCISE_BUCKET || DEFAULT_BUCKET
  ).trim();

  if (!url || !serviceRoleKey || !bucket) {
    return null;
  }
  return { url, serviceRoleKey, bucket };
};

const ensureLocalUploadsDir = () => {
  if (!existsSync(LOCAL_UPLOADS_DIR)) {
    mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
};

export const buildExercicioMidiaObjectKey = (
  assetKey: string,
  originalName: string,
): string => {
  const extension = extname(originalName || '').toLowerCase() || '.bin';
  const safeExt = extension.replace(/[^a-z0-9.]/g, '') || '.bin';
  const safeAsset =
    (assetKey || 'exercicio').toLowerCase().replace(/[^a-z0-9._-]/g, '-') ||
    'exercicio';
  const random = Math.random().toString(36).slice(2, 10);
  return `${safeAsset}/${Date.now()}-${random}${safeExt}`;
};

export interface ExercicioMidiaUploadResult {
  storagePath: string;
  imageUrl: string | null;
}

// Subconjunto de Express.Multer.File usado no upload (evita acoplar o service
// ao tipo do multer).
export interface UploadedExercicioMidiaFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export const persistExercicioMidiaFile = async (params: {
  objectKey: string;
  mimeType: string;
  fileBuffer: Buffer;
}): Promise<ExercicioMidiaUploadResult> => {
  const config = getSupabaseConfig();

  if (config) {
    const encodedKey = params.objectKey
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    const bucket = encodeURIComponent(config.bucket);
    const uploadUrl = `${config.url}/storage/v1/object/${bucket}/${encodedKey}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
        'Content-Type': params.mimeType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(params.fileBuffer),
    });

    if (!response.ok) {
      const payload = await response.text().catch(() => '');
      throw new BadGatewayException(
        `Falha ao enviar imagem do exercicio: ${response.status} ${payload}`,
      );
    }

    return {
      storagePath: `supabase://${config.bucket}/${params.objectKey}`,
      imageUrl: `${config.url}/storage/v1/object/public/${bucket}/${encodedKey}`,
    };
  }

  // Fallback local (desenvolvimento / sem Supabase configurado).
  ensureLocalUploadsDir();
  const localFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${
    extname(params.objectKey) || '.bin'
  }`;
  const localPath = join(LOCAL_UPLOADS_DIR, localFileName);
  await fs.writeFile(localPath, params.fileBuffer);

  return { storagePath: localPath, imageUrl: null };
};
