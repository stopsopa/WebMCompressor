DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# build.dmg.sh - Replicates the GitHub Actions build process locally.

# 1. Move to the electron directory (if not already there)
cd "${DIR}"

echo "🧹 Cleaning previous builds..."
rm -rf "${DIR}/release/"
rm -rf "${DIR}/dist/"
rm -rf "${DIR}/dist-electron/"

echo "📦 Installing dependencies (npm ci)..."
npm ci

echo "📥 Downloading binaries..."
/bin/bash "${DIR}/download-bins.sh"

echo "🏗️ Compiling source code (npm run build)..."
/bin/bash "${DIR}/compile.sh"

echo "📦 Packaging DMG (electron-builder)..."
# We use --publish never to ensure it doesn't try to upload to GitHub
npx electron-builder --mac --publish never

echo "✅ Local build complete! Check the 'electron/release/' folder."
open "${DIR}/release"
