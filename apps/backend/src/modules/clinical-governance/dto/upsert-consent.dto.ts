import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

type ConsentPurposeValue =
  | 'TERMS_REQUIRED'
  | 'PRIVACY_REQUIRED'
  | 'RESEARCH_OPTIONAL'
  | 'AI_OPTIONAL'
  | 'PROFESSIONAL_LGPD_REQUIRED';

const CONSENT_PURPOSES: ConsentPurposeValue[] = [
  'TERMS_REQUIRED',
  'PRIVACY_REQUIRED',
  'RESEARCH_OPTIONAL',
  'AI_OPTIONAL',
  'PROFESSIONAL_LGPD_REQUIRED',
];

export class UpsertConsentDto {
  @IsString()
  @IsIn(CONSENT_PURPOSES)
  purpose: ConsentPurposeValue;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}
