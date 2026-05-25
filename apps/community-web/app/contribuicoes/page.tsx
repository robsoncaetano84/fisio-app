import type { Metadata } from 'next';
import {
  Award,
  BookOpenCheck,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getCommunityReputationModel,
  type CommunityContributionRule,
} from '@/lib/community-reputation';

export const metadata: Metadata = {
  title: 'Contribuicoes e reputacao saudavel | SYNAP Comunidade',
  description:
    'Modelo de contribuicoes, niveis, badges e reconhecimento saudavel da comunidade profissional SYNAP.',
  alternates: {
    canonical: '/contribuicoes',
  },
  openGraph: {
    title: 'Contribuicoes e reputacao saudavel',
    description:
      'Como a comunidade SYNAP reconhece ajuda tecnica, ciencia e colaboracao etica entre profissionais.',
    type: 'website',
    url: '/contribuicoes',
  },
};

export default function ContributionsPage() {
  const reputation = getCommunityReputationModel();
  const positiveRules = reputation.rules.filter((rule) => rule.points > 0);
  const penaltyRules = reputation.rules.filter((rule) => rule.points < 0);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Contribuicoes e reputacao saudavel SYNAP',
    description:
      'Modelo de reputacao tecnica, badges e reconhecimento saudavel da comunidade SYNAP.',
    url: `${getCommunityUrl()}/contribuicoes`,
    publisher: {
      '@type': 'Organization',
      name: 'SYNAP',
      url: getCommunityUrl(),
    },
    about: [
      'Comunidade profissional',
      'Reputacao tecnica',
      'Educacao continuada',
      'Saude',
    ],
  };

  return (
    <CommunityShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <script
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
          type="application/ld+json"
        />

        <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge tone="primary">Reputacao tecnica</Badge>
                <Badge tone="secondary">Nao competitiva</Badge>
                <Badge tone="accent">Etica profissional</Badge>
              </div>
              <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                Contribuicoes e reputacao saudavel
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
                O modelo reconhece ajuda tecnica, referencias, respostas uteis
                e comportamento profissional. Ele nao mede fama, volume de
                pacientes, faturamento ou popularidade vazia.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button href="/colaboradores">Ver colaboradores</Button>
                <Button href="/diretrizes" variant="secondary">
                  Ver diretrizes
                </Button>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
              <HeartHandshake className="h-6 w-6" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reputation.principles.map((principle, index) => (
            <article
              className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle"
              key={principle}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                {index === 0 ? <ThumbsUp className="h-5 w-5" /> : null}
                {index === 1 ? <BookOpenCheck className="h-5 w-5" /> : null}
                {index === 2 ? <Scale className="h-5 w-5" /> : null}
                {index === 3 ? <ShieldCheck className="h-5 w-5" /> : null}
              </div>
              <h2 className="mt-3 text-sm font-extrabold text-synap-text">
                Principio {index + 1}
              </h2>
              <p className="mt-2 text-sm leading-6 text-synap-muted">
                {principle}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <div className="flex items-center gap-2 text-synap-primary">
                <Sparkles className="h-4 w-4" />
                <h2 className="text-base font-extrabold text-synap-text">
                  Regras de contribuicao
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-synap-muted">
                Pontos sao sinais internos de contribuicao tecnica. A exibicao
                publica deve explicar o valor da contribuicao, nao criar placar
                competitivo.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {positiveRules.map((rule) => (
                  <ContributionRuleCard key={rule.id} rule={rule} />
                ))}
              </div>
            </section>

            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <div className="flex items-center gap-2 text-synap-primary">
                <Award className="h-4 w-4" />
                <h2 className="text-base font-extrabold text-synap-text">
                  Badges tecnicos
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-synap-muted">
                Badges devem representar contribuicao util e aderencia etica.
                Badges sensiveis passam por moderacao ou curadoria editorial.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {reputation.badges.map((badge) => (
                  <article
                    className="rounded-synap border border-synap-border bg-synap-background p-4"
                    key={badge.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-synap-text">
                        {badge.label}
                      </h3>
                      <Badge tone={getReviewTone(badge.review)}>
                        {getReviewLabel(badge.review)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-synap-muted">
                      {badge.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold leading-5 text-synap-muted">
                      Criterio: {badge.criteria}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <h2 className="text-base font-extrabold text-synap-text">
                Niveis
              </h2>
              <div className="mt-4 space-y-3">
                {reputation.levels.map((level) => (
                  <article
                    className="rounded-synap border border-synap-border bg-synap-background p-3"
                    key={level.name}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-extrabold text-synap-text">
                        {level.name}
                      </h3>
                      <Badge tone="neutral">{level.minScore}+</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-synap-muted">
                      {level.description}
                    </p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-synap-muted">
                      {level.intent}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <h2 className="text-base font-extrabold text-synap-text">
                Nao entra na reputacao
              </h2>
              <ul className="mt-4 space-y-3">
                {reputation.exclusions.map((item) => (
                  <li className="text-sm leading-6 text-synap-muted" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <h2 className="text-base font-extrabold text-synap-text">
                Salvaguardas
              </h2>
              <ul className="mt-4 space-y-3">
                {reputation.safeguards.map((item) => (
                  <li className="text-sm leading-6 text-synap-muted" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
          <div className="flex items-center gap-2 text-synap-primary">
            <ShieldCheck className="h-4 w-4" />
            <h2 className="text-base font-extrabold text-synap-text">
              Penalidades e moderacao
            </h2>
          </div>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
            Penalidades sao sinais de seguranca e qualidade, aplicados com
            revisao humana, auditoria e possibilidade de recurso. Elas nao
            devem ser expostas como humilhacao publica.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {penaltyRules.map((rule) => (
              <ContributionRuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
          <h2 className="text-base font-extrabold text-synap-text">
            Onde o reconhecimento aparece
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {reputation.recognitionSurfaces.map((surface) => (
              <article
                className="rounded-synap border border-synap-border bg-synap-background p-4"
                key={surface.title}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-synap-text">
                    {surface.title}
                  </h3>
                  <Badge tone="primary">{surface.cadence}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-synap-muted">
                  {surface.description}
                </p>
                <p className="mt-3 text-xs font-semibold leading-5 text-synap-muted">
                  {surface.rankingBehavior}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </CommunityShell>
  );
}

function ContributionRuleCard({ rule }: { rule: CommunityContributionRule }) {
  return (
    <article className="rounded-synap border border-synap-border bg-synap-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone={getCategoryTone(rule.category)}>
            {getCategoryLabel(rule.category)}
          </Badge>
          <h3 className="mt-3 text-sm font-extrabold text-synap-text">
            {rule.title}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
            rule.points > 0
              ? 'bg-synap-primary/10 text-synap-primary'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {rule.points > 0 ? `+${rule.points}` : rule.points}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-synap-muted">
        {rule.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={rule.requiresReview ? 'accent' : 'neutral'}>
          {rule.requiresReview ? 'Com revisao' : 'Automatico'}
        </Badge>
        <Badge tone={rule.visibleToPublic ? 'secondary' : 'neutral'}>
          {rule.visibleToPublic ? 'Sinal publico' : 'Sinal interno'}
        </Badge>
      </div>
    </article>
  );
}

function getCategoryTone(
  category: CommunityContributionRule['category'],
): 'primary' | 'secondary' | 'accent' | 'neutral' {
  if (category === 'science') return 'secondary';
  if (category === 'recognition') return 'accent';
  if (category === 'penalty') return 'neutral';
  return 'primary';
}

function getCategoryLabel(
  category: CommunityContributionRule['category'],
): string {
  const labels: Record<CommunityContributionRule['category'], string> = {
    knowledge: 'Conhecimento',
    support: 'Apoio',
    science: 'Ciencia',
    recognition: 'Reconhecimento',
    moderation: 'Moderacao',
    penalty: 'Penalidade',
  };

  return labels[category];
}

function getReviewTone(
  review: 'automatic' | 'moderated' | 'editorial',
): 'primary' | 'secondary' | 'accent' | 'neutral' {
  if (review === 'editorial') return 'primary';
  if (review === 'moderated') return 'accent';
  return 'neutral';
}

function getReviewLabel(review: 'automatic' | 'moderated' | 'editorial') {
  if (review === 'editorial') return 'Editorial';
  if (review === 'moderated') return 'Moderado';
  return 'Automatico';
}

function getCommunityUrl(): string {
  return (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app'
  ).replace(/\/$/, '');
}

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
