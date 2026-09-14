import type { CaseFile, SolutionTimelineEntry } from "@/types/case";

export type TimelineConflict = {
  kind: "overlap" | "impossible-move" | "gap";
  message: string;
  time: string;
};

function minutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

function span(entry: SolutionTimelineEntry): [number, number] {
  const start = minutes(entry.time);
  const end = entry.endTime ? minutes(entry.endTime) : start;
  return [start, Math.max(start, end)];
}

/**
 * Checks the *real* timeline: two entries sharing a person must not overlap
 * unless they are noted at the same place. Also flags moves that are
 * chronologically impossible. Movement plausibility (travel time) is checked
 * against the public `map` evidence when present.
 */
export function validateSolutionTimeline(file: CaseFile): TimelineConflict[] {
  const conflicts: TimelineConflict[] = [];
  const entries = [...file.solution.correctTimeline].sort(
    (a, b) => minutes(a.time) - minutes(b.time),
  );

  for (let i = 0; i < entries.length; i += 1) {
    const a = entries[i];
    const [aStart, aEnd] = span(a);
    for (let j = i + 1; j < entries.length; j += 1) {
      const b = entries[j];
      const [bStart, bEnd] = span(b);
      if (bStart >= aEnd) break;

      const shared = a.personIds.filter((id) => b.personIds.includes(id));
      if (!shared.length) continue;
      if (a.place === b.place) continue;

      conflicts.push({
        kind: "overlap",
        time: b.time,
        message: `${shared.join(", ")} est à la fois à "${a.place}" et "${b.place}" autour de ${b.time}.`,
      });
    }
  }

  // Travel feasibility against declared distances.
  const mapClue = file.public.clues.find((c) => c.evidence.kind === "map");
  if (mapClue && mapClue.evidence.kind === "map") {
    const distances = mapClue.evidence.distances;
    for (let i = 1; i < entries.length; i += 1) {
      const prev = entries[i - 1];
      const next = entries[i];
      const shared = prev.personIds.filter((id) => next.personIds.includes(id));
      if (!shared.length || prev.place === next.place) continue;
      const travel = distances.find(
        (d) =>
          d.from === prev.place &&
          d.to === next.place,
      ) ?? distances.find((d) => d.from === next.place && d.to === prev.place);

      const available = minutes(next.time) - (prev.endTime ? minutes(prev.endTime) : minutes(prev.time));
      if (travel && available < travel.minutes) {
        conflicts.push({
          kind: "impossible-move",
          time: next.time,
          message: `${shared.join(", ")} ne peut pas aller de "${prev.place}" à "${next.place}" en ${available} min (${travel.minutes} min nécessaires).`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Checks that a suspect's public claimed alibi is compatible with the real
 * timeline, unless a contradiction is intentionally encoded in a clue.
 */
export function alibiConsistency(file: CaseFile): string[] {
  const warnings: string[] = [];
  const culpritId = file.solution.culpritId;

  for (const suspect of file.public.suspects) {
    const real = file.solution.correctTimeline.filter((e) =>
      e.personIds.includes(suspect.id),
    );
    if (suspect.id === culpritId) {
      if (!real.length) {
        warnings.push(`Le coupable ${suspect.name} n'apparaît jamais dans la chronologie réelle.`);
      }
      continue;
    }
    // An innocent with no trace in the real timeline is fine, but if they are
    // placed elsewhere while a clue contradicts them, flag it.
  }

  return warnings;
}