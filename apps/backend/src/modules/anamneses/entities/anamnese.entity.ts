// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// A NA MN ES E.E NT IT Y
// ==========================================
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

  @Column({ name: 'limitacoes_funcionais', type: 'text', nullable: true })
  limitacoesFuncionais: string;

  @Column({ name: 'atividades_que_pioram', type: 'text', nullable: true })
  atividadesQuePioram: string;

  @Column({ name: 'meta_principal_paciente', type: 'text', nullable: true })
  metaPrincipalPaciente: string;

  @Column({ name: 'horas_sono_media', length: 100, nullable: true })
  horasSonoMedia: string;

  @Column({ name: 'qualidade_sono', type: 'int', nullable: true })
  qualidadeSono: number;

  @Column({ name: 'nivel_estresse', type: 'int', nullable: true })
  nivelEstresse: number;

  @Column({ name: 'humor_predominante', length: 120, nullable: true })
  humorPredominante: string;

  @Column({ name: 'energia_diaria', type: 'int', nullable: true })
  energiaDiaria: number;

  @Column({ name: 'atividade_fisica_regular', type: 'boolean', nullable: true })
  atividadeFisicaRegular: boolean;

  @Column({ name: 'frequencia_atividade_fisica', length: 150, nullable: true })
  frequenciaAtividadeFisica: string;

  @Column({ name: 'apoio_emocional', type: 'int', nullable: true })
  apoioEmocional: number;

  @Column({ name: 'observacoes_estilo_vida', type: 'text', nullable: true })
  observacoesEstiloVida: string;
}
