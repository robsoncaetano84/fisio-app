// ==========================================
// Baseline reset — reconciliacao do ledger de migrations
//
// Contexto: o banco foi construido por uma linhagem de migrations (etapa-37) e
// o codigo roda outra (comunidade/etapa-38). Rodar `migration:run` cru tentaria
// aplicar migrations do codigo que ja nao fazem sentido no schema atual (F7, F16
// etc.) -> conflito. A solucao segura e ADOTAR o schema atual como baseline:
// marcar as migrations do codigo como "aplicadas" no ledger (public.migrations),
// para que `migration:run` vire no-op e SO rode migrations NOVAS daqui pra frente.
//
// NAO altera schema (nenhum CREATE/ALTER/DROP) — so o ledger. Reversivel
// (basta apagar as linhas inseridas).
//
// Requer o build (dist) atualizado. Uso (de apps/backend):
//   node scripts/baseline-reconciliar-migrations.mjs            -> DRY-RUN (so mostra)
//   node scripts/baseline-reconciliar-migrations.mjs --apply     -> marca como aplicadas
//
// ⚠️ SEMPRE rode primeiro contra um CLONE (ver runbook). O alvo e o DB_* do .env.
// ==========================================
import 'dotenv/config';
import { DataSource } from 'typeorm';
import pg from 'pg';
import { DATABASE_ENTITIES } from '../dist/database/database.entities.js';

const apply = process.argv.includes('--apply');
const host = process.env.DB_HOST;

const ds = new DataSource({
  type: 'postgres',
  host,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  entities: DATABASE_ENTITIES,
  migrations: ['dist/migrations/*.js'],
});

const run = async () => {
  await ds.initialize();
  const codeMigs = ds.migrations.map((m) => {
    const name = m.name || m.constructor.name;
    const ts = Number((String(name).match(/\d+$/) || ['0'])[0]);
    return { name: String(name), timestamp: ts };
  });
  await ds.destroy();

  const c = new pg.Client({
    host,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
  });
  await c.connect();
  const applied = new Set(
    (await c.query('SELECT name FROM public.migrations')).rows.map((r) => r.name),
  );
  const missing = codeMigs.filter((m) => !applied.has(m.name));

  console.log(`\n== Baseline / reconciliacao do ledger ==`);
  console.log(`Banco alvo: ${host}`);
  console.log(`No ledger hoje: ${applied.size} | migrations do codigo: ${codeMigs.length}`);
  console.log(
    `Do codigo, JA no ledger: ${codeMigs.length - missing.length} | FALTAM: ${missing.length}\n`,
  );
  if (missing.length === 0) {
    console.log('✅ Ledger ja coerente com o codigo — nada a fazer.');
    await c.end();
    return;
  }
  console.log('Migrations do codigo AUSENTES do ledger (seriam rodadas por migration:run):');
  missing.forEach((m) => console.log('  - ' + m.name));

  if (!apply) {
    console.log(
      `\n(dry-run) Rode com --apply para MARCAR estas ${missing.length} como aplicadas (adota o schema atual como baseline). Nenhuma DDL e executada.`,
    );
    await c.end();
    return;
  }

  for (const m of missing) {
    await c.query(
      'INSERT INTO public.migrations ("timestamp", "name") VALUES ($1, $2)',
      [m.timestamp, m.name],
    );
  }
  console.log(
    `\n✅ ${missing.length} migration(s) marcada(s) como aplicada(s). Agora \`migration:run\` e no-op; so migrations NOVAS rodarao daqui pra frente.`,
  );
  console.log(
    'Reverter (se preciso): DELETE FROM public.migrations WHERE name IN (...as inseridas...).',
  );
  await c.end();
};

run().catch((e) => {
  console.error('Falha na reconciliacao:', e.message);
  process.exit(1);
});
