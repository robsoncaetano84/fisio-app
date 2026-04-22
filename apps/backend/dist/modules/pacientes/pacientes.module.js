"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const paciente_entity_1 = require("./entities/paciente.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const paciente_exame_entity_1 = require("./entities/paciente-exame.entity");
const profissional_paciente_vinculo_entity_1 = require("./entities/profissional-paciente-vinculo.entity");
const atividade_entity_1 = require("../atividades/entities/atividade.entity");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const pacientes_service_1 = require("./pacientes.service");
const pacientes_controller_1 = require("./pacientes.controller");
let PacientesModule = class PacientesModule {
};
exports.PacientesModule = PacientesModule;
exports.PacientesModule = PacientesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                paciente_entity_1.Paciente,
                evolucao_entity_1.Evolucao,
                laudo_entity_1.Laudo,
                usuario_entity_1.Usuario,
                paciente_exame_entity_1.PacienteExame,
                profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo,
                atividade_entity_1.Atividade,
                anamnese_entity_1.Anamnese,
            ]),
        ],
        controllers: [pacientes_controller_1.PacientesController],
        providers: [pacientes_service_1.PacientesService],
        exports: [pacientes_service_1.PacientesService],
    })
], PacientesModule);
//# sourceMappingURL=pacientes.module.js.map