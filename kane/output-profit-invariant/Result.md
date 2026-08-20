---
test: ../profit-invariant_test.md
status: passed
started: 2026-08-20T20:07:57.786Z
duration_s: 143
session_id: f9196e43-2132-4fbe-99dd-823bbf012b4c
---

# Profitability invariant — Net equals Revenue minus Costs — Result

## Reset the demo account ✓ passed (3.3s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a $1,000 booking for Unit 7 ✓ passed (3.11s)
md5: de26e2e8da3b5d0f4a2ebbe551ff9e55
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check out and complete the turnover clean ✓ passed (1.74s)
md5: 3afb96be4d118530b90a32a8388ce639
Click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out". Click "Work orders" in the left sidebar and click "Complete" on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row shows "Completed".

## Open the Overview ✓ passed (25.2s)
md5: af255d89bc8e0fbec690142955a183cc
Click "Overview" in the left sidebar and wait until the "Profitability" card is visible.

## Revenue is recognised ✓ passed (39.3s)
md5: ab678d7ed30c6878ebbbaa150f1523aa
In the "Profitability" card, store the amount shown next to "Revenue" as 'revenue' and assert it equals "$1,000.00".

## Costs reflect the completed clean ✓ passed (35s)
md5: 952be77eba3361095e37e9ae8d9123d4
In the "Profitability" card, store the amount shown next to "Costs" as 'costs' and assert it equals "$120.00".

## Net is revenue minus costs ✓ passed (31.4s)
md5: e27dc349bb7bc60d1506f6704c4cc860
In the "Profitability" card, store the amount shown next to "Net" as 'net' and assert it equals "$880.00".
