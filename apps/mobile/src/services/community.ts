import { Platform } from "react-native";
import { api } from "./api";

export type CommunitySsoResponse = {
  oneTimeToken: string;
  expiresAt: string;
  redirectUrl: string;
};

const defaultCommunityWebUrl = Platform.select({
  android: "http://192.168.2.100:3002",
  ios: "http://localhost:3002",
  default: "http://localhost:3002",
});

const isAndroidEmulator = (() => {
  if (Platform.OS !== "android") return false;
  const constants =
    (Platform as { constants?: Record<string, unknown> })?.constants || {};
  const fingerprint = String(constants.Fingerprint || constants.fingerprint || "");
  const model = String(constants.Model || constants.model || "");
  return (
    /generic|emulator|sdk_gphone/i.test(fingerprint) ||
    /emulator|sdk/i.test(model)
  );
})();

const normalizeCommunityUrlForAndroidEmulator = (url: string) => {
  if (!isAndroidEmulator || !url) return url;

  return url
    .replace("http://localhost:", "http://10.0.2.2:")
    .replace("https://localhost:", "https://10.0.2.2:")
    .replace("http://127.0.0.1:", "http://10.0.2.2:")
    .replace("https://127.0.0.1:", "https://10.0.2.2:")
    .replace("http://192.168.2.100:", "http://10.0.2.2:");
};

export const getCommunityWebUrl = () =>
  normalizeCommunityUrlForAndroidEmulator(
    (
      process.env.EXPO_PUBLIC_COMMUNITY_WEB_URL ||
      defaultCommunityWebUrl ||
      ""
    ).trim(),
  ).replace(/\/$/, "");

const sanitizeReturnTo = (returnTo?: string) => {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }
  return returnTo;
};

export async function createCommunitySsoSession(returnTo = "/") {
  const normalizedReturnTo = sanitizeReturnTo(returnTo);
  const response = await api.post<CommunitySsoResponse>("/auth/community-sso", {
    returnTo: normalizedReturnTo,
    deviceContext: {
      platform: Platform.OS,
      source: "synap-mobile-webview",
    },
  });

  return response.data;
}

export function buildCommunitySsoCallbackUrl(
  sso: CommunitySsoResponse,
  returnTo = "/",
) {
  // Preferir o redirectUrl emitido pelo backend: ele e a fonte unica da URL
  // da comunidade (COMMUNITY_WEB_URL) e ja vem com token/source/returnTo
  // sanitizados. Montar a URL no cliente usava EXPO_PUBLIC_COMMUNITY_WEB_URL
  // embutida no build estatico — em producao apontava para localhost:3002.
  const fromBackend = String(sso.redirectUrl || "").trim();
  if (/^https?:\/\//i.test(fromBackend)) {
    return normalizeCommunityUrlForAndroidEmulator(fromBackend);
  }
  // Fallback (backend antigo sem redirectUrl): monta localmente.
  const token = encodeURIComponent(sso.oneTimeToken);
  const next = encodeURIComponent(sanitizeReturnTo(returnTo));
  return `${getCommunityWebUrl()}/sso/callback?token=${token}&source=synap-app&returnTo=${next}`;
}
