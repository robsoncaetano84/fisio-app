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
var NotificacoesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacoesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const push_token_entity_1 = require("./entities/push-token.entity");
let NotificacoesService = NotificacoesService_1 = class NotificacoesService {
    pushTokenRepository;
    logger = new common_1.Logger(NotificacoesService_1.name);
    constructor(pushTokenRepository) {
        this.pushTokenRepository = pushTokenRepository;
    }
    async registerToken(usuarioId, dto) {
        const token = dto.expoPushToken.trim();
        const existing = await this.pushTokenRepository.findOne({
            where: { expoPushToken: token },
        });
        if (existing) {
            existing.usuarioId = usuarioId;
            existing.ativo = true;
            existing.plataforma = dto.plataforma?.trim() || null;
            existing.appVersion = dto.appVersion?.trim() || null;
            return this.pushTokenRepository.save(existing);
        }
        const created = this.pushTokenRepository.create({
            usuarioId,
            expoPushToken: token,
            plataforma: dto.plataforma?.trim() || null,
            appVersion: dto.appVersion?.trim() || null,
            ativo: true,
            ultimoEnvioEm: null,
        });
        return this.pushTokenRepository.save(created);
    }
    async removeToken(usuarioId, expoPushToken) {
        await this.pushTokenRepository.update({ usuarioId, expoPushToken: expoPushToken.trim() }, { ativo: false });
    }
    async sendToUsuario(usuarioId, payload) {
        const tokens = await this.pushTokenRepository.find({
            where: { usuarioId, ativo: true },
            order: { updatedAt: 'DESC' },
            take: 10,
        });
        if (!tokens.length) {
            return;
        }
        const messages = tokens.map((token) => ({
            to: token.expoPushToken,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
        }));
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        const expoAccessToken = (process.env.EXPO_ACCESS_TOKEN || '').trim();
        if (expoAccessToken) {
            headers.Authorization = `Bearer ${expoAccessToken}`;
        }
        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers,
                body: JSON.stringify(messages),
            });
            if (!response.ok) {
                const responseText = await response.text();
                this.logger.warn(`Falha ao enviar push (${response.status}): ${responseText || 'sem corpo'}`);
                return;
            }
            const responseJson = (await response.json());
            const invalidTokens = tokens
                .filter((_, index) => responseJson.data?.[index]?.details?.error ===
                'DeviceNotRegistered')
                .map((item) => item.expoPushToken);
            if (invalidTokens.length) {
                await this.pushTokenRepository.update({ expoPushToken: (0, typeorm_2.In)(invalidTokens) }, { ativo: false });
            }
            await this.pushTokenRepository.update({ id: (0, typeorm_2.In)(tokens.map((token) => token.id)) }, { ultimoEnvioEm: new Date() });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'erro desconhecido';
            this.logger.warn(`Falha de rede ao enviar push: ${message}`);
        }
    }
};
exports.NotificacoesService = NotificacoesService;
exports.NotificacoesService = NotificacoesService = NotificacoesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(push_token_entity_1.PushToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificacoesService);
//# sourceMappingURL=notificacoes.service.js.map