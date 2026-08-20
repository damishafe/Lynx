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

## Open the Overview
Go to {{app_url}}/dashboard and wait until the "Profitability" card is visible.

## Revenue is recognised
In the "Profitability" card, store the amount shown next to "Revenue" as 'revenue' and assert it equals "$1,000.00".

## Costs reflect the completed clean
In the "Profitability" card, store the amount shown next to "Costs" as 'costs' and assert it equals "$120.00".

## Net is revenue minus costs
In the "Profitability" card, store the amount shown next to "Net" as 'net' and assert it equals "$880.00".
