import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { CharlesController } from './charles.controller';
import { CharlesService } from './charles.service';

describe('CharlesController', () => {
  const make = () => {
    const service = {
      getNextAction: jest.fn().mockResolvedValue({
        patientId: 'pac-1',
        stage: 'ANAMNESE',
        stageReason: 'Anamnese nao iniciada',
        nextBestActions: [],
        warnings: [],
        blockers: [],
      }),
    } as unknown as jest.Mocked<CharlesService>;

    const controller = new CharlesController(service);
    return { controller, service };
  };

  it('forwards pacienteId and current user to service', async () => {
    const { controller, service } = make();
    const usuario = { id: 'usr-1', role: UserRole.USER } as any;

    await controller.getNextAction(usuario, { pacienteId: 'pac-1' } as any);

    expect(service.getNextAction).toHaveBeenCalledWith('pac-1', usuario);
  });

  it('enforces admin/user role metadata on controller scope', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, CharlesController);

    expect(roles).toEqual([UserRole.ADMIN, UserRole.USER]);
  });
});
