import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'E-mail e obrigatorio' })
  @IsEmail({}, { message: 'E-mail invalido' })
  email: string;
}
