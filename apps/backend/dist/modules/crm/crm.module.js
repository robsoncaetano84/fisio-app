"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crm_controller_1 = require("./crm.controller");
const crm_service_1 = require("./crm.service");
const crm_lead_entity_1 = require("./entities/crm-lead.entity");
const crm_interaction_entity_1 = require("./entities/crm-interaction.entity");
const crm_task_entity_1 = require("./entities/crm-task.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const atividade_entity_1 = require("../atividades/entities/atividade.entity");
const atividade_checkin_entity_1 = require("../atividades/entities/atividade-checkin.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const clinical_flow_event_entity_1 = require("../metrics/entities/clinical-flow-event.entity");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                crm_lead_entity_1.CrmLead,
                crm_task_entity_1.CrmTask,
                crm_interaction_entity_1.CrmInteraction,
                paciente_entity_1.Paciente,
                usuario_entity_1.Usuario,
                anamnese_entity_1.Anamnese,
                evolucao_entity_1.Evolucao,
                atividade_entity_1.Atividade,
                atividade_checkin_entity_1.AtividadeCheckin,
                laudo_entity_1.Laudo,
                clinical_flow_event_entity_1.ClinicalFlowEvent,
            ]),
        ],
        controllers: [crm_controller_1.CrmController],
        providers: [crm_service_1.CrmService],
        exports: [crm_service_1.CrmService],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map