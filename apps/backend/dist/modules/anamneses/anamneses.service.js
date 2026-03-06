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
exports.AnamnesesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const anamnese_entity_1 = require("./entities/anamnese.entity");
const pacientes_service_1 = require("../pacientes/pacientes.service");
let AnamnesesService = class AnamnesesService {
    anamneseRepository;
    pacientesService;
    constructor(anamneseRepository, pacientesService) {
        this.anamneseRepository = anamneseRepository;
        this.pacientesService = pacientesService;
    }
    async create(createAnamneseDto, usuarioId) {
        await this.pacientesService.findOne(createAnamneseDto.pacienteId, usuarioId);
        const anamnese = this.anamneseRepository.create(createAnamneseDto);
        return this.anamneseRepository.save(anamnese);
    }
    async findAllByPaciente(pacienteId, usuarioId) {
        await this.pacientesService.findOne(pacienteId, usuarioId);
        return this.anamneseRepository.find({
            where: { pacienteId },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, usuarioId) {
        const anamnese = await this.anamneseRepository.findOne({
            where: { id },
            relations: ['paciente'],
        });
        if (!anamnese) {
            throw new common_1.NotFoundException('Anamnese não encontrada');
        }
        if (anamnese.paciente.usuarioId !== usuarioId) {
            throw new common_1.NotFoundException('Anamnese não encontrada');
        }
        return anamnese;
    }
    async update(id, updateAnamneseDto, usuarioId) {
        const anamnese = await this.findOne(id, usuarioId);
        Object.assign(anamnese, updateAnamneseDto);
        return this.anamneseRepository.save(anamnese);
    }
    async remove(id, usuarioId) {
        const anamnese = await this.findOne(id, usuarioId);
        await this.anamneseRepository.remove(anamnese);
    }
};
exports.AnamnesesService = AnamnesesService;
exports.AnamnesesService = AnamnesesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(anamnese_entity_1.Anamnese)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        pacientes_service_1.PacientesService])
], AnamnesesService);
//# sourceMappingURL=anamneses.service.js.map