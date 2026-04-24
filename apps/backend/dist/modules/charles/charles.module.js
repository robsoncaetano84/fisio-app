"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharlesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const pacientes_module_1 = require("../pacientes/pacientes.module");
const clinical_governance_module_1 = require("../clinical-governance/clinical-governance.module");
const charles_controller_1 = require("./charles.controller");
const charles_service_1 = require("./charles.service");
let CharlesModule = class CharlesModule {
};
exports.CharlesModule = CharlesModule;
exports.CharlesModule = CharlesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([anamnese_entity_1.Anamnese, evolucao_entity_1.Evolucao, laudo_entity_1.Laudo]),
            pacientes_module_1.PacientesModule,
            clinical_governance_module_1.ClinicalGovernanceModule,
        ],
        controllers: [charles_controller_1.CharlesController],
        providers: [charles_service_1.CharlesService],
        exports: [charles_service_1.CharlesService],
    })
], CharlesModule);
//# sourceMappingURL=charles.module.js.map