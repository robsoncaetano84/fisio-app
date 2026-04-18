"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const pacientes_service_1 = require("./pacientes.service");
const create_paciente_dto_1 = require("./dto/create-paciente.dto");
const update_paciente_dto_1 = require("./dto/update-paciente.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const usuario_entity_2 = require("../usuarios/entities/usuario.entity");
const create_paciente_exame_dto_1 = require("./dto/create-paciente-exame.dto");
const exame_storage_1 = require("./exame-storage");
const MAX_EXAME_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp',
    'application/octet-stream',
]);
const ALLOWED_EXTENSIONS = new Set([
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.heic',
    '.heif',
]);
const MIME_BY_EXTENSION = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
};
let PacientesController = class PacientesController {
    pacientesService;
    constructor(pacientesService) {
        this.pacientesService = pacientesService;
    }
    toExameResponse(pacienteId, exame) {
        return {
            id: exame.id,
            pacienteId: exame.pacienteId,
            nomeOriginal: exame.nomeOriginal,
            mimeType: exame.mimeType,
            tamanhoBytes: exame.tamanhoBytes,
            tipoExame: exame.tipoExame,
            observacao: exame.observacao,
            dataExame: exame.dataExame,
            createdAt: exame.createdAt,
            updatedAt: exame.updatedAt,
            downloadUrl: `/api/pacientes/${pacienteId}/exames/${exame.id}/arquivo`,
        };
    }
    create(createPacienteDto, usuario) {
        return this.pacientesService.create(createPacienteDto, usuario.id);
    }
    findAll(usuario) {
        return this.pacientesService.findAll(usuario.id);
    }
    findPaged(usuario, page, limit) {
        return this.pacientesService.findPaged(usuario.id, page, limit);
    }
    getAttention(usuario) {
        return this.pacientesService.getAttentionMap(usuario.id);
    }
    getStats(usuario) {
        return this.pacientesService.getStats(usuario.id);
    }
    getMyPacienteProfile(usuario) {
        return this.pacientesService.getMyPacienteProfile(usuario);
    }
    unlinkMyProfessional(usuario) {
        return this.pacientesService.unlinkMyProfessional(usuario);
    }
    async listExames(id, usuario) {
        const exames = await this.pacientesService.listExames(id, usuario.id);
        return exames.map((item) => this.toExameResponse(id, item));
    }
    async uploadExame(id, file, body, usuario) {
        if (!file) {
            throw new common_1.BadRequestException('Arquivo obrigatorio');
        }
        const detectedExtension = (0, path_1.extname)(file.originalname || '').toLowerCase();
        const safeMimeType = ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())
            ? file.mimetype
            : (MIME_BY_EXTENSION[detectedExtension] || 'application/octet-stream');
        const objectKey = (0, exame_storage_1.buildExameObjectKey)(usuario.id, id, file.originalname || 'arquivo');
        const persisted = await (0, exame_storage_1.persistExameFile)({
            usuarioId: usuario.id,
            pacienteId: id,
            objectKey,
            mimeType: safeMimeType,
            fileBuffer: file.buffer,
        });
        try {
            const exame = await this.pacientesService.createExame(id, usuario.id, {
                nomeOriginal: file.originalname,
                nomeArquivo: persisted.nomeArquivo,
                mimeType: safeMimeType,
                tamanhoBytes: file.size,
                caminhoArquivo: persisted.caminhoArquivo,
                tipoExame: body.tipoExame,
                observacao: body.observacao,
                dataExame: body.dataExame ? new Date(body.dataExame) : null,
            });
            return this.toExameResponse(id, exame);
        }
        catch (error) {
            await (0, exame_storage_1.deleteExameFile)(persisted.caminhoArquivo).catch(() => undefined);
            throw error;
        }
    }
    async downloadExame(id, exameId, usuario, res) {
        const exame = await this.pacientesService.findExameOrFail(id, exameId, usuario.id);
        res.setHeader('Content-Type', exame.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${exame.nomeOriginal}"`);
        const fileBuffer = await (0, exame_storage_1.readExameFile)(exame.caminhoArquivo);
        return res.send(fileBuffer);
    }
    async deleteExame(id, exameId, usuario) {
        const exame = await this.pacientesService.removeExame(id, exameId, usuario.id);
        await (0, exame_storage_1.deleteExameFile)(exame.caminhoArquivo).catch(() => undefined);
        return { success: true };
    }
    findOne(id, usuario) {
        return this.pacientesService.findOne(id, usuario.id);
    }
    update(id, updatePacienteDto, usuario) {
        return this.pacientesService.update(id, updatePacienteDto, usuario.id);
    }
    unlinkPacienteUsuario(id, usuario) {
        return this.pacientesService.unlinkPacienteUsuarioByProfessional(id, usuario.id);
    }
    remove(id, usuario) {
        return this.pacientesService.remove(id, usuario.id);
    }
};
exports.PacientesController = PacientesController;
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_paciente_dto_1.CreatePacienteDto,
        usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('paged'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(30), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario, Number, Number]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "findPaged", null);
__decorate([
    (0, common_1.Get)('attention'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "getAttention", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "getMyPacienteProfile", null);
__decorate([
    (0, common_1.Post)('me/desvincular-profissional'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 10 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.PACIENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "unlinkMyProfessional", null);
__decorate([
    (0, common_1.Get)(':id/exames'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "listExames", null);
__decorate([
    (0, common_1.Post)(':id/exames'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_EXAME_SIZE_BYTES },
        fileFilter: (_req, file, cb) => {
            const mimeType = String(file.mimetype || '').toLowerCase();
            const extension = (0, path_1.extname)(file.originalname || '').toLowerCase();
            const isMimeAllowed = ALLOWED_MIME_TYPES.has(mimeType);
            const isExtensionAllowed = ALLOWED_EXTENSIONS.has(extension);
            if (!isMimeAllowed && !isExtensionAllowed) {
                return cb(new common_1.BadRequestException('Tipo de arquivo nao suportado'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_paciente_exame_dto_1.CreatePacienteExameDto,
        usuario_entity_2.Usuario]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "uploadExame", null);
__decorate([
    (0, common_1.Get)(':id/exames/:exameId/arquivo'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('exameId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, usuario_entity_2.Usuario, Object]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "downloadExame", null);
__decorate([
    (0, common_1.Delete)(':id/exames/:exameId'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('exameId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", Promise)
], PacientesController.prototype, "deleteExame", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 120 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 30 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_paciente_dto_1.UpdatePacienteDto,
        usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/desvincular-acesso'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 10 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "unlinkPacienteUsuario", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, throttler_1.Throttle)({ default: { ttl: 60, limit: 20 } }),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN, usuario_entity_1.UserRole.USER),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, usuario_entity_2.Usuario]),
    __metadata("design:returntype", void 0)
], PacientesController.prototype, "remove", null);
exports.PacientesController = PacientesController = __decorate([
    (0, common_1.Controller)('pacientes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [pacientes_service_1.PacientesService])
], PacientesController);
//# sourceMappingURL=pacientes.controller.js.map