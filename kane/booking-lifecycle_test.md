---
mode: testing
headless: true
max_steps: 30
---
# Booking lifecycle — a booking occupies the unit and recognises revenue

## Reset the demo account
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Open the new booking form
Click "Bookings" in the left sidebar, then click the "New booking" button.

## Create a $1,000 booking for Unit 7
Select "Unit 7 · Harbor" in the "Unit" dropdown. Type "Sarah Johnson" into the "Guest name" field. Leave "Check-in" and "Check-out" as prefilled. Type 1000 into the "Booking value (USD)" field. Click the "Create booking" button.

## The booking appears
Assert the bookings table now contains a row with guest "Sarah Johnson", unit "Unit 7 · Harbor" and value "$1,000.00".

## Unit 7 is occupied
Click "Units" in the left sidebar. Assert the card for "Unit 7 · Harbor" shows the status "Occupied".

## Revenue is recognised
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount shown next to "Revenue" as 'revenue' and assert it equals "$1,000.00".
