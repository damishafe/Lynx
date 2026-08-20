import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, RefreshIcon } from "@hugeicons/core-free-icons";

import { buttonClasses } from "@/components/ui/button";
import { launchDemo, resetAndLaunchDemo } from "@/app/demo/actions";

export function LaunchDemoButton({
  variant = "primary",
  label = "Launch Demo",
  mode = "launch",
  className,
}: {
  variant?: "primary" | "secondary";
  label?: string;
  /** "reset" wipes and reseeds the demo account before signing in. */
  mode?: "launch" | "reset";
  className?: string;
}) {
  const action = mode === "reset" ? resetAndLaunchDemo : launchDemo;
  return (
    <form action={action}>
      <button type="submit" className={buttonClasses({ variant, size: "md", className })}>
        <HugeiconsIcon icon={mode === "reset" ? RefreshIcon : PlayIcon} size={14} strokeWidth={2} />
        {label}
      </button>
    </form>
  );
}
