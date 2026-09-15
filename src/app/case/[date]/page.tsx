import { notFound } from "next/navigation";

import { InvestigationView } from "@/components/case/InvestigationView";
import { CaseReview } from "@/components/case/CaseReview";
import { isDailyKeyUnlocked, isValidDayKey } from "@/lib/daily";
import { findDatedCase, toClientCase } from "@/server/caseStore";

export const dynamic = "force-dynamic";

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ review?: string | string[] }>;
}): Promise<React.ReactElement> {
  const [{ date }, query] = await Promise.all([params, searchParams]);
  if (!isValidDayKey(date)) notFound();
  if (!isDailyKeyUnlocked(date)) notFound();

  const file = findDatedCase(date);
  if (!file) notFound();

  const caseData = toClientCase(file);
  return query.review === "1" ? (
    <CaseReview caseData={caseData} />
  ) : (
    <InvestigationView caseData={caseData} />
  );
}
