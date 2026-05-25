"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getCommunitySessionProfile,
  updateCommunitySessionProfile,
  type CommunitySessionProfile,
} from "@/lib/community-write-api";

type ProfileFormState = {
  displayName: string;
  profession: string;
  specialty: string;
  cityState: string;
  bio: string;
  areasOfPractice: string;
};

const emptyForm: ProfileFormState = {
  displayName: "",
  profession: "",
  specialty: "",
  cityState: "",
  bio: "",
  areasOfPractice: "",
};

export function SessionProfilePanel() {
  const [profile, setProfile] = useState<CommunitySessionProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [status, setStatus] = useState<"loading" | "ready" | "offline">(
    "loading",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCommunitySessionProfile()
      .then((result) => {
        if (!mounted) return;
        setProfile(result);
        setForm(profileToForm(result));
        setStatus("ready");
      })
      .catch(() => {
        if (mounted) setStatus("offline");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const canSave = useMemo(
    () => form.displayName.trim().length >= 2 && !saving,
    [form.displayName, saving],
  );

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!canSave) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateCommunitySessionProfile({
        displayName: form.displayName.trim(),
        profession: optionalText(form.profession),
        specialty: optionalText(form.specialty),
        cityState: optionalText(form.cityState),
        bio: form.bio.trim(),
        areasOfPractice: splitAreas(form.areasOfPractice),
      });
      setProfile(updated);
      setForm(profileToForm(updated));
      setMessage("Perfil profissional atualizado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o perfil agora.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 rounded-synap border border-synap-border bg-white p-5 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="primary">Perfil profissional</Badge>
            <Badge tone="secondary">Sincronizado</Badge>
          </div>
          <h2 className="text-base font-extrabold text-synap-text">
            Dados publicos na comunidade
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-synap-muted">
            Esses dados aparecem no perfil publico e ajudam outros profissionais
            a entender especialidade, areas de atuacao e contexto tecnico.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
          <UserRound className="h-5 w-5" />
        </div>
      </div>

      {status === "offline" ? (
        <p className="mt-4 rounded-synap border border-dashed border-synap-border bg-synap-background p-4 text-sm font-semibold text-synap-muted">
          Abra a comunidade via SSO ou faca login para carregar e editar o
          perfil sincronizado.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField
            label="Nome publico"
            onChange={(value) => updateField("displayName", value)}
            value={form.displayName}
          />
          <TextField
            label="Profissao"
            onChange={(value) => updateField("profession", value)}
            value={form.profession}
          />
          <TextField
            label="Especialidade"
            onChange={(value) => updateField("specialty", value)}
            value={form.specialty}
          />
          <TextField
            label="Cidade/estado"
            onChange={(value) => updateField("cityState", value)}
            value={form.cityState}
          />
          <TextField
            className="md:col-span-2"
            label="Areas de atuacao"
            onChange={(value) => updateField("areasOfPractice", value)}
            placeholder="Ortopedia, Dor cronica, Reabilitacao"
            value={form.areasOfPractice}
          />
          <TextArea
            className="md:col-span-2"
            label="Mini bio"
            onChange={(value) => updateField("bio", value)}
            value={form.bio}
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-synap-border pt-4">
        <div className="text-sm font-semibold text-synap-muted">
          {profile ? (
            <span>
              @{profile.username} · {profile.reputationScore} pontos ·{" "}
              {profile.contributionCount} contribuicoes
            </span>
          ) : (
            <span>
              {status === "loading" ? "Carregando perfil..." : "Sem perfil"}
            </span>
          )}
        </div>

        <button
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-synap bg-synap-primary px-4 text-sm font-semibold text-white shadow-subtle transition enabled:hover:bg-synap-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSave || status !== "ready"}
          onClick={() => void saveProfile()}
          type="button"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 rounded-synap border border-synap-border bg-synap-background p-3 text-sm font-semibold text-synap-text">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function TextField({
  className = "",
  label,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        {label}
      </span>
      <input
        className="focus-ring mt-2 h-11 w-full rounded-synap border border-synap-border bg-white px-3 text-sm font-semibold text-synap-text outline-none transition focus:border-synap-primary"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function TextArea({
  className = "",
  label,
  onChange,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-extrabold uppercase tracking-normal text-synap-muted">
        {label}
      </span>
      <textarea
        className="focus-ring mt-2 min-h-32 w-full resize-y rounded-synap border border-synap-border bg-white px-3 py-3 text-sm font-semibold leading-6 text-synap-text outline-none transition focus:border-synap-primary"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function profileToForm(profile: CommunitySessionProfile): ProfileFormState {
  return {
    displayName: profile.displayName || "",
    profession: profile.profession || "",
    specialty: profile.specialty || "",
    cityState: profile.cityState || "",
    bio: profile.bio || "",
    areasOfPractice: profile.areasOfPractice.join(", "),
  };
}

function splitAreas(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function optionalText(value: string): string | undefined {
  return value.trim() || undefined;
}
