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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaudosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pdfkit_1 = __importDefault(require("pdfkit"));
const laudo_entity_1 = require("./entities/laudo.entity");
const laudo_entity_2 = require("./entities/laudo.entity");
const pacientes_service_1 = require("../pacientes/pacientes.service");
const anamnese_entity_1 = require("../anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("../evolucoes/entities/evolucao.entity");
const laudo_ai_generation_entity_1 = require("./entities/laudo-ai-generation.entity");
const laudo_patch_util_1 = require("./laudo-patch.util");
const usuarios_service_1 = require("../usuarios/usuarios.service");
const paciente_exame_entity_1 = require("../pacientes/entities/paciente-exame.entity");
const exame_storage_1 = require("../pacientes/exame-storage");
let LaudosService = class LaudosService {
    laudoRepository;
    anamneseRepository;
    evolucaoRepository;
    laudoAiGenerationRepository;
    pacienteExameRepository;
    pacientesService;
    usuariosService;
    isTruthyEnv(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return ['1', 'true', 'yes', 'on'].includes(normalized);
    }
    shouldUseExamAi() {
        const raw = process.env.OPENAI_EXAM_AI_ENABLED;
        if (raw == null || String(raw).trim() === '')
            return true;
        return this.isTruthyEnv(raw);
    }
    constructor(laudoRepository, anamneseRepository, evolucaoRepository, laudoAiGenerationRepository, pacienteExameRepository, pacientesService, usuariosService) {
        this.laudoRepository = laudoRepository;
        this.anamneseRepository = anamneseRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.laudoAiGenerationRepository = laudoAiGenerationRepository;
        this.pacienteExameRepository = pacienteExameRepository;
        this.pacientesService = pacientesService;
        this.usuariosService = usuariosService;
    }
    async getSuggestedReferences(pacienteId, usuarioId) {
        await this.pacientesService.findOne(pacienteId, usuarioId);
        const latestAnamnese = await this.anamneseRepository.findOne({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
        const profile = this.inferReferenceProfile(latestAnamnese);
        const catalog = this.getReferenceCatalog();
        const byProfile = catalog[profile];
        return {
            profile,
            disclaimer: 'Referências sugeridas para apoio à decisão clínica. Não substituem avaliação, raciocínio clínico e validação profissional.',
            laudoReferences: byProfile.laudoReferences,
            planoReferences: byProfile.planoReferences,
        };
    }
    async create(createLaudoDto, usuarioId) {
        await this.pacientesService.findOne(createLaudoDto.pacienteId, usuarioId);
        this.validateStructuredExameInput(createLaudoDto.exameFisico);
        const existing = await this.laudoRepository.findOne({
            where: { pacienteId: createLaudoDto.pacienteId },
        });
        if (existing) {
            throw new common_1.BadRequestException('Ja existe laudo para este paciente');
        }
        const hasSuggestionMeta = createLaudoDto.sugestaoSource ||
            typeof createLaudoDto.examesConsiderados === 'number' ||
            typeof createLaudoDto.examesComLeituraIa === 'number';
        const laudo = this.laudoRepository.create({
            ...createLaudoDto,
            status: laudo_entity_2.LaudoStatus.RASCUNHO_IA,
            validadoPorUsuarioId: null,
            validadoEm: null,
            sugestaoGeradaEm: hasSuggestionMeta ? new Date() : null,
        });
        return this.laudoRepository.save(laudo);
    }
    async findByPaciente(pacienteId, usuarioId, autoGenerate = false) {
        await this.pacientesService.findOne(pacienteId, usuarioId);
        const existing = await this.laudoRepository.findOne({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
        if (existing || !autoGenerate) {
            return existing;
        }
        return this.generateAndSaveByPaciente(pacienteId, usuarioId);
    }
    async findOne(id, usuarioId) {
        const laudo = await this.laudoRepository.findOne({
            where: { id },
            relations: ['paciente'],
        });
        if (!laudo) {
            throw new common_1.NotFoundException('Laudo nao encontrado');
        }
        if (laudo.paciente.usuarioId !== usuarioId) {
            throw new common_1.NotFoundException('Laudo nao encontrado');
        }
        return laudo;
    }
    async findLatestByPacienteUsuario(usuarioId) {
        const laudo = await this.laudoRepository
            .createQueryBuilder('laudo')
            .leftJoinAndSelect('laudo.paciente', 'paciente')
            .where('paciente.paciente_usuario_id = :usuarioId', { usuarioId })
            .andWhere('paciente.ativo = :ativo', { ativo: true })
            .orderBy('laudo.updatedAt', 'DESC')
            .getOne();
        if (!laudo) {
            throw new common_1.NotFoundException('Laudo nao encontrado para este paciente');
        }
        return laudo;
    }
    async update(id, updateLaudoDto, usuarioId) {
        const laudo = await this.findOne(id, usuarioId);
        this.validateStructuredExameInput(updateLaudoDto.exameFisico);
        const hasSuggestionMetaUpdate = updateLaudoDto.sugestaoSource ||
            typeof updateLaudoDto.examesConsiderados === 'number' ||
            typeof updateLaudoDto.examesComLeituraIa === 'number';
        Object.assign(laudo, (0, laudo_patch_util_1.sanitizePartialUpdate)(updateLaudoDto));
        if (hasSuggestionMetaUpdate) {
            laudo.sugestaoGeradaEm = new Date();
        }
        laudo.status = laudo_entity_2.LaudoStatus.RASCUNHO_IA;
        laudo.validadoPorUsuarioId = null;
        laudo.validadoEm = null;
        return this.laudoRepository.save(laudo);
    }
    async remove(id, usuarioId) {
        const laudo = await this.findOne(id, usuarioId);
        await this.laudoRepository.remove(laudo);
    }
    async validarLaudo(id, usuarioId) {
        const laudo = await this.findOne(id, usuarioId);
        laudo.status = laudo_entity_2.LaudoStatus.VALIDADO_PROFISSIONAL;
        laudo.validadoPorUsuarioId = usuarioId;
        laudo.validadoEm = new Date();
        return this.laudoRepository.save(laudo);
    }
    async buildPdfBuffer(id, usuarioId, tipo, options) {
        const laudo = await this.findOne(id, usuarioId);
        const paciente = await this.pacientesService.findOne(laudo.pacienteId, usuarioId);
        const profissional = await this.usuariosService.findById(usuarioId);
        const profissionalConselho = profissional.conselhoProf ||
            (profissional.conselhoSigla && profissional.conselhoUf
                ? `${profissional.conselhoSigla}-${profissional.conselhoUf}`
                : '-');
        const profissionalRegistro = profissional.registroProf || '-';
        const chunks = [];
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50, compress: false });
        doc.font('Helvetica');
        doc.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        const done = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
        const emittedAt = new Date();
        const statusText = laudo.status === laudo_entity_2.LaudoStatus.VALIDADO_PROFISSIONAL
            ? 'Validado pelo profissional'
            : 'Rascunho IA';
        doc.save();
        doc.lineWidth(1).strokeColor('#D1D5DB').rect(35, 35, 525, 770).stroke();
        doc.restore();
        doc.rect(35, 35, 525, 75).fill('#14532D');
        doc.fillColor('#FFFFFF').fontSize(18).text('Synap', 50, 58);
        doc
            .fontSize(10)
            .fillColor('#DCFCE7')
            .text('Documento clinico', 50, 82);
        doc.fillColor('#111827').fontSize(17).text(tipo === 'laudo' ? 'Laudo do Paciente' : 'Plano de Tratamento', 50, 130);
        doc
            .lineWidth(0.5)
            .strokeColor('#E5E7EB')
            .moveTo(50, 155)
            .lineTo(540, 155)
            .stroke();
        doc
            .fontSize(10.5)
            .fillColor('#374151')
            .text(`Paciente: ${paciente.nomeCompleto}`, 50, 170)
            .text(`Data de emissao: ${emittedAt.toLocaleDateString('pt-BR')}`, 50, 186)
            .text(`Status: ${statusText}`, 300, 170)
            .text(`Profissional: ${profissional.nome}`, 300, 186)
            .text(`Conselho: ${profissionalConselho}`, 300, 202)
            .text(`Registro profissional: ${profissionalRegistro}`, 300, 218);
        doc.moveDown(3.2);
        doc.fillColor('#000');
        if (tipo === 'laudo') {
            this.addSection(doc, 'Diagnostico Funcional', laudo.diagnosticoFuncional);
            if (laudo.exameFisico) {
                this.addSection(doc, 'Exame Fisico', this.formatExameFisicoForDisplay(laudo.exameFisico));
            }
            if (laudo.rascunhoProfissional) {
                this.addSection(doc, 'Notas do Profissional', laudo.rascunhoProfissional);
            }
            this.addSection(doc, 'Objetivos de Curto Prazo', laudo.objetivosCurtoPrazo);
            this.addSection(doc, 'Objetivos de Medio Prazo', laudo.objetivosMedioPrazo);
            this.addSection(doc, 'Frequencia e Duracao', `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana por ${laudo.duracaoSemanas ?? '-'} semana(s)`);
            this.addSection(doc, 'Criterios de Alta', laudo.criteriosAlta);
            this.addSection(doc, 'Observacao', laudo.observacoes || 'Documento para uso clinico profissional. Reavaliar periodicamente.');
        }
        else {
            this.addSection(doc, 'Condutas Terapeuticas', laudo.condutas);
            this.addSection(doc, 'Plano de Tratamento', laudo.planoTratamentoIA);
            this.addSection(doc, 'Frequencia Sugerida', `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana`);
            this.addSection(doc, 'Duracao Sugerida', `${laudo.duracaoSemanas ?? '-'} semana(s)`);
            this.addSection(doc, 'Criterios de Alta', laudo.criteriosAlta);
            this.addSection(doc, 'Observacao', laudo.observacoes || 'Plano sujeito a ajuste pelo profissional responsavel.');
        }
        doc.end();
        return done;
    }
    async buildPdfBufferByPacienteUsuario(usuarioId, tipo) {
        const laudo = await this.findLatestByPacienteUsuario(usuarioId);
        const chunks = [];
        const doc = new pdfkit_1.default({ size: 'A4', margin: 50, compress: false });
        doc.font('Helvetica');
        doc.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        const done = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
        const emittedAt = new Date();
        const profissional = await this.usuariosService.findById(laudo.paciente.usuarioId);
        const profissionalConselho = profissional.conselhoProf ||
            (profissional.conselhoSigla && profissional.conselhoUf
                ? `${profissional.conselhoSigla}-${profissional.conselhoUf}`
                : '-');
        const profissionalRegistro = profissional.registroProf || '-';
        const statusText = laudo.status === laudo_entity_2.LaudoStatus.VALIDADO_PROFISSIONAL
            ? 'Validado pelo profissional'
            : 'Rascunho IA';
        doc.save();
        doc.lineWidth(1).strokeColor('#D1D5DB').rect(35, 35, 525, 770).stroke();
        doc.restore();
        doc.rect(35, 35, 525, 75).fill('#14532D');
        doc.fillColor('#FFFFFF').fontSize(18).text('Synap', 50, 58);
        doc.fontSize(10).fillColor('#DCFCE7').text('Documento do paciente', 50, 82);
        doc
            .fillColor('#111827')
            .fontSize(17)
            .text(tipo === 'laudo' ? 'Meu Laudo' : 'Meu Plano de Tratamento', 50, 130);
        doc
            .lineWidth(0.5)
            .strokeColor('#E5E7EB')
            .moveTo(50, 155)
            .lineTo(540, 155)
            .stroke();
        doc
            .fontSize(10.5)
            .fillColor('#374151')
            .text(`Paciente: ${laudo.paciente.nomeCompleto}`, 50, 170)
            .text(`Data de emissao: ${emittedAt.toLocaleDateString('pt-BR')}`, 50, 186)
            .text(`Status: ${statusText}`, 300, 170)
            .text(`Profissional: ${profissional.nome}`, 300, 186)
            .text(`Conselho: ${profissionalConselho}`, 300, 202)
            .text(`Registro profissional: ${profissionalRegistro}`, 300, 218);
        doc.moveDown(3.2);
        doc.fillColor('#000');
        if (tipo === 'laudo') {
            this.addSection(doc, 'Diagnostico Funcional', laudo.diagnosticoFuncional);
            if (laudo.exameFisico) {
                this.addSection(doc, 'Exame Fisico', this.formatExameFisicoForDisplay(laudo.exameFisico));
            }
            if (laudo.rascunhoProfissional) {
                this.addSection(doc, 'Notas do Profissional', laudo.rascunhoProfissional);
            }
            this.addSection(doc, 'Objetivos de Curto Prazo', laudo.objetivosCurtoPrazo);
            this.addSection(doc, 'Objetivos de Medio Prazo', laudo.objetivosMedioPrazo);
            this.addSection(doc, 'Frequencia e Duracao', `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana por ${laudo.duracaoSemanas ?? '-'} semana(s)`);
            this.addSection(doc, 'Criterios de Alta', laudo.criteriosAlta);
            this.addSection(doc, 'Observacao', laudo.observacoes || 'Documento para uso clinico profissional. Reavaliar periodicamente.');
        }
        else {
            this.addSection(doc, 'Condutas Terapeuticas', laudo.condutas);
            this.addSection(doc, 'Plano de Tratamento', laudo.planoTratamentoIA);
            this.addSection(doc, 'Frequencia Sugerida', `${laudo.frequenciaSemanal ?? '-'} sessao(oes)/semana`);
            this.addSection(doc, 'Duracao Sugerida', `${laudo.duracaoSemanas ?? '-'} semana(s)`);
            this.addSection(doc, 'Criterios de Alta', laudo.criteriosAlta);
            this.addSection(doc, 'Observacao', laudo.observacoes || 'Plano sujeito a ajuste pelo profissional responsavel.');
        }
        doc.end();
        return done;
    }
    async generateAndSaveByPaciente(pacienteId, usuarioId) {
        const { paciente, anamneses, evolucoes, exames, exameFisicoResumo } = await this.buildAiInput(pacienteId, usuarioId);
        const existing = await this.laudoRepository.findOne({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
        if (existing) {
            return existing;
        }
        const canUseAiToday = await this.acquireDailyAiGenerationSlot(pacienteId);
        const aiSuggestion = canUseAiToday
            ? await this.generateSuggestionWithAI({
                paciente: {
                    nomeCompleto: paciente.nomeCompleto,
                    idade: this.calculateAge(paciente.dataNascimento),
                    sexo: paciente.sexo,
                    profissao: paciente.profissao ?? '',
                },
                anamnese: anamneses[0]
                    ? {
                        motivoBusca: anamneses[0].motivoBusca,
                        areasAfetadas: anamneses[0].areasAfetadas,
                        intensidadeDor: anamneses[0].intensidadeDor,
                        descricaoSintomas: anamneses[0].descricaoSintomas ?? '',
                        tempoProblema: anamneses[0].tempoProblema ?? '',
                        inicioProblema: anamneses[0].inicioProblema ?? '',
                        fatorAlivio: anamneses[0].fatorAlivio ?? '',
                        fatoresPiora: anamneses[0].fatoresPiora ?? '',
                        mecanismoLesao: anamneses[0].mecanismoLesao ?? '',
                        historicoEsportivo: anamneses[0].historicoEsportivo ?? '',
                        lesoesPrevias: anamneses[0].lesoesPrevias ?? '',
                        usoMedicamentos: anamneses[0].usoMedicamentos ?? '',
                    }
                    : null,
                evolucoes: evolucoes.map((e) => ({
                    data: e.data,
                    avaliacaoClinica: e.avaliacao ?? '',
                    planoSessao: e.plano ?? '',
                    observacoes: e.observacoes ?? '',
                })),
                exameFisicoResumo,
                exames: exames.map((exame) => ({
                    nomeOriginal: exame.nomeOriginal,
                    tipoExame: exame.tipoExame ?? '',
                    dataExame: exame.dataExame ?? null,
                    mimeType: exame.mimeType,
                    observacao: exame.observacao ?? '',
                    uploadedAt: exame.uploadedAt,
                    aiInterpretacao: exame.aiInterpretacao,
                })),
            })
            : {};
        const examesConsiderados = exames.length;
        const examesComLeituraIa = exames.filter((e) => !!e.aiInterpretacao).length;
        const suggestionSource = Object.keys(aiSuggestion).length
            ? 'ai'
            : 'rules';
        const exameFisicoHint = this.buildExameFisicoHint(exameFisicoResumo);
        const payload = {
            pacienteId,
            diagnosticoFuncional: aiSuggestion.diagnosticoFuncional ??
                `Diagnostico funcional inicial a confirmar em consulta.${this.buildExamCorrelationSuffix(exames.length)}${exameFisicoHint}`,
            objetivosCurtoPrazo: aiSuggestion.objetivosCurtoPrazo,
            objetivosMedioPrazo: aiSuggestion.objetivosMedioPrazo,
            frequenciaSemanal: aiSuggestion.frequenciaSemanal,
            duracaoSemanas: aiSuggestion.duracaoSemanas,
            condutas: aiSuggestion.condutas ??
                `Plano inicial de cinesioterapia, educacao em dor e reavaliacao funcional semanal.${this.buildExamCorrelationSuffix(exames.length)}${exameFisicoHint}`,
            planoTratamentoIA: aiSuggestion.planoTratamentoIA ??
                `Semana 1-2: controle de dor e mobilidade.\nSemana 3-4: ganho de forca e estabilidade.\nSemana 5+: progressao funcional e prevencao de recidiva.${this.buildExamCorrelationSuffix(exames.length)}${exameFisicoHint}`,
            criteriosAlta: aiSuggestion.criteriosAlta,
        };
        const created = this.laudoRepository.create({
            ...payload,
            status: laudo_entity_2.LaudoStatus.RASCUNHO_IA,
            validadoPorUsuarioId: null,
            validadoEm: null,
            sugestaoSource: suggestionSource,
            examesConsiderados,
            examesComLeituraIa,
            sugestaoGeradaEm: new Date(),
        });
        return this.laudoRepository.save(created);
    }
    async generateSuggestionPreview(pacienteId, usuarioId) {
        const { paciente, anamneses, evolucoes, exames, exameFisicoResumo } = await this.buildAiInput(pacienteId, usuarioId);
        const aiSuggestion = await this.generateSuggestionWithAI({
            paciente: {
                nomeCompleto: paciente.nomeCompleto,
                idade: this.calculateAge(paciente.dataNascimento),
                sexo: paciente.sexo,
                profissao: paciente.profissao ?? "",
            },
            anamnese: anamneses[0]
                ? {
                    motivoBusca: anamneses[0].motivoBusca,
                    areasAfetadas: anamneses[0].areasAfetadas,
                    intensidadeDor: anamneses[0].intensidadeDor,
                    descricaoSintomas: anamneses[0].descricaoSintomas ?? "",
                    tempoProblema: anamneses[0].tempoProblema ?? "",
                    inicioProblema: anamneses[0].inicioProblema ?? "",
                    fatorAlivio: anamneses[0].fatorAlivio ?? "",
                    fatoresPiora: anamneses[0].fatoresPiora ?? "",
                    mecanismoLesao: anamneses[0].mecanismoLesao ?? "",
                    historicoEsportivo: anamneses[0].historicoEsportivo ?? "",
                    lesoesPrevias: anamneses[0].lesoesPrevias ?? "",
                    usoMedicamentos: anamneses[0].usoMedicamentos ?? "",
                }
                : null,
            evolucoes: evolucoes.map((e) => ({
                data: e.data,
                avaliacaoClinica: e.avaliacao ?? "",
                planoSessao: e.plano ?? "",
                observacoes: e.observacoes ?? "",
            })),
            exameFisicoResumo,
            exames: exames.map((exame) => ({
                nomeOriginal: exame.nomeOriginal,
                tipoExame: exame.tipoExame ?? "",
                dataExame: exame.dataExame ?? null,
                mimeType: exame.mimeType,
                observacao: exame.observacao ?? "",
                uploadedAt: exame.uploadedAt,
                aiInterpretacao: exame.aiInterpretacao,
            })),
        });
        const source = Object.keys(aiSuggestion).length ? "ai" : "rules";
        const examesConsiderados = exames.length;
        const examesComLeituraIa = exames.filter((e) => !!e.aiInterpretacao).length;
        const exameFisicoHint = this.buildExameFisicoHint(exameFisicoResumo);
        return {
            source,
            examesConsiderados,
            examesComLeituraIa,
            sugestaoGeradaEm: new Date().toISOString(),
            diagnosticoFuncional: aiSuggestion.diagnosticoFuncional ??
                `Diagnostico funcional inicial a confirmar em consulta.${this.buildExamCorrelationSuffix(exames.length)}${exameFisicoHint}`,
            objetivosCurtoPrazo: aiSuggestion.objetivosCurtoPrazo ??
                "Reduzir dor percebida e melhorar controle motor inicial.",
            objetivosMedioPrazo: aiSuggestion.objetivosMedioPrazo ??
                "Restabelecer funcao global e autonomia nas atividades diarias.",
            frequenciaSemanal: aiSuggestion.frequenciaSemanal ?? 2,
            duracaoSemanas: aiSuggestion.duracaoSemanas ?? 8,
            condutas: aiSuggestion.condutas ??
                `Exercicios terapeuticos progressivos, educacao em dor e reavaliacao funcional.${this.buildExamCorrelationSuffix(exames.length)}${exameFisicoHint}`,
            planoTratamentoIA: aiSuggestion.planoTratamentoIA ??
                `Semana 1-2: controle de dor e mobilidade.\nSemana 3-4: ganho de forca e estabilidade.\nSemana 5+: progressao funcional.${this.buildExamCorrelationSuffix(exames.length)}${exameFisicoHint}`,
            criteriosAlta: aiSuggestion.criteriosAlta ??
                "Dor controlada, funcao satisfatoria e independencia para autocuidado.",
        };
    }
    calculateAge(dataNascimento) {
        const nascimento = new Date(dataNascimento);
        if (Number.isNaN(nascimento.getTime()))
            return null;
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    }
    extractJsonObject(raw) {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start)
            return null;
        const candidate = raw.slice(start, end + 1);
        try {
            return JSON.parse(candidate);
        }
        catch {
            return null;
        }
    }
    isAiReadableExamMime(mimeType) {
        return mimeType.startsWith('image/') || mimeType === 'application/pdf';
    }
    async interpretExamWithAI(input) {
        const apiKey = (process.env.OPENAI_API_KEY || '').trim();
        if (!apiKey)
            return null;
        if (!this.shouldUseExamAi())
            return null;
        if (!this.isAiReadableExamMime(input.mimeType))
            return null;
        const model = (process.env.OPENAI_EXAM_MODEL ||
            process.env.OPENAI_LAUDO_MODEL ||
            process.env.OPENAI_MODEL ||
            'gpt-4.1-mini').trim();
        const systemPrompt = 'Voce e um assistente clinico para fisioterapia. Leia exames de imagem com prudencia. Nao invente achados.';
        const userPrompt = `Analise este exame (imagem ou PDF) e retorne SOMENTE JSON com:
achadosPrincipais (array de strings),
impressaoClinica (string curta),
sinaisAlarme (array de strings),
observacoesLimitacao (string curta).

Contexto adicional informado pelo profissional:
${input.observacao || 'Sem observacao adicional.'}
`;
        try {
            const base64 = input.fileBuffer.toString('base64');
            const dataUrl = `data:${input.mimeType};base64,${base64}`;
            const content = [
                { type: 'input_text', text: userPrompt },
            ];
            if (input.mimeType.startsWith('image/')) {
                content.push({ type: 'input_image', image_url: dataUrl });
            }
            else if (input.mimeType === 'application/pdf') {
                content.push({
                    type: 'input_file',
                    filename: input.nomeOriginal || 'exame.pdf',
                    file_data: dataUrl,
                });
            }
            else {
                return null;
            }
            const controller = new AbortController();
            const timeoutMs = 8000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    input: [
                        { role: 'system', content: systemPrompt },
                        {
                            role: 'user',
                            content,
                        },
                    ],
                    temperature: 0.1,
                }),
                signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));
            if (!response.ok)
                return null;
            const data = (await response.json());
            const outputText = data.output_text ||
                data.output
                    ?.flatMap((item) => item.content || [])
                    .map((c) => c.text || '')
                    .join('\n') ||
                '';
            const parsed = this.extractJsonObject(outputText);
            if (!parsed)
                return null;
            const achados = Array.isArray(parsed.achadosPrincipais)
                ? parsed.achadosPrincipais
                    .filter((v) => typeof v === 'string')
                    .slice(0, 5)
                    .map((v) => `- ${v}`)
                    .join('\n')
                : '';
            const impressao = typeof parsed.impressaoClinica === 'string'
                ? parsed.impressaoClinica
                : '';
            const sinaisAlarme = Array.isArray(parsed.sinaisAlarme)
                ? parsed.sinaisAlarme
                    .filter((v) => typeof v === 'string')
                    .slice(0, 4)
                    .map((v) => `- ${v}`)
                    .join('\n')
                : '';
            const limitacao = typeof parsed.observacoesLimitacao === 'string'
                ? parsed.observacoesLimitacao
                : '';
            return [
                `Exame: ${input.nomeOriginal}`,
                achados ? `Achados principais:\n${achados}` : '',
                impressao ? `Impressao clinica: ${impressao}` : '',
                sinaisAlarme ? `Sinais de alerta:\n${sinaisAlarme}` : '',
                limitacao ? `Limitacoes: ${limitacao}` : '',
            ]
                .filter(Boolean)
                .join('\n');
        }
        catch {
            return null;
        }
    }
    async buildExamInsights(exames) {
        const recent = exames.slice(0, 3);
        const result = [];
        for (const exame of recent) {
            const base = {
                nomeOriginal: exame.nomeOriginal,
                tipoExame: exame.tipoExame ?? '',
                dataExame: exame.dataExame ?? null,
                mimeType: exame.mimeType,
                observacao: exame.observacao ?? '',
                uploadedAt: exame.createdAt,
            };
            if (!this.isAiReadableExamMime(exame.mimeType)) {
                result.push(base);
                continue;
            }
            try {
                const fileBuffer = await (0, exame_storage_1.readExameFile)(exame.caminhoArquivo);
                const aiInterpretacao = await this.interpretExamWithAI({
                    nomeOriginal: exame.nomeOriginal,
                    mimeType: exame.mimeType,
                    observacao: exame.observacao ?? '',
                    fileBuffer,
                });
                result.push({
                    ...base,
                    ...(aiInterpretacao ? { aiInterpretacao } : {}),
                });
            }
            catch {
                result.push(base);
            }
        }
        return result;
    }
    async generateSuggestionWithAI(input) {
        const apiKey = (process.env.OPENAI_API_KEY || '').trim();
        if (!apiKey) {
            return {};
        }
        const model = (process.env.OPENAI_LAUDO_MODEL || process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
        const systemPrompt = 'Voce e um assistente clinico para fisioterapeutas. Gere um rascunho tecnico, objetivo e prudente. Nao invente dados ausentes. Priorize seguranca clinica e rastreabilidade da decisao.';
        const userPrompt = `
Retorne SOMENTE JSON valido com as chaves:
diagnosticoFuncional (string),
objetivosCurtoPrazo (string),
objetivosMedioPrazo (string),
frequenciaSemanal (number 1-7),
duracaoSemanas (number 1-52),
condutas (string),
planoTratamentoIA (string com plano por fases/semanas),
criteriosAlta (string).

Regras clinicas:
- Use como fonte primaria o exame fisico estruturado (quando disponivel) e correlacione com anamnese/evolucao.
- Use explicitamente os campos da anamnese: inicioProblema, mecanismoLesao, fatorAlivio, fatoresPiora, historicoEsportivo, lesoesPrevias e usoMedicamentos.
- Se algum desses campos estiver vazio, declare a lacuna clinica em vez de supor informacao.
- Considere os exames anexados (tipoExame, observacao, dataExame, mimeType e aiInterpretacao quando houver) para orientar diagnostico funcional, condutas e plano.
- Nao invente achados de imagem nao descritos no contexto.
- Se houver informacao insuficiente dos exames, explicite a limitacao e mantenha conduta prudente.
- Em caso de conflito entre exames e achados clinicos, priorize seguranca e recomende correlacao clinica/reavaliacao.
- Em condutas e planoTratamentoIA, descreva progressao por fases (ex.: controle de dor -> ganho funcional -> retorno progressivo) e inclua criterio objetivo de progressao.
- Em condutas, para cada intervencao proposta, descreva em texto curto a evidencia clinica correspondente (achado, teste positivo/negativo relevante, deficit funcional ou fator de risco).
- Em planoTratamentoIA, estruture por fases com: objetivo da fase, condutas, criterio de progressao e evidencia que sustenta a fase.
- Evite termos vagos; relacione cada bloco a achados (dor, funcao, testes positivos/deficits funcionais).
- Em diagnosticoFuncional, identifique (quando possivel) origem provavel da dor, estrutura envolvida, tipo de lesao (mecanica/inflamatoria/neural) e fator biomecanico associado.

Resumo do exame fisico estruturado:
${input.exameFisicoResumo || 'Nao informado'}

Contexto do paciente:
${JSON.stringify(input, null, 2)}
`;
        try {
            const controller = new AbortController();
            const timeoutMs = 4000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            const response = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    input: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.2,
                }),
                signal: controller.signal,
            }).finally(() => clearTimeout(timeoutId));
            if (!response.ok) {
                return {};
            }
            const data = (await response.json());
            const outputText = data.output_text ||
                data.output
                    ?.flatMap((item) => item.content || [])
                    .map((c) => c.text || '')
                    .join('\n') ||
                '';
            const parsed = this.extractJsonObject(outputText);
            if (!parsed) {
                return {};
            }
            const freq = typeof parsed.frequenciaSemanal === 'number'
                ? Math.min(7, Math.max(1, Math.round(parsed.frequenciaSemanal)))
                : undefined;
            const dur = typeof parsed.duracaoSemanas === 'number'
                ? Math.min(52, Math.max(1, Math.round(parsed.duracaoSemanas)))
                : undefined;
            return {
                diagnosticoFuncional: typeof parsed.diagnosticoFuncional === 'string'
                    ? parsed.diagnosticoFuncional
                    : undefined,
                objetivosCurtoPrazo: typeof parsed.objetivosCurtoPrazo === 'string'
                    ? parsed.objetivosCurtoPrazo
                    : undefined,
                objetivosMedioPrazo: typeof parsed.objetivosMedioPrazo === 'string'
                    ? parsed.objetivosMedioPrazo
                    : undefined,
                frequenciaSemanal: freq,
                duracaoSemanas: dur,
                condutas: typeof parsed.condutas === 'string' ? parsed.condutas : undefined,
                planoTratamentoIA: typeof parsed.planoTratamentoIA === 'string'
                    ? parsed.planoTratamentoIA
                    : undefined,
                criteriosAlta: typeof parsed.criteriosAlta === 'string'
                    ? parsed.criteriosAlta
                    : undefined,
            };
        }
        catch {
            return {};
        }
    }
    getUtcDayString(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async acquireDailyAiGenerationSlot(pacienteId) {
        const generatedOn = this.getUtcDayString(new Date());
        try {
            const insertResult = await this.laudoAiGenerationRepository
                .createQueryBuilder()
                .insert()
                .into(laudo_ai_generation_entity_1.LaudoAiGeneration)
                .values({ pacienteId, generatedOn })
                .orIgnore()
                .execute();
            return (insertResult.identifiers?.length ?? 0) > 0;
        }
        catch {
            return false;
        }
    }
    async buildAiInput(pacienteId, usuarioId) {
        const paciente = await this.pacientesService.findOne(pacienteId, usuarioId);
        const anamneses = await this.anamneseRepository.find({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
        const evolucoes = await this.evolucaoRepository.find({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
        const exames = await this.pacienteExameRepository.find({
            where: { pacienteId, usuarioId },
            order: { createdAt: 'DESC' },
            take: 12,
        });
        const latestLaudo = await this.laudoRepository.findOne({
            where: { pacienteId },
            order: { updatedAt: 'DESC' },
        });
        const examesInterpretados = await this.buildExamInsights(exames);
        const exameFisicoResumo = latestLaudo?.exameFisico
            ? this.formatExameFisicoForDisplay(latestLaudo.exameFisico)
            : null;
        return {
            paciente,
            anamneses,
            evolucoes,
            exames: examesInterpretados,
            exameFisicoResumo,
        };
    }
    buildExamCorrelationSuffix(examesCount) {
        if (examesCount <= 0)
            return '';
        return ` Correlacionar com ${examesCount} exame(s) anexado(s).`;
    }
    buildExameFisicoHint(exameFisicoResumo) {
        const raw = String(exameFisicoResumo || '').trim();
        if (!raw)
            return '';
        const normalized = raw.replace(/\s+/g, ' ');
        const short = normalized.length > 240 ? `${normalized.slice(0, 240)}...` : normalized;
        return ` Baseado no exame fisico: ${short}`;
    }
    structuredExamePrefix = '__EXAME_FISICO_STRUCTURED_V1__';
    formatExameFisicoForDisplay(value) {
        const parsed = this.parseStructuredExame(value);
        if (!parsed)
            return value?.trim() || 'Nao informado';
        const rfPositivas = (parsed.redFlags?.answers || [])
            .filter((item) => item?.positive)
            .map((item) => '- ' + String(item.question || item.key || 'Red flag'))
            .join('\n');
        const regionalGroups = (parsed.avaliacaoRegioes || []);
        const allRegionalTests = regionalGroups.flatMap((group) => Array.isArray(group?.testes) ? group.testes : []);
        const regionalPositiveCount = allRegionalTests.filter((test) => String(test?.resultado || '') === 'POSITIVO').length;
        const regionalNegativeCount = allRegionalTests.filter((test) => String(test?.resultado || '') === 'NEGATIVO').length;
        const regionalNotTestedCount = allRegionalTests.filter((test) => String(test?.resultado || 'NAO_TESTADO') === 'NAO_TESTADO').length;
        const lines = [
            'Classificacao de dor',
            'Principal: ' + String(parsed.dorPrincipal || 'Nao informado'),
            'Subtipo clinico: ' + String(parsed.dorSubtipo || 'Nao informado'),
            '',
            'Inspecao/observacao',
            'Postura global: ' + String(parsed.observacao?.postura || 'Nao informado'),
            'Assimetrias: ' + String(parsed.observacao?.assimetria || 'Nao informado'),
            'Edema: ' + String(parsed.observacao?.edema || 'Nao informado'),
            'Atrofia muscular: ' + String(parsed.observacao?.atrofiaMuscular || 'Nao informado'),
            'Alteracoes de marcha: ' + String(parsed.observacao?.marcha || 'Nao informado'),
            'Padrao de movimento observado: ' + String(parsed.observacao?.padraoMovimento || 'Nao informado'),
            '',
            'Padrao de dor',
            'Dor local: ' + String(parsed.padraoDor?.local || 'Nao informado'),
            'Dor irradiada: ' + String(parsed.padraoDor?.irradiada || 'Nao informado'),
            'Comportamento da dor: ' + String(parsed.padraoDor?.comportamento || 'Nao informado'),
            '',
            'Movimento (chave)',
            'Ativo: ' + String(parsed.movimento?.ativo || 'Nao informado'),
            'Passivo: ' + String(parsed.movimento?.passivo || 'Nao informado'),
            'Resistido: ' + String(parsed.movimento?.resistido || 'Nao informado'),
            'Reproduz dor: ' + String(parsed.movimento?.reproduzDor || 'Nao informado'),
            'Qualidade do movimento: ' + String(parsed.movimento?.qualidadeMovimento || 'Nao informado'),
            'Compensacoes: ' + String(parsed.movimento?.compensacoes || 'Nao informado'),
            'Dor no movimento: ' + String(parsed.movimento?.dorNoMovimento || 'Nao informado'),
            '',
            'Palpacao',
            'Muscular: ' + String(parsed.palpacao?.muscular || 'Nao informado'),
            'Articular: ' + String(parsed.palpacao?.articular || 'Nao informado'),
            'Pontos gatilho: ' + String(parsed.palpacao?.pontosGatilho || 'Nao informado'),
            'Palpacao dinamica vertebral: ' + String(parsed.palpacao?.dinamicaVertebral || 'Nao informado'),
            'Pontos dolorosos: ' + String(parsed.palpacao?.pontosDolorosos || 'Nao informado'),
            'Temperatura: ' + String(parsed.palpacao?.temperatura || 'Nao informado'),
            'Tonus muscular: ' + String(parsed.palpacao?.tonusMuscular || 'Nao informado'),
            'Estruturas especificas: ' + String(parsed.palpacao?.estruturasEspecificas || 'Nao informado'),
            'Hipomobilidade articular: ' + String(parsed.palpacao?.hipomobilidadeArticular || 'Nao informado'),
            'Hipomobilidade segmentar - Cervical: ' + String(parsed.palpacao?.hipomobilidadeSegmentar?.cervical || 'Nao informado'),
            'Hipomobilidade segmentar - Toracica: ' + String(parsed.palpacao?.hipomobilidadeSegmentar?.toracica || 'Nao informado'),
            'Hipomobilidade segmentar - Lombar: ' + String(parsed.palpacao?.hipomobilidadeSegmentar?.lombar || 'Nao informado'),
            'Hipomobilidade segmentar - Sacro: ' + String(parsed.palpacao?.hipomobilidadeSegmentar?.sacro || 'Nao informado'),
            'Hipomobilidade segmentar - Iliaco D: ' + String(parsed.palpacao?.hipomobilidadeSegmentar?.iliacoDireito || 'Nao informado'),
            'Hipomobilidade segmentar - Iliaco E: ' + String(parsed.palpacao?.hipomobilidadeSegmentar?.iliacoEsquerdo || 'Nao informado'),
            '',
            'Testes funcionais',
            'Agachamento: ' + String(parsed.testesFuncionais?.agachamento || 'Nao informado'),
            'Agachamento unilateral: ' + String(parsed.testesFuncionais?.agachamentoUnilateral || 'Nao informado'),
            'Salto: ' + String(parsed.testesFuncionais?.salto || 'Nao informado'),
            'Corrida: ' + String(parsed.testesFuncionais?.corrida || 'Nao informado'),
            'Estabilidade: ' + String(parsed.testesFuncionais?.estabilidade || 'Nao informado'),
            'Controle motor: ' + String(parsed.testesFuncionais?.controleMotor || 'Nao informado'),
            '',
            'Testes',
            'Biomecanicos: ' + String(parsed.testes?.biomecanicos || 'Nao informado'),
            'Ortopedicos: ' + String(parsed.testes?.ortopedicos || 'Nao informado'),
            'Neurologicos: ' + String(parsed.testes?.neurologicos || 'Nao informado'),
            'Imagem: ' + String(parsed.testes?.imagem || 'Nao informado'),
            '',
            'Neurologico detalhado',
            'Forca: ' + String(parsed.neurologico?.forca || 'Nao informado'),
            'Sensibilidade: ' + String(parsed.neurologico?.sensibilidade || 'Nao informado'),
            'Reflexos: ' + String(parsed.neurologico?.reflexos || 'Nao informado'),
            'Dermatomos: ' + String(parsed.neurologico?.dermatomos || 'Nao informado'),
            'Miotomos: ' + String(parsed.neurologico?.miotomos || 'Nao informado'),
            '',
            'Avaliacao por regioes',
            `Resumo: ${regionalPositiveCount} positivo(s), ${regionalNegativeCount} negativo(s), ${regionalNotTestedCount} nao testado(s).`,
            ...regionalGroups.flatMap((group) => {
                const groupTitle = String(group?.titulo || 'Regiao');
                const tests = Array.isArray(group?.testes) ? group.testes : [];
                const selectedOrTested = tests.filter((test) => String(test?.resultado || '') !== 'NAO_TESTADO' ||
                    test?.selecionado === true);
                if (!selectedOrTested.length) {
                    return [groupTitle, '- Sem testes marcados'];
                }
                const entries = selectedOrTested.map((test) => {
                    const name = String(test?.nome || 'Teste');
                    const result = String(test?.resultado || 'NAO_TESTADO');
                    if (result === 'NAO_TESTADO') {
                        return `- ${name}: Selecionado`;
                    }
                    return `- ${name}: ${result === 'POSITIVO' ? 'Positivo' : 'Negativo'}`;
                });
                return [groupTitle, ...entries];
            }),
            '',
            'Cruzamento final',
            'Hipotese principal: ' + String(parsed.cruzamentoFinal?.hipotesePrincipal || 'Nao informado'),
            'Hipoteses secundarias: ' + String(parsed.cruzamentoFinal?.hipotesesSecundarias || 'Nao informado'),
            'Inconsistencias: ' + String(parsed.cruzamentoFinal?.inconsistencias || 'Nao informado'),
            'Direcao de conduta: ' + String(parsed.cruzamentoFinal?.condutaDirecionada || 'Nao informado'),
            'Prioridade: ' + String(parsed.cruzamentoFinal?.prioridade || 'Nao informado'),
            'Confianca da hipotese: ' + String(parsed.cruzamentoFinal?.confiancaHipotese || 'Nao informado'),
            'Score de evidencia: ' + String(parsed.cruzamentoFinal?.scoreEvidencia ?? 'Nao informado'),
            'Perfil de scoring: ' + String(parsed.cruzamentoFinal?.perfilScoring || 'Nao informado'),
            '',
            'Raciocinio clinico',
            'Origem provavel da dor: ' + String(parsed.raciocinioClinico?.origemProvavelDor || 'Nao informado'),
            'Estrutura envolvida: ' + String(parsed.raciocinioClinico?.estruturaEnvolvida || 'Nao informado'),
            'Tipo de lesao: ' + String(parsed.raciocinioClinico?.tipoLesao || 'Nao informado'),
            'Fator biomecanico associado: ' + String(parsed.raciocinioClinico?.fatorBiomecanicoAssociado || 'Nao informado'),
            'Relacao com esporte: ' + String(parsed.raciocinioClinico?.relacaoComEsporte || 'Nao informado'),
            '',
            'Diagnostico funcional',
            'Disfuncao principal: ' + String(parsed.diagnosticoFuncionalIa?.disfuncaoPrincipal || 'Nao informado'),
            'Cadeia envolvida: ' + String(parsed.diagnosticoFuncionalIa?.cadeiaEnvolvida || 'Nao informado'),
            'Compensacoes: ' + String(parsed.diagnosticoFuncionalIa?.compensacoes || 'Nao informado'),
            '',
            'Conduta direcionada',
            'Tecnica manual indicada: ' + String(parsed.condutaIa?.tecnicaManualIndicada || 'Nao informado'),
            'Ajuste articular: ' + String(parsed.condutaIa?.ajusteArticular || 'Nao informado'),
            'Exercicio corretivo: ' + String(parsed.condutaIa?.exercicioCorretivo || 'Nao informado'),
            'Liberacao miofascial: ' + String(parsed.condutaIa?.liberacaoMiofascial || 'Nao informado'),
            'Progressao esportiva: ' + String(parsed.condutaIa?.progressaoEsportiva || 'Nao informado'),
            '',
            'Red flags positivas',
            rfPositivas || 'Nenhuma red flag positiva',
            parsed.redFlags?.criticalTriggered
                ? 'ALERTA: red flag critica detectada; encaminhamento imediato recomendado.'
                : 'Sem red flag critica na triagem.',
            parsed.redFlags?.referralDestination
                ? 'Destino encaminhamento: ' + String(parsed.redFlags.referralDestination)
                : '',
            parsed.redFlags?.referralReason
                ? 'Justificativa: ' + String(parsed.redFlags.referralReason)
                : '',
        ].filter(Boolean);
        return lines.join('\n');
    }
    parseStructuredExame(value) {
        const raw = String(value || '').trim();
        if (!raw.startsWith(this.structuredExamePrefix))
            return null;
        const json = raw.slice(this.structuredExamePrefix.length);
        if (!json)
            return null;
        try {
            return JSON.parse(json);
        }
        catch {
            return null;
        }
    }
    validateStructuredExameInput(value) {
        const parsed = this.parseStructuredExame(value);
        if (!parsed)
            return;
        const groups = Array.isArray(parsed.avaliacaoRegioes)
            ? parsed.avaliacaoRegioes
            : [];
        const hasRegionalResult = groups.some((group) => Array.isArray(group?.testes) &&
            group.testes.some((test) => String(test?.resultado || '') === 'POSITIVO' ||
                String(test?.resultado || '') === 'NEGATIVO'));
        if (!hasRegionalResult) {
            throw new common_1.BadRequestException('Marque ao menos um teste regional como positivo ou negativo antes de salvar o exame fisico.');
        }
    }
    addSection(doc, title, value) {
        doc.fontSize(12).fillColor('#1b5e40').text(title);
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor('#111').text(value?.trim() ? value : 'Nao informado', {
            align: 'left',
        });
        doc.moveDown(0.8);
    }
    inferReferenceProfile(anamnese) {
        if (!anamnese)
            return 'GERAL';
        const text = [
            anamnese.descricaoSintomas,
            anamnese.tempoProblema,
            anamnese.fatorAlivio,
            anamnese.fatoresPiora,
            anamnese.mecanismoLesao,
            anamnese.historicoEsportivo,
            anamnese.lesoesPrevias,
            anamnese.usoMedicamentos,
            anamnese.eventoEspecifico,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const areaText = (anamnese.areasAfetadas || [])
            .map((a) => String(a.regiao || '').toLowerCase())
            .join(' ');
        const combined = `${areaText} ${text}`;
        if (combined.includes('lomb') ||
            combined.includes('coluna lombar') ||
            combined.includes('lombar')) {
            return 'LOMBAR';
        }
        if (combined.includes('cervic') ||
            combined.includes('pesco') ||
            combined.includes('trap') ||
            combined.includes('cervical')) {
            return 'CERVICAL';
        }
        if (combined.includes('joelho') ||
            combined.includes('patel') ||
            combined.includes('menisc')) {
            return 'JOELHO';
        }
        return 'GERAL';
    }
    getReferenceCatalog() {
        const commonLaudo = [
            {
                id: 'guideline-pain-2021-iasp',
                title: 'IASP Terminology & Pain Definition Update',
                category: 'GUIDELINE',
                source: 'PAIN (IASP)',
                year: 2021,
                authors: 'Raja SN et al.',
                url: 'https://journals.lww.com/pain/fulltext/2020/09000/the_revised_international_association_for_the.8.aspx',
                rationale: 'Base conceitual para avaliação de dor e comunicação clínica.',
            },
            {
                id: 'book-magee-orthopedic-physical-assessment',
                title: 'Orthopedic Physical Assessment',
                category: 'LIVRO',
                source: 'Elsevier',
                year: 2020,
                authors: 'David J. Magee',
                url: 'https://www.elsevier.com/books/orthopedic-physical-assessment/magee/978-0-323-52998-6',
                rationale: 'Referência de avaliação física musculoesquelética e testes clínicos.',
            },
        ];
        const commonPlano = [
            {
                id: 'guideline-who-rehab',
                title: 'WHO Rehabilitation in Health Systems',
                category: 'GUIDELINE',
                source: 'World Health Organization',
                year: 2017,
                url: 'https://www.who.int/publications/i/item/9789241549974',
                rationale: 'Princípios de planejamento terapêutico e funcionalidade.',
            },
            {
                id: 'book-therapeutic-exercise-kisner',
                title: 'Therapeutic Exercise: Foundations and Techniques',
                category: 'LIVRO',
                source: 'F.A. Davis',
                year: 2017,
                authors: 'Kisner, Colby, Borstad',
                url: 'https://www.fadavis.com/product/physical-therapy-therapeutic-exercise-kisner-colby-borstad-7',
                rationale: 'Base para prescrição, progressão e dosagem de exercícios terapêuticos.',
            },
        ];
        return {
            GERAL: {
                laudoReferences: commonLaudo,
                planoReferences: commonPlano,
            },
            LOMBAR: {
                laudoReferences: [
                    ...commonLaudo,
                    {
                        id: 'guideline-jospt-lbp-2021',
                        title: 'Interventions for the Management of Acute and Chronic Low Back Pain',
                        category: 'GUIDELINE',
                        source: 'JOSPT Clinical Practice Guideline',
                        year: 2021,
                        url: 'https://www.jospt.org/doi/10.2519/jospt.2021.0304',
                        rationale: 'Diretriz para condutas e classificação em dor lombar.',
                    },
                ],
                planoReferences: [
                    ...commonPlano,
                    {
                        id: 'article-lbp-exercise-cochrane',
                        title: 'Exercise therapy for chronic low back pain',
                        category: 'ARTIGO',
                        source: 'Cochrane Review',
                        year: 2021,
                        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD009790.pub2/full',
                        rationale: 'Evidência para prescrição de exercício em dor lombar crônica.',
                    },
                ],
            },
            CERVICAL: {
                laudoReferences: [
                    ...commonLaudo,
                    {
                        id: 'guideline-neckpain-jospt',
                        title: 'Neck Pain Clinical Practice Guidelines',
                        category: 'GUIDELINE',
                        source: 'JOSPT / Orthopaedic Section CPG',
                        year: 2017,
                        url: 'https://www.jospt.org/doi/10.2519/jospt.2017.0302',
                        rationale: 'Classificação e manejo fisioterapêutico da cervicalgia.',
                    },
                ],
                planoReferences: [
                    ...commonPlano,
                    {
                        id: 'article-neck-pain-exercise-manual-therapy',
                        title: 'Exercise and manual therapy for neck pain',
                        category: 'ARTIGO',
                        source: 'Systematic Review / Clinical Evidence',
                        year: 2015,
                        url: 'https://pubmed.ncbi.nlm.nih.gov/25830800/',
                        rationale: 'Suporte para combinação de exercício e terapia manual.',
                    },
                ],
            },
            JOELHO: {
                laudoReferences: [
                    ...commonLaudo,
                    {
                        id: 'guideline-knee-pain-patellofemoral-2019',
                        title: 'Patellofemoral Pain Clinical Practice Guideline',
                        category: 'GUIDELINE',
                        source: 'JOSPT Clinical Practice Guideline',
                        year: 2019,
                        url: 'https://www.jospt.org/doi/10.2519/jospt.2019.0302',
                        rationale: 'Avaliação e raciocínio clínico para dor patelofemoral/joelho.',
                    },
                ],
                planoReferences: [
                    ...commonPlano,
                    {
                        id: 'article-aclr-rehab-consensus',
                        title: 'Anterior Cruciate Ligament Rehabilitation: Clinical Practice',
                        category: 'GUIDELINE',
                        source: 'BJSM / Consensus Recommendations',
                        year: 2020,
                        url: 'https://bjsm.bmj.com/content/54/24/1506',
                        rationale: 'Referência para progressão funcional e critérios de retorno.',
                    },
                ],
            },
        };
    }
};
exports.LaudosService = LaudosService;
exports.LaudosService = LaudosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(laudo_entity_1.Laudo)),
    __param(1, (0, typeorm_1.InjectRepository)(anamnese_entity_1.Anamnese)),
    __param(2, (0, typeorm_1.InjectRepository)(evolucao_entity_1.Evolucao)),
    __param(3, (0, typeorm_1.InjectRepository)(laudo_ai_generation_entity_1.LaudoAiGeneration)),
    __param(4, (0, typeorm_1.InjectRepository)(paciente_exame_entity_1.PacienteExame)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        pacientes_service_1.PacientesService,
        usuarios_service_1.UsuariosService])
], LaudosService);
//# sourceMappingURL=laudos.service.js.map