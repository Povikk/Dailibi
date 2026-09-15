import { loadCaseFiles } from "./_load";

const GENERIC_PHRASES = [
  "rien n'était ce qu'il semblait",
  "un sentiment de malaise",
  "chacun avait quelque chose à cacher",
  "le temps semblait suspendu",
  "un frisson parcourut",
  "sans aucun doute",
  "dans l'ombre",
  "un mystère planait",
];

const cases = loadCaseFiles();
let flagged = 0;

for (const { file, data } of cases) {
  const hits: string[] = [];
  const corpus = collectText(data).toLowerCase();

  for (const phrase of GENERIC_PHRASES) {
    if (corpus.includes(phrase)) hits.push(`cliché : "${phrase}"`);
  }

  const categoryCount = new Map<string, number>();
  for (const clue of data.public.clues) {
    categoryCount.set(clue.analysis.category, (categoryCount.get(clue.analysis.category) ?? 0) + 1);
  }

  for (const [category, count] of categoryCount) {
    if (category !== "RED_HERRING" && count > 3) {
      hits.push(`${count} indices de type ${category} (varier davantage)`);
    }
  }

  const suspectsWithSecret = data.public.suspects.filter((s) =>
    data.public.interviews.some(
      (i) =>
        i.suspectId === s.id &&
        i.unlockedByClueId &&
        // Ciblé sur les mots du trope : /ment/ seul matchait "enregistrement",
        // "directement" ou "événements".
        /menti(?!on)|mensonge|secret|cach(?:er|é|ée)|honte/i.test(i.answer),
    ),
  );
  if (suspectsWithSecret.length === data.public.suspects.length && data.public.suspects.length >= 3) {
    hits.push("tous les suspects cachent un secret : varier les portraits");
  }

  if (hits.length) {
    flagged += 1;
    console.log(`\n[!] ${file} (${data.public.title})`);
    for (const hit of hits) console.log(`    - ${hit}`);
  }
}

console.log(`\n${cases.length} affaire(s), ${flagged} signalée(s).`);
if (flagged > 0) {
  console.error("Des clichés éditoriaux ont été détectés : publication bloquée.");
  process.exitCode = 1;
}
console.log("Métadonnées de diversité :");
const meta = cases.map((c) => c.data.meta);
logDistribution(meta, "crimeType");
logDistribution(meta, "locationType");
logDistribution(meta, "motiveType");
logDistribution(meta, "methodType");
logDistribution(meta, "coreMechanic");

function logDistribution(items: { [key: string]: string }[], key: string) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  const parts = [...counts.entries()].map(([k, v]) => `${k}×${v}`).join(", ");
  console.log(`  ${key}: ${parts}`);
}

function collectText(data: import("../src/types/case").CaseFile): string {
  const parts: string[] = [
    data.public.intro,
    data.public.incident,
    data.public.subtitle,
    ...data.public.suspects.map((s) => `${s.personality} ${s.claimedAlibi}`),
    ...data.public.interviews.map((i) => `${i.answer} ${i.beat ?? ""}`),
    ...data.public.clues.map((c) => `${c.title} ${c.summary} ${c.evidence.altText}`),
    data.solution.explanation,
    ...data.solution.reasoning,
  ];
  return parts.join("\n");
}
