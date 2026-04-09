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
exports.PacientesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs_1 = require("fs");
const paciente_entity_1 = require("./entities/paciente.entity");
const paciente_exame_entity_1 = require("./entities/paciente-exame.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
let PacientesService = class PacientesService {
    pacienteRepository;
    evolucaoRepository;
    laudoRepository;
    usuarioRepository;
    pacienteExameRepository;
    constructor(pacienteRepository, evolucaoRepository, laudoRepository, usuarioRepository, pacienteExameRepository) {
        this.pacienteRepository = pacienteRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.laudoRepository = laudoRepository;
        this.usuarioRepository = usuarioRepository;
        this.pacienteExameRepository = pacienteExameRepository;
    }
    resolveInitialVinculoStatus(pacienteUsuarioId, cadastroOrigem) {
        if (pacienteUsuarioId) {
            if (cadastroOrigem === paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO) {
                return paciente_entity_1.PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO;
            }
            return paciente_entity_1.PacienteVinculoStatus.VINCULADO;
        }
        return paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
    }
    async validatePacienteUsuarioId(pacienteUsuarioId, ignorePacienteId) {
        if (!pacienteUsuarioId) {
            return null;
        }
        const usuarioPaciente = await this.usuarioRepository.findOne({
            where: { id: pacienteUsuarioId, ativo: true },
        });
        if (!usuarioPaciente) {
            throw new common_1.NotFoundException('Usuario do paciente nao encontrado');
        }
        if (usuarioPaciente.role !== usuario_entity_1.UserRole.PACIENTE) {
            throw new common_1.ConflictException('Usuario informado nao possui perfil PACIENTE');
        }
        const existingLink = await this.pacienteRepository.findOne({
            where: { pacienteUsuarioId },
        });
        if (existingLink && existingLink.id !== ignorePacienteId) {
            throw new common_1.ConflictException('Este usuario paciente ja esta vinculado');
        }
        return pacienteUsuarioId;
    }
    async create(createPacienteDto, usuarioId) {
        const existingPaciente = await this.pacienteRepository.findOne({
            where: { cpf: createPacienteDto.cpf },
        });
        if (existingPaciente) {
            throw new common_1.ConflictException('CPF ja cadastrado');
        }
        const pacienteUsuarioId = await this.validatePacienteUsuarioId(createPacienteDto.pacienteUsuarioId);
        const cadastroOrigem = createPacienteDto.cadastroOrigem || paciente_entity_1.PacienteCadastroOrigem.CADASTRO_ASSISTIDO;
        const paciente = this.pacienteRepository.create({
            ...createPacienteDto,
            cadastroOrigem,
            vinculoStatus: this.resolveInitialVinculoStatus(pacienteUsuarioId, cadastroOrigem),
            conviteEnviadoEm: null,
            conviteAceitoEm: pacienteUsuarioId ? new Date() : null,
            usuarioId,
            pacienteUsuarioId,
        });
        return this.pacienteRepository.save(paciente);
    }
    async findAll(usuarioId) {
        return this.pacienteRepository.find({
            where: { usuarioId, ativo: true },
            order: { nomeCompleto: 'ASC' },
        });
    }
    async findPaged(usuarioId, page, limit) {
        const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
        const safeLimit = Number.isFinite(limit)
            ? Math.min(100, Math.max(10, limit))
            : 30;
        const skip = (safePage - 1) * safeLimit;
        const [data, total] = await this.pacienteRepository.findAndCount({
            where: { usuarioId, ativo: true },
            order: { nomeCompleto: 'ASC' },
            take: safeLimit,
            skip,
        });
        return {
            data,
            total,
            page: safePage,
            limit: safeLimit,
            hasNext: skip + data.length < total,
        };
    }
    async findOne(id, usuarioId) {
        const paciente = await this.pacienteRepository.findOne({
            where: { id, usuarioId },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente nao encontrado');
        }
        return paciente;
    }
    async update(id, updatePacienteDto, usuarioId) {
        const paciente = await this.findOne(id, usuarioId);
        if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
            const existingPaciente = await this.pacienteRepository.findOne({
                where: { cpf: updatePacienteDto.cpf },
            });
            if (existingPaciente) {
                throw new common_1.ConflictException('CPF ja cadastrado');
            }
        }
        if (Object.prototype.hasOwnProperty.call(updatePacienteDto, 'pacienteUsuarioId')) {
            const pacienteUsuarioId = await this.validatePacienteUsuarioId(updatePacienteDto.pacienteUsuarioId, paciente.id);
            paciente.pacienteUsuarioId = pacienteUsuarioId;
            paciente.vinculoStatus = pacienteUsuarioId
                ? this.resolveInitialVinculoStatus(pacienteUsuarioId, paciente.cadastroOrigem || paciente_entity_1.PacienteCadastroOrigem.CADASTRO_ASSISTIDO)
                : paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
            if (!pacienteUsuarioId) {
                paciente.conviteAceitoEm = null;
            }
            else if (!paciente.conviteAceitoEm) {
                paciente.conviteAceitoEm = new Date();
            }
        }
        if (updatePacienteDto.cadastroOrigem) {
            paciente.cadastroOrigem = updatePacienteDto.cadastroOrigem;
        }
        if (updatePacienteDto.vinculoStatus) {
            paciente.vinculoStatus = updatePacienteDto.vinculoStatus;
        }
        Object.assign(paciente, updatePacienteDto);
        return this.pacienteRepository.save(paciente);
    }
    async unlinkPacienteUsuarioByProfessional(id, usuarioId) {
        const paciente = await this.findOne(id, usuarioId);
        if (!paciente.pacienteUsuarioId) {
            throw new common_1.BadRequestException('Paciente nao possui usuario vinculado');
        }
        paciente.pacienteUsuarioId = null;
        paciente.vinculoStatus = paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
        paciente.conviteAceitoEm = null;
        return this.pacienteRepository.save(paciente);
    }
    async unlinkMyProfessional(usuario) {
        if (usuario.role !== usuario_entity_1.UserRole.PACIENTE) {
            throw new common_1.ForbiddenException('Acesso permitido somente para pacientes');
        }
        const paciente = await this.findLinkedPacienteByUsuarioId(usuario.id);
        paciente.pacienteUsuarioId = null;
        paciente.vinculoStatus = paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
        paciente.conviteAceitoEm = null;
        await this.pacienteRepository.save(paciente);
        return { pacienteId: paciente.id };
    }
    async findLinkedPacienteByUsuarioId(usuarioId) {
        const paciente = await this.pacienteRepository.findOne({
            where: { pacienteUsuarioId: usuarioId, ativo: true },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Nenhum cadastro de paciente vinculado');
        }
        return paciente;
    }
    async remove(id, usuarioId) {
        const paciente = await this.findOne(id, usuarioId);
        paciente.ativo = false;
        await this.pacienteRepository.save(paciente);
    }
    async getAttentionMap(usuarioId) {
        const rows = await this.pacienteRepository
            .createQueryBuilder('p')
            .leftJoin(this.evolucaoRepository.metadata.tableName, 'e', 'e.paciente_id = p.id')
            .where('p.usuario_id = :usuarioId', { usuarioId })
            .andWhere('p.ativo = :ativo', { ativo: true })
            .select('p.id', 'pacienteId')
            .addSelect('MAX(e.data)', 'lastEvolucaoAt')
            .groupBy('p.id')
            .getRawMany();
        const now = Date.now();
        const result = {};
        for (const row of rows) {
            if (!row.lastEvolucaoAt) {
                result[row.pacienteId] = null;
                continue;
            }
            const latest = new Date(row.lastEvolucaoAt).getTime();
            if (Number.isNaN(latest)) {
                result[row.pacienteId] = null;
                continue;
            }
            result[row.pacienteId] = Math.floor((now - latest) / (1000 * 60 * 60 * 24));
        }
        return result;
    }
    async getStats(usuarioId) {
        const total = await this.pacienteRepository.count({
            where: { usuarioId, ativo: true },
        });
        return {
            totalPacientes: total,
            atendidosHoje: 0,
            atendidosMes: 0,
        };
    }
    async getMyPacienteProfile(usuario) {
        if (usuario.role !== usuario_entity_1.UserRole.PACIENTE) {
            throw new common_1.ForbiddenException('Acesso permitido somente para pacientes');
        }
        const paciente = await this.pacienteRepository.findOne({
            where: { pacienteUsuarioId: usuario.id, ativo: true },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Nenhum cadastro de paciente vinculado');
        }
        const latestEvolucao = await this.evolucaoRepository.findOne({
            where: { pacienteId: paciente.id },
            order: { data: 'DESC' },
        });
        const latestLaudo = await this.laudoRepository.findOne({
            where: { pacienteId: paciente.id },
            order: { updatedAt: 'DESC' },
        });
        return {
            paciente,
            resumo: {
                ultimaEvolucaoEm: latestEvolucao?.data || null,
                ultimoLaudoAtualizadoEm: latestLaudo?.updatedAt || null,
                statusLaudo: latestLaudo?.status || null,
            },
        };
    }
    async listExames(pacienteId, usuarioId) {
        await this.findOne(pacienteId, usuarioId);
        return this.pacienteExameRepository.find({
            where: { pacienteId, usuarioId },
            order: { createdAt: 'DESC' },
        });
    }
    async createExame(pacienteId, usuarioId, payload) {
        await this.findOne(pacienteId, usuarioId);
        const exame = this.pacienteExameRepository.create({
            pacienteId,
            usuarioId,
            nomeOriginal: payload.nomeOriginal,
            nomeArquivo: payload.nomeArquivo,
            mimeType: payload.mimeType,
            tamanhoBytes: payload.tamanhoBytes,
            caminhoArquivo: payload.caminhoArquivo,
            tipoExame: payload.tipoExame?.trim() || null,
            observacao: payload.observacao?.trim() || null,
            dataExame: payload.dataExame || null,
        });
        return this.pacienteExameRepository.save(exame);
    }
    async findExameOrFail(pacienteId, exameId, usuarioId) {
        await this.findOne(pacienteId, usuarioId);
        const exame = await this.pacienteExameRepository.findOne({
            where: { id: exameId, pacienteId, usuarioId },
        });
        if (!exame) {
            throw new common_1.NotFoundException('Exame nao encontrado');
        }
        return exame;
    }
    async removeExame(pacienteId, exameId, usuarioId) {
        const exame = await this.findExameOrFail(pacienteId, exameId, usuarioId);
        await this.pacienteExameRepository.remove(exame);
        await fs_1.promises.unlink(exame.caminhoArquivo).catch(() => undefined);
    }
};
exports.PacientesService = PacientesService;
exports.PacientesService = PacientesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __param(1, (0, typeorm_1.InjectRepository)(evolucao_entity_1.Evolucao)),
    __param(2, (0, typeorm_1.InjectRepository)(laudo_entity_1.Laudo)),
    __param(3, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(4, (0, typeorm_1.InjectRepository)(paciente_exame_entity_1.PacienteExame)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PacientesService);
//# sourceMappingURL=pacientes.service.js.map