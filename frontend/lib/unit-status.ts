// Pure types + constants safe for client components.
// Importing from `lib/units.ts` would drag the mongodb driver into the browser
// bundle. Anything client-side that just needs the status enum imports here.

export type UnitStatus = "ready" | "occupied" | "maintenance";

export const UNIT_STATUSES: UnitStatus[] = [
  "ready",
  "occupied",
  "maintenance",
];

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  ready: "Ready",
  occupied: "Occupied",
  maintenance: "Maintenance",
};
