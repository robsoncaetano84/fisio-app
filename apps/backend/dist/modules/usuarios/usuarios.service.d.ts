import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { UpdateMeDto } from '../auth/dto/update-me.dto';
export declare class UsuariosService {
    private readonly usuarioRepository;
    private readonly pacienteRepository;
    private readonly configService;
    constructor(usuarioRepository: Repository<Usuario>, pacienteRepository: Repository<Paciente>, configService: ConfigService);
    create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario>;
    findByEmail(email: string): Promise<Usuario | null>;
    findPacienteByEmailForProfissional(profissionalId: string, email: string): Promise<Usuario | null>;
    searchPacientesByTermForProfissional(profissionalId: string, term: string, limit?: number): Promise<Usuario[]>;
    findById(id: string): Promise<Usuario>;
    updateMe(usuarioId: string, dto: UpdateMeDto): Promise<Usuario>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
