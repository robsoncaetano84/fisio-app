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
import { CrmAdminPermission, CrmService } from './crm.service';
import { CreateCrmLeadDto } from './dto/create-crm-lead.dto';
import { UpdateCrmLeadDto } from './dto/update-crm-lead.dto';
import { CreateCrmTaskDto } from './dto/create-crm-task.dto';
import { UpdateCrmTaskDto } from './dto/update-crm-task.dto';
import { CreateCrmInteractionDto } from './dto/create-crm-interaction.dto';
import { UpdateCrmInteractionDto } from './dto/update-crm-interaction.dto';
import { UpdateCrmAdminProfessionalDto } from './dto/update-crm-admin-professional.dto';
import { UpdateCrmAdminPatientDto } from './dto/update-crm-admin-patient.dto';
import { CrmLeadStage } from './entities/crm-lead.entity';
import { CrmTaskStatus } from './entities/crm-task.entity';

@Controller('crm')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class CrmController {
  private readonly logger = new Logger(CrmController.name);

  constructor(private readonly crmService: CrmService) {}

  private requirePermission(usuario: Usuario, permission: CrmAdminPermission) {
    this.crmService.assertMasterAdminPermission(usuario, permission);
  }

  private async runAudited<T>(params: {
    usuario: Usuario;
    action: string;
    metadata?: Record<string, unknown>;
    execute: () => Promise<T>;
  }): Promise<T> {
    const { usuario, action, metadata, execute } = params;
    this.auditAdminAccess(usuario, `${action}_attempt`, metadata);
    try {
      const result = await execute();
      this.auditAdminAccess(usuario, `${action}_success`, metadata);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro_desconhecido';
      this.auditAdminAccess(usuario, `${action}_error`, {
        ...(metadata || {}),
        errorMessage: message,
      });
      throw error;
    }
  }

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
    this.requirePermission(usuario, 'dashboard.read');
    this.auditAdminAccess(usuario, 'pipeline_summary');
    return this.crmService.getPipelineSummary();
  }

  @Get('clinical/dashboard-summary')
  async getClinicalDashboardSummary(
    @CurrentUser() usuario: Usuario,
    @Query('windowDays') windowDays?: string,
    @Query('semEvolucaoDias') semEvolucaoDias?: string,
  ) {
    this.requirePermission(usuario, 'dashboard.read');
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
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
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
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
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
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
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
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
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

  @Patch('admin/profissionais/:id')
  async updateAdminProfissional(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmAdminProfessionalDto,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.requirePermission(usuario, 'crm.write');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    return this.runAudited({
      usuario,
      action: 'admin_profissional_update',
      metadata: {
        id,
        includeSensitive: includeSensitiveBool,
        sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      },
      execute: () =>
        this.crmService.updateAdminProfessional(id, dto, {
          includeSensitive: includeSensitiveBool,
        }),
    });
  }

  @Patch('admin/pacientes/:id')
  async updateAdminPaciente(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmAdminPatientDto,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.requirePermission(usuario, 'crm.write');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    return this.runAudited({
      usuario,
      action: 'admin_paciente_update',
      metadata: {
        id,
        includeSensitive: includeSensitiveBool,
        sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      },
      execute: () =>
        this.crmService.updateAdminPatient(id, dto, {
          includeSensitive: includeSensitiveBool,
        }),
    });
  }

  @Get('leads')
  async listLeads(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('stage') stage?: CrmLeadStage | 'TODOS',
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'leads_list', {
      q,
      stage,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
    });
    return this.crmService.listLeads({
      q,
      stage,
      includeSensitive: includeSensitiveBool,
    });
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
    this.requirePermission(usuario, 'audit.read');
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
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'leads_paged', {
      q,
      stage,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      page,
      limit,
    });
    return this.crmService.listLeadsPaged({
      q,
      stage,
      includeSensitive: includeSensitiveBool,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('leads/:id')
  async getLeadById(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'lead_detail', {
      id,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
    });
    return this.crmService.getLeadById(id, {
      includeSensitive: includeSensitiveBool,
    });
  }

  @Post('leads')
  async createLead(@CurrentUser() usuario: Usuario, @Body() dto: CreateCrmLeadDto) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'lead_create',
      execute: () => this.crmService.createLead(dto, usuario),
    });
  }

  @Patch('leads/:id')
  async updateLead(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmLeadDto,
  ) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'lead_update',
      metadata: { id },
      execute: () => this.crmService.updateLead(id, dto),
    });
  }

  @Delete('leads/:id')
  async deleteLead(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'lead_delete',
      metadata: { id },
      execute: async () => {
        await this.crmService.deleteLead(id);
        return { success: true };
      },
    });
  }

  @Get('tasks')
  async listTasks(
    @CurrentUser() usuario: Usuario,
    @Query('status') status?: CrmTaskStatus | 'TODOS',
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
    @Query('limit') limit?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'tasks_list', {
      status,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      limit,
    });
    return this.crmService.listTasks({
      status,
      includeSensitive: includeSensitiveBool,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('tasks-paged')
  async listTasksPaged(
    @CurrentUser() usuario: Usuario,
    @Query('status') status?: CrmTaskStatus | 'TODOS',
    @Query('leadId') leadId?: string,
    @Query('q') q?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'tasks_paged', {
      status,
      leadId,
      q,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      page,
      limit,
    });
    return this.crmService.listTasksPaged({
      status,
      leadId,
      q,
      includeSensitive: includeSensitiveBool,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('tasks')
  async createTask(@CurrentUser() usuario: Usuario, @Body() dto: CreateCrmTaskDto) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'task_create',
      execute: () => this.crmService.createTask(dto, usuario),
    });
  }

  @Patch('tasks/:id')
  async updateTask(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmTaskDto,
  ) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'task_update',
      metadata: { id },
      execute: () => this.crmService.updateTask(id, dto),
    });
  }

  @Delete('tasks/:id')
  async deleteTask(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'task_delete',
      metadata: { id },
      execute: async () => {
        await this.crmService.deleteTask(id);
        return { success: true };
      },
    });
  }

  @Get('leads/:leadId/interactions')
  async listInteractions(
    @CurrentUser() usuario: Usuario,
    @Param('leadId') leadId: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'interactions_list', {
      leadId,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
    });
    return this.crmService.listInteractions(leadId, {
      includeSensitive: includeSensitiveBool,
    });
  }

  @Get('leads/:leadId/interactions-paged')
  async listInteractionsPaged(
    @CurrentUser() usuario: Usuario,
    @Param('leadId') leadId: string,
    @Query('tipo') tipo?: string,
    @Query('q') q?: string,
    @Query('includeSensitive') includeSensitive?: string,
    @Query('sensitiveReason') sensitiveReason?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.requirePermission(usuario, 'crm.read');
    const includeSensitiveBool = parseBoolQuery(includeSensitive);
    this.validateSensitiveReason(usuario, includeSensitiveBool, sensitiveReason);
    this.auditAdminAccess(usuario, 'interactions_paged', {
      leadId,
      tipo,
      q,
      includeSensitive: includeSensitiveBool,
      sensitiveReason: includeSensitiveBool ? sensitiveReason : undefined,
      page,
      limit,
    });
    return this.crmService.listInteractionsPaged({
      leadId,
      tipo,
      q,
      includeSensitive: includeSensitiveBool,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Post('interactions')
  async createInteraction(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateCrmInteractionDto,
  ) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'interaction_create',
      execute: () => this.crmService.createInteraction(dto, usuario),
    });
  }

  @Patch('interactions/:id')
  async updateInteraction(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmInteractionDto,
  ) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'interaction_update',
      metadata: { id },
      execute: () => this.crmService.updateInteraction(id, dto),
    });
  }

  @Delete('interactions/:id')
  async deleteInteraction(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.requirePermission(usuario, 'crm.write');
    return this.runAudited({
      usuario,
      action: 'interaction_delete',
      metadata: { id },
      execute: async () => {
        await this.crmService.deleteInteraction(id);
        return { success: true };
      },
    });
  }

  private validateSensitiveReason(
    usuario: Usuario,
    includeSensitive?: boolean,
    sensitiveReason?: string,
  ) {
    if (!includeSensitive) return;
    this.requirePermission(usuario, 'sensitive.read');
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
