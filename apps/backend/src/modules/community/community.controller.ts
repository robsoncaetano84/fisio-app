import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, Usuario } from '../usuarios/entities/usuario.entity';
import {
  CommunityAiClassificationDto,
  CommunityClientLogDto,
  CommunityFeedQueryDto,
  CommunityModerationActionDto,
  CommunityProfilesQueryDto,
  CommunityResourceQueryDto,
  CommunitySearchQueryDto,
  CommunitySsoExchangeDto,
  CommunitySsoRequestDto,
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
import { CommunityService } from './community.service';
import type { CommunityTargetType } from './community.types';

const COMMUNITY_ROLES = [UserRole.ADMIN, UserRole.USER, UserRole.MODERATOR];
const MODERATION_ROLES = [UserRole.ADMIN, UserRole.MODERATOR];

@Controller('community')
@Roles(...COMMUNITY_ROLES)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Public()
  @Get('health')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  health() {
    return this.communityService.health();
  }

  @Public()
  @Get('categories')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getCategories() {
    return this.communityService.getCategories();
  }

  @Public()
  @Get('tags')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getTags() {
    return this.communityService.getTags();
  }

  @Public()
  @Get('tags/:slug')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getTag(@Param('slug') slug: string) {
    return this.communityService.getTag(slug);
  }

  @Public()
  @Get('feed')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getFeed(@Query() query: CommunityFeedQueryDto) {
    return this.communityService.getFeed(query);
  }

  @Public()
  @Get('posts/:slug')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getPost(@Param('slug') slug: string) {
    return this.communityService.getPost(slug);
  }

  @Post('posts')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  createPost(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateCommunityPostDto,
  ) {
    return this.communityService.createPost(usuario, dto);
  }

  @Post('posts/:postId/replies')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  createReply(
    @CurrentUser() usuario: Usuario,
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityReplyDto,
  ) {
    return this.communityService.createReply(usuario, postId, dto);
  }

  @Post('posts/by-slug/:slug/replies')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  createReplyBySlug(
    @CurrentUser() usuario: Usuario,
    @Param('slug') slug: string,
    @Body() dto: CreateCommunityReplyDto,
  ) {
    return this.communityService.createReplyByPostSlug(usuario, slug, dto);
  }

  @Patch('posts/:postId/useful-reply')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  markUsefulReply(
    @CurrentUser() usuario: Usuario,
    @Param('postId') postId: string,
    @Body() dto: MarkUsefulReplyDto,
  ) {
    return this.communityService.markUsefulReply(usuario, postId, dto);
  }

  @Public()
  @Get('resources')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getResources(@Query() query: CommunityResourceQueryDto) {
    return this.communityService.getResources(query);
  }

  @Public()
  @Get('resources/:slug')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getResource(@Param('slug') slug: string) {
    return this.communityService.getResource(slug);
  }

  @Post('resources')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  createResource(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateCommunityResourceDto,
  ) {
    return this.communityService.createResource(usuario, dto);
  }

  @Public()
  @Get('profiles')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getProfiles(@Query() query: CommunityProfilesQueryDto) {
    return this.communityService.getProfiles(query);
  }

  @Public()
  @Get('profiles/:username')
  @Throttle({ default: { ttl: 60, limit: 180 } })
  getProfile(@Param('username') username: string) {
    return this.communityService.getProfile(username);
  }

  @Get('bookmarks')
  @Throttle({ default: { ttl: 60, limit: 80 } })
  getBookmarks(@CurrentUser() usuario: Usuario) {
    return this.communityService.getBookmarks(usuario);
  }

  @Post('bookmarks')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  createBookmark(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.communityService.createBookmark(usuario, dto);
  }

  @Delete('bookmarks/:targetType/:targetId')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  removeBookmark(
    @CurrentUser() usuario: Usuario,
    @Param('targetType') targetType: CommunityTargetType,
    @Param('targetId') targetId: string,
  ) {
    return this.communityService.removeBookmark(usuario, targetType, targetId);
  }

  @Post('reactions/:targetType/:targetId')
  @Throttle({ default: { ttl: 60, limit: 80 } })
  react(
    @CurrentUser() usuario: Usuario,
    @Param('targetType') targetType: CommunityTargetType,
    @Param('targetId') targetId: string,
  ) {
    return this.communityService.react(usuario, targetType, targetId);
  }

  @Public()
  @Get('contributors/highlights')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getContributorHighlights() {
    return this.communityService.getContributorHighlights();
  }

  @Public()
  @Get('contributions/rules')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getContributionRules() {
    return this.communityService.getContributionRules();
  }

  @Get('contributions/me')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  getMyContributions(@CurrentUser() usuario: Usuario) {
    return this.communityService.getMyContributions(usuario);
  }

  @Public()
  @Get('search')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  search(@Query() query: CommunitySearchQueryDto) {
    return this.communityService.search(query);
  }

  @Get('notifications')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  getNotifications(@CurrentUser() usuario: Usuario) {
    return this.communityService.getNotifications(usuario);
  }

  @Patch('notifications/:notificationId/read')
  @Throttle({ default: { ttl: 60, limit: 120 } })
  markNotificationRead(
    @CurrentUser() usuario: Usuario,
    @Param('notificationId') notificationId: string,
  ) {
    return this.communityService.markNotificationRead(usuario, notificationId);
  }

  @Patch('notifications/read-all')
  @Throttle({ default: { ttl: 60, limit: 60 } })
  markAllNotificationsRead(@CurrentUser() usuario: Usuario) {
    return this.communityService.markAllNotificationsRead(usuario);
  }

  @Post('uploads/presign')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  presignUpload(
    @CurrentUser() usuario: Usuario,
    @Body() dto: PresignCommunityUploadDto,
  ) {
    return this.communityService.presignUpload(usuario, dto);
  }

  @Post('ai/content/classification')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  classifyWithAi(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CommunityAiClassificationDto,
  ) {
    return this.communityService.classifyWithAi(usuario, dto);
  }

  @Post('moderation/reports')
  @Throttle({ default: { ttl: 60, limit: 20 } })
  createReport(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateCommunityReportDto,
  ) {
    return this.communityService.createReport(usuario, dto);
  }

  @Get('moderation/reports')
  @Roles(...MODERATION_ROLES)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  listReports() {
    return this.communityService.listReports();
  }

  @Patch('moderation/reports/:reportId')
  @Roles(...MODERATION_ROLES)
  @Throttle({ default: { ttl: 60, limit: 40 } })
  updateReport(
    @CurrentUser() usuario: Usuario,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateCommunityReportDto,
  ) {
    return this.communityService.updateReport(usuario, reportId, dto);
  }

  @Patch('moderation/content')
  @Roles(...MODERATION_ROLES)
  @Throttle({ default: { ttl: 60, limit: 40 } })
  moderateContent(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CommunityModerationActionDto,
  ) {
    return this.communityService.moderateContent(usuario, dto);
  }

  @Get('admin/overview')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  adminOverview() {
    return this.communityService.adminOverview();
  }

  @Get('admin/audit-logs')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { ttl: 60, limit: 60 } })
  auditLogs() {
    return this.communityService.auditLogs();
  }

  @Patch('admin/users/:userId/role')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { ttl: 60, limit: 20 } })
  updateUserRole(
    @CurrentUser() usuario: Usuario,
    @Param('userId') userId: string,
    @Body() dto: UpdateCommunityUserRoleDto,
  ) {
    return this.communityService.updateUserRole(usuario, userId, dto);
  }

  @Public()
  @Post('logs/client-error')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  logClientError(@Body() dto: CommunityClientLogDto) {
    return this.communityService.logClientError(dto);
  }

  @Public()
  @Post('security/csp-report')
  @Throttle({ default: { ttl: 60, limit: 30 } })
  logCspReport(@Body() dto: Record<string, unknown>) {
    return this.communityService.logCspReport(dto);
  }
}

@Controller('auth')
@Roles(...COMMUNITY_ROLES)
export class CommunityAuthController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('community-sso')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  createCommunitySsoToken(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CommunitySsoRequestDto,
  ) {
    return this.communityService.createCommunitySsoToken(usuario, dto);
  }
}

@Controller('community/session')
export class CommunitySessionController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('exchange')
  @Throttle({ default: { ttl: 60, limit: 10 } })
  async exchangeSsoToken(
    @Body() dto: CommunitySsoExchangeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.communityService.exchangeCommunitySsoToken(
      dto.oneTimeToken,
    );
    response.cookie(
      'synap_community_session',
      session.token,
      this.cookieOptions(),
    );
    return {
      profile: session.profile,
      permissions: session.permissions,
      returnTo: session.returnTo,
      session: {
        cookieName: 'synap_community_session',
        httpOnly: true,
      },
    };
  }

  @Get('profile')
  @Roles(...COMMUNITY_ROLES)
  @Throttle({ default: { ttl: 60, limit: 80 } })
  getSessionProfile(@CurrentUser() usuario: Usuario) {
    return this.communityService.getMyProfile(usuario);
  }

  @Patch('profile')
  @Roles(...COMMUNITY_ROLES)
  @Throttle({ default: { ttl: 60, limit: 30 } })
  updateSessionProfile(
    @CurrentUser() usuario: Usuario,
    @Body() dto: UpdateCommunityProfileDto,
  ) {
    return this.communityService.updateMyProfile(usuario, dto);
  }

  private cookieOptions(): CookieOptions {
    const domain = this.configService
      .get<string>('COMMUNITY_COOKIE_DOMAIN')
      ?.trim();
    const maxAge =
      this.configService.get<number>('COMMUNITY_SESSION_COOKIE_MAX_AGE_MS') ||
      7 * 24 * 60 * 60 * 1000;
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
      ...(domain ? { domain } : {}),
    };
  }
}
