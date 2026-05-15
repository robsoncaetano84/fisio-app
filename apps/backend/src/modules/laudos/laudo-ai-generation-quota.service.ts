import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LaudoAiGeneration } from './entities/laudo-ai-generation.entity';

@Injectable()
export class LaudoAiGenerationQuotaService {
  constructor(
    @InjectRepository(LaudoAiGeneration)
    private readonly laudoAiGenerationRepository: Repository<LaudoAiGeneration>,
  ) {}

  async acquireDailySlot(pacienteId: string): Promise<boolean> {
    const generatedOn = this.getUtcDayString(new Date());
    try {
      const insertResult = await this.laudoAiGenerationRepository
        .createQueryBuilder()
        .insert()
        .into(LaudoAiGeneration)
        .values({ pacienteId, generatedOn })
        .orIgnore()
        .execute();
      return (insertResult.identifiers?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }

  private getUtcDayString(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
