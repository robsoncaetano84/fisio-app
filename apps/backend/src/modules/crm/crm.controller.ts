// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// C RM.C ON TR OL LE R
// ==========================================
import {
  Body,
  Controller,
  Delete,
  Get,
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
  constructor(private readonly crmService: CrmService) {}

  @Get('pipeline/summary')
  async getPipelineSummary(@CurrentUser() usuario: Usuario) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.getPipelineSummary();
  }

  @Get('admin/profissionais')
  async listAdminProfissionais(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('ativo') ativo?: string,
    @Query('especialidade') especialidade?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.listAdminProfissionais({
      q,
      ativo: parseBoolQuery(ativo),
      especialidade,
    });
  }

  @Get('admin/profissionais-paged')
  async listAdminProfissionaisPaged(
    @CurrentUser() usuario: Usuario,
    @Query('q') q?: string,
    @Query('ativo') ativo?: string,
    @Query('especialidade') especialidade?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.listAdminProfissionaisPaged({
      q,
      ativo: parseBoolQuery(ativo),
      especialidade,
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
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.listAdminPacientes({
      q,
      ativo: parseBoolQuery(ativo),
      vinculadoUsuarioPaciente: parseBoolQuery(vinculadoUsuarioPaciente),
      cidade,
      uf,
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.listAdminPacientesPaged({
      q,
      ativo: parseBoolQuery(ativo),
      vinculadoUsuarioPaciente: parseBoolQuery(vinculadoUsuarioPaciente),
      cidade,
      uf,
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
    return this.crmService.listLeads({ q, stage });
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
    return this.crmService.getLeadById(id);
  }

  @Post('leads')
  async createLead(@CurrentUser() usuario: Usuario, @Body() dto: CreateCrmLeadDto) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.createLead(dto, usuario);
  }

  @Patch('leads/:id')
  async updateLead(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmLeadDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.updateLead(id, dto);
  }

  @Delete('leads/:id')
  async deleteLead(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
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
    return this.crmService.createTask(dto, usuario);
  }

  @Patch('tasks/:id')
  async updateTask(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmTaskDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  async deleteTask(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
    await this.crmService.deleteTask(id);
    return { success: true };
  }

  @Get('leads/:leadId/interactions')
  async listInteractions(@CurrentUser() usuario: Usuario, @Param('leadId') leadId: string) {
    this.crmService.assertMasterAdmin(usuario);
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
    return this.crmService.createInteraction(dto, usuario);
  }

  @Patch('interactions/:id')
  async updateInteraction(
    @CurrentUser() usuario: Usuario,
    @Param('id') id: string,
    @Body() dto: UpdateCrmInteractionDto,
  ) {
    this.crmService.assertMasterAdmin(usuario);
    return this.crmService.updateInteraction(id, dto);
  }

  @Delete('interactions/:id')
  async deleteInteraction(@CurrentUser() usuario: Usuario, @Param('id') id: string) {
    this.crmService.assertMasterAdmin(usuario);
    await this.crmService.deleteInteraction(id);
    return { success: true };
  }
}

function parseBoolQuery(value?: string): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}
