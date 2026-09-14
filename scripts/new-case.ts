import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

/**
 * Interactive authoring helper. It creates a folder under case-authoring/
 * with a truth-first template: define the solution BEFORE writing clues.
 *
 * Usage: npm run case:new -- "titre-de-l-affaire"
 */

const CASES_DIR = join(process.cwd(), "data", "cases");
const AUTHORING_DIR = join(process.cwd(), "case-authoring");

const slugArg = process.argv[2];

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  const slug = sanitize(slugArg ?? (await rl.question("Identifiant de l'affaire (slug) : ")));
  const title = (await rl.question("Titre affiché : ")).trim() || slug.toUpperCase();
  const number = Number(
    (await rl.question(`Numéro (défaut ${nextNumber()}) : `)).trim() || nextNumber(),
  );

  rl.close();

  if (!slug) {
    console.error("Identifiant requis.");
    process.exit(1);
  }
  if (existsSync(join(CASES_DIR, `${slug}.json`))) {
    console.error(`Une affaire ${slug}.json existe déjà.`);
    process.exit(1);
  }

  const template = readFileSync(join(AUTHORING_DIR, "template.json"), "utf8")
    .replaceAll("__ID__", slug)
    .replaceAll("__TITLE__", title)
    .replaceAll("__NUMBER__", String(number))
    .replaceAll("__DATE__", new Date().toISOString().slice(0, 10));

  const draftPath = join(AUTHORING_DIR, "drafts", `${slug}.json`);
  mkdirSync(join(AUTHORING_DIR, "drafts"), { recursive: true });
  writeFileSync(draftPath, template, "utf8");

  console.log(`\nBrouillon créé : ${draftPath}`);
  console.log("1. Remplissez le bloc solution (la vérité d'abord).");
  console.log("2. Construisez les suspects, puis les indices.");
  console.log(`3. Déplacez le fichier vers data/cases/${slug}.json.`);
  console.log("4. Lancez : npm run case:validate");
}

function nextNumber(): number {
  if (!existsSync(CASES_DIR)) return 1;
  const files = readdirSync(CASES_DIR);
  let max = 0;
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const raw = JSON.parse(readFileSync(join(CASES_DIR, file), "utf8"));
    max = Math.max(max, raw?.public?.number ?? 0);
  }
  return max + 1;
}

function sanitize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

void main();
