import {
  mapCrmAdminPatient,
  mapCrmAdminPatientEmotionalContext,
  mapCrmAdminProfessional,
} from './crm-admin.mapper';
import { EstadoCivil, Sexo } from '../pacientes/entities/paciente.entity';
import { UserRole } from '../usuarios/entities/usuario.entity';

describe('crm admin mapper', () => {
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  it('maps professionals and masks email by default', () => {
    const professional = {
      id: 'prof-1',
      nome: 'Profissional',
      email: 'profissional@teste.com',
      registroProf: '123',
      especialidade: 'Fisioterapia',
      ativo: true,
      role: UserRole.USER,
      createdAt,
      updatedAt,
    } as any;

    expect(
      mapCrmAdminProfessional(professional, {
        total: 4,
        ativos: 3,
        lastPacienteUpdate: updatedAt,
      }),
    ).toMatchObject({
      id: 'prof-1',
      email: 'pr***@teste.com',
      pacientesTotal: 4,
      pacientesAtivos: 3,
      lastPacienteUpdate: updatedAt,
    });

    expect(
      mapCrmAdminProfessional(professional, undefined, {
        includeSensitive: true,
      }).email,
    ).toBe('profissional@teste.com');
  });

  it('maps patients with masked sensitive fields by default', () => {
    const paciente = {
      id: 'pac-1',
      nomeCompleto: 'Paciente Teste',
      cpf: '12345678901',
      dataNascimento: new Date('1990-01-01T00:00:00.000Z'),
      sexo: Sexo.FEMININO,
      estadoCivil: EstadoCivil.SOLTEIRO,
      contatoEmail: 'paciente@teste.com',
      contatoWhatsapp: '11999999999',
      enderecoCidade: 'Sao Paulo',
      enderecoUf: 'SP',
      profissao: 'Designer',
      ativo: true,
      createdAt,
      updatedAt,
      usuarioId: 'prof-1',
      usuario: {
        nome: 'Profissional',
        email: 'profissional@teste.com',
      },
      pacienteUsuarioId: 'user-paciente-1',
      pacienteUsuario: {
        email: 'conta.paciente@teste.com',
      },
    } as any;

    expect(mapCrmAdminPatient(paciente)).toMatchObject({
      id: 'pac-1',
      cpf: '12******01',
      contatoEmail: 'pa***@teste.com',
      contatoWhatsapp: '11******99',
      profissionalNome: 'Profissional',
      profissionalEmail: 'pr***@teste.com',
      pacienteUsuarioEmail: 'co***@teste.com',
      emocional: null,
    });

    expect(
      mapCrmAdminPatient(paciente, null, { includeSensitive: true }),
    ).toMatchObject({
      cpf: '12345678901',
      contatoEmail: 'paciente@teste.com',
      contatoWhatsapp: '11999999999',
      profissionalEmail: 'profissional@teste.com',
      pacienteUsuarioEmail: 'conta.paciente@teste.com',
    });
  });

  it('maps emotional context and flags vulnerable patients', () => {
    expect(
      mapCrmAdminPatientEmotionalContext({
        nivelEstresse: 8,
        energiaDiaria: 5,
        apoioEmocional: 5,
        qualidadeSono: 5,
        humorPredominante: 'ansioso',
        createdAt,
      } as any),
    ).toMatchObject({
      nivelEstresse: 8,
      vulnerabilidade: true,
      humorPredominante: 'ansioso',
      updatedAt: createdAt,
    });

    expect(mapCrmAdminPatientEmotionalContext(null)).toBeNull();
  });
});
