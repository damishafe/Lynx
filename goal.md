# Project Goal: Lynx 

## The Vision
**Lynx is the spreadsheet that became software.** 

It is a multi-unit operations OS tailored specifically for boutique vacation rental operators managing 5–30 units. It replaces the chaotic, 15-tab, color-coded spreadsheet operators currently use to run their businesses, providing a real-time view of net profit per unit, unit status, and vendor payouts.

## The Problem
Operators running 10-30 short-term rentals (Airbnb, VRBO, direct) exist in a software dead zone. They are too big to manage everything in a basic Excel file, but too small for massive, expensive enterprise solutions like Guesty. They currently rely on incredibly fragile, manual spreadsheets where one wrong formula breaks their entire financial understanding of their business.

## The Solution
A single, institutional-grade dashboard providing:
1. **Live Status:** Every unit's real-time state (Ready, Occupied, Needs Cleaning, Maintenance).
2. **True ROI:** A live ledger that instantly calculates Net Profit per unit (Gross Bookings minus Completed Work Orders).
3. **Vendor Synergy:** A mobile-first portal where cleaners and maintenance staff can mark jobs complete, which automatically deducts the cost from the unit's ledger and updates the vendor's owed balance.

---

## The Feature Roadmap

### Phase 1: Core product
*   **Core Auth & Roles:** Manager vs. Vendor views.
*   **Property & Unit Management:** CRUD operations with live status color-coding.
*   **Live Ledger System:** In-memory computation of Gross Revenue, Expenses, and Net Profit.
*   **Mobile Vendor Portal:** Cleaners can mark assigned jobs as "Complete".
*   **Smart Booking Parser (Bonus):** Paste an Airbnb confirmation email -> auto-fills the booking form.
*   **AI Anomaly Flag (Bonus):** "This unit's expenses are 40% higher than your portfolio average — your top 3 cost drivers are…"


*   **Financial & Payments:**
    *   Stripe Connect integration for automated vendor payouts.
    *   Multi-currency support for international operators.
    *   Comprehensive billing and subscription onboarding flows.
*   **Channel Management:**
    *   Direct Airbnb / VRBO API integration.
    *   Two-way Calendar sync (iCal).
*   **Operations & Comms:**
    *   Unified guest messaging inbox.
    *   Automated Email / SMS notifications for vendors and guests.
    *   Photo uploads (e.g., cleaners uploading damage proof) and document storage.
*   **Data & Analytics:**
    *   Automated reporting, PDF exports, and CSV ledger downloads.

---

## The "Wow" Moment
The core interaction:
A split-screen view. On the left, a cleaner uses the mobile Vendor Portal to tap "Mark Complete" on a cleaning job. On the right, the Manager Dashboard updates in real-time: the unit's status flips to "Ready," the $85 cleaning fee is instantly deducted from the unit's net profit ledger, and the total "Owed to Vendors" metric ticks up. All happening without page reloads.

---

## Target Architecture & Tech Stack
* **Framework:** Next.js (App Router, Server Components + Server Actions).
* **Database:** MongoDB via Mongoose. Chosen for high-speed relational mapping (`populate`) and rapid schema iteration.
* **Styling:** Tailwind CSS v4 + shadcn/ui.
* **Design System:** "Soft Bento" (Strict adherence to `CLAUDE.md` spec).

---

## Database Schema Strategy

**Collections:**
1. `Users`: (id, email, role: manager|vendor, name)
2. `Properties`: (id, manager_id, name)
3. `Units`: (id, property_id, name, status)
4. `Bookings`: (id, unit_id, guest_name, check_in, check_out, gross_amount)
5. `Vendors`: (id, manager_id, user_id, name, role)
6. `WorkOrders`: (id, unit_id, vendor_id, task_type, cost, status)

**Crucial Architecture Note (Computed Ledgers):** 
For the MVP, do not store `net_profit` in the database. Calculate it on the fly in Next.js Server Components. 
* *Unit Gross Revenue* = Sum of `Bookings`.
* *Unit Expenses* = Sum of `WorkOrders` (complete or paid).
* *Unit Net Profit* = Gross - Expenses.