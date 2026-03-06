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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushToken = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
const usuario_entity_1 = require("../../usuarios/entities/usuario.entity");
let PushToken = class PushToken extends base_entity_1.BaseEntity {
    usuario;
    usuarioId;
    expoPushToken;
    plataforma;
    appVersion;
    ativo;
    ultimoEnvioEm;
};
exports.PushToken = PushToken;
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], PushToken.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', type: 'uuid' }),
    __metadata("design:type", String)
], PushToken.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expo_push_token', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PushToken.prototype, "expoPushToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plataforma', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], PushToken.prototype, "plataforma", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'app_version', type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], PushToken.prototype, "appVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ativo', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PushToken.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultimo_envio_em', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], PushToken.prototype, "ultimoEnvioEm", void 0);
exports.PushToken = PushToken = __decorate([
    (0, typeorm_1.Entity)('push_tokens'),
    (0, typeorm_1.Index)('UQ_PUSH_TOKENS_EXPO_TOKEN', ['expoPushToken'], { unique: true }),
    (0, typeorm_1.Index)('IDX_PUSH_TOKENS_USUARIO', ['usuarioId'])
], PushToken);
//# sourceMappingURL=push-token.entity.js.map