import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';
import {
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
} from './entities/paciente.entity';
import { PacienteListService } from './paciente-list.service';
import { PacienteVinculoService } from './paciente-vinculo.service';

@Injectable()
export class PacienteSelfProfileService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    @InjectRepository(Laudo)
    private readonly laudoRepository: Repository<Laudo>,
    private readonly pacienteListService: PacienteListService,
    private readonly pacienteVinculoService: PacienteVinculoService,
  ) {}

  private async generateUniquePacienteCpf(): Promise<string> {
    for (let i = 0; i < 25; i++) {
      const base = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const cpf = base.slice(-11).padStart(11, '0');
      const exists = await this.pacienteRepository.findOne({ where: { cpf } });
      if (!exists) return cpf;
    }
    throw new BadRequestException(
      'Nao foi possivel gerar CPF temporario para paciente',
    );
  }

  async findOrCreateSelfPacienteForUsuario(
    usuarioId: string,
  ): Promise<Paciente> {
    const existente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuarioId, ativo: true },
      order: { createdAt: 'DESC' },
    });
    if (existente) {
      return existente;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId, ativo: true },
    });

    if (!usuario || usuario.role !== UserRole.PACIENTE) {
      throw new NotFoundException('Usuario paciente nao encontrado');
    }

    const cpfTemporario = await this.generateUniquePacienteCpf();

    const paciente = this.pacienteRepository.create({
      nomeCompleto: usuario.nome || 'Paciente',
      cpf: cpfTemporario,
      dataNascimento: new Date('1900-01-01'),
      sexo: Sexo.OUTRO,
      profissao: '',
      enderecoRua: null,
      enderecoNumero: null,
      enderecoBairro: null,
      enderecoCep: null,
      enderecoCidade: null,
      enderecoUf: null,
      contatoWhatsapp: '00000000000',
      contatoEmail: usuario.email,
      ativo: true,
      usuarioId: usuario.id,
      pacienteUsuarioId: usuario.id,
      anamneseLiberadaPaciente: true,
      cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
      vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      conviteEnviadoEm: null,
      conviteAceitoEm: null,
    });

    return this.pacienteRepository.save(paciente);
  }

  async findLinkedPacienteByUsuarioId(usuarioId: string): Promise<Paciente> {
    const pacienteByVinculo =
      await this.pacienteVinculoService.findPacienteByActiveVinculo(usuarioId);

    if (pacienteByVinculo) {
      return pacienteByVinculo;
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuarioId, ativo: true },
    });

    if (!paciente) {
      throw new NotFoundException('Nenhum cadastro de paciente vinculado');
    }

    return paciente;
  }

  async findPacienteByUsuarioId(usuarioId: string): Promise<Paciente | null> {
    const pacienteByVinculo =
      await this.pacienteVinculoService.findPacienteByActiveVinculo(usuarioId);

    if (pacienteByVinculo) {
      return pacienteByVinculo;
    }

    return this.pacienteRepository.findOne({
      where: { pacienteUsuarioId: usuarioId, ativo: true },
      order: { conviteAceitoEm: 'DESC', updatedAt: 'DESC' },
    });
  }

  async getMyPacienteProfile(
    usuario: Usuario,
  ): Promise<PacienteProfileResponseDto> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.findPacienteByUsuarioId(usuario.id);

    if (!paciente) {
      return {
        vinculado: false,
        paciente: null,
        resumo: null,
      };
    }

    const vinculoAtivo =
      await this.pacienteVinculoService.findActiveVinculoByPacienteUsuarioId(
        usuario.id,
      );

    if (!vinculoAtivo) {
      return {
        vinculado: false,
        paciente,
        resumo: null,
      };
    }

    const latestEvolucao = await this.evolucaoRepository.findOne({
      where: { pacienteId: paciente.id },
      order: { data: 'DESC' },
    });

    const latestLaudo = await this.laudoRepository.findOne({
      where: { pacienteId: paciente.id },
      order: { updatedAt: 'DESC' },
    });

    return {
      vinculado: true,
      paciente,
      resumo: {
        ultimaEvolucaoEm: latestEvolucao?.data || null,
        ultimoLaudoAtualizadoEm: latestLaudo?.updatedAt || null,
        statusLaudo: latestLaudo?.status || null,
      },
    };
  }

  async updateMyPacienteProfile(
    usuario: Usuario,
    updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const pacienteExistente = await this.findPacienteByUsuarioId(usuario.id);
    const paciente =
      pacienteExistente ||
      (await this.findOrCreateSelfPacienteForUsuario(usuario.id));

    if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
      const existingPaciente = await this.pacienteRepository.findOne({
        where: {
          cpf: updatePacienteDto.cpf,
          usuarioId: paciente.usuarioId,
        },
      });

      if (existingPaciente && existingPaciente.id !== paciente.id) {
        throw new ConflictException('CPF ja cadastrado');
      }
    }

    const allowedFields: (keyof UpdatePacienteDto)[] = [
      'nomeCompleto',
      'cpf',
      'rg',
      'dataNascimento',
      'sexo',
      'estadoCivil',
      'profissao',
      'enderecoRua',
      'enderecoNumero',
      'enderecoComplemento',
      'enderecoBairro',
      'enderecoCep',
      'enderecoCidade',
      'enderecoUf',
      'contatoWhatsapp',
      'contatoTelefone',
      'contatoEmail',
    ];

    const safePatch: Partial<UpdatePacienteDto> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updatePacienteDto, field)) {
        (safePatch as Record<string, unknown>)[field] = (
          updatePacienteDto as Record<string, unknown>
        )[field];
      }
    }

    Object.assign(paciente, safePatch);
    const saved = await this.pacienteRepository.save(paciente);
    return this.pacienteListService.applyDisplayNameFallback(saved);
  }

  async unlinkMyProfessional(
    usuario: Usuario,
  ): Promise<{ pacienteId: string }> {
    if (usuario.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('Acesso permitido somente para pacientes');
    }

    const paciente = await this.findLinkedPacienteByUsuarioId(usuario.id);

    paciente.pacienteUsuarioId = null;
    paciente.vinculoStatus = PacienteVinculoStatus.SEM_VINCULO;
    paciente.conviteAceitoEm = null;
    await this.pacienteRepository.save(paciente);
    await this.pacienteVinculoService.closeVinculoAtivoByPaciente(paciente.id);

    return { pacienteId: paciente.id };
  }
}
