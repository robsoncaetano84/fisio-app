"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  readLocalReports,
  reasonLabel,
  type LocalModerationReport,
  type ReportReason,
  type ReportTargetType,
  targetTypeLabel,
  writeLocalReports,
} from "@/features/moderation/local-reports";
import { createCommunityReport } from "@/lib/community-write-api";

type ReportContentButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  targetHref: string;
};

export function ReportContentButton({
  targetType,
  targetId,
  targetTitle,
  targetHref,
}: ReportContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("privacy");
  const [details, setDetails] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedSource, setSubmittedSource] = useState<
    "api" | "local" | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => confirmed && details.trim().length >= 10,
    [confirmed, details],
  );

  const submitReport = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const report: LocalModerationReport = {
      id: `report-${Date.now()}`,
      targetType,
      targetId,
      targetTitle,
      targetHref,
      reason,
      details: details.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    };

    try {
      await createCommunityReport({
        targetType,
        targetId,
        reason,
        details: details.trim(),
      });
      setSubmittedSource("api");
    } catch (error) {
      writeLocalReports([report, ...readLocalReports()]);
      setSubmittedSource("local");
      setSubmitError(
        error instanceof Error
          ? `${error.message}. A denuncia foi preservada localmente.`
          : "API indisponivel. A denuncia foi preservada localmente.",
      );
    } finally {
      setSubmitted(true);
      setDetails("");
      setConfirmed(false);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="focus-ring inline-flex h-9 items-center gap-2 rounded-synap border border-synap-border bg-white px-3 text-xs font-bold text-synap-muted transition hover:border-synap-accent/40 hover:text-synap-accent"
        onClick={() => {
          setIsOpen(true);
          setSubmitted(false);
        }}
        type="button"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Denunciar
      </button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-synap-text/40 p-4 sm:items-center"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-synap bg-white p-5 shadow-synap">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
                  {targetTypeLabel[targetType]}
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-synap-text">
                  Denunciar conteudo
                </h2>
              </div>
              <button
                aria-label="Fechar denuncia"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-synap text-synap-muted hover:bg-synap-background hover:text-synap-text"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="mt-5 rounded-synap border border-synap-primary/25 bg-synap-primary/10 p-4 text-sm font-semibold text-synap-primary">
                {submittedSource === "api"
                  ? "Denuncia enviada para moderacao."
                  : "Denuncia preservada localmente para revisao."}
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-3 rounded-synap border border-synap-accent/25 bg-synap-accent/10 p-4 text-sm font-semibold text-synap-text">
                {submitError}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-synap-text">
                  Motivo
                </span>
                <select
                  className="h-11 w-full rounded-synap border-synap-border text-sm focus:border-synap-primary focus:ring-synap-primary"
                  onChange={(event) =>
                    setReason(event.target.value as ReportReason)
                  }
                  value={reason}
                >
                  {Object.entries(reasonLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-synap-text">
                  Detalhes para moderacao
                </span>
                <textarea
                  className="min-h-28 w-full rounded-synap border-synap-border text-sm leading-6 focus:border-synap-primary focus:ring-synap-primary"
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Explique o problema de forma objetiva para a equipe de moderacao."
                  value={details}
                />
              </label>

              <label className="flex items-start gap-3 rounded-synap border border-synap-border bg-synap-background p-4">
                <input
                  checked={confirmed}
                  className="mt-1 rounded border-synap-border text-synap-primary focus:ring-synap-primary"
                  onChange={(event) => setConfirmed(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm font-semibold leading-6 text-synap-muted">
                  Confirmo que a denuncia tem objetivo de proteger a qualidade,
                  seguranca e etica da comunidade.
                </span>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-synap-border pt-4">
              <button
                className="focus-ring inline-flex h-10 items-center justify-center rounded-synap border border-synap-border bg-white px-4 text-sm font-semibold text-synap-text transition hover:border-synap-primary/40"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Fechar
              </button>
              <button
                className="focus-ring inline-flex h-10 items-center justify-center rounded-synap bg-synap-accent px-4 text-sm font-semibold text-white shadow-subtle transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit || isSubmitting}
                onClick={submitReport}
                type="button"
              >
                {isSubmitting ? "Enviando..." : "Registrar denuncia"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
