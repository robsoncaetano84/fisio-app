// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// E VO LU CO ES U PD AT E.S PE C
// ==========================================
import { Repository } from 'typeorm';
import { EvolucoesService } from './evolucoes.service';
import { Evolucao } from './entities/evolucao.entity';
import { PacientesService } from '../pacientes/pacientes.service';

/**
 * F17: o update nao pode remapear a evolucao para outro paciente (injecao
 * cross-tenant). O pacienteId original deve ser preservado.
 */
describe('EvolucoesService.update (F17)', () => {
  it('ignora pacienteId enviado no update e mantem o original', async () => {
    const evolucao = {
      id: 'e1',
      pacienteId: 'paciente-do-dono',
      paciente: { usuarioId: 'u1' },
      observacoes: 'antiga',
    } as unknown as Evolucao;

    const repo = {
      findOne: jest.fn().mockResolvedValue(evolucao),
      save: jest.fn(async (x: Evolucao) => x),
    } as unknown as Repository<Evolucao>;

    const service = new EvolucoesService(
      repo,
      {} as unknown as PacientesService,
    );

    const result = await service.update(
      'e1',
      { pacienteId: 'paciente-de-outro-profissional', observacoes: 'nova' } as never,
      'u1',
    );

    expect(result.pacienteId).toBe('paciente-do-dono');
    expect(result.observacoes).toBe('nova'); // demais campos sao aplicados
  });
});
