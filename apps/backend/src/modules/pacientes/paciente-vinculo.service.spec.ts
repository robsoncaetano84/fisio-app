/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { ConflictException } from '@nestjs/common';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
} from './entities/paciente.entity';
import {
  ProfissionalPacienteVinculoOrigem,
  ProfissionalPacienteVinculoStatus,
} from './entities/profissional-paciente-vinculo.entity';
import { PacienteVinculoService } from './paciente-vinculo.service';

describe('PacienteVinculoService', () => {
  const makeQueryBuilder = (result: unknown = null) => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  });

  const makeService = () => {
    const transactionRepo = {
      update: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn(),
    };
    const lockedPacienteBuilder = {
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    transactionRepo.createQueryBuilder.mockReturnValue(lockedPacienteBuilder);
    const manager = {
      getRepository: jest.fn(() => transactionRepo),
    };
    const pacienteRepository = {
      findOne: jest.fn(),
      manager: {
        transaction: jest.fn(async (callback) => callback(manager)),
      },
    };
    const usuarioRepository = {
      findOne: jest.fn(),
    };
    const vinculoRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
      manager: {
        transaction: jest.fn(async (callback) => callback(manager)),
      },
    };

    const service = new PacienteVinculoService(
      pacienteRepository as any,
      usuarioRepository as any,
      vinculoRepository as any,
    );

    return {
      service,
      pacienteRepository,
      usuarioRepository,
      vinculoRepository,
      transactionRepo,
      lockedPacienteBuilder,
      manager,
    };
  };

  it('resolves initial vinculo status from linked user and origin', () => {
    const { service } = makeService();

    expect(service.resolveInitialVinculoStatus(null)).toBe(
      PacienteVinculoStatus.SEM_VINCULO,
    );
    expect(
      service.resolveInitialVinculoStatus(
        'usuario-paciente',
        PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
      ),
    ).toBe(PacienteVinculoStatus.VINCULADO);
    expect(
      service.resolveInitialVinculoStatus(
        'usuario-paciente',
        PacienteCadastroOrigem.CONVITE_RAPIDO,
      ),
    ).toBe(PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO);
  });

  it('validates paciente user and allows autonomous self registration adoption', async () => {
    const {
      service,
      usuarioRepository,
      pacienteRepository,
      vinculoRepository,
    } = makeService();
    usuarioRepository.findOne.mockResolvedValue({
      id: 'usuario-paciente',
      role: UserRole.PACIENTE,
    } as Usuario);
    pacienteRepository.findOne.mockResolvedValue({
      id: 'paciente-autonomo',
      usuarioId: 'usuario-paciente',
      ativo: true,
    } as Paciente);
    vinculoRepository.findOne.mockResolvedValue(null);

    await expect(
      service.validatePacienteUsuarioId('usuario-paciente'),
    ).resolves.toBe('usuario-paciente');
  });

  it('rejects paciente user already linked to another professional record', async () => {
    const { service, usuarioRepository, pacienteRepository } = makeService();
    usuarioRepository.findOne.mockResolvedValue({
      id: 'usuario-paciente',
      role: UserRole.PACIENTE,
    } as Usuario);
    pacienteRepository.findOne.mockResolvedValue({
      id: 'paciente-outro',
      usuarioId: 'profissional-outro',
      ativo: true,
    } as Paciente);

    await expect(
      service.validatePacienteUsuarioId('usuario-paciente'),
    ).rejects.toThrow(ConflictException);
  });

  it('creates active vinculo when none exists for the paciente user', async () => {
    const { service, transactionRepo } = makeService();
    transactionRepo.findOne.mockResolvedValue(null);

    await service.upsertVinculoAtivo(
      {
        id: 'paciente-1',
        usuarioId: 'profissional-1',
        cadastroOrigem: PacienteCadastroOrigem.CONVITE_RAPIDO,
      } as Paciente,
      'usuario-paciente',
    );

    expect(transactionRepo.update).toHaveBeenCalledWith(
      {
        pacienteId: 'paciente-1',
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      expect.objectContaining({
        status: ProfissionalPacienteVinculoStatus.ENCERRADO,
        endedAt: expect.any(Date),
      }),
    );
    expect(transactionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        profissionalId: 'profissional-1',
        pacienteId: 'paciente-1',
        pacienteUsuarioId: 'usuario-paciente',
        status: ProfissionalPacienteVinculoStatus.ATIVO,
        origem: ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO,
      }),
    );
  });

  it('links invited paciente user through the domain service', async () => {
    const { service, transactionRepo, lockedPacienteBuilder } = makeService();
    const pacienteLocked = {
      id: 'paciente-1',
      usuarioId: 'profissional-1',
      pacienteUsuarioId: null,
      cadastroOrigem: PacienteCadastroOrigem.CONVITE_RAPIDO,
      conviteAceitoEm: null,
    } as Paciente;
    lockedPacienteBuilder.getOne.mockResolvedValue(pacienteLocked);
    transactionRepo.findOne.mockResolvedValue(null);
    transactionRepo.save.mockImplementation(async (input) => input);

    const result = await service.vincularPacienteUsuarioAoCadastro(
      { id: 'paciente-1' } as Paciente,
      { id: 'usuario-paciente', role: UserRole.PACIENTE } as Usuario,
    );

    expect(result).toMatchObject({
      pacienteUsuarioId: 'usuario-paciente',
      vinculoStatus: PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO,
      conviteAceitoEm: expect.any(Date),
    });
    expect(transactionRepo.update).toHaveBeenCalledWith(
      {
        pacienteId: 'paciente-1',
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      expect.objectContaining({
        status: ProfissionalPacienteVinculoStatus.ENCERRADO,
      }),
    );
    expect(transactionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        profissionalId: 'profissional-1',
        pacienteId: 'paciente-1',
        pacienteUsuarioId: 'usuario-paciente',
        status: ProfissionalPacienteVinculoStatus.ATIVO,
        origem: ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO,
      }),
    );
  });

  it('finds paciente by active vinculo before legacy fallback', async () => {
    const { service, pacienteRepository, vinculoRepository } = makeService();
    vinculoRepository.findOne.mockResolvedValue({ pacienteId: 'paciente-1' });
    pacienteRepository.findOne.mockResolvedValue({ id: 'paciente-1' });

    await expect(
      service.findPacienteByActiveVinculo('usuario-paciente'),
    ).resolves.toEqual({ id: 'paciente-1' });
    expect(pacienteRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'paciente-1', ativo: true },
    });
    expect(vinculoRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
