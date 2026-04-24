"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnamnesesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const anamnese_entity_1 = require("./entities/anamnese.entity");
const anamnese_historico_entity_1 = require("./entities/anamnese-historico.entity");
const anamneses_service_1 = require("./anamneses.service");
const anamneses_controller_1 = require("./anamneses.controller");
const pacientes_module_1 = require("../pacientes/pacientes.module");
let AnamnesesModule = class AnamnesesModule {
};
exports.AnamnesesModule = AnamnesesModule;
exports.AnamnesesModule = AnamnesesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([anamnese_entity_1.Anamnese, anamnese_historico_entity_1.AnamneseHistorico]), pacientes_module_1.PacientesModule],
        controllers: [anamneses_controller_1.AnamnesesController],
        providers: [anamneses_service_1.AnamnesesService],
        exports: [anamneses_service_1.AnamnesesService],
    })
], AnamnesesModule);
//# sourceMappingURL=anamneses.module.js.map