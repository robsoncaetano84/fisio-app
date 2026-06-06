import { Platform, type ViewStyle } from "react-native";

export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const dt = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("pt-BR");
};

export const toLocal = (v: string) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

export const compareStr = (a: string, b: string) =>
  a.localeCompare(b, "pt-BR", { sensitivity: "base" });

export const compareDateStr = (a: string, b: string) => {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return compareStr(a, b);
  return ta - tb;
};

export const formatDurationMs = (value: number) => {
  if (!value || value <= 0) return "-";
  const minutes = value / 60000;
  if (minutes < 1) return `${Math.round(value / 1000)}s`;
  return `${minutes.toFixed(1)}min`;
};

export const webStickyHeaderStyle: ViewStyle | null =
  Platform.OS === "web"
    ? ({
        top: 0,
        zIndex: 5,
        position: "sticky" as const,
        boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
      } as unknown as ViewStyle)
    : null;
