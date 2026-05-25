import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import type {
  CommunityContributionEventType,
  CommunityModerationStatus,
  CommunityNotificationType,
  CommunityReportStatus,
  CommunityResourceKind,
  CommunityTargetType,
} from '../community.types';

@Entity('community_profiles')
@Index('idx_community_profiles_user', ['userId'], { unique: true })
@Index('idx_community_profiles_username', ['username'], { unique: true })
@Index('idx_community_profiles_profession_specialty', [
  'profession',
  'specialty',
])
export class CommunityProfile extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 80 })
  username: string;

  @Column({ name: 'display_name', type: 'varchar', length: 180 })
  displayName: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  profession: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  specialty: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'city_state', type: 'varchar', length: 120, nullable: true })
  cityState: string | null;

  @Column({ name: 'areas_of_practice', type: 'jsonb', default: () => "'[]'" })
  areasOfPractice: string[];

  @Column({ name: 'reputation_score', type: 'int', default: 0 })
  reputationScore: number;

  @Column({ name: 'contribution_count', type: 'int', default: 0 })
  contributionCount: number;

  @Column({ name: 'useful_answer_count', type: 'int', default: 0 })
  usefulAnswerCount: number;

  @Column({ name: 'shared_article_count', type: 'int', default: 0 })
  sharedArticleCount: number;

  @Column({ name: 'recommended_reference_count', type: 'int', default: 0 })
  recommendedReferenceCount: number;
}

@Entity('community_categories')
@Index('idx_community_categories_slug', ['slug'], { unique: true })
@Index('idx_community_categories_group_sort', ['group', 'sortOrder'])
export class CommunityCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 140 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  group: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  icon: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}

@Entity('community_tags')
@Index('idx_community_tags_slug', ['slug'], { unique: true })
@Index('idx_community_tags_usage', ['usageCount'])
export class CommunityTag extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;
}

@Entity('community_posts')
@Index('idx_community_posts_slug', ['slug'], { unique: true })
@Index('idx_community_posts_category_activity', [
  'categoryId',
  'lastActivityAt',
])
@Index('idx_community_posts_author_created', ['authorId', 'createdAt'])
@Index('idx_community_posts_status_created', ['moderationStatus', 'createdAt'])
export class CommunityPost extends BaseEntity {
  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'varchar', length: 220 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ name: 'content_markdown', type: 'text' })
  contentMarkdown: string;

  @Column({
    name: 'moderation_status',
    type: 'varchar',
    length: 30,
    default: 'APPROVED',
  })
  moderationStatus: CommunityModerationStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount: number;

  @Column({ name: 'replies_count', type: 'int', default: 0 })
  repliesCount: number;

  @Column({ name: 'useful_reply_id', type: 'uuid', nullable: true })
  usefulReplyId: string | null;

  @Column({ name: 'references_metadata', type: 'jsonb', default: () => "'[]'" })
  referencesMetadata: Array<Record<string, unknown>>;

  @Column({
    name: 'attachments_metadata',
    type: 'jsonb',
    default: () => "'[]'",
  })
  attachmentsMetadata: Array<Record<string, unknown>>;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({
    name: 'last_activity_at',
    type: 'timestamp',
    default: () => 'now()',
  })
  lastActivityAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity('community_post_tags')
@Index('idx_community_post_tags_unique', ['postId', 'tagId'], { unique: true })
export class CommunityPostTag extends BaseEntity {
  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId: string;
}

@Entity('community_replies')
@Index('idx_community_replies_post_created', ['postId', 'createdAt'])
@Index('idx_community_replies_author_created', ['authorId', 'createdAt'])
@Index('idx_community_replies_status_created', [
  'moderationStatus',
  'createdAt',
])
export class CommunityReply extends BaseEntity {
  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'content_markdown', type: 'text' })
  contentMarkdown: string;

  @Column({
    name: 'moderation_status',
    type: 'varchar',
    length: 30,
    default: 'APPROVED',
  })
  moderationStatus: CommunityModerationStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ name: 'is_useful', type: 'boolean', default: false })
  isUseful: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity('community_resources')
@Index('idx_community_resources_slug', ['slug'], { unique: true })
@Index('idx_community_resources_kind_shared', ['kind', 'sharedAt'])
@Index('idx_community_resources_category_shared', ['categoryId', 'sharedAt'])
export class CommunityResource extends BaseEntity {
  @Column({ name: 'shared_by_id', type: 'uuid' })
  sharedById: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'varchar', length: 30 })
  kind: CommunityResourceKind;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'varchar', length: 250 })
  slug: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ name: 'source_name', type: 'varchar', length: 180 })
  sourceName: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  doi: string | null;

  @Column({ name: 'published_year', type: 'int', nullable: true })
  publishedYear: number | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  authors: string[];

  @Column({ name: 'clinical_use', type: 'text' })
  clinicalUse: string;

  @Column({
    name: 'moderation_status',
    type: 'varchar',
    length: 30,
    default: 'APPROVED',
  })
  moderationStatus: CommunityModerationStatus;

  @Column({ name: 'shared_at', type: 'timestamp', default: () => 'now()' })
  sharedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}

@Entity('community_resource_tags')
@Index('idx_community_resource_tags_unique', ['resourceId', 'tagId'], {
  unique: true,
})
export class CommunityResourceTag extends BaseEntity {
  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId: string;

  @Column({ name: 'tag_id', type: 'uuid' })
  tagId: string;
}

@Entity('community_reactions')
@Index(
  'idx_community_reactions_unique',
  ['targetType', 'targetId', 'userId', 'reactionType'],
  {
    unique: true,
  },
)
@Index('idx_community_reactions_target', ['targetType', 'targetId'])
export class CommunityReaction extends BaseEntity {
  @Column({ name: 'target_type', type: 'varchar', length: 30 })
  targetType: CommunityTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'reaction_type',
    type: 'varchar',
    length: 30,
    default: 'THANKS',
  })
  reactionType: string;
}

@Entity('community_bookmarks')
@Index('idx_community_bookmarks_unique', ['targetType', 'targetId', 'userId'], {
  unique: true,
})
export class CommunityBookmark extends BaseEntity {
  @Column({ name: 'target_type', type: 'varchar', length: 30 })
  targetType: CommunityTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;
}

@Entity('community_moderation_reports')
@Index('idx_community_reports_status_created', ['status', 'createdAt'])
@Index('idx_community_reports_target', ['targetType', 'targetId'])
export class CommunityModerationReport extends BaseEntity {
  @Column({ name: 'target_type', type: 'varchar', length: 30 })
  targetType: CommunityTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @Column({ name: 'reporter_id', type: 'uuid', nullable: true })
  reporterId: string | null;

  @Column({ type: 'varchar', length: 80 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'varchar', length: 30, default: 'OPEN' })
  status: CommunityReportStatus;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;

  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;
}

@Entity('community_notifications')
@Index('idx_community_notifications_user_read_created', [
  'userId',
  'readAt',
  'createdAt',
])
@Index('idx_community_notifications_type_created', ['type', 'createdAt'])
export class CommunityNotification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 60 })
  type: CommunityNotificationType;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'text', nullable: true })
  href: string | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;
}

@Entity('community_contributions')
@Index('idx_community_contributions_user_created', ['userId', 'createdAt'])
@Index('idx_community_contributions_source', ['sourceType', 'sourceId'])
export class CommunityContribution extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 60 })
  eventType: CommunityContributionEventType;

  @Column({ type: 'int' })
  points: number;

  @Column({ name: 'source_type', type: 'varchar', length: 30, nullable: true })
  sourceType: CommunityTargetType | null;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;
}

@Entity('community_badges')
@Index('idx_community_badges_slug', ['slug'], { unique: true })
export class CommunityBadge extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 140 })
  label: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    name: 'category_slug',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  categorySlug: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}

@Entity('community_profile_badges')
@Index('idx_community_profile_badges_unique', ['profileId', 'badgeId'], {
  unique: true,
})
export class CommunityProfileBadge extends BaseEntity {
  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ name: 'badge_id', type: 'uuid' })
  badgeId: string;

  @Column({ name: 'awarded_by_id', type: 'uuid', nullable: true })
  awardedById: string | null;

  @Column({ name: 'awarded_at', type: 'timestamp', default: () => 'now()' })
  awardedAt: Date;
}

@Entity('community_audit_logs')
@Index('idx_community_audit_logs_event_created', ['event', 'createdAt'])
@Index('idx_community_audit_logs_actor_created', ['actorUserId', 'createdAt'])
@Index('idx_community_audit_logs_target', ['targetType', 'targetId'])
export class CommunityAuditLog {
  @Column({ type: 'uuid', primary: true, default: () => 'uuid_generate_v4()' })
  id: string;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 40, nullable: true })
  actorRole: string | null;

  @Column({ type: 'varchar', length: 120 })
  event: string;

  @Column({ name: 'target_type', type: 'varchar', length: 40, nullable: true })
  targetType: string | null;

  @Column({ name: 'target_id', type: 'varchar', length: 120, nullable: true })
  targetId: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('community_sso_tokens')
@Index('idx_community_sso_tokens_hash', ['tokenHash'], { unique: true })
@Index('idx_community_sso_tokens_expires', ['expiresAt'])
export class CommunitySsoToken extends BaseEntity {
  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'return_to', type: 'text', nullable: true })
  returnTo: string | null;

  @Column({ name: 'device_context', type: 'jsonb', default: () => "'{}'" })
  deviceContext: Record<string, unknown>;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamp', nullable: true })
  consumedAt: Date | null;
}
