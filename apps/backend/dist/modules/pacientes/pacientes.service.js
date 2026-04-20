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
const paciente_entity_1 = require("./entities/paciente.entity");
const paciente_exame_entity_1 = require("./entities/paciente-exame.entity");
const profissional_paciente_vinculo_entity_1 = require("./entities/profissional-paciente-vinculo.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
let PacientesService = class PacientesService {
    pacienteRepository;
    evolucaoRepository;
    laudoRepository;
    usuarioRepository;
    pacienteExameRepository;
    vinculoRepository;
    constructor(pacienteRepository, evolucaoRepository, laudoRepository, usuarioRepository, pacienteExameRepository, vinculoRepository) {
        this.pacienteRepository = pacienteRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.laudoRepository = laudoRepository;
        this.usuarioRepository = usuarioRepository;
        this.pacienteExameRepository = pacienteExameRepository;
        this.vinculoRepository = vinculoRepository;
    }
    buildScopedPacientesQuery(usuarioId) {
        const vinculoTable = this.vinculoRepository.metadata.tableName;
        return this.pacienteRepository
            .createQueryBuilder('p')
            .where('p.ativo = :ativo', { ativo: true })
            .andWhere(`((p.usuario_id = :usuarioId AND p.paciente_usuario_id IS NULL) OR EXISTS (
          SELECT 1
          FROM ${vinculoTable} v
          WHERE v.paciente_id = p.id
            AND v.profissional_id = :usuarioId
            AND v.status = :vinculoStatusAtivo
        ))`, {
            usuarioId,
            vinculoStatusAtivo: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
        });
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
    mapOrigemToVinculo(cadastroOrigem) {
        if (cadastroOrigem === paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO) {
            return profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO;
        }
        return profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO;
    }
    shouldReplaceQuickInviteName(nomeCompleto) {
        const normalized = (nomeCompleto || '').trim().toLowerCase();
        return !normalized || normalized === 'paciente convite rapido';
    }
    applyDisplayNameFallback(paciente) {
        if (paciente.cadastroOrigem === paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO &&
            this.shouldReplaceQuickInviteName(paciente.nomeCompleto) &&
            paciente.pacienteUsuario?.nome) {
            paciente.nomeCompleto = paciente.pacienteUsuario.nome;
        }
        return paciente;
    }
    addPacienteListSelects(query) {
        return query
            .select([
            'p.id',
            'p.nomeCompleto',
            'p.cpf',
            'p.rg',
            'p.dataNascimento',
            'p.sexo',
            'p.estadoCivil',
            'p.profissao',
            'p.enderecoRua',
            'p.enderecoNumero',
            'p.enderecoComplemento',
            'p.enderecoBairro',
            'p.enderecoCep',
            'p.enderecoCidade',
            'p.enderecoUf',
            'p.contatoWhatsapp',
            'p.contatoTelefone',
            'p.contatoEmail',
            'p.ativo',
            'p.usuarioId',
            'p.pacienteUsuarioId',
            'p.anamneseLiberadaPaciente',
            'p.anamneseSolicitacaoPendente',
            'p.anamneseSolicitacaoEm',
            'p.anamneseSolicitacaoUltimaEm',
            'p.cadastroOrigem',
            'p.vinculoStatus',
            'p.conviteEnviadoEm',
            'p.conviteAceitoEm',
            'p.createdAt',
            'p.updatedAt',
        ])
            .leftJoin('p.pacienteUsuario', 'pacienteUsuario')
            .addSelect(['pacienteUsuario.id', 'pacienteUsuario.nome']);
    }
    toPacienteListItem(paciente) {
        return {
            id: paciente.id,
            nomeCompleto: paciente.nomeCompleto,
            cpf: paciente.cpf,
            rg: paciente.rg || null,
            dataNascimento: paciente.dataNascimento,
            sexo: paciente.sexo,
            estadoCivil: paciente.estadoCivil || null,
            profissao: paciente.profissao || null,
            enderecoRua: paciente.enderecoRua,
            enderecoNumero: paciente.enderecoNumero,
            enderecoComplemento: paciente.enderecoComplemento || null,
            enderecoBairro: paciente.enderecoBairro,
            enderecoCep: paciente.enderecoCep,
            enderecoCidade: paciente.enderecoCidade,
            enderecoUf: paciente.enderecoUf,
            contatoWhatsapp: paciente.contatoWhatsapp,
            contatoTelefone: paciente.contatoTelefone || null,
            contatoEmail: paciente.contatoEmail || null,
            ativo: paciente.ativo,
            usuarioId: paciente.usuarioId,
            pacienteUsuarioId: paciente.pacienteUsuarioId || null,
            anamneseLiberadaPaciente: paciente.anamneseLiberadaPaciente,
            anamneseSolicitacaoPendente: paciente.anamneseSolicitacaoPendente,
            anamneseSolicitacaoEm: paciente.anamneseSolicitacaoEm || null,
            anamneseSolicitacaoUltimaEm: paciente.anamneseSolicitacaoUltimaEm || null,
            cadastroOrigem: paciente.cadastroOrigem,
            vinculoStatus: paciente.vinculoStatus,
            conviteEnviadoEm: paciente.conviteEnviadoEm || null,
            conviteAceitoEm: paciente.conviteAceitoEm || null,
            createdAt: paciente.createdAt,
            updatedAt: paciente.updatedAt,
        };
    }
    async upsertVinculoAtivo(paciente, pacienteUsuarioId) {
        await this.vinculoRepository.manager.transaction(async (manager) => {
            const vinculoRepo = manager.getRepository(profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo);
            await vinculoRepo.update({
                pacienteId: paciente.id,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            }, {
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ENCERRADO,
                endedAt: new Date(),
            });
            const existingAtivoByPacienteUsuario = await vinculoRepo.findOne({
                where: {
                    pacienteUsuarioId,
                    status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
                },
            });
            if (existingAtivoByPacienteUsuario) {
                if (existingAtivoByPacienteUsuario.pacienteId !== paciente.id) {
                    throw new common_1.ConflictException('Este usuario paciente ja esta vinculado');
                }
                await vinculoRepo.update({ id: existingAtivoByPacienteUsuario.id }, {
                    profissionalId: paciente.usuarioId,
                    origem: this.mapOrigemToVinculo(paciente.cadastroOrigem),
                    endedAt: null,
                });
                return;
            }
            await vinculoRepo.save(vinculoRepo.create({
                profissionalId: paciente.usuarioId,
                pacienteId: paciente.id,
                pacienteUsuarioId,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
                origem: this.mapOrigemToVinculo(paciente.cadastroOrigem),
                endedAt: null,
            }));
        });
    }
    async closeVinculoAtivoByPaciente(pacienteId) {
        await this.vinculoRepository.manager.transaction(async (manager) => {
            await manager.getRepository(profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo).update({
                pacienteId,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            }, {
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ENCERRADO,
                endedAt: new Date(),
            });
        });
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
            const isPacienteAutonomo = existingLink.ativo && existingLink.usuarioId === pacienteUsuarioId;
            if (!isPacienteAutonomo) {
                throw new common_1.ConflictException('Este usuario paciente ja esta vinculado');
            }
        }
        const existingActiveVinculo = await this.vinculoRepository.findOne({
            where: {
                pacienteUsuarioId,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            },
        });
        if (existingActiveVinculo && existingActiveVinculo.pacienteId !== ignorePacienteId) {
            throw new common_1.ConflictException('Este usuario paciente ja esta vinculado');
        }
        return pacienteUsuarioId;
    }
    async generateUniquePacienteCpf() {
        for (let i = 0; i < 25; i++) {
            const base = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const cpf = base.slice(-11).padStart(11, '0');
            const exists = await this.pacienteRepository.findOne({ where: { cpf } });
            if (!exists)
                return cpf;
        }
        throw new common_1.BadRequestException('Nao foi possivel gerar CPF temporario para paciente');
    }
    async findOrCreateSelfPacienteForUsuario(usuarioId) {
        const existente = await this.pacienteRepository.findOne({
            where: { pacienteUsuarioId: usuarioId, ativo: true },
            order: { createdAt: 'DESC' },
        });
        if (existente) {
            return existente;
        }
        const usuario = await this.usuarioRepository.findOne({
            where: { id: usuarioId, ativo: true },
        });
        if (!usuario || usuario.role !== usuario_entity_1.UserRole.PACIENTE) {
            throw new common_1.NotFoundException('Usuario paciente nao encontrado');
        }
        const cpfTemporario = await this.generateUniquePacienteCpf();
        const paciente = this.pacienteRepository.create({
            nomeCompleto: usuario.nome || 'Paciente',
            cpf: cpfTemporario,
            dataNascimento: new Date('1900-01-01'),
            sexo: paciente_entity_1.Sexo.OUTRO,
            profissao: '',
            enderecoRua: '-',
            enderecoNumero: '-',
            enderecoBairro: '-',
            enderecoCep: '00000000',
            enderecoCidade: '-',
            enderecoUf: 'NA',
            contatoWhatsapp: '00000000000',
            contatoEmail: usuario.email,
            ativo: true,
            usuarioId: usuario.id,
            pacienteUsuarioId: usuario.id,
            anamneseLiberadaPaciente: true,
            cadastroOrigem: paciente_entity_1.PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
            vinculoStatus: paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO,
            conviteEnviadoEm: null,
            conviteAceitoEm: null,
        });
        return this.pacienteRepository.save(paciente);
    }
    async create(createPacienteDto, usuarioId) {
        const existingPaciente = await this.pacienteRepository.findOne({
            where: { cpf: createPacienteDto.cpf, usuarioId },
        });
        if (existingPaciente) {
            throw new common_1.ConflictException('CPF ja cadastrado');
        }
        const pacienteUsuarioId = await this.validatePacienteUsuarioId(createPacienteDto.pacienteUsuarioId);
        const cadastroOrigem = createPacienteDto.cadastroOrigem || paciente_entity_1.PacienteCadastroOrigem.CADASTRO_ASSISTIDO;
        if (pacienteUsuarioId) {
            const pacienteAutonomo = await this.pacienteRepository.findOne({
                where: { pacienteUsuarioId, ativo: true },
            });
            const podeAdotarCadastroAutonomo = !!pacienteAutonomo && pacienteAutonomo.usuarioId === pacienteUsuarioId;
            if (podeAdotarCadastroAutonomo && pacienteAutonomo) {
                Object.assign(pacienteAutonomo, {
                    ...createPacienteDto,
                    cadastroOrigem,
                    vinculoStatus: this.resolveInitialVinculoStatus(pacienteUsuarioId, cadastroOrigem),
                    conviteEnviadoEm: null,
                    conviteAceitoEm: new Date(),
                    usuarioId,
                    pacienteUsuarioId,
                });
                const savedAutonomo = await this.pacienteRepository.save(pacienteAutonomo);
                await this.upsertVinculoAtivo(savedAutonomo, pacienteUsuarioId);
                return savedAutonomo;
            }
        }
        const paciente = this.pacienteRepository.create({
            ...createPacienteDto,
            cadastroOrigem,
            vinculoStatus: this.resolveInitialVinculoStatus(pacienteUsuarioId, cadastroOrigem),
            conviteEnviadoEm: null,
            conviteAceitoEm: pacienteUsuarioId ? new Date() : null,
            usuarioId,
            pacienteUsuarioId,
        });
        const saved = await this.pacienteRepository.save(paciente);
        if (saved.pacienteUsuarioId) {
            await this.upsertVinculoAtivo(saved, saved.pacienteUsuarioId);
        }
        return saved;
    }
    async findAll(usuarioId) {
        const pacientes = await this.addPacienteListSelects(this.buildScopedPacientesQuery(usuarioId))
            .orderBy('p.nome_completo', 'ASC')
            .getMany();
        return pacientes.map((paciente) => this.toPacienteListItem(this.applyDisplayNameFallback(paciente)));
    }
    async findPaged(usuarioId, page, limit) {
        const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
        const safeLimit = Number.isFinite(limit)
            ? Math.min(100, Math.max(10, limit))
            : 30;
        const skip = (safePage - 1) * safeLimit;
        const baseQuery = this.buildScopedPacientesQuery(usuarioId);
        const total = await baseQuery.clone().getCount();
        const data = await this.addPacienteListSelects(baseQuery)
            .orderBy('p.nome_completo', 'ASC')
            .take(safeLimit)
            .skip(skip)
            .getMany();
        return {
            data: data.map((paciente) => this.toPacienteListItem(this.applyDisplayNameFallback(paciente))),
            total,
            page: safePage,
            limit: safeLimit,
            hasNext: skip + data.length < total,
        };
    }
    async findOne(id, usuarioId) {
        const paciente = await this.buildScopedPacientesQuery(usuarioId)
            .andWhere('p.id = :id', { id })
            .leftJoin('p.pacienteUsuario', 'pacienteUsuario')
            .addSelect(['pacienteUsuario.id', 'pacienteUsuario.nome'])
            .getOne();
        if (!paciente) {
            throw new common_1.NotFoundException('Paciente nao encontrado');
        }
        return this.applyDisplayNameFallback(paciente);
    }
    async update(id, updatePacienteDto, usuarioId) {
        const paciente = await this.findOne(id, usuarioId);
        if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
            const existingPaciente = await this.pacienteRepository.findOne({
                where: { cpf: updatePacienteDto.cpf, usuarioId },
            });
            if (existingPaciente) {
                throw new common_1.ConflictException('CPF ja cadastrado');
            }
        }
        let shouldSyncVinculo = false;
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
            shouldSyncVinculo = true;
        }
        if (updatePacienteDto.cadastroOrigem) {
            paciente.cadastroOrigem = updatePacienteDto.cadastroOrigem;
            if (paciente.pacienteUsuarioId) {
                shouldSyncVinculo = true;
            }
        }
        if (updatePacienteDto.vinculoStatus) {
            paciente.vinculoStatus = updatePacienteDto.vinculoStatus;
        }
        if (updatePacienteDto.anamneseLiberadaPaciente === true) {
            paciente.anamneseSolicitacaoPendente = false;
            paciente.anamneseSolicitacaoEm = null;
        }
        Object.assign(paciente, updatePacienteDto);
        const saved = await this.pacienteRepository.save(paciente);
        if (shouldSyncVinculo) {
            if (saved.pacienteUsuarioId) {
                await this.upsertVinculoAtivo(saved, saved.pacienteUsuarioId);
            }
            else {
                await this.closeVinculoAtivoByPaciente(saved.id);
            }
        }
        return saved;
    }
    async unlinkPacienteUsuarioByProfessional(id, usuarioId) {
        const paciente = await this.findOne(id, usuarioId);
        if (!paciente.pacienteUsuarioId) {
            throw new common_1.BadRequestException('Paciente nao possui usuario vinculado');
        }
        paciente.pacienteUsuarioId = null;
        paciente.vinculoStatus = paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
        paciente.conviteAceitoEm = null;
        const saved = await this.pacienteRepository.save(paciente);
        await this.closeVinculoAtivoByPaciente(saved.id);
        return saved;
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
        await this.closeVinculoAtivoByPaciente(paciente.id);
        return { pacienteId: paciente.id };
    }
    async findLinkedPacienteByUsuarioId(usuarioId) {
        const vinculoAtivo = await this.vinculoRepository.findOne({
            where: {
                pacienteUsuarioId: usuarioId,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            },
            order: { createdAt: 'DESC' },
        });
        if (vinculoAtivo) {
            const pacienteByVinculo = await this.pacienteRepository.findOne({
                where: { id: vinculoAtivo.pacienteId, ativo: true },
            });
            if (pacienteByVinculo) {
                return pacienteByVinculo;
            }
        }
        const paciente = await this.pacienteRepository.findOne({
            where: { pacienteUsuarioId: usuarioId, ativo: true },
        });
        if (!paciente) {
            throw new common_1.NotFoundException('Nenhum cadastro de paciente vinculado');
        }
        return paciente;
    }
    async findPacienteByUsuarioId(usuarioId) {
        const vinculoAtivo = await this.vinculoRepository.findOne({
            where: {
                pacienteUsuarioId: usuarioId,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            },
            order: { createdAt: 'DESC' },
        });
        if (vinculoAtivo) {
            const pacienteByVinculo = await this.pacienteRepository.findOne({
                where: { id: vinculoAtivo.pacienteId, ativo: true },
            });
            if (pacienteByVinculo) {
                return pacienteByVinculo;
            }
        }
        return this.pacienteRepository.findOne({
            where: { pacienteUsuarioId: usuarioId, ativo: true },
            order: { conviteAceitoEm: 'DESC', updatedAt: 'DESC' },
        });
    }
    async remove(id, usuarioId) {
        let paciente;
        try {
            paciente = await this.findOne(id, usuarioId);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                return;
            }
            throw error;
        }
        if (paciente.pacienteUsuarioId) {
            paciente.vinculoStatus = paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
            await this.pacienteRepository.save(paciente);
            await this.closeVinculoAtivoByPaciente(paciente.id);
            return;
        }
        paciente.ativo = false;
        await this.pacienteRepository.save(paciente);
        await this.closeVinculoAtivoByPaciente(paciente.id);
    }
    async getAttentionMap(usuarioId) {
        const vinculoTable = this.vinculoRepository.metadata.tableName;
        const rows = await this.pacienteRepository
            .createQueryBuilder('p')
            .leftJoin(this.evolucaoRepository.metadata.tableName, 'e', 'e.paciente_id = p.id')
            .andWhere('p.ativo = :ativo', { ativo: true })
            .andWhere(`(p.usuario_id = :usuarioId OR EXISTS (
          SELECT 1
          FROM ${vinculoTable} v
          WHERE v.paciente_id = p.id
            AND v.profissional_id = :usuarioId
            AND v.status = :vinculoStatusAtivo
        ))`, {
            usuarioId,
            vinculoStatusAtivo: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
        })
            .select('p.id', 'pacienteId')
            .addSelect('p.created_at', 'createdAt')
            .addSelect('MAX(e.data)', 'lastEvolucaoAt')
            .groupBy('p.id')
            .addGroupBy('p.created_at')
            .getRawMany();
        const now = Date.now();
        const result = {};
        for (const row of rows) {
            if (!row.lastEvolucaoAt) {
                const createdAt = row.createdAt ? new Date(row.createdAt).getTime() : NaN;
                if (Number.isNaN(createdAt)) {
                    result[row.pacienteId] = null;
                    continue;
                }
                const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                result[row.pacienteId] = daysSinceCreation > 7 ? null : 0;
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
        const total = await this.buildScopedPacientesQuery(usuarioId).getCount();
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
        const paciente = await this.findPacienteByUsuarioId(usuario.id);
        if (!paciente) {
            return {
                vinculado: false,
                paciente: null,
                resumo: null,
            };
        }
        const vinculoAtivo = await this.vinculoRepository.findOne({
            where: {
                pacienteUsuarioId: usuario.id,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            },
            order: { createdAt: 'DESC' },
        });
        if (!vinculoAtivo) {
            return {
                vinculado: false,
                paciente,
                resumo: null,
            };
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
            vinculado: true,
            paciente,
            resumo: {
                ultimaEvolucaoEm: latestEvolucao?.data || null,
                ultimoLaudoAtualizadoEm: latestLaudo?.updatedAt || null,
                statusLaudo: latestLaudo?.status || null,
            },
        };
    }
    async resolveExameScope(pacienteId, actor) {
        if (actor.role === usuario_entity_1.UserRole.PACIENTE) {
            const linkedPaciente = await this.findLinkedPacienteByUsuarioId(actor.id);
            if (linkedPaciente.id !== pacienteId) {
                throw new common_1.ForbiddenException('Paciente sem permissao para este recurso');
            }
            return {
                paciente: linkedPaciente,
                ownerUsuarioId: linkedPaciente.usuarioId,
            };
        }
        const paciente = await this.findOne(pacienteId, actor.id);
        return {
            paciente,
            ownerUsuarioId: paciente.usuarioId,
        };
    }
    async resolveExameOwnerUsuarioId(pacienteId, actor) {
        const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
        return ownerUsuarioId;
    }
    async listExames(pacienteId, actor) {
        const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
        return this.pacienteExameRepository.find({
            where: { pacienteId, usuarioId: ownerUsuarioId },
            order: { createdAt: 'DESC' },
        });
    }
    async createExame(pacienteId, actor, payload) {
        const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
        const exame = this.pacienteExameRepository.create({
            pacienteId,
            usuarioId: ownerUsuarioId,
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
    async findExameOrFail(pacienteId, exameId, actor) {
        const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
        const exame = await this.pacienteExameRepository.findOne({
            where: { id: exameId, pacienteId, usuarioId: ownerUsuarioId },
        });
        if (!exame) {
            throw new common_1.NotFoundException('Exame nao encontrado');
        }
        return exame;
    }
    async removeExame(pacienteId, exameId, actor) {
        const exame = await this.findExameOrFail(pacienteId, exameId, actor);
        await this.pacienteExameRepository.remove(exame);
        return exame;
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
    __param(5, (0, typeorm_1.InjectRepository)(profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PacientesService);
//# sourceMappingURL=pacientes.service.js.map