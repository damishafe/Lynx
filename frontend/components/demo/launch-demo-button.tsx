import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";

import { buttonClasses } from "@/components/ui/button";
import { launchDemo } from "@/app/demo/actions";

export function LaunchDemoButton({
  variant = "primary",
  label = "Launch Demo",
  className,
}: {
  variant?: "primary" | "secondary";
  label?: string;
  className?: string;
}) {
  return (
    <form action={launchDemo}>
      <button
        type="submit"
        className={buttonClasses({ variant, size: "md", className })}
      >
        <HugeiconsIcon icon={PlayIcon} size={14} strokeWidth={2} />
        {label}
      </button>
    </form>
  );
}
