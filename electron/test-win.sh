DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Script to replicate the build process locally as closely as possible to CI/CD
# This script is designed to be run from the root of the project or the electron/ directory.

set -e

# Replicate being in the 'electron' directory
cd "${DIR}"

# Define the full sequence of targets
ALL_TARGETS=(
  "win32 x64"
  "win32 arm64"
  "darwin x64"
  "darwin arm64"
)

declare -a TARGETS_TO_BUILD

ARCH_ARG="${1}"

if [ -z "${ARCH_ARG}" ]; then
    if [ -t 0 ]; then
        echo "⚠️  Selection is required."
        echo "Please select a target or 'all':"
        PS3="Enter choice [1-5]: "
        options=("win32 x64" "win32 arm64" "darwin x64" "darwin arm64" "all")
        select opt in "${options[@]}"
        do
            case "${opt}" in
                "win32 x64"|"win32 arm64"|"darwin x64"|"darwin arm64")
                    TARGETS_TO_BUILD=("${opt}")
                    break
                    ;;
                "all")
                    TARGETS_TO_BUILD=("${ALL_TARGETS[@]}")
                    break
                    ;;
                *) echo "❌ Invalid selection. Please try again.";;
            esac
        done
        echo ""
    else
        echo "${0} error: Argument is required when not running interactively."
        echo "Usage: /bin/bash ${DIR}/test-win.sh [win32 x64 | win32 arm64 | darwin x64 | darwin arm64 | all]"
        exit 1
    fi
else
    if [ "${ARCH_ARG}" = "all" ]; then
        TARGETS_TO_BUILD=("${ALL_TARGETS[@]}")
    else
        # Allow passing "win32 x64" etc if quoted
        # Or just match against known targets
        MATCHED=0
        for T in "${ALL_TARGETS[@]}"; do
            if [ "${ARCH_ARG}" = "${T}" ]; then
                TARGETS_TO_BUILD=("${T}")
                MATCHED=1
                break
            fi
        done
        
        if [ "${MATCHED}" = "0" ]; then
            # Fallback for simple "x64" or "arm64" (defaulting to win32 for backward compatibility of this script's name)
            if [ "${ARCH_ARG}" = "x64" ]; then
                TARGETS_TO_BUILD=("win32 x64")
            elif [ "${ARCH_ARG}" = "arm64" ]; then
                TARGETS_TO_BUILD=("win32 arm64")
            else
                echo "${0} error: Invalid target ARCH_ARG=>${ARCH_ARG}<. Use 'win32 x64', 'win32 arm64', 'darwin x64', 'darwin arm64' or 'all'."
                exit 1
            fi
        fi
    fi
fi

echo "--------------------------------------------------------"
echo "🛠️  Starting Build Sequence"
echo "--------------------------------------------------------"

# 0. Clear release directory
echo "🧹 Step 0: Clearing release directory..."
# Use globbing to clear contents of the symlinked directory
rm -rf release/* 2>/dev/null || true
rm -rf release/.* 2>/dev/null || true

# 1. Build the frontend (once for all)
echo "📦 Step 1: Building frontend application..."
npm run build

for TARGET in "${TARGETS_TO_BUILD[@]}"; do
    # Split the target into OS and ARCH
    # Using read to handle "win32 x64" format
    read -r OS ARCH <<< "${TARGET}"
    
    echo ""
    echo "========================================================"
    echo "🚀 BUILDING TARGET: ${OS} / ${ARCH}"
    echo "========================================================"
    
    # a. Download binaries (this handles clearing bin/ and auditing)
    echo "📥 Step A: Downloading binaries for ${OS}/${ARCH}..."
    /bin/bash "${DIR}/download-bins.sh" "${OS}" "${ARCH}"
    
    # b. Packaging
    echo "🏗️  Step B: Packaging Electron App..."
    export DEBUG=electron-builder
    
    if [ "${OS}" = "win32" ]; then
        npx electron-builder --win "--${ARCH}" --publish never
    elif [ "${OS}" = "darwin" ]; then
        npx electron-builder --mac "--${ARCH}" --publish never
    fi
    
    echo "✅ Completed: ${OS} / ${ARCH}"
done

echo ""
echo "--------------------------------------------------------"
echo "🎉 Requested builds completed!"
echo "--------------------------------------------------------"
echo "Check the 'release' directory for the generated installers:"
echo ""
ls -lh release/
