"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const dbSsl = (process.env.DB_SSL || '').trim().toLowerCase() === 'true';
const dbSslRejectUnauthorized = (process.env.DB_SSL_REJECT_UNAUTHORIZED || '')
    .trim()
    .toLowerCase() !== 'false';
exports.default = new typeorm_1.DataSource({
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
//# sourceMappingURL=data-source.js.map