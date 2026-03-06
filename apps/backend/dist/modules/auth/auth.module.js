"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const usuarios_module_1 = require("../usuarios/usuarios.module");
const auth_log_entity_1 = require("./entities/auth-log.entity");
const auth_logs_service_1 = require("./auth-logs.service");
const lockout_service_1 = require("./lockout.service");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            usuarios_module_1.UsuariosModule,
            typeorm_1.TypeOrmModule.forFeature([auth_log_entity_1.AuthLog, paciente_entity_1.Paciente]),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const secret = configService.get('JWT_SECRET') || 'default-secret';
                    const expiresIn = configService.get('JWT_EXPIRES_IN') || '7d';
                    return {
                        secret,
                        signOptions: {
                            expiresIn: expiresIn,
                        },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, auth_logs_service_1.AuthLogsService, lockout_service_1.LockoutService, jwt_strategy_1.JwtStrategy],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map