#!/bin/bash

# check-gh-environments.sh
# Verifies that specific GitHub environments exist and have "Required Reviewers" enabled.

REQUIRED_ENVS=$1
REPO=$2

if [ -z "$REQUIRED_ENVS" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <required_envs_comma_separated> <repository_full_name>"
  exit 1
fi

cat <<EOF >> "$GITHUB_STEP_SUMMARY"
### 🛡️ Pre-flight Environment Check
EOF

# --- Token Diagnostics ---
TOKEN_TYPE="Unknown"
if [[ "$GH_TOKEN" == ghs_* ]]; then TOKEN_TYPE="Default GITHUB_TOKEN (Restricted)"; fi
if [[ "$GH_TOKEN" == github_pat_* ]]; then TOKEN_TYPE="Fine-grained PAT"; fi
if [[ "$GH_TOKEN" == ghp_* ]]; then TOKEN_TYPE="Classic PAT"; fi

if [ -z "$GH_TOKEN" ]; then TOKEN_TYPE="EMPTY (Not found)"; fi

cat <<EOF >> "$GITHUB_STEP_SUMMARY"
DEBUG: Repository: \`$REPO\`
DEBUG: Token detected: **$TOKEN_TYPE**
DEBUG: Testing repository visibility...
EOF
# -------------------------

ENVS_TO_CHECK=$(echo "$REQUIRED_ENVS" | tr -d ' ')
IFS=',' read -ra ADDR <<< "$ENVS_TO_CHECK"

FAILED=false

# 1. Try to fetch environments via API
# Note: GITHUB_TOKEN might not have permission, so we handle failure gracefully.
REPO_DATA=$(gh api "repos/$REPO" --jq '{name: .full_name, visibility: .visibility}' 2>/dev/null || echo "REPO_HIDDEN")

if [ "$REPO_DATA" == "REPO_HIDDEN" ]; then
  cat <<EOF >> "$GITHUB_STEP_SUMMARY"
❌ **ERROR**: Token cannot even see the repository \`$REPO\`!
   Check that you selected this repository in your PAT settings under **'Repository access'**.
EOF
  API_DATA="PERMISSION_ERROR"
else
  cat <<EOF >> "$GITHUB_STEP_SUMMARY"
✅ Token can see repository: \`$(echo $REPO_DATA | jq -r .name)\` ($(echo $REPO_DATA | jq -r .visibility))
EOF
  
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
  cat <<EOF >> "$GITHUB_STEP_SUMMARY"
<details><summary>🔍 Raw API Response Structure (Debug)</summary>

$(if [ "$API_DATA" == "PERMISSION_ERROR" ]; then
  echo "❌ **API Error**: $API_ERR"
else
  echo '```json'
  echo "$API_DATA" | jq '.'
  echo '```'
fi)
</details>
EOF
fi

if [ "$API_DATA" == "PERMISSION_ERROR" ]; then
  cat <<EOF >> "$GITHUB_STEP_SUMMARY"
### 🛑 Permission Denied
The token provided does not have permission to read repository Environments via API.

To fix this and unblock the pipeline, you must provide a token with higher privileges:

1. **Option A: Fine-grained personal access token** (Most Secure):
   - **Repository access**: Select **'Only select repositories'** -> Choose this repository (\`$REPO\`).
   - **Permissions**: Under 'Repository permissions', set the following to **'Read-only'**:
     - **'Environments'**
     - **'Actions'** (Required to access environment metadata)

2. **Option B: Classic personal access token** (Most Reliable Fallback):
   - If Option A continues to return **403 Forbidden**, use a Classic PAT.
   - **Scopes**: Select the **'repo'** scope.

3. **Apply the Token**:
   - Add the resulting token to this repository's **SECRET** (not VARIABLE) as \`GH_ADMIN_TOKEN\`.
   - Ensure your YAML (\`pipeline.yml\`) uses \`GH_TOKEN: \${{ secrets.GH_ADMIN_TOKEN || secrets.GITHUB_TOKEN }}\`.

**Why?** This pipeline is configured to verify that environments (\`$REQUIRED_ENVS\`) are gated for safety.
EOF
  exit 1
else
  # Debug: Show the raw structure (total_count)
  COUNT=$(echo "$API_DATA" | jq -r '.total_count' 2>/dev/null)
  
  cat <<EOF >> "$GITHUB_STEP_SUMMARY"

DEBUG: API says \`total_count\` is: **$COUNT**
EOF
  
  # Debug: Show what we actually found
  FOUND_ENVS=$(echo "$API_DATA" | jq -r '.environments[].name' 2>/dev/null | paste -sd ", " -)
  
  for env_name in "${ADDR[@]}"; do
    # Check if environment exists in JSON
    if ! echo "$API_DATA" | jq -e ".environments[] | select(.name == \"$env_name\")" >/dev/null 2>&1; then
      cat <<EOF >> "$GITHUB_STEP_SUMMARY"
- ❌ **ERROR**: Environment \`$env_name\` does not exist!
$(if [ "$COUNT" == "0" ] || [ -z "$FOUND_ENVS" ]; then
  echo "  - (The API returned ZERO environments. This usually means the PAT is missing the **'Environments: Read-only'** permission.)"
else
  echo "  - (Found these instead: \`$FOUND_ENVS\`)"
fi)
EOF
      FAILED=true
    else
      ENV_JSON=$(echo "$API_DATA" | jq -r ".environments[] | select(.name == \"$env_name\")" 2>/dev/null)
      
      # Debug: List all rule types found
      RULE_TYPES=$(echo "$ENV_JSON" | jq -r '.protection_rules[].type' 2>/dev/null | paste -sd ", " -)
      
      # Check for protection rules (required_reviewers)
      HAS_GATES=$(echo "$ENV_JSON" | jq -r '.protection_rules[] | select(.type == "required_reviewers")' 2>/dev/null)
      if [ -z "$HAS_GATES" ]; then
        echo "- ❌ **ERROR**: Environment \`$env_name\` exists but has **NO Required Reviewers**!" >> "$GITHUB_STEP_SUMMARY"
        if [ -n "$RULE_TYPES" ]; then
          echo "  - (Found these other rules instead: \`$RULE_TYPES\`)" >> "$GITHUB_STEP_SUMMARY"
        fi
        FAILED=true
      else
        echo "- ✅ Environment \`$env_name\` is correctly gated." >> "$GITHUB_STEP_SUMMARY"
      fi
    fi
  done
fi

if [ "$FAILED" = true ]; then
  cat <<EOF >> "$GITHUB_STEP_SUMMARY"

### 🛑 Deployment Safety Violation
This pipeline is designed to STOP for approval before moving to QA or Production.

**Note for Private Repositories:**
GitHub only supports **Required Reviewers** for:
- 🌎 **Public** repositories (Free)
- 🔒 **Private** repositories on **Pro, Team, or Enterprise** plans.

If you are on a **Free plan with a Private repository**, you cannot use this feature. You must either make the repository Public or upgrade your plan to unblock this check.

To fix this, go to **Settings -> Environments** and add yourself as a **Required Reviewer** for these environments:
$(for env_name in "${ADDR[@]}"; do echo "- $env_name"; done)

<img src="https://i.imgur.com/s0GKlS5.png" width="800" />

https://i.imgur.com/s0GKlS5.png 
EOF
  exit 1
fi

