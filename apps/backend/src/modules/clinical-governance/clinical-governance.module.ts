import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ClinicalGovernanceController } from './clinical-governance.controller';
import { ClinicalGovernanceService } from './clinical-governance.service';
import { ClinicalAuditLog } from './entities/clinical-audit-log.entity';
import { ClinicalProtocolVersion } from './entities/clinical-protocol-version.entity';
import { ConsentPurposeLog } from './entities/consent-purpose-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalProtocolVersion,
      ConsentPurposeLog,
      ClinicalAuditLog,
      Usuario,
    ]),
  ],
  controllers: [ClinicalGovernanceController],
  providers: [ClinicalGovernanceService],
  exports: [ClinicalGovernanceService],
})
export class ClinicalGovernanceModule {}

