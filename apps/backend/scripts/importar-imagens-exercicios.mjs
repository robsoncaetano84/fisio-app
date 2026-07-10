// ==========================================
// Importa imagens de exercicios (arquivos locais) -> Supabase Storage
// e preenche o Postgres (exercicio_midias.image_url/storage_path) + aprova.
//
// Uso (rodar de dentro de apps/backend):
//   node scripts/importar-imagens-exercicios.mjs <pasta-imagens> [manifesto.csv] [--dry-run]
//
// Mapeamento imagem -> exercicio (asset_key):
//   1) Se houver manifesto CSV (colunas: arquivo,asset_key[,license]) ele manda.
//   2) Senao, o proprio NOME DO ARQUIVO vira asset_key:
//        "mobilidade-lombar-gato-camelo.png" -> "MOBILIDADE_LOMBAR_GATO_CAMELO"
//
// Requisitos no .env (apps/backend/.env):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_EXERCISE_BUCKET(=exercicios)
//   DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_SSL
// ==========================================
import 'dotenv/config';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { basename, extname, join } from 'path';
import pg from 'pg';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter((a) => !a.startsWith('--'));
const imagesDir = positional[0];
const manifestPath =
  positional[1] ||
  (imagesDir ? join(imagesDir, 'manifesto.csv') : undefined);

if (!imagesDir) {
  console.error(
    'Uso: node scripts/importar-imagens-exercicios.mjs <pasta-imagens> [manifesto.csv] [--dry-run]',
  );
  process.exit(1);
}

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BUCKET = (process.env.SUPABASE_EXERCISE_BUCKET || 'exercicios').trim();

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const toAssetKey = (fileName) =>
  basename(fileName, extname(fileName))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildObjectKey = (assetKey, ext) => {
  const safeAsset = assetKey.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  const rand = Math.random().toString(36).slice(2, 10);
  return `${safeAsset}/${Date.now()}-${rand}${ext}`;
};

// ---- monta a lista de trabalho (arquivo -> assetKey) --------------------
const readManifest = () => {
  if (!manifestPath || !existsSync(manifestPath)) return null;
  const rows = readFileSync(manifestPath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(',').map((c) => c.trim()));
  // pula cabecalho se a 2a coluna nao parecer asset_key
  const start = /asset/i.test(rows[0]?.[1] || '') ? 1 : 0;
  return rows
    .slice(start)
    .map(([arquivo, assetKey, license]) => ({
      arquivo: (arquivo || '').trim(),
      assetKey: (assetKey || toAssetKey(arquivo || '')).toUpperCase(),
      // 3a coluna que comeca com '#' e comentario (ex.: nome do exercicio), nao licenca
      license: license && !license.startsWith('#') ? license : null,
    }))
    // pula linhas do template ainda nao preenchidas (sem nome de arquivo)
    .filter((r) => r.arquivo);
};

const listFromDir = () => {
  const out = [];
  const walk = (dir, rel = '') => {
    for (const e of readdirSync(dir)) {
      const abs = join(dir, e);
      const relPath = rel ? `${rel}/${e}` : e;
      if (statSync(abs).isDirectory()) walk(abs, relPath);
      else if (MIME_BY_EXT[extname(e).toLowerCase()]) {
        out.push({ arquivo: relPath, assetKey: toAssetKey(e), license: null });
      }
    }
  };
  walk(imagesDir);
  return out;
};

const work = readManifest() || listFromDir();
if (!work.length) {
  console.error(`Nenhuma imagem encontrada em: ${imagesDir}`);
  process.exit(1);
}

// ---- Supabase Storage helpers ------------------------------------------
const ensureBucket = async () => {
  const head = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  });
  if (head.ok) return;
  const create = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!create.ok) {
    throw new Error(`Falha ao criar bucket "${BUCKET}": ${create.status} ${await create.text()}`);
  }
  console.log(`Bucket "${BUCKET}" criado (publico).`);
};

const uploadFile = async (objectKey, mime, buffer) => {
  const encoded = objectKey.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encoded}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': mime,
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    },
  );
  if (!res.ok) throw new Error(`upload ${res.status}: ${await res.text()}`);
  return {
    storagePath: `supabase://${BUCKET}/${objectKey}`,
    imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encoded}`,
  };
};

// ---- main ---------------------------------------------------------------
const main = async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      'ERRO: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY nao configurados no .env.',
    );
    process.exit(1);
  }

  console.log(
    `\n${dryRun ? '[DRY-RUN] ' : ''}Importando ${work.length} imagem(ns) de "${imagesDir}"`,
  );
  console.log(`Bucket: ${BUCKET} | Projeto: ${SUPABASE_URL}\n`);

  const client = new pg.Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
  });
  await client.connect();

  if (!dryRun) await ensureBucket();

  let ok = 0;
  let semLinha = 0;
  let semArquivo = 0;
  let erro = 0;

  for (const item of work) {
    const filePath = join(imagesDir, item.arquivo);
    if (!existsSync(filePath)) {
      console.log(`  ⚠️  arquivo nao encontrado: ${item.arquivo}`);
      semArquivo++;
      continue;
    }
    // confere se existe registro semeado para o asset_key
    const { rows } = await client.query(
      'SELECT id FROM exercicio_midias WHERE asset_key = $1',
      [item.assetKey],
    );
    if (!rows.length) {
      console.log(
        `  ⚠️  sem registro em exercicio_midias para asset_key="${item.assetKey}" (arquivo ${item.arquivo}) — pulei`,
      );
      semLinha++;
      continue;
    }

    if (dryRun) {
      console.log(`  ✓ ${item.arquivo}  ->  ${item.assetKey}  (ok, seria enviado)`);
      ok++;
      continue;
    }

    try {
      const ext = extname(item.arquivo).toLowerCase();
      const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
      const buffer = readFileSync(filePath);
      const key = buildObjectKey(item.assetKey, ext);
      const { storagePath, imageUrl } = await uploadFile(key, mime, buffer);

      const licenseSet = item.license ? ', license = $6' : '';
      const params = [storagePath, imageUrl, mime, buffer.length, item.assetKey];
      if (item.license) params.push(item.license);

      await client.query(
        `UPDATE exercicio_midias
           SET storage_path = $1,
               image_url = $2,
               thumbnail_url = $2,
               mime_type = $3,
               bytes = $4,
               revisao_clinica_status = 'APROVADA',
               revisao_clinica_em = now(),
               revisado_em = now(),
               updated_at = now()${licenseSet}
         WHERE asset_key = $5`,
        params,
      );
      console.log(`  ✅ ${item.arquivo}  ->  ${item.assetKey}  ->  ${imageUrl}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ ${item.arquivo}: ${e.message}`);
      erro++;
    }
  }

  await client.end();
  console.log(
    `\nResumo: ${ok} ok | ${semLinha} sem registro | ${semArquivo} sem arquivo | ${erro} erro`,
  );
  if (semLinha || semArquivo || erro) {
    console.log(
      'Dica: os asset_keys precisam bater com os semeados (enum ExerciseImageType). ' +
        'Use um manifesto.csv (arquivo,asset_key) se os nomes nao baterem.',
    );
  }
};

main().catch((e) => {
  console.error('Falha:', e);
  process.exit(1);
});
