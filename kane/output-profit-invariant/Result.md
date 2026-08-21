---
test: ../profit-invariant_test.md
status: passed
started: 2026-08-21T07:29:23.588Z
duration_s: 109
session_id: de158d8d-7d1f-4d66-a3c3-56a5c625baf2
---

# Profitability invariant — Net equals Revenue minus Costs — Result

## Reset the demo account ✓ passed (0.97s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a $1,000 booking for Unit 7 ✓ passed (3.92s)
md5: de26e2e8da3b5d0f4a2ebbe551ff9e55
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check out and complete the turnover clean ✓ passed (1.85s)
md5: 3afb96be4d118530b90a32a8388ce639
Click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out". Click "Work orders" in the left sidebar and click "Complete" on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row shows "Completed".

## Open the Overview ✓ passed (0.34s)
md5: e0544235d032040f7bb2baf9a21c0e36
Go to {{app_url}}/dashboard and wait until the "Profitability" card is visible.

## Revenue is recognised ✓ passed (0.14s)
md5: ab678d7ed30c6878ebbbaa150f1523aa
In the "Profitability" card, store the amount shown next to "Revenue" as 'revenue' and assert it equals "$1,000.00".

## Costs include the platform fee and the clean ✓ passed (41.2s)
md5: 6d993e85ba5048c0d2548b3e8f355ae3
In the "Profitability" card, store the amount shown next to "Costs" as 'costs' and assert it equals "$220.00".

## The platform fee is shown as its own line ✓ passed (27.9s)
md5: 6bc3234b916d9653b8354559c9f8578e
In the "Profitability" card, store the amount shown next to the line that mentions the platform fee as 'platform_fee' and assert it equals "$100.00".

## Net is revenue minus costs ✓ passed (28.4s)
md5: ce34784017673cfa3b1cf2c5417d5029
In the "Profitability" card, store the amount shown next to "Net" as 'net' and assert it equals "$780.00".
