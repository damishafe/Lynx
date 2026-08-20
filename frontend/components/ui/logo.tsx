import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/img/logo.png"
        alt="Lynx"
        width={32}
        height={32}
        priority
        className="rounded-[8px]"
      />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          Lynx
        </span>
      )}
    </span>
  );
}
