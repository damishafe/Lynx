---
test: ../booking-lifecycle_test.md
status: passed
started: 2026-08-20T19:44:42.465Z
duration_s: 202
session_id: 8af58a55-8c4f-4563-8265-861382680052
---

# Booking lifecycle — a booking occupies the unit and recognises revenue — Result

## Reset the demo account ✓ passed (46s)
md5: 006cfb09b1c48ff29ce97135eedd0ee5
Go to {{app_url}}/demo and click the "Reset & launch demo" button. Wait until the page heading starts with "Welcome back".

## Open the new booking form ✓ passed (32.3s)
md5: 7b318b057f8b46bdf8dfbff82e58665a
Click "Bookings" in the left sidebar, then click the "New booking" button.

## Create a $1,000 booking for Unit 7 ✓ passed (27.8s)
md5: d489030250ec342af9ad12c8f861c261
Select "Unit 7 · Harbor" in the "Unit" dropdown. Type "Sarah Johnson" into the "Guest name" field. Leave "Check-in" and "Check-out" as prefilled. Type 1000 into the "Booking value (USD)" field. Click the "Create booking" button.

## The booking appears ✓ passed (23.9s)
md5: b3c2166d30a35a8344c6a160f9fd8200
Assert the bookings table now contains a row with guest "Sarah Johnson", unit "Unit 7 · Harbor" and value "$1,000.00".

## Unit 7 is occupied ✓ passed (29.4s)
md5: ab5a440e5d739472c55aa374871938b3
Click "Units" in the left sidebar. Assert the card for "Unit 7 · Harbor" shows the status "Occupied".

## Revenue is recognised ✓ passed (39.4s)
md5: a1543cd94e12927fc293fb8ccf40932e
Click "Overview" in the left sidebar. In the "Profitability" card, store the amount shown next to "Revenue" as 'revenue' and assert it equals "$1,000.00".
