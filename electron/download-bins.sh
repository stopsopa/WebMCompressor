DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

set -e

# Move to the directory where the script is located to ensure paths are relative to electron/
cd "${DIR}"

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "${0} error: curl is not installed. Please install curl to download binaries."
    exit 1
fi

OS_ARG="${1}"
ARCH_ARG="${2}"

# If arguments are missing, try to detect the current system
if [ -z "${OS_ARG}" ]; then
    DETECTED_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    if [ "${DETECTED_OS}" = "darwin" ]; then
        OS_ARG="darwin"
    elif [[ "${DETECTED_OS}" == "mingw"* ]] || [[ "${DETECTED_OS}" == "msys"* ]] || [[ "${DETECTED_OS}" == "cygwin"* ]]; then
        OS_ARG="win32"
    else
        # Default to win32 only if we are on a system that looks like windows
        if [ "$OS" = "Windows_NT" ]; then
            OS_ARG="win32"
        else
            echo "${0} error: OS argument (1) is missing and could not be detected. Usage: /bin/bash ${DIR}/download-bins.sh [darwin|win32] [x64|arm64]"
            exit 1
        fi
    fi
    echo "🔍 Detected OS: ${OS_ARG}"
fi

if [ -z "${ARCH_ARG}" ]; then
    DETECTED_ARCH=$(uname -m)
    if [ "${DETECTED_ARCH}" = "arm64" ] || [ "${DETECTED_ARCH}" = "aarch64" ]; then
        ARCH_ARG="arm64"
    else
        ARCH_ARG="x64"
    fi
    echo "🔍 Detected ARCH: ${ARCH_ARG}"
fi

# Validation and mapping
if [ "${OS_ARG}" != "darwin" ] && [ "${OS_ARG}" != "win32" ]; then
    echo "${0} error: Unsupported OS_ARG=>${OS_ARG}<. Only 'darwin' and 'win32' are supported."
    exit 1
fi

if [ "${ARCH_ARG}" != "x64" ] && [ "${ARCH_ARG}" != "arm64" ]; then
    echo "${0} error: Unsupported ARCH_ARG=>${ARCH_ARG}<. Only 'x64' and 'arm64' are supported."
    exit 1
fi

# Target architecture for the directory structure
TARGET_OS="${OS_ARG}"
TARGET_ARCH="${ARCH_ARG}"

# Architecture to actually download (might be different due to fallbacks)
DOWNLOAD_OS="${OS_ARG}"
DOWNLOAD_ARCH="${ARCH_ARG}"

# Specific check for Windows arm64 which is often not available for ffmpeg-static
# If Windows arm64 is requested, we fallback to x64 as Windows can run x64 binaries via emulation
if [ "${OS_ARG}" = "win32" ] && [ "${ARCH_ARG}" = "arm64" ]; then
    cat <<EEE

    ⚠️  NOTE: FFmpeg binaries for Windows arm64 are not available from the source.
       Falling back to win32/x64 binaries (Windows on ARM can run these via emulation).
       OS_ARG=>${OS_ARG}< ARCH_ARG=>${ARCH_ARG}< -> Using x64 for download, keeping arm64 directory.

EEE

    DOWNLOAD_ARCH="x64"
fi

# Clear the entire bin directory to ensure only the requested binaries for this OS/ARCH are present
BIN_DIR="${DIR}/bin"
TARGET_DIR="${BIN_DIR}/${TARGET_OS}/${TARGET_ARCH}"

echo "🧹 Clearing existing binaries in ${BIN_DIR}..."
rm -rf "${BIN_DIR}"

# Create directory structure
mkdir -p "${TARGET_DIR}"

# Version of binaries to download
# Based on eugeneware/ffmpeg-static b6.1.1 release which contains both ffmpeg and ffprobe
VERSION="b6.1.1"
BASE_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/${VERSION}"

echo "--------------------------------------------------------"
echo "📥 Downloading FFmpeg and FFprobe binaries for ${TARGET_OS} ${TARGET_ARCH}..."
echo "--------------------------------------------------------"

# Download function
download_bin() {
    local name="${1}"
    
    # On Windows, we append .exe to the local filename
    local local_file_name="${name}"
    if [ "${TARGET_OS}" = "win32" ]; then
        local_file_name="${name}.exe"
    fi
    
    local target="${DIR}/bin/${TARGET_OS}/${TARGET_ARCH}/${local_file_name}"
    local url="${BASE_URL}/${name}-${DOWNLOAD_OS}-${DOWNLOAD_ARCH}"
    
    if [ -f "${target}" ]; then
        echo "   [ok] ${local_file_name} (${TARGET_OS}/${TARGET_ARCH}) already exists."
    else
        echo "   [+] ${local_file_name} (${TARGET_OS}/${TARGET_ARCH}) -> ${target}"
        if ! curl -L -f -o "${target}" "${url}"; then
            echo "${0} error: Failed to download name=>${name}< for TARGET_OS=>${TARGET_OS}< / TARGET_ARCH=>${TARGET_ARCH}< from source url=>${url}<"
            exit 1
        fi
        chmod +x "${target}"
    fi
}

# Download both ffmpeg and ffprobe
download_bin "ffmpeg"
download_bin "ffprobe"

echo "--------------------------------------------------------"
echo "✅ Binaries ready in ${BIN_DIR}"
echo "--------------------------------------------------------"
ls -R -lah "${BIN_DIR}"

# Audit: Check if there are EXACTLY 2 files in the bin directory
FILE_COUNT=$(find "${BIN_DIR}" -type f | wc -l | xargs)
if [ "${FILE_COUNT}" != "2" ]; then
    echo "${0} error: Audit failed. Expected 2 files in ${BIN_DIR}, but found ${FILE_COUNT}."
    echo "Directory structure:"
    find "${BIN_DIR}" -maxdepth 4 -ls
    exit 1
fi
echo "Audit passed: found exactly ${FILE_COUNT} files in ${BIN_DIR}."
