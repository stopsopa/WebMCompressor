DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

set -e

# Move to the directory where the script is located to ensure paths are relative to electron/
cd "${DIR}"

# Check dependencies
if ! command -v curl &> /dev/null; then
    echo "${0} error: curl is not installed. Please install curl to download binaries."
    exit 1
fi

# Create directory structure
mkdir -p "${DIR}/bin/darwin/x64"
mkdir -p "${DIR}/bin/darwin/arm64"

# Version of binaries to download
# Based on eugeneware/ffmpeg-static b6.1.1 release which contains both ffmpeg and ffprobe
VERSION="b6.1.1"
BASE_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/${VERSION}"

echo "--------------------------------------------------------"
echo "📥 Downloading FFmpeg and FFprobe binaries for macOS..."
echo "--------------------------------------------------------"

# Download function
download_bin() {
    local name="${1}"
    local arch="${2}"
    local target="${DIR}/bin/darwin/${arch}/${name}"
    local url="${BASE_URL}/${name}-darwin-${arch}"
    
    if [ -f "${target}" ]; then
        echo "   [ok] ${name} (${arch}) already exists."
    else
        echo "   [+] ${name} (${arch}) -> ${target}"
        if ! curl -L -f -o "${target}" "${url}"; then
            echo "${0} error: Failed to download ${name} for ${arch} from source url=>${url}<"
            exit 1
        fi
        chmod +x "${target}"
    fi
}

# x64 binaries
download_bin "ffmpeg" "x64"
download_bin "ffprobe" "x64"

# arm64 binaries
download_bin "ffmpeg" "arm64"
download_bin "ffprobe" "arm64"

echo "--------------------------------------------------------"
echo "✅ All binaries ready in electron/bin/"
echo "--------------------------------------------------------"
ls -R "${DIR}/bin/"
