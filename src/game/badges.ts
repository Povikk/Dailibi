import type { DailibiStats, DayRecord, StreakState } from "@/lib/storage";

/**
 * Badge engine.
 *
 * Pure functions only: everything is derived from the locally stored player
 * state, so the same rules can run in the browser today and on the server
 * later, without rewriting them.
 */

export type BadgeFamily =
  | "progression"
  | "resolution"
  | "serie"
  | "precision"
  | "moyenne"
  | "rapidite"
  | "archives"
  | "methode";

export const BADGE_FAMILIES: Record<BadgeFamily, { label: string; tone: string }> = {
  progression: { label: "Progression", tone: "border-kraft-500/40 bg-kraft-500/10 text-kraft-300" },
  resolution: { label: "Résolution", tone: "border-good/40 bg-good/10 text-green-300" },
  serie: { label: "Séries", tone: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  precision: { label: "Précision", tone: "border-accent/40 bg-accent/10 text-accent-soft" },
  moyenne: { label: "Moyenne", tone: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  rapidite: { label: "Rapidité", tone: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300" },
  archives: { label: "Archives", tone: "border-ink-500/60 bg-ink-700/40 text-paper-300" },
  methode: { label: "Méthode", tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
};

/** Per-case exploration counts. Counts, not id lists, so the server can hold them. */
export type ProgressCount = {
  cluesFound: number;
  cluesTotal: number;
  suspectsSeen: number;
  suspectsTotal: number;
};

/**
 * Everything the rules look at. It is plain JSON on purpose: the same shape is
 * built in the browser and stored server-side, so both evaluate identical rules.
 */
export type BadgeContext = {
  stats: DailibiStats;
  streak: StreakState;
  archivesCount: number;
  progress: Record<string, ProgressCount>;
  notesCount: number;
};

export type BadgeDefinition = {
  id: string;
  label: string;
  description: string;
  family: BadgeFamily;
  points: number;
  /** Badge that grants an equippable title, shown in the global header. */
  title?: string;
  target: number;
  /** Current value, compared against `target` to unlock. */
  value: (ctx: BadgeContext) => number;
};

export type BadgeState = {
  badge: BadgeDefinition;
  value: number;
  target: number;
  unlocked: boolean;
};

export type Rank = {
  id: string;
  label: string;
  min: number;
};

export const RANKS: Rank[] = [
  { id: "auxiliaire", label: "Auxiliaire", min: 0 },
  { id: "enqueteur", label: "Enquêteur", min: 40 },
  { id: "inspecteur", label: "Inspecteur", min: 100 },
  { id: "limier", label: "Limier", min: 180 },
  { id: "commandant", label: "Commandant", min: 260 },
  { id: "legende", label: "Légende", min: 340 },
];

/* ------------------------------------------------------------------ */
/* Derivations                                                        */
/* ------------------------------------------------------------------ */

function percent(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0;
}

/** Avoids a "90 % de réussite" badge earned with a single lucky answer. */
function gatedPercent(correct: number, total: number, minPlayed: number): number {
  return total >= minPlayed ? Math.floor(percent(correct, total)) : 0;
}

function isSolved(record: DayRecord): boolean {
  return record.who && record.why && record.how;
}

function fastestSolvedSeconds(ctx: BadgeContext): number {
  const solved = ctx.stats.history.filter(isSolved);
  if (!solved.length) return Number.POSITIVE_INFINITY;
  return Math.min(...solved.map((record) => record.seconds));
}

function averageSeconds(ctx: BadgeContext): number {
  const history = ctx.stats.history;
  if (!history.length) return Number.POSITIVE_INFINITY;
  return history.reduce((sum, record) => sum + record.seconds, 0) / history.length;
}

function averageScore(ctx: BadgeContext): number {
  return ctx.stats.played > 0 ? ctx.stats.scoreSum / ctx.stats.played : 0;
}

function countFullyExplored(ctx: BadgeContext): number {
  return Object.values(ctx.progress).filter(
    (item) =>
      item.cluesTotal > 0 &&
      item.suspectsTotal > 0 &&
      item.cluesFound >= item.cluesTotal &&
      item.suspectsSeen >= item.suspectsTotal,
  ).length;
}

function countAllCluesRead(ctx: BadgeContext): number {
  return Object.values(ctx.progress).filter(
    (item) => item.cluesTotal > 0 && item.cluesFound >= item.cluesTotal,
  ).length;
}

function countAllSuspectsMet(ctx: BadgeContext): number {
  return Object.values(ctx.progress).filter(
    (item) => item.suspectsTotal > 0 && item.suspectsSeen >= item.suspectsTotal,
  ).length;
}

/* ------------------------------------------------------------------ */
/* The 50 badges                                                      */
/* ------------------------------------------------------------------ */

export const BADGES: BadgeDefinition[] = [
  /* --- progression : classer des affaires du jour ------------------ */
  { id: "prog_1", family: "progression", points: 5, target: 1, label: "Premier dossier", description: "Classer une affaire du jour.", value: (c) => c.stats.played },
  { id: "prog_3", family: "progression", points: 5, target: 3, label: "Trois jours de garde", description: "Classer 3 affaires du jour.", value: (c) => c.stats.played },
  { id: "prog_5", family: "progression", points: 5, target: 5, label: "Enquêteur", description: "Classer 5 affaires du jour.", title: "Enquêteur", value: (c) => c.stats.played },
  { id: "prog_10", family: "progression", points: 5, target: 10, label: "Inspecteur", description: "Classer 10 affaires du jour.", title: "Inspecteur", value: (c) => c.stats.played },
  { id: "prog_15", family: "progression", points: 5, target: 15, label: "Habitué du bureau", description: "Classer 15 affaires du jour.", value: (c) => c.stats.played },
  { id: "prog_20", family: "progression", points: 5, target: 20, label: "Limier", description: "Classer 20 affaires du jour.", title: "Limier", value: (c) => c.stats.played },
  { id: "prog_25", family: "progression", points: 5, target: 25, label: "Vingt-cinq dossiers", description: "Classer 25 affaires du jour.", value: (c) => c.stats.played },
  { id: "prog_30", family: "progression", points: 5, target: 30, label: "Doyen du dossier", description: "Classer toute la collection.", title: "Doyen du dossier", value: (c) => c.stats.played },

  /* --- résolution : les trois réponses justes --------------------- */
  { id: "res_1", family: "resolution", points: 10, target: 1, label: "Sans faute", description: "Résoudre une affaire avec les trois réponses justes.", title: "Sans faute", value: (c) => c.stats.perfect },
  { id: "res_3", family: "resolution", points: 10, target: 3, label: "Trois sans faute", description: "Résoudre 3 affaires parfaitement.", value: (c) => c.stats.perfect },
  { id: "res_5", family: "resolution", points: 10, target: 5, label: "Cinq sans faute", description: "Résoudre 5 affaires parfaitement.", value: (c) => c.stats.perfect },
  { id: "res_10", family: "resolution", points: 10, target: 10, label: "Dix sans faute", description: "Résoudre 10 affaires parfaitement.", title: "Œil de lynx", value: (c) => c.stats.perfect },
  { id: "res_15", family: "resolution", points: 10, target: 15, label: "Quinze sans faute", description: "Résoudre 15 affaires parfaitement.", value: (c) => c.stats.perfect },
  { id: "res_20", family: "resolution", points: 10, target: 20, label: "Vingt sans faute", description: "Résoudre 20 affaires parfaitement.", value: (c) => c.stats.perfect },
  { id: "res_25", family: "resolution", points: 10, target: 25, label: "Impeccable", description: "Résoudre 25 affaires parfaitement.", title: "Impeccable", value: (c) => c.stats.perfect },
  { id: "res_30", family: "resolution", points: 10, target: 30, label: "Dossier parfait", description: "Résoudre toute la collection parfaitement.", value: (c) => c.stats.perfect },

  /* --- séries ------------------------------------------------------ */
  { id: "serie_2", family: "serie", points: 8, target: 2, label: "Deux jours d'affilée", description: "Jouer deux jours consécutifs.", value: (c) => c.streak.bestStreak },
  { id: "serie_3", family: "serie", points: 8, target: 3, label: "Trio", description: "Jouer trois jours consécutifs.", value: (c) => c.streak.bestStreak },
  { id: "serie_5", family: "serie", points: 8, target: 5, label: "Assidu", description: "Jouer cinq jours consécutifs.", title: "Assidu", value: (c) => c.streak.bestStreak },
  { id: "serie_7", family: "serie", points: 8, target: 7, label: "Semaine pleine", description: "Jouer sept jours consécutifs.", value: (c) => c.streak.bestStreak },
  { id: "serie_10", family: "serie", points: 8, target: 10, label: "Marathonien", description: "Jouer dix jours consécutifs.", title: "Marathonien", value: (c) => c.streak.bestStreak },
  { id: "serie_15", family: "serie", points: 8, target: 15, label: "Inébranlable", description: "Jouer quinze jours consécutifs.", title: "Inébranlable", value: (c) => c.streak.bestStreak },

  /* --- précision par question ------------------------------------- */
  { id: "prec_who_50", family: "precision", points: 8, target: 50, label: "Qui, une fois sur deux", description: "50 % de bonnes réponses QUI sur au moins 5 affaires.", value: (c) => gatedPercent(c.stats.whoCorrect, c.stats.played, 5) },
  { id: "prec_who_75", family: "precision", points: 8, target: 75, label: "Qui, sans hésiter", description: "75 % de bonnes réponses QUI sur au moins 8 affaires.", value: (c) => gatedPercent(c.stats.whoCorrect, c.stats.played, 8) },
  { id: "prec_who_90", family: "precision", points: 8, target: 90, label: "Mémoire photographique", description: "90 % de bonnes réponses QUI sur au moins 10 affaires.", title: "Mémoire photographique", value: (c) => gatedPercent(c.stats.whoCorrect, c.stats.played, 10) },
  { id: "prec_why_50", family: "precision", points: 8, target: 50, label: "Mobile deviné", description: "50 % de bonnes réponses POURQUOI sur au moins 5 affaires.", value: (c) => gatedPercent(c.stats.whyCorrect, c.stats.played, 5) },
  { id: "prec_why_75", family: "precision", points: 8, target: 75, label: "Lecteur de mobiles", description: "75 % de bonnes réponses POURQUOI sur au moins 8 affaires.", value: (c) => gatedPercent(c.stats.whyCorrect, c.stats.played, 8) },
  { id: "prec_why_90", family: "precision", points: 8, target: 90, label: "Lecteur d'âmes", description: "90 % de bonnes réponses POURQUOI sur au moins 10 affaires.", title: "Lecteur d'âmes", value: (c) => gatedPercent(c.stats.whyCorrect, c.stats.played, 10) },
  { id: "prec_how_50", family: "precision", points: 8, target: 50, label: "Procédé entrevu", description: "50 % de bonnes réponses COMMENT sur au moins 5 affaires.", value: (c) => gatedPercent(c.stats.howCorrect, c.stats.played, 5) },
  { id: "prec_how_75", family: "precision", points: 8, target: 75, label: "Sens du détail", description: "75 % de bonnes réponses COMMENT sur au moins 8 affaires.", value: (c) => gatedPercent(c.stats.howCorrect, c.stats.played, 8) },
  { id: "prec_how_90", family: "precision", points: 8, target: 90, label: "Esprit de déduction", description: "90 % de bonnes réponses COMMENT sur au moins 10 affaires.", title: "Esprit de déduction", value: (c) => gatedPercent(c.stats.howCorrect, c.stats.played, 10) },

  /* --- moyenne générale ------------------------------------------- */
  { id: "avg_50", family: "moyenne", points: 10, target: 50, label: "Moyenne honorable", description: "50 % de score moyen sur au moins 3 affaires.", value: (c) => (c.stats.played >= 3 ? Math.floor(averageScore(c)) : 0) },
  { id: "avg_65", family: "moyenne", points: 10, target: 65, label: "Bon élève", description: "65 % de score moyen sur au moins 3 affaires.", value: (c) => (c.stats.played >= 3 ? Math.floor(averageScore(c)) : 0) },
  { id: "avg_80", family: "moyenne", points: 10, target: 80, label: "Rigueur", description: "80 % de score moyen sur au moins 5 affaires.", title: "Rigueur", value: (c) => (c.stats.played >= 5 ? Math.floor(averageScore(c)) : 0) },
  { id: "avg_90", family: "moyenne", points: 10, target: 90, label: "Orfèvre", description: "90 % de score moyen sur au moins 8 affaires.", title: "Orfèvre", value: (c) => (c.stats.played >= 8 ? Math.floor(averageScore(c)) : 0) },

  /* --- rapidité ---------------------------------------------------- */
  { id: "speed_600", family: "rapidite", points: 6, target: 1, label: "Moins de dix minutes", description: "Résoudre une affaire en moins de 10 minutes.", value: (c) => (fastestSolvedSeconds(c) <= 600 ? 1 : 0) },
  { id: "speed_300", family: "rapidite", points: 6, target: 1, label: "Moins de cinq minutes", description: "Résoudre une affaire en moins de 5 minutes.", value: (c) => (fastestSolvedSeconds(c) <= 300 ? 1 : 0) },
  { id: "speed_180", family: "rapidite", points: 6, target: 1, label: "Moins de trois minutes", description: "Résoudre une affaire en moins de 3 minutes.", value: (c) => (fastestSolvedSeconds(c) <= 180 ? 1 : 0) },
  { id: "speed_90", family: "rapidite", points: 6, target: 1, label: "Réflexe éclair", description: "Résoudre une affaire en moins de 90 secondes.", title: "Réflexe éclair", value: (c) => (fastestSolvedSeconds(c) <= 90 ? 1 : 0) },
  { id: "speed_avg_600", family: "rapidite", points: 6, target: 1, label: "Enquête expéditive", description: "Moins de 10 minutes de moyenne sur au moins 5 affaires.", value: (c) => (c.stats.played >= 5 && averageSeconds(c) <= 600 ? 1 : 0) },

  /* --- archives ---------------------------------------------------- */
  { id: "arch_1", family: "archives", points: 6, target: 1, label: "Coup d'œil en arrière", description: "Explorer une affaire archivée.", value: (c) => c.archivesCount },
  { id: "arch_5", family: "archives", points: 6, target: 5, label: "Cinq archives", description: "Explorer 5 affaires archivées.", value: (c) => c.archivesCount },
  { id: "arch_10", family: "archives", points: 6, target: 10, label: "Dix archives", description: "Explorer 10 affaires archivées.", value: (c) => c.archivesCount },
  { id: "arch_20", family: "archives", points: 6, target: 20, label: "Archiviste", description: "Explorer 20 affaires archivées.", title: "Archiviste", value: (c) => c.archivesCount },
  { id: "arch_30", family: "archives", points: 6, target: 30, label: "Mémoire du bureau", description: "Explorer toutes les affaires archivées.", value: (c) => c.archivesCount },

  /* --- méthode : fouiller le dossier ------------------------------ */
  { id: "method_clues_1", family: "methode", points: 8, target: 1, label: "Pièce par pièce", description: "Ouvrir toutes les pièces d'une affaire.", value: countAllCluesRead },
  { id: "method_clues_5", family: "methode", points: 8, target: 5, label: "Lecture intégrale", description: "Ouvrir toutes les pièces de 5 affaires.", value: countAllCluesRead },
  { id: "method_suspects_1", family: "methode", points: 8, target: 1, label: "Tous les témoins", description: "Interroger tous les suspects d'une affaire.", value: countAllSuspectsMet },
  { id: "method_complete_3", family: "methode", points: 8, target: 3, label: "Fourmi", description: "Explorer entièrement 3 affaires (pièces et suspects).", title: "Fourmi", value: countFullyExplored },
  { id: "method_notes_5", family: "methode", points: 8, target: 5, label: "Méthodique", description: "Prendre des notes sur 5 affaires.", title: "Méthodique", value: (c) => c.notesCount },
];

/* ------------------------------------------------------------------ */
/* Evaluation                                                         */
/* ------------------------------------------------------------------ */

export function evaluateBadge(badge: BadgeDefinition, ctx: BadgeContext): BadgeState {
  const raw = badge.value(ctx);
  const value = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  return {
    badge,
    value: Math.min(value, badge.target),
    target: badge.target,
    unlocked: value >= badge.target,
  };
}

export function evaluateAllBadges(ctx: BadgeContext): BadgeState[] {
  return BADGES.map((badge) => evaluateBadge(badge, ctx));
}

export function findBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find((badge) => badge.id === id);
}

/** Ids that are satisfied by the current state but not yet recorded. */
export function newlyEarnedBadges(
  ctx: BadgeContext,
  earned: Record<string, string>,
): string[] {
  return evaluateAllBadges(ctx)
    .filter((state) => state.unlocked && !(state.badge.id in earned))
    .map((state) => state.badge.id);
}

export function earnedPoints(earned: Record<string, string>): number {
  return BADGES.reduce(
    (sum, badge) => (badge.id in earned ? sum + badge.points : sum),
    0,
  );
}

export function totalPoints(): number {
  return BADGES.reduce((sum, badge) => sum + badge.points, 0);
}

export function rankFor(points: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (points >= rank.min) current = rank;
  }
  return current;
}

export function nextRank(points: number): Rank | undefined {
  return RANKS.find((rank) => rank.min > points);
}

/** Title labels unlocked by the earned badges, in a stable order. */
export function unlockedTitles(earned: Record<string, string>): string[] {
  return BADGES.filter((badge) => badge.title && badge.id in earned).map(
    (badge) => badge.title!,
  );
}

/** Resolves a stored selection (a badge id) to the title it grants. */
export function titleLabel(earned: Record<string, string>, selected: string | null): string | null {
  if (!selected || !(selected in earned)) return null;
  return findBadge(selected)?.title ?? null;
}

/** A stored title stays equipped only while its badge is still earned. */
export function resolveEquipped(
  earned: Record<string, string>,
  selected: string | null,
): string | null {
  return titleLabel(earned, selected) ? selected : null;
}

/* ------------------------------------------------------------------ */
/* Untrusted input                                                    */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), 1_000_000)
    : 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 120) : "";
}

function sanitizeRecord(value: unknown): DayRecord {
  const record = isRecord(value) ? value : {};
  return {
    date: text(record.date),
    caseId: text(record.caseId),
    score: num(record.score),
    who: bool(record.who),
    why: bool(record.why),
    how: bool(record.how),
    seconds: num(record.seconds),
  };
}

function sanitizeProgress(value: unknown): Record<string, ProgressCount> {
  if (!isRecord(value)) return {};
  const out: Record<string, ProgressCount> = {};
  for (const [caseId, entry] of Object.entries(value).slice(0, 200)) {
    if (!isRecord(entry)) continue;
    out[text(caseId)] = {
      cluesFound: num(entry.cluesFound),
      cluesTotal: num(entry.cluesTotal),
      suspectsSeen: num(entry.suspectsSeen),
      suspectsTotal: num(entry.suspectsTotal),
    };
  }
  return out;
}

/**
 * Coerces untrusted JSON — a client payload or a stored document — into a
 * usable context. Badges are cosmetic, so anything malformed becomes zero.
 */
export function sanitizeSnapshot(value: unknown): BadgeContext {
  const source = isRecord(value) ? value : {};
  const stats = isRecord(source.stats) ? source.stats : {};
  const streak = isRecord(source.streak) ? source.streak : {};

  return {
    stats: {
      played: num(stats.played),
      perfect: num(stats.perfect),
      whoCorrect: num(stats.whoCorrect),
      whyCorrect: num(stats.whyCorrect),
      howCorrect: num(stats.howCorrect),
      scoreSum: num(stats.scoreSum),
      history: Array.isArray(stats.history)
        ? stats.history
            .slice(0, 400)
            .map(sanitizeRecord)
            .filter((record) => record.date.length > 0 && record.caseId.length > 0)
        : [],
    },
    streak: {
      currentStreak: num(streak.currentStreak),
      bestStreak: num(streak.bestStreak),
      lastPlayedDate: typeof streak.lastPlayedDate === "string" ? text(streak.lastPlayedDate) : null,
    },
    archivesCount: num(source.archivesCount),
    progress: sanitizeProgress(source.progress),
    notesCount: num(source.notesCount),
  };
}
