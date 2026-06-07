// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// D AT A S OU RC E
// ==========================================
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const dbSsl = (process.env.DB_SSL || '').trim().toLowerCase() === 'true';
const dbSslRejectUnauthorized =
  (process.env.DB_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase() !==
  'false';

const getNumberEnv = (key: string, fallback: number): number => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) ? value : fallback;
};

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: dbSsl ? { rejectUnauthorized: dbSslRejectUnauthorized } : false,
  extra: {
    max: getNumberEnv('DB_POOL_MAX', 5),
    min: getNumberEnv('DB_POOL_MIN', 0),
    idleTimeoutMillis: getNumberEnv('DB_POOL_IDLE_TIMEOUT_MS', 10000),
    connectionTimeoutMillis: getNumberEnv(
      'DB_POOL_CONNECTION_TIMEOUT_MS',
      10000,
    ),
    statement_timeout: getNumberEnv('DB_STATEMENT_TIMEOUT_MS', 30000),
    query_timeout: getNumberEnv('DB_STATEMENT_TIMEOUT_MS', 30000),
  },
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
