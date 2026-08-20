// Temporary mock dataset for the /dashboard overview. Swap this for a Mongo
// query against a `payouts` collection when the backend lands. The shape is
// intentionally close to what a real document would look like.

export type PayoutStatus = "completed" | "failed" | "pending";

export type Payout = {
  id: string;
  vendor: string;
  category: string;
  /** Single-letter avatar for the vendor row. */
  initials: string;
  /** Tone for the avatar tile background. */
  tone: "violet" | "emerald" | "amber" | "rose" | "sky" | "ink";
  /** Cents — positive for incoming, negative for outgoing. Display formats. */
  amountCents: number;
  occurredAt: string; // ISO
  status: PayoutStatus;
};

export const recentPayouts: Payout[] = [
  {
    id: "p_01",
    vendor: "Bolt Suppliers",
    category: "Inventory",
    initials: "B",
    tone: "violet",
    amountCents: -842000,
    occurredAt: "2026-09-09T16:30:00Z",
    status: "completed",
  },
  {
    id: "p_02",
    vendor: "Northbeam Coffee Co.",
    category: "Vendor",
    initials: "N",
    tone: "emerald",
    amountCents: -215000,
    occurredAt: "2026-09-08T15:13:00Z",
    status: "completed",
  },
  {
    id: "p_03",
    vendor: "Lightspeed POS",
    category: "Software",
    initials: "L",
    tone: "amber",
    amountCents: -149900,
    occurredAt: "2026-09-07T13:00:00Z",
    status: "failed",
  },
  {
    id: "p_04",
    vendor: "Stripe",
    category: "Processing",
    initials: "S",
    tone: "sky",
    amountCents: 1456200,
    occurredAt: "2026-09-06T07:00:00Z",
    status: "completed",
  },
  {
    id: "p_05",
    vendor: "Hostfully",
    category: "Software",
    initials: "H",
    tone: "rose",
    amountCents: -42000,
    occurredAt: "2026-09-06T07:00:00Z",
    status: "pending",
  },
  {
    id: "p_06",
    vendor: "Square",
    category: "Processing",
    initials: "S",
    tone: "emerald",
    amountCents: 892000,
    occurredAt: "2026-09-08T15:13:00Z",
    status: "completed",
  },
  {
    id: "p_07",
    vendor: "Mews",
    category: "Software",
    initials: "M",
    tone: "violet",
    amountCents: -109900,
    occurredAt: "2026-09-08T15:13:00Z",
    status: "failed",
  },
];

export const quickRecipients = [
  { name: "Bolt Suppliers", initials: "B", tone: "violet" as const },
  { name: "Northbeam", initials: "N", tone: "emerald" as const },
  { name: "Lightspeed", initials: "L", tone: "amber" as const },
  { name: "Hostfully", initials: "H", tone: "rose" as const },
];

// Weekly payout volume — Mon–Sun of last week. Wednesday is the highlighted peak.
export const payoutVolume = [
  { label: "Mon", short: "M", value: 38 },
  { label: "Tue", short: "T", value: 62 },
  { label: "Wed", short: "W", value: 95, highlight: true, total: 14562 },
  { label: "Thu", short: "T", value: 72 },
  { label: "Fri", short: "F", value: 80 },
  { label: "Sat", short: "S", value: 48 },
  { label: "Sun", short: "S", value: 30 },
];

// ---------- Helpers ----------

export function formatAmount(cents: number): string {
  const sign = cents < 0 ? "-" : cents > 0 ? "+" : "";
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(" ", "");
  return `${date} at ${time}`;
}
