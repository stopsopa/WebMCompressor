#!/bin/bash

# check-gh-environments.sh
# Verifies that specific GitHub environments exist and have "Required Reviewers" enabled.

REQUIRED_ENVS=$1
REPO=$2

if [ -z "$REQUIRED_ENVS" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <required_envs_comma_separated> <repository_full_name>"
  exit 1
fi

echo "### 🛡️ Pre-flight Environment Check" >> $GITHUB_STEP_SUMMARY

ENVS_TO_CHECK=$(echo "$REQUIRED_ENVS" | tr -d ' ')
IFS=',' read -ra ADDR <<< "$ENVS_TO_CHECK"

FAILED=false

# 1. Try to fetch environments via API
# Note: GITHUB_TOKEN might not have permission, so we handle failure gracefully.
API_DATA=$(gh api "repos/$REPO/environments" 2>/dev/null || echo "PERMISSION_ERROR")

if [ "$API_DATA" == "PERMISSION_ERROR" ]; then
  echo "### 🛑 Permission Denied" >> $GITHUB_STEP_SUMMARY
  echo "The default \`GITHUB_TOKEN\` does not have permission to read repository Environments via API." >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "To fix this and unblock the pipeline, you must provide a token with higher privileges:" >> $GITHUB_STEP_SUMMARY
  echo "1. Create a **Fine-grained personal access token**:" >> $GITHUB_STEP_SUMMARY
  echo "   - **Repository access**: Select **'Only select repositories'**." >> $GITHUB_STEP_SUMMARY
  echo "   - **Select repositories**: Choose this repository (\`$REPO\`)." >> $GITHUB_STEP_SUMMARY
  echo "   - **Permissions**: Under 'Repository permissions', set **'Environments'** to **'Read-only'**." >> $GITHUB_STEP_SUMMARY
  echo "2. Add the token to this repository's SECRET (not VARIABLE) as \`GH_ADMIN_TOKEN\` IN THE 'Repository secrets' section." >> $GITHUB_STEP_SUMMARY
  echo "3. Update your YAML (\`pipeline.yml\`) to use \`GH_TOKEN: \${{ secrets.GH_ADMIN_TOKEN }}\`." >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "**Why?** This pipeline is configured to verify that environments (\`$REQUIRED_ENVS\`) are gated for safety." >> $GITHUB_STEP_SUMMARY
  exit 1
else
  for env_name in "${ADDR[@]}"; do
    # Check if environment exists in JSON
    ENV_JSON=$(echo "$API_DATA" | jq -r ".environments[] | select(.name == \"$env_name\")" 2>/dev/null)
    
    if [ -z "$ENV_JSON" ]; then
      echo "❌ **ERROR**: Environment \`$env_name\` does not exist!" >> $GITHUB_STEP_SUMMARY
      FAILED=true
    else
      # Check for protection rules (required_reviewers)
      HAS_GATES=$(echo "$ENV_JSON" | jq -r '.protection_rules[] | select(.type == "required_reviewers")' 2>/dev/null)
      if [ -z "$HAS_GATES" ]; then
        echo "❌ **ERROR**: Environment \`$env_name\` exists but has **NO Required Reviewers**!" >> $GITHUB_STEP_SUMMARY
        FAILED=true
      else
        echo "✅ Environment \`$env_name\` is correctly gated." >> $GITHUB_STEP_SUMMARY
      fi
    fi
  done
fi

if [ "$FAILED" = true ]; then
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "### 🛑 Deployment Safety Violation" >> $GITHUB_STEP_SUMMARY
  echo "This pipeline is designed to STOP for approval before moving to QA or Production." >> $GITHUB_STEP_SUMMARY
  echo "To fix this, go to **Settings -> Environments** and add yourself as a **Required Reviewer** for these environments:" >> $GITHUB_STEP_SUMMARY
  for env_name in "${ADDR[@]}"; do echo "- $env_name" >> $GITHUB_STEP_SUMMARY; done
  exit 1
fi
