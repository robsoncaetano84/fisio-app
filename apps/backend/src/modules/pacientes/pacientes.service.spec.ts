import { PacientesService } from './pacientes.service';
import { Paciente } from './entities/paciente.entity';
import { PacienteCicloStatus } from './dto/paciente-list-item.dto';

describe('PacientesService', () => {
  const makePaciente = (id = 'paciente-1') =>
    ({
      id,
      nomeCompleto: 'Paciente Teste',
    }) as Paciente;

  const makeService = () => {
    const usuarioRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'usuario-1',
        email: 'profissional@example.com',
      }),
    };
    const configService = {
      get: jest.fn().mockReturnValue(''),
    };
    const pacienteListService = {
      applyDisplayNameFallback: jest.fn((paciente: Paciente) => paciente),
      buildCicloStatusByPacienteIds: jest
        .fn()
        .mockResolvedValue(
          new Map([['paciente-1', PacienteCicloStatus.EM_TRATAMENTO]]),
        ),
      toPacienteListItem: jest.fn((paciente: Paciente, statusCiclo) => ({
        id: paciente.id,
        nomeCompleto: paciente.nomeCompleto,
        statusCiclo: statusCiclo || PacienteCicloStatus.AGUARDANDO_ANAMNESE,
      })),
    };
    const pacienteScopeService = {
      findScopedPacienteById: jest.fn().mockResolvedValue(makePaciente()),
    };
    const pacienteProfessionalService = {
      create: jest.fn().mockResolvedValue(makePaciente()),
      update: jest.fn().mockResolvedValue(makePaciente()),
    };

    const service = new PacientesService(
      usuarioRepository as any,
      configService as any,
      {} as any,
      pacienteListService as any,
      {} as any,
      {} as any,
      pacienteScopeService as any,
      pacienteProfessionalService as any,
    );

    return {
      service,
      pacienteListService,
      pacienteScopeService,
      pacienteProfessionalService,
    };
  };

  it('maps detail response with derived cycle status', async () => {
    const { service, pacienteListService, pacienteScopeService } =
      makeService();

    const result = await service.findOneListItem('paciente-1', 'usuario-1');

    expect(pacienteScopeService.findScopedPacienteById).toHaveBeenCalledWith(
      'paciente-1',
      'usuario-1',
      false,
    );
    expect(
      pacienteListService.buildCicloStatusByPacienteIds,
    ).toHaveBeenCalledWith(['paciente-1']);
    expect(result).toMatchObject({
      id: 'paciente-1',
      statusCiclo: PacienteCicloStatus.EM_TRATAMENTO,
    });
  });

  it('maps update response with derived cycle status', async () => {
    const { service, pacienteProfessionalService } = makeService();

    const result = await service.update('paciente-1', {} as any, 'usuario-1');

    expect(pacienteProfessionalService.update).toHaveBeenCalledWith(
      'paciente-1',
      {},
      'usuario-1',
      false,
    );
    expect(result.statusCiclo).toBe(PacienteCicloStatus.EM_TRATAMENTO);
  });
});
