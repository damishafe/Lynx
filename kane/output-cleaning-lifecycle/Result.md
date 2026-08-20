---
test: ../cleaning-lifecycle_test.md
status: passed
started: 2026-08-20T22:25:26.362Z
duration_s: 234
session_id: d627cb58-04c9-4ac0-88fd-4fac5205cdaf
---

# Cleaning lifecycle — checkout schedules exactly one turnover clean — Result

## Reset the demo account ✓ passed (2.08s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking for Unit 7 ✓ passed (6.78s)
md5: de26e2e8da3b5d0f4a2ebbe551ff9e55
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check the guest out ✓ passed (0.76s)
md5: d8d3848e02d3e042585fe0e72a93dda3
In the bookings table, click the "Check out" button on the "Sarah Johnson" row. Assert that row's status pill now reads "Checked out" and the "Check out" button is gone.

## Exactly one cleaning job was created ✓ passed (80.8s)
md5: 9dd2b85b46d604ebc1aa1df9e3e0dc8c
Click "Work orders" in the left sidebar. Assert there is a job titled "Turnover clean · Unit 7 · Harbor" with the status "Assigned" and cost "-$120.00". Store the number of rows whose title is "Turnover clean · Unit 7 · Harbor" as 'cleaning_jobs' and assert it equals 1.

## Unit 7 needs cleaning and refuses to be marked Ready ✓ passed (105.9s)
md5: e1352627b9f9e61ab93ba660c916e626
Click "Units" in the left sidebar, then click "Unit 7 · Harbor" to open its page. Assert the unit's status reads "Needs cleaning". Click the "Ready" button in the status switcher. Assert an alert appears containing "has an open cleaning job" and the status still reads "Needs cleaning".
