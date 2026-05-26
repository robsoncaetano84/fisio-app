import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePacienteDto } from './create-paciente.dto';
import { UpdatePacienteDto } from './update-paciente.dto';
import { Sexo } from '../entities/paciente.entity';

const getErrorProperties = async (dto: object) => {
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error) => error.property);
};

describe('Paciente address DTOs', () => {
  it('accepts null and empty address fields when creating paciente', async () => {
    const dto = plainToInstance(CreatePacienteDto, {
      nomeCompleto: 'Paciente Teste',
      cpf: '12345678901',
      dataNascimento: '1990-01-01',
      sexo: Sexo.FEMININO,
      enderecoRua: null,
      enderecoNumero: '',
      enderecoComplemento: '   ',
      enderecoBairro: null,
      enderecoCep: '',
      enderecoCidade: null,
      enderecoUf: '',
      contatoWhatsapp: '11999999999',
    });

    await expect(getErrorProperties(dto)).resolves.toEqual([]);
    expect(dto.enderecoRua).toBeUndefined();
    expect(dto.enderecoNumero).toBeUndefined();
    expect(dto.enderecoComplemento).toBeUndefined();
    expect(dto.enderecoBairro).toBeUndefined();
    expect(dto.enderecoCep).toBeUndefined();
    expect(dto.enderecoCidade).toBeUndefined();
    expect(dto.enderecoUf).toBeUndefined();
  });

  it('accepts null and empty address fields when updating paciente', async () => {
    const dto = plainToInstance(UpdatePacienteDto, {
      enderecoRua: null,
      enderecoNumero: '',
      enderecoComplemento: '   ',
      enderecoBairro: null,
      enderecoCep: '',
      enderecoCidade: null,
      enderecoUf: '',
    });

    await expect(getErrorProperties(dto)).resolves.toEqual([]);
    expect(dto.enderecoRua).toBeUndefined();
    expect(dto.enderecoNumero).toBeUndefined();
    expect(dto.enderecoComplemento).toBeUndefined();
    expect(dto.enderecoBairro).toBeUndefined();
    expect(dto.enderecoCep).toBeUndefined();
    expect(dto.enderecoCidade).toBeUndefined();
    expect(dto.enderecoUf).toBeUndefined();
  });
});
