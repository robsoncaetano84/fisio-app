import { LaudoStatus } from '../laudos/entities/laudo.entity';
import {
  EstadoCivil,
  Paciente,
  PacienteCadastroOrigem,
  PacienteVinculoStatus,
  Sexo,
} from './entities/paciente.entity';
import {
  PacienteCicloStatus,
  PacienteListItemDto,
} from './dto/paciente-list-item.dto';
import { PacienteListService } from './paciente-list.service';

describe('PacienteListService', () => {
  const makeQueryBuilder = ({
    rawMany = [],
    many = [],
  }: {
    rawMany?: unknown[];
    many?: unknown[];
  } = {}) => ({
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawMany),
    getMany: jest.fn().mockResolvedValue(many),
  });

  const makeService = ({
    anamneseRows = [],
    latestLaudos = [],
    atividadeRows = [],
  }: {
    anamneseRows?: unknown[];
    latestLaudos?: unknown[];
    atividadeRows?: unknown[];
  } = {}) => {
    const anamneseBuilder = makeQueryBuilder({ rawMany: anamneseRows });
    const laudoBuilder = makeQueryBuilder({ many: latestLaudos });
    const atividadeBuilder = makeQueryBuilder({ rawMany: atividadeRows });
    const service = new PacienteListService(
      { createQueryBuilder: jest.fn(() => anamneseBuilder) } as any,
      { createQueryBuilder: jest.fn(() => laudoBuilder) } as any,
      { createQueryBuilder: jest.fn(() => atividadeBuilder) } as any,
    );

    return {
      service,
      anamneseBuilder,
      laudoBuilder,
      atividadeBuilder,
    };
  };

  const now = new Date('2026-01-02T03:04:05.000Z');

  const makePaciente = (overrides: Partial<Paciente> = {}) =>
    ({
      id: 'paciente-1',
      nomeCompleto: 'Paciente Exemplo',
      cpf: '12345678901',
      rg: null,
      dataNascimento: new Date('1990-01-01T00:00:00.000Z'),
      sexo: Sexo.FEMININO,
      estadoCivil: EstadoCivil.SOLTEIRO,
      profissao: null,
      enderecoRua: 'Rua Teste',
      enderecoNumero: '123',
      enderecoComplemento: null,
      enderecoBairro: 'Centro',
      enderecoCep: '12345678',
      enderecoCidade: 'Sao Paulo',
      enderecoUf: 'SP',
      contatoWhatsapp: '11999999999',
      contatoTelefone: null,
      contatoEmail: null,
      ativo: true,
      usuarioId: 'usuario-1',
      pacienteUsuarioId: null,
      pacienteUsuario: null,
      anamneseLiberadaPaciente: false,
      anamneseSolicitacaoPendente: false,
      anamneseSolicitacaoEm: null,
      anamneseSolicitacaoUltimaEm: null,
      cadastroOrigem: PacienteCadastroOrigem.CADASTRO_ASSISTIDO,
      vinculoStatus: PacienteVinculoStatus.SEM_VINCULO,
      conviteEnviadoEm: null,
      conviteExpiraEm: null,
      conviteAceitoEm: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }) as Paciente;

  it('uses linked user name for quick invite placeholder', () => {
    const { service } = makeService();
    const paciente = makePaciente({
      nomeCompleto: 'Paciente Convite Rapido',
      cadastroOrigem: PacienteCadastroOrigem.CONVITE_RAPIDO,
      pacienteUsuario: { nome: 'Maria Silva' } as any,
    });

    expect(service.applyDisplayNameFallback(paciente).nomeCompleto).toBe(
      'Maria Silva',
    );
  });

  it('maps list item with default cycle status', () => {
    const { service } = makeService();

    const item: PacienteListItemDto = service.toPacienteListItem(
      makePaciente({
        pacienteUsuarioId: 'usuario-paciente-1',
        contatoEmail: 'paciente@example.com',
      }),
    );

    expect(item).toMatchObject({
      id: 'paciente-1',
      nomeCompleto: 'Paciente Exemplo',
      pacienteUsuarioId: 'usuario-paciente-1',
      contatoEmail: 'paciente@example.com',
      statusCiclo: PacienteCicloStatus.AGUARDANDO_ANAMNESE,
    });
  });

  it('adds the expected lightweight selects for list queries', () => {
    const { service } = makeService();
    const query = makeQueryBuilder();

    const result = service.addPacienteListSelects(query as any);

    expect(result).toBe(query);
    expect(query.select).toHaveBeenCalledWith(
      expect.arrayContaining([
        'p.id',
        'p.nomeCompleto',
        'p.pacienteUsuarioId',
        'p.updatedAt',
      ]),
    );
    expect(query.leftJoin).toHaveBeenCalledWith(
      'p.pacienteUsuario',
      'pacienteUsuario',
    );
    expect(query.addSelect).toHaveBeenCalledWith([
      'pacienteUsuario.id',
      'pacienteUsuario.nome',
    ]);
  });

  it('builds cycle status from anamnesis, latest report and active activity', async () => {
    const { service } = makeService({
      anamneseRows: [{ pacienteId: 'em-tratamento' }, { pacienteId: 'alta' }],
      latestLaudos: [
        {
          pacienteId: 'em-tratamento',
          status: LaudoStatus.RASCUNHO_IA,
          criteriosAlta: null,
        },
        {
          pacienteId: 'alta',
          status: LaudoStatus.VALIDADO_PROFISSIONAL,
          criteriosAlta: 'criterios atingidos',
        },
      ],
      atividadeRows: [{ pacienteId: 'em-tratamento' }],
    });

    const result = await service.buildCicloStatusByPacienteIds([
      'aguardando',
      'em-tratamento',
      'alta',
    ]);

    expect(result.get('aguardando')).toBe(
      PacienteCicloStatus.AGUARDANDO_ANAMNESE,
    );
    expect(result.get('em-tratamento')).toBe(PacienteCicloStatus.EM_TRATAMENTO);
    expect(result.get('alta')).toBe(PacienteCicloStatus.ALTA_CONCLUIDA);
  });

  it('does not query repositories when there are no paciente ids', async () => {
    const { service, anamneseBuilder, laudoBuilder, atividadeBuilder } =
      makeService();

    await expect(service.buildCicloStatusByPacienteIds([])).resolves.toEqual(
      new Map(),
    );
    expect(anamneseBuilder.getRawMany).not.toHaveBeenCalled();
    expect(laudoBuilder.getMany).not.toHaveBeenCalled();
    expect(atividadeBuilder.getRawMany).not.toHaveBeenCalled();
  });
});
