"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  type LocalModerationReport,
  readLocalReports,
  type ReportReason,
  reasonLabel,
  REPORTS_UPDATED_EVENT,
  type ReportStatus,
  type ReportTargetType,
  targetTypeLabel,
  writeLocalReports,
} from "@/features/moderation/local-reports";
import {
  getCommunityModerationReports,
  updateCommunityModerationReport,
  type CommunityModerationReportItem,
} from "@/lib/community-write-api";

const statusLabel: Record<ReportStatus, string> = {
  open: "Aberta",
  reviewing: "Em revisao",
  resolved: "Resolvida",
};

const statusTone: Record<ReportStatus, "primary" | "secondary" | "accent"> = {
  open: "accent",
  reviewing: "secondary",
  resolved: "primary",
};

export function ModerationDashboard() {
  const [reports, setReports] = useState<LocalModerationReport[]>([]);

  useEffect(() => {
    let mounted = true;
    const syncReports = async () => {
      try {
        const remoteReports = await getCommunityModerationReports();
        if (!mounted) return;
        setReports(remoteReports.map(mapRemoteReport));
      } catch {
        if (mounted) setReports(readLocalReports());
      }
    };
    syncReports();

    window.addEventListener(REPORTS_UPDATED_EVENT, syncReports);
    window.addEventListener("storage", syncReports);

    return () => {
      mounted = false;
      window.removeEventListener(REPORTS_UPDATED_EVENT, syncReports);
      window.removeEventListener("storage", syncReports);
    };
  }, []);

  const counts = useMemo(
    () => ({
      open: reports.filter((report) => report.status === "open").length,
      reviewing: reports.filter((report) => report.status === "reviewing")
        .length,
      resolved: reports.filter((report) => report.status === "resolved").length,
    }),
    [reports],
  );

  const updateStatus = async (reportId: string, status: ReportStatus) => {
    const updated = reports.map((report) =>
      report.id === reportId ? { ...report, status } : report,
    );
    setReports(updated);
    writeLocalReports(updated);
    try {
      await updateCommunityModerationReport(reportId, {
        status: mapLocalStatusToRemote(status),
      });
    } catch {
      // Local fallback keeps moderation usable while auth/API is unavailable.
    }
  };

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel title="Denuncias abertas" value={counts.open} tone="accent" />
        <Panel title="Em revisao" value={counts.reviewing} tone="secondary" />
        <Panel title="Resolvidas" value={counts.resolved} tone="primary" />
      </div>

      <section className="mt-6">
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <article
                className="rounded-synap border border-synap-border bg-white p-4 shadow-subtle"
                key={report.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusTone[report.status]}>
                        {statusLabel[report.status]}
                      </Badge>
                      <Badge>{targetTypeLabel[report.targetType]}</Badge>
                    </div>
                    <h2 className="mt-3 text-sm font-extrabold leading-6 text-synap-text">
                      {report.targetTitle}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-synap-muted">
                      {reasonLabel[report.reason]}
                    </p>
                  </div>
                  <Link
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-primary/40 hover:text-synap-primary"
                    href={report.targetHref}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Abrir
                  </Link>
                </div>

                <p className="mt-3 rounded-synap bg-synap-background p-3 text-sm leading-6 text-synap-text">
                  {report.details}
                </p>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-synap-border pt-4">
                  <button
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-text transition hover:border-synap-secondary/40 hover:text-synap-secondary"
                    onClick={() => void updateStatus(report.id, "reviewing")}
                    type="button"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Em revisao
                  </button>
                  <button
                    className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap bg-synap-primary px-3 text-xs font-bold text-white shadow-subtle transition hover:bg-synap-primaryDark"
                    onClick={() => void updateStatus(report.id, "resolved")}
                    type="button"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolver
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-synap border border-dashed border-synap-border p-6">
            <div className="flex items-center gap-2 text-synap-accent">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-base font-extrabold text-synap-text">
                Nenhuma denuncia pendente
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-synap-muted">
              As denuncias registradas aparecem aqui quando houver itens
              pendentes de revisao.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function mapRemoteReport(
  report: CommunityModerationReportItem,
): LocalModerationReport {
  return {
    id: report.id,
    targetType: mapTargetType(report.targetType),
    targetId: report.targetId,
    targetTitle: report.targetTitle,
    targetHref: report.targetHref,
    reason: mapReason(report.reason),
    details: report.details || "Sem detalhes adicionais.",
    status: mapRemoteStatus(report.status),
    createdAt: report.createdAt,
  };
}

function mapRemoteStatus(
  status: CommunityModerationReportItem["status"],
): ReportStatus {
  if (status === "IN_REVIEW") return "reviewing";
  if (status === "RESOLVED" || status === "DISMISSED") return "resolved";
  return "open";
}

function mapLocalStatusToRemote(
  status: ReportStatus,
): CommunityModerationReportItem["status"] {
  if (status === "reviewing") return "IN_REVIEW";
  if (status === "resolved") return "RESOLVED";
  return "OPEN";
}

function mapReason(reason: string): ReportReason {
  if (["privacy", "spam", "ethics", "unsafe", "other"].includes(reason)) {
    return reason as ReportReason;
  }
  return "other";
}

function mapTargetType(targetType: string): ReportTargetType {
  if (["post", "reply", "resource", "profile"].includes(targetType)) {
    return targetType as ReportTargetType;
  }
  return "post";
}

function Panel({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "primary" | "secondary" | "accent";
}) {
  return (
    <div className="rounded-synap border border-synap-border bg-synap-background p-4">
      <Badge tone={tone}>{title}</Badge>
      <p className="mt-4 text-3xl font-extrabold text-synap-text">{value}</p>
    </div>
  );
}
