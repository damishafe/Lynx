import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

type AuthShellProps = {
  /** Bold headline shown over the dark image panel. */
  panelHeadline: string;
  /** Right-side form heading. */
  title: string;
  /** Right-side form subhead. */
  subtitle: string;
  /** The form (and any auxiliary content) goes here. */
  children: React.ReactNode;
  /** Footer slot below the form (e.g., "Already have an account? Login"). */
  footer?: React.ReactNode;
};

export function AuthShell({
  panelHeadline,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 rounded-[2rem] bg-white border border-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_30px_80px_-30px_rgba(0,0,0,0.18)] overflow-hidden">
      {/* LEFT — dark visual panel */}
      <div className="relative bg-[#09090B] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden min-h-[20rem] lg:min-h-0">
        {/* Hand-holding-house photograph as moody backdrop */}
        <div className="absolute inset-0">
          <Image
            src="/img/hand.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-center opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090B] via-[#09090B]/30 to-[#09090B]/85" />
        </div>

        <div className="relative">
          <Link
            href="/"
            className="cursor-pointer inline-flex items-center gap-2.5 text-white"
          >
            <Logo showWordmark={false} />
            <span className="text-lg font-semibold tracking-tight">
              Lynx
            </span>
          </Link>
        </div>

        <h2 className="relative text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.05] max-w-md">
          {panelHeadline}
        </h2>
      </div>

      {/* RIGHT — form panel, vertically centered, content max-width capped */}
      <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 leading-[1.05]">
              {title}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col gap-6">
            {children}
          </div>

          {footer && (
            <div className="mt-6 pt-6 border-t border-gray-100">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
