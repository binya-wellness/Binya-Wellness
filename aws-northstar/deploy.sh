#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-binya-north-star}"
REGION="${AWS_REGION:-us-east-1}"
DOMAIN_PREFIX="${COGNITO_DOMAIN_PREFIX:-binya-north-star}"
ENABLE_UPLOADS="${ENABLE_SENSITIVE_UPLOADS:-false}"

command -v aws >/dev/null || { echo "AWS CLI is required."; exit 1; }
command -v sam >/dev/null || { echo "AWS SAM CLI is required."; exit 1; }

echo "Building North Star..."
sam build --template-file template.yaml

echo "Deploying AWS infrastructure..."
sam deploy   --stack-name "$STACK_NAME"   --region "$REGION"   --resolve-s3   --capabilities CAPABILITY_IAM   --no-fail-on-empty-changeset   --parameter-overrides     CognitoDomainPrefix="$DOMAIN_PREFIX"     EnableSensitiveUploads="$ENABLE_UPLOADS"

output() {
  aws cloudformation describe-stacks     --stack-name "$STACK_NAME"     --region "$REGION"     --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]"     --output text
}

PORTAL_URL="$(output PortalUrl)"
PORTAL_BUCKET="$(output PortalBucketName)"
DIST_ID="$(output PortalDistributionId)"
API_URL="$(output ApiUrl)"
CLIENT_ID="$(output UserPoolClientId)"
COGNITO_BASE="$(output CognitoHostedUiBase)"

if [[ -z "$PORTAL_URL" || "$PORTAL_URL" == "None" ]]; then
  echo "Could not read stack outputs."
  exit 1
fi

echo "Rendering browser config..."
sed   -e "s|__API_URL__|$API_URL|g"   -e "s|__CLIENT_ID__|$CLIENT_ID|g"   -e "s|__COGNITO_BASE__|$COGNITO_BASE|g"   -e "s|__PORTAL_URL__|$PORTAL_URL|g"   -e "s|__REGION__|$REGION|g"   frontend/config.template.js > frontend/config.js

echo "Publishing static portal..."
aws s3 sync frontend/ "s3://$PORTAL_BUCKET/"   --region "$REGION"   --delete   --exclude "config.template.js"   --cache-control "no-store"   --sse AES256

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation   --distribution-id "$DIST_ID"   --paths "/*" >/dev/null

echo
echo "North Star deployed."
echo "Portal URL: $PORTAL_URL"
echo "Sensitive uploads enabled: $ENABLE_UPLOADS"
echo
if [[ "$ENABLE_UPLOADS" != "true" ]]; then
  echo "PHI uploads remain LOCKED. Keep them locked until the BAA and go-live checklist are complete."
fi
