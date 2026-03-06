"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const sentry_1 = require("./common/observability/sentry");
function parseBooleanEnv(value, defaultValue = false) {
    if (!value)
        return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
async function bootstrap() {
    const bootstrapLogger = new common_1.Logger('Bootstrap');
    (0, sentry_1.initSentry)();
    const httpsKeyPath = process.env.HTTPS_KEY_PATH;
    const httpsCertPath = process.env.HTTPS_CERT_PATH;
    const isProd = process.env.NODE_ENV === 'production';
    const trustProxy = parseBooleanEnv(process.env.TRUST_PROXY, isProd);
    const httpsOptions = httpsKeyPath && httpsCertPath
        ? {
            key: fs.readFileSync(httpsKeyPath),
            cert: fs.readFileSync(httpsCertPath),
        }
        : undefined;
    if (isProd && !httpsOptions && !trustProxy) {
        throw new Error('HTTPS obrigatorio em producao. Configure HTTPS_KEY_PATH/HTTPS_CERT_PATH ou TRUST_PROXY=true (proxy HTTPS).');
    }
    const app = httpsOptions
        ? await core_1.NestFactory.create(app_module_1.AppModule, { httpsOptions })
        : await core_1.NestFactory.create(app_module_1.AppModule);
    if (trustProxy) {
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.set('trust proxy', 1);
    }
    const corsOrigins = process.env.CORS_ORIGIN?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const allowAllCors = !isProd && (!corsOrigins || corsOrigins.length === 0);
    if (isProd && (!corsOrigins || corsOrigins.length === 0)) {
        throw new Error('CORS_ORIGIN obrigatorio em producao');
    }
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"],
                imgSrc: ["'self'", 'data:'],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    }));
    app.use((req, res, next) => {
        const startedAt = Date.now();
        const requestId = req.headers['x-request-id']?.trim() ||
            (0, crypto_1.randomUUID)();
        req.requestId = requestId;
        res.setHeader('X-Request-Id', requestId);
        res.on('finish', () => {
            const durationMs = Date.now() - startedAt;
            const path = req.originalUrl || req.url;
            const message = `${req.method} ${path} -> ${res.statusCode} ${durationMs}ms (requestId=${requestId})`;
            if (res.statusCode >= 500) {
                bootstrapLogger.error(message);
                return;
            }
            if (res.statusCode >= 400) {
                bootstrapLogger.warn(message);
                return;
            }
            bootstrapLogger.log(message);
        });
        next();
    });
    app.enableCors({
        origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : allowAllCors,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map