// ==========================================
// Gate de drift ADITIVO
// Compara as entidades do codigo (DATABASE_ENTITIES) com o schema REAL do banco
// e reporta SO o que o codigo precisa e o banco NAO tem (tabelas/colunas novas).
// NUNCA sugere DROP/ALTER — a auditoria provou que o synchronize dropava 17
// colunas + FKs. Use antes de deployar / como gate de CI.
//
// Requer o build (dist) atualizado: rode `npm run build` antes.
// Uso (de apps/backend):
//   node scripts/checar-schema-aditivo.mjs         -> reporta; exit 1 se faltar tabela/coluna
//   node scripts/checar-schema-aditivo.mjs --sql    -> tambem imprime o SQL idempotente do que falta
// ==========================================
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from '../dist/database/database.entities.js';

const emitSql = process.argv.includes('--sql');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  entities: DATABASE_ENTITIES,
  synchronize: false,
});

// Torna o SQL aditivo idempotente (seguro para rodar mais de uma vez).
const toIdempotent = (sql) =>
  sql
    .replace(/^CREATE TABLE (?!IF NOT EXISTS)/i, 'CREATE TABLE IF NOT EXISTS ')
    .replace(
      / ADD (?!COLUMN|CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK)/i,
      ' ADD COLUMN IF NOT EXISTS ',
    )
    .replace(
      /^CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/i,
      (_m, u) => `CREATE ${u || ''}INDEX IF NOT EXISTS `,
    );

const run = async () => {
  await ds.initialize();
  const mem = await ds.driver.createSchemaBuilder().log();
  const queries = mem.upQueries.map((q) => q.query);

  const isCreateTable = (s) => /^CREATE TABLE /i.test(s);
  const isAddColumn = (s) =>
    /ALTER TABLE .* ADD (?!CONSTRAINT|PRIMARY|UNIQUE|FOREIGN|CHECK)/i.test(s);
  const isUniqueIndex = (s) => /^CREATE UNIQUE INDEX /i.test(s);
  const isPlainIndex = (s) => /^CREATE INDEX /i.test(s);

  // Criticos: sem isto o codigo quebra (ex.: coluna token_version faltando -> 500 no login).
  const criticos = queries.filter((s) => isCreateTable(s) || isAddColumn(s));
  const indicesUnique = queries.filter(isUniqueIndex); // revisar (pode falhar em duplicatas)
  const indicesPlain = queries.filter(isPlainIndex); // so performance
  const destrutivos = queries.filter(
    (s) =>
      !isCreateTable(s) &&
      !isAddColumn(s) &&
      !isUniqueIndex(s) &&
      !isPlainIndex(s),
  );

  console.log(`\n== Gate de drift aditivo (banco: ${process.env.DB_HOST}) ==\n`);

  if (criticos.length === 0) {
    console.log(
      '✅ Nada aditivo faltando — o codigo nao precisa de tabela/coluna nova. Seguro para deploy.',
    );
  } else {
    console.log(
      `❌ FALTAM ${criticos.length} item(ns) que o codigo PRECISA (quebra sem isto):`,
    );
    criticos.forEach((s) => console.log('   - ' + s));
  }

  if (indicesPlain.length) {
    console.log(
      `\nℹ️  ${indicesPlain.length} indice(s) que o codigo espera (nao quebram, so performance).`,
    );
  }
  if (indicesUnique.length) {
    console.log(
      `\n⚠️  ${indicesUnique.length} indice(s) UNIQUE para REVISAR (podem falhar em duplicatas / mudam comportamento):`,
    );
    indicesUnique.forEach((s) => console.log('   - ' + s));
  }
  console.log(
    `\n🚫 ${destrutivos.length} mudanca(s) destrutiva(s)/risco que o synchronize faria — IGNORADAS de proposito (nunca aplique via sync).`,
  );

  if (emitSql && (criticos.length || indicesPlain.length)) {
    console.log('\n-- SQL idempotente (aditivo seguro) --');
    [...criticos, ...indicesPlain].forEach((s) =>
      console.log(toIdempotent(s) + ';'),
    );
  }

  await ds.destroy();
  // exit 1 quando falta algo critico (falha o CI / bloqueia deploy)
  process.exit(criticos.length ? 1 : 0);
};

run().catch((e) => {
  console.error('Falha na checagem de schema:', e.message);
  process.exit(2);
});
