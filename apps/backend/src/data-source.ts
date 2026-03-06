// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// D AT A S OU RC E
// ==========================================
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const dbSsl = (process.env.DB_SSL || '').trim().toLowerCase() === 'true';
const dbSslRejectUnauthorized =
  (process.env.DB_SSL_REJECT_UNAUTHORIZED || '')
    .trim()
    .toLowerCase() !== 'false';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: dbSsl ? { rejectUnauthorized: dbSslRejectUnauthorized } : false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
