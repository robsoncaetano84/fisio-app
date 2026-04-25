"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const typeorm_1 = require("@nestjs/typeorm");
const Joi = __importStar(require("joi"));
const roles_guard_1 = require("./modules/auth/guards/roles.guard");
const usuario_entity_1 = require("./modules/usuarios/entities/usuario.entity");
const paciente_entity_1 = require("./modules/pacientes/entities/paciente.entity");
const anamnese_entity_1 = require("./modules/anamneses/entities/anamnese.entity");
const evolucao_entity_1 = require("./modules/evolucoes/entities/evolucao.entity");
const laudo_entity_1 = require("./modules/laudos/entities/laudo.entity");
const laudo_ai_generation_entity_1 = require("./modules/laudos/entities/laudo-ai-generation.entity");
const auth_log_entity_1 = require("./modules/auth/entities/auth-log.entity");
const atividade_entity_1 = require("./modules/atividades/entities/atividade.entity");
const atividade_checkin_entity_1 = require("./modules/atividades/entities/atividade-checkin.entity");
const push_token_entity_1 = require("./modules/notificacoes/entities/push-token.entity");
const crm_lead_entity_1 = require("./modules/crm/entities/crm-lead.entity");
const crm_task_entity_1 = require("./modules/crm/entities/crm-task.entity");
const crm_interaction_entity_1 = require("./modules/crm/entities/crm-interaction.entity");
const crm_admin_audit_log_entity_1 = require("./modules/crm/entities/crm-admin-audit-log.entity");
const paciente_exame_entity_1 = require("./modules/pacientes/entities/paciente-exame.entity");
const profissional_paciente_vinculo_entity_1 = require("./modules/pacientes/entities/profissional-paciente-vinculo.entity");
const clinical_flow_event_entity_1 = require("./modules/metrics/entities/clinical-flow-event.entity");
const patient_check_click_event_entity_1 = require("./modules/metrics/entities/patient-check-click-event.entity");
const clinical_protocol_version_entity_1 = require("./modules/clinical-governance/entities/clinical-protocol-version.entity");
const consent_purpose_log_entity_1 = require("./modules/clinical-governance/entities/consent-purpose-log.entity");
const clinical_audit_log_entity_1 = require("./modules/clinical-governance/entities/clinical-audit-log.entity");
const anamnese_historico_entity_1 = require("./modules/anamneses/entities/anamnese-historico.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const usuarios_module_1 = require("./modules/usuarios/usuarios.module");
const pacientes_module_1 = require("./modules/pacientes/pacientes.module");
const anamneses_module_1 = require("./modules/anamneses/anamneses.module");
const evolucoes_module_1 = require("./modules/evolucoes/evolucoes.module");
const laudos_module_1 = require("./modules/laudos/laudos.module");
const atividades_module_1 = require("./modules/atividades/atividades.module");
const notificacoes_module_1 = require("./modules/notificacoes/notificacoes.module");
const crm_module_1 = require("./modules/crm/crm.module");
const health_module_1 = require("./modules/health/health.module");
const metrics_module_1 = require("./modules/metrics/metrics.module");
const charles_module_1 = require("./modules/charles/charles.module");
const clinical_governance_module_1 = require("./modules/clinical-governance/clinical-governance.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validationSchema: Joi.object({
                    DB_HOST: Joi.string().required(),
                    DB_PORT: Joi.number().required(),
                    DB_USERNAME: Joi.string().required(),
                    DB_PASSWORD: Joi.string().required(),
                    DB_DATABASE: Joi.string().required(),
                    JWT_SECRET: Joi.string().required(),
                    JWT_EXPIRES_IN: Joi.string().default('7d'),
                    REFRESH_SECRET: Joi.string().required(),
                    REFRESH_EXPIRES_IN: Joi.string().default('30d'),
                    PORT: Joi.number().default(3000),
                    NODE_ENV: Joi.string().default('development'),
                    CORS_ORIGIN: Joi.string().allow('').optional(),
                    HTTPS_KEY_PATH: Joi.string().allow('').optional(),
                    HTTPS_CERT_PATH: Joi.string().allow('').optional(),
                    DB_MIGRATIONS_RUN: Joi.string().valid('true', 'false').default('false'),
                    DB_SSL: Joi.string().valid('true', 'false').default('false'),
                    DB_SSL_REJECT_UNAUTHORIZED: Joi.string().valid('true', 'false').default('true'),
                    THROTTLE_TTL: Joi.number().default(60),
                    THROTTLE_LIMIT: Joi.number().default(60),
                    LOCKOUT_MAX_ATTEMPTS: Joi.number().default(5),
                    LOCKOUT_WINDOW_MIN: Joi.number().default(15),
                    LOCKOUT_DURATION_MIN: Joi.number().default(30),
                    REDIS_URL: Joi.string().allow('').optional(),
                    ALLOW_ADMIN_REGISTRATION: Joi.string().valid('true', 'false').default('false'),
                    MASTER_ADMIN_EMAILS: Joi.string().allow('').optional(),
                    MASTER_ADMIN_PERMISSIONS: Joi.string().allow('').optional(),
                    OPENAI_API_KEY: Joi.string().allow('').optional(),
                    OPENAI_MODEL: Joi.string().allow('').optional(),
                    EXPO_ACCESS_TOKEN: Joi.string().allow('').optional(),
                    TRUST_PROXY: Joi.string().valid('true', 'false').default('false'),
                    APP_VERSION: Joi.string().allow('').optional(),
                    SENTRY_DSN: Joi.string().allow('').optional(),
                }),
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const dbSsl = configService.get('DB_SSL') === 'true';
                    const rejectUnauthorized = configService.get('DB_SSL_REJECT_UNAUTHORIZED') !== 'false';
                    return {
                        type: 'postgres',
                        host: configService.get('DB_HOST'),
                        port: configService.get('DB_PORT'),
                        username: configService.get('DB_USERNAME'),
                        password: configService.get('DB_PASSWORD'),
                        database: configService.get('DB_DATABASE'),
                        ssl: dbSsl ? { rejectUnauthorized } : false,
                        entities: [
                            usuario_entity_1.Usuario,
                            paciente_entity_1.Paciente,
                            anamnese_entity_1.Anamnese,
                            anamnese_historico_entity_1.AnamneseHistorico,
                            evolucao_entity_1.Evolucao,
                            laudo_entity_1.Laudo,
                            laudo_ai_generation_entity_1.LaudoAiGeneration,
                            auth_log_entity_1.AuthLog,
                            atividade_entity_1.Atividade,
                            atividade_checkin_entity_1.AtividadeCheckin,
                            push_token_entity_1.PushToken,
                            crm_lead_entity_1.CrmLead,
                            crm_task_entity_1.CrmTask,
                            crm_interaction_entity_1.CrmInteraction,
                            crm_admin_audit_log_entity_1.CrmAdminAuditLog,
                            paciente_exame_entity_1.PacienteExame,
                            profissional_paciente_vinculo_entity_1.ProfissionalPacienteVinculo,
                            clinical_flow_event_entity_1.ClinicalFlowEvent,
                            patient_check_click_event_entity_1.PatientCheckClickEvent,
                            clinical_protocol_version_entity_1.ClinicalProtocolVersion,
                            consent_purpose_log_entity_1.ConsentPurposeLog,
                            clinical_audit_log_entity_1.ClinicalAuditLog,
                        ],
                        migrations: [__dirname + '/migrations/*{.ts,.js}'],
                        synchronize: configService.get('NODE_ENV') === 'development',
                        logging: configService.get('NODE_ENV') === 'development',
                        migrationsRun: configService.get('DB_MIGRATIONS_RUN') === 'true',
                    };
                },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            name: 'default',
                            ttl: configService.get('THROTTLE_TTL') ?? 60,
                            limit: configService.get('THROTTLE_LIMIT') ?? 60,
                        },
                    ],
                }),
            }),
            auth_module_1.AuthModule,
            usuarios_module_1.UsuariosModule,
            pacientes_module_1.PacientesModule,
            anamneses_module_1.AnamnesesModule,
            evolucoes_module_1.EvolucoesModule,
            laudos_module_1.LaudosModule,
            atividades_module_1.AtividadesModule,
            notificacoes_module_1.NotificacoesModule,
            crm_module_1.CrmModule,
            health_module_1.HealthModule,
            metrics_module_1.MetricsModule,
            charles_module_1.CharlesModule,
            clinical_governance_module_1.ClinicalGovernanceModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map