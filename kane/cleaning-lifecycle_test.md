---
mode: testing
headless: true
max_steps: 30
---
# Cleaning lifecycle — checkout schedules exactly one turnover clean

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Create a booking for Unit 7
Click "Bookings" in the left sidebar, click "New booking", select "Unit 7 · Harbor" in the "Unit" dropdown, type "Sarah Johnson" into "Guest name", type 1000 into "Booking value (USD)", then click "Create booking".

## Check the guest out
In the bookings table, click the "Check out" button on the "Sarah Johnson" row. Assert that row's status pill now reads "Checked out" and the "Check out" button is gone.

## Exactly one cleaning job was created
Click "Work orders" in the left sidebar. Assert there is a job titled "Turnover clean · Unit 7 · Harbor" with the status "Assigned" and cost "-$120.00". Store the number of rows whose title is "Turnover clean · Unit 7 · Harbor" as 'cleaning_jobs' and assert it equals 1.

## Unit 7 needs cleaning and refuses to be marked Ready
Click "Units" in the left sidebar, then click "Unit 7 · Harbor" to open its page. Assert the unit's status reads "Needs cleaning". Click the "Ready" button in the status switcher. Assert an alert appears containing "has an open cleaning job" and the status still reads "Needs cleaning".
