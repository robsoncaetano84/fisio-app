import { ForbiddenException } from '@nestjs/common';
import { LaudoStatus } from '../laudos/entities/laudo.entity';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
} from './entities/paciente.entity';
import { PacienteSelfProfileService } from './paciente-self-profile.service';

describe('PacienteSelfProfileService', () => {
  const makeService = () => {
    const pacienteRepository = {
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };
    const usuarioRepository = {
      findOne: jest.fn(),
    };
    const evolucaoRepository = {
      findOne: jest.fn(),
    };
    const laudoRepository = {
      findOne: jest.fn(),
    };
    const pacienteListService = {
      applyDisplayNameFallback: jest.fn((paciente) => paciente),
    };
    const pacienteVinculoService = {
      findPacienteByActiveVinculo: jest.fn(),
      findActiveVinculoByPacienteUsuarioId: jest.fn(),
      closeVinculoAtivoByPaciente: jest.fn(),
    };
    const service = new PacienteSelfProfileService(
      pacienteRepository as any,
      usuarioRepository as any,
      evolucaoRepository as any,
      laudoRepository as any,
      pacienteListService as any,
      pacienteVinculoService as any,
    );

    return {
      service,
      pacienteRepository,
      usuarioRepository,
      evolucaoRepository,
      laudoRepository,
      pacienteListService,
      pacienteVinculoService,
    };
  };

  const paciente = {
    id: 'paciente-1',
    nomeCompleto: 'Paciente',
    cpf: '12345678901',
    usuarioId: 'profissional-1',
    pacienteUsuarioId: 'usuario-paciente',
    ativo: true,
    cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
    vinculoStatus: PacienteVinculoStatus.VINCULADO,
  } as Paciente;

  const usuarioPaciente = {
    id: 'usuario-paciente',
    nome: 'Maria Silva',
    email: 'maria@example.com',
    role: UserRole.PACIENTE,
  } as Usuario;

  it('creates self paciente with optional address fields for paciente users', async () => {
    const { service, pacienteRepository, usuarioRepository } = makeService();
    pacienteRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    usuarioRepository.findOne.mockResolvedValue(usuarioPaciente);

    const result =
      await service.findOrCreateSelfPacienteForUsuario('usuario-paciente');

    expect(pacienteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nomeCompleto: 'Maria Silva',
        sexo: Sexo.OUTRO,
        usuarioId: 'usuario-paciente',
        pacienteUsuarioId: 'usuario-paciente',
        enderecoRua: null,
        enderecoNumero: null,
        enderecoBairro: null,
        enderecoCep: null,
        enderecoCidade: null,
        enderecoUf: null,
        anamneseLiberadaPaciente: true,
        cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
        vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
        conviteExpiraEm: null,
      }),
    );
    expect(result).toMatchObject({
      nomeCompleto: 'Maria Silva',
      pacienteUsuarioId: 'usuario-paciente',
    });
  });

  it('returns linked profile summary when active vinculo exists', async () => {
    const {
      service,
      evolucaoRepository,
      laudoRepository,
      pacienteVinculoService,
    } = makeService();
    const ultimaEvolucao = new Date('2026-01-05T00:00:00.000Z');
    const ultimoLaudo = new Date('2026-01-06T00:00:00.000Z');
    pacienteVinculoService.findPacienteByActiveVinculo.mockResolvedValue(
      paciente,
    );
    pacienteVinculoService.findActiveVinculoByPacienteUsuarioId.mockResolvedValue(
      { id: 'vinculo-1' },
    );
    evolucaoRepository.findOne.mockResolvedValue({ data: ultimaEvolucao });
    laudoRepository.findOne.mockResolvedValue({
      updatedAt: ultimoLaudo,
      status: LaudoStatus.VALIDADO_PROFISSIONAL,
    });

    const result = await service.getMyPacienteProfile(usuarioPaciente);

    expect(result).toEqual({
      vinculado: true,
      paciente,
      resumo: {
        ultimaEvolucaoEm: ultimaEvolucao,
        ultimoLaudoAtualizadoEm: ultimoLaudo,
        statusLaudo: LaudoStatus.VALIDADO_PROFISSIONAL,
      },
    });
  });

  it('updates only allowed profile fields', async () => {
    const { service, pacienteRepository, pacienteVinculoService } =
      makeService();
    pacienteVinculoService.findPacienteByActiveVinculo.mockResolvedValue({
      ...paciente,
    });

    const result = await service.updateMyPacienteProfile(usuarioPaciente, {
      nomeCompleto: 'Maria Atualizada',
      ativo: false,
    } as any);

    expect(result).toMatchObject({
      nomeCompleto: 'Maria Atualizada',
      ativo: true,
    });
    expect(pacienteRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nomeCompleto: 'Maria Atualizada',
        ativo: true,
      }),
    );
  });

  it('rejects non-paciente users for self profile access', async () => {
    const { service } = makeService();

    await expect(
      service.getMyPacienteProfile({
        ...usuarioPaciente,
        role: UserRole.USER,
      } as Usuario),
    ).rejects.toThrow(ForbiddenException);
  });

  it('unlinks paciente from professional through self-service flow', async () => {
    const { service, pacienteRepository, pacienteVinculoService } =
      makeService();
    pacienteVinculoService.findPacienteByActiveVinculo.mockResolvedValue({
      ...paciente,
    });

    await expect(
      service.unlinkMyProfessional(usuarioPaciente),
    ).resolves.toEqual({
      pacienteId: 'paciente-1',
    });
    expect(pacienteRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        pacienteUsuarioId: null,
        vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
        conviteExpiraEm: null,
        conviteAceitoEm: null,
      }),
    );
    expect(
      pacienteVinculoService.closeVinculoAtivoByPaciente,
    ).toHaveBeenCalledWith('paciente-1');
  });
});
