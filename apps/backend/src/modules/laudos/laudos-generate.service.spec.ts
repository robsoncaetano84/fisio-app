// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// L AU DO S G EN ER AT E.S PE C
// ==========================================
import { Repository } from 'typeorm';
import { LaudosService } from './laudos.service';
import { Laudo, LaudoStatus } from './entities/laudo.entity';
import { LaudoAiGeneration } from './entities/laudo-ai-generation.entity';
import { LaudoHistorico } from './entities/laudo-historico.entity';
import { Anamnese } from '../anamneses/entities/anamnese.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';

/**
 * F5: geracao de laudo por IA nao pode ficar presa a um rascunho generico de
 * um timeout, nao deve sobrescrever documento validado, e o slot diario so e
 * gasto numa geracao bem-sucedida.
 */
describe('LaudosService.generateAndSaveByPaciente (F5)', () => {
  let laudoRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let pacientesService: { findOne: jest.Mock };
  let service: LaudosService;

  const pacienteFake = {
    id: 'p1',
    dataNascimento: new Date('1990-01-01'),
    sexo: 'MASCULINO',
    profissao: 'analista',
  };

  beforeEach(() => {
    laudoRepo = {
      findOne: jest.fn(),
      create: jest.fn((x) => x as Laudo),
      save: jest.fn(async (x) => x as Laudo),
    };
    pacientesService = { findOne: jest.fn().mockResolvedValue(pacienteFake) };

    service = new LaudosService(
      laudoRepo as unknown as Repository<Laudo>,
      { find: jest.fn().mockResolvedValue([]) } as unknown as Repository<Anamnese>,
      { find: jest.fn().mockResolvedValue([]) } as unknown as Repository<Evolucao>,
      {} as unknown as Repository<LaudoAiGeneration>,
      {
        create: jest.fn((x) => x),
        save: jest.fn(async (x) => x),
      } as unknown as Repository<LaudoHistorico>,
      pacientesService as unknown as PacientesService,
      {} as unknown as UsuariosService,
    );
  });

  function spyAcquire(value: boolean) {
    return jest
      .spyOn(service as never, 'acquireDailyAiGenerationSlot')
      .mockResolvedValue(value as never);
  }
  function spyRelease() {
    return jest
      .spyOn(service as never, 'releaseDailyAiGenerationSlot')
      .mockResolvedValue(undefined as never);
  }
  function spyAi(result: Record<string, unknown>) {
    return jest
      .spyOn(service as never, 'generateSuggestionWithAI')
      .mockResolvedValue(result as never);
  }

  it('nao sobrescreve laudo ja validado, mesmo com regenerate=true', async () => {
    const validated = { id: 'L1', status: LaudoStatus.VALIDADO_PROFISSIONAL } as Laudo;
    laudoRepo.findOne.mockResolvedValue(validated);
    const ai = spyAi({ diagnosticoFuncional: 'IA' });

    const result = await service.generateAndSaveByPaciente('p1', 'u1', {
      regenerate: true,
    });

    expect(result).toBe(validated);
    expect(ai).not.toHaveBeenCalled();
    expect(laudoRepo.save).not.toHaveBeenCalled();
  });

  it('no fluxo de leitura (regenerate=false) devolve o rascunho existente sem chamar IA', async () => {
    const draft = { id: 'L1', status: LaudoStatus.RASCUNHO_IA } as Laudo;
    laudoRepo.findOne.mockResolvedValue(draft);
    const ai = spyAi({ diagnosticoFuncional: 'IA' });

    const result = await service.generateAndSaveByPaciente('p1', 'u1');

    expect(result).toBe(draft);
    expect(ai).not.toHaveBeenCalled();
  });

  it('regenera o rascunho e libera o slot quando a IA falha (retorna {})', async () => {
    const draft = {
      id: 'L1',
      status: LaudoStatus.RASCUNHO_IA,
      diagnosticoFuncional: 'antigo',
    } as Laudo;
    laudoRepo.findOne.mockResolvedValue(draft);
    spyAcquire(true);
    const release = spyRelease();
    spyAi({});

    const result = await service.generateAndSaveByPaciente('p1', 'u1', {
      regenerate: true,
    });

    expect(release).toHaveBeenCalledTimes(1); // slot devolvido apos falha
    expect(laudoRepo.save).toHaveBeenCalledWith(draft);
    expect(result.status).toBe(LaudoStatus.RASCUNHO_IA);
    // caiu no texto de fallback (nao ficou preso, foi reescrito)
    expect(result.diagnosticoFuncional).toContain('inicial');
  });

  it('cria laudo com o conteudo da IA quando nao existe e a IA responde', async () => {
    laudoRepo.findOne.mockResolvedValue(null);
    spyAcquire(true);
    const release = spyRelease();
    spyAi({ diagnosticoFuncional: 'Diagnostico IA especifico' });

    const result = await service.generateAndSaveByPaciente('p1', 'u1');

    expect(release).not.toHaveBeenCalled(); // sucesso: slot permanece gasto
    expect(laudoRepo.create).toHaveBeenCalled();
    expect(laudoRepo.save).toHaveBeenCalled();
    expect(result.diagnosticoFuncional).toBe('Diagnostico IA especifico');
  });

  it('usa fallback sem chamar IA quando o slot diario ja foi gasto', async () => {
    laudoRepo.findOne.mockResolvedValue(null);
    spyAcquire(false); // slot indisponivel
    const ai = spyAi({ diagnosticoFuncional: 'nao deveria' });

    const result = await service.generateAndSaveByPaciente('p1', 'u1');

    expect(ai).not.toHaveBeenCalled();
    expect(result.diagnosticoFuncional).toContain('inicial');
  });
});
