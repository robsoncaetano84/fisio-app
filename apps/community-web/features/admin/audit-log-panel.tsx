"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getCommunityAuditLogs,
  type CommunityAuditLogItem,
} from "@/lib/community-write-api";

export function AuditLogPanel() {
  const [logs, setLogs] = useState<CommunityAuditLogItem[]>([]);
  const [status, setStatus] = useState<"loading" | "online" | "offline">(
    "loading",
  );

  useEffect(() => {
    let mounted = true;
    getCommunityAuditLogs()
      .then((items) => {
        if (!mounted) return;
        setLogs(items);
        setStatus("online");
      })
      .catch(() => {
        if (mounted) setStatus("offline");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-synap-primary">
          <Database className="h-5 w-5" />
          <h2 className="text-sm font-extrabold text-synap-text">
            Auditoria real
          </h2>
        </div>
        <Badge tone={status === "online" ? "primary" : "neutral"}>
          {status === "online"
            ? "Conectada"
            : status === "loading"
              ? "Carregando"
              : "Sessao admin necessaria"}
        </Badge>
      </div>

      <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {logs.length > 0 ? (
          logs.slice(0, 20).map((log) => (
            <article
              className="rounded-synap border border-synap-border bg-synap-background p-3"
              key={log.id}
            >
              <p className="break-words text-xs font-extrabold text-synap-text">
                {log.event}
              </p>
              <p className="mt-1 text-xs leading-5 text-synap-muted">
                {formatDate(log.createdAt)} · {log.actorRole || "system"} ·{" "}
                {log.targetType || "sem alvo"}
              </p>
              {log.targetId ? (
                <Badge tone="neutral">{log.targetId}</Badge>
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-synap border border-dashed border-synap-border bg-synap-background p-4 text-sm font-semibold text-synap-muted">
            Nenhum evento carregado.
          </p>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
