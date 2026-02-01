DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

set -e

# Replicate being in the 'electron' directory
cd "${DIR}"

rm -rf "${DIR}/release/mac-arm64"

# Detect OS and ARCH for download-bins.sh
OS_NAME="unknown"
if [[ "${OSTYPE}" == "darwin"* ]]; then
    OS_NAME="darwin"
elif [[ "${OSTYPE}" == "msys" || "${OSTYPE}" == "cygwin" || "${OSTYPE}" == "win32" ]]; then
    OS_NAME="win32"
fi

ARCH_NAME="unknown"
UNAME_M=$(uname -m)
if [[ "${UNAME_M}" == "arm64" || "${UNAME_M}" == "aarch64" ]]; then
    ARCH_NAME="arm64"
elif [[ "${UNAME_M}" == "x86_64" ]]; then
    ARCH_NAME="x64"
fi

if [ "${OS_NAME}" = "unknown" ] || [ "${ARCH_NAME}" = "unknown" ]; then
    echo "${0} error: Could not determine OS or ARCH (OS_NAME=>${OS_NAME}<, ARCH_NAME=>${ARCH_NAME}<)"
    exit 1
fi

echo "Detected Platform: ${OS_NAME} ${ARCH_NAME}"

/bin/bash "${DIR}/download-bins.sh" "${OS_NAME}" "${ARCH_NAME}"

if [ "${OS_NAME}" = "darwin" ]; then
  npx electron-builder --mac "--${ARCH_NAME}" --publish never
else
  # Assuming windows
  npx electron-builder --win "--${ARCH_NAME}" --publish never
fi

# ls -R "release/mac-arm64/WebMCompressor.app/Contents/Resources/bin"
# What to look for: You should see darwin/arm64/ffprobe and darwin/x64/ffprobe (and the same for ffmpeg).

# then I should run
# ./release/mac-arm64/WebMCompressor.app/Contents/MacOS/WebMCompressor
