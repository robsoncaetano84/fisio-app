"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtividadesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const atividade_entity_1 = require("./entities/atividade.entity");
const atividade_checkin_entity_1 = require("./entities/atividade-checkin.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const atividades_controller_1 = require("./atividades.controller");
const atividades_service_1 = require("./atividades.service");
const notificacoes_module_1 = require("../notificacoes/notificacoes.module");
let AtividadesModule = class AtividadesModule {
};
exports.AtividadesModule = AtividadesModule;
exports.AtividadesModule = AtividadesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([atividade_entity_1.Atividade, atividade_checkin_entity_1.AtividadeCheckin, paciente_entity_1.Paciente, anamnese_entity_1.Anamnese]),
            notificacoes_module_1.NotificacoesModule,
        ],
        controllers: [atividades_controller_1.AtividadesController],
        providers: [atividades_service_1.AtividadesService],
        exports: [atividades_service_1.AtividadesService],
    })
], AtividadesModule);
//# sourceMappingURL=atividades.module.js.map