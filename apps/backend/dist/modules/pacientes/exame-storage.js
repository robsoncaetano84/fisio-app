"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExameFile = exports.readExameFile = exports.persistExameFile = exports.buildExameObjectKey = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const fs_2 = require("fs");
const LOCAL_UPLOADS_DIR = (0, path_1.join)(process.cwd(), 'uploads', 'paciente-exames');
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
    if (!(0, fs_1.existsSync)(LOCAL_UPLOADS_DIR)) {
        (0, fs_1.mkdirSync)(LOCAL_UPLOADS_DIR, { recursive: true });
    }
};
const parseSupabaseUri = (uri) => {
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
const buildExameObjectKey = (usuarioId, pacienteId, originalName) => {
    const extension = (0, path_1.extname)(originalName || '').toLowerCase() || '.bin';
    const safeExt = extension.replace(/[^a-z0-9.]/g, '') || '.bin';
    const random = Math.random().toString(36).slice(2, 10);
    return `${usuarioId}/${pacienteId}/${Date.now()}-${random}${safeExt}`;
};
exports.buildExameObjectKey = buildExameObjectKey;
const persistExameFile = async (params) => {
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
        if (!response.ok) {
            const payload = await response.text().catch(() => '');
            throw new common_1.BadGatewayException(`Falha ao enviar arquivo para storage: ${response.status} ${payload}`);
        }
        return {
            nomeArquivo: params.objectKey,
            caminhoArquivo: `supabase://${config.bucket}/${params.objectKey}`,
        };
    }
    ensureLocalUploadsDir();
    const localFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${(0, path_1.extname)(params.objectKey) || '.bin'}`;
    const localPath = (0, path_1.join)(LOCAL_UPLOADS_DIR, localFileName);
    await fs_2.promises.writeFile(localPath, params.fileBuffer);
    return {
        nomeArquivo: localFileName,
        caminhoArquivo: localPath,
    };
};
exports.persistExameFile = persistExameFile;
const readExameFile = async (caminhoArquivo) => {
    const supabaseRef = parseSupabaseUri(caminhoArquivo);
    if (!supabaseRef) {
        return fs_2.promises.readFile(caminhoArquivo);
    }
    const config = getSupabaseConfig();
    if (!config) {
        throw new common_1.BadGatewayException('Storage Supabase não configurado para leitura do arquivo.');
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
        throw new common_1.BadGatewayException(`Falha ao baixar arquivo do storage: ${response.status} ${payload}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};
exports.readExameFile = readExameFile;
const deleteExameFile = async (caminhoArquivo) => {
    const supabaseRef = parseSupabaseUri(caminhoArquivo);
    if (!supabaseRef) {
        await fs_2.promises.unlink(caminhoArquivo).catch(() => undefined);
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
exports.deleteExameFile = deleteExameFile;
//# sourceMappingURL=exame-storage.js.map