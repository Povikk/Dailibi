import { formatKey } from "@/lib/format";

export function buildShareText(params: {
  number: number;
  date: string;
  perKind: { suspect: boolean; motive: boolean; method: boolean };
  score: number;
  correct: number;
  total: number;
  streak: number;
}): string {
  const { number, perKind, score, correct, total, streak } = params;
  const cell = (ok: boolean) => (ok ? "\u{1F7E9}" : "\u{1F7E5}");
  const lines = [
    `DAILIBI #${String(number).padStart(3, "0")}`,
    `${cell(perKind.suspect)} QUI`,
    `${cell(perKind.motive)} POURQUOI`,
    `${cell(perKind.method)} COMMENT`,
    "",
    `\u{1F50E} ${correct}/${total}`,
    `\u{1F3AF} ${score} %`,
  ];
  if (streak > 0) lines.push(`\u{1F525} ${streak} jour${streak > 1 ? "s" : ""}`);
  lines.push("", "https://dailibi.povik.workers.dev");
  return lines.join("\n");
}

export function buildArchiveLabel(number: number, date: string): string {
  return `#${String(number).padStart(3, "0")} · ${formatKey(date)}`;
}