# KUMBAYA — live booking operations and launch gate

Last audited: 2026-10-19. This document is internal operational guidance, **not** a statement that automatic checkout or scheduling is live.

## Current verified configuration

- Stripe live account `acct_1USNOtAwJxP3zGBh`: charges and payouts enabled.
- Calendly: 32 event types; only **KUMBAYA — Free 15-Minute Intro Call** active. Working hours in America/Los_Angeles: Monday–Friday 10:00–19:00, Saturday 12:00–17:00, Sunday closed.
- Supabase project `geevglgckmjexvnjnodl`: `kumbaya_service_quotes`, `kumbaya_payment_events`, `kumbaya_access_allocations`, all with RLS enabled and no anon/authenticated table grants.
- Deployed Edge Function: `kumbaya-stripe-payment-events`. **It cannot accept verified events until `KUMBAYA_STRIPE_WEBHOOK_SECRET` is configured in the Supabase runtime and the matching Stripe endpoint is registered.** Do not publish the signing secret.
- Calendly paid event types are **inactive**, not secret single-use booking links, and may not be considered paid-booking ready.
- No Proton Calendar integration is required. Calendly is the business schedule of record.

## Operating procedure until full integration is verified

1. Receive an email quote request from the published services menu. Decline or refer requests for not-yet-authorized regulated services.
2. Privately confirm service, jurisdiction, rate, fee/tax treatment, duration, delivery mode, travel costs and cancellation terms. If claiming Community Access, verify eligibility privately without collecting documents through unsecured forms. Respect the monthly 12-hour or $500 discount limits, whichever applies first.
3. Create an itemized **live Stripe invoice** only after scope/total are approved; use Stripe's hosted invoice page. Never collect card information over email.
4. Confirm payment as **paid** in the Stripe Dashboard. For deferred payment methods, do not treat an initiation or redirect as cleared payment.
5. Arrange a paid service manually until a credentialed integration is available. Do not activate a generally discoverable, publicly bookable paid event type just to issue a link.
6. Confirm the actual Calendly booking in the Scheduled Events dashboard. Do not copy medical, identity, immigration, disability, or other sensitive case records into Calendly description fields.
7. Reconcile cancellations, refunds and reschedules in Stripe **and** Calendly. Do not assume automated synchronization.
8. Calendly is the single source of truth for availability; block non-Calendly commitments there to avoid conflicts.

## Remaining engineering gates before automated paid invitations

- Obtain and **privately install** the Stripe webhook signing secret as Supabase Edge Function secret `KUMBAYA_STRIPE_WEBHOOK_SECRET`; create a Stripe live webhook endpoint for `invoice.paid` and run signed integration tests. Do not expose credentials in GitHub, website JavaScript or chat.
- Integrate a supported backend Calendly credential stored server-side. Generate a link only after verifying a matching approved paid invoice, one appointment per quote, valid licensed/operational service, matched duration, and no active/refunded/canceled transaction.
- Implement an atomic delivery workflow or retry queue with explicit audit events. The current webhook verifies/reconciles paid invoices only; **it does not deliver appointment links**.
- Confirm customer delivery channel and privacy handling; do not use unauthorized email infrastructure for sensitive messages.
- Test failures (invalid signature, amount mismatch, duplicate deliveries, refund, already booked, out-of-hours, mobile travel, and calendar conflict) before enabling automation.
- Review Supabase Auth leaked-password protection in the Dashboard.
- Review Stripe's legal entity classification against KUMBAYA's actual business registration.

## Do not claim
Do not claim live automatic checkout, live automatic scheduling, instant Proton Calendar synchronization or payment-gated Calendly links until their respective end-to-end tests pass.
