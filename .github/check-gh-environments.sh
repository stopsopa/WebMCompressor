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

# --- Token Diagnostics ---
TOKEN_TYPE="Unknown"
if [[ "$GH_TOKEN" == ghs_* ]]; then TOKEN_TYPE="Default GITHUB_TOKEN (Restricted)"; fi
if [[ "$GH_TOKEN" == github_pat_* ]]; then TOKEN_TYPE="Fine-grained PAT"; fi
if [[ "$GH_TOKEN" == ghp_* ]]; then TOKEN_TYPE="Classic PAT"; fi

if [ -z "$GH_TOKEN" ]; then TOKEN_TYPE="EMPTY (Not found)"; fi

echo "DEBUG: Repository: \`$REPO\`" >> $GITHUB_STEP_SUMMARY
echo "DEBUG: Token detected: **$TOKEN_TYPE**" >> $GITHUB_STEP_SUMMARY
# -------------------------

ENVS_TO_CHECK=$(echo "$REQUIRED_ENVS" | tr -d ' ')
IFS=',' read -ra ADDR <<< "$ENVS_TO_CHECK"

FAILED=false

# 1. Try to fetch environments via API
# Note: GITHUB_TOKEN might not have permission, so we handle failure gracefully.
echo "DEBUG: Testing repository visibility..." >> $GITHUB_STEP_SUMMARY
REPO_DATA=$(gh api "repos/$REPO" --jq '{name: .full_name, visibility: .visibility}' 2>/dev/null || echo "REPO_HIDDEN")

if [ "$REPO_DATA" == "REPO_HIDDEN" ]; then
  echo "❌ **ERROR**: Token cannot even see the repository \`$REPO\`!" >> $GITHUB_STEP_SUMMARY
  echo "   Check that you selected this repository in your PAT settings under **'Repository access'**." >> $GITHUB_STEP_SUMMARY
  API_DATA="PERMISSION_ERROR"
else
  echo "✅ Token can see repository: \`$(echo $REPO_DATA | jq -r .name)\` ($(echo $REPO_DATA | jq -r .visibility))" >> $GITHUB_STEP_SUMMARY
  
  # Fetch data and CAPTURE it for multi-purpose use
  # We capture stderr to see the EXACT error message from GitHub
  ERR_FILE=$(mktemp)
  API_DATA=$(gh api "repos/$REPO/environments" 2>"$ERR_FILE")
  EXIT_CODE=$?
  API_ERR=$(cat "$ERR_FILE")
  rm -f "$ERR_FILE"
  
  if [ $EXIT_CODE -ne 0 ]; then
    API_DATA="PERMISSION_ERROR"
  fi

  # RAW DEBUG DUMP (Collapsed)
  echo "<details><summary>🔍 Raw API Response Structure (Debug)</summary>" >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  if [ "$API_DATA" == "PERMISSION_ERROR" ]; then
    echo "❌ **API Error**: $API_ERR" >> $GITHUB_STEP_SUMMARY
  else
    echo "\`\`\`json" >> $GITHUB_STEP_SUMMARY
    echo "$API_DATA" | jq '.' >> $GITHUB_STEP_SUMMARY 2>&1 || echo "Invalid JSON: $API_DATA" >> $GITHUB_STEP_SUMMARY
    echo "\`\`\`" >> $GITHUB_STEP_SUMMARY
  fi
  echo "</details>" >> $GITHUB_STEP_SUMMARY
fi

if [ "$API_DATA" == "PERMISSION_ERROR" ]; then
  echo "### 🛑 Permission Denied" >> $GITHUB_STEP_SUMMARY
  echo "The token provided does not have permission to read repository Environments via API." >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "To fix this and unblock the pipeline, you must provide a token with higher privileges:" >> $GITHUB_STEP_SUMMARY
  echo "1. Create a **Fine-grained personal access token**:" >> $GITHUB_STEP_SUMMARY
  echo "   - **Repository access**: Select **'Only select repositories'**." >> $GITHUB_STEP_SUMMARY
  echo "   - **Select repositories**: Choose this repository (\`$REPO\`)." >> $GITHUB_STEP_SUMMARY
  echo "   - **Permissions**: Under 'Repository permissions', set both **'Environments'** AND **'Deployments'** to **'Read-only'**." >> $GITHUB_STEP_SUMMARY
  echo "2. Add the token to this repository's SECRET (not VARIABLE) as \`GH_ADMIN_TOKEN\` IN THE 'Repository secrets' section." >> $GITHUB_STEP_SUMMARY
  echo "3. Update your YAML (\`pipeline.yml\`) to use \`GH_TOKEN: \${{ secrets.GH_ADMIN_TOKEN }}\`." >> $GITHUB_STEP_SUMMARY
  echo "" >> $GITHUB_STEP_SUMMARY
  echo "**Why?** This pipeline is configured to verify that environments (\`$REQUIRED_ENVS\`) are gated for safety." >> $GITHUB_STEP_SUMMARY
  exit 1
else
  # Debug: Show the raw structure (total_count)
  COUNT=$(echo "$API_DATA" | jq -r '.total_count' 2>/dev/null)
  echo "DEBUG: API says \`total_count\` is: **$COUNT**" >> $GITHUB_STEP_SUMMARY
  
  # Debug: Show what we actually found
  FOUND_ENVS=$(echo "$API_DATA" | jq -r '.environments[].name' 2>/dev/null | paste -sd ", " -)
  
  for env_name in "${ADDR[@]}"; do
    # Check if environment exists in JSON
    if ! echo "$API_DATA" | jq -e ".environments[] | select(.name == \"$env_name\")" >/dev/null 2>&1; then
      echo "❌ **ERROR**: Environment \`$env_name\` does not exist!" >> $GITHUB_STEP_SUMMARY
      if [ "$COUNT" == "0" ] || [ -z "$FOUND_ENVS" ]; then
        echo "   (The API returned ZERO environments. This usually means the PAT is missing the **'Environments: Read-only'** permission.)" >> $GITHUB_STEP_SUMMARY
      else
        echo "   (Found these instead: \`$FOUND_ENVS\`)" >> $GITHUB_STEP_SUMMARY
      fi
      FAILED=true
    else
      ENV_JSON=$(echo "$API_DATA" | jq -r ".environments[] | select(.name == \"$env_name\")" 2>/dev/null)
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
