"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usuario_entity_1 = require("../usuarios/entities/usuario.entity");
const crm_service_1 = require("./crm.service");
const create_crm_lead_dto_1 = require("./dto/create-crm-lead.dto");
const update_crm_lead_dto_1 = require("./dto/update-crm-lead.dto");
const create_crm_task_dto_1 = require("./dto/create-crm-task.dto");
const update_crm_task_dto_1 = require("./dto/update-crm-task.dto");
const create_crm_interaction_dto_1 = require("./dto/create-crm-interaction.dto");
const update_crm_interaction_dto_1 = require("./dto/update-crm-interaction.dto");
let CrmController = class CrmController {
    crmService;
    constructor(crmService) {
        this.crmService = crmService;
    }
    async getPipelineSummary(usuario) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.getPipelineSummary();
    }
    async listAdminProfissionais(usuario, q, ativo, especialidade) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listAdminProfissionais({
            q,
            ativo: parseBoolQuery(ativo),
            especialidade,
        });
    }
    async listAdminProfissionaisPaged(usuario, q, ativo, especialidade, page, limit) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listAdminProfissionaisPaged({
            q,
            ativo: parseBoolQuery(ativo),
            especialidade,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    async listAdminPacientes(usuario, q, ativo, vinculadoUsuarioPaciente, cidade, uf) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listAdminPacientes({
            q,
            ativo: parseBoolQuery(ativo),
            vinculadoUsuarioPaciente: parseBoolQuery(vinculadoUsuarioPaciente),
            cidade,
            uf,
        });
    }
    async listAdminPacientesPaged(usuario, q, ativo, vinculadoUsuarioPaciente, cidade, uf, page, limit) {
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
    async listLeads(usuario, q, stage) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listLeads({ q, stage });
    }
    async listLeadsPaged(usuario, q, stage, page, limit) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listLeadsPaged({
            q,
            stage,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    async getLeadById(usuario, id) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.getLeadById(id);
    }
    async createLead(usuario, dto) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.createLead(dto, usuario);
    }
    async updateLead(usuario, id, dto) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.updateLead(id, dto);
    }
    async deleteLead(usuario, id) {
        this.crmService.assertMasterAdmin(usuario);
        await this.crmService.deleteLead(id);
        return { success: true };
    }
    async listTasks(usuario, status, limit) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listTasks({
            status,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async listTasksPaged(usuario, status, leadId, q, page, limit) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listTasksPaged({
            status,
            leadId,
            q,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    async createTask(usuario, dto) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.createTask(dto, usuario);
    }
    async updateTask(usuario, id, dto) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.updateTask(id, dto);
    }
    async deleteTask(usuario, id) {
        this.crmService.assertMasterAdmin(usuario);
        await this.crmService.deleteTask(id);
        return { success: true };
    }
    async listInteractions(usuario, leadId) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listInteractions(leadId);
    }
    async listInteractionsPaged(usuario, leadId, tipo, q, page, limit) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.listInteractionsPaged({
            leadId,
            tipo,
            q,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    async createInteraction(usuario, dto) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.createInteraction(dto, usuario);
    }
    async updateInteraction(usuario, id, dto) {
        this.crmService.assertMasterAdmin(usuario);
        return this.crmService.updateInteraction(id, dto);
    }
    async deleteInteraction(usuario, id) {
        this.crmService.assertMasterAdmin(usuario);
        await this.crmService.deleteInteraction(id);
        return { success: true };
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, common_1.Get)('pipeline/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getPipelineSummary", null);
__decorate([
    (0, common_1.Get)('admin/profissionais'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('ativo')),
    __param(3, (0, common_1.Query)('especialidade')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listAdminProfissionais", null);
__decorate([
    (0, common_1.Get)('admin/profissionais-paged'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('ativo')),
    __param(3, (0, common_1.Query)('especialidade')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listAdminProfissionaisPaged", null);
__decorate([
    (0, common_1.Get)('admin/pacientes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('ativo')),
    __param(3, (0, common_1.Query)('vinculadoUsuarioPaciente')),
    __param(4, (0, common_1.Query)('cidade')),
    __param(5, (0, common_1.Query)('uf')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listAdminPacientes", null);
__decorate([
    (0, common_1.Get)('admin/pacientes-paged'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('ativo')),
    __param(3, (0, common_1.Query)('vinculadoUsuarioPaciente')),
    __param(4, (0, common_1.Query)('cidade')),
    __param(5, (0, common_1.Query)('uf')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listAdminPacientesPaged", null);
__decorate([
    (0, common_1.Get)('leads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('stage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listLeads", null);
__decorate([
    (0, common_1.Get)('leads-paged'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('stage')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listLeadsPaged", null);
__decorate([
    (0, common_1.Get)('leads/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getLeadById", null);
__decorate([
    (0, common_1.Post)('leads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, create_crm_lead_dto_1.CreateCrmLeadDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createLead", null);
__decorate([
    (0, common_1.Patch)('leads/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, update_crm_lead_dto_1.UpdateCrmLeadDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Delete)('leads/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "deleteLead", null);
__decorate([
    (0, common_1.Get)('tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('tasks-paged'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('leadId')),
    __param(3, (0, common_1.Query)('q')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listTasksPaged", null);
__decorate([
    (0, common_1.Post)('tasks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, create_crm_task_dto_1.CreateCrmTaskDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)('tasks/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, update_crm_task_dto_1.UpdateCrmTaskDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Delete)('tasks/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "deleteTask", null);
__decorate([
    (0, common_1.Get)('leads/:leadId/interactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('leadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listInteractions", null);
__decorate([
    (0, common_1.Get)('leads/:leadId/interactions-paged'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('leadId')),
    __param(2, (0, common_1.Query)('tipo')),
    __param(3, (0, common_1.Query)('q')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listInteractionsPaged", null);
__decorate([
    (0, common_1.Post)('interactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario,
        create_crm_interaction_dto_1.CreateCrmInteractionDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createInteraction", null);
__decorate([
    (0, common_1.Patch)('interactions/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String, update_crm_interaction_dto_1.UpdateCrmInteractionDto]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateInteraction", null);
__decorate([
    (0, common_1.Delete)('interactions/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usuario_entity_1.Usuario, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "deleteInteraction", null);
exports.CrmController = CrmController = __decorate([
    (0, common_1.Controller)('crm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(usuario_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
function parseBoolQuery(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    if (value === 'true' || value === '1')
        return true;
    if (value === 'false' || value === '0')
        return false;
    return undefined;
}
//# sourceMappingURL=crm.controller.js.map