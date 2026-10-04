# Binya North Star — HIPAA go-live checklist

Do not enable sensitive uploads until every required item below is complete and documented.

## Legal / vendor agreements

- [ ] AWS Business Associate Addendum accepted in AWS Artifact.
- [ ] AWS account designated for HIPAA use.
- [ ] Only AWS services on the current HIPAA Eligible Services list are used for ePHI.
- [ ] Every other vendor that may create, receive, maintain, or transmit ePHI has a signed BAA when required.
- [ ] Render and Supabase are not used for PHI unless their applicable HIPAA terms/BAAs are separately in place.

## Administrative safeguards

- [ ] Security Risk Analysis completed and dated.
- [ ] Risk-management plan created for identified risks.
- [ ] Security/privacy officer responsibility assigned.
- [ ] Workforce access policy documented.
- [ ] Minimum-necessary access policy documented.
- [ ] New-hire / termination access procedure documented.
- [ ] Security-awareness and HIPAA training documented.
- [ ] Incident-response procedure documented.
- [ ] Breach-response and notification procedure documented.
- [ ] Sanctions policy documented.
- [ ] Contingency / disaster-recovery plan documented.
- [ ] Emergency-access procedure documented.
- [ ] Periodic access-review schedule documented.
- [ ] Vendor/BAA inventory maintained.

## AWS account safeguards

- [ ] Root account protected by MFA.
- [ ] Root account has no access keys.
- [ ] Day-to-day work does not use the root account.
- [ ] Strong MFA required for privileged AWS users.
- [ ] Billing budget and billing alerts configured.
- [ ] CloudTrail is enabled and log-file validation is on.
- [ ] Audit/log bucket is private and versioned.
- [ ] IAM permissions reviewed for least privilege.
- [ ] No long-lived AWS credentials are stored in GitHub or frontend code.

## North Star authentication

- [ ] Cognito self-signup disabled.
- [ ] TOTP MFA required.
- [ ] Password minimum remains at least 14 characters with mixed character classes.
- [ ] Access and ID tokens remain short-lived.
- [ ] Users are assigned only to the correct Cognito group.
- [ ] Admin access reviewed before production.
- [ ] Test account cannot read another user's data.
- [ ] Disabled/terminated accounts are promptly disabled and sessions revoked.

## Data protection

- [ ] Portal S3 bucket is private.
- [ ] Document S3 bucket is private.
- [ ] S3 Block Public Access remains enabled.
- [ ] HTTPS/TLS-only access enforced.
- [ ] Encryption at rest remains enabled.
- [ ] DynamoDB encryption remains enabled.
- [ ] DynamoDB point-in-time recovery remains enabled.
- [ ] Document bucket versioning remains enabled.
- [ ] No PHI is stored in object names, public URLs, query strings, browser analytics, or Git commit history.
- [ ] Presigned upload/download URLs are short-lived.
- [ ] File-size/type restrictions tested.
- [ ] Backup/restore test completed and documented.

## Application safeguards

- [ ] API requires a valid Cognito JWT.
- [ ] Authorization is enforced server-side, never only in browser JavaScript.
- [ ] User A cannot access User B records (BOLA/IDOR test).
- [ ] API does not log request bodies, messages, filenames, tokens, or document contents.
- [ ] Error messages do not expose PHI or secrets.
- [ ] Browser cache behavior reviewed for sensitive pages.
- [ ] Security headers verified in production.
- [ ] No service secrets are present in frontend assets.
- [ ] No third-party analytics/ad trackers are loaded inside the portal.
- [ ] No external support widgets receive page content or form fields.
- [ ] Secure-message and document-download actions are included in audit records.
- [ ] Production test performed using synthetic/non-PHI data.

## Operations

- [ ] Procedure exists for provisioning a new client.
- [ ] Procedure exists for disabling a client.
- [ ] Procedure exists for adding/removing staff.
- [ ] Procedure exists for correcting access assigned to the wrong person.
- [ ] Procedure exists for suspected credential compromise.
- [ ] Procedure exists for lost/stolen staff devices.
- [ ] Procedure exists for restoring data after accidental deletion.
- [ ] Audit logs are reviewed on a defined schedule.
- [ ] Security configuration is reviewed after material application changes.
- [ ] HIPAA documentation/records are retained according to applicable retention requirements.

## Final activation

- [ ] All above required items complete.
- [ ] Final non-PHI penetration/access-control test complete.
- [ ] Current AWS HIPAA Eligible Services list rechecked.
- [ ] Binya approves production use.
- [ ] Re-deploy with `ENABLE_SENSITIVE_UPLOADS=true`.
- [ ] Verify upload API reports enabled only after deployment.
- [ ] Verify a test upload is private and inaccessible without authorization.

**Until the final activation section is complete, the portal must be treated as non-PHI only.**
