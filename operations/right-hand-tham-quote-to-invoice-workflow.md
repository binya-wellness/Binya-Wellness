# Right Hand Th’am — Nonclinical Service Intake & Quote Workflow
**Internal working template — not a published consumer contract or substitute for California legal review.**
**Last reviewed:** November 4, 2026

## Purpose and separation
Right Hand Th’am, a KUMBAYA division, offers only the administrative/resource-navigation services that KUMBAYA is authorized and prepared to perform. This workflow does **not** authorize psychotherapy, diagnosis, clinical case management, legal advice, regulated legal document preparation, or benefits/VA representation. Psychotherapy inquiries are routed to Rainbow Connection Counseling Collective (RCCC) through RCCC's own intake system; no clinical records should be collected by KUMBAYA.

## Intake: obtain only the minimum necessary
- [ ] Customer's preferred name and non-sensitive contact method
- [ ] Chosen service and broad description of the administrative need
- [ ] Accessibility or communication preferences (optional)
- [ ] General scheduling availability and service area
- [ ] Whether the task has a deadline (do not promise emergency handling)
- [ ] Confirm service is in KUMBAYA's approved, active, nonclinical scope
- [ ] If legal/clinical/regulated representation is required, decline that portion and give a suitable referral, not a booking
- [ ] Do not request SSNs, medical histories, immigration documents, ID photographs, payment card details, or hardship proof in a general form/email

## Written quote and scope — complete all fields before invoicing
**Quote identifier:** [unique reference]  
**Date / expiration:** [dates]  
**Client:** [name or business]  
**KUMBAYA division:** Right Hand Th’am  
**Service title:** [exact active service name]  
**Included deliverable:** [specific nonclinical task / finished artifact / agreed time]  
**Out of scope:** [express exclusions, professional representation restrictions]  
**Location or method:** [remote / approved location, as appropriate]  
**Included time / units:** [specific number or defined output]  
**Standard price:** [verified menu price and unit]  
**Community Access price (if approved):** [verified price, eligibility policy]  
**Additional work:** [written approval and separate quote required; do not assume $15 per 30 minutes applies]  
**Third-party fees / travel / printing / tax:** [itemized or marked not applicable]  
**Total due:** [exact amount and currency]  
**Payment schedule:** [full prepayment or individually approved deposit, where permitted]  
**Earliest availability / delivery estimate:** [do not guarantee without confirmation]  
**Cancellation/refund terms:** [service-specific terms disclosed in writing; legally compliant]  
**Client approvals/authorizations:** [scope acceptance, necessary permission to contact agencies if applicable]  
**Privacy and secure document handoff:** [approved channel or not applicable]

### Plain-language scope acknowledgement (draft)
> I understand that Right Hand Th’am provides only the nonclinical administrative or resource-navigation services described in this quote. KUMBAYA is not acting as my therapist, lawyer, legal document assistant, or government benefits representative through this service. Any additional work requires my written approval and a separate or updated quote. Payment does not confirm an appointment until KUMBAYA verifies receipt and sends a booking confirmation.

## Verified live Stripe catalog (configuration only)
These objects exist in the KUMBAYA Stripe account; they are **not** public checkout links or proof of customer payment.

| Nonclinical service | Amount | Stripe price ID |
|---|---:|---|
| 30-minute administrative follow-up | $15.00 USD | `price_1UYHOoAwJxP3zGBhxH6AL0n0` |
| 60-minute Navigation + Action Map — standard | $85.00 USD | `price_1UYHOqAwJxP3zGBhHpmlksrV` |
| 60-minute Navigation + Action Map — Community Access | $30.00 USD | `price_1UYHOsAwJxP3zGBhhSJimPBs` |

Use the corresponding item **only after** validating the exact written scope and approved Community Access rate. All other services need their own reviewed pricing or custom invoice line items. No test/live customer invoice has been created, and direct paid self-booking remains closed.

## Invoice and payment verification
1. Confirm the written scope and quote were accepted.
2. Create a **single, itemized Stripe invoice** in KUMBAYA's connected account that matches the approved price, discounts, and third-party costs. Do not ask customers to email payment-card information.
3. Send the invoice via Stripe's supported delivery mechanism. Do not send an invented payment URL.
4. Before commencing paid work or confirming a paid slot, check the Stripe invoice/payment record in the authenticated Stripe Dashboard or trusted API. A browser redirect, screenshot, or customer statement is not proof of cleared payment.
5. Record the invoice identifier, status, verified date, paid amount, quote ID, and authorized service **without copying payment-card details**.
6. Only then manually confirm the agreed appointment or start work. **Do’step paid self-booking stays disabled until an approved server-side payment validation workflow is deployed and tested.**

## Fulfillment and completion
- [ ] Re-check scope, safety, deadline and required credentials
- [ ] Confirm customer-facing time zone, service method, accessibility needs and cancellation terms
- [ ] Perform only agreed tasks; get written approval before additional work
- [ ] Deliver agreed administrative result or referral summary using an authorized channel
- [ ] Send a receipt through Stripe and the agreed non-sensitive completion notice
- [ ] Log completion, invoice reference, and any promised follow-up
- [ ] Address correction/refund requests using the actual contract, applicable law, and processor rules

## Distinct Cyaam pathway
- **RCCC counseling:** Link to https://www.rainbowconnectioncounseling.com/contact-us ; never book or bill it as KUMBAYA therapy.
- **Cyaam products/events:** Currently described as **in development**; an interest inquiry is not a sale, ticket, clinical intake, or reservation.
- **Free KUMBAYA introduction:** https://calendly.com/kumbaya-cloud-proton/30min (15 minutes, nonclinical, $0).

## Release gates
- [x] Free intro is active in Calendly (last checked 2026-11-04; verify anew if changed)
- [x] Paid Do’step booking function limited to the free 15-minute service (last checked 2026-11-04)
- [ ] A real client quote is issued and approved for a currently permitted service
- [ ] Corresponding Stripe invoice is created and paid, then independently verified
- [ ] Service-specific cancellation/refund and privacy documents are reviewed
- [ ] Live browser/mobile and accessibility tests pass
- [ ] Current Render commit for Do’step matches approved GitHub main
- [ ] Insurance and any service-specific business/registration/licensure requirements checked before delivery

**No customer accounts, appointments, invoices, charges, or clinical intake data should be created merely to test this checklist in production.**
