# Lynx — context for Kane

Lynx is a short-term-rental operations dashboard. Everything lives under {{app_url}}.

- `{{app_url}}/demo` shows two buttons. **"Reset & launch demo"** wipes the demo account,
  reseeds it (units "Unit 7 · Harbor", "Loft · Mission", "Suite · Capitol Hill"; vendors
  "BrightTurn Cleaning", "Northline Maintenance"; no bookings, no work orders) and signs you in.
  Always start from this button unless a step says otherwise.
- Left sidebar: Overview, Units, Bookings, Activity, Work orders, Vendors, Reports.
- Overview shows a **Profitability** card with three rows — Revenue, Costs, Net — as exact
  dollar amounts like `$1,000.00`, and an **Owed to vendors** figure in the Operations queue panel.
- Bookings: "New booking" form has Unit, Guest name, Check-in, Check-out, Booking value (USD),
  and a "Create booking" button. Each booking row has a "Check out" button until it is checked out.
- Unit detail pages (click a unit name) show a status switcher with Ready / Occupied /
  Needs cleaning / Maintenance buttons and the unit's work orders.
- Work orders page: each assigned job has a "Complete" button.
- Money is always shown with two decimals. Read values exactly as displayed.
