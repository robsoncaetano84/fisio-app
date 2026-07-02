// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// P AC IE NT ES C PF.S PE C
// ==========================================
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PacientesService } from './pacientes.service';
import { Paciente } from './entities/paciente.entity';
import { Evolucao } from '../evolucoes/entities/evolucao.entity';
import { Laudo } from '../laudos/entities/laudo.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';

/**
 * F16: CPF e unico por profissional. A checagem de duplicidade e escopada por
 * usuarioId (mesma pessoa pode ser paciente de varios profissionais).
 */
describe('PacientesService.create — CPF por profissional (F16)', () => {
  function build(existing: Paciente | null) {
    const pacienteRepo = {
      findOne: jest.fn().mockResolvedValue(existing),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
    } as unknown as Repository<Paciente>;
    const service = new PacientesService(
      pacienteRepo,
      {} as unknown as Repository<Evolucao>,
      {} as unknown as Repository<Laudo>,
      {} as unknown as Repository<Usuario>,
    );
    return { service, pacienteRepo };
  }

  const dto = { cpf: '12345678901', nomeCompleto: 'Fulano' } as CreatePacienteDto;

  it('checa duplicidade de CPF escopada ao profissional (usuarioId)', async () => {
    const { service, pacienteRepo } = build(null);
    await service.create(dto, 'prof-1');
    expect(pacienteRepo.findOne).toHaveBeenCalledWith({
      where: { cpf: '12345678901', usuarioId: 'prof-1' },
    });
  });

  it('rejeita quando o mesmo profissional ja tem o CPF', async () => {
    const { service } = build({ id: 'p1' } as Paciente);
    await expect(service.create(dto, 'prof-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
