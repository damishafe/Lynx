import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { MobileNav } from "@/components/ui/mobile-nav";

const navItems = [
  { label: "Home", href: "#" },
  { label: "Platform", href: "#platform", active: true },
  { label: "Who we are", href: "#who" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

export function Header() {
  return (
    <header className="flex items-center justify-between gap-6">
      <Link href="/" className="cursor-pointer">
        <Logo />
      </Link>
      <nav className="hidden md:flex items-center gap-7">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              item.active
                ? "cursor-pointer text-sm font-semibold text-zinc-900 transition-colors"
                : "cursor-pointer text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {/* Desktop auth */}
      <div className="hidden md:flex items-center gap-2">
        <Link
          href="/login"
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          Sign up
        </Link>
      </div>
      {/* Mobile: sign-up + hamburger */}
      <div className="flex md:hidden items-center gap-2">
        <Link
          href="/signup"
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          Sign up
        </Link>
        <MobileNav items={navItems} />
      </div>
    </header>
  );
}
