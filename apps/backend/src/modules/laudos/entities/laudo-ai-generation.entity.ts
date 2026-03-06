// ==========================================
// @author: Robson Lacerda Caetano - RCTEC - rctec.solucoestecnologicas@gmail.com
// @date:   26-01-2026
// L AU DO A I G EN ER AT IO N.E NT IT Y
// ==========================================
import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('laudo_ai_generations')
@Unique('uq_laudo_ai_generations_paciente_dia', ['pacienteId', 'generatedOn'])
export class LaudoAiGeneration extends BaseEntity {
  @Column({ name: 'paciente_id' })
  pacienteId: string;

  @Column({ name: 'generated_on', type: 'date' })
  generatedOn: string;
}
