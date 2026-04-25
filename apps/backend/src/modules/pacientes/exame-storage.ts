import { BadGatewayException } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';

const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads', 'paciente-exames');
const DEFAULT_BUCKET = 'paciente-exames';

const getSupabaseConfig = () => {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET).trim();

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

const parseSupabaseUri = (uri: string): { bucket: string; objectKey: string } | null => {
  if (!uri.startsWith('supabase://')) {
    return null;
  }
  const withoutScheme = uri.slice('supabase://'.length);
  const firstSlash = withoutScheme.indexOf('/');
  if (firstSlash <= 0 || firstSlash >= withoutScheme.length - 1) {
    return null;
  }
  return {
    bucket: withoutScheme.slice(0, firstSlash),
    objectKey: withoutScheme.slice(firstSlash + 1),
  };
};

export const buildExameObjectKey = (
  usuarioId: string,
  pacienteId: string,
  originalName: string,
): string => {
  const extension = extname(originalName || '').toLowerCase() || '.bin';
  const safeExt = extension.replace(/[^a-z0-9.]/g, '') || '.bin';
  const random = Math.random().toString(36).slice(2, 10);
  return `${usuarioId}/${pacienteId}/${Date.now()}-${random}${safeExt}`;
};

export const persistExameFile = async (params: {
  usuarioId: string;
  pacienteId: string;
  objectKey: string;
  mimeType: string;
  fileBuffer: Buffer;
}) => {
  const config = getSupabaseConfig();

  if (config) {
    const encodedKey = params.objectKey
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    const uploadUrl = `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodedKey}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        apikey: config.serviceRoleKey,
        'Content-Type': params.mimeType,
        'x-upsert': 'false',
      },
      body: new Uint8Array(params.fileBuffer),
    });

    if (response.ok) {
      return {
        nomeArquivo: params.objectKey,
        caminhoArquivo: `supabase://${config.bucket}/${params.objectKey}`,
      };
    }

    const payload = await response.text().catch(() => '');
    throw new BadGatewayException(
      `Falha ao enviar arquivo para o storage: ${response.status} ${payload}`,
    );
  }

  ensureLocalUploadsDir();
  const localFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(params.objectKey) || '.bin'}`;
  const localPath = join(LOCAL_UPLOADS_DIR, localFileName);
  await fs.writeFile(localPath, params.fileBuffer);

  return {
    nomeArquivo: localFileName,
    caminhoArquivo: localPath,
  };
};

export const readExameFile = async (caminhoArquivo: string): Promise<Buffer> => {
  const supabaseRef = parseSupabaseUri(caminhoArquivo);
  if (!supabaseRef) {
    return fs.readFile(caminhoArquivo);
  }

  const config = getSupabaseConfig();
  if (!config) {
    throw new BadGatewayException('Storage Supabase não configurado para leitura do arquivo.');
  }

  const encodedKey = supabaseRef.objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const downloadUrl = `${config.url}/storage/v1/object/${encodeURIComponent(supabaseRef.bucket)}/${encodedKey}`;

  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
    },
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => '');
    throw new BadGatewayException(`Falha ao baixar arquivo do storage: ${response.status} ${payload}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const deleteExameFile = async (caminhoArquivo: string): Promise<void> => {
  const supabaseRef = parseSupabaseUri(caminhoArquivo);
  if (!supabaseRef) {
    await fs.unlink(caminhoArquivo).catch(() => undefined);
    return;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return;
  }

  const encodedKey = supabaseRef.objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const deleteUrl = `${config.url}/storage/v1/object/${encodeURIComponent(supabaseRef.bucket)}/${encodedKey}`;

  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
    },
  }).catch(() => undefined);
};
