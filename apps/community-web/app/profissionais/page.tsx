import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Filter,
  MessageSquare,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getCommunityContributorHighlights,
  getCommunityProfiles,
  type CommunityContributionLevel,
  type CommunityContributionLevelRule,
  type CommunityProfile,
  type CommunityProfilesSort,
} from '@/lib/community-api';

type PageProps = {
  searchParams: Promise<{
    q?: string;
    specialty?: string;
    sort?: CommunityProfilesSort;
  }>;
};

const sortOptions: Array<{
  value: CommunityProfilesSort;
  label: string;
}> = [
  { value: 'contributions', label: 'Mais contribuicoes' },
  { value: 'useful', label: 'Respostas uteis' },
  { value: 'name', label: 'Nome' },
];

export const metadata: Metadata = {
  title: 'Profissionais | SYNAP Comunidade',
  description:
    'Diretorio profissional da comunidade SYNAP com perfis, especialidades, badges e contribuicoes tecnicas em saude.',
  alternates: {
    canonical: '/profissionais',
  },
  openGraph: {
    title: 'Profissionais | SYNAP Comunidade',
    description:
      'Descubra profissionais por area de atuacao, contribuicao tecnica e colaboracao cientifica.',
    type: 'website',
    url: '/profissionais',
  },
};

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = isProfileSort(params.sort) ? params.sort : 'contributions';
  const [profiles, allProfiles, highlights] = await Promise.all([
    getCommunityProfiles({
      q: params.q,
      specialty: params.specialty,
      sort,
    }),
    getCommunityProfiles(),
    getCommunityContributorHighlights(),
  ]);

  const jsonLd = buildProfessionalsJsonLd(profiles.items);

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <script
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
          type="application/ld+json"
        />

        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Perfis profissionais</Badge>
                  <Badge tone="secondary">Especialidades</Badge>
                  <Badge tone="accent">Colaboracao</Badge>
                </div>
                <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Profissionais da comunidade
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  Perfis indexaveis para encontrar colegas por area tecnica,
                  contribuicoes, respostas uteis e referencias compartilhadas.
                  O destaque e colaborativo, sem metricas comerciais.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <form
              action="/profissionais"
              className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_200px_auto]"
            >
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synap-muted" />
                <input
                  className="h-11 w-full rounded-synap border-synap-border bg-synap-background pl-10 pr-3 text-sm text-synap-text placeholder:text-synap-muted focus:border-synap-primary focus:ring-synap-primary"
                  defaultValue={params.q || ''}
                  name="q"
                  placeholder="Buscar nome, area, badge ou cidade"
                  type="search"
                />
              </label>

              <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synap-muted" />
                <select
                  className="h-11 w-full rounded-synap border-synap-border bg-synap-background pl-10 pr-8 text-sm font-semibold text-synap-text focus:border-synap-primary focus:ring-synap-primary"
                  defaultValue={params.specialty || ''}
                  name="specialty"
                >
                  <option value="">Todas especialidades</option>
                  {allProfiles.specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <select
                  className="h-11 w-full rounded-synap border-synap-border bg-synap-background text-sm font-semibold text-synap-text focus:border-synap-primary focus:ring-synap-primary"
                  defaultValue={sort}
                  name="sort"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button className="h-11" variant="secondary">
                Filtrar
              </Button>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-synap-text">
                {profiles.total} profissionais encontrados
              </h2>
              <p className="mt-1 text-sm font-semibold text-synap-muted">
                Ordenacao atual: {getSortLabel(sort)}
              </p>
            </div>
            <Button href="/colaboradores" variant="ghost">
              Ver destaques
            </Button>
          </div>

          {profiles.items.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {profiles.items.map((profile) => (
                <ProfessionalCard
                  key={profile.id}
                  levels={highlights.levels}
                  profile={profile}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-synap border border-dashed border-synap-border bg-white p-6 text-sm font-semibold text-synap-muted">
              Nenhum profissional encontrado para os filtros informados.
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Reputacao profissional
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              A reputacao tecnica reconhece ajuda entre profissionais,
              respostas uteis, referencias e postura etica. Nao representa
              fama, volume de pacientes ou faturamento.
            </p>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <Stethoscope className="h-5 w-5" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Areas mais presentes
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {allProfiles.areas.slice(0, 12).map((area) => (
                <Badge key={area}>{area}</Badge>
              ))}
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Proximas conexoes
            </h2>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              A integracao futura com SSO sincronizara nome, foto,
              especialidade, profissao e status da conta do ecossistema SYNAP.
            </p>
            <Button className="mt-4 w-full" href="/diretrizes" variant="secondary">
              Ver diretrizes
            </Button>
          </section>
        </aside>
      </main>
    </CommunityShell>
  );
}

function ProfessionalCard({
  levels,
  profile,
}: {
  levels: CommunityContributionLevelRule[];
  profile: CommunityProfile;
}) {
  const href = `/perfil/${profile.username || profile.id}`;
  const level = getLevel(profile.reputationScore, levels);

  return (
    <article className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-synap bg-synap-primary text-sm font-extrabold text-white">
          {getInitials(profile.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="text-sm font-extrabold text-synap-text hover:text-synap-primary"
              href={href}
            >
              {profile.displayName}
            </Link>
            <Badge tone="primary">{level}</Badge>
          </div>
          <p className="mt-1 text-xs font-semibold text-synap-muted">
            {profile.profession || 'Profissional SYNAP'}
            {profile.specialty ? ` - ${profile.specialty}` : ''}
          </p>
          {profile.cityState ? (
            <p className="mt-1 text-xs font-semibold text-synap-muted">
              {profile.cityState}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-synap-muted">
        {profile.bio}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.areasOfPractice.slice(0, 3).map((area) => (
          <Badge key={area} tone="neutral">
            {area}
          </Badge>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric
          icon={<MessageSquare className="h-4 w-4" />}
          label="contrib."
          value={profile.contributionCount}
        />
        <Metric
          icon={<Award className="h-4 w-4" />}
          label="uteis"
          value={profile.usefulAnswerCount}
        />
        <Metric
          icon={<BookOpen className="h-4 w-4" />}
          label="recursos"
          value={profile.sharedArticleCount + profile.recommendedReferenceCount}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-synap-border pt-4">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-synap-muted">
          <UserRound className="h-4 w-4 text-synap-primary" />
          {profile.badges.length} badges
        </span>
        <Button href={href} variant="ghost">
          Ver perfil
        </Button>
      </div>
    </article>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-3">
      <div className="flex items-center justify-between gap-2 text-synap-primary">
        {icon}
        <span className="text-base font-extrabold text-synap-text">
          {value}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-normal text-synap-muted">
        {label}
      </p>
    </div>
  );
}

function getLevel(
  reputationScore: number,
  levels: CommunityContributionLevelRule[],
): CommunityContributionLevel {
  return levels
    .filter((level) => reputationScore >= level.minScore)
    .sort((a, b) => b.minScore - a.minScore)[0]?.name || 'Participante';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function isProfileSort(value?: string): value is CommunityProfilesSort {
  return value === 'contributions' || value === 'useful' || value === 'name';
}

function getSortLabel(sort: CommunityProfilesSort): string {
  return sortOptions.find((option) => option.value === sort)?.label || 'Mais contribuicoes';
}

function getCommunityUrl(): string {
  return (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app'
  ).replace(/\/$/, '');
}

function buildProfessionalsJsonLd(profiles: CommunityProfile[]) {
  const baseUrl = getCommunityUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Profissionais da Comunidade SYNAP',
    itemListElement: profiles.map((profile, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/perfil/${profile.username || profile.id}`,
      item: {
        '@type': 'Person',
        name: profile.displayName,
        jobTitle: [profile.profession, profile.specialty]
          .filter(Boolean)
          .join(' - '),
        description: profile.bio,
        knowsAbout: profile.areasOfPractice,
      },
    })),
  };
}

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
