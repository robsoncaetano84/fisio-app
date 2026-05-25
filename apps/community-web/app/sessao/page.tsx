import type { Metadata } from "next";
import { CommunityShell } from "@/components/community/community-shell";
import { SessionProfilePanel } from "@/features/auth/session-profile-panel";
import { SessionStatusPanel } from "@/features/auth/session-status-panel";

export const metadata: Metadata = {
  title: "Sessao | SYNAP Comunidade",
  description:
    "Estado local do SSO e contratos de sincronizacao de perfil da comunidade SYNAP.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SessionPage() {
  return (
    <CommunityShell>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <SessionStatusPanel />
        <SessionProfilePanel />
      </main>
    </CommunityShell>
  );
}
