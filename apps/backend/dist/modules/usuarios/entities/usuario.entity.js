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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const base_entity_1 = require("../../../common/entities/base.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
    UserRole["PACIENTE"] = "PACIENTE";
})(UserRole || (exports.UserRole = UserRole = {}));
let Usuario = class Usuario extends base_entity_1.BaseEntity {
    nome;
    email;
    senha;
    registroProf;
    especialidade;
    ativo;
    role;
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Usuario.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], Usuario.prototype, "senha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registro_prof', length: 50, nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "registroProf", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "especialidade", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Usuario.prototype, "ativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserRole, default: UserRole.USER }),
    __metadata("design:type", String)
], Usuario.prototype, "role", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)('usuarios')
], Usuario);
//# sourceMappingURL=usuario.entity.js.map