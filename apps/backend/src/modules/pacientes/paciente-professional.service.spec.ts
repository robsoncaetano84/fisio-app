import { BadRequestException, ConflictException } from '@nestjs/common';
import { PacienteProfessionalService } from './paciente-professional.service';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
} from './entities/paciente.entity';

describe('PacienteProfessionalService', () => {
  const makeService = () => {
    const pacienteRepository = {
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };
    const pacienteListService = {
      applyDisplayNameFallback: jest.fn((paciente) => paciente),
    };
    const pacienteScopeService = {
      findScopedPacienteById: jest.fn(),
    };
    const pacienteVinculoService = {
      validatePacienteUsuarioId: jest.fn(async (id) => id || null),
      resolveInitialVinculoStatus: jest.fn((pacienteUsuarioId) =>
        pacienteUsuarioId
          ? PacienteVinculoStatus.VINCULADO
          : PacienteVinculoStatus.SEM_VINCULO,
      ),
      upsertVinculoAtivo: jest.fn(),
      closeVinculoAtivoByPaciente: jest.fn(),
    };
    const service = new PacienteProfessionalService(
      pacienteRepository as any,
      pacienteListService as any,
      pacienteScopeService as any,
      pacienteVinculoService as any,
    );

    return {
      service,
      pacienteRepository,
      pacienteListService,
      pacienteScopeService,
      pacienteVinculoService,
    };
  };

  const createDto = {
    nomeCompleto: 'Paciente Exemplo',
    cpf: '12345678901',
    dataNascimento: '1990-01-01',
    sexo: Sexo.FEMININO,
    enderecoRua: 'Rua Teste',
    enderecoNumero: '123',
    enderecoBairro: 'Centro',
    enderecoCep: '12345678',
    enderecoCidade: 'Sao Paulo',
    enderecoUf: 'SP',
    contatoWhatsapp: '11999999999',
  };

  const paciente = {
    id: 'paciente-1',
    nomeCompleto: 'Paciente Exemplo',
    cpf: '12345678901',
    usuarioId: 'profissional-1',
    pacienteUsuarioId: 'usuario-paciente',
    ativo: true,
    cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
    vinculoStatus: PacienteVinculoStatus.VINCULADO,
    conviteAceitoEm: new Date('2026-01-01T00:00:00.000Z'),
  } as Paciente;

  it('rejects duplicate cpf when creating professional paciente', async () => {
    const { service, pacienteRepository } = makeService();
    pacienteRepository.findOne.mockResolvedValue({ id: 'existente' });

    await expect(service.create(createDto, 'profissional-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates paciente and upserts active vinculo when linked user is present', async () => {
    const { service, pacienteRepository, pacienteVinculoService } =
      makeService();
    pacienteRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    pacienteVinculoService.validatePacienteUsuarioId.mockResolvedValue(
      'usuario-paciente',
    );

    const result = await service.create(
      { ...createDto, pacienteUsuarioId: 'usuario-paciente' },
      'profissional-1',
    );

    expect(pacienteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: '12345678901',
        usuarioId: 'profissional-1',
        pacienteUsuarioId: 'usuario-paciente',
        cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
        conviteAceitoEm: expect.any(Date),
      }),
    );
    expect(result).toMatchObject({ pacienteUsuarioId: 'usuario-paciente' });
    expect(pacienteVinculoService.upsertVinculoAtivo).toHaveBeenCalledWith(
      expect.objectContaining({ pacienteUsuarioId: 'usuario-paciente' }),
      'usuario-paciente',
    );
  });

  it('updates paciente and closes vinculo when linked user is removed', async () => {
    const {
      service,
      pacienteRepository,
      pacienteScopeService,
      pacienteVinculoService,
    } = makeService();
    pacienteScopeService.findScopedPacienteById.mockResolvedValue({
      ...paciente,
    });
    pacienteVinculoService.validatePacienteUsuarioId.mockResolvedValue(null);

    const result = await service.update(
      'paciente-1',
      { pacienteUsuarioId: undefined },
      'profissional-1',
    );

    expect(result).toMatchObject({
      vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      conviteAceitoEm: null,
    });
    expect(pacienteRepository.save).toHaveBeenCalled();
    expect(
      pacienteVinculoService.closeVinculoAtivoByPaciente,
    ).toHaveBeenCalledWith('paciente-1');
  });

  it('keeps calculated vinculo invariants when raw dto contains conflicting status', async () => {
    const { service, pacienteScopeService, pacienteVinculoService } =
      makeService();
    pacienteScopeService.findScopedPacienteById.mockResolvedValue({
      ...paciente,
    });
    pacienteVinculoService.validatePacienteUsuarioId.mockResolvedValue(null);

    const result = await service.update(
      'paciente-1',
      {
        pacienteUsuarioId: undefined,
        vinculoStatus: PacienteVinculoStatus.VINCULADO,
      },
      'profissional-1',
    );

    expect(result).toMatchObject({
      pacienteUsuarioId: null,
      vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      conviteAceitoEm: null,
    });
  });

  it('throws when professional tries to unlink paciente without linked user', async () => {
    const { service, pacienteScopeService } = makeService();
    pacienteScopeService.findScopedPacienteById.mockResolvedValue({
      ...paciente,
      pacienteUsuarioId: null,
    });

    await expect(
      service.unlinkPacienteUsuarioByProfessional(
        'paciente-1',
        'profissional-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps linked paciente active when removing from professional wallet', async () => {
    const {
      service,
      pacienteRepository,
      pacienteScopeService,
      pacienteVinculoService,
    } = makeService();
    pacienteScopeService.findScopedPacienteById.mockResolvedValue({
      ...paciente,
    });

    await service.remove('paciente-1', 'profissional-1');

    expect(pacienteRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'paciente-1',
        ativo: true,
        vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      }),
    );
    expect(
      pacienteVinculoService.closeVinculoAtivoByPaciente,
    ).toHaveBeenCalledWith('paciente-1');
  });

  it('inactivates unlinked paciente when removing professional-only record', async () => {
    const { service, pacienteRepository, pacienteScopeService } = makeService();
    pacienteScopeService.findScopedPacienteById.mockResolvedValue({
      ...paciente,
      pacienteUsuarioId: null,
    });

    await service.remove('paciente-1', 'profissional-1');

    expect(pacienteRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'paciente-1',
        ativo: false,
      }),
    );
  });
});
