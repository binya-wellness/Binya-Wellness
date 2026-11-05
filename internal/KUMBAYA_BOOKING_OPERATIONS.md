# KUMBAYA booking operations — verified current state
**Last verified: November 5, 2026 · Historical version superseded**

## Calendly
- The connected Calendly owner is **Kumbaya**, in timezone **America/Los_Angeles**.
- There are **32 existing event types**. The **only active** event type is **KUMBAYA — Free 15-Minute Intro Call**, 15 minutes, **$0**, outbound telephone call.
- Direct free scheduling URL: https://calendly.com/kumbaya-cloud-proton/30min (URL slug says `30min` but the verified event duration is **15 minutes**).
- All **31 other event types are inactive**, including previously configured paid sessions. Do not activate or describe them as ready without a complete operating review.
- Schedule remains **Monday–Friday 10:00–19:00**, Saturday 12:00–17:00, Sunday closed, America/Los_Angeles. Keep unchanged.
- The previous October 22 state of 22 active event types is **not current** and was archived in `internal/booking-links-archive-2026-10-22.json`.

## Right Hand Th’am intake and payment
- Service finder: https://kumbaya.cloud/services.html
- Non-sensitive inquiry builder: https://kumbaya.cloud/request.html
- No personal customer data is stored by the builder; it generates a local email draft and supports manual copy as fallback.
- Written quote, approved scope, finalized cancellation terms and a verified Stripe invoice are prerequisites to **manual** confirmation of paid work.
- KUMBAYA Stripe is live-mode, payments/payouts enabled, with two products and three current prices:
  - `price_1UYHOoAwJxP3zGBhxH6AL0n0`: $15, 30-minute administrative follow-up
  - `price_1UYHOqAwJxP3zGBhHpmlksrV`: $85, 60-minute Navigation + Action Map (standard)
  - `price_1UYHOsAwJxP3zGBhhSJimPBs`: $30, 60-minute Navigation + Action Map (community access)
- **No live customer invoice, paid booking or completed payment has been created for testing.** No Stripe test account is connected in the current tooling. Do not claim end-to-end payment success from catalog reads alone.
- Other unpublished/unverified services require individual scope, pricing and service-permission review.

## Clinical and developing service boundaries
- RCCC is the independent therapy provider, owning its intake, scheduling, supervision, billing and records: https://www.rainbowconnectioncounseling.com/contact-us
- Cyaam educational tools and nonclinical community experiences are in development, not purchasable or registrable.
- Process Haus and other regulated services remain inactive pending their specific required approvals.

## Do’step
- Portal: https://dostep.kumbaya.cloud/
- Paid self-booking intentionally inactive; database booking function permits only free 15-minute introduction, requires authenticated client and MFA.
- Sensitive document uploads intentionally disabled until security, privacy and provider agreements are verified. Public notices advise against sending sensitive records via ordinary email.
- Client-side portal integration requires manual authenticated user/MFA testing. Public URL checks do not prove end-to-end account function.
- Supabase security advisor still warns that leaked-password protection is disabled; project entitlement and UI controls must be checked before claiming it is enabled.
- Do not force a new administrator email, remove MFA or change existing account IDs/roles in an effort to make login easier.

## Testing and deployment
- GitHub automated source checks, public endpoint checks and mobile/desktop accessibility tests are in `.github/workflows/launch-verification.yml`.
- The results are scoped to what these tests actually exercise, not payment, insurance, clinical intake or an authenticated portal session.
- Source changes must be deployed to both Render services and verified at the intended commit before announcing production functionality.

## Not yet verified
- An authorized Stripe test-mode invoice-to-payment/refund transaction.
- Client agreement service-specific cancellation/refund clauses and full operating authorization.
- Supabase compromised-password protection and authenticated portal task/message/booking journeys.
- Cyaam first product's final language, artwork, community review, checkout, or sale.
- Channel-specific marketing publication and opt-in mailing list.
