import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenAiModule } from '../ai/openai.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CommunityCacheService } from './community-cache.service';
import {
  CommunityAuthController,
  CommunityController,
  CommunitySessionController,
} from './community.controller';
import { CommunityService } from './community.service';
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
  CommunityProfileBadge,
  CommunityReaction,
  CommunityReply,
  CommunityResource,
  CommunityResourceTag,
  CommunitySsoToken,
  CommunityTag,
} from './entities/community.entities';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      Usuario,
      CommunityProfile,
      CommunityCategory,
      CommunityTag,
      CommunityPost,
      CommunityPostTag,
      CommunityReply,
      CommunityResource,
      CommunityResourceTag,
      CommunityReaction,
      CommunityBookmark,
      CommunityModerationReport,
      CommunityNotification,
      CommunityContribution,
      CommunityBadge,
      CommunityProfileBadge,
      CommunityAuditLog,
      CommunitySsoToken,
    ]),
    OpenAiModule,
    NotificacoesModule,
  ],
  controllers: [
    CommunityController,
    CommunityAuthController,
    CommunitySessionController,
  ],
  providers: [CommunityService, CommunityCacheService],
  exports: [CommunityService],
})
export class CommunityModule {}
