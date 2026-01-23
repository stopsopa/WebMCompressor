# WebM Compressor - Electron App

A desktop application for recompressing videos to WebM format using two-pass VP9 encoding with FFmpeg.

## Features

- ✅ **Drag & Drop Interface** - Simply drop video files to start compression
- ✅ **Two-Pass VP9 Encoding** - Based on Google's recommended VP9 settings
- ✅ **Video Validation** - Uses FFprobe to validate files and extract metadata before processing
- ✅ **Quality Presets** - 5 presets (Ultra, High, Medium, Low, Tiny) with specific bitrate targets
- ✅ **Resolution Control** - Original, max width, or max height with aspect ratio preservation
- ✅ **Size Per Second Control** - Target specific KB/s output bitrate
- ✅ **Parallel Processing** - Process 1-4 videos simultaneously with dynamic scaling
- ✅ **Per-File Settings** - Override settings for individual files (except when processing)
- ✅ **Processing Queue** - View all files with duration, size, quality, status, and progress
- ✅ **Real-time Logs** - Separate tab showing all FFmpeg processing logs
- ✅ **Auto-save Settings** - Configuration saves immediately on change to `~/WebMCompressor/config.json`
- ✅ **Error Handling** - Graceful error handling with detailed logging
- ✅ **Close Protection** - Confirmation dialog if processing when closing app

## Prerequisites

- **Node.js** 18+
- **FFmpeg** 6.0+ (must be installed and available in PATH)
  - macOS: `brew install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html
  - Linux: `sudo apt install ffmpeg`

## Installation

```bash
cd electron
npm install
```

## Development

```bash
npm run dev
```

This will:

1. Start Vite dev server on http://localhost:5173
2. Compile TypeScript (main and preload)
3. Launch Electron with hot reload

## Build

```bash
npm run build
```

Builds will be created in the `release/` directory for your platform.

## Project Structure

```
electron/
├── src/
│   ├── main/
│   │   └── main.ts              # Electron main process
│   ├── preload/
│   │   └── preload.ts           # IPC bridge
│   └── renderer/
│       ├── main.tsx             # React entry point
│       ├── App.tsx              # Main app component
│       ├── types/
│       │   └── index.ts         # TypeScript type definitions
│       └── components/
│           ├── DropZone.tsx     # Drag & drop area
│           ├── GlobalSettings.tsx  # Settings panel
│           ├── Tabs.tsx         # Tab navigation
│           ├── FileList.tsx     # Processing queue
│           ├── LogsPanel.tsx    # FFmpeg logs
│           └── SettingsModal.tsx   # Per-file settings
├── public/
│   └── icon.png                 # App icon
├── index.html                   # HTML entry point
├── package.json                 # Dependencies & scripts
└── vite.config.ts               # Vite configuration
```

## FFmpeg Encoding Details

### Two-Pass VP9 Encoding

**Pass 1 (Analysis)**:

```bash
ffmpeg -i input.mp4 \
  -c:v libvpx-vp9 \
  -b:v 1800k -minrate 900k -maxrate 2610k \
  -tile-columns 4 -g 240 -threads 4 \
  -quality good -speed 4 -crf 32 \
  -pass 1 -an -f null /dev/null
```

**Pass 2 (Encoding)**:

```bash
ffmpeg -i input.mp4 \
  -c:v libvpx-vp9 \
  -b:v 1800k -minrate 900k -maxrate 2610k \
  -tile-columns 4 -g 240 -threads 4 \
  -quality good -speed 2 -crf 32 \
  -pass 2 \
  -c:a libopus -b:a 128k \
  -progress pipe:1 \
  -y output.webm
```

### Quality Presets

| Preset | CRF | Bitrate | Min   | Max   | Use Case                       |
| ------ | --- | ------- | ----- | ----- | ------------------------------ |
| Ultra  | 24  | 5000k   | 2500k | 7250k | Maximum quality, large files   |
| High   | 28  | 3000k   | 1500k | 4350k | High quality, balanced size    |
| Medium | 32  | 1800k   | 900k  | 2610k | Good quality, smaller size     |
| Low    | 36  | 1000k   | 500k  | 1450k | Acceptable quality, small size |
| Tiny   | 40  | 500k    | 250k  | 725k  | Maximum compression            |

### Output File Naming

- `video.mp4` → `video.webm`
- `video.webm` → `video[compressed].webm`
- If exists → `video[compressed][compressed].webm`
- And so on...

## Configuration

Settings are stored in `~/WebMCompressor/config.json` and include:

```json
{
  "defaultQuality": "medium",
  "defaultResolution": "original",
  "maxWidth": null,
  "maxHeight": null,
  "sizePerSecond": null,
  "parallelProcessing": 1,
  "overwriteExisting": false
}
```

## Usage Flow

1. **Drop Files** - Drag video files onto the drop zone
2. **Validation** - App validates each file using FFprobe to extract duration and file size
3. **Queue** - Valid files are added to the processing queue with current settings
4. **Processing** - Files are automatically processed using two-pass VP9 encoding
5. **Logs** - Switch to "Logs" tab to view real-time FFmpeg output
6. **Completion** - Compressed files are saved next to original files

### Managing Files

- **Click a file** to open settings modal and adjust quality/resolution
- **Remove waiting files** by clicking the ✕ button (not available while processing)
- **Adjust parallel count** to process more/fewer files simultaneously
  - Scale up: Immediately start more processes
  - Scale down: Complete current, don't start new until count matches

## Technical Notes

- **TypeScript + React + Vite** for renderer
- **Electron IPC** for secure main-renderer communication
- **FFprobe validation** before accepting files
- **Two-pass encoding** for optimal quality/size ratio
- **Immediate config saving** on any setting change
- **Tab-based UI** with file list and logs
- **Grayscale theme** for clean, professional look

## Troubleshooting

### FFmpeg not found

Make sure FFmpeg is installed and in your PATH:

```bash
ffmpeg -version
```

### Videos not validating

Check that the file is a valid video format supported by FFmpeg. View the Logs tab for detailed error messages.

### Build errors

Delete `node_modules` and `package-lock.json`, then:

```bash
npm install
npm run build
```

## License

See parent repository for license information.

## Credits

- VP9 encoding settings based on [Google's VP9 VOD recommendations](https://developers.google.com/media/vp9/settings/vod/#bitrate)
- Built with [Electron](https://www.electronjs.org/), [React](https://react.dev/), and [Vite](https://vite.dev/)
