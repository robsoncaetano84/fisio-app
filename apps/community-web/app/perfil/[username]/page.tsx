import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Award,
  BookOpen,
  FileText,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { CommunityShell } from '@/components/community/community-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCommunityProfile } from '@/lib/community-api';

type PageProps = {
  params: Promise<{ username: string }>;
};

const activityLabel = {
  post: 'Discussao',
  reply: 'Resposta',
  reference: 'Referencia',
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getCommunityProfile(username);
  if (!profile) return {};

  const professionalInfo =
    [profile.profession, profile.specialty].filter(Boolean).join(' | ') ||
    'Profissional SYNAP';

  return {
    title: `${profile.displayName} | SYNAP Comunidade`,
    description: `${professionalInfo}. Perfil profissional com contribuicoes tecnicas na Comunidade SYNAP.`,
    openGraph: {
      title: `${profile.displayName} | SYNAP Comunidade`,
      description: profile.bio,
      type: 'profile',
    },
  };
}

export default async function CommunityProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getCommunityProfile(username);
  if (!profile) notFound();

  const initials = getInitials(profile.displayName);
  const professionalInfo =
    [profile.profession, profile.specialty].filter(Boolean).join(' | ') ||
    'Profissional SYNAP';

  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="min-w-0 space-y-6">
          <div className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-synap bg-synap-primary text-2xl font-extrabold text-white shadow-subtle">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">Perfil profissional</Badge>
                  <Badge tone="secondary">Contribuicao tecnica</Badge>
                </div>
                <h1 className="mt-3 text-2xl font-extrabold leading-9 text-synap-text sm:text-3xl">
                  {profile.displayName}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-synap-muted">
                  <span className="inline-flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-synap-primary" />
                    {professionalInfo}
                  </span>
                  {profile.cityState ? (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-synap-primary" />
                      {profile.cityState}
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-synap-text">
                  {profile.bio}
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-synap-primary" />
              <h2 className="text-lg font-extrabold text-synap-text">
                Areas de atuacao
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.areasOfPractice.map((area) => (
                <Badge key={area}>{area}</Badge>
              ))}
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-synap-primary" />
              <h2 className="text-lg font-extrabold text-synap-text">
                Badges de colaboracao
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile.badges.map((badge) => (
                <div
                  className="rounded-synap border border-synap-border bg-synap-background p-4"
                  key={badge.id}
                >
                  <p className="text-sm font-extrabold text-synap-text">
                    {badge.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-synap-muted">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-6 shadow-subtle">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-synap-primary" />
              <h2 className="text-lg font-extrabold text-synap-text">
                Atividade recente
              </h2>
            </div>
            <div className="mt-4 divide-y divide-synap-border">
              {profile.recentActivity.map((activity) => (
                <Link
                  className="block py-4 transition hover:text-synap-primary"
                  href={activity.href}
                  key={activity.id}
                >
                  <p className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
                    {activityLabel[activity.type]}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-synap-text">
                    {activity.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-synap-primary" />
              <h2 className="text-sm font-extrabold text-synap-text">
                Reputacao tecnica
              </h2>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-synap-primary">
              {profile.reputationScore}
            </p>
            <p className="mt-2 text-sm leading-6 text-synap-muted">
              Reconhecimento por ajuda tecnica, referencias uteis e postura
              colaborativa. Nao representa fama, pacientes ou desempenho
              comercial.
            </p>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Metric
              icon={<MessageSquare className="h-4 w-4" />}
              label="contribuicoes"
              value={profile.contributionCount}
            />
            <Metric
              icon={<Award className="h-4 w-4" />}
              label="respostas uteis"
              value={profile.usefulAnswerCount}
            />
            <Metric
              icon={<FileText className="h-4 w-4" />}
              label="artigos"
              value={profile.sharedArticleCount}
            />
            <Metric
              icon={<BookOpen className="h-4 w-4" />}
              label="referencias"
              value={profile.recommendedReferenceCount}
            />
          </section>

          <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
            <h2 className="text-sm font-extrabold text-synap-text">
              Identidade profissional
            </h2>
            <p className="mt-3 text-sm leading-6 text-synap-muted">
              Perfis da comunidade devem apoiar troca tecnica, educacao
              continuada e conduta etica entre profissionais da saude.
            </p>
            <Button className="mt-4 w-full" href="/nova-discussao">
              Criar discussao
            </Button>
          </section>
        </aside>
      </main>
    </CommunityShell>
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
    <div className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-synap-primary/10 text-synap-primary">
          {icon}
        </span>
        <span className="text-2xl font-extrabold text-synap-text">
          {value}
        </span>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-normal text-synap-muted">
        {label}
      </p>
    </div>
  );
}

function getInitials(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
