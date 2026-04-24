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
    normalizeFields(payload) {
        return {
            subjetivo: payload.subjetivo ?? payload.listagens ?? null,
            objetivo: payload.objetivo ?? payload.legCheck ?? null,
            avaliacao: payload.avaliacao ?? payload.ajustes ?? null,
            plano: payload.plano ?? payload.orientacoes ?? null,
        };
    }
    async create(createEvolucaoDto, usuarioId) {
        await this.pacientesService.findOne(createEvolucaoDto.pacienteId, usuarioId);
        const evolucao = this.evolucaoRepository.create({
            pacienteId: createEvolucaoDto.pacienteId,
            data: createEvolucaoDto.data
                ? new Date(createEvolucaoDto.data)
                : new Date(),
            ...this.normalizeFields(createEvolucaoDto),
            checkinDor: createEvolucaoDto.checkinDor,
            checkinDificuldade: createEvolucaoDto.checkinDificuldade,
            checkinObservacao: createEvolucaoDto.checkinObservacao,
            dorStatus: createEvolucaoDto.dorStatus,
            funcaoStatus: createEvolucaoDto.funcaoStatus,
            adesaoStatus: createEvolucaoDto.adesaoStatus,
            statusEvolucao: createEvolucaoDto.statusEvolucao,
            condutaStatus: createEvolucaoDto.condutaStatus,
            observacoes: createEvolucaoDto.observacoes,
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
        const isMasterAdmin = await this.pacientesService.isMasterAdminByUsuarioId(usuarioId);
        if (!isMasterAdmin && evolucao.paciente.usuarioId !== usuarioId) {
            throw new common_1.NotFoundException('Evolucao nao encontrada');
        }
        return evolucao;
    }
    async update(id, updateEvolucaoDto, usuarioId) {
        const evolucao = await this.findOne(id, usuarioId);
        if (updateEvolucaoDto.data) {
            evolucao.data = new Date(updateEvolucaoDto.data);
        }
        const normalized = this.normalizeFields(updateEvolucaoDto);
        if (normalized.subjetivo !== null)
            evolucao.subjetivo = normalized.subjetivo;
        if (normalized.objetivo !== null)
            evolucao.objetivo = normalized.objetivo;
        if (normalized.avaliacao !== null)
            evolucao.avaliacao = normalized.avaliacao;
        if (normalized.plano !== null)
            evolucao.plano = normalized.plano;
        Object.assign(evolucao, {
            checkinDor: updateEvolucaoDto.checkinDor ?? evolucao.checkinDor,
            checkinDificuldade: updateEvolucaoDto.checkinDificuldade ?? evolucao.checkinDificuldade,
            checkinObservacao: updateEvolucaoDto.checkinObservacao ?? evolucao.checkinObservacao,
            dorStatus: updateEvolucaoDto.dorStatus ?? evolucao.dorStatus,
            funcaoStatus: updateEvolucaoDto.funcaoStatus ?? evolucao.funcaoStatus,
            adesaoStatus: updateEvolucaoDto.adesaoStatus ?? evolucao.adesaoStatus,
            statusEvolucao: updateEvolucaoDto.statusEvolucao ?? evolucao.statusEvolucao,
            condutaStatus: updateEvolucaoDto.condutaStatus ?? evolucao.condutaStatus,
            observacoes: updateEvolucaoDto.observacoes ?? evolucao.observacoes,
        });
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