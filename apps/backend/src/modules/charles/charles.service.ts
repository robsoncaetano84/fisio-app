import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { Anamnese, TipoDor } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo, LaudoStatus } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceService } from '../clinical-governance/clinical-governance.service';

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
] as const;
type ClinicalRegionKey = (typeof CLINICAL_REGION_KEYS)[number];

const REGION_INFERENCE_RULES: Array<{ regex: RegExp; region: ClinicalRegionKey }> = [
  { regex: /(cerv|pescoc|cabec)/, region: 'CERVICAL' },
  { regex: /(torac|torax)/, region: 'TORACICA' },
  { regex: /(lomb|abdomen)/, region: 'LOMBAR' },
  { regex: /(sacro|iliac|pelve)/, region: 'SACROILIACA' },
  { regex: /(quadril|coxa)/, region: 'QUADRIL' },
  { regex: /(joelho)/, region: 'JOELHO' },
  { regex: /(tornoz|pe\b|pé)/, region: 'TORNOZELO_PE' },
  { regex: /(ombro|braco|braço)/, region: 'OMBRO' },
  { regex: /(cotovelo)/, region: 'COTOVELO' },
  { regex: /(punho|mao|mão)/, region: 'PUNHO_MAO' },
];

const CHAIN_REGION_MAP: Record<ClinicalRegionKey, ClinicalRegionKey[]> = {
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

export type CharlesClinicalStage =
  | 'ANAMNESE'
  | 'EXAME_FISICO'
  | 'EVOLUCAO'
  | 'LAUDO'
  | 'PLANO'
  | 'MONITORAMENTO';

export type CharlesStageStatus = 'PENDING' | 'COMPLETED' | 'BLOCKED';

export interface CharlesStageItem {
  stage: CharlesClinicalStage;
  status: CharlesStageStatus;
  reason: string;
}

export interface CharlesNextAction {
  stage: CharlesClinicalStage;
  reason: string;
  guidance: string;
}

export interface CharlesNextActionResponse {
  orchestrator: 'CLINICAL_ORCHESTRATOR';
  mode: 'deterministic-v1';
  requiresProfessionalApproval: true;
  protocolVersion: string | null;
  protocolName: string | null;
  blocked: boolean;
  paciente: {
    id: string;
    nomeCompleto: string;
  };
  context: {
    regioesPrioritarias: string[];
    regioesRelacionadas: string[];
    cadeiaProvavel: string | null;
  };
  timeline: {
    anamneseEm: Date | null;
    exameFisicoEm: Date | null;
    evolucaoEm: Date | null;
    laudoEm: Date | null;
  };
  blockers: Array<{
    code: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    message: string;
  }>;
  alerts: Array<{
    code: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
  }>;
  stages: CharlesStageItem[];
  nextAction: CharlesNextAction;
}

export interface CharlesExameFisicoDorSuggestionResponse {
  orchestrator: 'CLINICAL_ORCHESTRATOR';
  mode: 'assistive-v1';
  requiresProfessionalApproval: true;
  patientId: string;
  stage: 'EXAME_FISICO';
  suggestionType: 'DOR_CLASSIFICATION';
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
  reason: string;
  evidenceFields: string[];
  protocolVersion: string | null;
  protocolName: string | null;
  dorPrincipal:
    | 'NOCICEPTIVA'
    | 'NEUROPATICA'
    | 'NOCIPLASTICA'
    | 'INFLAMATORIA'
    | 'VISCERAL'
    | null;
  dorSubtipo:
    | 'MECANICA'
    | 'DISCAL'
    | 'NEURAL'
    | 'REFERIDA'
    | 'INFLAMATORIA'
    | 'MIOFASCIAL'
    | 'FACETARIA'
    | 'NAO_MECANICA'
    | null;
}

export interface CharlesEvolucaoSoapSuggestionResponse {
  orchestrator: 'CLINICAL_ORCHESTRATOR';
  mode: 'assistive-v1';
  requiresProfessionalApproval: true;
  patientId: string;
  stage: 'EVOLUCAO';
  suggestionType: 'EVOLUCAO_SOAP';
  confidence: 'BAIXA' | 'MODERADA' | 'ALTA';
  reason: string;
  evidenceFields: string[];
  protocolVersion: string | null;
  protocolName: string | null;
  subjetivo: string | null;
  objetivo: string | null;
  avaliacao: string | null;
  plano: string | null;
}

@Injectable()
export class CharlesService {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly governanceService: ClinicalGovernanceService,
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
  ) {}

  async getNextAction(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesNextActionResponse> {
    const paciente = await this.pacientesService.findOne(pacienteId, usuario.id);

    const [latestAnamnese, latestEvolucao, latestLaudo, activeProtocol] =
      await Promise.all([
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
    const laudoValidado = latestLaudo?.status === LaudoStatus.VALIDADO_PROFISSIONAL;
    const hasPlanoOuAlta = !!String(latestLaudo?.criteriosAlta || '').trim();
    const hasCriticalRedFlag = this.hasCriticalRedFlag(latestAnamnese?.redFlags);
    const context = this.buildClinicalContext(latestAnamnese);
    const blockers: CharlesNextActionResponse['blockers'] = [];
    const alerts: CharlesNextActionResponse['alerts'] = [];

    if (hasCriticalRedFlag) {
      blockers.push({
        code: 'RED_FLAG_CRITICA',
        severity: 'CRITICAL',
        message:
          'Red flag critica detectada na anamnese. Continuidade do ciclo deve ser bloqueada ate encaminhamento.',
      });
    }
    if ((latestAnamnese?.yellowFlags || []).length >= 2) {
      alerts.push({
        code: 'YELLOW_FLAGS_RELEVANTES',
        severity: 'MEDIUM',
        message:
          'Paciente com yellow flags relevantes; manter acompanhamento de adesao e abordagem biopsicossocial.',
      });
    }

    let stages: CharlesStageItem[] = [
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
        if (item.status === 'COMPLETED') return item;
        return {
          ...item,
          status: 'BLOCKED',
          reason:
            'Etapa bloqueada por red flag critica ate encaminhamento e reavaliacao.',
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

    const response: CharlesNextActionResponse = {
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

  async getExameFisicoDorSuggestion(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesExameFisicoDorSuggestionResponse> {
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

  async getEvolucaoSoapSuggestion(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesEvolucaoSoapSuggestionResponse> {
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

    const suggestion = this.inferEvolucaoSoapSuggestion({
      anamnese: latestAnamnese,
      evolucao: latestEvolucao,
      laudo: latestLaudo,
    });
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

  private async getActiveProtocolSafe(
    usuario: Usuario,
  ): Promise<{ version: string; name: string } | null> {
    try {
      const protocol = await this.governanceService.getActiveProtocol(usuario);
      if (!protocol) return null;
      return {
        version: protocol.version,
        name: protocol.name,
      };
    } catch {
      return null;
    }
  }

  private async writeAuditSafe(payload: Parameters<ClinicalGovernanceService['writeAudit']>[0]): Promise<void> {
    try {
      await this.governanceService.writeAudit(payload);
    } catch {
      // Best-effort audit: falha de auditoria nao deve interromper fluxo clinico.
    }
  }

  private hasStructuredExame(raw?: string | null): boolean {
    const value = String(raw || '').trim();
    if (!value) return false;
    return value.startsWith(STRUCTURED_EXAME_PREFIX) || value.length > 20;
  }

  private resolveNextAction(args: {
    hasAnamnese: boolean;
    hasExameFisico: boolean;
    hasEvolucao: boolean;
    laudoValidado: boolean;
    hasPlanoOuAlta: boolean;
    hasCriticalRedFlag: boolean;
  }): CharlesNextAction {
    if (args.hasCriticalRedFlag) {
      return {
        stage: 'MONITORAMENTO',
        reason: 'Red flag critica detectada.',
        guidance:
          'Interromper continuidade do fluxo e encaminhar paciente para avaliacao medica/servico de urgencia conforme protocolo.',
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
      guidance:
        'Manter monitoramento por check-ins e reavaliacao conforme necessidade.',
    };
  }

  private hasCriticalRedFlag(redFlags?: unknown): boolean {
    if (!Array.isArray(redFlags) || redFlags.length === 0) return false;

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
      if (!raw) return false;
      const normalized = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .toUpperCase();
      return !ignored.has(normalized);
    });
  }

  private buildClinicalContext(anamnese?: Anamnese | null): {
    regioesPrioritarias: string[];
    regioesRelacionadas: string[];
    cadeiaProvavel: string | null;
  } {
    const regioesSet = new Set<ClinicalRegionKey>();
    for (const area of anamnese?.areasAfetadas || []) {
      const raw = String(area.regiao || '').trim();
      const normalized = this.normalizeClinicalRegion(raw);
      if (normalized) regioesSet.add(normalized);
    }
    const regioes = Array.from(regioesSet);

    const regiaoKey = regioes.join(' ').toLowerCase();
    let cadeiaProvavel: string | null = null;
    if (/(lombar|sacroiliaca|quadril|joelho|tornozelo_pe)/.test(regiaoKey)) {
      cadeiaProvavel = 'CADEIA_LOWER';
    } else if (/(cervical|ombro|cotovelo|punho_mao|toracica)/.test(regiaoKey)) {
      cadeiaProvavel = 'CADEIA_UPPER';
    } else if (regioes.length > 0) {
      cadeiaProvavel = 'CADEIA_LOCAL';
    }

    const relacionadas = new Set<ClinicalRegionKey>();
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

  private normalizeClinicalRegion(rawRegion: string): ClinicalRegionKey | null {
    const normalized = String(rawRegion || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (!normalized) return null;
    if ((CLINICAL_REGION_KEYS as readonly string[]).includes(normalized)) {
      return normalized as ClinicalRegionKey;
    }
    if (normalized === 'SACRO' || normalized === 'ILIACO' || normalized === 'PELVIS') {
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
      if (rule.regex.test(lower)) return rule.region;
    }
    return null;
  }

  private inferDorClassificationFromAnamnese(anamnese?: Anamnese | null): {
    principal: CharlesExameFisicoDorSuggestionResponse['dorPrincipal'];
    subtipo: CharlesExameFisicoDorSuggestionResponse['dorSubtipo'];
    confidence: CharlesExameFisicoDorSuggestionResponse['confidence'];
    reason: string;
    evidenceFields: string[];
  } {
    if (!anamnese) {
      return {
        principal: null,
        subtipo: null,
        confidence: 'BAIXA',
        reason: 'Sem anamnese disponivel para inferencia.',
        evidenceFields: [],
      };
    }

    if (anamnese.tipoDor === TipoDor.NEUROPATICA) {
      return {
        principal: 'NEUROPATICA',
        subtipo: 'NEURAL',
        confidence: 'ALTA',
        reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
        evidenceFields: ['tipoDor'],
      };
    }
    if (anamnese.tipoDor === TipoDor.INFLAMATORIA) {
      return {
        principal: 'INFLAMATORIA',
        subtipo: 'INFLAMATORIA',
        confidence: 'ALTA',
        reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
        evidenceFields: ['tipoDor'],
      };
    }
    if (anamnese.tipoDor === TipoDor.MECANICA) {
      return {
        principal: 'NOCICEPTIVA',
        subtipo: 'MECANICA',
        confidence: 'ALTA',
        reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
        evidenceFields: ['tipoDor'],
      };
    }
    if (anamnese.tipoDor === TipoDor.MISTA) {
      return {
        principal: 'NOCIPLASTICA',
        subtipo: 'MIOFASCIAL',
        confidence: 'ALTA',
        reason: 'Classificacao inferida diretamente do tipo de dor da anamnese.',
        evidenceFields: ['tipoDor'],
      };
    }

    const sintomas = String(anamnese.descricaoSintomas || '').toLowerCase();
    const piora = String(anamnese.fatoresPiora || '').toLowerCase();
    const alivio = String(anamnese.fatorAlivio || '').toLowerCase();
    const sinaisCentral = String(anamnese.sinaisSensibilizacaoCentral || '').toLowerCase();
    const hasIrradiacao =
      anamnese.irradiacao === true ||
      String(anamnese.localIrradiacao || '').trim().length > 0;
    const hasInflammatoryBehavior =
      anamnese.dorRepouso === true || anamnese.dorNoturna === true;

    if (
      hasIrradiacao ||
      sintomas.includes('choque') ||
      sintomas.includes('formig') ||
      sintomas.includes('queima')
    ) {
      return {
        principal: 'NEUROPATICA',
        subtipo: 'NEURAL',
        confidence: 'MODERADA',
        reason: 'Sinais de irradiacao/parestesia sugerem componente neural.',
        evidenceFields: ['irradiacao', 'localIrradiacao', 'descricaoSintomas'],
      };
    }

    if (
      hasInflammatoryBehavior ||
      sintomas.includes('rigidez matinal') ||
      sinaisCentral.includes('inflama')
    ) {
      return {
        principal: 'INFLAMATORIA',
        subtipo: 'INFLAMATORIA',
        confidence: 'MODERADA',
        reason: 'Padrao em repouso/noturno sugere componente inflamatorio.',
        evidenceFields: ['dorRepouso', 'dorNoturna', 'descricaoSintomas'],
      };
    }

    if (
      sinaisCentral.includes('hipersens') ||
      sintomas.includes('dor difusa') ||
      sintomas.includes('dor generalizada')
    ) {
      return {
        principal: 'NOCIPLASTICA',
        subtipo: 'MIOFASCIAL',
        confidence: 'MODERADA',
        reason: 'Padrao de sensibilizacao central/dor difusa sugere nociplastia.',
        evidenceFields: ['sinaisSensibilizacaoCentral', 'descricaoSintomas'],
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

  private inferEvolucaoSoapSuggestion(args: {
    anamnese?: Anamnese | null;
    evolucao?: Evolucao | null;
    laudo?: Laudo | null;
  }): {
    confidence: CharlesEvolucaoSoapSuggestionResponse['confidence'];
    reason: string;
    evidenceFields: string[];
    subjetivo: string | null;
    objetivo: string | null;
    avaliacao: string | null;
    plano: string | null;
  } {
    const anamnese = args.anamnese;
    const evolucao = args.evolucao;
    const laudo = args.laudo;

    const queixa =
      String(anamnese?.descricaoSintomas || '').trim() ||
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
        reason:
          'Dados insuficientes (anamnese e exame fisico) para sugerir preenchimento de evolucao.',
        evidenceFields: [],
        subjetivo: null,
        objetivo: null,
        avaliacao: null,
        plano: null,
      };
    }

    const regionHint = areas.length ? `regiao ${areas.join(', ')}` : 'regiao principal';
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

    const plano =
      'Manter conduta ativa com progressao graduada, reforcar orientacoes domiciliares e agendar nova reavaliacao.';

    const evidenceFields: string[] = [];
    if (queixa) evidenceFields.push('queixaPrincipal/descricaoSintomas');
    if (areas.length) evidenceFields.push('areasAfetadas');
    if (piora) evidenceFields.push('fatoresPiora');
    if (alivio) evidenceFields.push('fatorAlivio');
    if (exameTemplated) evidenceFields.push('laudo.exameFisico');
    if (hadPreviousEvolution) evidenceFields.push('evolucaoAnterior');

    return {
      confidence: evidenceFields.length >= 3 ? 'MODERADA' : 'BAIXA',
      reason:
        'Sugestao textual de evolucao (SOAP) baseada em anamnese, exame fisico e historico mais recente.',
      evidenceFields,
      subjetivo,
      objetivo,
      avaliacao,
      plano,
    };
  }
}
