'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Bell,
  Bot,
  BookOpen,
  Bookmark,
  FilePlus2,
  FolderOpen,
  Menu,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

const primaryLinks = [
  {
    href: '/categorias',
    label: 'Categorias',
    description: 'Areas tecnicas e especialidades',
    icon: FolderOpen,
  },
  {
    href: '/artigos',
    label: 'Artigos',
    description: 'Materiais cientificos compartilhados',
    icon: BookOpen,
  },
  {
    href: '/referencias',
    label: 'Referencias',
    description: 'Guidelines, livros e apoio tecnico',
    icon: BookOpen,
  },
  {
    href: '/colaboradores',
    label: 'Colaboradores',
    description: 'Reconhecimento saudavel',
    icon: Users,
  },
  {
    href: '/contribuicoes',
    label: 'Contribuicoes',
    description: 'Regras, niveis e badges',
    icon: Award,
  },
  {
    href: '/profissionais',
    label: 'Profissionais',
    description: 'Perfis e especialidades',
    icon: Users,
  },
  {
    href: '/ia',
    label: 'IA responsavel',
    description: 'Contratos e guardrails',
    icon: Bot,
  },
  {
    href: '/diretrizes',
    label: 'Diretrizes',
    description: 'Etica, LGPD e anonimizacao',
    icon: ShieldCheck,
  },
  {
    href: '/salvos',
    label: 'Salvos',
    description: 'Conteudos marcados localmente',
    icon: Bookmark,
  },
];

const secondaryLinks = [
  { href: '/novo-recurso', label: 'Compartilhar recurso' },
  { href: '/notificacoes', label: 'Notificacoes' },
  { href: '/contratos', label: 'Contratos' },
  { href: '/sessao', label: 'Sessao' },
  { href: '/perfil/equipe-synap', label: 'Perfil' },
  { href: '/moderacao', label: 'Moderacao' },
  { href: '/admin', label: 'Admin' },
];

export function MobileCommunityMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-synap text-synap-muted hover:bg-synap-primary/10 hover:text-synap-primary"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed inset-0 top-16 z-30 bg-synap-text/30 backdrop-blur-sm">
          <div className="ml-auto h-full w-full max-w-sm overflow-y-auto border-l border-synap-border bg-white p-4 shadow-synap">
            <form action="/busca" className="mb-4" onSubmit={() => setOpen(false)}>
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synap-muted" />
                <input
                  className="h-11 w-full rounded-synap border-synap-border bg-synap-background pl-10 pr-3 text-sm text-synap-text placeholder:text-synap-muted focus:border-synap-primary focus:ring-synap-primary"
                  name="q"
                  placeholder="Buscar na comunidade"
                  type="search"
                />
              </label>
            </form>

            <Link
              className="focus-ring flex h-11 items-center justify-center gap-2 rounded-synap bg-synap-primary px-4 text-sm font-extrabold text-white shadow-subtle"
              href="/nova-discussao"
              onClick={() => setOpen(false)}
            >
              <FilePlus2 className="h-4 w-4" />
              Nova discussao
            </Link>

            <nav className="mt-5 space-y-2" aria-label="Menu principal mobile">
              {primaryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    className="flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-3 transition hover:border-synap-primary/30 hover:bg-synap-primary/5"
                    href={item.href}
                    key={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-synap bg-white text-synap-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold text-synap-text">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-synap-muted">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 rounded-synap border border-synap-border p-3">
              <div className="mb-2 flex items-center gap-2 text-synap-primary">
                <Bell className="h-4 w-4" />
                <p className="text-sm font-extrabold text-synap-text">
                  Acessos rapidos
                </p>
              </div>
              <div className="grid gap-2">
                {secondaryLinks.map((item) => (
                  <Link
                    className="rounded-synap px-2 py-2 text-sm font-bold text-synap-muted transition hover:bg-synap-primary/10 hover:text-synap-primary"
                    href={item.href}
                    key={item.href}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
