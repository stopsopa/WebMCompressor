#!/bin/bash
# build.dmg.lite.sh - Fast local DMG build.
# Skips npm ci and full clean to save time.

cd "$(dirname "$0")"

echo "🏗️  Compiling source code..."
npm run build

echo "📦 Packaging DMG (Fast)..."
# We skip 'npm ci' to use existing node_modules
npx electron-builder --mac --publish never --dir -c.compression=store

echo "✅ Lite build complete! Check the 'electron/release/' folder."
open release
