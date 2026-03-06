# ==========================================
# Script para criar arquivos do backend
# Execute: .\create-backend-files.ps1
# ==========================================

$basePath = "C:\Projetos\fisio-app\apps\backend\src"

# ==========================================
# common/entities/base.entity.ts
# ==========================================
$content = @'
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
'@
Set-Content -Path "$basePath\common\entities\base.entity.ts" -Value $content -Encoding UTF8
Write-Host "✅ base.entity.ts"

# ==========================================
# modules/usuarios/entities/usuario.entity.ts
# ==========================================
$content = @'
import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ length: 255 })
  nome: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column()
  @Exclude()
  senha: string;

  @Column({ name: 'registro_prof', length: 50, nullable: true })
  registroProf: string;

  @Column({ length: 100, nullable: true })
  especialidade: string;

  @Column({ default: true })
  ativo: boolean;
}
'@
Set-Content -Path "$basePath\modules\usuarios\entities\usuario.entity.ts" -Value $content -Encoding UTF8
Write-Host "✅ usuario.entity.ts"

# ==========================================
# modules/usuarios/dto/create-usuario.dto.ts
# ==========================================
$content = @'
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  nome: string;

  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;

  @IsOptional()
  @IsString()
  registroProf?: string;

  @IsOptional()
  @IsString()
  especialidade?: string;
}
'@
Set-Content -Path "$basePath\modules\usuarios\dto\create-usuario.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ create-usuario.dto.ts"

# ==========================================
# modules/usuarios/usuarios.service.ts
# ==========================================
$content = @'
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      senha: hashedPassword,
    });

    return this.usuarioRepository.save(usuario);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return usuario;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
'@
Set-Content -Path "$basePath\modules\usuarios\usuarios.service.ts" -Value $content -Encoding UTF8
Write-Host "✅ usuarios.service.ts"

# ==========================================
# modules/usuarios/usuarios.module.ts
# ==========================================
$content = @'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
'@
Set-Content -Path "$basePath\modules\usuarios\usuarios.module.ts" -Value $content -Encoding UTF8
Write-Host "✅ usuarios.module.ts"

# ==========================================
# modules/auth/dto/login.dto.ts
# ==========================================
$content = @'
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha: string;
}
'@
Set-Content -Path "$basePath\modules\auth\dto\login.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ login.dto.ts"

# ==========================================
# modules/auth/strategies/jwt.strategy.ts
# ==========================================
$content = @'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../../usuarios/usuarios.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuariosService.findById(payload.sub);

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Usuário não autorizado');
    }

    return usuario;
  }
}
'@
Set-Content -Path "$basePath\modules\auth\strategies\jwt.strategy.ts" -Value $content -Encoding UTF8
Write-Host "✅ jwt.strategy.ts"

# ==========================================
# modules/auth/guards/jwt-auth.guard.ts
# ==========================================
$content = @'
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
'@
Set-Content -Path "$basePath\modules\auth\guards\jwt-auth.guard.ts" -Value $content -Encoding UTF8
Write-Host "✅ jwt-auth.guard.ts"

# ==========================================
# modules/auth/decorators/current-user.decorator.ts
# ==========================================
$content = @'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
'@
Set-Content -Path "$basePath\modules\auth\decorators\current-user.decorator.ts" -Value $content -Encoding UTF8
Write-Host "✅ current-user.decorator.ts"

# ==========================================
# modules/auth/auth.service.ts
# ==========================================
$content = @'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/entities/usuario.entity';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    registroProf: string;
    especialidade: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string): Promise<Usuario | null> {
    const usuario = await this.usuariosService.findByEmail(email);

    if (!usuario || !usuario.ativo) {
      return null;
    }

    const isPasswordValid = await this.usuariosService.validatePassword(
      senha,
      usuario.senha,
    );

    if (!isPasswordValid) {
      return null;
    }

    return usuario;
  }

  async login(email: string, senha: string): Promise<LoginResponse> {
    const usuario = await this.validateUser(email, senha);

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
    };

    return {
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        registroProf: usuario.registroProf,
        especialidade: usuario.especialidade,
      },
    };
  }
}
'@
Set-Content -Path "$basePath\modules\auth\auth.service.ts" -Value $content -Encoding UTF8
Write-Host "✅ auth.service.ts"

# ==========================================
# modules/auth/auth.controller.ts
# ==========================================
$content = @'
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto.email, loginDto.senha);
  }

  @Post('registro')
  async registro(@Body() createUsuarioDto: CreateUsuarioDto) {
    const usuario = await this.usuariosService.create(createUsuarioDto);
    return {
      message: 'Usuário criado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() usuario: Usuario) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      registroProf: usuario.registroProf,
      especialidade: usuario.especialidade,
    };
  }
}
'@
Set-Content -Path "$basePath\modules\auth\auth.controller.ts" -Value $content -Encoding UTF8
Write-Host "✅ auth.controller.ts"

# ==========================================
# modules/auth/auth.module.ts
# ==========================================
$content = @'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
'@
Set-Content -Path "$basePath\modules\auth\auth.module.ts" -Value $content -Encoding UTF8
Write-Host "✅ auth.module.ts"

# ==========================================
# modules/pacientes/entities/paciente.entity.ts
# ==========================================
$content = @'
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum Sexo {
  MASCULINO = 'MASCULINO',
  FEMININO = 'FEMININO',
  OUTRO = 'OUTRO',
}

export enum EstadoCivil {
  SOLTEIRO = 'SOLTEIRO',
  CASADO = 'CASADO',
  VIUVO = 'VIUVO',
  DIVORCIADO = 'DIVORCIADO',
  UNIAO_ESTAVEL = 'UNIAO_ESTAVEL',
}

@Entity('pacientes')
export class Paciente extends BaseEntity {
  @Column({ name: 'nome_completo', length: 255 })
  nomeCompleto: string;

  @Column({ length: 11, unique: true })
  cpf: string;

  @Column({ length: 20, nullable: true })
  rg: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento: Date;

  @Column({ type: 'enum', enum: Sexo })
  sexo: Sexo;

  @Column({
    name: 'estado_civil',
    type: 'enum',
    enum: EstadoCivil,
    nullable: true,
  })
  estadoCivil: EstadoCivil;

  @Column({ length: 100, nullable: true })
  profissao: string;

  @Column({ name: 'endereco_rua', length: 255 })
  enderecoRua: string;

  @Column({ name: 'endereco_numero', length: 20 })
  enderecoNumero: string;

  @Column({ name: 'endereco_complemento', length: 100, nullable: true })
  enderecoComplemento: string;

  @Column({ name: 'endereco_bairro', length: 100 })
  enderecoBairro: string;

  @Column({ name: 'endereco_cep', length: 8 })
  enderecoCep: string;

  @Column({ name: 'endereco_cidade', length: 100 })
  enderecoCidade: string;

  @Column({ name: 'endereco_uf', length: 2 })
  enderecoUf: string;

  @Column({ name: 'contato_whatsapp', length: 11 })
  contatoWhatsapp: string;

  @Column({ name: 'contato_telefone', length: 11, nullable: true })
  contatoTelefone: string;

  @Column({ name: 'contato_email', length: 255, nullable: true })
  contatoEmail: string;

  @Column({ default: true })
  ativo: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: string;
}
'@
Set-Content -Path "$basePath\modules\pacientes\entities\paciente.entity.ts" -Value $content -Encoding UTF8
Write-Host "✅ paciente.entity.ts"

# ==========================================
# modules/pacientes/dto/create-paciente.dto.ts
# ==========================================
$content = @'
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  Length,
  IsDateString,
} from 'class-validator';
import { Sexo, EstadoCivil } from '../entities/paciente.entity';

export class CreatePacienteDto {
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString()
  nomeCompleto: string;

  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  @IsDateString()
  dataNascimento: string;

  @IsNotEmpty({ message: 'Sexo é obrigatório' })
  @IsEnum(Sexo)
  sexo: Sexo;

  @IsOptional()
  @IsEnum(EstadoCivil)
  estadoCivil?: EstadoCivil;

  @IsOptional()
  @IsString()
  profissao?: string;

  @IsNotEmpty({ message: 'Rua é obrigatória' })
  @IsString()
  enderecoRua: string;

  @IsNotEmpty({ message: 'Número é obrigatório' })
  @IsString()
  enderecoNumero: string;

  @IsOptional()
  @IsString()
  enderecoComplemento?: string;

  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  @IsString()
  enderecoBairro: string;

  @IsNotEmpty({ message: 'CEP é obrigatório' })
  @Length(8, 8, { message: 'CEP deve ter 8 dígitos' })
  enderecoCep: string;

  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @IsString()
  enderecoCidade: string;

  @IsNotEmpty({ message: 'UF é obrigatória' })
  @Length(2, 2, { message: 'UF deve ter 2 caracteres' })
  enderecoUf: string;

  @IsNotEmpty({ message: 'WhatsApp é obrigatório' })
  @Length(10, 11, { message: 'WhatsApp deve ter 10 ou 11 dígitos' })
  contatoWhatsapp: string;

  @IsOptional()
  @Length(10, 11, { message: 'Telefone deve ter 10 ou 11 dígitos' })
  contatoTelefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  contatoEmail?: string;
}
'@
Set-Content -Path "$basePath\modules\pacientes\dto\create-paciente.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ create-paciente.dto.ts"

# ==========================================
# modules/pacientes/dto/update-paciente.dto.ts
# ==========================================
$content = @'
import { PartialType } from '@nestjs/mapped-types';
import { CreatePacienteDto } from './create-paciente.dto';

export class UpdatePacienteDto extends PartialType(CreatePacienteDto) {}
'@
Set-Content -Path "$basePath\modules\pacientes\dto\update-paciente.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ update-paciente.dto.ts"

# ==========================================
# modules/pacientes/pacientes.service.ts
# ==========================================
$content = @'
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async create(
    createPacienteDto: CreatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const existingPaciente = await this.pacienteRepository.findOne({
      where: { cpf: createPacienteDto.cpf },
    });

    if (existingPaciente) {
      throw new ConflictException('CPF já cadastrado');
    }

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto,
      usuarioId,
    });

    return this.pacienteRepository.save(paciente);
  }

  async findAll(usuarioId: string): Promise<Paciente[]> {
    return this.pacienteRepository.find({
      where: { usuarioId, ativo: true },
      order: { nomeCompleto: 'ASC' },
    });
  }

  async findOne(id: string, usuarioId: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id, usuarioId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return paciente;
  }

  async update(
    id: string,
    updatePacienteDto: UpdatePacienteDto,
    usuarioId: string,
  ): Promise<Paciente> {
    const paciente = await this.findOne(id, usuarioId);

    if (updatePacienteDto.cpf && updatePacienteDto.cpf !== paciente.cpf) {
      const existingPaciente = await this.pacienteRepository.findOne({
        where: { cpf: updatePacienteDto.cpf },
      });

      if (existingPaciente) {
        throw new ConflictException('CPF já cadastrado');
      }
    }

    Object.assign(paciente, updatePacienteDto);
    return this.pacienteRepository.save(paciente);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const paciente = await this.findOne(id, usuarioId);
    paciente.ativo = false;
    await this.pacienteRepository.save(paciente);
  }

  async getStats(usuarioId: string) {
    const total = await this.pacienteRepository.count({
      where: { usuarioId, ativo: true },
    });

    return {
      totalPacientes: total,
      atendidosHoje: 0,
      atendidosMes: 0,
    };
  }
}
'@
Set-Content -Path "$basePath\modules\pacientes\pacientes.service.ts" -Value $content -Encoding UTF8
Write-Host "✅ pacientes.service.ts"

# ==========================================
# modules/pacientes/pacientes.controller.ts
# ==========================================
$content = @'
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Controller('pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  create(
    @Body() createPacienteDto: CreatePacienteDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.create(createPacienteDto, usuario.id);
  }

  @Get()
  findAll(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.findAll(usuario.id);
  }

  @Get('stats')
  getStats(@CurrentUser() usuario: Usuario) {
    return this.pacientesService.getStats(usuario.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.findOne(id, usuario.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.update(id, updatePacienteDto, usuario.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pacientesService.remove(id, usuario.id);
  }
}
'@
Set-Content -Path "$basePath\modules\pacientes\pacientes.controller.ts" -Value $content -Encoding UTF8
Write-Host "✅ pacientes.controller.ts"

# ==========================================
# modules/pacientes/pacientes.module.ts
# ==========================================
$content = @'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
'@
Set-Content -Path "$basePath\modules\pacientes\pacientes.module.ts" -Value $content -Encoding UTF8
Write-Host "✅ pacientes.module.ts"

# ==========================================
# modules/anamneses/entities/anamnese.entity.ts
# ==========================================
$content = @'
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

export enum MotivoBusca {
  SINTOMA_EXISTENTE = 'SINTOMA_EXISTENTE',
  PREVENTIVO = 'PREVENTIVO',
}

export enum InicioProblema {
  GRADUAL = 'GRADUAL',
  REPENTINO = 'REPENTINO',
  APOS_EVENTO = 'APOS_EVENTO',
  NAO_SABE = 'NAO_SABE',
}

export interface AreaAfetada {
  regiao: string;
  lado?: 'esquerdo' | 'direito' | 'ambos';
}

@Entity('anamneses')
export class Anamnese extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id' })
  pacienteId: string;

  @Column({ name: 'motivo_busca', type: 'enum', enum: MotivoBusca })
  motivoBusca: MotivoBusca;

  @Column({ name: 'areas_afetadas', type: 'jsonb', default: [] })
  areasAfetadas: AreaAfetada[];

  @Column({ name: 'intensidade_dor', type: 'int', default: 0 })
  intensidadeDor: number;

  @Column({ name: 'descricao_sintomas', type: 'text', nullable: true })
  descricaoSintomas: string;

  @Column({ name: 'tempo_problema', length: 100, nullable: true })
  tempoProblema: string;

  @Column({ name: 'hora_intensifica', length: 255, nullable: true })
  horaIntensifica: string;

  @Column({
    name: 'inicio_problema',
    type: 'enum',
    enum: InicioProblema,
    nullable: true,
  })
  inicioProblema: InicioProblema;

  @Column({ name: 'evento_especifico', type: 'text', nullable: true })
  eventoEspecifico: string;

  @Column({ name: 'fator_alivio', type: 'text', nullable: true })
  fatorAlivio: string;

  @Column({ name: 'problema_anterior', default: false })
  problemaAnterior: boolean;

  @Column({ name: 'quando_problema_anterior', length: 255, nullable: true })
  quandoProblemaAnterior: string;

  @Column({ name: 'tratamentos_anteriores', type: 'jsonb', default: [] })
  tratamentosAnteriores: string[];

  @Column({ name: 'historico_familiar', type: 'text', nullable: true })
  historicoFamiliar: string;
}
'@
Set-Content -Path "$basePath\modules\anamneses\entities\anamnese.entity.ts" -Value $content -Encoding UTF8
Write-Host "✅ anamnese.entity.ts"

# ==========================================
# modules/anamneses/dto/create-anamnese.dto.ts
# ==========================================
$content = @'
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { MotivoBusca, InicioProblema, AreaAfetada } from '../entities/anamnese.entity';

export class CreateAnamneseDto {
  @IsNotEmpty({ message: 'ID do paciente é obrigatório' })
  @IsUUID()
  pacienteId: string;

  @IsNotEmpty({ message: 'Motivo da busca é obrigatório' })
  @IsEnum(MotivoBusca)
  motivoBusca: MotivoBusca;

  @IsOptional()
  @IsArray()
  areasAfetadas?: AreaAfetada[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  intensidadeDor?: number;

  @IsOptional()
  @IsString()
  descricaoSintomas?: string;

  @IsOptional()
  @IsString()
  tempoProblema?: string;

  @IsOptional()
  @IsString()
  horaIntensifica?: string;

  @IsOptional()
  @IsEnum(InicioProblema)
  inicioProblema?: InicioProblema;

  @IsOptional()
  @IsString()
  eventoEspecifico?: string;

  @IsOptional()
  @IsString()
  fatorAlivio?: string;

  @IsOptional()
  @IsBoolean()
  problemaAnterior?: boolean;

  @IsOptional()
  @IsString()
  quandoProblemaAnterior?: string;

  @IsOptional()
  @IsArray()
  tratamentosAnteriores?: string[];

  @IsOptional()
  @IsString()
  historicoFamiliar?: string;
}
'@
Set-Content -Path "$basePath\modules\anamneses\dto\create-anamnese.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ create-anamnese.dto.ts"

# ==========================================
# modules/anamneses/dto/update-anamnese.dto.ts
# ==========================================
$content = @'
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAnamneseDto } from './create-anamnese.dto';

export class UpdateAnamneseDto extends PartialType(
  OmitType(CreateAnamneseDto, ['pacienteId'] as const),
) {}
'@
Set-Content -Path "$basePath\modules\anamneses\dto\update-anamnese.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ update-anamnese.dto.ts"

# ==========================================
# modules/anamneses/anamneses.service.ts
# ==========================================
$content = @'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class AnamnesesService {
  constructor(
    @InjectRepository(Anamnese)
    private readonly anamneseRepository: Repository<Anamnese>,
    private readonly pacientesService: PacientesService,
  ) {}

  async create(
    createAnamneseDto: CreateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    await this.pacientesService.findOne(createAnamneseDto.pacienteId, usuarioId);
    const anamnese = this.anamneseRepository.create(createAnamneseDto);
    return this.anamneseRepository.save(anamnese);
  }

  async findAllByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<Anamnese[]> {
    await this.pacientesService.findOne(pacienteId, usuarioId);
    return this.anamneseRepository.find({
      where: { pacienteId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, usuarioId: string): Promise<Anamnese> {
    const anamnese = await this.anamneseRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!anamnese) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    if (anamnese.paciente.usuarioId !== usuarioId) {
      throw new NotFoundException('Anamnese não encontrada');
    }

    return anamnese;
  }

  async update(
    id: string,
    updateAnamneseDto: UpdateAnamneseDto,
    usuarioId: string,
  ): Promise<Anamnese> {
    const anamnese = await this.findOne(id, usuarioId);
    Object.assign(anamnese, updateAnamneseDto);
    return this.anamneseRepository.save(anamnese);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const anamnese = await this.findOne(id, usuarioId);
    await this.anamneseRepository.remove(anamnese);
  }
}
'@
Set-Content -Path "$basePath\modules\anamneses\anamneses.service.ts" -Value $content -Encoding UTF8
Write-Host "✅ anamneses.service.ts"

# ==========================================
# modules/anamneses/anamneses.controller.ts
# ==========================================
$content = @'
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AnamnesesService } from './anamneses.service';
import { CreateAnamneseDto } from './dto/create-anamnese.dto';
import { UpdateAnamneseDto } from './dto/update-anamnese.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Controller('anamneses')
@UseGuards(JwtAuthGuard)
export class AnamnesesController {
  constructor(private readonly anamnesesService: AnamnesesService) {}

  @Post()
  create(
    @Body() createAnamneseDto: CreateAnamneseDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.create(createAnamneseDto, usuario.id);
  }

  @Get()
  findAllByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.findAllByPaciente(pacienteId, usuario.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.findOne(id, usuario.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnamneseDto: UpdateAnamneseDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.update(id, updateAnamneseDto, usuario.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.anamnesesService.remove(id, usuario.id);
  }
}
'@
Set-Content -Path "$basePath\modules\anamneses\anamneses.controller.ts" -Value $content -Encoding UTF8
Write-Host "✅ anamneses.controller.ts"

# ==========================================
# modules/anamneses/anamneses.module.ts
# ==========================================
$content = @'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Anamnese } from './entities/anamnese.entity';
import { AnamnesesService } from './anamneses.service';
import { AnamnesesController } from './anamneses.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Anamnese]), PacientesModule],
  controllers: [AnamnesesController],
  providers: [AnamnesesService],
  exports: [AnamnesesService],
})
export class AnamnesesModule {}
'@
Set-Content -Path "$basePath\modules\anamneses\anamneses.module.ts" -Value $content -Encoding UTF8
Write-Host "✅ anamneses.module.ts"

# ==========================================
# modules/evolucoes/entities/evolucao.entity.ts
# ==========================================
$content = @'
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('evolucoes')
export class Evolucao extends BaseEntity {
  @ManyToOne(() => Paciente)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'paciente_id' })
  pacienteId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data: Date;

  @Column({ type: 'text', nullable: true })
  listagens: string;

  @Column({ name: 'leg_check', type: 'text', nullable: true })
  legCheck: string;

  @Column({ type: 'text', nullable: true })
  ajustes: string;

  @Column({ type: 'text', nullable: true })
  orientacoes: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;
}
'@
Set-Content -Path "$basePath\modules\evolucoes\entities\evolucao.entity.ts" -Value $content -Encoding UTF8
Write-Host "✅ evolucao.entity.ts"

# ==========================================
# modules/evolucoes/dto/create-evolucao.dto.ts
# ==========================================
$content = @'
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateEvolucaoDto {
  @IsNotEmpty({ message: 'ID do paciente é obrigatório' })
  @IsUUID()
  pacienteId: string;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  listagens?: string;

  @IsOptional()
  @IsString()
  legCheck?: string;

  @IsNotEmpty({ message: 'Ajustes realizados são obrigatórios' })
  @IsString()
  ajustes: string;

  @IsOptional()
  @IsString()
  orientacoes?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
'@
Set-Content -Path "$basePath\modules\evolucoes\dto\create-evolucao.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ create-evolucao.dto.ts"

# ==========================================
# modules/evolucoes/dto/update-evolucao.dto.ts
# ==========================================
$content = @'
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateEvolucaoDto } from './create-evolucao.dto';

export class UpdateEvolucaoDto extends PartialType(
  OmitType(CreateEvolucaoDto, ['pacienteId'] as const),
) {}
'@
Set-Content -Path "$basePath\modules\evolucoes\dto\update-evolucao.dto.ts" -Value $content -Encoding UTF8
Write-Host "✅ update-evolucao.dto.ts"

# ==========================================
# modules/evolucoes/evolucoes.service.ts
# ==========================================
$content = @'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evolucao } from './entities/evolucao.entity';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import { PacientesService } from '../pacientes/pacientes.service';

@Injectable()
export class EvolucoesService {
  constructor(
    @InjectRepository(Evolucao)
    private readonly evolucaoRepository: Repository<Evolucao>,
    private readonly pacientesService: PacientesService,
  ) {}

  async create(
    createEvolucaoDto: CreateEvolucaoDto,
    usuarioId: string,
  ): Promise<Evolucao> {
    await this.pacientesService.findOne(createEvolucaoDto.pacienteId, usuarioId);

    const evolucao = this.evolucaoRepository.create({
      ...createEvolucaoDto,
      data: createEvolucaoDto.data ? new Date(createEvolucaoDto.data) : new Date(),
    });

    return this.evolucaoRepository.save(evolucao);
  }

  async findAllByPaciente(
    pacienteId: string,
    usuarioId: string,
  ): Promise<Evolucao[]> {
    await this.pacientesService.findOne(pacienteId, usuarioId);

    return this.evolucaoRepository.find({
      where: { pacienteId },
      order: { data: 'DESC' },
    });
  }

  async findOne(id: string, usuarioId: string): Promise<Evolucao> {
    const evolucao = await this.evolucaoRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!evolucao) {
      throw new NotFoundException('Evolução não encontrada');
    }

    if (evolucao.paciente.usuarioId !== usuarioId) {
      throw new NotFoundException('Evolução não encontrada');
    }

    return evolucao;
  }

  async update(
    id: string,
    updateEvolucaoDto: UpdateEvolucaoDto,
    usuarioId: string,
  ): Promise<Evolucao> {
    const evolucao = await this.findOne(id, usuarioId);
    Object.assign(evolucao, updateEvolucaoDto);
    return this.evolucaoRepository.save(evolucao);
  }

  async remove(id: string, usuarioId: string): Promise<void> {
    const evolucao = await this.findOne(id, usuarioId);
    await this.evolucaoRepository.remove(evolucao);
  }
}
'@
Set-Content -Path "$basePath\modules\evolucoes\evolucoes.service.ts" -Value $content -Encoding UTF8
Write-Host "✅ evolucoes.service.ts"

# ==========================================
# modules/evolucoes/evolucoes.controller.ts
# ==========================================
$content = @'
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { EvolucoesService } from './evolucoes.service';
import { CreateEvolucaoDto } from './dto/create-evolucao.dto';
import { UpdateEvolucaoDto } from './dto/update-evolucao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Controller('evolucoes')
@UseGuards(JwtAuthGuard)
export class EvolucoesController {
  constructor(private readonly evolucoesService: EvolucoesService) {}

  @Post()
  create(
    @Body() createEvolucaoDto: CreateEvolucaoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.create(createEvolucaoDto, usuario.id);
  }

  @Get()
  findAllByPaciente(
    @Query('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.findAllByPaciente(pacienteId, usuario.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.findOne(id, usuario.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEvolucaoDto: UpdateEvolucaoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.update(id, updateEvolucaoDto, usuario.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.evolucoesService.remove(id, usuario.id);
  }
}
'@
Set-Content -Path "$basePath\modules\evolucoes\evolucoes.controller.ts" -Value $content -Encoding UTF8
Write-Host "✅ evolucoes.controller.ts"

# ==========================================
# modules/evolucoes/evolucoes.module.ts
# ==========================================
$content = @'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evolucao } from './entities/evolucao.entity';
import { EvolucoesService } from './evolucoes.service';
import { EvolucoesController } from './evolucoes.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Evolucao]), PacientesModule],
  controllers: [EvolucoesController],
  providers: [EvolucoesService],
  exports: [EvolucoesService],
})
export class EvolucoesModule {}
'@
Set-Content -Path "$basePath\modules\evolucoes\evolucoes.module.ts" -Value $content -Encoding UTF8
Write-Host "✅ evolucoes.module.ts"

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Todos os arquivos foram criados!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Agora rode: npm run start:dev"