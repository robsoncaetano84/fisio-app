import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UserRole } from '../usuarios/entities/usuario.entity';
import { ExerciciosController } from './exercicios.controller';
import { ExerciciosCatalogService } from './exercicios-catalog.service';

describe('ExerciciosController', () => {
  const make = () => {
    const service = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 'exercicio-1' }),
      findOneForAdmin: jest.fn().mockResolvedValue({ id: 'exercicio-1' }),
      create: jest.fn().mockResolvedValue({ id: 'exercicio-1' }),
      update: jest.fn().mockResolvedValue({ id: 'exercicio-1' }),
      archive: jest.fn().mockResolvedValue({ success: true }),
      reviewPrimaryMedia: jest.fn().mockResolvedValue({ id: 'exercicio-1' }),
    } as unknown as jest.Mocked<ExerciciosCatalogService>;

    const controller = new ExerciciosController(service);
    return { controller, service };
  };

  it('only forwards includeDrafts for admin users', () => {
    const { controller, service } = make();

    controller.findAll(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'true',
      { id: 'usr-1', role: UserRole.USER } as any,
    );

    expect(service.findAll).toHaveBeenLastCalledWith({
      q: undefined,
      regiaoCorporal: undefined,
      categoria: undefined,
      nivel: undefined,
      tag: undefined,
      includeDrafts: false,
    });

    controller.findAll(
      'lombar',
      undefined,
      undefined,
      undefined,
      undefined,
      'true',
      { id: 'adm-1', role: UserRole.ADMIN } as any,
    );

    expect(service.findAll).toHaveBeenLastCalledWith({
      q: 'lombar',
      regiaoCorporal: undefined,
      categoria: undefined,
      nivel: undefined,
      tag: undefined,
      includeDrafts: true,
    });
  });

  it('uses admin detail lookup only for admin users', async () => {
    const { controller, service } = make();
    const id = '11111111-1111-4111-8111-111111111111';

    await controller.findOne(id, { id: 'usr-1', role: UserRole.USER } as any);
    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.findOneForAdmin).not.toHaveBeenCalled();

    await controller.findOne(id, { id: 'adm-1', role: UserRole.ADMIN } as any);
    expect(service.findOneForAdmin).toHaveBeenCalledWith(id);
  });

  it('enforces admin/user role metadata on read endpoints', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ExerciciosController.prototype.findAll),
    ).toEqual([UserRole.ADMIN, UserRole.USER]);
    expect(
      Reflect.getMetadata(ROLES_KEY, ExerciciosController.prototype.findOne),
    ).toEqual([UserRole.ADMIN, UserRole.USER]);
  });

  it('enforces admin role metadata on write endpoints', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ExerciciosController.prototype.create),
    ).toEqual([UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, ExerciciosController.prototype.update),
    ).toEqual([UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, ExerciciosController.prototype.archive),
    ).toEqual([UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        ExerciciosController.prototype.reviewPrimaryMedia,
      ),
    ).toEqual([UserRole.ADMIN]);
  });

  it('forwards primary media clinical review updates', () => {
    const { controller, service } = make();
    const id = '11111111-1111-4111-8111-111111111111';
    const dto = {
      status: 'APROVADA',
      observacao: 'Imagem clara para uso.',
    } as any;

    controller.reviewPrimaryMedia(id, dto, { id: 'adm-1' } as any);

    expect(service.reviewPrimaryMedia).toHaveBeenCalledWith(id, dto, 'adm-1');
  });
});
