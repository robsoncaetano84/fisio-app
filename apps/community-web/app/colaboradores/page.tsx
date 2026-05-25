import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  BookOpenCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CommunityContributorHighlight,
  getCommunityContributorHighlights,
} from '@/lib/community-api';

export const metadata: Metadata = {
  title: 'Colaboradores em destaque | SYNAP Comunidade',
  description:
    'Reconhecimento saudavel para contribuicoes tecnicas, respostas uteis e compartilhamento cientifico na comunidade SYNAP.',
};

export default async function ContributorsPage() {
  const highlights = await getCommunityContributorHighlights();

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0">
          <div className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="primary">Colaboracao</Badge>
                  <Badge tone="secondary">Ciencia</Badge>
                  <Badge tone="accent">Etica</Badge>
                </div>
                <h1 className="max-w-2xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  Colaboradores em destaque
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-synap-muted">
                  Reconhecimento editorial para profissionais que ajudam a
                  comunidade com respostas uteis, referencias, discussao
                  tecnica e postura etica. Nao mede popularidade, pacientes ou
                  faturamento.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/contribuicoes" variant="secondary">
                Como funciona a reputacao
              </Button>
              <Button href="/diretrizes" variant="secondary">
                Diretrizes da comunidade
              </Button>
            </div>
          </div>

          <HighlightSection
            description="Profissionais que contribuiram recentemente com respostas tecnicas, apoio aos colegas e referencias aplicaveis."
            icon={<Sparkles className="h-4 w-4" />}
            items={highlights.weekly}
            title="Destaque semanal"
          />

          <HighlightSection
            description="Contribuicoes consistentes ao longo do mes, com foco em qualidade tecnica e valor educacional."
            icon={<Award className="h-4 w-4" />}
            items={highlights.monthly}
            title="Destaque mensal"
          />

          <HighlightSection
            description="Referencias por area para facilitar a descoberta de profissionais que fortalecem discussoes especificas."
            icon={<BookOpenCheck className="h-4 w-4" />}
            items={highlights.byCategory}
            title="Colaboradores por categoria"
          />
        </section>

        <aside className="space-y-4">
          <div className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
            <div className="flex items-center gap-2 text-synap-primary">
              <ShieldCheck className="h-4 w-4" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Reputacao saudavel
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Os destaques valorizam contribuicao tecnica, cuidado etico e ajuda
              entre profissionais. A comunidade evita comparacoes comerciais e
              metricas de vaidade.
            </p>
            <div className="mt-4">
              <Button className="w-full" href="/contribuicoes" variant="secondary">
                Ver regras de contribuicao
              </Button>
            </div>
            <div className="mt-2">
              <Button className="w-full" href="/nova-discussao" variant="secondary">
                Contribuir com uma discussao
              </Button>
            </div>
          </div>

          <div className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Niveis de contribuicao
            </h2>
            <div className="mt-4 space-y-3">
              {highlights.levels.map((level) => (
                <div
                  className="rounded-synap border border-synap-border bg-synap-background p-3"
                  key={level.name}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-synap-text">
                      {level.name}
                    </p>
                    <Badge tone="neutral">{level.minScore}+</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-synap-muted">
                    {level.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </CommunityShell>
  );
}

function HighlightSection({
  description,
  icon,
  items,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  items: CommunityContributorHighlight[];
  title: string;
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-synap-primary">
            {icon}
            <h2 className="text-base font-extrabold text-synap-text">
              {title}
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-synap-muted">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ContributorCard contributor={item} key={`${title}-${item.id}`} />
        ))}
      </div>
    </section>
  );
}

function ContributorCard({
  contributor,
}: {
  contributor: CommunityContributorHighlight;
}) {
  const profileHref = `/perfil/${contributor.username || contributor.id}`;

  return (
    <article className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-synap-primary/10 text-sm font-extrabold text-synap-primary">
          {getInitials(contributor.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="text-sm font-extrabold text-synap-text hover:text-synap-primary"
              href={profileHref}
            >
              {contributor.displayName}
            </Link>
            <Badge tone="primary">{contributor.level}</Badge>
          </div>
          <p className="mt-1 text-xs font-semibold text-synap-muted">
            {contributor.profession}
            {contributor.specialty ? ` - ${contributor.specialty}` : ''}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-synap-muted">
        {contributor.highlightedReason}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="secondary">{contributor.categoryName}</Badge>
        <Badge tone="neutral">
          {contributor.weeklyContributionCount} contribuicoes na semana
        </Badge>
        <Badge tone="neutral">
          {contributor.monthlyContributionCount} no mes
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-synap-border pt-4">
        <span className="text-xs font-semibold text-synap-muted">
          {contributor.usefulAnswerCount} respostas uteis
        </span>
        <Button href={profileHref} variant="ghost">
          Ver perfil
        </Button>
      </div>
    </article>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
