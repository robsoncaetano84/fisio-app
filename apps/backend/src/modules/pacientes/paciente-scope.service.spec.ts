import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { Paciente } from './entities/paciente.entity';
import { ProfissionalPacienteVinculoStatus } from './entities/profissional-paciente-vinculo.entity';
import { PacienteScopeService } from './paciente-scope.service';

describe('PacienteScopeService', () => {
  const makeQueryBuilder = (result: unknown = null) => ({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  });

  const makeService = (queryBuilder = makeQueryBuilder()) => {
    const pacienteRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const vinculoRepository = {
      metadata: { tableName: 'profissional_paciente_vinculos' },
    };
    const pacienteSelfProfileService = {
      findLinkedPacienteByUsuarioId: jest.fn(),
    };
    const service = new PacienteScopeService(
      pacienteRepository as any,
      vinculoRepository as any,
      pacienteSelfProfileService as any,
    );

    return {
      service,
      pacienteRepository,
      pacienteSelfProfileService,
      queryBuilder,
    };
  };

  it('builds professional scoped paciente query through active vinculo', () => {
    const { service, queryBuilder } = makeService();

    expect(service.buildScopedPacientesQuery('profissional-1')).toBe(
      queryBuilder,
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'profissional_paciente_vinculos',
      'vScope',
      expect.any(String),
      {
        usuarioId: 'profissional-1',
        vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '((p.usuarioId = :usuarioId AND p.pacienteUsuarioId IS NULL) OR vScope.id IS NOT NULL)',
      {
        usuarioId: 'profissional-1',
        vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    );
  });

  it('builds attention query with broader owner or active vinculo scope', () => {
    const { service, queryBuilder } = makeService();

    expect(
      service.buildScopedAttentionRowsQuery(
        'profissional-1',
        false,
        'evolucoes',
      ),
    ).toBe(queryBuilder);
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'evolucoes',
      'e',
      'e.paciente_id = p.id',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(p.usuarioId = :usuarioId OR vScope.id IS NOT NULL)',
      {
        usuarioId: 'profissional-1',
        vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    );
  });

  it('finds scoped paciente by id with linked user display data', async () => {
    const paciente = { id: 'paciente-1' } as Paciente;
    const { service, queryBuilder } = makeService(makeQueryBuilder(paciente));

    await expect(
      service.findScopedPacienteById('paciente-1', 'profissional-1'),
    ).resolves.toBe(paciente);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.id = :id', {
      id: 'paciente-1',
    });
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'p.pacienteUsuario',
      'pacienteUsuario',
    );
    expect(queryBuilder.addSelect).toHaveBeenCalledWith([
      'pacienteUsuario.id',
      'pacienteUsuario.nome',
    ]);
  });

  it('resolves paciente owner scope for paciente users', async () => {
    const paciente = {
      id: 'paciente-1',
      usuarioId: 'profissional-1',
    } as Paciente;
    const { service, pacienteSelfProfileService } = makeService();
    pacienteSelfProfileService.findLinkedPacienteByUsuarioId.mockResolvedValue(
      paciente,
    );

    await expect(
      service.resolvePacienteOwnerScope('paciente-1', {
        id: 'usuario-paciente',
        role: UserRole.PACIENTE,
      } as Usuario),
    ).resolves.toEqual({
      paciente,
      ownerUsuarioId: 'profissional-1',
    });
  });

  it('blocks paciente users from accessing another paciente scope', async () => {
    const { service, pacienteSelfProfileService } = makeService();
    pacienteSelfProfileService.findLinkedPacienteByUsuarioId.mockResolvedValue({
      id: 'paciente-1',
    } as Paciente);

    await expect(
      service.resolvePacienteOwnerScope('paciente-2', {
        id: 'usuario-paciente',
        role: UserRole.PACIENTE,
      } as Usuario),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws not found when professional has no scoped paciente access', async () => {
    const { service } = makeService(makeQueryBuilder(null));

    await expect(
      service.resolvePacienteOwnerScope('paciente-1', {
        id: 'profissional-1',
        role: UserRole.USER,
      } as Usuario),
    ).rejects.toThrow(NotFoundException);
  });
});
