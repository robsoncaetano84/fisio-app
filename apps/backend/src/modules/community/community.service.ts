import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { createHash, createHmac, randomBytes } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import { IsNull, type FindOptionsWhere, Repository } from 'typeorm';
import { OpenAiService } from '../ai/openai.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { Usuario, UserRole } from '../usuarios/entities/usuario.entity';
import { CommunityCacheService } from './community-cache.service';
import {
  CommunityAiClassificationDto,
  CommunityClientLogDto,
  CommunityFeedQueryDto,
  CommunityModerationActionDto,
  CommunityProfilesQueryDto,
  CommunityResourceQueryDto,
  CommunitySearchQueryDto,
  CreateBookmarkDto,
  CreateCommunityPostDto,
  CreateCommunityReplyDto,
  CreateCommunityReportDto,
  CreateCommunityResourceDto,
  MarkUsefulReplyDto,
  PresignCommunityUploadDto,
  UpdateCommunityProfileDto,
  UpdateCommunityReportDto,
  UpdateCommunityUserRoleDto,
} from './dto/community.dto';
import {
  CommunityAuditLog,
  CommunityBadge,
  CommunityBookmark,
  CommunityCategory,
  CommunityContribution,
  CommunityModerationReport,
  CommunityNotification,
  CommunityPost,
  CommunityPostTag,
  CommunityProfile,
  CommunityReaction,
  CommunityReply,
  CommunityResource,
  CommunityResourceTag,
  CommunitySsoToken,
  CommunityTag,
} from './entities/community.entities';
import {
  COMMUNITY_CONTRIBUTION_LEVELS,
  COMMUNITY_CONTRIBUTION_RULES,
  type CommunityContributionEventType,
  type CommunityTargetType,
} from './community.types';

type CurrentActor = Pick<
  Usuario,
  'id' | 'nome' | 'email' | 'role' | 'especialidade'
>;

@Injectable()
export class CommunityService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly openAiService: OpenAiService,
    private readonly notificacoesService: NotificacoesService,
    private readonly cacheService: CommunityCacheService,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(CommunityProfile)
    private readonly profilesRepository: Repository<CommunityProfile>,
    @InjectRepository(CommunityCategory)
    private readonly categoriesRepository: Repository<CommunityCategory>,
    @InjectRepository(CommunityTag)
    private readonly tagsRepository: Repository<CommunityTag>,
    @InjectRepository(CommunityPost)
    private readonly postsRepository: Repository<CommunityPost>,
    @InjectRepository(CommunityPostTag)
    private readonly postTagsRepository: Repository<CommunityPostTag>,
    @InjectRepository(CommunityReply)
    private readonly repliesRepository: Repository<CommunityReply>,
    @InjectRepository(CommunityResource)
    private readonly resourcesRepository: Repository<CommunityResource>,
    @InjectRepository(CommunityResourceTag)
    private readonly resourceTagsRepository: Repository<CommunityResourceTag>,
    @InjectRepository(CommunityReaction)
    private readonly reactionsRepository: Repository<CommunityReaction>,
    @InjectRepository(CommunityBookmark)
    private readonly bookmarksRepository: Repository<CommunityBookmark>,
    @InjectRepository(CommunityModerationReport)
    private readonly reportsRepository: Repository<CommunityModerationReport>,
    @InjectRepository(CommunityNotification)
    private readonly notificationsRepository: Repository<CommunityNotification>,
    @InjectRepository(CommunityContribution)
    private readonly contributionsRepository: Repository<CommunityContribution>,
    @InjectRepository(CommunityBadge)
    private readonly badgesRepository: Repository<CommunityBadge>,
    @InjectRepository(CommunityAuditLog)
    private readonly auditLogsRepository: Repository<CommunityAuditLog>,
    @InjectRepository(CommunitySsoToken)
    private readonly ssoTokensRepository: Repository<CommunitySsoToken>,
  ) {}

  async getCategories(): Promise<CommunityCategory[]> {
    const cached = await this.cacheService.getJson<CommunityCategory[]>(
      'community:categories:v1',
    );
    if (cached) return cached;
    const categories = await this.categoriesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    await this.cacheService.setJson('community:categories:v1', categories, 300);
    return categories;
  }

  async getTags(): Promise<CommunityTag[]> {
    const cached =
      await this.cacheService.getJson<CommunityTag[]>('community:tags:v1');
    if (cached) return cached;
    const tags = await this.tagsRepository.find({
      order: { usageCount: 'DESC', name: 'ASC' },
    });
    await this.cacheService.setJson('community:tags:v1', tags, 120);
    return tags;
  }

  async getTag(slug: string): Promise<CommunityTag> {
    const tag = await this.tagsRepository.findOne({ where: { slug } });
    if (!tag) throw new NotFoundException('Tag nao encontrada');
    return tag;
  }

  async getFeed(query: CommunityFeedQueryDto) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const builder = this.postsRepository
      .createQueryBuilder('post')
      .where('post.moderation_status = :status', { status: 'APPROVED' })
      .andWhere('post.deleted_at IS NULL');

    if (query.category) {
      builder.innerJoin(
        CommunityCategory,
        'category_filter',
        'category_filter.id = post.category_id AND category_filter.slug = :category',
        { category: query.category },
      );
    }

    if (query.tag) {
      builder
        .innerJoin(
          CommunityPostTag,
          'post_tag_filter',
          'post_tag_filter.post_id = post.id',
        )
        .innerJoin(
          CommunityTag,
          'tag_filter',
          'tag_filter.id = post_tag_filter.tag_id AND tag_filter.slug = :tag',
          { tag: query.tag },
        );
    }

    if (query.q?.trim()) {
      builder.andWhere(
        "to_tsvector('portuguese', coalesce(post.title, '') || ' ' || coalesce(post.content_markdown, '')) @@ plainto_tsquery('portuguese', :q)",
        { q: query.q.trim() },
      );
    }

    if (query.sort === 'unanswered') {
      builder.andWhere('post.replies_count = 0');
    }

    if (query.sort === 'relevant') {
      builder.orderBy(
        '(post.score * 2 + post.replies_count * 3 + post.views_count * 0.05)',
        'DESC',
      );
    } else {
      builder.orderBy('post.last_activity_at', 'DESC');
    }

    const [items, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await this.hydratePosts(items),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createPost(actor: CurrentActor, dto: CreateCommunityPostDto) {
    this.assertCommunityUser(actor);
    this.assertSafeContent(`${dto.title}\n${dto.contentMarkdown}`);
    const profile = await this.ensureProfile(actor);
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId, isActive: true },
    });
    if (!category) throw new BadRequestException('Categoria invalida');

    const post = await this.postsRepository.save(
      this.postsRepository.create({
        authorId: profile.id,
        categoryId: category.id,
        title: dto.title.trim(),
        slug: await this.createUniqueSlug(this.postsRepository, dto.title),
        excerpt: this.buildExcerpt(dto.contentMarkdown),
        contentMarkdown: dto.contentMarkdown.trim(),
        moderationStatus: 'APPROVED',
        publishedAt: new Date(),
        lastActivityAt: new Date(),
        deletedAt: null,
        referencesMetadata: dto.references || [],
        attachmentsMetadata: dto.attachmentsMetadata || [],
      }),
    );

    await this.attachTagsToPost(post.id, dto.tags || []);
    await this.cacheService.deleteByPrefix('community:tags');
    await this.cacheService.deleteByPrefix('community:feed');
    await this.awardContribution(actor.id, 'CREATE_POST', 'post', post.id);
    await this.recordAudit(actor, 'community.post.created', 'post', post.id);
    return {
      postId: post.id,
      slug: post.slug,
      moderationStatus: post.moderationStatus,
    };
  }

  async getPost(slug: string) {
    const post = await this.postsRepository.findOne({
      where: { slug, moderationStatus: 'APPROVED', deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Discussao nao encontrada');

    await this.postsRepository.increment({ id: post.id }, 'viewsCount', 1);
    post.viewsCount += 1;

    const replies = await this.repliesRepository.find({
      where: {
        postId: post.id,
        moderationStatus: 'APPROVED',
        deletedAt: IsNull(),
      },
      order: { isUseful: 'DESC', score: 'DESC', createdAt: 'ASC' },
    });

    return {
      ...(await this.hydratePost(post)),
      replies: await this.hydrateReplies(replies),
    };
  }

  async createReply(
    actor: CurrentActor,
    postId: string,
    dto: CreateCommunityReplyDto,
  ) {
    this.assertCommunityUser(actor);
    const post = await this.postsRepository.findOne({
      where: { id: postId, moderationStatus: 'APPROVED', deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Discussao nao encontrada');

    return this.createReplyForPost(actor, post, dto);
  }

  async createReplyByPostSlug(
    actor: CurrentActor,
    slug: string,
    dto: CreateCommunityReplyDto,
  ) {
    this.assertCommunityUser(actor);
    const post = await this.postsRepository.findOne({
      where: { slug, moderationStatus: 'APPROVED', deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Discussao nao encontrada');

    return this.createReplyForPost(actor, post, dto);
  }

  private async createReplyForPost(
    actor: CurrentActor,
    post: CommunityPost,
    dto: CreateCommunityReplyDto,
  ) {
    if (!dto.ethicsAccepted) {
      throw new BadRequestException(
        'Confirme as regras eticas antes de responder',
      );
    }
    this.assertSafeContent(dto.contentMarkdown);
    const profile = await this.ensureProfile(actor);
    const reply = await this.repliesRepository.save(
      this.repliesRepository.create({
        postId: post.id,
        authorId: profile.id,
        contentMarkdown: dto.contentMarkdown.trim(),
        moderationStatus: 'APPROVED',
        deletedAt: null,
      }),
    );

    await this.postsRepository.update(post.id, {
      repliesCount: post.repliesCount + 1,
      lastActivityAt: new Date(),
    });
    await this.awardContribution(
      actor.id,
      'ANSWER_QUESTION',
      'reply',
      reply.id,
    );
    await this.notifyProfile(post.authorId, {
      type: 'REPLY',
      title: 'Nova resposta na sua discussao',
      body: post.title,
      href: `/discussoes/${post.slug}`,
    });
    await this.recordAudit(actor, 'community.reply.created', 'reply', reply.id);
    return { replyId: reply.id, moderationStatus: reply.moderationStatus };
  }

  async markUsefulReply(
    actor: CurrentActor,
    postId: string,
    dto: MarkUsefulReplyDto,
  ) {
    this.assertCommunityUser(actor);
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Discussao nao encontrada');
    const authorProfile = await this.profilesRepository.findOne({
      where: { id: post.authorId },
    });
    if (actor.role !== UserRole.ADMIN && authorProfile?.userId !== actor.id) {
      throw new ForbiddenException(
        'Apenas o autor ou admin pode marcar resposta util',
      );
    }
    const reply = await this.repliesRepository.findOne({
      where: { id: dto.replyId, postId },
    });
    if (!reply) throw new NotFoundException('Resposta nao encontrada');

    await this.repliesRepository.update({ postId }, { isUseful: false });
    await this.repliesRepository.update(reply.id, {
      isUseful: true,
      score: reply.score + 5,
    });
    await this.postsRepository.update(post.id, {
      usefulReplyId: reply.id,
      score: post.score + 5,
      lastActivityAt: new Date(),
    });

    const replyProfile = await this.profilesRepository.findOne({
      where: { id: reply.authorId },
    });
    if (replyProfile) {
      await this.awardContribution(
        replyProfile.userId,
        'USEFUL_ANSWER',
        'reply',
        reply.id,
      );
      await this.profilesRepository.increment(
        { id: replyProfile.id },
        'usefulAnswerCount',
        1,
      );
      await this.notifyProfile(replyProfile.id, {
        type: 'USEFUL_REPLY',
        title: 'Sua resposta foi marcada como util',
        body: post.title,
        href: `/discussoes/${post.slug}`,
      });
    }
    await this.recordAudit(
      actor,
      'community.reply.marked_useful',
      'reply',
      reply.id,
    );
    return {
      postId: post.id,
      usefulReplyId: reply.id,
      contributionAwarded: true,
    };
  }

  async getResources(query: CommunityResourceQueryDto) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const builder = this.resourcesRepository
      .createQueryBuilder('resource')
      .where('resource.moderation_status = :status', { status: 'APPROVED' })
      .andWhere('resource.deleted_at IS NULL');

    if (query.kind)
      builder.andWhere('resource.kind = :kind', { kind: query.kind });
    if (query.q?.trim()) {
      builder.andWhere(
        "to_tsvector('portuguese', coalesce(resource.title, '') || ' ' || coalesce(resource.summary, '') || ' ' || coalesce(resource.clinical_use, '')) @@ plainto_tsquery('portuguese', :q)",
        { q: query.q.trim() },
      );
    }
    if (query.tag) {
      builder
        .innerJoin(
          CommunityResourceTag,
          'resource_tag_filter',
          'resource_tag_filter.resource_id = resource.id',
        )
        .innerJoin(
          CommunityTag,
          'tag_filter',
          'tag_filter.id = resource_tag_filter.tag_id AND tag_filter.slug = :tag',
          { tag: query.tag },
        );
    }

    const [items, total] = await builder
      .orderBy('resource.shared_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await this.hydrateResources(items),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createResource(actor: CurrentActor, dto: CreateCommunityResourceDto) {
    this.assertCommunityUser(actor);
    this.assertSafeContent(`${dto.title}\n${dto.summary}\n${dto.clinicalUse}`);
    const profile = await this.ensureProfile(actor);
    const resource = await this.resourcesRepository.save(
      this.resourcesRepository.create({
        sharedById: profile.id,
        categoryId: dto.categoryId || null,
        kind: dto.kind,
        title: dto.title.trim(),
        slug: await this.createUniqueSlug(this.resourcesRepository, dto.title),
        summary: dto.summary.trim(),
        sourceName: dto.sourceName.trim(),
        sourceUrl: dto.sourceUrl?.trim() || null,
        doi: dto.doi?.trim() || null,
        publishedYear: dto.publishedYear || null,
        authors: dto.authors || [],
        clinicalUse: dto.clinicalUse.trim(),
        moderationStatus: 'APPROVED',
        sharedAt: new Date(),
        deletedAt: null,
      }),
    );
    await this.attachTagsToResource(resource.id, dto.tags || []);
    await this.cacheService.deleteByPrefix('community:tags');
    await this.awardContribution(
      actor.id,
      dto.kind === 'article' ? 'SHARE_ARTICLE' : 'SHARE_REFERENCE',
      'resource',
      resource.id,
    );
    await this.recordAudit(
      actor,
      'community.resource.created',
      'resource',
      resource.id,
    );
    return {
      resourceId: resource.id,
      slug: resource.slug,
      moderationStatus: resource.moderationStatus,
    };
  }

  async getResource(slug: string) {
    const resource = await this.resourcesRepository.findOne({
      where: { slug, moderationStatus: 'APPROVED', deletedAt: IsNull() },
    });
    if (!resource) throw new NotFoundException('Recurso nao encontrado');
    return this.hydrateResource(resource);
  }

  async getProfiles(query: CommunityProfilesQueryDto) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const builder = this.profilesRepository.createQueryBuilder('profile');
    if (query.specialty) {
      builder.andWhere('lower(profile.specialty) = lower(:specialty)', {
        specialty: query.specialty,
      });
    }
    if (query.q?.trim()) {
      builder.andWhere(
        "to_tsvector('portuguese', coalesce(profile.display_name, '') || ' ' || coalesce(profile.bio, '') || ' ' || coalesce(profile.specialty, '')) @@ plainto_tsquery('portuguese', :q)",
        { q: query.q.trim() },
      );
    }
    if (query.sort === 'name') builder.orderBy('profile.display_name', 'ASC');
    else if (query.sort === 'useful')
      builder.orderBy('profile.useful_answer_count', 'DESC');
    else builder.orderBy('profile.contribution_count', 'DESC');

    const [items, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await Promise.all(
        items.map((profile) => this.hydrateProfile(profile)),
      ),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      specialties: await this.getProfileDistinctValues('specialty'),
      areas: [],
    };
  }

  async getProfile(username: string) {
    const profile = await this.profilesRepository.findOne({
      where: isUUID(username)
        ? [{ username }, { id: username }]
        : [{ username }],
    });
    if (!profile) throw new NotFoundException('Perfil nao encontrado');
    return this.hydrateProfile(profile);
  }

  async getMyProfile(actor: CurrentActor) {
    this.assertCommunityUser(actor);
    const profile = await this.ensureProfile(actor);
    return this.hydrateProfile(profile);
  }

  async updateMyProfile(actor: CurrentActor, dto: UpdateCommunityProfileDto) {
    this.assertCommunityUser(actor);
    if (dto.bio) this.assertSafeContent(dto.bio);
    const profile = await this.ensureProfile(actor);
    profile.displayName = dto.displayName?.trim() || profile.displayName;
    profile.profession = dto.profession?.trim() || profile.profession;
    profile.specialty = dto.specialty?.trim() || profile.specialty;
    profile.bio = dto.bio?.trim() ?? profile.bio;
    profile.avatarUrl = dto.avatarUrl?.trim() || profile.avatarUrl;
    profile.cityState = dto.cityState?.trim() || profile.cityState;
    if (dto.areasOfPractice) {
      profile.areasOfPractice = Array.from(
        new Set(dto.areasOfPractice.map((area) => area.trim()).filter(Boolean)),
      ).slice(0, 12);
    }
    await this.profilesRepository.save(profile);
    await this.recordAudit(
      actor,
      'community.profile.updated',
      'profile',
      profile.id,
    );
    return this.hydrateProfile(profile);
  }

  async getBookmarks(actor: CurrentActor) {
    this.assertCommunityUser(actor);
    const bookmarks = await this.bookmarksRepository.find({
      where: { userId: actor.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const items = await Promise.all(
      bookmarks.map((bookmark) => this.hydrateBookmark(bookmark)),
    );
    return items.filter(Boolean);
  }

  async createBookmark(actor: CurrentActor, dto: CreateBookmarkDto) {
    this.assertCommunityUser(actor);
    const existing = await this.bookmarksRepository.findOne({
      where: {
        userId: actor.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
      },
    });
    if (existing) return { bookmarkId: existing.id };
    const bookmark = await this.bookmarksRepository.save(
      this.bookmarksRepository.create({
        userId: actor.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
      }),
    );
    return { bookmarkId: bookmark.id };
  }

  async removeBookmark(
    actor: CurrentActor,
    targetType: CommunityTargetType,
    targetId: string,
  ) {
    this.assertCommunityUser(actor);
    await this.bookmarksRepository.delete({
      userId: actor.id,
      targetType,
      targetId,
    });
    return { success: true };
  }

  async react(
    actor: CurrentActor,
    targetType: CommunityTargetType,
    targetId: string,
  ) {
    this.assertCommunityUser(actor);
    const existing = await this.reactionsRepository.findOne({
      where: { userId: actor.id, targetType, targetId, reactionType: 'THANKS' },
    });
    if (existing) return { reactionId: existing.id, created: false };
    const reaction = await this.reactionsRepository.save(
      this.reactionsRepository.create({
        userId: actor.id,
        targetType,
        targetId,
        reactionType: 'THANKS',
      }),
    );
    await this.awardReactionContribution(targetType, targetId);
    return { reactionId: reaction.id, created: true };
  }

  async createReport(actor: CurrentActor, dto: CreateCommunityReportDto) {
    this.assertCommunityUser(actor);
    const report = await this.reportsRepository.save(
      this.reportsRepository.create({
        reporterId: actor.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason.trim(),
        details: dto.details?.trim() || null,
        status: 'OPEN',
      }),
    );
    await this.recordAudit(
      actor,
      'community.moderation.report_created',
      dto.targetType,
      dto.targetId,
    );
    return { reportId: report.id, status: report.status };
  }

  async listReports() {
    const reports = await this.reportsRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return Promise.all(reports.map((report) => this.hydrateReport(report)));
  }

  async updateReport(
    actor: CurrentActor,
    reportId: string,
    dto: UpdateCommunityReportDto,
  ) {
    this.assertModerator(actor);
    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Denuncia nao encontrada');
    report.status = dto.status;
    report.resolutionNote = dto.resolutionNote?.trim() || null;
    report.reviewedById = actor.id;
    report.reviewedAt = new Date();
    await this.reportsRepository.save(report);
    await this.recordAudit(
      actor,
      'community.moderation.report_updated',
      'report',
      report.id,
    );
    return { reportId: report.id, status: report.status };
  }

  async moderateContent(
    actor: CurrentActor,
    dto: CommunityModerationActionDto,
  ) {
    this.assertModerator(actor);
    const moderationStatus = dto.action === 'HIDE' ? 'HIDDEN' : 'APPROVED';
    let previousStatus: string | null = null;
    let targetAuthorProfileId: string | null = null;

    if (dto.targetType === 'post') {
      const post = await this.postsRepository.findOne({
        where: { id: dto.targetId },
      });
      if (!post) throw new NotFoundException('Discussao nao encontrada');
      previousStatus = post.moderationStatus;
      targetAuthorProfileId = post.authorId;
      post.moderationStatus = moderationStatus;
      if (dto.action === 'RESTORE') post.deletedAt = null;
      await this.postsRepository.save(post);
    }

    if (dto.targetType === 'reply') {
      const reply = await this.repliesRepository.findOne({
        where: { id: dto.targetId },
      });
      if (!reply) throw new NotFoundException('Resposta nao encontrada');
      previousStatus = reply.moderationStatus;
      targetAuthorProfileId = reply.authorId;
      reply.moderationStatus = moderationStatus;
      if (dto.action === 'RESTORE') reply.deletedAt = null;
      await this.repliesRepository.save(reply);
    }

    if (dto.targetType === 'resource') {
      const resource = await this.resourcesRepository.findOne({
        where: { id: dto.targetId },
      });
      if (!resource) throw new NotFoundException('Recurso nao encontrado');
      previousStatus = resource.moderationStatus;
      targetAuthorProfileId = resource.sharedById;
      resource.moderationStatus = moderationStatus;
      if (dto.action === 'RESTORE') resource.deletedAt = null;
      await this.resourcesRepository.save(resource);
    }

    if (dto.action === 'HIDE' && previousStatus !== 'HIDDEN') {
      await this.penalizeProfile(
        targetAuthorProfileId,
        dto.reason?.toLowerCase().includes('spam')
          ? 'SPAM'
          : 'INAPPROPRIATE_CONTENT',
        dto.targetType,
        dto.targetId,
      );
    }

    await this.recordAudit(
      actor,
      'community.moderation.content_status_changed',
      dto.targetType,
      dto.targetId,
      {
        action: dto.action,
        status: moderationStatus,
        previousStatus,
        reason: dto.reason || null,
      },
    );
    return {
      targetType: dto.targetType,
      targetId: dto.targetId,
      moderationStatus,
    };
  }

  async getNotifications(actor: CurrentActor) {
    this.assertCommunityUser(actor);
    return this.notificationsRepository.find({
      where: { userId: actor.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markNotificationRead(actor: CurrentActor, notificationId: string) {
    this.assertCommunityUser(actor);
    await this.notificationsRepository.update(
      { id: notificationId, userId: actor.id },
      { readAt: new Date() },
    );
    return { success: true };
  }

  async markAllNotificationsRead(actor: CurrentActor) {
    this.assertCommunityUser(actor);
    await this.notificationsRepository.update(
      { userId: actor.id, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { success: true };
  }

  async getContributorHighlights() {
    const top = await this.profilesRepository.find({
      order: { contributionCount: 'DESC', usefulAnswerCount: 'DESC' },
      take: 6,
    });
    const hydrated = await Promise.all(
      top.map((profile) => this.hydrateProfile(profile)),
    );
    return {
      weekly: hydrated.slice(0, 2),
      monthly: hydrated.slice(0, 2),
      byCategory: hydrated.slice(0, 6),
      levels: COMMUNITY_CONTRIBUTION_LEVELS,
    };
  }

  async getContributionRules() {
    const cached = await this.cacheService.getJson<{
      version: string;
      rules: typeof COMMUNITY_CONTRIBUTION_RULES;
      levels: typeof COMMUNITY_CONTRIBUTION_LEVELS;
    }>('community:contribution-rules:v1');
    if (cached) return cached;
    const rules = {
      version: '2026-05-25.reputation.v1',
      rules: COMMUNITY_CONTRIBUTION_RULES,
      levels: COMMUNITY_CONTRIBUTION_LEVELS,
    };
    await this.cacheService.setJson(
      'community:contribution-rules:v1',
      rules,
      3600,
    );
    return rules;
  }

  async getMyContributions(actor: CurrentActor) {
    const profile = await this.ensureProfile(actor);
    const events = await this.contributionsRepository.find({
      where: { userId: actor.id },
      order: { createdAt: 'DESC' },
      take: 30,
    });
    return {
      score: profile.reputationScore,
      currentLevel: this.resolveLevel(profile.reputationScore),
      nextLevel: COMMUNITY_CONTRIBUTION_LEVELS.find(
        (level) => level.minScore > profile.reputationScore,
      ),
      recentEvents: events,
    };
  }

  async search(query: CommunitySearchQueryDto) {
    const feed = await this.getFeed({
      q: query.q,
      limit: 8,
      page: 1,
      sort: 'relevant',
    });
    const resources = await this.getResources({
      q: query.q,
      limit: 8,
      page: 1,
    });
    const profiles = await this.getProfiles({ q: query.q, limit: 8, page: 1 });
    return {
      query: query.q,
      discussions: feed.items,
      resources: resources.items,
      profiles: profiles.items,
      total: feed.total + resources.total + profiles.total,
    };
  }

  async adminOverview() {
    const [posts, replies, resources, reports, notifications] =
      await Promise.all([
        this.postsRepository.count(),
        this.repliesRepository.count(),
        this.resourcesRepository.count(),
        this.reportsRepository.count({ where: { status: 'OPEN' } }),
        this.notificationsRepository.count(),
      ]);
    return {
      metrics: {
        posts,
        replies,
        resources,
        openReports: reports,
        notifications,
      },
    };
  }

  async auditLogs() {
    return this.auditLogsRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async updateUserRole(
    actor: CurrentActor,
    userId: string,
    dto: UpdateCommunityUserRoleDto,
  ) {
    const nextRole = dto.role as UserRole;
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso permitido apenas a administradores');
    }
    if (actor.id === userId && nextRole !== UserRole.ADMIN) {
      throw new BadRequestException(
        'Um administrador nao pode remover o proprio acesso administrativo',
      );
    }
    const usuario = await this.usuariosRepository.findOne({
      where: { id: userId },
    });
    if (!usuario) throw new NotFoundException('Usuario nao encontrado');
    const previousRole = usuario.role;
    usuario.role = nextRole;
    await this.usuariosRepository.save(usuario);
    await this.recordAudit(
      actor,
      'community.admin.user_role_updated',
      'user',
      userId,
      { previousRole, nextRole: dto.role },
    );
    return {
      userId,
      previousRole,
      role: usuario.role,
    };
  }

  async logClientError(dto: CommunityClientLogDto) {
    await this.recordAudit(null, dto.event, 'client', dto.path || null, {
      message: dto.message || null,
      metadata: dto.metadata || {},
    });
    return { success: true };
  }

  async logCspReport(dto: Record<string, unknown>) {
    await this.recordAudit(
      null,
      'community.security.csp_report',
      'security',
      null,
      {
        report: dto,
      },
    );
    return { success: true };
  }

  async health() {
    return {
      status: 'ok',
      dependencies: {
        postgres: 'operational',
        redis: await this.cacheService.status(),
        s3: this.hasS3Config() ? 'configured' : 'not_configured',
        openai: this.openAiService.isConfigured()
          ? 'configured'
          : 'not_configured',
      },
      version: '0.1.0-etapa-27',
      timestamp: new Date().toISOString(),
    };
  }

  presignUpload(actor: CurrentActor, dto: PresignCommunityUploadDto) {
    this.assertCommunityUser(actor);
    this.assertAllowedUploadType(dto.contentType);
    if (!this.hasS3Config()) {
      throw new ServiceUnavailableException('Storage S3 nao configurado');
    }

    const bucket = this.requiredEnv('COMMUNITY_S3_BUCKET');
    const region =
      this.configService.get<string>('COMMUNITY_S3_REGION') || 'us-east-1';
    const accessKey = this.requiredEnv('COMMUNITY_S3_ACCESS_KEY_ID');
    const secretKey = this.requiredEnv('COMMUNITY_S3_SECRET_ACCESS_KEY');
    const endpoint =
      this.configService.get<string>('COMMUNITY_S3_ENDPOINT') ||
      `https://${bucket}.s3.${region}.amazonaws.com`;
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storageKey = `community/${actor.id}/${Date.now()}-${safeName}`;
    const expiresSeconds = 300;
    const uploadUrl = this.createS3PresignedPutUrl({
      accessKey,
      secretKey,
      region,
      endpoint,
      bucket,
      key: storageKey,
      contentType: dto.contentType,
      expiresSeconds,
    });
    return {
      uploadUrl,
      storageKey,
      publicUrl: this.resolveUploadPublicUrl(endpoint, storageKey),
      expiresAt: new Date(Date.now() + expiresSeconds * 1000).toISOString(),
      headers: { 'Content-Type': dto.contentType },
    };
  }

  async classifyWithAi(actor: CurrentActor, dto: CommunityAiClassificationDto) {
    this.assertCommunityUser(actor);
    const model = this.openAiService.resolveModel(
      ['COMMUNITY_AI_MODEL', 'OPENAI_MODEL'],
      'gpt-4.1-mini',
    );
    const response = await this.openAiService.createJsonResponse({
      model,
      operation: 'community.content.classification',
      timeoutMs: this.openAiService.getPositiveIntegerEnv(
        'COMMUNITY_AI_TIMEOUT_MS',
        15000,
        60000,
      ),
      temperature: 0.1,
      systemPrompt:
        'Voce classifica conteudo de uma comunidade profissional de saude. Responda apenas JSON com categorySlug, tags, privacyRiskLevel e reasoning. Nao gere diagnostico.',
      userContent: `Titulo: ${dto.title}\n\nConteudo:\n${dto.contentMarkdown}`,
    });
    await this.recordAudit(
      actor,
      'community.ai.classification_requested',
      'ai',
      null,
      {
        model,
        configured: Boolean(response),
      },
    );
    return (
      response?.parsed || {
        categorySlug: null,
        tags: [],
        privacyRiskLevel: 'unknown',
        reasoning: 'IA nao configurada ou indisponivel.',
      }
    );
  }

  private async hydratePosts(posts: CommunityPost[]) {
    return Promise.all(posts.map((post) => this.hydratePost(post)));
  }

  private async hydratePost(post: CommunityPost) {
    const [category, authorProfile, tags, thanksCount] = await Promise.all([
      this.categoriesRepository.findOne({ where: { id: post.categoryId } }),
      this.profilesRepository.findOne({ where: { id: post.authorId } }),
      this.getTagsForPost(post.id),
      this.countThanks('post', post.id),
    ]);
    return { ...post, category, authorProfile, tags, thanksCount };
  }

  private async hydrateReplies(replies: CommunityReply[]) {
    return Promise.all(
      replies.map(async (reply) => {
        const [authorProfile, thanksCount] = await Promise.all([
          this.profilesRepository.findOne({
            where: { id: reply.authorId },
          }),
          this.countThanks('reply', reply.id),
        ]);
        return { ...reply, authorProfile, thanksCount };
      }),
    );
  }

  private async hydrateResources(resources: CommunityResource[]) {
    return Promise.all(
      resources.map((resource) => this.hydrateResource(resource)),
    );
  }

  private async hydrateResource(resource: CommunityResource) {
    const [category, sharedBy, tags, thanksCount] = await Promise.all([
      resource.categoryId
        ? this.categoriesRepository.findOne({
            where: { id: resource.categoryId },
          })
        : null,
      this.profilesRepository.findOne({ where: { id: resource.sharedById } }),
      this.getTagsForResource(resource.id),
      this.countThanks('resource', resource.id),
    ]);
    return { ...resource, category, sharedBy, tags, thanksCount };
  }

  private async hydrateBookmark(bookmark: CommunityBookmark) {
    if (bookmark.targetType === 'post') {
      const post = await this.postsRepository.findOne({
        where: {
          id: bookmark.targetId,
          moderationStatus: 'APPROVED',
          deletedAt: IsNull(),
        },
      });
      if (!post) return null;
      return {
        id: bookmark.id,
        targetType: bookmark.targetType,
        targetId: bookmark.targetId,
        type: 'post',
        title: post.title,
        href: `/discussoes/${post.slug}`,
        summary: post.excerpt,
        savedAt: bookmark.createdAt,
      };
    }

    if (bookmark.targetType === 'resource') {
      const resource = await this.resourcesRepository.findOne({
        where: {
          id: bookmark.targetId,
          moderationStatus: 'APPROVED',
          deletedAt: IsNull(),
        },
      });
      if (!resource) return null;
      return {
        id: bookmark.id,
        targetType: bookmark.targetType,
        targetId: bookmark.targetId,
        type: resource.kind,
        title: resource.title,
        href: `/${resource.kind === 'article' ? 'artigos' : 'referencias'}/${
          resource.slug
        }`,
        summary: resource.summary,
        savedAt: bookmark.createdAt,
      };
    }

    if (bookmark.targetType === 'profile') {
      const profile = await this.profilesRepository.findOne({
        where: { id: bookmark.targetId },
      });
      if (!profile) return null;
      return {
        id: bookmark.id,
        targetType: bookmark.targetType,
        targetId: bookmark.targetId,
        type: 'profile',
        title: profile.displayName,
        href: `/perfil/${profile.username}`,
        summary: profile.bio,
        savedAt: bookmark.createdAt,
      };
    }

    if (bookmark.targetType === 'reply') {
      const reply = await this.repliesRepository.findOne({
        where: {
          id: bookmark.targetId,
          moderationStatus: 'APPROVED',
          deletedAt: IsNull(),
        },
      });
      if (!reply) return null;
      const post = await this.postsRepository.findOne({
        where: { id: reply.postId },
      });
      return {
        id: bookmark.id,
        targetType: bookmark.targetType,
        targetId: bookmark.targetId,
        type: 'reply',
        title: post?.title || 'Resposta salva',
        href: post ? `/discussoes/${post.slug}` : '/salvos',
        summary: this.buildExcerpt(reply.contentMarkdown),
        savedAt: bookmark.createdAt,
      };
    }

    return null;
  }

  private async hydrateReport(report: CommunityModerationReport) {
    const target = await this.resolveTargetSummary(
      report.targetType,
      report.targetId,
    );
    return {
      ...report,
      targetTitle: target.title,
      targetHref: target.href,
      reporterProfile: report.reporterId
        ? await this.profilesRepository.findOne({
            where: { userId: report.reporterId },
          })
        : null,
    };
  }

  private async resolveTargetSummary(
    targetType: CommunityTargetType,
    targetId: string,
  ) {
    if (targetType === 'post') {
      const post = await this.postsRepository.findOne({
        where: { id: targetId },
      });
      return {
        title: post?.title || 'Discussao nao encontrada',
        href: post ? `/discussoes/${post.slug}` : '/moderacao',
      };
    }
    if (targetType === 'resource') {
      const resource = await this.resourcesRepository.findOne({
        where: { id: targetId },
      });
      return {
        title: resource?.title || 'Recurso nao encontrado',
        href: resource
          ? `/${resource.kind === 'article' ? 'artigos' : 'referencias'}/${
              resource.slug
            }`
          : '/moderacao',
      };
    }
    if (targetType === 'profile') {
      const profile = await this.profilesRepository.findOne({
        where: { id: targetId },
      });
      return {
        title: profile?.displayName || 'Perfil nao encontrado',
        href: profile ? `/perfil/${profile.username}` : '/moderacao',
      };
    }
    const reply = await this.repliesRepository.findOne({
      where: { id: targetId },
    });
    const post = reply
      ? await this.postsRepository.findOne({ where: { id: reply.postId } })
      : null;
    return {
      title: post?.title || 'Resposta nao encontrada',
      href: post ? `/discussoes/${post.slug}` : '/moderacao',
    };
  }

  private async hydrateProfile(profile: CommunityProfile) {
    const profileBadges = await this.badgesRepository
      .createQueryBuilder('badge')
      .innerJoin(CommunityBadge, 'badge_self', 'badge_self.id = badge.id')
      .where(
        `badge.id IN (
          SELECT profile_badge.badge_id
          FROM community_profile_badges profile_badge
          WHERE profile_badge.profile_id = :profileId
        )`,
        { profileId: profile.id },
      )
      .getMany();
    return {
      ...profile,
      badges: profileBadges,
      level: this.resolveLevel(profile.reputationScore),
    };
  }

  private async getTagsForPost(postId: string) {
    return this.tagsRepository
      .createQueryBuilder('tag')
      .innerJoin(CommunityPostTag, 'post_tag', 'post_tag.tag_id = tag.id')
      .where('post_tag.post_id = :postId', { postId })
      .orderBy('tag.name', 'ASC')
      .getMany();
  }

  private async getTagsForResource(resourceId: string) {
    return this.tagsRepository
      .createQueryBuilder('tag')
      .innerJoin(
        CommunityResourceTag,
        'resource_tag',
        'resource_tag.tag_id = tag.id',
      )
      .where('resource_tag.resource_id = :resourceId', { resourceId })
      .orderBy('tag.name', 'ASC')
      .getMany();
  }

  private countThanks(targetType: CommunityTargetType, targetId: string) {
    return this.reactionsRepository.count({
      where: { targetType, targetId, reactionType: 'THANKS' },
    });
  }

  private async attachTagsToPost(postId: string, tagNames: string[]) {
    const tags = await this.resolveTags(tagNames);
    await this.postTagsRepository.save(
      tags.map((tag) =>
        this.postTagsRepository.create({ postId, tagId: tag.id }),
      ),
    );
  }

  private async attachTagsToResource(resourceId: string, tagNames: string[]) {
    const tags = await this.resolveTags(tagNames);
    await this.resourceTagsRepository.save(
      tags.map((tag) =>
        this.resourceTagsRepository.create({ resourceId, tagId: tag.id }),
      ),
    );
  }

  private async resolveTags(tagNames: string[]): Promise<CommunityTag[]> {
    const uniqueSlugs = Array.from(
      new Set(tagNames.map((tag) => this.slugify(tag)).filter(Boolean)),
    ).slice(0, 8);
    const result: CommunityTag[] = [];
    for (const slug of uniqueSlugs) {
      let tag = await this.tagsRepository.findOne({ where: { slug } });
      if (!tag) {
        tag = await this.tagsRepository.save(
          this.tagsRepository.create({
            slug,
            name: this.titleFromSlug(slug),
            description: null,
            usageCount: 0,
          }),
        );
      }
      await this.tagsRepository.increment({ id: tag.id }, 'usageCount', 1);
      result.push(tag);
    }
    return result;
  }

  private async ensureProfile(actor: CurrentActor): Promise<CommunityProfile> {
    const existing = await this.profilesRepository.findOne({
      where: { userId: actor.id },
    });
    if (existing) return existing;
    return this.profilesRepository.save(
      this.profilesRepository.create({
        userId: actor.id,
        username: await this.createUniqueUsername(actor.nome || actor.email),
        displayName: actor.nome,
        profession:
          actor.role === UserRole.PACIENTE ? 'Paciente' : 'Fisioterapia',
        specialty: actor.especialidade || null,
        bio: null,
        avatarUrl: null,
        cityState: null,
        areasOfPractice: actor.especialidade ? [actor.especialidade] : [],
      }),
    );
  }

  private async awardReactionContribution(
    targetType: CommunityTargetType,
    targetId: string,
  ) {
    let profileId: string | null = null;
    if (targetType === 'post') {
      profileId =
        (await this.postsRepository.findOne({ where: { id: targetId } }))
          ?.authorId || null;
    }
    if (targetType === 'reply') {
      profileId =
        (await this.repliesRepository.findOne({ where: { id: targetId } }))
          ?.authorId || null;
    }
    if (!profileId) return;
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId },
    });
    if (profile)
      await this.awardContribution(
        profile.userId,
        'THANKS',
        targetType,
        targetId,
      );
  }

  private async awardContribution(
    userId: string,
    eventType: CommunityContributionEventType,
    sourceType: CommunityTargetType | null,
    sourceId: string | null,
  ) {
    const points = COMMUNITY_CONTRIBUTION_RULES[eventType];
    await this.contributionsRepository.save(
      this.contributionsRepository.create({
        userId,
        eventType,
        points,
        sourceType,
        sourceId,
        metadata: {},
      }),
    );
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });
    if (!profile) return;
    profile.reputationScore += points;
    profile.contributionCount += points > 0 ? 1 : 0;
    if (eventType === 'SHARE_ARTICLE') profile.sharedArticleCount += 1;
    if (eventType === 'SHARE_REFERENCE') profile.recommendedReferenceCount += 1;
    await this.profilesRepository.save(profile);
  }

  private async penalizeProfile(
    profileId: string | null,
    eventType: Extract<
      CommunityContributionEventType,
      'INAPPROPRIATE_CONTENT' | 'SPAM'
    >,
    sourceType: CommunityTargetType,
    sourceId: string,
  ) {
    if (!profileId) return;
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId },
    });
    if (!profile) return;
    await this.awardContribution(
      profile.userId,
      eventType,
      sourceType,
      sourceId,
    );
  }

  private async notifyProfile(
    profileId: string,
    notification: Pick<
      CommunityNotification,
      'type' | 'title' | 'body' | 'href'
    >,
  ) {
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId },
    });
    if (!profile) return;
    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        userId: profile.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        href: notification.href,
        readAt: null,
      }),
    );
    await this.notificacoesService.sendToUsuario(profile.userId, {
      title: notification.title,
      body: notification.body || '',
      data: notification.href ? { href: notification.href } : {},
    });
  }

  private async recordAudit(
    actor: CurrentActor | null,
    event: string,
    targetType: string | null,
    targetId: string | null,
    metadata: Record<string, unknown> = {},
  ) {
    await this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        actorUserId: actor?.id || null,
        actorRole: actor?.role || null,
        event,
        targetType,
        targetId,
        metadata,
      }),
    );
  }

  private assertCommunityUser(actor: CurrentActor) {
    if (
      ![UserRole.ADMIN, UserRole.USER, UserRole.MODERATOR].includes(actor.role)
    ) {
      throw new ForbiddenException('Acesso permitido apenas a profissionais');
    }
  }

  private assertModerator(actor: CurrentActor) {
    if (![UserRole.ADMIN, UserRole.MODERATOR].includes(actor.role)) {
      throw new ForbiddenException('Acesso permitido apenas a moderadores');
    }
  }

  private assertSafeContent(content: string) {
    const normalized = content.toLowerCase();
    const blocked = ['cpf', 'rg:', 'cartao sus', 'whatsapp', 'telefone'];
    if (blocked.some((item) => normalized.includes(item))) {
      throw new BadRequestException(
        'Remova dados identificaveis do paciente antes de publicar',
      );
    }
  }

  private resolvePage(value?: number) {
    return Math.max(1, Number(value) || 1);
  }

  private resolveLimit(value?: number) {
    return Math.min(50, Math.max(1, Number(value) || 20));
  }

  private buildExcerpt(value: string) {
    return value.replace(/\s+/g, ' ').trim().slice(0, 240);
  }

  private async createUniqueSlug(
    repository: Repository<{ slug: string }>,
    value: string,
  ) {
    const base = this.slugify(value).slice(0, 180) || 'conteudo';
    for (let i = 0; i < 50; i++) {
      const slug = i === 0 ? base : `${base}-${i + 1}`;
      const exists = await repository.findOne({
        where: { slug } as FindOptionsWhere<{ slug: string }>,
      });
      if (!exists) return slug;
    }
    return `${base}-${Date.now()}`;
  }

  private async createUniqueUsername(value: string) {
    const base = this.slugify(value).slice(0, 60) || 'profissional';
    for (let i = 0; i < 50; i++) {
      const username = i === 0 ? base : `${base}-${i + 1}`;
      const exists = await this.profilesRepository.findOne({
        where: { username },
      });
      if (!exists) return username;
    }
    return `${base}-${Date.now()}`;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private titleFromSlug(slug: string) {
    return slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private async getProfileDistinctValues(field: 'specialty') {
    const rows = await this.profilesRepository
      .createQueryBuilder('profile')
      .select(`DISTINCT profile.${field}`, field)
      .where(`profile.${field} IS NOT NULL`)
      .orderBy(`profile.${field}`, 'ASC')
      .getRawMany<Record<string, string>>();
    return rows.map((row) => row[field]).filter(Boolean);
  }

  private resolveLevel(score: number) {
    return [...COMMUNITY_CONTRIBUTION_LEVELS]
      .reverse()
      .find((level) => score >= level.minScore);
  }

  private hasS3Config() {
    return Boolean(
      this.configService.get<string>('COMMUNITY_S3_BUCKET') &&
      this.configService.get<string>('COMMUNITY_S3_ACCESS_KEY_ID') &&
      this.configService.get<string>('COMMUNITY_S3_SECRET_ACCESS_KEY'),
    );
  }

  private requiredEnv(key: string) {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) throw new ServiceUnavailableException(`${key} nao configurado`);
    return value;
  }

  private resolveUploadPublicUrl(endpoint: string, storageKey: string) {
    const publicBaseUrl = this.configService
      .get<string>('COMMUNITY_S3_PUBLIC_BASE_URL')
      ?.trim();
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${encodeURI(storageKey)}`;
    }
    return `${endpoint.replace(/\/$/, '')}/${encodeURI(storageKey)}`;
  }

  private createS3PresignedPutUrl(input: {
    accessKey: string;
    secretKey: string;
    region: string;
    endpoint: string;
    bucket: string;
    key: string;
    contentType: string;
    expiresSeconds: number;
  }) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const service = 's3';
    const credentialScope = `${dateStamp}/${input.region}/${service}/aws4_request`;
    const host = new URL(input.endpoint).host;
    const canonicalUri = `/${encodeURIComponent(input.key).replace(/%2F/g, '/')}`;
    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${input.accessKey}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(input.expiresSeconds),
      'X-Amz-SignedHeaders': 'content-type;host',
    });
    const canonicalRequest = [
      'PUT',
      canonicalUri,
      params.toString(),
      `content-type:${input.contentType}\nhost:${host}\n`,
      'content-type;host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');
    const signingKey = this.getSignatureKey(
      input.secretKey,
      dateStamp,
      input.region,
      service,
    );
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');
    params.set('X-Amz-Signature', signature);
    return `${input.endpoint.replace(/\/$/, '')}${canonicalUri}?${params.toString()}`;
  }

  private getSignatureKey(
    secret: string,
    dateStamp: string,
    region: string,
    service: string,
  ) {
    const kDate = createHmac('sha256', `AWS4${secret}`)
      .update(dateStamp)
      .digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update(service).digest();
    return createHmac('sha256', kService).update('aws4_request').digest();
  }

  async createCommunitySsoToken(
    actor: CurrentActor,
    input: {
      returnTo?: string;
      deviceContext?: Record<string, unknown>;
    },
  ) {
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 60_000);
    const safeReturnTo = this.sanitizeReturnTo(input.returnTo);
    await this.ssoTokensRepository.save(
      this.ssoTokensRepository.create({
        tokenHash: this.hashToken(rawToken),
        userId: actor.id,
        returnTo: safeReturnTo,
        deviceContext: input.deviceContext || {},
        expiresAt,
        consumedAt: null,
      }),
    );
    await this.recordAudit(
      actor,
      'community.sso.token_created',
      'user',
      actor.id,
    );
    const communityUrl =
      this.configService.get<string>('COMMUNITY_WEB_URL') ||
      'https://community.synap.app';
    const callbackParams = new URLSearchParams({
      token: rawToken,
      source: 'synap-app',
    });
    if (safeReturnTo) {
      callbackParams.set('returnTo', safeReturnTo);
    }
    return {
      oneTimeToken: rawToken,
      expiresAt,
      redirectUrl: `${communityUrl.replace(/\/$/, '')}/sso/callback?${callbackParams.toString()}`,
    };
  }

  async exchangeCommunitySsoToken(rawToken: string) {
    const token = await this.ssoTokensRepository.findOne({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!token || token.consumedAt || token.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Token SSO invalido ou expirado');
    }
    const usuario = await this.usuariosRepository.findOne({
      where: { id: token.userId, ativo: true },
    });
    if (!usuario) throw new ForbiddenException('Usuario nao autorizado');
    token.consumedAt = new Date();
    await this.ssoTokensRepository.save(token);
    const jwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const sessionToken = this.jwtService.sign(jwtPayload, {
      secret,
      expiresIn: expiresIn as SignOptions['expiresIn'],
    });
    await this.ensureProfile(usuario);
    await this.recordAudit(
      usuario,
      'community.sso.token_exchanged',
      'user',
      usuario.id,
    );
    return {
      token: sessionToken,
      returnTo: token.returnTo,
      profile: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        especialidade: usuario.especialidade,
      },
      permissions: this.resolveCommunityPermissions(usuario.role),
    };
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private sanitizeReturnTo(value?: string | null): string | null {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
    return value;
  }

  private assertAllowedUploadType(contentType: string) {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (!allowed.includes(contentType.trim().toLowerCase())) {
      throw new BadRequestException(
        'Tipo de arquivo nao permitido para upload',
      );
    }
  }

  private resolveCommunityPermissions(role: UserRole) {
    return {
      canPost: [UserRole.ADMIN, UserRole.USER, UserRole.MODERATOR].includes(
        role,
      ),
      canModerate: [UserRole.ADMIN, UserRole.MODERATOR].includes(role),
      canAdmin: role === UserRole.ADMIN,
    };
  }
}
