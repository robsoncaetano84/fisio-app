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
exports.CharlesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pacientes_service_1 = require("../pacientes/pacientes.service");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const laudo_entity_1 = require("../laudos/entities/laudo.entity");
const clinical_governance_service_1 = require("../clinical-governance/clinical-governance.service");
const openai_service_1 = require("../ai/openai.service");
const STRUCTURED_EXAME_PREFIX = '__EXAME_FISICO_STRUCTURED_V1__';
const CLINICAL_REGION_KEYS = [
    'CERVICAL',
    'TORACICA',
    'LOMBAR',
    'SACROILIACA',
    'QUADRIL',
    'JOELHO',
    'TORNOZELO_PE',
    'OMBRO',
    'COTOVELO',
    'PUNHO_MAO',
];
const REGION_INFERENCE_RULES = [
    { regex: /(cerv|pescoc|cabec)/, region: 'CERVICAL' },
    { regex: /(torac|torax)/, region: 'TORACICA' },
    { regex: /(lomb|abdomen)/, region: 'LOMBAR' },
    { regex: /(sacro|iliac|pelve)/, region: 'SACROILIACA' },
    { regex: /(quadril|coxa)/, region: 'QUADRIL' },
    { regex: /(joelho|poplit)/, region: 'JOELHO' },
    { regex: /(tornoz|pe\b|pé)/, region: 'TORNOZELO_PE' },
    { regex: /(ombro|braco|braço)/, region: 'OMBRO' },
    { regex: /(cotovelo)/, region: 'COTOVELO' },
    { regex: /(punho|mao|mão)/, region: 'PUNHO_MAO' },
];
const CHAIN_REGION_MAP = {
    CERVICAL: ['CERVICAL', 'TORACICA', 'OMBRO', 'COTOVELO', 'PUNHO_MAO'],
    TORACICA: ['TORACICA', 'CERVICAL', 'OMBRO', 'LOMBAR'],
    LOMBAR: ['LOMBAR', 'SACROILIACA', 'QUADRIL', 'JOELHO', 'TORNOZELO_PE'],
    SACROILIACA: ['SACROILIACA', 'LOMBAR', 'QUADRIL', 'JOELHO', 'TORNOZELO_PE'],
    QUADRIL: ['QUADRIL', 'SACROILIACA', 'LOMBAR', 'JOELHO', 'TORNOZELO_PE'],
    JOELHO: ['JOELHO', 'QUADRIL', 'SACROILIACA', 'LOMBAR', 'TORNOZELO_PE'],
    TORNOZELO_PE: ['TORNOZELO_PE', 'JOELHO', 'QUADRIL', 'SACROILIACA', 'LOMBAR'],
    OMBRO: ['OMBRO', 'CERVICAL', 'TORACICA', 'COTOVELO', 'PUNHO_MAO'],
    COTOVELO: ['COTOVELO', 'OMBRO', 'PUNHO_MAO', 'CERVICAL'],
    PUNHO_MAO: ['PUNHO_MAO', 'COTOVELO', 'OMBRO', 'CERVICAL'],
};
let CharlesService = class CharlesService {
    pacientesService;
    governanceService;
    anamneseRepository;
    evolucaoRepository;
    laudoRepository;
    openAiService;
    constructor(pacientesService, governanceService, anamneseRepository, evolucaoRepository, laudoRepository, openAiService) {
        this.pacientesService = pacientesService;
        this.governanceService = governanceService;
        this.anamneseRepository = anamneseRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.laudoRepository = laudoRepository;
        this.openAiService = openAiService;
    }
    async getNextAction(pacienteId, usuario) {
        const paciente = await this.pacientesService.findOne(pacienteId, usuario.id);
        const [latestAnamnese, latestEvolucao, latestLaudo, activeProtocol] = await Promise.all([
            this.anamneseRepository.findOne({
                where: { pacienteId: paciente.id },
                order: { createdAt: 'DESC' },
            }),
            this.evolucaoRepository.findOne({
                where: { pacienteId: paciente.id },
                order: { data: 'DESC' },
            }),
            this.laudoRepository.findOne({
                where: { pacienteId: paciente.id },
                order: { updatedAt: 'DESC' },
            }),
            this.getActiveProtocolSafe(usuario),
        ]);
        const hasAnamnese = !!latestAnamnese;
        const hasExameFisico = this.hasStructuredExame(latestLaudo?.exameFisico);
        const hasEvolucao = !!latestEvolucao;
        const laudoValidado = latestLaudo?.status === laudo_entity_1.LaudoStatus.VALIDADO_PROFISSIONAL;
        const hasPlanoOuAlta = !!String(latestLaudo?.criteriosAlta || '').trim();
        const hasCriticalRedFlag = this.hasCriticalRedFlag(latestAnamnese?.redFlags);
        const context = this.buildClinicalContext(latestAnamnese);
        const blockers = [];
        const alerts = [];
        if (hasCriticalRedFlag) {
            blockers.push({
                code: 'RED_FLAG_CRITICA',
                severity: 'CRITICAL',
                message: 'Red flag critica detectada na anamnese. Continuidade do ciclo deve ser bloqueada ate encaminhamento.',
            });
        }
        if ((latestAnamnese?.yellowFlags || []).length >= 2) {
            alerts.push({
                code: 'YELLOW_FLAGS_RELEVANTES',
                severity: 'MEDIUM',
                message: 'Paciente com yellow flags relevantes; manter acompanhamento de adesao e abordagem biopsicossocial.',
            });
        }
        let stages = [
            {
                stage: 'ANAMNESE',
                status: hasAnamnese ? 'COMPLETED' : 'PENDING',
                reason: hasAnamnese
                    ? 'Anamnese registrada.'
                    : 'Ainda nao existe anamnese para este paciente.',
            },
            {
                stage: 'EXAME_FISICO',
                status: hasExameFisico ? 'COMPLETED' : 'PENDING',
                reason: hasExameFisico
                    ? 'Exame fisico estruturado encontrado no laudo mais recente.'
                    : 'Exame fisico ainda nao preenchido.',
            },
            {
                stage: 'EVOLUCAO',
                status: hasEvolucao ? 'COMPLETED' : 'PENDING',
                reason: hasEvolucao
                    ? 'Evolucao registrada.'
                    : 'Sem evolucao registrada para o ciclo atual.',
            },
            {
                stage: 'LAUDO',
                status: laudoValidado ? 'COMPLETED' : 'PENDING',
                reason: laudoValidado
                    ? 'Laudo validado pelo profissional.'
                    : 'Laudo ainda em rascunho ou nao validado.',
            },
            {
                stage: 'PLANO',
                status: hasPlanoOuAlta ? 'COMPLETED' : 'PENDING',
                reason: hasPlanoOuAlta
                    ? 'Plano/criterios de alta definidos.'
                    : 'Defina criterios de alta e plano final do ciclo.',
            },
        ];
        if (hasCriticalRedFlag) {
            stages = stages.map((item) => {
                if (item.status === 'COMPLETED')
                    return item;
                return {
                    ...item,
                    status: 'BLOCKED',
                    reason: 'Etapa bloqueada por red flag critica ate encaminhamento e reavaliacao.',
                };
            });
        }
        const nextAction = this.resolveNextAction({
            hasAnamnese,
            hasExameFisico,
            hasEvolucao,
            laudoValidado,
            hasPlanoOuAlta,
            hasCriticalRedFlag,
        });
        const response = {
            orchestrator: 'CLINICAL_ORCHESTRATOR',
            mode: 'deterministic-v1',
            requiresProfessionalApproval: true,
            protocolVersion: activeProtocol?.version || null,
            protocolName: activeProtocol?.name || null,
            blocked: blockers.length > 0,
            paciente: {
                id: paciente.id,
                nomeCompleto: paciente.nomeCompleto,
            },
            context,
            timeline: {
                anamneseEm: latestAnamnese?.createdAt || null,
                exameFisicoEm: hasExameFisico ? latestLaudo?.updatedAt || null : null,
                evolucaoEm: latestEvolucao?.data || null,
                laudoEm: latestLaudo?.updatedAt || null,
            },
            blockers,
            alerts,
            stages,
            nextAction,
        };
        await this.writeAuditSafe({
            actor: usuario,
            actionType: 'READ',
            action: 'orchestrator.next_action.read',
            resourceType: 'CLINICAL_ORCHESTRATOR',
            resourceId: paciente.id,
            patientId: paciente.id,
            metadata: {
                nextStage: response.nextAction.stage,
                mode: response.mode,
                protocolVersion: response.protocolVersion,
                protocolName: response.protocolName,
            },
        });
        return response;
    }
    async getExameFisicoDorSuggestion(pacienteId, usuario) {
        const paciente = await this.pacientesService.findOne(pacienteId, usuario.id);
        const latestAnamnese = await this.anamneseRepository.findOne({
            where: { pacienteId: paciente.id },
            order: { createdAt: 'DESC' },
        });
        const suggestion = this.inferDorClassificationFromAnamnese(latestAnamnese);
        const activeProtocol = await this.getActiveProtocolSafe(usuario);
        await this.writeAuditSafe({
            actor: usuario,
            actionType: 'READ',
            action: 'orchestrator.ai_suggestion.read',
            resourceType: 'AI_SUGGESTION',
            resourceId: 'EXAME_FISICO:DOR_CLASSIFICATION',
            patientId: paciente.id,
            metadata: {
                stage: 'EXAME_FISICO',
                suggestionType: 'DOR_CLASSIFICATION',
                confidence: suggestion.confidence,
                evidenceFields: suggestion.evidenceFields,
                protocolVersion: activeProtocol?.version || null,
                protocolName: activeProtocol?.name || null,
            },
        });
        return {
            orchestrator: 'CLINICAL_ORCHESTRATOR',
            mode: 'assistive-v1',
            requiresProfessionalApproval: true,
            patientId: paciente.id,
            stage: 'EXAME_FISICO',
            suggestionType: 'DOR_CLASSIFICATION',
            confidence: suggestion.confidence,
            reason: suggestion.reason,
            evidenceFields: suggestion.evidenceFields,
            protocolVersion: activeProtocol?.version || null,
            protocolName: activeProtocol?.name || null,
            dorPrincipal: suggestion.principal,
            dorSubtipo: suggestion.subtipo,
        };
    }
    async getEvolucaoSoapSuggestion(pacienteId, usuario) {
        const paciente = await this.pacientesService.findOne(pacienteId, usuario.id);
        const [latestAnamnese, latestEvolucao, latestLaudo] = await Promise.all([
            this.anamneseRepository.findOne({
                where: { pacienteId: paciente.id },
                order: { createdAt: 'DESC' },
            }),
            this.evolucaoRepository.findOne({
                where: { pacienteId: paciente.id },
                order: { data: 'DESC' },
            }),
            this.laudoRepository.findOne({
                where: { pacienteId: paciente.id },
                order: { updatedAt: 'DESC' },
            }),
        ]);
        const fallbackSuggestion = this.inferEvolucaoSoapSuggestion({
            anamnese: latestAnamnese,
            evolucao: latestEvolucao,
            laudo: latestLaudo,
        });
        const aiSuggestion = await this.generateEvolucaoSoapWithOpenAI({
            paciente,
            anamnese: latestAnamnese,
            evolucao: latestEvolucao,
            laudo: latestLaudo,
            fallback: fallbackSuggestion,
        });
        const suggestion = aiSuggestion
            ? this.mergeSoapSuggestions(fallbackSuggestion, aiSuggestion)
            : fallbackSuggestion;
        const activeProtocol = await this.getActiveProtocolSafe(usuario);
        await this.writeAuditSafe({
            actor: usuario,
            actionType: 'READ',
            action: 'orchestrator.ai_suggestion.read',
            resourceType: 'AI_SUGGESTION',
            resourceId: 'EVOLUCAO:SOAP',
            patientId: paciente.id,
            metadata: {
                stage: 'EVOLUCAO',
                suggestionType: 'EVOLUCAO_SOAP',
                confidence: suggestion.confidence,
                evidenceFields: suggestion.evidenceFields,
                protocolVersion: activeProtocol?.version || null,
                protocolName: activeProtocol?.name || null,
            },
        });
        return {
            orchestrator: 'CLINICAL_ORCHESTRATOR',
            mode: 'assistive-v1',
            requiresProfessionalApproval: true,
            patientId: paciente.id,
            stage: 'EVOLUCAO',
            suggestionType: 'EVOLUCAO_SOAP',
            confidence: suggestion.confidence,
            reason: suggestion.reason,
            evidenceFields: suggestion.evidenceFields,
            protocolVersion: activeProtocol?.version || null,
            protocolName: activeProtocol?.name || null,
            subjetivo: suggestion.subjetivo,
            objetivo: suggestion.objetivo,
            avaliacao: suggestion.avaliacao,
            plano: suggestion.plano,
        };
    }
    async getActiveProtocolSafe(usuario) {
        try {
            const protocol = await this.governanceService.getActiveProtocol(usuario);
            if (!protocol)
                return null;
            return {
                version: protocol.version,
                name: protocol.name,
            };
        }
        catch {
            return null;
        }
    }
    async writeAuditSafe(payload) {
        try {
            await this.governanceService.writeAudit(payload);
        }
        catch {
        }
    }
    hasStructuredExame(raw) {
        const value = String(raw || '').trim();
        if (!value)
            return false;
        return value.startsWith(STRUCTURED_EXAME_PREFIX) || value.length > 20;
    }
    resolveNextAction(args) {
        if (args.hasCriticalRedFlag) {
            return {
                stage: 'MONITORAMENTO',
                reason: 'Red flag critica detectada.',
                guidance: 'Interromper continuidade do fluxo e encaminhar paciente para avaliacao medica/servico de urgencia conforme protocolo.',
            };
        }
        if (!args.hasAnamnese) {
            return {
                stage: 'ANAMNESE',
                reason: 'Sem anamnese registrada.',
                guidance: 'Registrar anamnese completa para iniciar o ciclo clinico.',
            };
        }
        if (!args.hasExameFisico) {
            return {
                stage: 'EXAME_FISICO',
                reason: 'Sem exame fisico estruturado.',
                guidance: 'Preencher exame fisico orientado por regiao e cadeia relacionada.',
            };
        }
        if (!args.hasEvolucao) {
            return {
                stage: 'EVOLUCAO',
                reason: 'Sem evolucao clinica apos exame.',
                guidance: 'Registrar evolucao inicial e check-in da sessao.',
            };
        }
        if (!args.laudoValidado) {
            return {
                stage: 'LAUDO',
                reason: 'Laudo ainda nao validado.',
                guidance: 'Revisar e validar laudo/plano com aprovacao profissional.',
            };
        }
        if (!args.hasPlanoOuAlta) {
            return {
                stage: 'PLANO',
                reason: 'Plano final sem criterios de alta.',
                guidance: 'Definir criterios de alta e direcionamento do plano.',
            };
        }
        return {
            stage: 'MONITORAMENTO',
            reason: 'Ciclo clinico concluido.',
            guidance: 'Manter monitoramento por check-ins e reavaliacao conforme necessidade.',
        };
    }
    hasCriticalRedFlag(redFlags) {
        if (!Array.isArray(redFlags) || redFlags.length === 0)
            return false;
        const ignored = new Set([
            'SEM_RED_FLAG_CRITICA',
            'NO_RED_FLAG',
            'NONE',
            'NENHUMA',
            'NAO',
            'NÃO',
            'NAO_INFORMADO',
            'NÃO_INFORMADO',
        ]);
        return redFlags.some((item) => {
            const raw = String(item || '').trim();
            if (!raw)
                return false;
            const normalized = raw
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '_')
                .toUpperCase();
            return !ignored.has(normalized);
        });
    }
    buildClinicalContext(anamnese) {
        const regioesSet = new Set();
        for (const area of anamnese?.areasAfetadas || []) {
            const raw = String(area.regiao || '').trim();
            const normalized = this.normalizeClinicalRegion(raw);
            if (normalized)
                regioesSet.add(normalized);
        }
        const regioes = Array.from(regioesSet);
        const regiaoKey = regioes.join(' ').toLowerCase();
        let cadeiaProvavel = null;
        if (/(lombar|sacroiliaca|quadril|joelho|tornozelo_pe)/.test(regiaoKey)) {
            cadeiaProvavel = 'CADEIA_LOWER';
        }
        else if (/(cervical|ombro|cotovelo|punho_mao|toracica)/.test(regiaoKey)) {
            cadeiaProvavel = 'CADEIA_UPPER';
        }
        else if (regioes.length > 0) {
            cadeiaProvavel = 'CADEIA_LOCAL';
        }
        const relacionadas = new Set();
        for (const regiao of regioes) {
            for (const related of CHAIN_REGION_MAP[regiao] || [regiao]) {
                relacionadas.add(related);
            }
        }
        return {
            regioesPrioritarias: regioes,
            regioesRelacionadas: Array.from(relacionadas),
            cadeiaProvavel,
        };
    }
    normalizeClinicalRegion(rawRegion) {
        const normalized = String(rawRegion || '')
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
        if (!normalized)
            return null;
        if (CLINICAL_REGION_KEYS.includes(normalized)) {
            return normalized;
        }
        if (normalized === 'SACRO' ||
            normalized === 'ILIACO' ||
            normalized === 'PELVIS') {
            return 'SACROILIACA';
        }
        if (normalized === 'PUNHO' || normalized === 'MAO') {
            return 'PUNHO_MAO';
        }
        if (normalized === 'TORNOZELO' || normalized === 'PE') {
            return 'TORNOZELO_PE';
        }
        const lower = normalized.toLowerCase();
        for (const rule of REGION_INFERENCE_RULES) {
            if (rule.regex.test(lower))
                return rule.region;
        }
        return null;
    }
    inferDorClassificationFromAnamnese(anamnese) {
        if (!anamnese) {
            return {
                principal: null,
                subtipo: null,
                confidence: 'BAIXA',
                reason: 'Sem anamnese disponivel para inferencia.',
                evidenceFields: [],
            };
        }
        if (anamnese.tipoDor === anamnese_entity_1.TipoDor.NEUROPATICA) {
            return {
                principal: 'NEUROPATICA',
                subtipo: 'NEURAL',
                confidence: 'ALTA',
                reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
                evidenceFields: ['tipoDor'],
            };
        }
        if (anamnese.tipoDor === anamnese_entity_1.TipoDor.INFLAMATORIA) {
            return {
                principal: 'INFLAMATORIA',
                subtipo: 'INFLAMATORIA',
                confidence: 'ALTA',
                reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
                evidenceFields: ['tipoDor'],
            };
        }
        if (anamnese.tipoDor === anamnese_entity_1.TipoDor.MECANICA) {
            return {
                principal: 'NOCICEPTIVA',
                subtipo: 'MECANICA',
                confidence: 'ALTA',
                reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
                evidenceFields: ['tipoDor'],
            };
        }
        if (anamnese.tipoDor === anamnese_entity_1.TipoDor.MISTA) {
            return {
                principal: 'NOCIPLASTICA',
                subtipo: 'MIOFASCIAL',
                confidence: 'ALTA',
                reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
                evidenceFields: ['tipoDor'],
            };
        }
        const normalizeText = (value) => String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        const hasAny = (value, tokens) => tokens.some((token) => value.includes(token));
        const sintomas = normalizeText(anamnese.descricaoSintomas);
        const piora = normalizeText(anamnese.fatoresPiora);
        const atividadesPiora = normalizeText(anamnese.atividadesQuePioram);
        const alivio = normalizeText(anamnese.fatorAlivio);
        const sinaisCentral = normalizeText(anamnese.sinaisSensibilizacaoCentral);
        const evento = normalizeText(anamnese.eventoEspecifico);
        const lesoesPrevias = normalizeText(anamnese.lesoesPrevias);
        const sono = normalizeText(anamnese.horasSonoMedia);
        const observacoesEstiloVida = normalizeText(anamnese.observacoesEstiloVida);
        const yellowFlags = (anamnese.yellowFlags || [])
            .map((flag) => normalizeText(flag))
            .join(' ');
        const affectedAreas = anamnese.areasAfetadas || [];
        const hasIrradiacao = anamnese.irradiacao === true ||
            String(anamnese.localIrradiacao || '').trim().length > 0;
        const hasInflammatoryBehavior = anamnese.dorRepouso === true || anamnese.dorNoturna === true;
        const nociceptiveEvidence = [];
        const neuropathicEvidence = [];
        const nociplasticEvidence = [];
        const fenotipoDorEvidencias = anamnese.fenotipoDorEvidencias || {};
        const hasFenotipoEvidence = (key) => fenotipoDorEvidencias[key] === true;
        if (hasFenotipoEvidence('dorLocalizada')) {
            nociceptiveEvidence.push('dor localizada');
        }
        if (hasFenotipoEvidence('pioraMovimentoEsforco')) {
            nociceptiveEvidence.push('piora com movimento/esforco');
        }
        if (hasFenotipoEvidence('melhoraRepouso')) {
            nociceptiveEvidence.push('melhora com repouso');
        }
        if (hasFenotipoEvidence('inicioAposEsforcoLesao')) {
            nociceptiveEvidence.push('inicio apos esforco/lesao');
        }
        if (hasFenotipoEvidence('dorReproduzidaPalpacao')) {
            nociceptiveEvidence.push('dor reproduzida por pressao/palpacao');
        }
        if (hasFenotipoEvidence('irradiacaoTrajeto')) {
            neuropathicEvidence.push('dor irradiada');
        }
        if (hasFenotipoEvidence('choqueFormigamentoQueimacao')) {
            neuropathicEvidence.push('choque/formigamento/queimacao');
        }
        if (hasFenotipoEvidence('dormenciaAlteracaoToque')) {
            neuropathicEvidence.push('dormencia ou alteracao ao toque');
        }
        if (hasFenotipoEvidence('pioraPosicaoNeural')) {
            neuropathicEvidence.push('piora com posicoes especificas');
        }
        if (hasFenotipoEvidence('dorMultirregionalMigratoria')) {
            nociplasticEvidence.push('dor difusa/multirregional');
        }
        if (hasFenotipoEvidence('dorDesproporcionalPersistente')) {
            nociplasticEvidence.push('dor desproporcional ou persistente');
        }
        if (hasFenotipoEvidence('sonoRuimNaoReparador')) {
            nociplasticEvidence.push('sono ruim/nao reparador');
        }
        if (hasFenotipoEvidence('cansacoFrequente')) {
            nociplasticEvidence.push('cansaco/fadiga frequente');
        }
        if (hasFenotipoEvidence('estresseElevado')) {
            nociplasticEvidence.push('estresse elevado');
        }
        if (hasFenotipoEvidence('examesNormaisDorPersistente')) {
            nociplasticEvidence.push('exames normais com dor persistente');
        }
        if (affectedAreas.length === 1 ||
            hasAny(sintomas, ['localiz', 'pontual', 'exatamente onde', 'apontar'])) {
            nociceptiveEvidence.push('dor localizada');
        }
        if (hasAny(`${piora} ${atividadesPiora}`, [
            'moviment',
            'esforc',
            'carga',
            'agach',
            'correr',
            'saltar',
            'subir escada',
            'levantar peso',
        ])) {
            nociceptiveEvidence.push('piora com movimento/esforco');
        }
        if (hasAny(alivio, ['repous', 'descans', 'parar', 'sem carga'])) {
            nociceptiveEvidence.push('melhora com repouso');
        }
        if (String(anamnese.inicioProblema) === 'APOS_EVENTO' ||
            String(anamnese.mecanismoLesao) === 'TRAUMA' ||
            String(anamnese.mecanismoLesao) === 'SOBRECARGA' ||
            hasAny(`${evento} ${lesoesPrevias}`, [
                'trauma',
                'queda',
                'torcao',
                'lesao',
                'esforc',
                'sobrecarga',
            ])) {
            nociceptiveEvidence.push('inicio apos esforco/lesao');
        }
        if (hasAny(sintomas, ['apert', 'pressao', 'palpac', 'toque reproduz'])) {
            nociceptiveEvidence.push('dor reproduzida por pressao/palpacao');
        }
        if (hasIrradiacao) {
            neuropathicEvidence.push('dor irradiada');
        }
        if (hasAny(`${sintomas} ${piora}`, [
            'choque',
            'formig',
            'queima',
            'dorm',
            'parestes',
            'agulhada',
        ])) {
            neuropathicEvidence.push('choque/formigamento/queimacao/dormencia');
        }
        if (hasAny(`${sintomas} ${piora}`, [
            'desce',
            'sobe',
            'corre',
            'irradia',
            'braco',
            'perna',
        ])) {
            neuropathicEvidence.push('trajeto neural referido');
        }
        if (hasAny(`${piora} ${atividadesPiora}`, [
            'sentar',
            'dobrar',
            'virar',
            'flexao',
            'extensao',
            'postura',
        ])) {
            neuropathicEvidence.push('piora com posicoes especificas');
        }
        if (affectedAreas.length > 1 ||
            hasAny(`${sintomas} ${sinaisCentral}`, [
                'dor difusa',
                'dor generalizada',
                'varias regioes',
                'muda de lugar',
                'migratoria',
            ])) {
            nociplasticEvidence.push('dor difusa/multirregional');
        }
        if (hasAny(`${sintomas} ${sinaisCentral}`, [
            'desproporcional',
            'maior do que o esperado',
            'nao melhora',
            'persistente',
            'sensibilizacao',
            'hipersens',
        ])) {
            nociplasticEvidence.push('dor desproporcional ou persistente');
        }
        if ((typeof anamnese.qualidadeSono === 'number' &&
            anamnese.qualidadeSono <= 4) ||
            hasAny(`${sono} ${observacoesEstiloVida}`, [
                'sono ruim',
                'acorda cansado',
                'insonia',
            ])) {
            nociplasticEvidence.push('sono ruim/nao reparador');
        }
        if ((typeof anamnese.nivelEstresse === 'number' &&
            anamnese.nivelEstresse >= 7) ||
            (typeof anamnese.energiaDiaria === 'number' &&
                anamnese.energiaDiaria <= 4) ||
            hasAny(`${sinaisCentral} ${yellowFlags} ${observacoesEstiloVida}`, [
                'estresse',
                'cansaco',
                'fadiga',
                'catastrof',
                'medo',
            ])) {
            nociplasticEvidence.push('estresse/fadiga/yellow flags');
        }
        if (hasAny(`${sintomas} ${sinaisCentral}`, ['exame normal', 'exames normais'])) {
            nociplasticEvidence.push('exames normais com dor persistente');
        }
        const candidates = [
            {
                principal: 'NOCICEPTIVA',
                subtipo: 'MECANICA',
                evidence: nociceptiveEvidence,
                reason: 'Fenotipo mecanico: terapia manual, carga progressiva e controle inflamatorio conforme irritabilidade.',
                fields: [
                    'areasAfetadas',
                    'descricaoSintomas',
                    'fatoresPiora',
                    'fatorAlivio',
                    'inicioProblema',
                    'mecanismoLesao',
                    'fenotipoDorEvidencias',
                ],
            },
            {
                principal: 'NEUROPATICA',
                subtipo: 'NEURAL',
                evidence: neuropathicEvidence,
                reason: 'Fenotipo neural: terapia manual, mobilizacao neural, descompressao e modulacao conforme exame fisico.',
                fields: [
                    'irradiacao',
                    'localIrradiacao',
                    'descricaoSintomas',
                    'fatoresPiora',
                    'fenotipoDorEvidencias',
                ],
            },
            {
                principal: 'NOCIPLASTICA',
                subtipo: 'MIOFASCIAL',
                evidence: nociplasticEvidence,
                reason: 'Fenotipo de modulacao central: educacao em dor, exercicio graduado e estrategias de regulacao do sistema nervoso.',
                fields: [
                    'sinaisSensibilizacaoCentral',
                    'descricaoSintomas',
                    'qualidadeSono',
                    'nivelEstresse',
                    'energiaDiaria',
                    'yellowFlags',
                    'fenotipoDorEvidencias',
                ],
            },
        ].sort((a, b) => b.evidence.length - a.evidence.length);
        const best = candidates[0];
        const second = candidates[1];
        if (best.evidence.length >= 2 &&
            best.evidence.length > second.evidence.length) {
            return {
                principal: best.principal,
                subtipo: best.subtipo,
                confidence: best.evidence.length >= 4 ? 'ALTA' : 'MODERADA',
                reason: `${best.reason} Evidencias: ${best.evidence.join('; ')}.`,
                evidenceFields: best.fields,
            };
        }
        if (best.evidence.length >= 2 &&
            best.evidence.length === second.evidence.length) {
            return {
                principal: 'NOCIPLASTICA',
                subtipo: 'MIOFASCIAL',
                confidence: 'MODERADA',
                reason: `Fenotipo misto/inconsistente com sinais de sensibilizacao. Integrar exame fisico antes de fechar conduta. Evidencias: ${best.evidence
                    .concat(second.evidence)
                    .join('; ')}.`,
                evidenceFields: Array.from(new Set(best.fields.concat(second.fields))),
            };
        }
        if (hasInflammatoryBehavior ||
            sintomas.includes('rigidez matinal') ||
            sinaisCentral.includes('inflama')) {
            return {
                principal: 'INFLAMATORIA',
                subtipo: 'INFLAMATORIA',
                confidence: 'MODERADA',
                reason: 'Padrao em repouso/noturno sugere componente inflamatorio.',
                evidenceFields: ['dorRepouso', 'dorNoturna', 'descricaoSintomas'],
            };
        }
        if (piora.length > 0 || alivio.length > 0) {
            return {
                principal: 'NOCICEPTIVA',
                subtipo: 'MECANICA',
                confidence: 'MODERADA',
                reason: 'Fatores de piora/alivio com movimento sugerem dor mecanica.',
                evidenceFields: ['fatoresPiora', 'fatorAlivio'],
            };
        }
        return {
            principal: null,
            subtipo: null,
            confidence: 'BAIXA',
            reason: 'Dados insuficientes na anamnese para sugerir classificacao com seguranca.',
            evidenceFields: [],
        };
    }
    async generateEvolucaoSoapWithOpenAI(args) {
        if (!this.openAiService?.isConfigured())
            return null;
        if (!this.openAiService.isEnabled('OPENAI_CHARLES_AI_ENABLED', true)) {
            return null;
        }
        const model = this.openAiService.resolveModel(['OPENAI_CHARLES_MODEL', 'OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'], 'gpt-5-mini');
        const timeoutMs = this.openAiService.getPositiveIntegerEnv('OPENAI_CHARLES_TIMEOUT_MS', 12000, 120000);
        const systemPrompt = 'Voce e Charles, um assistente clinico de apoio a fisioterapeutas. Gere sugestoes SOAP prudentes, rastreaveis e revisaveis. Nao invente dados ausentes e nunca substitua validacao profissional.';
        const userPrompt = `
Retorne SOMENTE JSON valido com as chaves:
confidence ("BAIXA" | "MODERADA" | "ALTA"),
reason (string ate 240 caracteres),
evidenceFields (array de strings escolhidas dos campos do contexto),
subjetivo (string ou null),
objetivo (string ou null),
avaliacao (string ou null),
plano (string ou null).

Regras:
- Escreva em portugues do Brasil, direto para o prontuario do profissional.
- Use SOAP: S deve refletir relato/sintomas; O deve pedir ou registrar medidas objetivas; A deve correlacionar evolucao, irritabilidade, funcao e hipotese; P deve orientar proxima conduta.
- Se houver sinais de alerta ou lacunas, registre no campo avaliacao ou plano de forma prudente.
- Nao use nome do paciente, nao prometa cura e nao mencione que foi gerado por IA.
- Se os dados forem insuficientes, retorne confidence "BAIXA" e mantenha null nos campos que nao puder sustentar.
- Preserve revisao profissional: textos devem ser rascunhos editaveis.

Contexto clinico:
${JSON.stringify(this.buildEvolucaoSoapAiContext(args), null, 2)}
`;
        const response = await this.openAiService.createJsonResponse({
            model,
            systemPrompt,
            userContent: userPrompt,
            temperature: 0.2,
            timeoutMs,
            operation: 'charles.evolucao_soap',
        });
        if (!response)
            return null;
        return this.sanitizeAiSoapSuggestion(response.parsed);
    }
    buildEvolucaoSoapAiContext(args) {
        const anamnese = args.anamnese;
        const evolucao = args.evolucao;
        const laudo = args.laudo;
        return {
            paciente: {
                idade: this.getAgeInYears(args.paciente.dataNascimento),
                sexo: args.paciente.sexo || null,
                profissao: this.truncateClinicalText(args.paciente.profissao, 120),
            },
            anamnese: anamnese
                ? {
                    motivoBusca: this.truncateClinicalText(anamnese.motivoBusca, 500),
                    areasAfetadas: anamnese.areasAfetadas || [],
                    intensidadeDor: anamnese.intensidadeDor,
                    descricaoSintomas: this.truncateClinicalText(anamnese.descricaoSintomas, 900),
                    inicioProblema: anamnese.inicioProblema || null,
                    mecanismoLesao: anamnese.mecanismoLesao || null,
                    fatorAlivio: this.truncateClinicalText(anamnese.fatorAlivio, 500),
                    fatoresPiora: this.truncateClinicalText(anamnese.fatoresPiora, 500),
                    atividadesQuePioram: this.truncateClinicalText(anamnese.atividadesQuePioram, 500),
                    limitacoesFuncionais: this.truncateClinicalText(anamnese.limitacoesFuncionais, 700),
                    metaPrincipalPaciente: this.truncateClinicalText(anamnese.metaPrincipalPaciente, 500),
                    tipoDor: anamnese.tipoDor || null,
                    irradiacao: anamnese.irradiacao,
                    localIrradiacao: this.truncateClinicalText(anamnese.localIrradiacao, 300),
                    redFlags: anamnese.redFlags || [],
                    yellowFlags: anamnese.yellowFlags || [],
                    qualidadeSono: anamnese.qualidadeSono,
                    nivelEstresse: anamnese.nivelEstresse,
                }
                : null,
            evolucaoAnterior: evolucao
                ? {
                    data: evolucao.data,
                    subjetivo: this.truncateClinicalText(evolucao.subjetivo, 700),
                    objetivo: this.truncateClinicalText(evolucao.objetivo, 700),
                    avaliacao: this.truncateClinicalText(evolucao.avaliacao, 700),
                    plano: this.truncateClinicalText(evolucao.plano, 700),
                    checkinDor: evolucao.checkinDor,
                    checkinDificuldade: evolucao.checkinDificuldade,
                    dorStatus: evolucao.dorStatus,
                    funcaoStatus: evolucao.funcaoStatus,
                    adesaoStatus: evolucao.adesaoStatus,
                    statusEvolucao: evolucao.statusEvolucao,
                    condutaStatus: evolucao.condutaStatus,
                    observacoes: this.truncateClinicalText(evolucao.observacoes, 700),
                }
                : null,
            laudo: laudo
                ? {
                    diagnosticoFuncional: this.truncateClinicalText(laudo.diagnosticoFuncional, 900),
                    condutas: this.truncateClinicalText(laudo.condutas, 900),
                    planoTratamentoIA: this.truncateClinicalText(laudo.planoTratamentoIA, 900),
                    criteriosAlta: this.truncateClinicalText(laudo.criteriosAlta, 700),
                    exameFisico: this.truncateClinicalText(laudo.exameFisico, 1400),
                    status: laudo.status,
                }
                : null,
            sugestaoDeterministicaFallback: args.fallback,
            camposPermitidosParaEvidenceFields: [
                'anamnese.descricaoSintomas',
                'anamnese.areasAfetadas',
                'anamnese.intensidadeDor',
                'anamnese.fatoresPiora',
                'anamnese.fatorAlivio',
                'anamnese.limitacoesFuncionais',
                'anamnese.metaPrincipalPaciente',
                'anamnese.redFlags',
                'anamnese.yellowFlags',
                'evolucaoAnterior',
                'laudo.diagnosticoFuncional',
                'laudo.exameFisico',
                'laudo.condutas',
                'laudo.planoTratamentoIA',
            ],
        };
    }
    sanitizeAiSoapSuggestion(parsed) {
        const subjetivo = this.normalizeAiText(parsed.subjetivo, 900);
        const objetivo = this.normalizeAiText(parsed.objetivo, 900);
        const avaliacao = this.normalizeAiText(parsed.avaliacao, 900);
        const plano = this.normalizeAiText(parsed.plano, 900);
        if (!subjetivo && !objetivo && !avaliacao && !plano)
            return null;
        return {
            confidence: this.normalizeConfidence(parsed.confidence),
            reason: this.normalizeAiText(parsed.reason, 240) ||
                'Sugestao SOAP contextual baseada nos dados clinicos disponiveis.',
            evidenceFields: this.normalizeEvidenceFields(parsed.evidenceFields),
            subjetivo,
            objetivo,
            avaliacao,
            plano,
        };
    }
    mergeSoapSuggestions(fallback, aiSuggestion) {
        return {
            confidence: aiSuggestion.confidence || fallback.confidence,
            reason: aiSuggestion.reason || fallback.reason,
            evidenceFields: Array.from(new Set([...aiSuggestion.evidenceFields, ...fallback.evidenceFields])).slice(0, 10),
            subjetivo: aiSuggestion.subjetivo || fallback.subjetivo,
            objetivo: aiSuggestion.objetivo || fallback.objetivo,
            avaliacao: aiSuggestion.avaliacao || fallback.avaliacao,
            plano: aiSuggestion.plano || fallback.plano,
        };
    }
    normalizeAiText(value, maxLen) {
        if (typeof value !== 'string')
            return null;
        const normalized = value
            .trim()
            .replace(/\s+\n/g, '\n')
            .replace(/[ \t]+/g, ' ');
        if (!normalized)
            return null;
        return normalized.slice(0, maxLen);
    }
    truncateClinicalText(value, maxLen) {
        if (typeof value !== 'string')
            return null;
        const normalized = value.trim();
        if (!normalized)
            return null;
        return normalized.slice(0, maxLen);
    }
    normalizeConfidence(value) {
        const normalized = String(value || '')
            .trim()
            .toUpperCase();
        if (normalized === 'ALTA')
            return 'ALTA';
        if (normalized === 'MODERADA')
            return 'MODERADA';
        return 'BAIXA';
    }
    normalizeEvidenceFields(value) {
        if (!Array.isArray(value))
            return [];
        return value
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 8);
    }
    getAgeInYears(dataNascimento) {
        if (!dataNascimento)
            return null;
        const birth = new Date(dataNascimento);
        if (Number.isNaN(birth.getTime()))
            return null;
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        const dayDiff = now.getDate() - birth.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age -= 1;
        }
        return age;
    }
    inferEvolucaoSoapSuggestion(args) {
        const anamnese = args.anamnese;
        const evolucao = args.evolucao;
        const laudo = args.laudo;
        const queixa = String(anamnese?.descricaoSintomas || '').trim() ||
            String(anamnese?.metaPrincipalPaciente || '').trim();
        const piora = String(anamnese?.fatoresPiora || '').trim();
        const alivio = String(anamnese?.fatorAlivio || '').trim();
        const areas = (anamnese?.areasAfetadas || [])
            .map((a) => String(a.regiao || '').trim())
            .filter(Boolean);
        const exameTemplated = this.hasStructuredExame(laudo?.exameFisico);
        const hadPreviousEvolution = !!evolucao;
        if (!queixa && !areas.length && !exameTemplated) {
            return {
                confidence: 'BAIXA',
                reason: 'Dados insuficientes (anamnese e exame fisico) para sugerir preenchimento de evolucao.',
                evidenceFields: [],
                subjetivo: null,
                objetivo: null,
                avaliacao: null,
                plano: null,
            };
        }
        const regionHint = areas.length
            ? `regiao ${areas.join(', ')}`
            : 'regiao principal';
        const dorHint = queixa ? queixa : 'queixa relatada pelo paciente';
        const subjetivo = hadPreviousEvolution
            ? 'Paciente refere evolucao em relacao a sessao anterior; validar tolerancia funcional e sintomas residuais.'
            : `Paciente relata ${dorHint}${piora ? `. Piora com ${piora}` : ''}${alivio ? ` e alivio com ${alivio}` : ''}.`;
        const objetivo = exameTemplated
            ? `Reavaliar achados objetivos da ${regionHint}, comparar ADM/forca/testes funcionais com baseline do exame fisico.`
            : `Registrar medidas objetivas da ${regionHint} (ADM, forca, teste funcional e dor evocada).`;
        const avaliacao = hadPreviousEvolution
            ? 'Evolucao clinica em acompanhamento; confirmar se houve ganho funcional e reducao da irritabilidade.'
            : 'Quadro em fase inicial de evolucao; correlacionar resposta da sessao com hipotese funcional.';
        const plano = 'Manter conduta ativa com progressao graduada, reforcar orientacoes domiciliares e agendar nova reavaliacao.';
        const evidenceFields = [];
        if (queixa)
            evidenceFields.push('queixaPrincipal/descricaoSintomas');
        if (areas.length)
            evidenceFields.push('areasAfetadas');
        if (piora)
            evidenceFields.push('fatoresPiora');
        if (alivio)
            evidenceFields.push('fatorAlivio');
        if (exameTemplated)
            evidenceFields.push('laudo.exameFisico');
        if (hadPreviousEvolution)
            evidenceFields.push('evolucaoAnterior');
        return {
            confidence: evidenceFields.length >= 3 ? 'MODERADA' : 'BAIXA',
            reason: 'Sugestao textual de evolucao (SOAP) baseada em anamnese, exame fisico e historico mais recente.',
            evidenceFields,
            subjetivo,
            objetivo,
            avaliacao,
            plano,
        };
    }
};
exports.CharlesService = CharlesService;
exports.CharlesService = CharlesService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(anamnese_entity_1.Anamnese)),
    __param(3, (0, typeorm_1.InjectRepository)(evolucao_entity_1.Evolucao)),
    __param(4, (0, typeorm_1.InjectRepository)(laudo_entity_1.Laudo)),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [pacientes_service_1.PacientesService,
        clinical_governance_service_1.ClinicalGovernanceService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        openai_service_1.OpenAiService])
], CharlesService);
//# sourceMappingURL=charles.service.js.map