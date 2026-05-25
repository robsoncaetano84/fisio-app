import type { Metadata } from 'next';
import { BookOpenCheck, Scale, ShieldCheck, Users } from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { EthicsGuidelinesCard } from '@/components/community/ethics-guidelines-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Diretrizes da comunidade',
  description:
    'Diretrizes eticas, clinicas e profissionais para publicar discussoes, respostas e referencias na comunidade SYNAP.',
  alternates: {
    canonical: '/diretrizes',
  },
  openGraph: {
    title: 'Diretrizes da comunidade',
    description:
      'Orientacoes de etica, anonimizacao e conduta profissional na comunidade SYNAP.',
    type: 'website',
    url: '/diretrizes',
  },
};

const principles = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Privacidade primeiro',
    description:
      'Casos clinicos devem ser anonimizados antes de qualquer publicacao.',
  },
  {
    icon: <BookOpenCheck className="h-5 w-5" />,
    title: 'Base tecnica',
    description:
      'Respostas devem favorecer raciocinio clinico, referencias e criterios claros.',
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Colaboracao saudavel',
    description:
      'A comunidade reconhece ajuda entre profissionais, sem competicao comercial.',
  },
  {
    icon: <Scale className="h-5 w-5" />,
    title: 'Responsabilidade profissional',
    description:
      'O conteudo apoia educacao continuada e nao substitui julgamento clinico.',
  },
];

const prohibitedItems = [
  'Dados identificaveis de pacientes, familiares ou acompanhantes.',
  'Imagens de exames, documentos ou pacientes sem anonimizar.',
  'Promessas de resultado, captacao comercial ou comparacao de faturamento.',
  'Orientacoes que ignorem sinais de alerta, escopo profissional ou necessidade de avaliacao presencial.',
  'Conteudo ofensivo, discriminatorio, spam ou sensacionalista.',
];

const recommendedStructure = [
  'Contexto clinico anonimizado.',
  'Achados relevantes da avaliacao.',
  'Hipotese funcional ou pergunta tecnica.',
  'Conduta realizada ou considerada.',
  'Referencia, criterio de reavaliacao ou limite da resposta.',
];

export default function GuidelinesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Diretrizes da comunidade SYNAP',
    description:
      'Diretrizes eticas, clinicas e profissionais para uso da comunidade SYNAP.',
    url: `${getCommunityUrl()}/diretrizes`,
    publisher: {
      '@type': 'Organization',
      name: 'SYNAP',
      url: getCommunityUrl(),
    },
    about: ['Etica profissional', 'LGPD', 'Anonimizacao', 'Saude'],
  };

  return (
    <CommunityShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <script
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(jsonLd) }}
          type="application/ld+json"
        />

        <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="primary">Etica</Badge>
            <Badge tone="secondary">LGPD</Badge>
            <Badge tone="accent">Saude</Badge>
          </div>
          <h1 className="max-w-3xl text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
            Diretrizes da comunidade SYNAP
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-synap-muted">
            Regras praticas para manter discussoes clinicas seguras, tecnicas e
            profissionais. O objetivo e apoiar educacao continuada e
            colaboracao entre profissionais da saude.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/nova-discussao">Criar discussao</Button>
            <Button href="/novo-recurso" variant="secondary">
              Compartilhar recurso
            </Button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {principles.map((principle) => (
            <article
              className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle"
              key={principle.title}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
                {principle.icon}
              </div>
              <h2 className="mt-3 text-sm font-extrabold text-synap-text">
                {principle.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-synap-muted">
                {principle.description}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <EthicsGuidelinesCard />

            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <h2 className="text-base font-extrabold text-synap-text">
                Estrutura recomendada para casos clinicos
              </h2>
              <p className="mt-2 text-sm leading-6 text-synap-muted">
                Use uma estrutura objetiva para facilitar respostas uteis e
                reduzir risco de exposicao desnecessaria.
              </p>
              <ol className="mt-4 space-y-2">
                {recommendedStructure.map((item, index) => (
                  <li className="flex gap-3 text-sm leading-6" key={item}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-synap-primary/10 text-xs font-extrabold text-synap-primary">
                      {index + 1}
                    </span>
                    <span className="text-synap-muted">{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <h2 className="text-base font-extrabold text-synap-text">
                Nao publicar
              </h2>
              <ul className="mt-4 space-y-3">
                {prohibitedItems.map((item) => (
                  <li className="text-sm leading-6 text-synap-muted" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
              <h2 className="text-base font-extrabold text-synap-text">
                Moderacao
              </h2>
              <p className="mt-2 text-sm leading-6 text-synap-muted">
                Conteudos com risco etico, dados sensiveis, spam ou conduta
                inadequada podem ser denunciados e revisados por moderadores.
              </p>
              <div className="mt-4">
                <Button className="w-full" href="/moderacao" variant="secondary">
                  Ver painel local
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </CommunityShell>
  );
}

function getCommunityUrl(): string {
  return (
    process.env.NEXT_PUBLIC_COMMUNITY_URL || 'https://community.synap.app'
  ).replace(/\/$/, '');
}

function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
