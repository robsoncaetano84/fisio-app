import Link from 'next/link';
import { CheckCircle2, ShieldCheck, TriangleAlert } from 'lucide-react';

type EthicsGuidelinesCardProps = {
  compact?: boolean;
};

const checklist = [
  'Remover nome, documento, telefone, endereco e dados de contato.',
  'Evitar datas completas, local exato de atendimento e detalhes raros.',
  'Nao publicar imagens, exames ou arquivos com identificacao visivel.',
  'Descrever contexto clinico apenas no nivel necessario para a discussao.',
  'Revisar se a combinacao de detalhes pode reconhecer o paciente.',
];

const conductRules = [
  'Use linguagem profissional, tecnica e acolhedora.',
  'Declare limites da resposta quando nao houver dados suficientes.',
  'Nao substitua avaliacao individualizada por orientacao generica.',
  'Priorize referencias, criterios de reavaliacao e seguranca clinica.',
];

export function EthicsGuidelinesCard({
  compact = false,
}: EthicsGuidelinesCardProps) {
  return (
    <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-synap-text">
            Diretrizes eticas e anonimizacao
          </h2>
          <p className="mt-2 text-sm leading-6 text-synap-muted">
            A comunidade SYNAP e um ambiente profissional e educacional. Nao
            publique dados identificaveis de pacientes e nao use discussoes
            como substitutas de avaliacao clinica individualizada.
          </p>
        </div>
      </div>

      <div className={compact ? 'mt-4' : 'mt-5 grid gap-4 md:grid-cols-2'}>
        <GuidelineList
          icon={<TriangleAlert className="h-4 w-4" />}
          items={checklist}
          title="Checklist antes de publicar"
        />
        {!compact ? (
          <GuidelineList
            icon={<CheckCircle2 className="h-4 w-4" />}
            items={conductRules}
            title="Conduta esperada"
          />
        ) : null}
      </div>

      {compact ? (
        <Link
          className="mt-4 inline-flex text-xs font-extrabold text-synap-primary hover:text-synap-primaryDark"
          href="/diretrizes"
        >
          Ver diretrizes completas
        </Link>
      ) : null}
    </section>
  );
}

function GuidelineList({
  icon,
  items,
  title,
}: {
  icon: React.ReactNode;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-4">
      <div className="mb-3 flex items-center gap-2 text-synap-primary">
        {icon}
        <h3 className="text-sm font-extrabold text-synap-text">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="flex gap-2 text-sm leading-6 text-synap-muted" key={item}>
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-synap-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
