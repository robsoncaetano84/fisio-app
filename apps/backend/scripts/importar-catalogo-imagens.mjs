// ==========================================
// Liga imagens locais do catalogo mestre aos exercicios (por SLUG):
//   - sobe a imagem ao Supabase Storage (bucket exercicios)
//   - cria/atualiza o registro exercicio_midias (APROVADA)
//   - preenche exercicios.imagem_key quando estava nulo (senao a imagem nao aparece)
// Nao altera o STATUS do exercicio (segue RASCUNHO ate revisao clinica). [Opcao A]
//
// Uso (de apps/backend):
//   node scripts/importar-catalogo-imagens.mjs <pasta-imagens> [--dry-run]
// ==========================================
import 'dotenv/config';
import { readFileSync, readdirSync, statSync } from 'fs';
import { basename, extname, join } from 'path';
import pg from 'pg';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const imagesDir = args.find((a) => !a.startsWith('--'));
if (!imagesDir) {
  console.error('Uso: node scripts/importar-catalogo-imagens.mjs <pasta-imagens> [--dry-run]');
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
};

const stripAccents = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const toSlug = (name) =>
  stripAccents(basename(name, extname(name)))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const toAssetKey = (slug) =>
  slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120);
const buildObjectKey = (assetKey, ext) => {
  const safe = assetKey.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${safe}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
};

const walk = (dir, acc = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (MIME_BY_EXT[extname(e).toLowerCase()]) acc.push(p);
  }
  return acc;
};

const ensureBucket = async () => {
  const head = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  });
  if (head.ok) return;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!r.ok) throw new Error(`criar bucket: ${r.status} ${await r.text()}`);
  console.log(`Bucket "${BUCKET}" criado (publico).`);
};

const uploadFile = async (objectKey, mime, buffer) => {
  const encoded = objectKey.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encoded}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, 'Content-Type': mime, 'x-upsert': 'true' },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) throw new Error(`upload ${res.status}: ${await res.text()}`);
  return {
    storagePath: `supabase://${BUCKET}/${objectKey}`,
    imageUrl: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encoded}`,
  };
};

const main = async () => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('ERRO: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nao configurados.');
    process.exit(1);
  }
  const files = walk(imagesDir);
  console.log(`${dryRun ? '[DRY-RUN] ' : ''}${files.length} imagem(ns) em "${imagesDir}"\n`);

  const client = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
  });
  await client.connect();

  // preload catalogo + midias
  const ex = await client.query('SELECT id, slug, imagem_key FROM exercicios');
  const bySlug = new Map(ex.rows.map((r) => [r.slug, r]));
  const mid = await client.query('SELECT exercicio_id, asset_key, image_url FROM exercicio_midias');
  const served = new Set(mid.rows.filter((m) => m.image_url).map((m) => m.exercicio_id));

  if (!dryRun) await ensureBucket();

  let criou = 0, atualizou = 0, jaTinha = 0, semExercicio = 0, erro = 0;
  const feitos = new Set();

  for (const filePath of files) {
    const slug = toSlug(filePath);
    const exrow = bySlug.get(slug);
    if (!exrow) { semExercicio++; continue; }
    if (feitos.has(exrow.id)) continue; // dedup: 1 imagem por exercicio
    if (served.has(exrow.id)) { jaTinha++; feitos.add(exrow.id); continue; }

    const assetKey = exrow.imagem_key || toAssetKey(slug);
    if (dryRun) {
      console.log(`  ${exrow.imagem_key ? 'upload  ' : 'cria+up '} ${slug} -> ${assetKey}`);
      exrow.imagem_key ? atualizou++ : criou++;
      feitos.add(exrow.id);
      continue;
    }
    try {
      const ext = extname(filePath).toLowerCase();
      const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
      const buffer = readFileSync(filePath);
      const key = buildObjectKey(assetKey, ext);
      const { storagePath, imageUrl } = await uploadFile(key, mime, buffer);

      await client.query(
        `INSERT INTO exercicio_midias
           (exercicio_id, asset_key, tipo, source_type, author, license, attribution_text,
            storage_path, image_url, thumbnail_url, mime_type, bytes, versao,
            revisao_clinica_status, revisao_clinica_em, revisado_em, ativo)
         VALUES ($1,$2,'ILUSTRACAO','PROPRIA','Synap','PROPRIETARIA_SYNAP','Ilustracao propria Synap.',
            $3,$4,$4,$5,$6,1,'APROVADA',now(),now(),true)
         ON CONFLICT (exercicio_id, asset_key) DO UPDATE SET
            storage_path=EXCLUDED.storage_path, image_url=EXCLUDED.image_url, thumbnail_url=EXCLUDED.thumbnail_url,
            mime_type=EXCLUDED.mime_type, bytes=EXCLUDED.bytes, revisao_clinica_status='APROVADA',
            revisao_clinica_em=now(), revisado_em=now(), updated_at=now()`,
        [exrow.id, assetKey, storagePath, imageUrl, mime, buffer.length],
      );
      const created = !exrow.imagem_key;
      if (created) {
        await client.query('UPDATE exercicios SET imagem_key=$1, updated_at=now() WHERE id=$2 AND imagem_key IS NULL', [assetKey, exrow.id]);
        criou++;
      } else {
        atualizou++;
      }
      feitos.add(exrow.id);
    } catch (e) {
      console.log(`  ❌ ${slug}: ${e.message}`);
      erro++;
    }
  }

  await client.end();
  console.log(`\nResumo: ${criou} criados(+imagem_key) | ${atualizou} atualizados | ${jaTinha} ja tinham | ${semExercicio} imagens sem exercicio | ${erro} erro`);
};

main().catch((e) => { console.error('Falha:', e); process.exit(1); });
