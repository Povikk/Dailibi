import { loadCaseFiles } from "./_load";
import { validateCase, validateFairPlay } from "../src/case-engine/validateCase";
import { buildSolvabilityMatrix } from "../src/case-engine/solvability";
import { validateSolutionTimeline } from "../src/case-engine/timelineValidator";

let failed = 0;

for (const { file, data } of loadCaseFiles()) {
  const report = validateCase(data);
  const fairPlay = validateFairPlay(data);
  const matrix = buildSolvabilityMatrix(data);
  const timeline = validateSolutionTimeline(data);

  const errors = [...report.errors, ...fairPlay.filter((i) => i.level === "error")];
  const warnings = [
    ...report.warnings,
    ...fairPlay.filter((i) => i.level === "warning"),
    ...matrix.warnings.map((w) => ({ code: "matrix", message: w })),
    ...timeline.map((t) => ({ code: t.kind, message: `${t.time} ${t.message}` })),
  ];

  const ok = errors.length === 0 && timeline.length === 0;
  if (!ok) failed += 1;

  const status = ok ? "OK  " : "FAIL";
  console.log(`\n[${status}] ${file}  (${data.public.title})`);
  console.log(`       coupable=${data.solution.culpritId}  chaines=${matrix.culpritChains}`);

  for (const e of errors) console.log(`  x [${e.code}] ${e.message}`);
  for (const w of warnings) console.log(`  ! [${w.code}] ${w.message}`);
}

console.log(`\n${loadCaseFiles().length} affaire(s) analysée(s), ${failed} en échec.`);
if (failed > 0) process.exit(1);
