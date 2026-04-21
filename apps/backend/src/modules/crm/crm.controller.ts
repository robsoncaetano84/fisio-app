// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// C RM.C ON TR OL LE R
// ==========================================
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CrmService } from './crm.service';
import { CreateCrmLeadDto } from './dto/create-crm-lead.dto';
import { UpdateCrmLeadDto } from './dto/update-crm-lead.dto';
import { CreateCrmTaskDto } from './dto/create-crm-task.dto';
import { UpdateCrmTaskDto } from './dto/update-crm-task.dto';
import { CreateCrmInteractionDto } from './dto/create-crm-interaction.dto';
import { UpdateCrmInteractionDto } from './dto/update-crm-interaction.dto';
import { CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTaskStatus } from './entities/crm-task.entity';

@Controller('crm')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class CrmController {
  private readonly logger = new Logger(CrmController.name);

  constructor(private readonly crmService: CrmService) {}

  private auditAdminAccess(
    usuario: Usuario,
    action: string,
    metadata?: Record<string, unknown>,
  ) {
    const includeSensitive =
      typeof metadata?.includeSensitive === 'boolean'
        ? Boolean(metadata.includeSensitive)
        : false;
    const sensitiveReason =
      typeof metadata?.sensitiveReason === 'string'
        ? metadata.sensitiveReason
        : undefined;
    this.logger.log(
      JSON.stringify({
        event: 'crm_admin_access',
        actorId: usuario.id,
        actorEmail: usuario.email,
        action,
        includeSensitive,
        sensitiveReason: includeSensitive ? sensitiveReason : undefined,
        ...(metadata || {}),
      }),
    );
    this.crmService
      .createAdminAuditLog({
        actorId: usuario.id,
        actorEmail: usuario.email,
        action,
        includeSensitive,
        sensitiveReason,
        metadata: metadata || {},
      })
      .catch((error) => {
        this.logger.warn(
          `failed_persist_crm_admin_audit action=${action} actor=${usuario.id} error=${error?.message || 'unknown'}`,
        );
      });
  }

  @Get('pipeline/summary')
  async getPipelineSummary(@CurrentUser() usuario: Usuario) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'pipeline_summary');
    return this.crmService.getPipelineSummary();
  }

  @Get('clinical/dashboard-summary')
  async getClinicalDashboardSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays') windowDays?: string,
    @Query('semEvolucaoDias') semEvolucaoDias?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'clinical_dashboard_summary', {
      windowDays,
      semEvolucaoDias,
    });
    return this.crmService.getClinicalDashboardSummary({
      windowDays: windowDays ? Number(windowDays) : 7,
      semEvolucaoDias: semEvolucaoDias ? Number(semEvolucaoDias) : 10,
    });
  }

  @Get('admin/profissionais')
  async listAdminProfissionais(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('ativo') ativo?: string,
    @Query('especialidade') especialidade?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'admin_profissionais_list', {
      q,
      ativo,
      especialidade,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
    });
    return this.crmService.listAdminProfissionais({
      q,
      ativo: parseBoolQuery(ativo),
      especialidade,
      includeSensitive: includeSensitiveBool,
    });
  }

  @Get('admin/profissionais-paged')
  async listAdminProfissionaisPaged(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('ativo') ativo?: string,
    @Query('especialidade') especialidade?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'admin_profissionais_paged', {
      q,
      ativo,
      especialidade,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      page,
      limit,
    });
    return this.crmService.listAdminProfissionaisPaged({
      q,
      ativo: parseBoolQuery(ativo),
      especialidade,
      includeSensitive: includeSensitiveBool,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('admin/pacientes')
  async listAdminPacientes(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('ativo') ativo?: string,
    @Query('vinculadoUsuarioPaciente') vinculadoUsuarioPaciente?: string,
    @Query('cidade') cidade?: string,
    @Query('uf') uf?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'admin_pacientes_list', {
      q,
      ativo,
      vinculadoUsuarioPaciente,
      cidade,
      uf,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
    });
    return this.crmService.listAdminPacientes({
      q,
      ativo: parseBoolQuery(ativo),
      vinculadoUsuarioPaciente: parseBoolQuery(vinculadoUsuarioPaciente),
      cidade,
      uf,
      includeSensitive: includeSensitiveBool,
    });
  }

  @Get('admin/pacientes-paged')
  async listAdminPacientesPaged(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('ativo') ativo?: string,
    @Query('vinculadoUsuarioPaciente') vinculadoUsuarioPaciente?: string,
    @Query('cidade') cidade?: string,
    @Query('uf') uf?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'admin_pacientes_paged', {
      q,
      ativo,
      vinculadoUsuarioPaciente,
      cidade,
      uf,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      page,
      limit,
    });
    return this.crmService.listAdminPacientesPaged({
      q,
      ativo: parseBoolQuery(ativo),
      vinculadoUsuarioPaciente: parseBoolQuery(vinculadoUsuarioPaciente),
      cidade,
      uf,
      includeSensitive: includeSensitiveBool,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('leads')
  async listLeads(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('stage') stage?: CrmLeadStage | 'TODOS',
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'leads_list', { q, stage });
    return this.crmService.listLeads({ q, stage });
  }

  @Get('admin/audit-logs')
  async listAdminAuditLogs(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('action') action?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'admin_audit_logs_list', {
      q,
      action,
      includeSensitive,
      page,
      limit,
    });
    return this.crmService.listAdminAuditLogs({
      q,
      action,
      includeSensitive: parseBoolQuery(includeSensitive),
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('leads-paged')
  async listLeadsPaged(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('stage') stage?: CrmLeadStage | 'TODOS',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'leads_paged', { q, stage, page, limit });
    return this.crmService.listLeadsPaged({
      q,
      stage,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('leads/:id')
  async getLeadById(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'lead_detail', { id });
    return this.crmService.getLeadById(id);
  }

  @Post('leads')
  async createLead(@CurrentUser() usuario: Usuario, @Body() dto: CreateCrmLeadDto) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'lead_create');
    return this.crmService.createLead(dto, usuario);
  }

  @Patch('leads/:id')
  async updateLead(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmLeadDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'lead_update', { id });
    return this.crmService.updateLead(id, dto);
  }

  @Delete('leads/:id')
  async deleteLead(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'lead_delete', { id });
    await this.crmService.deleteLead(id);
    return { success: true };
  }

  @Get('tasks')
  async listTasks(
    @CurrentUser() usuario: Usuario,
    @Query('status') status?: CrmTaskStatus | 'TODOS',
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'tasks_list', { status, limit });
    return this.crmService.listTasks({
      status,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('tasks-paged')
  async listTasksPaged(
    @CurrentUser() usuario: Usuario,
    @Query('status') status?: CrmTaskStatus | 'TODOS',
    @Query('leadId') leadId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'tasks_paged', {
      status,
      leadId,
      q,
      page,
      limit,
    });
    return this.crmService.listTasksPaged({
      status,
      leadId,
      q,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('tasks')
  async createTask(@CurrentUser() usuario: Usuario, @Body() dto: CreateCrmTaskDto) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'task_create');
    return this.crmService.createTask(dto, usuario);
  }

  @Patch('tasks/:id')
  async updateTask(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmTaskDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'task_update', { id });
    return this.crmService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  async deleteTask(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'task_delete', { id });
    await this.crmService.deleteTask(id);
    return { success: true };
  }

  @Get('leads/:leadId/interactions')
  async listInteractions(@CurrentUser() usuario: Usuario, @Param('leadId') leadId: string) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'interactions_list', { leadId });
    return this.crmService.listInteractions(leadId);
  }

  @Get('leads/:leadId/interactions-paged')
  async listInteractionsPaged(
    @CurrentUser() usuario: Usuario,
    @Param('leadId') leadId: string,
    @Query('tipo') tipo?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'interactions_paged', {
      leadId,
      tipo,
      q,
      page,
      limit,
    });
    return this.crmService.listInteractionsPaged({
      leadId,
      tipo,
      q,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('interactions')
  async createInteraction(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateCrmInteractionDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'interaction_create');
    return this.crmService.createInteraction(dto, usuario);
  }

  @Patch('interactions/:id')
  async updateInteraction(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmInteractionDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'interaction_update', { id });
    return this.crmService.updateInteraction(id, dto);
  }

  @Delete('interactions/:id')
  async deleteInteraction(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
    this.auditAdminAccess(usuario, 'interaction_delete', { id });
    await this.crmService.deleteInteraction(id);
    return { success: true };
  }

  private validateSensitiveReason(
    includeSensitive?: boolean,
    sensitiveReason?: string,
  ) {
    if (!includeSensitive) return;
    const reason = (sensitiveReason || '').trim();
    if (reason.length < 8) {
      throw new BadRequestException(
        'Informe o motivo da consulta de dados sensíveis (mínimo 8 caracteres).',
      );
    }
  }
}

function parseBoolQuery(value?: string): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}
