import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
export declare class UsuariosService {
    private readonly usuarioRepository;
    private readonly configService;
    constructor(usuarioRepository: Repository<Usuario>, configService: ConfigService);
    create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario>;
    findByEmail(email: string): Promise<Usuario | null>;
    findPacienteByEmail(email: string): Promise<Usuario | null>;
    searchPacientesByTerm(term: string, limit?: number): Promise<Usuario[]>;
    findById(id: string): Promise<Usuario>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
