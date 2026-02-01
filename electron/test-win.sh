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

# Check if the user provided an architecture/OS argument (e.g., ./test-win.sh x64)
if [ -z "${ARCH_ARG}" ]; then
    # CASE 1: No argument provided. Check if we are in an interactive terminal.
    if [ -t 0 ]; then
        # If terminal is interactive, prompt the user with a selection menu.
        echo "⚠️  Selection is required."
        echo "Please select a target or 'all':"
        
        # PS3 is the prompt string used by the 'select' command.
        PS3="Enter choice [1-5]: "
        
        # Define available options for the user to pick from.
        options=("win32 x64" "win32 arm64" "darwin x64" "darwin arm64" "all")
        
        # The 'select' loop creates the numbered menu.
        select opt in "${options[@]}"
        do
            case "${opt}" in
                # Individual target selected: create a single-element array.
                "win32 x64"|"win32 arm64"|"darwin x64"|"darwin arm64")
                    TARGETS_TO_BUILD=("${opt}")
                    break
                    ;;
                # 'all' selected: copy everything from the master ALL_TARGETS list.
                "all")
                    TARGETS_TO_BUILD=("${ALL_TARGETS[@]}")
                    break
                    ;;
                # Handle invalid user input.
                *) echo "❌ Invalid selection. Please try again.";;
            esac
        done
        echo ""
    else
        # If NOT interactive and no argument was provided, we cannot proceed.
        echo "${0} error: Argument is required when not running interactively."
        echo "Usage: /bin/bash ${DIR}/test-win.sh [win32 x64 | win32 arm64 | darwin x64 | darwin arm64 | all]"
        exit 1
    fi
else
    # CASE 2: Argument was provided.
    if [ "${ARCH_ARG}" = "all" ]; then
        # Build everything if the argument is "all".
        TARGETS_TO_BUILD=("${ALL_TARGETS[@]}")
    else
        # Validate the argument against the list of known valid targets.
        # This allows passing full strings like "win32 x64".
        MATCHED=0
        for T in "${ALL_TARGETS[@]}"; do
            if [ "${ARCH_ARG}" = "${T}" ]; then
                TARGETS_TO_BUILD=("${T}")
                MATCHED=1
                break
            fi
        done
        
        # If no exact match (like "win32 x64") was found, handle shorthand fallbacks.
        if [ "${MATCHED}" = "0" ]; then
            # Shorthand for x64: Default to Windows (legacy behavior of this specific script).
            if [ "${ARCH_ARG}" = "x64" ]; then
                TARGETS_TO_BUILD=("win32 x64")
            # Shorthand for arm64: Default to Windows.
            elif [ "${ARCH_ARG}" = "arm64" ]; then
                TARGETS_TO_BUILD=("win32 arm64")
            else
                # Argument exists but matches nothing we know.
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
