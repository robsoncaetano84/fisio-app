import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
} from './entities/paciente.entity';
import {
  ProfissionalPacienteVinculo,
  ProfissionalPacienteVinculoOrigem,
  ProfissionalPacienteVinculoStatus,
} from './entities/profissional-paciente-vinculo.entity';
import { shouldReplaceQuickInviteName } from './paciente-quick-invite.util';

@Injectable()
export class PacienteVinculoService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(ProfissionalPacienteVinculo)
    private readonly vinculoRepository: Repository<ProfissionalPacienteVinculo>,
  ) {}

  resolveInitialVinculoStatus(
    pacienteUsuarioId: string | null,
    cadastroOrigem?: PacienteCadastroOrigem,
  ): PacienteVinculoStatus {
    if (pacienteUsuarioId) {
      if (cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO) {
        return PacienteVinculoStatus.VINCULADO_PENDENTE_COMPLEMENTO;
      }
      return PacienteVinculoStatus.VINCULADO;
    }
    return PacienteVinculoStatus.SEM_VINCULO;
  }

  resolveVinculoOrigem(
    cadastroOrigem?: PacienteCadastroOrigem,
  ): ProfissionalPacienteVinculoOrigem {
    if (cadastroOrigem === PacienteCadastroOrigem.CONVITE_RAPIDO) {
      return ProfissionalPacienteVinculoOrigem.CONVITE_RAPIDO;
    }
    return ProfissionalPacienteVinculoOrigem.CADASTRO_ASSISTIDO;
  }

  async vincularPacienteUsuarioAoCadastro(
    pacienteParaVinculo: Paciente,
    pacienteUsuario: Usuario,
  ): Promise<Paciente> {
    return this.pacienteRepository.manager.transaction(async (manager) => {
      const pacienteRepo = manager.getRepository(Paciente);
      const vinculoRepo = manager.getRepository(ProfissionalPacienteVinculo);

      const pacienteLocked = await pacienteRepo
        .createQueryBuilder('paciente')
        .where('paciente.id = :id', { id: pacienteParaVinculo.id })
        .setLock('pessimistic_write')
        .getOne();

      if (!pacienteLocked) {
        throw new BadRequestException('Paciente do convite nao encontrado');
      }

      let pacienteDestino = pacienteLocked;

      if (pacienteLocked.pacienteUsuarioId) {
        if (pacienteLocked.pacienteUsuarioId === pacienteUsuario.id) {
          pacienteLocked.vinculoStatus = this.resolveInitialVinculoStatus(
            pacienteUsuario.id,
            pacienteLocked.cadastroOrigem,
          );
          if (!pacienteLocked.conviteAceitoEm) {
            pacienteLocked.conviteAceitoEm = new Date();
          }
          pacienteLocked.conviteExpiraEm = null;
          pacienteDestino = await pacienteRepo.save(pacienteLocked);
        } else {
          throw new BadRequestException('Paciente ja possui usuario vinculado');
        }
      } else {
        const vinculoExistente = await pacienteRepo.findOne({
          where: { pacienteUsuarioId: pacienteUsuario.id },
        });

        if (vinculoExistente && vinculoExistente.id !== pacienteLocked.id) {
          const cadastroAutonomoDoPaciente =
            vinculoExistente.ativo &&
            vinculoExistente.usuarioId === pacienteUsuario.id;

          if (!cadastroAutonomoDoPaciente) {
            throw new BadRequestException(
              'Usuario paciente ja vinculado a outro cadastro',
            );
          }

          vinculoExistente.usuarioId = pacienteLocked.usuarioId;
          vinculoExistente.cadastroOrigem = pacienteLocked.cadastroOrigem;
          vinculoExistente.vinculoStatus = this.resolveInitialVinculoStatus(
            pacienteUsuario.id,
            pacienteLocked.cadastroOrigem,
          );
          vinculoExistente.conviteExpiraEm = null;
          vinculoExistente.conviteAceitoEm = new Date();

          if (
            shouldReplaceQuickInviteName(vinculoExistente.nomeCompleto) &&
            pacienteLocked.nomeCompleto
          ) {
            vinculoExistente.nomeCompleto = pacienteLocked.nomeCompleto;
          }
          if (!vinculoExistente.contatoEmail && pacienteLocked.contatoEmail) {
            vinculoExistente.contatoEmail = pacienteLocked.contatoEmail;
          }
          if (
            !vinculoExistente.contatoWhatsapp &&
            pacienteLocked.contatoWhatsapp
          ) {
            vinculoExistente.contatoWhatsapp = pacienteLocked.contatoWhatsapp;
          }

          pacienteDestino = await pacienteRepo.save(vinculoExistente);

          pacienteLocked.ativo = false;
          pacienteLocked.pacienteUsuarioId = null;
          pacienteLocked.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
          pacienteLocked.conviteExpiraEm = null;
          pacienteLocked.conviteAceitoEm = null;
          await pacienteRepo.save(pacienteLocked);
        } else {
          const vinculoAtivoTabela = await vinculoRepo.findOne({
            where: {
              pacienteUsuarioId: pacienteUsuario.id,
              status: ProfissionalPacienteVinculoStatus.ATIVO,
            },
          });

          if (
            vinculoAtivoTabela &&
            vinculoAtivoTabela.pacienteId !== pacienteLocked.id
          ) {
            throw new BadRequestException(
              'Usuario paciente ja vinculado a outro cadastro',
            );
          }

          pacienteLocked.pacienteUsuarioId = pacienteUsuario.id;
          pacienteLocked.vinculoStatus = this.resolveInitialVinculoStatus(
            pacienteUsuario.id,
            pacienteLocked.cadastroOrigem,
          );
          pacienteLocked.conviteExpiraEm = null;
          pacienteLocked.conviteAceitoEm = new Date();
          pacienteDestino = await pacienteRepo.save(pacienteLocked);
        }
      }

      await vinculoRepo.update(
        {
          pacienteId: pacienteDestino.id,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
        {
          status: ProfissionalPacienteVinculoStatus.ENCERRADO,
          endedAt: new Date(),
        },
      );

      await vinculoRepo.update(
        {
          pacienteUsuarioId: pacienteUsuario.id,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
        {
          status: ProfissionalPacienteVinculoStatus.ENCERRADO,
          endedAt: new Date(),
        },
      );

      await vinculoRepo.save(
        vinculoRepo.create({
          profissionalId: pacienteDestino.usuarioId,
          pacienteId: pacienteDestino.id,
          pacienteUsuarioId: pacienteUsuario.id,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
          origem: this.resolveVinculoOrigem(pacienteDestino.cadastroOrigem),
          endedAt: null,
        }),
      );

      return pacienteDestino;
    });
  }

  async upsertVinculoAtivo(
    paciente: Paciente,
    pacienteUsuarioId: string,
  ): Promise<void> {
    await this.vinculoRepository.manager.transaction(async (manager) => {
      const vinculoRepo = manager.getRepository(ProfissionalPacienteVinculo);

      await vinculoRepo.update(
        {
          pacienteId: paciente.id,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
        {
          status: ProfissionalPacienteVinculoStatus.ENCERRADO,
          endedAt: new Date(),
        },
      );

      const existingAtivoByPacienteUsuario = await vinculoRepo.findOne({
        where: {
          pacienteUsuarioId,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
      });

      if (existingAtivoByPacienteUsuario) {
        if (existingAtivoByPacienteUsuario.pacienteId !== paciente.id) {
          throw new ConflictException(
            'Este usuario paciente ja esta vinculado',
          );
        }

        await vinculoRepo.update(
          { id: existingAtivoByPacienteUsuario.id },
          {
            profissionalId: paciente.usuarioId,
            origem: this.resolveVinculoOrigem(paciente.cadastroOrigem),
            endedAt: null,
          },
        );
        return;
      }

      await vinculoRepo.save(
        vinculoRepo.create({
          profissionalId: paciente.usuarioId,
          pacienteId: paciente.id,
          pacienteUsuarioId,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
          origem: this.resolveVinculoOrigem(paciente.cadastroOrigem),
          endedAt: null,
        }),
      );
    });
  }

  async closeVinculoAtivoByPaciente(pacienteId: string): Promise<void> {
    await this.vinculoRepository.manager.transaction(async (manager) => {
      await manager.getRepository(ProfissionalPacienteVinculo).update(
        {
          pacienteId,
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        },
        {
          status: ProfissionalPacienteVinculoStatus.ENCERRADO,
          endedAt: new Date(),
        },
      );
    });
  }

  async validatePacienteUsuarioId(
    pacienteUsuarioId: string | undefined,
    ignorePacienteId?: string,
  ): Promise<string | null> {
    if (!pacienteUsuarioId) {
      return null;
    }

    const usuarioPaciente = await this.usuarioRepository.findOne({
      where: { id: pacienteUsuarioId, ativo: true },
    });

    if (!usuarioPaciente) {
      throw new NotFoundException('Usuario do paciente nao encontrado');
    }

    if (usuarioPaciente.role !== UserRole.PACIENTE) {
      throw new ConflictException(
        'Usuario informado nao possui perfil PACIENTE',
      );
    }

    const existingLink = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId },
    });

    if (existingLink && existingLink.id !== ignorePacienteId) {
      const isPacienteAutonomo =
        existingLink.ativo && existingLink.usuarioId === pacienteUsuarioId;
      if (!isPacienteAutonomo) {
        throw new ConflictException('Este usuario paciente ja esta vinculado');
      }
    }

    const existingActiveVinculo = await this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
    });

    if (
      existingActiveVinculo &&
      existingActiveVinculo.pacienteId !== ignorePacienteId
    ) {
      throw new ConflictException('Este usuario paciente ja esta vinculado');
    }

    return pacienteUsuarioId;
  }

  async findPacienteByActiveVinculo(
    usuarioId: string,
  ): Promise<Paciente | null> {
    const vinculoAtivo =
      await this.findActiveVinculoByPacienteUsuarioId(usuarioId);

    const vinculoAtivoLegado =
      vinculoAtivo ||
      (await this.vinculoRepository
        .createQueryBuilder('v')
        .innerJoin(Paciente, 'p', 'p.id = v.paciente_id')
        .where('v.status = :status', {
          status: ProfissionalPacienteVinculoStatus.ATIVO,
        })
        .andWhere('p.pacienteUsuarioId = :usuarioId', { usuarioId })
        .orderBy('v.createdAt', 'DESC')
        .getOne());

    if (!vinculoAtivoLegado) {
      return null;
    }

    return this.pacienteRepository.findOne({
      where: { id: vinculoAtivoLegado.pacienteId, ativo: true },
    });
  }

  async findActiveVinculoByPacienteUsuarioId(
    usuarioId: string,
  ): Promise<ProfissionalPacienteVinculo | null> {
    return this.vinculoRepository.findOne({
      where: {
        pacienteUsuarioId: usuarioId,
        status: ProfissionalPacienteVinculoStatus.ATIVO,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
