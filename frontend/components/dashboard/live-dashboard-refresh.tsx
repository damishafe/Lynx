"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function LiveDashboardRefresh({
  intervalMs = 2500,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  React.useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
