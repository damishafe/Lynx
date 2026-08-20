---
test: ../unit-readiness_test.md
status: passed
started: 2026-08-20T22:17:56.066Z
duration_s: 203
session_id: 10b66bff-fd3a-4a9c-8c01-ade130de37ff
---

# Unit readiness — completing the clean pays the vendor once and frees the unit — Result

## Reset the demo account ✓ passed (1.25s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking and check the guest out ✓ passed (3.82s)
md5: c97d07b91708c8c28779e36e278b6732
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", click "Create booking". Then click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out".

## Complete the cleaning job ✓ passed (1.64s)
md5: 4d72656d394b4404737fbe3d6faa7006
Click "Work orders" in the left sidebar. Click the "Complete" button on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row now shows "Completed" and the action column reads "Done".

## The vendor is owed exactly the cleaning fee ✓ passed (53.2s)
md5: 334bf2ecb32132c1a4afda7b6676417b
Go to {{app_url}}/dashboard and wait until the "Owed to vendors" card is visible. Store the dollar amount displayed directly above the label "Owed to vendors" as 'owed' and assert it equals "$120.00".

## Unit 7 is ready again ✓ passed (26.5s)
md5: eefc2b5356bfbb80c9079e220267b0bd
Go to {{app_url}}/dashboard/units and wait until the unit cards are visible. Assert the card for "Unit 7 · Harbor" shows the status "Ready".

## The clean is charged once, not twice ✓ passed (72.7s)
md5: 59d195b7caf8f2b6af8b049f3549abb1
Go to {{app_url}}/dashboard and wait until the "Profitability" card is visible. In the "Profitability" card, store the amount shown next to "Costs" as 'costs' and assert it equals "$120.00".
