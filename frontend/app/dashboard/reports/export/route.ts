import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { listPayouts } from "@/lib/payouts";
import { listUnits } from "@/lib/units";
import { listVendors } from "@/lib/vendors";
import { listWorkOrders } from "@/lib/work-orders";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

export async function GET() {
  const session = await getSession();
  if (!session || !ObjectId.isValid(session.userId)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const ownerId = new ObjectId(session.userId);

  const [units, vendors, workOrders, payouts] = await Promise.all([
    listUnits(ownerId, { limit: 1000 }),
    listVendors(ownerId, { limit: 1000 }),
    listWorkOrders(ownerId, { limit: 1000 }),
    listPayouts(ownerId, { limit: 1000 }),
  ]);

  const rows = [
    csvRow([
      "record_type",
      "id",
      "name_or_title",
      "unit",
      "vendor",
      "status",
      "category",
      "amount_cents",
      "occurred_or_created_at",
      "notes",
    ]),
    ...units.map((unit) =>
      csvRow([
        "unit",
        unit._id.toString(),
        unit.name,
        unit.name,
        "",
        unit.status,
        unit.type,
        unit.monthlyRevenueCents ?? "",
        unit.createdAt,
        unit.notes ?? "",
      ]),
    ),
    ...vendors.map((vendor) =>
      csvRow([
        "vendor",
        vendor._id.toString(),
        vendor.name,
        "",
        vendor.name,
        "",
        vendor.role,
        "",
        vendor.createdAt,
        vendor.notes ?? "",
      ]),
    ),
    ...workOrders.map((workOrder) =>
      csvRow([
        "work_order",
        workOrder._id.toString(),
        workOrder.title,
        workOrder.unitName,
        workOrder.vendorName,
        workOrder.status,
        workOrder.type,
        workOrder.costCents,
        workOrder.completedAt ?? workOrder.createdAt,
        workOrder.notes ?? "",
      ]),
    ),
    ...payouts.map((payout) =>
      csvRow([
        "payout",
        payout._id.toString(),
        payout.category,
        payout.unitId?.toString() ?? "",
        payout.vendorName,
        payout.status,
        payout.category,
        payout.amountCents,
        payout.occurredAt,
        payout.notes ?? "",
      ]),
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lynx-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
