# Binya North Star — AWS migration package

This directory is the replacement path for the current Supabase/Render portal when Binya is ready to handle ePHI.

## What this package builds

- Private static portal origin in Amazon S3
- CloudFront HTTPS delivery with security headers
- Amazon Cognito invite-only authentication
- Required TOTP MFA
- 15-minute access and ID tokens
- API Gateway HTTP API with Cognito JWT authorization
- Lambda API that never logs request bodies or message/document contents
- DynamoDB portal records with encryption at rest and point-in-time recovery
- Private S3 document storage with encryption, versioning, TLS-only access, and short-lived signed URLs
- CloudTrail with log validation and a private audit bucket
- PHI upload kill switch: **OFF by default**

The application is intentionally not self-signup. Users are created by Binya and assigned to a Cognito group.

## Important compliance boundary

Do **not** use this environment for PHI merely because the stack deploys successfully.

Before PHI goes live, the AWS account must be covered by the AWS Business Associate Addendum and designated for HIPAA use, and Binya must complete the HIPAA go-live checklist in this directory. HIPAA is a shared-responsibility program; infrastructure alone does not make an organization compliant.

## One-time human steps

These cannot be delegated to ChatGPT because they require the AWS account owner to make legal/account decisions:

1. Create or sign into Binya's AWS account.
2. In AWS Artifact, review and accept the AWS Business Associate Addendum.
3. Designate the AWS account for HIPAA use.
4. Confirm billing alerts/budgets before deployment.

AWS automatically moves a Free account plan to the paid/pay-as-you-go plan when the account is designated for HIPAA. Free-tier credits/allowances can still offset usage, but there is no guarantee the account will stay at $0.

## Deploy

Use AWS CloudShell or a local terminal with AWS CLI + AWS SAM CLI authenticated to the HIPAA-designated AWS account.

```bash
cd aws-northstar
chmod +x deploy.sh
AWS_REGION=us-east-1 ./deploy.sh
```

The first deployment keeps sensitive uploads disabled.

The script prints the temporary CloudFront portal URL. Use that URL to test authentication and the dashboard with **non-PHI test data only**.

## Create the first admin

After the stack deploys, find the `UserPoolId` stack output and create the admin account:

```bash
aws cognito-idp admin-create-user \
  --region us-east-1 \
  --user-pool-id YOUR_USER_POOL_ID \
  --username YOUR_ADMIN_EMAIL \
  --user-attributes Name=email,Value=YOUR_ADMIN_EMAIL Name=email_verified,Value=true

aws cognito-idp admin-add-user-to-group \
  --region us-east-1 \
  --user-pool-id YOUR_USER_POOL_ID \
  --username YOUR_ADMIN_EMAIL \
  --group-name admin
```

On first sign-in, Cognito will require the password setup and TOTP MFA flow.

## Turn PHI uploads on — only after go-live

After every item in `HIPAA-GO-LIVE-CHECKLIST.md` is complete:

```bash
cd aws-northstar
ENABLE_SENSITIVE_UPLOADS=true AWS_REGION=us-east-1 ./deploy.sh
```

That flag is deliberately separate from the frontend. The Lambda API refuses to issue upload URLs while the flag is false.

## Custom domain

The initial stack uses its CloudFront hostname. After the stack is tested, configure `northstar.binya.cloud` with an ACM certificate and point Porkbun DNS to the CloudFront distribution. Keep the public `binya.cloud` site separate.

When the custom domain is activated, update:

- Cognito callback/logout URLs
- API CORS allowed origin
- document-bucket CORS origin
- frontend `portalUrl`

Do not put PHI in URLs, query strings, analytics, GitHub, Render, Supabase, or ordinary email.

## Cost controls

This stack uses on-demand/serverless services to keep idle cost low. Some features can still incur charges, including data transfer, CloudTrail storage, DynamoDB backups, Lambda/API calls, S3 storage, and Cognito usage.

Before go-live, configure:

- AWS Budgets monthly budget
- billing alerts
- MFA on the AWS root user
- no root-user access keys
- least-privilege administrator identities

## Current Binya portal

The existing Render/Supabase portal should remain a non-PHI preview while this migration is being completed. Its sensitive-upload gate must remain off.
