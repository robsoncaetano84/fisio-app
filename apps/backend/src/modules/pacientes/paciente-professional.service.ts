import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
} from './entities/paciente.entity';
import { PacienteListService } from './paciente-list.service';
import { PacienteScopeService } from './paciente-scope.service';
import { PacienteVinculoService } from './paciente-vinculo.service';

@Injectable()
export class PacienteProfessionalService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly pacienteListService: PacienteListService,
    private readonly pacienteScopeService: PacienteScopeService,
    private readonly pacienteVinculoService: PacienteVinculoService,
  ) {}

  private async findScopedPacienteOrFail(
    id: string,
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Paciente> {
    const paciente = await this.pacienteScopeService.findScopedPacienteById(
      id,
      usuarioId,
      isMasterAdmin,
    );

    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    return this.pacienteListService.applyDisplayNameFallback(paciente);
  }

  async create(
    createPacienteDto: CreatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const existingPaciente = await this.pacienteRepository.findOne({
      where: { cpf: createPacienteDto.cpf, usuarioId },
    });

    if (existingPaciente) {
      throw new ConflictException('CPF ja cadastrado');
    }

    const pacienteUsuarioId =
      await this.pacienteVinculoService.validatePacienteUsuarioId(
        createPacienteDto.pacienteUsuarioId,
      );

    const cadastroOrigem =
      createPacienteDto.cadastroOrigem ||
      PacienteCadastroOrigem.CADASTRO_ASSISTIDO;

    if (pacienteUsuarioId) {
      const pacienteAutonomo = await this.pacienteRepository.findOne({
        where: { pacienteUsuarioId, ativo: true },
      });
      const podeAdotarCadastroAutonomo =
        !!pacienteAutonomo && pacienteAutonomo.usuarioId === pacienteUsuarioId;

      if (podeAdotarCadastroAutonomo && pacienteAutonomo) {
        Object.assign(pacienteAutonomo, {
          ...createPacienteDto,
          cadastroOrigem,
          vinculoStatus:
            this.pacienteVinculoService.resolveInitialVinculoStatus(
              pacienteUsuarioId,
              cadastroOrigem,
            ),
          conviteEnviadoEm: null,
          conviteAceitoEm: new Date(),
          usuarioId,
          pacienteUsuarioId,
        });
        const savedAutonomo =
          await this.pacienteRepository.save(pacienteAutonomo);
        await this.pacienteVinculoService.upsertVinculoAtivo(
          savedAutonomo,
          pacienteUsuarioId,
        );
        return savedAutonomo;
      }
    }

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto,
      cadastroOrigem,
      vinculoStatus: this.pacienteVinculoService.resolveInitialVinculoStatus(
        pacienteUsuarioId,
        cadastroOrigem,
      ),
      conviteEnviadoEm: null,
      conviteAceitoEm: pacienteUsuarioId ? new Date() : null,
      usuarioId,
      pacienteUsuarioId,
    });

    const saved = await this.pacienteRepository.save(paciente);

    if (saved.pacienteUsuarioId) {
      await this.pacienteVinculoService.upsertVinculoAtivo(
        saved,
        saved.pacienteUsuarioId,
      );
    }

    return saved;
  }

  async update(
    id: string,
    updatePacienteDto: UpdatePacienteDto,
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Paciente> {
    const paciente = await this.findScopedPacienteOrFail(
      id,
      usuarioId,
      isMasterAdmin,
    );

    if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
      const existingPaciente = await this.pacienteRepository.findOne({
        where: { cpf: updatePacienteDto.cpf, usuarioId: paciente.usuarioId },
      });

      if (existingPaciente) {
        throw new ConflictException('CPF ja cadastrado');
      }
    }

    const hasPacienteUsuarioIdPatch = 'pacienteUsuarioId' in updatePacienteDto;
    const {
      pacienteUsuarioId: _pacienteUsuarioId,
      vinculoStatus: requestedVinculoStatus,
      cadastroOrigem: requestedCadastroOrigem,
      ...safePatch
    } = updatePacienteDto;

    Object.assign(paciente, safePatch);

    let shouldSyncVinculo = false;
    if (requestedCadastroOrigem) {
      paciente.cadastroOrigem = requestedCadastroOrigem;
      if (paciente.pacienteUsuarioId) {
        shouldSyncVinculo = true;
      }
    }

    if (hasPacienteUsuarioIdPatch) {
      const pacienteUsuarioId =
        await this.pacienteVinculoService.validatePacienteUsuarioId(
          _pacienteUsuarioId,
          paciente.id,
        );

      paciente.pacienteUsuarioId = pacienteUsuarioId;
      paciente.vinculoStatus = pacienteUsuarioId
        ? this.pacienteVinculoService.resolveInitialVinculoStatus(
            pacienteUsuarioId,
            paciente.cadastroOrigem ||
              PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
          )
        : PacienteVinculoStatus.SEM_VINCULO;

      if (!pacienteUsuarioId) {
        paciente.conviteAceitoEm = null;
      } else if (!paciente.conviteAceitoEm) {
        paciente.conviteAceitoEm = new Date();
      }
      shouldSyncVinculo = true;
    }

    if (!hasPacienteUsuarioIdPatch && requestedVinculoStatus) {
      paciente.vinculoStatus = requestedVinculoStatus;
    }

    if (updatePacienteDto.anamneseLiberadaPaciente === true) {
      paciente.anamneseSolicitacaoPendente = false;
      paciente.anamneseSolicitacaoEm = null;
    }

    const saved = await this.pacienteRepository.save(paciente);

    if (shouldSyncVinculo) {
      if (saved.pacienteUsuarioId) {
        await this.pacienteVinculoService.upsertVinculoAtivo(
          saved,
          saved.pacienteUsuarioId,
        );
      } else {
        await this.pacienteVinculoService.closeVinculoAtivoByPaciente(saved.id);
      }
    }

    return saved;
  }

  async unlinkPacienteUsuarioByProfessional(
    id: string,
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Paciente> {
    const paciente = await this.findScopedPacienteOrFail(
      id,
      usuarioId,
      isMasterAdmin,
    );

    if (!paciente.pacienteUsuarioId) {
      throw new BadRequestException('Paciente nao possui usuario vinculado');
    }

    paciente.pacienteUsuarioId = null;
    paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
    paciente.conviteAceitoEm = null;
    const saved = await this.pacienteRepository.save(paciente);
    await this.pacienteVinculoService.closeVinculoAtivoByPaciente(saved.id);
    return saved;
  }

  async revokePacienteInviteByProfessional(
    id: string,
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Paciente> {
    const paciente = await this.findScopedPacienteOrFail(
      id,
      usuarioId,
      isMasterAdmin,
    );

    if (paciente.pacienteUsuarioId) {
      throw new BadRequestException(
        'Paciente ja possui acesso ativo ao app. Use desvincular acesso.',
      );
    }

    if (paciente.vinculoStatus !== PacienteVinculoStatus.CONVITE_ENVIADO) {
      throw new BadRequestException('Paciente nao possui convite pendente');
    }

    paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
    paciente.conviteEnviadoEm = null;
    paciente.conviteAceitoEm = null;
    return this.pacienteRepository.save(paciente);
  }

  async remove(
    id: string,
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<void> {
    let paciente: Paciente;
    try {
      paciente = await this.findScopedPacienteOrFail(
        id,
        usuarioId,
        isMasterAdmin,
      );
    } catch (error) {
      // Idempotencia: se nao estiver mais no escopo (ja removido/desvinculado),
      // nao quebrar o fluxo de exclusao no cliente.
      if (error instanceof NotFoundException) {
        return;
      }
      throw error;
    }

    if (paciente.pacienteUsuarioId) {
      // Paciente com conta no app: remove da carteira do profissional
      // mantendo o cadastro ativo para o proprio paciente.
      paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
      await this.pacienteRepository.save(paciente);
      await this.pacienteVinculoService.closeVinculoAtivoByPaciente(
        paciente.id,
      );
      return;
    }

    // Paciente sem conta vinculada: inativacao do cadastro do profissional.
    paciente.ativo = false;
    await this.pacienteRepository.save(paciente);
    await this.pacienteVinculoService.closeVinculoAtivoByPaciente(paciente.id);
  }
}
