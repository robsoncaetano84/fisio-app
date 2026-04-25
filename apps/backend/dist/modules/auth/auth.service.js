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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const usuarios_service_1 = require("../usuarios/usuarios.service");
const auth_logs_service_1 = require("./auth-logs.service");
const auth_log_entity_1 = require("./entities/auth-log.entity");
const lockout_service_1 = require("./lockout.service");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
const profissional_paciente_vinculo_entity_1 = require("../pacientes/entities/profissional-paciente-vinculo.entity");
let AuthService = AuthService_1 = class AuthService {
    usuariosService;
    jwtService;
    configService;
    authLogsService;
    lockoutService;
    pacienteRepository;
    vinculoRepository;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usuariosService, jwtService, configService, authLogsService, lockoutService, pacienteRepository, vinculoRepository) {
        this.usuariosService = usuariosService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.authLogsService = authLogsService;
        this.lockoutService = lockoutService;
        this.pacienteRepository = pacienteRepository;
        this.vinculoRepository = vinculoRepository;
    }
    normalizeLoginIdentifier(identificador) {
        return (identificador || '').trim().toLowerCase();
    }
    parseBoolean(value, defaultValue) {
        if (value == null || value.trim() === '')
            return defaultValue;
        const normalized = value.trim().toLowerCase();
        return ['1', 'true', 'yes', 'on'].includes(normalized);
    }
    parseFeatureFlagsByEmailConfig() {
        const raw = (this.configService.get('FEATURE_FLAGS_BY_EMAIL') || '').trim();
        if (!raw)
            return {};
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        }
        catch {
            return {};
        }
    }
    getFeatureFlagsForUser(usuario) {
        const defaults = {
            speechToText: this.parseBoolean(this.configService.get('ENABLE_SPEECH_TO_TEXT'), true),
            requireAiSuggestionConfirmation: this.parseBoolean(this.configService.get('REQUIRE_AI_SUGGESTION_CONFIRMATION'), true),
            crmAdminWeb: this.parseBoolean(this.configService.get('ENABLE_CRM_ADMIN_WEB'), true),
            clinicalOrchestrator: this.parseBoolean(this.configService.get('ENABLE_CLINICAL_ORCHESTRATOR'), true),
            generatedAt: new Date().toISOString(),
        };
        const overrides = this.parseFeatureFlagsByEmailConfig();
        const emailKey = (usuario.email || '').trim().toLowerCase();
        const userOverride = overrides[emailKey] || overrides['*'] || {};
        const merged = {
            ...defaults,
            ...userOverride,
            generatedAt: new Date().toISOString(),
        };
        if (usuario.role !== usuario_entity_1.UserRole.ADMIN) {
            merged.crmAdminWeb = false;
        }
        return merged;
    }
    async validateUser(identificador, senha) {
        const normalized = this.normalizeLoginIdentifier(identificador);
        let usuario = null;
        if (normalized.includes('@')) {
            usuario = await this.usuariosService.findByEmail(normalized);
        }
        else {
            const cpfDigits = this.sanitizeDigits(normalized);
            if (cpfDigits.length === 11) {
                const pacientes = await this.pacienteRepository
                    .createQueryBuilder('paciente')
                    .leftJoinAndSelect('paciente.pacienteUsuario', 'pacienteUsuario')
                    .where('paciente.cpf = :cpf', { cpf: cpfDigits })
                    .andWhere('paciente.ativo = :ativo', { ativo: true })
                    .andWhere('paciente.paciente_usuario_id IS NOT NULL')
                    .getMany();
                const distinctUsuarioIds = Array.from(new Set(pacientes
                    .map((paciente) => paciente.pacienteUsuarioId)
                    .filter((value) => !!value)));
                if (distinctUsuarioIds.length > 1) {
                    throw new common_1.UnauthorizedException('CPF encontrado em mais de um cadastro. Faça login com e-mail.');
                }
                if (distinctUsuarioIds.length === 1) {
                    try {
                        usuario = await this.usuariosService.findById(distinctUsuarioIds[0]);
                    }
                    catch {
                        usuario = null;
                    }
                }
            }
            if (!usuario) {
                usuario = await this.usuariosService.findByEmail(normalized);
            }
        }
        if (!usuario || !usuario.ativo) {
            return null;
        }
        const isPasswordValid = await this.usuariosService.validatePassword(senha, usuario.senha);
        if (!isPasswordValid) {
            return null;
        }
        return usuario;
    }
    signAccessToken(payload) {
        const secret = this.configService.get('JWT_SECRET');
        const expiresIn = this.configService.get('JWT_EXPIRES_IN');
        return this.jwtService.sign(payload, {
            secret,
            expiresIn: expiresIn,
        });
    }
    signRefreshToken(payload) {
        const secret = this.configService.get('REFRESH_SECRET');
        const expiresIn = this.configService.get('REFRESH_EXPIRES_IN');
        return this.jwtService.sign(payload, {
            secret,
            expiresIn: expiresIn,
        });
    }
    buildLoginResponse(usuario) {
        const payload = {
            sub: usuario.id,
            email: usuario.email,
            role: usuario.role,
        };
        return {
            token: this.signAccessToken(payload),
            refreshToken: this.signRefreshToken(payload),
            featureFlags: this.getFeatureFlagsForUser(usuario),
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                conselhoSigla: usuario.conselhoSigla,
                conselhoUf: usuario.conselhoUf,
                conselhoProf: usuario.conselhoProf,
                registroProf: usuario.registroProf,
                especialidade: usuario.especialidade,
                consentTermsRequired: usuario.consentTermsRequired,
                consentPrivacyRequired: usuario.consentPrivacyRequired,
                consentResearchOptional: usuario.consentResearchOptional,
                consentAiOptional: usuario.consentAiOptional,
                consentAcceptedAt: usuario.consentAcceptedAt,
                consentProfessionalLgpdRequired: usuario.consentProfessionalLgpdRequired,
                role: usuario.role,
            },
        };
    }
    async login(identificador, senha, meta) {
        const normalizedIdentifier = this.normalizeLoginIdentifier(identificador);
        const isLocked = await this.lockoutService.isLocked(normalizedIdentifier);
        if (isLocked) {
            this.logger.warn(`Login bloqueado para ${normalizedIdentifier} (ip=${meta?.ip ?? 'unknown'})`);
            this.logger.log(JSON.stringify({
                event: 'login',
                email: normalizedIdentifier,
                ip: meta?.ip ?? null,
                success: false,
                reason: 'LOCKED',
            }));
            await this.authLogsService.record({
                email: normalizedIdentifier,
                eventType: auth_log_entity_1.AuthEventType.LOGIN,
                success: false,
                ip: meta?.ip,
                reason: 'LOCKED',
            });
            throw new common_1.UnauthorizedException('Conta temporariamente bloqueada');
        }
        const usuario = await this.validateUser(normalizedIdentifier, senha);
        if (!usuario) {
            await this.lockoutService.registerFailure(normalizedIdentifier);
            this.logger.warn(`Login falhou para ${normalizedIdentifier} (ip=${meta?.ip ?? 'unknown'})`);
            this.logger.log(JSON.stringify({
                event: 'login',
                email: normalizedIdentifier,
                ip: meta?.ip ?? null,
                success: false,
                reason: 'INVALID_CREDENTIALS',
            }));
            await this.authLogsService.record({
                email: normalizedIdentifier,
                eventType: auth_log_entity_1.AuthEventType.LOGIN,
                success: false,
                ip: meta?.ip,
                reason: 'INVALID_CREDENTIALS',
            });
            throw new common_1.UnauthorizedException('Credenciais invalidas');
        }
        await this.lockoutService.reset(normalizedIdentifier);
        this.logger.log(`Login ok para ${usuario.email} (ip=${meta?.ip ?? 'unknown'})`);
        this.logger.log(JSON.stringify({
            event: 'login',
            email: usuario.email,
            ip: meta?.ip ?? null,
            success: true,
        }));
        await this.authLogsService.record({
            email: usuario.email,
            usuarioId: usuario.id,
            eventType: auth_log_entity_1.AuthEventType.LOGIN,
            success: true,
            ip: meta?.ip,
        });
        return this.buildLoginResponse(usuario);
    }
    async refresh(refreshToken) {
        try {
            const secret = this.configService.get('REFRESH_SECRET');
            const payload = this.jwtService.verify(refreshToken, {
                secret,
            });
            const usuario = await this.usuariosService.findById(payload.sub);
            if (!usuario || !usuario.ativo) {
                throw new common_1.UnauthorizedException('Usuario invalido');
            }
            this.logger.log(`Refresh token ok para ${usuario.email}`);
            this.logger.log(JSON.stringify({
                event: 'refresh',
                email: usuario.email,
                success: true,
            }));
            await this.authLogsService.record({
                email: usuario.email,
                usuarioId: usuario.id,
                eventType: auth_log_entity_1.AuthEventType.REFRESH,
                success: true,
            });
            return this.buildLoginResponse(usuario);
        }
        catch (error) {
            this.logger.warn('Refresh token invalido');
            this.logger.log(JSON.stringify({
                event: 'refresh',
                email: 'unknown',
                success: false,
                reason: 'INVALID_REFRESH',
            }));
            await this.authLogsService.record({
                email: 'unknown',
                eventType: auth_log_entity_1.AuthEventType.REFRESH,
                success: false,
                reason: 'INVALID_REFRESH',
            });
            throw new common_1.UnauthorizedException('Refresh token invalido');
        }
    }
    async requestPasswordReset(email) {
        const normalizedEmail = (email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            throw new common_1.BadRequestException('E-mail invalido');
        }
        const user = await this.usuariosService.findByEmail(normalizedEmail);
        await this.authLogsService.record({
            email: normalizedEmail,
            usuarioId: user?.id,
            eventType: auth_log_entity_1.AuthEventType.LOGIN,
            success: true,
            reason: user ? 'RECOVERY_REQUESTED' : 'RECOVERY_REQUESTED_UNKNOWN_EMAIL',
        });
        return {
            message: 'Se o e-mail existir em nossa base, enviaremos instrucoes de recuperacao.',
        };
    }
    getInviteSecret() {
        const inviteSecret = this.configService
            .get('INVITE_SECRET')
            ?.trim();
        if (!inviteSecret) {
            throw new common_1.InternalServerErrorException('INVITE_SECRET nao configurado no ambiente');
        }
        return inviteSecret;
    }
    mapPacienteOrigemToVinculoOrigem(paciente) {
        if (paciente.cadastroOrigem === paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO) {
            return profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO;
        }
        return profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO;
    }
    async resolveInviteContext(conviteToken) {
        let payload;
        try {
            payload = this.jwtService.verify(conviteToken, {
                secret: this.getInviteSecret(),
            });
        }
        catch {
            throw new common_1.BadRequestException('Convite invalido ou expirado');
        }
        if (!payload?.sub ||
            !payload?.pacienteId ||
            payload.type !== 'PACIENTE_INVITE') {
            throw new common_1.BadRequestException('Convite invalido');
        }
        const profissional = await this.usuariosService.findById(payload.sub);
        if (!profissional.ativo ||
            (profissional.role !== usuario_entity_1.UserRole.ADMIN &&
                profissional.role !== usuario_entity_1.UserRole.USER)) {
            throw new common_1.BadRequestException('Profissional do convite nao encontrado');
        }
        const pacienteParaVinculo = await this.pacienteRepository.findOne({
            where: {
                id: payload.pacienteId,
                usuarioId: profissional.id,
                ativo: true,
            },
        });
        if (!pacienteParaVinculo) {
            throw new common_1.BadRequestException('Paciente do convite nao encontrado');
        }
        return { profissional, pacienteParaVinculo };
    }
    async obterDadosConvitePaciente(conviteToken) {
        const { pacienteParaVinculo } = await this.resolveInviteContext(conviteToken);
        return {
            nome: (pacienteParaVinculo.nomeCompleto || '').trim(),
            email: (pacienteParaVinculo.contatoEmail || '').trim().toLowerCase(),
        };
    }
    async vincularPacienteUsuarioAoCadastro(pacienteParaVinculo, pacienteUsuario) {
        return this.pacienteRepository.manager.transaction(async (manager) => {
            const pacienteRepo = manager.getRepository(paciente_entity_1.Paciente);
            const vinculoRepo = manager.getRepository(profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo);
            const pacienteLocked = await pacienteRepo
                .createQueryBuilder('paciente')
                .where('paciente.id = :id', { id: pacienteParaVinculo.id })
                .setLock('pessimistic_write')
                .getOne();
            if (!pacienteLocked) {
                throw new common_1.BadRequestException('Paciente do convite nao encontrado');
            }
            let pacienteDestino = pacienteLocked;
            if (pacienteLocked.pacienteUsuarioId) {
                if (pacienteLocked.pacienteUsuarioId === pacienteUsuario.id) {
                    pacienteLocked.vinculoStatus =
                        pacienteLocked.cadastroOrigem ===
                            paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO
                            ? paciente_entity_1.PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO
                            : paciente_entity_1.PacienteVinculoStatus.VINCULADO;
                    if (!pacienteLocked.conviteAceitoEm) {
                        pacienteLocked.conviteAceitoEm = new Date();
                    }
                    pacienteDestino = await pacienteRepo.save(pacienteLocked);
                }
                else {
                    throw new common_1.BadRequestException('Paciente ja possui usuario vinculado');
                }
            }
            else {
                const vinculoExistente = await pacienteRepo.findOne({
                    where: { pacienteUsuarioId: pacienteUsuario.id },
                });
                if (vinculoExistente && vinculoExistente.id !== pacienteLocked.id) {
                    const cadastroAutonomoDoPaciente = vinculoExistente.ativo &&
                        vinculoExistente.usuarioId === pacienteUsuario.id;
                    if (!cadastroAutonomoDoPaciente) {
                        throw new common_1.BadRequestException('Usuario paciente ja vinculado a outro cadastro');
                    }
                    vinculoExistente.usuarioId = pacienteLocked.usuarioId;
                    vinculoExistente.cadastroOrigem = pacienteLocked.cadastroOrigem;
                    vinculoExistente.vinculoStatus =
                        pacienteLocked.cadastroOrigem ===
                            paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO
                            ? paciente_entity_1.PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO
                            : paciente_entity_1.PacienteVinculoStatus.VINCULADO;
                    vinculoExistente.conviteAceitoEm = new Date();
                    if (this.shouldReplaceQuickInviteName(vinculoExistente.nomeCompleto) &&
                        pacienteLocked.nomeCompleto) {
                        vinculoExistente.nomeCompleto = pacienteLocked.nomeCompleto;
                    }
                    if (!vinculoExistente.contatoEmail && pacienteLocked.contatoEmail) {
                        vinculoExistente.contatoEmail = pacienteLocked.contatoEmail;
                    }
                    if (!vinculoExistente.contatoWhatsapp &&
                        pacienteLocked.contatoWhatsapp) {
                        vinculoExistente.contatoWhatsapp = pacienteLocked.contatoWhatsapp;
                    }
                    pacienteDestino = await pacienteRepo.save(vinculoExistente);
                    pacienteLocked.ativo = false;
                    pacienteLocked.pacienteUsuarioId = null;
                    pacienteLocked.vinculoStatus = paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO;
                    pacienteLocked.conviteAceitoEm = null;
                    await pacienteRepo.save(pacienteLocked);
                }
                else {
                    const vinculoAtivoTabela = await vinculoRepo.findOne({
                        where: {
                            pacienteUsuarioId: pacienteUsuario.id,
                            status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
                        },
                    });
                    if (vinculoAtivoTabela &&
                        vinculoAtivoTabela.pacienteId !== pacienteLocked.id) {
                        throw new common_1.BadRequestException('Usuario paciente ja vinculado a outro cadastro');
                    }
                    pacienteLocked.pacienteUsuarioId = pacienteUsuario.id;
                    pacienteLocked.vinculoStatus =
                        pacienteLocked.cadastroOrigem ===
                            paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO
                            ? paciente_entity_1.PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO
                            : paciente_entity_1.PacienteVinculoStatus.VINCULADO;
                    pacienteLocked.conviteAceitoEm = new Date();
                    pacienteDestino = await pacienteRepo.save(pacienteLocked);
                }
            }
            await vinculoRepo.update({
                pacienteId: pacienteDestino.id,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            }, {
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ENCERRADO,
                endedAt: new Date(),
            });
            await vinculoRepo.update({
                pacienteUsuarioId: pacienteUsuario.id,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
            }, {
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ENCERRADO,
                endedAt: new Date(),
            });
            await vinculoRepo.save(vinculoRepo.create({
                profissionalId: pacienteDestino.usuarioId,
                pacienteId: pacienteDestino.id,
                pacienteUsuarioId: pacienteUsuario.id,
                status: profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculoStatus.ATIVO,
                origem: this.mapPacienteOrigemToVinculoOrigem(pacienteDestino),
                endedAt: null,
            }));
            return pacienteDestino;
        });
    }
    sanitizeDigits(value) {
        return (value || '').replace(/\D/g, '').trim();
    }
    shouldReplaceQuickInviteName(nomeCompleto) {
        const normalized = (nomeCompleto || '').trim().toLowerCase();
        return !normalized || normalized === 'paciente convite rapido';
    }
    async syncQuickInvitePacienteDados(pacienteParaVinculo, pacienteUsuario) {
        if (pacienteParaVinculo.cadastroOrigem !==
            paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO) {
            return;
        }
        let changed = false;
        if (this.shouldReplaceQuickInviteName(pacienteParaVinculo.nomeCompleto)) {
            pacienteParaVinculo.nomeCompleto = pacienteUsuario.nome;
            changed = true;
        }
        const emailUsuario = (pacienteUsuario.email || '').trim().toLowerCase();
        if (emailUsuario &&
            (!pacienteParaVinculo.contatoEmail ||
                !pacienteParaVinculo.contatoEmail.trim())) {
            pacienteParaVinculo.contatoEmail = emailUsuario;
            changed = true;
        }
        if (changed) {
            await this.pacienteRepository.save(pacienteParaVinculo);
        }
    }
    async generateUniquePacienteCpf() {
        for (let i = 0; i < 25; i++) {
            const base = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const cpf = base.slice(-11).padStart(11, '0');
            const exists = await this.pacienteRepository.findOne({ where: { cpf } });
            if (!exists)
                return cpf;
        }
        throw new common_1.BadRequestException('Nao foi possivel gerar CPF temporario para convite rapido');
    }
    async gerarConviteRapidoPaciente(profissional, dto) {
        if (profissional.role !== usuario_entity_1.UserRole.ADMIN &&
            profissional.role !== usuario_entity_1.UserRole.USER) {
            throw new common_1.ForbiddenException('Apenas profissionais podem gerar convite');
        }
        const whatsappDigits = this.sanitizeDigits(dto.whatsapp);
        const email = dto.email?.trim().toLowerCase() || '';
        if (!whatsappDigits && !email) {
            throw new common_1.BadRequestException('Informe WhatsApp ou e-mail para envio do convite');
        }
        const cpfTemporario = await this.generateUniquePacienteCpf();
        const nomeBase = dto.nome?.trim();
        if (!nomeBase) {
            throw new common_1.BadRequestException('Informe o nome do paciente');
        }
        const draftPaciente = {
            usuarioId: profissional.id,
            nomeCompleto: nomeBase,
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
            contatoWhatsapp: whatsappDigits || '',
            contatoEmail: email || undefined,
            cadastroOrigem: paciente_entity_1.PacienteCadastroOrigem.CONVITE_RAPIDO,
            vinculoStatus: paciente_entity_1.PacienteVinculoStatus.SEM_VINCULO,
            anamneseLiberadaPaciente: false,
            pacienteUsuarioId: null,
            conviteEnviadoEm: null,
            conviteAceitoEm: null,
            ativo: true,
        };
        const saved = await this.pacienteRepository.save(this.pacienteRepository.create(draftPaciente));
        const invite = await this.gerarConvitePaciente(profissional, saved.id, dto.diasExpiracao);
        return {
            pacienteId: saved.id,
            token: invite.token,
            link: invite.link,
            expiraEmDias: invite.expiraEmDias,
        };
    }
    async gerarConvitePaciente(profissional, pacienteId, diasExpiracao) {
        if (profissional.role !== usuario_entity_1.UserRole.ADMIN &&
            profissional.role !== usuario_entity_1.UserRole.USER) {
            throw new common_1.ForbiddenException('Apenas profissionais podem gerar convite');
        }
        const paciente = await this.pacienteRepository.findOne({
            where: { id: pacienteId, usuarioId: profissional.id, ativo: true },
        });
        if (!paciente) {
            throw new common_1.BadRequestException('Paciente do convite nao encontrado');
        }
        if (paciente.pacienteUsuarioId) {
            throw new common_1.BadRequestException('Paciente ja possui usuario vinculado');
        }
        const expiraEmDias = Math.min(Math.max(diasExpiracao ?? 7, 1), 30);
        const inviteBaseUrl = this.configService.get('PATIENT_INVITE_BASE_URL') ||
            'synap://cadastro-paciente';
        const token = this.jwtService.sign({
            sub: profissional.id,
            pacienteId: paciente.id,
            type: 'PACIENTE_INVITE',
        }, {
            secret: this.getInviteSecret(),
            expiresIn: `${expiraEmDias}d`,
        });
        const sep = inviteBaseUrl.includes('?') ? '&' : '?';
        const link = `${inviteBaseUrl}${sep}convite=${encodeURIComponent(token)}`;
        paciente.vinculoStatus = paciente_entity_1.PacienteVinculoStatus.CONVITE_ENVIADO;
        paciente.conviteEnviadoEm = new Date();
        await this.pacienteRepository.save(paciente);
        return { token, link, expiraEmDias };
    }
    async aceitarConvitePaciente(pacienteUsuario, conviteToken) {
        if (pacienteUsuario.role !== usuario_entity_1.UserRole.PACIENTE || !pacienteUsuario.ativo) {
            throw new common_1.ForbiddenException('Apenas pacientes autenticados podem aceitar o convite');
        }
        const { profissional, pacienteParaVinculo } = await this.resolveInviteContext(conviteToken);
        const pacienteVinculado = await this.vincularPacienteUsuarioAoCadastro(pacienteParaVinculo, pacienteUsuario);
        await this.syncQuickInvitePacienteDados(pacienteVinculado, pacienteUsuario);
        return {
            vinculadoAutomaticamente: true,
            pacienteId: pacienteVinculado.id,
            profissionalId: profissional.id,
        };
    }
    async registrarPacientePorConvite(dto) {
        const { profissional, pacienteParaVinculo } = await this.resolveInviteContext(dto.conviteToken);
        const normalizedEmail = dto.email.trim().toLowerCase();
        const existingUser = await this.usuariosService.findByEmail(normalizedEmail);
        if (existingUser) {
            if (existingUser.role !== usuario_entity_1.UserRole.PACIENTE) {
                throw new common_1.ConflictException('Este e-mail ja esta em uso por outro tipo de conta');
            }
            throw new common_1.ConflictException('Este e-mail ja possui cadastro. Faca login para aceitar o convite');
        }
        const createUsuarioDto = {
            nome: dto.nome.trim(),
            email: normalizedEmail,
            senha: dto.senha,
            role: usuario_entity_1.UserRole.PACIENTE,
            consentTermsRequired: dto.consentTermsRequired,
            consentPrivacyRequired: dto.consentPrivacyRequired,
            consentResearchOptional: dto.consentResearchOptional,
            consentAiOptional: dto.consentAiOptional,
        };
        const pacienteUsuario = await this.usuariosService.create(createUsuarioDto);
        const pacienteVinculado = await this.vincularPacienteUsuarioAoCadastro(pacienteParaVinculo, pacienteUsuario);
        await this.syncQuickInvitePacienteDados(pacienteVinculado, pacienteUsuario);
        const pacienteId = pacienteVinculado.id;
        const loginResponse = this.buildLoginResponse(pacienteUsuario);
        return {
            ...loginResponse,
            vinculadoAutomaticamente: true,
            pacienteId,
            profissionalId: profissional.id,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __param(6, (0, typeorm_1.InjectRepository)(profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo)),
    __metadata("design:paramtypes", [usuarios_service_1.UsuariosService,
        jwt_1.JwtService,
        config_1.ConfigService,
        auth_logs_service_1.AuthLogsService,
        lockout_service_1.LockoutService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map