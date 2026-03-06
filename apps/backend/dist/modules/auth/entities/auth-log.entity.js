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
exports.AuthLog = exports.AuthEventType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../common/entities/base.entity");
var AuthEventType;
(function (AuthEventType) {
    AuthEventType["LOGIN"] = "LOGIN";
    AuthEventType["REFRESH"] = "REFRESH";
})(AuthEventType || (exports.AuthEventType = AuthEventType = {}));
let AuthLog = class AuthLog extends base_entity_1.BaseEntity {
    usuarioId;
    email;
    ip;
    eventType;
    success;
    reason;
};
exports.AuthLog = AuthLog;
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id', nullable: true }),
    __metadata("design:type", String)
], AuthLog.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], AuthLog.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, nullable: true }),
    __metadata("design:type", String)
], AuthLog.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuthEventType }),
    __metadata("design:type", String)
], AuthLog.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], AuthLog.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuthLog.prototype, "reason", void 0);
exports.AuthLog = AuthLog = __decorate([
    (0, typeorm_1.Entity)('auth_logs')
], AuthLog);
//# sourceMappingURL=auth-log.entity.js.map