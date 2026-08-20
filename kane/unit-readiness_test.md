---
mode: testing
headless: true
max_steps: 30
---
# Unit readiness — completing the clean pays the vendor once and frees the unit

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking and check the guest out
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", click "Create booking". Then click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out".

## Complete the cleaning job
Click "Work orders" in the left sidebar. Click the "Complete" button on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row now shows "Completed" and the action column reads "Done".

## The vendor is owed exactly the cleaning fee
Click "Overview" in the left sidebar. Store the amount shown under "Owed to vendors" as 'owed' and assert it equals "$120.00".

## Unit 7 is ready again
Click "Units" in the left sidebar. Assert the card for "Unit 7 · Harbor" shows the status "Ready".

## The clean is charged once, not twice
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount next to "Costs" as 'costs' and assert it equals "$120.00" and not "$240.00".
