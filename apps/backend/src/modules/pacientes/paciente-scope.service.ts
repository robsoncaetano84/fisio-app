import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { Paciente } from './entities/paciente.entity';
import {
  ProfissionalPacienteVinculo,
  ProfissionalPacienteVinculoStatus,
} from './entities/profissional-paciente-vinculo.entity';
import { PacienteSelfProfileService } from './paciente-self-profile.service';

@Injectable()
export class PacienteScopeService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(ProfissionalPacienteVinculo)
    private readonly vinculoRepository: Repository<ProfissionalPacienteVinculo>,
    private readonly pacienteSelfProfileService: PacienteSelfProfileService,
  ) {}

  buildScopedPacientesQuery(usuarioId: string, isMasterAdmin = false) {
    if (isMasterAdmin) {
      return this.pacienteRepository
        .createQueryBuilder('p')
        .where('p.ativo = :ativo', { ativo: true });
    }

    const vinculoTable = this.vinculoRepository.metadata.tableName;
    return this.pacienteRepository
      .createQueryBuilder('p')
      .leftJoin(
        vinculoTable,
        'vScope',
        'vScope.paciente_id = p.id AND vScope.profissional_id = :usuarioId AND vScope.status = :vinculoStatusAtivo',
        {
          usuarioId,
          vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
        },
      )
      .where('p.ativo = :ativo', { ativo: true })
      .andWhere('(p.usuarioId = :usuarioId OR vScope.id IS NOT NULL)', {
        usuarioId,
        vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
      });
  }

  buildScopedAttentionRowsQuery(
    usuarioId: string,
    isMasterAdmin: boolean,
    evolucaoTableName: string,
  ) {
    const rowsQuery = this.pacienteRepository
      .createQueryBuilder('p')
      .leftJoin(evolucaoTableName, 'e', 'e.paciente_id = p.id')
      .where('p.ativo = :ativo', { ativo: true })
      .select('p.id', 'pacienteId')
      .addSelect('p.createdAt', 'createdAt')
      .addSelect('MAX(e.data)', 'lastEvolucaoAt')
      .groupBy('p.id')
      .addGroupBy('p.createdAt');

    if (!isMasterAdmin) {
      rowsQuery
        .leftJoin(
          this.vinculoRepository.metadata.tableName,
          'vScope',
          'vScope.paciente_id = p.id AND vScope.profissional_id = :usuarioId AND vScope.status = :vinculoStatusAtivo',
          {
            usuarioId,
            vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
          },
        )
        .andWhere('(p.usuarioId = :usuarioId OR vScope.id IS NOT NULL)', {
          usuarioId,
          vinculoStatusAtivo: ProfissionalPacienteVinculoStatus.ATIVO,
        });
    }

    return rowsQuery;
  }

  async findScopedPacienteById(
    pacienteId: string,
    usuarioId: string,
    isMasterAdmin = false,
  ): Promise<Paciente | null> {
    return this.buildScopedPacientesQuery(usuarioId, isMasterAdmin)
      .andWhere('p.id = :id', { id: pacienteId })
      .leftJoin('p.pacienteUsuario', 'pacienteUsuario')
      .addSelect(['pacienteUsuario.id', 'pacienteUsuario.nome'])
      .getOne();
  }

  async resolvePacienteOwnerScope(
    pacienteId: string,
    actor: Usuario,
    isMasterAdmin = false,
  ): Promise<{ paciente: Paciente; ownerUsuarioId: string }> {
    if (actor.role === UserRole.PACIENTE) {
      const linkedPaciente =
        await this.pacienteSelfProfileService.findLinkedPacienteByUsuarioId(
          actor.id,
        );
      if (linkedPaciente.id !== pacienteId) {
        throw new ForbiddenException(
          'Paciente sem permissao para este recurso',
        );
      }
      return {
        paciente: linkedPaciente,
        ownerUsuarioId: linkedPaciente.usuarioId,
      };
    }

    const paciente = await this.findScopedPacienteById(
      pacienteId,
      actor.id,
      isMasterAdmin,
    );
    if (!paciente) {
      throw new NotFoundException('Paciente nao encontrado');
    }

    return {
      paciente,
      ownerUsuarioId: paciente.usuarioId,
    };
  }
}
