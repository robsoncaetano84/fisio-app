"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaudosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const laudo_entity_1 = require("./entities/laudo.entity");
const laudo_ai_generation_entity_1 = require("./entities/laudo-ai-generation.entity");
const laudos_service_1 = require("./laudos.service");
const laudos_controller_1 = require("./laudos.controller");
const pacientes_module_1 = require("../pacientes/pacientes.module");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const usuarios_module_1 = require("../usuarios/usuarios.module");
const paciente_exame_entity_1 = require("../pacientes/entities/paciente-exame.entity");
const laudo_exame_historico_entity_1 = require("./entities/laudo-exame-historico.entity");
let LaudosModule = class LaudosModule {
};
exports.LaudosModule = LaudosModule;
exports.LaudosModule = LaudosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                laudo_entity_1.Laudo,
                laudo_ai_generation_entity_1.LaudoAiGeneration,
                anamnese_entity_1.Anamnese,
                evolucao_entity_1.Evolucao,
                paciente_exame_entity_1.PacienteExame,
                laudo_exame_historico_entity_1.LaudoExameHistorico,
            ]),
            pacientes_module_1.PacientesModule,
            usuarios_module_1.UsuariosModule,
        ],
        controllers: [laudos_controller_1.LaudosController],
        providers: [laudos_service_1.LaudosService],
        exports: [laudos_service_1.LaudosService],
    })
], LaudosModule);
//# sourceMappingURL=laudos.module.js.map