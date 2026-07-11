// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// E VO LU CO ES U PD AT E.S PE C
// ==========================================
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EvolucoesService } from './evolucoes.service';
import { Evolucao } from './entities/evolucao.entity';
import { PacientesService } from '../pacientes/pacientes.service';

/**
 * F17: o update nao pode remapear a evolucao para outro paciente (injecao
 * cross-tenant). Hoje a protecao e mais forte: evolucao registrada e imutavel,
 * entao qualquer update e recusado com BadRequestException — apos validar a
 * posse do paciente (pacientesService.findOne).
 */
describe('EvolucoesService.update (F17)', () => {
  it('recusa qualquer edicao de evolucao registrada (imutavel)', async () => {
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

    const pacientesService = {
      findOne: jest.fn().mockResolvedValue(evolucao.paciente),
    } as unknown as PacientesService;

    const service = new EvolucoesService(repo, pacientesService);

    await expect(
      service.update(
        'e1',
        {
          pacienteId: 'paciente-de-outro-profissional',
          observacoes: 'nova',
        } as never,
        'u1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    // Nao persiste nada e valida a posse do paciente original.
    expect(repo.save).not.toHaveBeenCalled();
    expect(pacientesService.findOne).toHaveBeenCalledWith(
      'paciente-do-dono',
      'u1',
    );
  });
});
