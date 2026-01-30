#!/bin/bash
# build.dmg.sh - Replicates the GitHub Actions build process locally.

# 1. Move to the electron directory (if not already there)
cd "$(dirname "$0")"

echo "🧹 Cleaning previous builds..."
rm -rf release/
rm -rf dist/
rm -rf dist-electron/

echo "📦 Installing dependencies (npm ci)..."
npm ci

echo "🏗️ Compiling source code (npm run build)..."
/bin/bash compile.sh

echo "📦 Packaging DMG (electron-builder)..."
# We use --publish never to ensure it doesn't try to upload to GitHub
npx electron-builder --mac --publish never

echo "✅ Local build complete! Check the 'electron/release/' folder."
open release
