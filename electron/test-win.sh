DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Script to replicate the Windows build process locally as closely as possible to CI/CD
# This script is designed to be run from the root of the project or the electron/ directory.

set -e

# Replicate being in the 'electron' directory
cd "${DIR}"

ARCH_ARG="${1}"

if [ -z "${ARCH_ARG}" ]; then
    if [ -t 0 ]; then
        echo "⚠️  Architecture argument is required."
        echo "Please select a target architecture:"
        PS3="Enter choice [1-2]: "
        options=("x64" "arm64")
        select opt in "${options[@]}"
        do
            case "${opt}" in
                "x64"|"arm64")
                    ARCH_ARG="${opt}"
                    break
                    ;;
                *) echo "❌ Invalid selection. Please try again.";;
            esac
        done
        echo ""
    else
        echo "${0} error: Architecture argument is required when not running interactively."
        echo "Usage: /bin/bash ${DIR}/test-win.sh [x64|arm64]"
        exit 1
    fi
fi

# Normalize architecture name
TARGET_ARCH="x64"
if [[ "${ARCH_ARG}" == "arm" || "${ARCH_ARG}" == "arm64" ]]; then
    TARGET_ARCH="arm64"
elif [[ "${ARCH_ARG}" == "x64" ]]; then
    TARGET_ARCH="x64"
else
    echo "${0} error: Invalid architecture ARCH_ARG=>${ARCH_ARG}<. Use 'x64' or 'arm64'."
    exit 1
fi

echo "--------------------------------------------------------"
echo "🛠️  Starting Windows Test Build for: win32 / ${TARGET_ARCH}"
echo "--------------------------------------------------------"

# 0. Clear release directory
echo "🧹 Step 0: Clearing release directory..."
rm -rf "release/*"
rm -rf "release/.*"

# 1. Download binaries (exactly as CI does)
echo "📥 Step 1: Downloading binaries..."
/bin/bash "${DIR}/download-bins.sh" "win32" "${TARGET_ARCH}"

# 2. Build the app (Vite + TS)
echo "📦 Step 2: Building application..."
npm run build

# 3. Binary Audit (replicated from CI/CD pipeline)
echo "🔍 Step 3: Binary Audit..."
echo "Listing bin directory content:"
if [ -d "bin" ]; then
  if command -v tree &> /dev/null; then
    tree bin
  else
    find bin -maxdepth 4 -ls
  fi
  
  # Audit: Check if there are EXACTLY 2 files in the bin directory
  BIN_DIR="${DIR}/bin"
  FILE_COUNT=$(find "${BIN_DIR}" -type f | wc -l | xargs)
  if [ "${FILE_COUNT}" != "2" ]; then
      echo "${0} error: Binary Audit failed. Expected 2 files in ${BIN_DIR}, but found ${FILE_COUNT}."
      exit 1
  fi
  echo "Audit passed: found exactly ${FILE_COUNT} files."
else
  echo "${0} error: bin directory NOT FOUND in $(pwd)"
  exit 1
fi

# 4. Packaging
echo "🏗️  Step 4: Packaging Electron App..."
# Enable verbose logging just like in CI/CD
export DEBUG=electron-builder

# Run electron-builder for windows
# Note: On non-Windows platforms (like macOS), this will use Wine if available or just generate the unpacked dir
npx electron-builder --win "--${TARGET_ARCH}" --publish never

echo "--------------------------------------------------------"
echo "✅ Build completed for ${TARGET_ARCH}"
echo "--------------------------------------------------------"
echo "Check the 'release' directory for the generated installer:"
echo ""
ls -lh release/*.exe 2>/dev/null || ls -lh release/
echo ""
echo "The binary is located in: $(pwd)/release"
