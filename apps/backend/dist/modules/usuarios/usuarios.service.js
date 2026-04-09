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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const usuario_entity_1 = require("./entities/usuario.entity");
const paciente_entity_1 = require("../pacientes/entities/paciente.entity");
let UsuariosService = class UsuariosService {
    usuarioRepository;
    pacienteRepository;
    configService;
    constructor(usuarioRepository, pacienteRepository, configService) {
        this.usuarioRepository = usuarioRepository;
        this.pacienteRepository = pacienteRepository;
        this.configService = configService;
    }
    async create(createUsuarioDto) {
        const existingUser = await this.usuarioRepository.findOne({
            where: { email: createUsuarioDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('E-mail ja cadastrado');
        }
        const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);
        const allowAdmin = this.configService.get('ALLOW_ADMIN_REGISTRATION') === 'true';
        const role = allowAdmin && createUsuarioDto.role === usuario_entity_1.UserRole.ADMIN
            ? usuario_entity_1.UserRole.ADMIN
            : createUsuarioDto.role === usuario_entity_1.UserRole.PACIENTE
                ? usuario_entity_1.UserRole.PACIENTE
                : usuario_entity_1.UserRole.USER;
        const conselhoSigla = createUsuarioDto.conselhoSigla?.trim().toUpperCase();
        const conselhoUf = createUsuarioDto.conselhoUf?.trim().toUpperCase();
        const conselhoProf = createUsuarioDto.conselhoProf?.trim() ||
            (conselhoSigla && conselhoUf ? `${conselhoSigla}-${conselhoUf}` : undefined);
        const usuario = this.usuarioRepository.create({
            ...createUsuarioDto,
            conselhoSigla,
            conselhoUf,
            conselhoProf,
            role,
            senha: hashedPassword,
        });
        return this.usuarioRepository.save(usuario);
    }
    async findByEmail(email) {
        return this.usuarioRepository.findOne({ where: { email } });
    }
    async findPacienteByEmailForProfissional(profissionalId, email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            return null;
        }
        return this.usuarioRepository
            .createQueryBuilder('usuario')
            .innerJoin(paciente_entity_1.Paciente, 'paciente', 'paciente.pacienteUsuarioId = usuario.id AND paciente.usuarioId = :profissionalId AND paciente.ativo = :pacienteAtivo', { profissionalId, pacienteAtivo: true })
            .where('usuario.ativo = :ativo', { ativo: true })
            .andWhere('usuario.role = :role', { role: usuario_entity_1.UserRole.PACIENTE })
            .andWhere('LOWER(usuario.email) = :email', { email: normalizedEmail })
            .getOne();
    }
    async searchPacientesByTermForProfissional(profissionalId, term, limit = 10) {
        const safeTerm = term.trim().toLowerCase();
        if (!safeTerm) {
            return [];
        }
        return this.usuarioRepository
            .createQueryBuilder('usuario')
            .innerJoin(paciente_entity_1.Paciente, 'paciente', 'paciente.pacienteUsuarioId = usuario.id AND paciente.usuarioId = :profissionalId AND paciente.ativo = :pacienteAtivo', { profissionalId, pacienteAtivo: true })
            .where('usuario.ativo = :ativo', { ativo: true })
            .andWhere('usuario.role = :role', { role: usuario_entity_1.UserRole.PACIENTE })
            .andWhere('(LOWER(usuario.nome) LIKE :term OR LOWER(usuario.email) LIKE :term)', { term: `%${safeTerm}%` })
            .orderBy('usuario.nome', 'ASC')
            .distinct(true)
            .limit(Math.max(1, Math.min(20, limit)))
            .getMany();
    }
    async findById(id) {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario nao encontrado');
        }
        return usuario;
    }
    async updateMe(usuarioId, dto) {
        const usuario = await this.findById(usuarioId);
        if (dto.nome !== undefined) {
            usuario.nome = dto.nome.trim();
        }
        const hasProfessionalField = dto.conselhoSigla !== undefined ||
            dto.conselhoUf !== undefined ||
            dto.registroProf !== undefined ||
            dto.especialidade !== undefined;
        if (usuario.role === usuario_entity_1.UserRole.PACIENTE && hasProfessionalField) {
            throw new common_1.BadRequestException('Paciente nao pode atualizar dados profissionais');
        }
        if (usuario.role !== usuario_entity_1.UserRole.PACIENTE && hasProfessionalField) {
            const conselhoSigla = dto.conselhoSigla !== undefined
                ? dto.conselhoSigla.trim().toUpperCase()
                : (usuario.conselhoSigla ?? '');
            const conselhoUf = dto.conselhoUf !== undefined
                ? dto.conselhoUf.trim().toUpperCase()
                : (usuario.conselhoUf ?? '');
            if ((dto.conselhoSigla !== undefined || dto.conselhoUf !== undefined) &&
                (!conselhoSigla || !conselhoUf)) {
                throw new common_1.BadRequestException('Conselho e UF devem ser informados juntos');
            }
            if (dto.conselhoSigla !== undefined) {
                usuario.conselhoSigla = conselhoSigla || "";
            }
            if (dto.conselhoUf !== undefined) {
                usuario.conselhoUf = conselhoUf || "";
            }
            if (dto.registroProf !== undefined) {
                usuario.registroProf = dto.registroProf.trim() || "";
            }
            if (dto.especialidade !== undefined) {
                usuario.especialidade = dto.especialidade.trim() || "";
            }
            const finalSigla = usuario.conselhoSigla?.trim().toUpperCase();
            const finalUf = usuario.conselhoUf?.trim().toUpperCase();
            usuario.conselhoProf = finalSigla && finalUf ? `${finalSigla}-${finalUf}` : "";
        }
        return this.usuarioRepository.save(usuario);
    }
    async validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(paciente_entity_1.Paciente)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map