import { notFound } from "next/navigation";

import { InvestigationView } from "@/components/case/InvestigationView";
import { isDailyKeyUnlocked } from "@/lib/daily";
import { findCaseForDate, toClientCase } from "@/server/caseStore";

export const dynamic = "force-dynamic";

export default async function CasePage({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<React.ReactElement> {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  if (!isDailyKeyUnlocked(date)) notFound();

  const file = findCaseForDate(date);
  if (!file) notFound();

  return <InvestigationView caseData={toClientCase(file)} />;
}
