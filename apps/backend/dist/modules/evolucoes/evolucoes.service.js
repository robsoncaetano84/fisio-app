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
exports.EvolucoesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evolucao_entity_1 = require("./entities/evolucao.entity");
const pacientes_service_1 = require("../pacientes/pacientes.service");
let EvolucoesService = class EvolucoesService {
    evolucaoRepository;
    pacientesService;
    constructor(evolucaoRepository, pacientesService) {
        this.evolucaoRepository = evolucaoRepository;
        this.pacientesService = pacientesService;
    }
    async create(createEvolucaoDto, usuarioId) {
        await this.pacientesService.findOne(createEvolucaoDto.pacienteId, usuarioId);
        const evolucao = this.evolucaoRepository.create({
            ...createEvolucaoDto,
            data: createEvolucaoDto.data
                ? new Date(createEvolucaoDto.data)
                : new Date(),
        });
        return this.evolucaoRepository.save(evolucao);
    }
    async findAllByPaciente(pacienteId, usuarioId) {
        await this.pacientesService.findOne(pacienteId, usuarioId);
        return this.evolucaoRepository.find({
            where: { pacienteId },
            order: { data: 'DESC' },
        });
    }
    async findOne(id, usuarioId) {
        const evolucao = await this.evolucaoRepository.findOne({
            where: { id },
            relations: ['paciente'],
        });
        if (!evolucao) {
            throw new common_1.NotFoundException('Evolucao nao encontrada');
        }
        if (evolucao.paciente.usuarioId !== usuarioId) {
            throw new common_1.NotFoundException('Evolucao nao encontrada');
        }
        return evolucao;
    }
    async update(id, updateEvolucaoDto, usuarioId) {
        const evolucao = await this.findOne(id, usuarioId);
        Object.assign(evolucao, updateEvolucaoDto);
        return this.evolucaoRepository.save(evolucao);
    }
    async remove(id, usuarioId) {
        const evolucao = await this.findOne(id, usuarioId);
        await this.evolucaoRepository.remove(evolucao);
    }
};
exports.EvolucoesService = EvolucoesService;
exports.EvolucoesService = EvolucoesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evolucao_entity_1.Evolucao)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        pacientes_service_1.PacientesService])
], EvolucoesService);
//# sourceMappingURL=evolucoes.service.js.map