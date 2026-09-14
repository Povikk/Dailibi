"use client";

import { useEffect, useState } from "react";

import { msUntilNextRollover } from "@/lib/daily";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setRemaining(msUntilNextRollover());
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-xs text-paper-300/60">
      Prochaine affaire dans :{" "}
      <span className="font-mono font-bold tabular-nums text-paper-100" suppressHydrationWarning>
        {remaining === null ? "--:--:--" : format(remaining)}
      </span>
    </p>
  );
}