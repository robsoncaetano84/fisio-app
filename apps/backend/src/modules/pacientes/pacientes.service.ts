import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { PacienteExame } from './entities/paciente-exame.entity';
import {
  ClinicalPhoto,
  ClinicalPhotoType,
  ClinicalPhotoView,
} from './entities/clinical-photo.entity';
import { ClinicalPhotoComparison } from './entities/clinical-photo-comparison.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { PacienteProfileResponseDto } from './dto/paciente-profile-response.dto';
import {
  PacienteListItemDto,
  PacientePagedResponseDto,
} from './dto/paciente-list-item.dto';
import { PacienteMediaService } from './paciente-media.service';
import { PacienteListService } from './paciente-list.service';
import { PacienteDashboardService } from './paciente-dashboard.service';
import { PacienteSelfProfileService } from './paciente-self-profile.service';
import { PacienteScopeService } from './paciente-scope.service';
import { PacienteProfessionalService } from './paciente-professional.service';

@Injectable()
export class PacientesService {
  private masterAdminEmailsCache: Set<string> | null = null;
  private readonly masterByUserIdCache = new Map<string, boolean>();

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly configService: ConfigService,
    private readonly pacienteMediaService: PacienteMediaService,
    private readonly pacienteListService: PacienteListService,
    private readonly pacienteDashboardService: PacienteDashboardService,
    private readonly pacienteSelfProfileService: PacienteSelfProfileService,
    private readonly pacienteScopeService: PacienteScopeService,
    private readonly pacienteProfessionalService: PacienteProfessionalService,
  ) {}

  private getMasterAdminEmails(): Set<string> {
    if (this.masterAdminEmailsCache) return this.masterAdminEmailsCache;
    const raw = (
      this.configService.get<string>('MASTER_ADMIN_EMAILS') || ''
    ).trim();
    const emails = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    this.masterAdminEmailsCache = new Set(emails);
    return this.masterAdminEmailsCache;
  }

  async isMasterAdminByUsuarioId(usuarioId: string): Promise<boolean> {
    if (!usuarioId) return false;
    if (this.masterByUserIdCache.has(usuarioId)) {
      return this.masterByUserIdCache.get(usuarioId) === true;
    }

    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId, ativo: true },
      select: ['id', 'email'],
    });
    const email = (usuario?.email || '').trim().toLowerCase();
    const isMaster = !!email && this.getMasterAdminEmails().has(email);
    this.masterByUserIdCache.set(usuarioId, isMaster);
    return isMaster;
  }

  async findOrCreateSelfPacienteForUsuario(
    usuarioId: string,
  ): Promise<Paciente> {
    return this.pacienteSelfProfileService.findOrCreateSelfPacienteForUsuario(
      usuarioId,
    );
  }

  async revokePacienteInviteByProfessional(
    id: string,
    usuarioId: string,
  ): Promise<PacienteListItemDto> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const paciente =
      await this.pacienteProfessionalService.revokePacienteInviteByProfessional(
        id,
        usuarioId,
        isMasterAdmin,
      );
    return this.toPacienteListItemWithCiclo(paciente);
  }

  async create(
    createPacienteDto: CreatePacienteDto,
    usuarioId: string,
  ): Promise<PacienteListItemDto> {
    const paciente = await this.pacienteProfessionalService.create(
      createPacienteDto,
      usuarioId,
    );
    return this.toPacienteListItemWithCiclo(paciente);
  }

  async findAll(usuarioId: string): Promise<PacienteListItemDto[]> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const pacientes = await this.pacienteListService
      .addPacienteListSelects(
        this.pacienteScopeService.buildScopedPacientesQuery(
          usuarioId,
          isMasterAdmin,
        ),
      )
      .orderBy('p.nomeCompleto', 'ASC')
      .getMany();

    const statusByPaciente =
      await this.pacienteListService.buildCicloStatusByPacienteIds(
        pacientes.map((paciente) => paciente.id),
      );

    return pacientes.map((paciente) =>
      this.pacienteListService.toPacienteListItem(
        this.pacienteListService.applyDisplayNameFallback(paciente),
        statusByPaciente.get(paciente.id),
      ),
    );
  }

  async findPaged(
    usuarioId: string,
    page: number,
    limit: number,
  ): Promise<PacientePagedResponseDto> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const safeLimit = Number.isFinite(limit)
      ? Math.min(100, Math.max(10, limit))
      : 30;
    const skip = (safePage - 1) * safeLimit;

    const baseQuery = this.pacienteScopeService.buildScopedPacientesQuery(
      usuarioId,
      isMasterAdmin,
    );
    const total = await baseQuery.clone().getCount();
    const data = await this.pacienteListService
      .addPacienteListSelects(baseQuery)
      .orderBy('p.nomeCompleto', 'ASC')
      .take(safeLimit)
      .skip(skip)
      .getMany();

    const statusByPaciente =
      await this.pacienteListService.buildCicloStatusByPacienteIds(
        data.map((paciente) => paciente.id),
      );

    return {
      data: data.map((paciente) =>
        this.pacienteListService.toPacienteListItem(
          this.pacienteListService.applyDisplayNameFallback(paciente),
          statusByPaciente.get(paciente.id),
        ),
      ),
      total,
      page: safePage,
      limit: safeLimit,
      hasNext: skip + data.length < total,
    };
  }

  async findOne(id: string, usuarioId: string): Promise<Paciente> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
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

  async findOneListItem(
    id: string,
    usuarioId: string,
  ): Promise<PacienteListItemDto> {
    const paciente = await this.findOne(id, usuarioId);
    return this.toPacienteListItemWithCiclo(paciente);
  }

  async update(
    id: string,
    updatePacienteDto: UpdatePacienteDto,
    usuarioId: string,
  ): Promise<PacienteListItemDto> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    const paciente = await this.pacienteProfessionalService.update(
      id,
      updatePacienteDto,
      usuarioId,
      isMasterAdmin,
    );
    return this.toPacienteListItemWithCiclo(paciente);
  }

  private async toPacienteListItemWithCiclo(
    paciente: Paciente,
  ): Promise<PacienteListItemDto> {
    const statusByPaciente =
      await this.pacienteListService.buildCicloStatusByPacienteIds([
        paciente.id,
      ]);

    return this.pacienteListService.toPacienteListItem(
      this.pacienteListService.applyDisplayNameFallback(paciente),
      statusByPaciente.get(paciente.id),
    );
  }

  async unlinkPacienteUsuarioByProfessional(
    id: string,
    usuarioId: string,
  ): Promise<Paciente> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    return this.pacienteProfessionalService.unlinkPacienteUsuarioByProfessional(
      id,
      usuarioId,
      isMasterAdmin,
    );
  }

  async unlinkMyProfessional(
    usuario: Usuario,
  ): Promise<{ pacienteId: string }> {
    return this.pacienteSelfProfileService.unlinkMyProfessional(usuario);
  }

  async findLinkedPacienteByUsuarioId(usuarioId: string): Promise<Paciente> {
    return this.pacienteSelfProfileService.findLinkedPacienteByUsuarioId(
      usuarioId,
    );
  }

  async findPacienteByUsuarioId(usuarioId: string): Promise<Paciente | null> {
    return this.pacienteSelfProfileService.findPacienteByUsuarioId(usuarioId);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    return this.pacienteProfessionalService.remove(
      id,
      usuarioId,
      isMasterAdmin,
    );
  }

  async getAttentionMap(
    usuarioId: string,
  ): Promise<Record<string, number | null>> {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    return this.pacienteDashboardService.getAttentionMap(
      usuarioId,
      isMasterAdmin,
    );
  }

  async getStats(usuarioId: string) {
    const isMasterAdmin = await this.isMasterAdminByUsuarioId(usuarioId);
    return this.pacienteDashboardService.getStats(usuarioId, isMasterAdmin);
  }

  async getMyPacienteProfile(
    usuario: Usuario,
  ): Promise<PacienteProfileResponseDto> {
    return this.pacienteSelfProfileService.getMyPacienteProfile(usuario);
  }

  async updateMyPacienteProfile(
    usuario: Usuario,
    updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    return this.pacienteSelfProfileService.updateMyPacienteProfile(
      usuario,
      updatePacienteDto,
    );
  }

  private async resolveExameScope(
    pacienteId: string,
    actor: Usuario,
  ): Promise<{ paciente: Paciente; ownerUsuarioId: string }> {
    const isMasterAdmin =
      actor.role === UserRole.PACIENTE
        ? false
        : await this.isMasterAdminByUsuarioId(actor.id);
    return this.pacienteScopeService.resolvePacienteOwnerScope(
      pacienteId,
      actor,
      isMasterAdmin,
    );
  }

  async resolveExameOwnerUsuarioId(
    pacienteId: string,
    actor: Usuario,
  ): Promise<string> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return ownerUsuarioId;
  }

  async listExames(
    pacienteId: string,
    actor: Usuario,
  ): Promise<PacienteExame[]> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.listExames(pacienteId, ownerUsuarioId);
  }

  async createExame(
    pacienteId: string,
    actor: Usuario,
    payload: {
      nomeOriginal: string;
      nomeArquivo: string;
      mimeType: string;
      tamanhoBytes: number;
      caminhoArquivo: string;
      tipoExame?: string;
      observacao?: string;
      dataExame?: Date | null;
    },
  ): Promise<PacienteExame> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.createExame(
      pacienteId,
      ownerUsuarioId,
      payload,
    );
  }

  async findExameOrFail(
    pacienteId: string,
    exameId: string,
    actor: Usuario,
  ): Promise<PacienteExame> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.findExameOrFail(
      pacienteId,
      exameId,
      ownerUsuarioId,
    );
  }

  async removeExame(
    pacienteId: string,
    exameId: string,
    actor: Usuario,
  ): Promise<PacienteExame> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.removeExame(
      pacienteId,
      exameId,
      ownerUsuarioId,
    );
  }

  async listClinicalPhotos(
    pacienteId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto[]> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.listClinicalPhotos(
      pacienteId,
      ownerUsuarioId,
    );
  }

  async listClinicalPhotoComparisons(
    pacienteId: string,
    actor: Usuario,
  ): Promise<ClinicalPhotoComparison[]> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.listClinicalPhotoComparisons(
      pacienteId,
      ownerUsuarioId,
    );
  }

  async createClinicalPhoto(
    pacienteId: string,
    actor: Usuario,
    payload: {
      nomeOriginal: string;
      nomeArquivo: string;
      mimeType: string;
      tamanhoBytes: number;
      caminhoArquivo: string;
      tipo?: ClinicalPhotoType;
      vista?: ClinicalPhotoView;
      regiao?: string;
      lado?: string;
      intensidadeDor?: number | null;
      observacao?: string;
      dataFoto?: Date | null;
    },
  ): Promise<ClinicalPhoto> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.createClinicalPhoto(
      pacienteId,
      ownerUsuarioId,
      payload,
    );
  }

  async findClinicalPhotoOrFail(
    pacienteId: string,
    photoId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.findClinicalPhotoOrFail(
      pacienteId,
      photoId,
      ownerUsuarioId,
    );
  }

  async removeClinicalPhoto(
    pacienteId: string,
    photoId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.removeClinicalPhoto(
      pacienteId,
      photoId,
      ownerUsuarioId,
    );
  }

  async analyzeClinicalPhoto(
    pacienteId: string,
    photoId: string,
    actor: Usuario,
  ): Promise<ClinicalPhoto> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.analyzeClinicalPhoto(
      pacienteId,
      photoId,
      ownerUsuarioId,
    );
  }

  async compareClinicalPhotos(
    pacienteId: string,
    actor: Usuario,
    payload: {
      baselinePhotoId: string;
      followupPhotoId: string;
      regiao?: string;
      vista?: string;
      observacao?: string;
    },
  ): Promise<ClinicalPhotoComparison> {
    const { ownerUsuarioId } = await this.resolveExameScope(pacienteId, actor);
    return this.pacienteMediaService.compareClinicalPhotos(
      pacienteId,
      ownerUsuarioId,
      payload,
    );
  }
}
