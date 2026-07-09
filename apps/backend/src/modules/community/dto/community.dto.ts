import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CommunityPaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class CommunityFeedQueryDto extends CommunityPaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['recent', 'relevant', 'unanswered'])
  sort?: 'recent' | 'relevant' | 'unanswered';
}

export class CreateCommunityPostDto {
  @IsString()
  @Length(8, 180)
  title: string;

  @IsString()
  @Length(20, 20000)
  contentMarkdown: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  references?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  attachmentsMetadata?: Array<Record<string, unknown>>;
}

export class CreateCommunityReplyDto {
  @IsString()
  @Length(10, 12000)
  contentMarkdown: string;

  @IsBoolean()
  ethicsAccepted: boolean;
}

export class MarkUsefulReplyDto {
  @IsUUID()
  replyId: string;
}

export class CommunityResourceQueryDto extends CommunityPaginationQueryDto {
  @IsOptional()
  @IsIn(['article', 'reference'])
  kind?: 'article' | 'reference';

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class CreateCommunityResourceDto {
  @IsIn(['article', 'reference'])
  kind: 'article' | 'reference';

  @IsString()
  @Length(8, 220)
  title: string;

  @IsString()
  @Length(20, 5000)
  summary: string;

  @IsString()
  @Length(2, 180)
  sourceName: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  @Length(4, 120)
  doi?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  publishedYear?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  authors?: string[];

  @IsString()
  @Length(10, 5000)
  clinicalUse: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCommunityReportDto {
  @IsIn(['post', 'reply', 'resource', 'profile'])
  targetType: 'post' | 'reply' | 'resource' | 'profile';

  @IsUUID()
  targetId: string;

  @IsString()
  @Length(3, 80)
  reason: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  details?: string;
}

export class UpdateCommunityReportDto {
  @IsIn(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'])
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  resolutionNote?: string;
}

export class CreateBookmarkDto {
  @IsIn(['post', 'reply', 'resource', 'profile'])
  targetType: 'post' | 'reply' | 'resource' | 'profile';

  @IsUUID()
  targetId: string;
}

export class CommunityProfilesQueryDto extends CommunityPaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsIn(['contributions', 'useful', 'name'])
  sort?: 'contributions' | 'useful' | 'name';
}

export class CommunitySearchQueryDto extends CommunityPaginationQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsIn(['all', 'discussions', 'resources', 'profiles'])
  type?: 'all' | 'discussions' | 'resources' | 'profiles';
}

export class PresignCommunityUploadDto {
  @IsString()
  @Length(3, 180)
  fileName: string;

  @IsString()
  @Length(3, 120)
  contentType: string;

  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  sizeBytes: number;

  @IsString()
  @Length(3, 80)
  purpose: string;
}

export class CommunityAiClassificationDto {
  @IsString()
  @Length(4, 220)
  title: string;

  @IsString()
  @Length(10, 20000)
  contentMarkdown: string;

  @IsOptional()
  @IsString()
  authorRole?: string;

  @IsOptional()
  @IsString()
  resourceKind?: string;
}

export class CommunitySsoRequestDto {
  @IsOptional()
  @IsString()
  returnTo?: string;

  @IsOptional()
  @IsObject()
  deviceContext?: Record<string, unknown>;
}

export class CommunitySsoExchangeDto {
  @IsString()
  @IsNotEmpty()
  oneTimeToken: string;
}

export class UpdateCommunityProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 180)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  profession?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  specialty?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1200)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  cityState?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  areasOfPractice?: string[];
}

export class UpdateCommunityUserRoleDto {
  @IsIn(['USER', 'MODERATOR', 'ADMIN'])
  role: 'USER' | 'MODERATOR' | 'ADMIN';
}

export class CommunityModerationActionDto {
  @IsIn(['post', 'reply', 'resource'])
  targetType: 'post' | 'reply' | 'resource';

  @IsUUID()
  targetId: string;

  @IsIn(['HIDE', 'RESTORE'])
  action: 'HIDE' | 'RESTORE';

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  reason?: string;
}

export class CommunityClientLogDto {
  @IsString()
  @Length(3, 120)
  event: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  message?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  path?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
