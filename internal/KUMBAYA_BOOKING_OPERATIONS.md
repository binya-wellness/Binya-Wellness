# KUMBAYA booking operations

Last verified: October 22, 2026.

## Current appointment configuration

Calendly is the schedule of record. There are 32 existing event types: 22 active (21 paid phone appointments plus one free 15-minute introduction), and 10 inactive. Paid appointments require Stripe payment to book. Saved rates and durations were verified before activation. No customer bookings or test charges were created.

The public 30-minute Systems Navigation flow was inspected through its final details form: $15 USD, phone, required payment, Stripe. This is a no-charge UI verification; no completed-payment or refund test is claimed.

Availability remains Monday-Friday 10:00-19:00, Saturday 12:00-17:00, Sunday unavailable, America/Los_Angeles.

## Direct booking versus quoted work

- Eligible fixed-price standard phone appointments use native Calendly + Stripe pay-to-book. The website mapping is in verified-booking-links.json.
- Community Access requests, custom scope, travel, mobile delivery, and unconfirmed operating arrangements use a quote route. Regulated services remain inactive until their specific credentials and arrangements are verified.
- Do not separately invoice the same fee that Calendly collects. Reconcile cancellations, reschedules and refunds in both Calendly and Stripe.
- Keep sensitive medical, identity, immigration and hardship records out of Calendly and ordinary quote email.
- Proton Calendar is optional. Calendly remains the business schedule.

## Inactive appointments

Four mobile-service event types; IEP/504 meeting support; generic paid-service 30/60/90-minute placeholders; substance-use resource consultation; trafficking-survivor introduction. No duplicate event types should be created to replace these.

## Website source and publication

The main source includes 22 matching service buttons, separate Community Access/custom quote controls, a corrected $15 Navigation price, KUMBAYA branding and team sign-in/email-change controls. These source changes are saved but were not deployed: Render requires the user to select the existing workspace before a deployment can be initiated. Verify publication before saying the website links are live.

The Process Haus calculator stays in its separate review branch and PR 1. Do not merge or publish it without the user's separate direction. Eleven estimate scenarios passed. Checkout and regulated-service ordering remain inactive.

## Portal and account boundaries

The existing administrator profile was retained and renamed KUMBAYA Admin. The login email was not forcibly changed or confirmed. Account recovery, verification of a new sign-in email, MFA, and signatures need the account holder.

Sensitive uploads remain disabled. Proton's BAA does not itself establish Supabase/portal operational readiness. Existing Stripe webhook engineering does not deliver booking links automatically and must not be represented as such.