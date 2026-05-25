CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Script completo para pgAdmin/PostgreSQL 10.
-- O PostgreSQL 10 nao permite ALTER TYPE ... ADD VALUE em lote multi-comando.
-- Por isso, quando necessario, o enum e recriado preservando valores atuais
-- e adicionando MODERATOR.
DO $$
DECLARE
  enum_values text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuarios_role_enum')
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'usuarios'
        AND column_name = 'role'
        AND udt_name = 'usuarios_role_enum'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = 'usuarios_role_enum'::regtype
        AND enumlabel = 'MODERATOR'
    )
  THEN
    SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'usuarios_role_enum'::regtype;

    enum_values := enum_values || ', ' || quote_literal('MODERATOR');

    EXECUTE 'ALTER TABLE "usuarios" ALTER COLUMN "role" DROP DEFAULT';
    EXECUTE 'DROP TYPE IF EXISTS "usuarios_role_enum_new"';
    EXECUTE 'CREATE TYPE "usuarios_role_enum_new" AS ENUM (' || enum_values || ')';
    EXECUTE 'ALTER TABLE "usuarios" ALTER COLUMN "role" TYPE "usuarios_role_enum_new" USING "role"::text::"usuarios_role_enum_new"';
    EXECUTE 'DROP TYPE "usuarios_role_enum"';
    EXECUTE 'ALTER TYPE "usuarios_role_enum_new" RENAME TO "usuarios_role_enum"';
    EXECUTE 'ALTER TABLE "usuarios" ALTER COLUMN "role" SET DEFAULT ''USER''::"usuarios_role_enum"';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "community_profiles" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "user_id" uuid NOT NULL,
  "username" character varying(80) NOT NULL,
  "display_name" character varying(180) NOT NULL,
  "profession" character varying(120),
  "specialty" character varying(120),
  "bio" text,
  "avatar_url" text,
  "city_state" character varying(120),
  "areas_of_practice" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reputation_score" integer NOT NULL DEFAULT 0,
  "contribution_count" integer NOT NULL DEFAULT 0,
  "useful_answer_count" integer NOT NULL DEFAULT 0,
  "shared_article_count" integer NOT NULL DEFAULT 0,
  "recommended_reference_count" integer NOT NULL DEFAULT 0,
  CONSTRAINT "PK_community_profiles" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_profiles_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_categories" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "slug" character varying(100) NOT NULL,
  "name" character varying(140) NOT NULL,
  "description" text,
  "group" character varying(120),
  "color" character varying(20),
  "icon" character varying(60),
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  CONSTRAINT "PK_community_categories" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "community_tags" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "slug" character varying(80) NOT NULL,
  "name" character varying(100) NOT NULL,
  "description" text,
  "usage_count" integer NOT NULL DEFAULT 0,
  CONSTRAINT "PK_community_tags" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "community_posts" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "author_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "title" character varying(180) NOT NULL,
  "slug" character varying(220) NOT NULL,
  "excerpt" text,
  "content_markdown" text NOT NULL,
  "moderation_status" character varying(30) NOT NULL DEFAULT 'APPROVED',
  "score" integer NOT NULL DEFAULT 0,
  "views_count" integer NOT NULL DEFAULT 0,
  "replies_count" integer NOT NULL DEFAULT 0,
  "useful_reply_id" uuid,
  "references_metadata" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "attachments_metadata" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "published_at" TIMESTAMP,
  "last_activity_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_community_posts" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_posts_author" FOREIGN KEY ("author_id") REFERENCES "community_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_posts_category" FOREIGN KEY ("category_id") REFERENCES "community_categories"("id")
);

CREATE TABLE IF NOT EXISTS "community_replies" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "post_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "content_markdown" text NOT NULL,
  "moderation_status" character varying(30) NOT NULL DEFAULT 'APPROVED',
  "score" integer NOT NULL DEFAULT 0,
  "is_useful" boolean NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_community_replies" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_replies_post" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_replies_author" FOREIGN KEY ("author_id") REFERENCES "community_profiles"("id") ON DELETE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'FK_community_posts_useful_reply'
  ) THEN
    ALTER TABLE "community_posts"
    ADD CONSTRAINT "FK_community_posts_useful_reply"
    FOREIGN KEY ("useful_reply_id") REFERENCES "community_replies"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "community_post_tags" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "post_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  CONSTRAINT "PK_community_post_tags" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_post_tags_post" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_post_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "community_tags"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_resources" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "shared_by_id" uuid NOT NULL,
  "category_id" uuid,
  "kind" character varying(30) NOT NULL,
  "title" character varying(220) NOT NULL,
  "slug" character varying(250) NOT NULL,
  "summary" text NOT NULL,
  "source_name" character varying(180) NOT NULL,
  "source_url" text,
  "doi" character varying(120),
  "published_year" integer,
  "authors" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "clinical_use" text NOT NULL,
  "moderation_status" character varying(30) NOT NULL DEFAULT 'APPROVED',
  "shared_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_community_resources" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_resources_profile" FOREIGN KEY ("shared_by_id") REFERENCES "community_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_resources_category" FOREIGN KEY ("category_id") REFERENCES "community_categories"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "community_resource_tags" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "resource_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  CONSTRAINT "PK_community_resource_tags" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_resource_tags_resource" FOREIGN KEY ("resource_id") REFERENCES "community_resources"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_resource_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "community_tags"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_reactions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "target_type" character varying(30) NOT NULL,
  "target_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "reaction_type" character varying(30) NOT NULL DEFAULT 'THANKS',
  CONSTRAINT "PK_community_reactions" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_reactions_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_bookmarks" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "target_type" character varying(30) NOT NULL,
  "target_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  CONSTRAINT "PK_community_bookmarks" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_bookmarks_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_moderation_reports" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "target_type" character varying(30) NOT NULL,
  "target_id" uuid NOT NULL,
  "reporter_id" uuid,
  "reason" character varying(80) NOT NULL,
  "details" text,
  "status" character varying(30) NOT NULL DEFAULT 'OPEN',
  "resolution_note" text,
  "reviewed_by_id" uuid,
  "reviewed_at" TIMESTAMP,
  CONSTRAINT "PK_community_moderation_reports" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "usuarios"("id") ON DELETE SET NULL,
  CONSTRAINT "FK_community_reports_reviewer" FOREIGN KEY ("reviewed_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "community_notifications" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "user_id" uuid NOT NULL,
  "type" character varying(60) NOT NULL,
  "title" character varying(180) NOT NULL,
  "body" text,
  "href" text,
  "read_at" TIMESTAMP,
  CONSTRAINT "PK_community_notifications" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_notifications_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_contributions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "user_id" uuid NOT NULL,
  "event_type" character varying(60) NOT NULL,
  "points" integer NOT NULL,
  "source_type" character varying(30),
  "source_id" uuid,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "PK_community_contributions" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_contributions_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "community_badges" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "slug" character varying(100) NOT NULL,
  "label" character varying(140) NOT NULL,
  "description" text NOT NULL,
  "category_slug" character varying(100),
  "is_active" boolean NOT NULL DEFAULT true,
  CONSTRAINT "PK_community_badges" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "community_profile_badges" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "profile_id" uuid NOT NULL,
  "badge_id" uuid NOT NULL,
  "awarded_by_id" uuid,
  "awarded_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_community_profile_badges" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_profile_badges_profile" FOREIGN KEY ("profile_id") REFERENCES "community_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_profile_badges_badge" FOREIGN KEY ("badge_id") REFERENCES "community_badges"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_community_profile_badges_awarded_by" FOREIGN KEY ("awarded_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "community_audit_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "actor_user_id" uuid,
  "actor_role" character varying(40),
  "event" character varying(120) NOT NULL,
  "target_type" character varying(40),
  "target_id" character varying(120),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_community_audit_logs" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_audit_logs_actor" FOREIGN KEY ("actor_user_id") REFERENCES "usuarios"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "community_sso_tokens" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "token_hash" character varying(128) NOT NULL,
  "user_id" uuid NOT NULL,
  "return_to" text,
  "device_context" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "expires_at" TIMESTAMP NOT NULL,
  "consumed_at" TIMESTAMP,
  CONSTRAINT "PK_community_sso_tokens" PRIMARY KEY ("id"),
  CONSTRAINT "FK_community_sso_tokens_user" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_profiles_user" ON "community_profiles" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_profiles_username" ON "community_profiles" ("username");
CREATE INDEX IF NOT EXISTS "idx_community_profiles_profession_specialty" ON "community_profiles" ("profession", "specialty");
CREATE INDEX IF NOT EXISTS "idx_community_profiles_fts" ON "community_profiles" USING gin (to_tsvector('portuguese', coalesce("display_name", '') || ' ' || coalesce("bio", '') || ' ' || coalesce("specialty", '')));
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_categories_slug" ON "community_categories" ("slug");
CREATE INDEX IF NOT EXISTS "idx_community_categories_group_sort" ON "community_categories" ("group", "sort_order");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_tags_slug" ON "community_tags" ("slug");
CREATE INDEX IF NOT EXISTS "idx_community_tags_usage" ON "community_tags" ("usage_count");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_posts_slug" ON "community_posts" ("slug");
CREATE INDEX IF NOT EXISTS "idx_community_posts_category_activity" ON "community_posts" ("category_id", "last_activity_at");
CREATE INDEX IF NOT EXISTS "idx_community_posts_author_created" ON "community_posts" ("author_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_posts_status_created" ON "community_posts" ("moderation_status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_posts_fts" ON "community_posts" USING gin (to_tsvector('portuguese', coalesce("title", '') || ' ' || coalesce("content_markdown", '')));
CREATE INDEX IF NOT EXISTS "idx_community_replies_post_created" ON "community_replies" ("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_replies_author_created" ON "community_replies" ("author_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_replies_status_created" ON "community_replies" ("moderation_status", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_post_tags_unique" ON "community_post_tags" ("post_id", "tag_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_resources_slug" ON "community_resources" ("slug");
CREATE INDEX IF NOT EXISTS "idx_community_resources_kind_shared" ON "community_resources" ("kind", "shared_at");
CREATE INDEX IF NOT EXISTS "idx_community_resources_category_shared" ON "community_resources" ("category_id", "shared_at");
CREATE INDEX IF NOT EXISTS "idx_community_resources_fts" ON "community_resources" USING gin (to_tsvector('portuguese', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("clinical_use", '')));
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_resource_tags_unique" ON "community_resource_tags" ("resource_id", "tag_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_reactions_unique" ON "community_reactions" ("target_type", "target_id", "user_id", "reaction_type");
CREATE INDEX IF NOT EXISTS "idx_community_reactions_target" ON "community_reactions" ("target_type", "target_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_bookmarks_unique" ON "community_bookmarks" ("target_type", "target_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_community_reports_status_created" ON "community_moderation_reports" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_reports_target" ON "community_moderation_reports" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_community_notifications_user_read_created" ON "community_notifications" ("user_id", "read_at", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_notifications_type_created" ON "community_notifications" ("type", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_contributions_user_created" ON "community_contributions" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_contributions_source" ON "community_contributions" ("source_type", "source_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_badges_slug" ON "community_badges" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_profile_badges_unique" ON "community_profile_badges" ("profile_id", "badge_id");
CREATE INDEX IF NOT EXISTS "idx_community_audit_logs_event_created" ON "community_audit_logs" ("event", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_audit_logs_actor_created" ON "community_audit_logs" ("actor_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_community_audit_logs_target" ON "community_audit_logs" ("target_type", "target_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_community_sso_tokens_hash" ON "community_sso_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_community_sso_tokens_expires" ON "community_sso_tokens" ("expires_at");

INSERT INTO "community_categories" ("slug", "name", "description", "group", "color", "icon", "sort_order", "is_active")
VALUES
  ('ortopedia', 'Ortopedia', 'Discussao de casos, condutas e reabilitacao ortopedica.', 'Especialidades', '#0F766E', 'bone', 10, true),
  ('traumato-ortopedia', 'Traumato-Ortopedia', 'Traumas, pos-operatorio e recuperacao funcional.', 'Especialidades', '#0F766E', 'activity', 20, true),
  ('neurofuncional', 'Neurofuncional', 'Raciocinio clinico e condutas neurofuncionais.', 'Especialidades', '#2563EB', 'brain', 30, true),
  ('fisioterapia-esportiva', 'Fisioterapia Esportiva', 'Prevencao, retorno ao esporte e reabilitacao esportiva.', 'Especialidades', '#16A34A', 'dumbbell', 40, true),
  ('pediatria', 'Pediatria', 'Cuidado pediatrico, desenvolvimento e reabilitacao infantil.', 'Especialidades', '#DB2777', 'baby', 50, true),
  ('geriatria', 'Geriatria', 'Saude do idoso, funcionalidade e prevencao de quedas.', 'Especialidades', '#7C3AED', 'heart-pulse', 60, true),
  ('osteopatia', 'Osteopatia', 'Discussao tecnica sobre abordagens osteopaticas.', 'Especialidades', '#0891B2', 'hand', 70, true),
  ('rpg', 'RPG', 'Reeducacao postural global e raciocinio postural.', 'Especialidades', '#475569', 'scan-line', 80, true),
  ('pilates', 'Pilates', 'Pilates clinico, progressao e adaptacoes terapeuticas.', 'Especialidades', '#059669', 'circle', 90, true),
  ('acupuntura', 'Acupuntura', 'Discussao tecnica e referencias sobre acupuntura em saude.', 'Especialidades', '#B45309', 'sparkles', 100, true),
  ('dor-cronica', 'Dor Cronica', 'Dor persistente, educacao em dor e manejo funcional.', 'Temas Clinicos', '#DC2626', 'activity', 110, true),
  ('reabilitacao', 'Reabilitacao', 'Processos de recuperacao, funcionalidade e acompanhamento.', 'Temas Clinicos', '#0D9488', 'rotate-ccw', 120, true),
  ('casos-clinicos', 'Casos Clinicos', 'Discussao etica e anonimizada de casos clinicos.', 'Pratica Clinica', '#1D4ED8', 'clipboard-list', 130, true),
  ('discussao-de-laudos', 'Discussao de Laudos', 'Interpretacao tecnica e elaboracao de laudos.', 'Pratica Clinica', '#334155', 'file-text', 140, true),
  ('protocolos-terapeuticos', 'Protocolos Terapeuticos', 'Protocolos, progressao terapeutica e boas praticas.', 'Pratica Clinica', '#047857', 'list-checks', 150, true),
  ('evidencias-cientificas', 'Evidencias Cientificas', 'Discussao de evidencias e aplicacao clinica.', 'Ciencia', '#7C2D12', 'microscope', 160, true),
  ('artigos-cientificos', 'Artigos Cientificos', 'Compartilhamento e analise de artigos cientificos.', 'Ciencia', '#7C2D12', 'book-open', 170, true),
  ('referencias-bibliograficas', 'Referencias Bibliograficas', 'Livros, diretrizes e referencias tecnicas.', 'Ciencia', '#7C2D12', 'library', 180, true),
  ('tecnologia-na-saude', 'Tecnologia na Saude', 'Ferramentas, software, dispositivos e inovacao em saude.', 'Tecnologia', '#0369A1', 'cpu', 190, true),
  ('ia-aplicada-a-saude', 'IA aplicada a Saude', 'Uso responsavel de IA em fluxos clinicos e educacionais.', 'Tecnologia', '#4338CA', 'bot', 200, true),
  ('gestao-profissional', 'Gestao Profissional', 'Rotina profissional, processos e qualidade de atendimento.', 'Gestao', '#4B5563', 'briefcase', 210, true),
  ('sugestoes-para-o-synap', 'Sugestoes para o SYNAP', 'Feedback, ideias e melhorias para o ecossistema SYNAP.', 'SYNAP', '#0F766E', 'lightbulb', 220, true)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "community_badges" ("slug", "label", "description", "category_slug", "is_active")
VALUES
  ('referencia-coluna', 'Referencia em Coluna', 'Reconhece contribuicoes tecnicas consistentes sobre coluna e dor lombar.', 'ortopedia', true),
  ('mentor-tecnico', 'Mentor Tecnico', 'Reconhece respostas didaticas e apoio qualificado a colegas.', null, true),
  ('colaborador-cientifico', 'Colaborador Cientifico', 'Reconhece compartilhamento recorrente de evidencias e artigos.', 'evidencias-cientificas', true),
  ('discussao-clinica-destaque', 'Discussao Clinica Destaque', 'Reconhece discussao clinica relevante e eticamente conduzida.', 'casos-clinicos', true),
  ('compartilhador-evidencias', 'Compartilhador de Evidencias', 'Reconhece curadoria util de artigos e referencias cientificas.', 'artigos-cientificos', true),
  ('apoio-comunidade', 'Apoio a Comunidade', 'Reconhece participacao acolhedora e colaborativa.', null, true),
  ('referencia-neurofuncional', 'Referencia em Neurofuncional', 'Reconhece contribuicoes tecnicas em fisioterapia neurofuncional.', 'neurofuncional', true)
ON CONFLICT ("slug") DO NOTHING;
