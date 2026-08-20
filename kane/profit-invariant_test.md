---
mode: testing
headless: true
max_steps: 30
---
# Profitability invariant — Net equals Revenue minus Costs

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a $1,000 booking for Unit 7
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check out and complete the turnover clean
Click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out". Click "Work orders" in the left sidebar and click "Complete" on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row shows "Completed".

## The ledger adds up
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount next to "Revenue" as 'revenue', the amount next to "Costs" as 'costs' and the amount next to "Net" as 'net'. Assert revenue equals "$1,000.00", costs equals "$120.00" and net equals "$880.00".
