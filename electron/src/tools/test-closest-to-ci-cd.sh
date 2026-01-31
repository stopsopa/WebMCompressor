set -e

rm -rf release/mac-arm64

npx electron-builder --mac --arm64 --publish never

# ls -R "release/mac-arm64/WebMCompressor.app/Contents/Resources/bin"
# What to look for: You should see darwin/arm64/ffprobe and darwin/x64/ffprobe (and the same for ffmpeg).

# then I should run
# ./release/mac-arm64/WebMCompressor.app/Contents/MacOS/WebMCompressor



