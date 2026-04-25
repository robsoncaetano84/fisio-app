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
exports.AnamnesesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const anamnese_entity_1 = require("./entities/anamnese.entity");
const anamnese_historico_entity_1 = require("./entities/anamnese-historico.entity");
const pacientes_service_1 = require("../pacientes/pacientes.service");
let AnamnesesService = class AnamnesesService {
    anamneseRepository;
    anamneseHistoricoRepository;
    pacientesService;
    constructor(anamneseRepository, anamneseHistoricoRepository, pacientesService) {
        this.anamneseRepository = anamneseRepository;
        this.anamneseHistoricoRepository = anamneseHistoricoRepository;
        this.pacientesService = pacientesService;
    }
    async create(createAnamneseDto, usuarioId) {
        await this.pacientesService.findOne(createAnamneseDto.pacienteId, usuarioId);
        this.validateClinicalMinimum(createAnamneseDto);
        const anamnese = this.anamneseRepository.create(createAnamneseDto);
        const saved = await this.anamneseRepository.save(anamnese);
        await this.registrarHistorico(saved, usuarioId, anamnese_historico_entity_1.AnamneseHistoricoAcao.CREATE, anamnese_historico_entity_1.AnamneseHistoricoOrigem.PROFISSIONAL);
        return saved;
    }
    async createForPacienteUsuario(createAnamneseDto, usuarioId) {
        const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(usuarioId);
        this.validateClinicalMinimum(createAnamneseDto);
        const anamnese = this.anamneseRepository.create({
            ...createAnamneseDto,
            pacienteId: paciente.id,
        });
        const saved = await this.anamneseRepository.save(anamnese);
        await this.registrarHistorico(saved, usuarioId, anamnese_historico_entity_1.AnamneseHistoricoAcao.CREATE, anamnese_historico_entity_1.AnamneseHistoricoOrigem.PACIENTE);
        return saved;
    }
    async findAllByPaciente(pacienteId, usuarioId) {
        await this.pacientesService.findOne(pacienteId, usuarioId);
        return this.anamneseRepository.find({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
    }
    async findLatestByPacienteUsuario(usuarioId) {
        const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(usuarioId);
        return this.anamneseRepository.findOne({
            where: { pacienteId: paciente.id },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, usuarioId) {
        const anamnese = await this.anamneseRepository.findOne({
            where: { id },
            relations: ['paciente'],
        });
        if (!anamnese) {
            throw new common_1.NotFoundException('Anamnese não encontrada');
        }
        const isMasterAdmin = await this.pacientesService.isMasterAdminByUsuarioId(usuarioId);
        if (!isMasterAdmin && anamnese.paciente.usuarioId !== usuarioId) {
            throw new common_1.NotFoundException('Anamnese não encontrada');
        }
        return anamnese;
    }
    async findOneByPacienteUsuario(id, usuarioId) {
        const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(usuarioId);
        const anamnese = await this.anamneseRepository.findOne({
            where: { id, pacienteId: paciente.id },
        });
        if (!anamnese) {
            throw new common_1.NotFoundException('Anamnese não encontrada');
        }
        return anamnese;
    }
    async update(id, updateAnamneseDto, usuarioId) {
        void updateAnamneseDto;
        await this.findOne(id, usuarioId);
        throw new common_1.BadRequestException('Anamnese finalizada nao pode ser editada. Registre uma nova anamnese para nova coleta clinica.');
    }
    async updateByPacienteUsuario(id, updateAnamneseDto, usuarioId) {
        void updateAnamneseDto;
        await this.findOneByPacienteUsuario(id, usuarioId);
        throw new common_1.BadRequestException('Anamnese finalizada nao pode ser editada. Registre uma nova anamnese para nova coleta clinica.');
    }
    async findHistoryByAnamnese(anamneseId, usuarioId, limit = 20) {
        await this.findOne(anamneseId, usuarioId);
        const normalizedLimit = this.normalizeLimit(limit, 20, 100);
        return this.anamneseHistoricoRepository.find({
            where: { anamneseId },
            order: { revisao: 'DESC' },
            take: normalizedLimit,
        });
    }
    async findHistoryByPaciente(pacienteId, usuarioId, limit = 50) {
        await this.pacientesService.findOne(pacienteId, usuarioId);
        const normalizedLimit = this.normalizeLimit(limit, 50, 200);
        return this.anamneseHistoricoRepository.find({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
            take: normalizedLimit,
        });
    }
    async findHistoryByPacienteUsuario(usuarioId, limit = 50) {
        const paciente = await this.pacientesService.findOrCreateSelfPacienteForUsuario(usuarioId);
        const normalizedLimit = this.normalizeLimit(limit, 50, 200);
        return this.anamneseHistoricoRepository.find({
            where: { pacienteId: paciente.id },
            order: { createdAt: 'DESC' },
            take: normalizedLimit,
        });
    }
    async remove(id, usuarioId) {
        const anamnese = await this.findOne(id, usuarioId);
        await this.anamneseRepository.remove(anamnese);
    }
    validateClinicalMinimum(payload) {
        if (payload.motivoBusca !== anamnese_entity_1.MotivoBusca.SINTOMA_EXISTENTE)
            return;
        const missing = [];
        if (!payload.inicioProblema)
            missing.push('inicioProblema');
        if (!payload.mecanismoLesao)
            missing.push('mecanismoLesao');
        if (!String(payload.fatorAlivio || '').trim())
            missing.push('fatorAlivio');
        if (!String(payload.fatoresPiora || '').trim())
            missing.push('fatoresPiora');
        if (missing.length > 0) {
            throw new common_1.BadRequestException(`Campos obrigatorios ausentes para motivo SINTOMA_EXISTENTE: ${missing.join(', ')}`);
        }
    }
    async registrarHistorico(anamnese, usuarioId, acao, origem) {
        const ultimo = await this.anamneseHistoricoRepository.findOne({
            where: { anamneseId: anamnese.id },
            order: { revisao: 'DESC' },
            select: ['id', 'revisao'],
        });
        const payload = this.buildSnapshotPayload(anamnese);
        const historico = this.anamneseHistoricoRepository.create({
            anamneseId: anamnese.id,
            pacienteId: anamnese.pacienteId,
            revisao: (ultimo?.revisao || 0) + 1,
            acao,
            origem,
            alteradoPorUsuarioId: usuarioId || null,
            payload,
        });
        await this.anamneseHistoricoRepository.save(historico);
    }
    buildSnapshotPayload(anamnese) {
        const { id, pacienteId, createdAt, updatedAt, ...campos } = anamnese;
        return {
            anamneseId: id,
            pacienteId,
            createdAt,
            updatedAt,
            campos,
        };
    }
    normalizeLimit(value, fallback, max) {
        if (!Number.isFinite(value))
            return fallback;
        const integer = Math.floor(value);
        if (integer < 1)
            return 1;
        if (integer > max)
            return max;
        return integer;
    }
};
exports.AnamnesesService = AnamnesesService;
exports.AnamnesesService = AnamnesesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(anamnese_entity_1.Anamnese)),
    __param(1, (0, typeorm_1.InjectRepository)(anamnese_historico_entity_1.AnamneseHistorico)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        pacientes_service_1.PacientesService])
], AnamnesesService);
//# sourceMappingURL=anamneses.service.js.map