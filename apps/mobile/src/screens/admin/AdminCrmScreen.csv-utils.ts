import { Platform } from "react-native";

export const csvEscape = (value: unknown) => {
  const str = String(value ?? "");
  if (/[\";\n,]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: Array<Record<string, unknown>>,
) => {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const csv = [
    headers.join(";"),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(";")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
