import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { loadCaseFiles } from "./_load";

/**
 * Guards the public/private boundary on the real build output.
 *
 * The unit tests check the projection functions; this script checks that the
 * shipped client bundles actually contain none of it. Run it after
 * `npm run build:cloudflare`.
 */

const CLIENT_DIR = join(process.cwd(), "dist", "client");

/** Tokens that only exist in the private half of a case file. */
const FORBIDDEN_TOKENS = [
  "implicates",
  "supportsMotiveOf",
  "supportsMethodOf",
  "unlocksInterviewIds",
  "validationAnswers",
  "correctMotive",
  "correctMethod",
  "isRedHerring",
  "culpritId",
];

function clientBundles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|mjs|cjs)$/.test(entry.name)) out.push(full);
    }
  };
  walk(CLIENT_DIR);
  return out;
}

try {
  statSync(CLIENT_DIR);
} catch {
  console.error(
    `dist/client introuvable. Lancez d'abord "npm run build:cloudflare".`,
  );
  process.exit(1);
}

const files = clientBundles();
if (!files.length) {
  console.error("Aucun bundle JavaScript trouvé dans dist/client.");
  process.exit(1);
}

const corpus = files.map((file) => readFileSync(file, "utf8")).join("\n");
const failures: string[] = [];

for (const token of FORBIDDEN_TOKENS) {
  if (corpus.includes(token)) {
    failures.push(`symbole privé "${token}" présent dans le bundle client`);
  }
}

for (const { file, data } of loadCaseFiles()) {
  const explanation = data.solution.explanation.slice(0, 50);
  if (explanation && corpus.includes(explanation)) {
    failures.push(`${file} : le texte de la solution fuit dans le bundle client`);
  }
  const leakedEntry = data.solution.correctTimeline.find((entry) => {
    const text = entry.text.slice(0, 40);
    return text.length > 0 && corpus.includes(text);
  });
  if (leakedEntry) {
    failures.push(`${file} : la chronologie réelle fuit dans le bundle client`);
  }
}

if (failures.length) {
  console.error("Vérification du build échouée :");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `${files.length} bundle(s) client vérifié(s) : aucune donnée privée exposée.`,
);
