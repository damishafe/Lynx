---
test: ../profit-invariant_test.md
status: passed
started: 2026-08-20T20:03:20.704Z
duration_s: 144
session_id: 25ffd6e9-bace-41f1-85f8-7a00fb016b8d
---

# Profitability invariant — Net equals Revenue minus Costs — Result

## Reset the demo account ✓ passed (21.4s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a $1,000 booking for Unit 7 ✓ passed (39.5s)
md5: de26e2e8da3b5d0f4a2ebbe551ff9e55
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check out and complete the turnover clean ✓ passed (58s)
md5: 3afb96be4d118530b90a32a8388ce639
Click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out". Click "Work orders" in the left sidebar and click "Complete" on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row shows "Completed".

## The ledger adds up ✓ passed (21s)
md5: d90e0fcd885239b75b905336bcf209f7
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount next to "Revenue" as 'revenue', the amount next to "Costs" as 'costs' and the amount next to "Net" as 'net'. Assert revenue equals "$1,000.00", costs equals "$120.00" and net equals "$880.00".
