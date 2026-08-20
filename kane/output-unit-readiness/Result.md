---
test: ../unit-readiness_test.md
status: passed
started: 2026-08-20T19:58:09.193Z
duration_s: 287
session_id: 374ec8da-8bd1-426f-b941-1f9cd696ae17
---

# Unit readiness — completing the clean pays the vendor once and frees the unit — Result

## Reset the demo account ✓ passed (26.1s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking and check the guest out ✓ passed (53.6s)
md5: c97d07b91708c8c28779e36e278b6732
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", click "Create booking". Then click the "Check out" button on the "Sarah Johnson" row and wait until its status reads "Checked out".

## Complete the cleaning job ✓ passed (61.8s)
md5: 4d72656d394b4404737fbe3d6faa7006
Click "Work orders" in the left sidebar. Click the "Complete" button on the row titled "Turnover clean · Unit 7 · Harbor". Assert that row now shows "Completed" and the action column reads "Done".

## The vendor is owed exactly the cleaning fee ✓ passed (67.1s)
md5: d036cb25f3ef2e1acc7673b98fc4cd96
Click "Overview" in the left sidebar. Store the amount shown under "Owed to vendors" as 'owed' and assert it equals "$120.00".

## Unit 7 is ready again ✓ passed (35.4s)
md5: ba1977009b00e6572a52aab5e5bd0413
Click "Units" in the left sidebar. Assert the card for "Unit 7 · Harbor" shows the status "Ready".

## The clean is charged once, not twice ✓ passed (39.9s)
md5: 23ce40cd3dbd581976a8764abeb5aed2
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount next to "Costs" as 'costs' and assert it equals "$120.00" and not "$240.00".
