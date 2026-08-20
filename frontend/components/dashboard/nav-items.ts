import type { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  Building01Icon,
  CreditCardIcon,
  HelpCircleIcon,
  HomeIcon,
  LeftToRightListBulletIcon,
  Settings01Icon,
  UserMultipleIcon,
  WorkHistoryIcon,
} from "@hugeicons/core-free-icons";

export type IconType = Parameters<typeof HugeiconsIcon>[0]["icon"];

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  /** Active-state predicate. Defaults to startsWith(href). */
  match?: (path: string) => boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: HomeIcon,
    match: (p) => p === "/dashboard",
  },
  { label: "Units", href: "/dashboard/units", icon: Building01Icon },
  {
    label: "Activity",
    href: "/dashboard/activity",
    icon: LeftToRightListBulletIcon,
  },
  {
    label: "Work orders",
    href: "/dashboard/work-orders",
    icon: WorkHistoryIcon,
  },
  { label: "Vendors", href: "/dashboard/vendors", icon: UserMultipleIcon },
  { label: "Reports", href: "/dashboard/reports", icon: AnalyticsUpIcon },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Billing", href: "/dashboard/billing", icon: CreditCardIcon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings01Icon },
  { label: "Help", href: "/dashboard/help", icon: HelpCircleIcon },
];

export function isNavActive(item: NavItem, pathname: string): boolean {
  return item.match ? item.match(pathname) : pathname.startsWith(item.href);
}
