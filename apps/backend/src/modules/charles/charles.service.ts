import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PacientesService } from '../pacientes/pacientes.service';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceService } from '../clinical-governance/clinical-governance.service';
import { OpenAiService } from '../ai/openai.service';
import {
  buildDorClassificationSuggestionAuditPayload,
  buildEvolucaoSoapSuggestionAuditPayload,
  buildNextActionAuditPayload,
} from './charles-audit.util';
import {
  buildCharlesNextActionResponse,
  type CharlesNextActionResponse,
} from './charles-next-action.util';
import { inferDorClassificationFromAnamnese } from './charles-dor-classification.util';
import {
  mapDorClassificationSuggestionResponse,
  mapEvolucaoSoapSuggestionResponse,
  type CharlesEvolucaoSoapSuggestionResponse,
  type CharlesExameFisicoDorSuggestionResponse,
} from './charles-suggestion-response.mapper';
import {
  buildEvolucaoSoapAiPrompt,
  CHARLES_SOAP_AI_OPERATION,
  inferEvolucaoSoapSuggestion,
  mergeSoapSuggestions,
  sanitizeAiSoapSuggestion,
  type CharlesSoapSuggestionDraft,
} from './charles-soap-suggestion.util';

export type {
  CharlesClinicalStage,
  CharlesNextAction,
  CharlesNextActionResponse,
  CharlesStageItem,
  CharlesStageStatus,
} from './charles-next-action.util';
export type {
  CharlesEvolucaoSoapSuggestionResponse,
  CharlesExameFisicoDorSuggestionResponse,
} from './charles-suggestion-response.mapper';

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
    @Optional()
    private readonly openAiService?: OpenAiService,
  ) {}

  async getNextAction(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesNextActionResponse> {
    const paciente = await this.pacientesService.findOne(
      pacienteId,
      usuario.id,
    );

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

    const response = buildCharlesNextActionResponse({
      paciente,
      latestAnamnese,
      latestEvolucao,
      latestLaudo,
      activeProtocol,
    });

    await this.writeAuditSafe(
      buildNextActionAuditPayload({
        actor: usuario,
        response,
      }),
    );

    return response;
  }

  async getExameFisicoDorSuggestion(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesExameFisicoDorSuggestionResponse> {
    const paciente = await this.pacientesService.findOne(
      pacienteId,
      usuario.id,
    );
    const latestAnamnese = await this.anamneseRepository.findOne({
      where: { pacienteId: paciente.id },
      order: { createdAt: 'DESC' },
    });
    const suggestion = inferDorClassificationFromAnamnese(latestAnamnese);
    const activeProtocol = await this.getActiveProtocolSafe(usuario);

    await this.writeAuditSafe(
      buildDorClassificationSuggestionAuditPayload({
        actor: usuario,
        patientId: paciente.id,
        suggestion,
        activeProtocol,
      }),
    );

    return mapDorClassificationSuggestionResponse({
      patientId: paciente.id,
      suggestion,
      activeProtocol,
    });
  }

  async getEvolucaoSoapSuggestion(
    pacienteId: string,
    usuario: Usuario,
  ): Promise<CharlesEvolucaoSoapSuggestionResponse> {
    const paciente = await this.pacientesService.findOne(
      pacienteId,
      usuario.id,
    );
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

    const fallbackSuggestion = inferEvolucaoSoapSuggestion({
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
      ? mergeSoapSuggestions(fallbackSuggestion, aiSuggestion)
      : fallbackSuggestion;
    const activeProtocol = await this.getActiveProtocolSafe(usuario);

    await this.writeAuditSafe(
      buildEvolucaoSoapSuggestionAuditPayload({
        actor: usuario,
        patientId: paciente.id,
        suggestion,
        activeProtocol,
      }),
    );

    return mapEvolucaoSoapSuggestionResponse({
      patientId: paciente.id,
      suggestion,
      activeProtocol,
    });
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

  private async writeAuditSafe(
    payload: Parameters<ClinicalGovernanceService['writeAudit']>[0],
  ): Promise<void> {
    try {
      await this.governanceService.writeAudit(payload);
    } catch {
      // Best-effort audit: falha de auditoria nao deve interromper fluxo clinico.
    }
  }

  private async generateEvolucaoSoapWithOpenAI(args: {
    paciente: {
      dataNascimento?: Date | null;
      sexo?: string | null;
      profissao?: string | null;
    };
    anamnese?: Anamnese | null;
    evolucao?: Evolucao | null;
    laudo?: Laudo | null;
    fallback: CharlesSoapSuggestionDraft;
  }): Promise<CharlesSoapSuggestionDraft | null> {
    if (!this.openAiService?.isConfigured()) return null;
    if (!this.openAiService.isEnabled('OPENAI_CHARLES_AI_ENABLED', true)) {
      return null;
    }

    const model = this.openAiService.resolveModel(
      ['OPENAI_CHARLES_MODEL', 'OPENAI_LAUDO_MODEL', 'OPENAI_MODEL'],
      'gpt-5-mini',
    );
    const timeoutMs = this.openAiService.getPositiveIntegerEnv(
      'OPENAI_CHARLES_TIMEOUT_MS',
      12000,
      120000,
    );
    const { systemPrompt, userPrompt } = buildEvolucaoSoapAiPrompt(args);

    const response = await this.openAiService.createJsonResponse({
      model,
      systemPrompt,
      userContent: userPrompt,
      temperature: 0.2,
      timeoutMs,
      operation: CHARLES_SOAP_AI_OPERATION,
    });
    if (!response) return null;

    return sanitizeAiSoapSuggestion(response.parsed);
  }
}
