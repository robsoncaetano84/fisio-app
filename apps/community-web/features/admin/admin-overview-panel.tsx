"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  FileText,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCommunityAdminOverview } from "@/lib/community-write-api";

type AdminOverview = Awaited<ReturnType<typeof getCommunityAdminOverview>>;

const emptyOverview: AdminOverview = {
  metrics: {
    posts: 0,
    replies: 0,
    resources: 0,
    openReports: 0,
    notifications: 0,
  },
};

export function AdminOverviewPanel() {
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [status, setStatus] = useState<"loading" | "online" | "offline">(
    "loading",
  );

  useEffect(() => {
    let mounted = true;
    getCommunityAdminOverview()
      .then((result) => {
        if (!mounted) return;
        setOverview(result);
        setStatus("online");
      })
      .catch(() => {
        if (mounted) setStatus("offline");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const items = [
    {
      label: "Discussoes",
      value: overview.metrics.posts,
      icon: FileText,
    },
    {
      label: "Respostas",
      value: overview.metrics.replies,
      icon: MessageSquare,
    },
    {
      label: "Recursos",
      value: overview.metrics.resources,
      icon: Activity,
    },
    {
      label: "Denuncias abertas",
      value: overview.metrics.openReports,
      icon: ShieldAlert,
    },
    {
      label: "Notificacoes",
      value: overview.metrics.notifications,
      icon: Bell,
    },
  ];

  return (
    <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-synap-text">
            Metricas reais do backend
          </h2>
          <p className="mt-1 text-sm leading-6 text-synap-muted">
            Consulta protegida por RBAC no endpoint administrativo da
            comunidade.
          </p>
        </div>
        <Badge tone={status === "online" ? "primary" : "neutral"}>
          {status === "online"
            ? "Conectado"
            : status === "loading"
              ? "Carregando"
              : "Sessao admin necessaria"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              className="rounded-synap border border-synap-border bg-synap-background p-4"
              key={item.label}
            >
              <Icon className="h-4 w-4 text-synap-primary" />
              <p className="mt-3 text-2xl font-extrabold text-synap-text">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-normal text-synap-muted">
                {item.label}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
