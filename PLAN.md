# WebM Compressor - Electron App Plan

## Overview

A desktop application for recompressing videos to WebM format using FFmpeg. The app provides a simple, grayscale UI for drag-and-drop video processing with customizable compression settings and parallel processing capabilities.

---

## Project Structure

```
electron/
├── main.js                 # Electron main process
├── preload.js             # Preload script for IPC bridge
├── renderer/
│   ├── index.html         # Main window UI
│   ├── styles.css         # Grayscale styling
│   ├── app.js             # Main application logic
│   ├── components/
│   │   └── settings-modal.js  # Reusable settings component
│   ├── services/
│   │   ├── ffmpeg.js      # FFmpeg interaction
│   │   ├── queue.js       # Processing queue manager
│   │   └── config.js      # Settings persistence
│   └── utils/
│       ├── file-utils.js  # File operations & deduplication
│       └── validation.js  # Input validation
├── assets/
│   └── icon.png           # Custom app icon (generated)
├── ffmpeg/
│   ├── bin/               # FFmpeg binaries (platform-specific)
│   │   ├── ffmpeg-darwin-x64
│   │   ├── ffmpeg-darwin-arm64
│   │   ├── ffmpeg-win32-x64.exe
│   │   └── ffmpeg-linux-x64
│   └── downloader.js      # Script to download FFmpeg binaries
├── package.json
└── electron-builder.yml   # Build configuration
```

---

## Core Features

### 1. **Drag & Drop Interface**

- **Drop Zone**: Small area at the top of the window for file drops
- **Deduplication**: Automatically remove duplicate files based on absolute path
- **Immediate Processing**: Files are queued and processed as soon as they're dropped
- **File List**: Main area displays all files with their status, settings, and progress

### 2. **Compression Settings**

#### Quality Presets (Two-Pass VP9 Encoding)

All presets use **two-pass encoding** for optimal quality/size ratio based on Google's VP9 recommendations:

**Pass 1**: Analysis pass with `-speed 4` (faster analysis)
**Pass 2**: Encoding pass with `-speed 2` (higher quality output)

| Preset               | CRF | Target Bitrate | Min Bitrate | Max Bitrate | Use Case                       |
| -------------------- | --- | -------------- | ----------- | ----------- | ------------------------------ |
| **Ultra**            | 24  | 5000k          | 2500k       | 7250k       | Maximum quality, large files   |
| **High**             | 28  | 3000k          | 1500k       | 4350k       | High quality, balanced size    |
| **Medium** (default) | 32  | 1800k          | 900k        | 2610k       | Good quality, smaller size     |
| **Low**              | 36  | 1000k          | 500k        | 1450k       | Acceptable quality, small size |
| **Tiny**             | 40  | 500k           | 250k        | 725k        | Maximum compression            |

**Bitrate Formula**:

- `minrate = bitrate × 0.5`
- `maxrate = bitrate × 1.45`

**Common Parameters** (all presets):

- `-tile-columns 4`: Parallel encoding tiles for faster processing
- `-g 240`: Keyframe interval (10 seconds at 24fps)
- `-threads 4`: Number of threads to use
- `-quality good`: Quality/speed tradeoff mode
- `-c:a libopus`: Opus audio codec
- `-b:a 128k`: Audio bitrate

**Reference**: Based on [Google's VP9 VOD settings](https://developers.google.com/media/vp9/settings/vod/#bitrate)

#### Resolution Settings

- **Default**: Original resolution (no rescaling)
- **Max Width**: User-defined max width with auto-calculated height (preserve aspect ratio)
- **Max Height**: User-defined max height with auto-calculated width (preserve aspect ratio)
- **Auto-calculation**: Backend calculates the appropriate dimension to preserve ratio

#### Target File Size (Optional)

- **Default**: Use quality preset bitrates
- **Custom Target Size**: User can specify desired output file size (e.g., "50MB", "500KB")
- **Auto-calculate Bitrate**: When target size is set:
  1. Get input video duration using FFprobe
  2. Calculate required bitrate: `bitrate = (targetSize × 8) / duration`
  3. Override preset bitrate with calculated value
  4. Apply min/max bitrate formula (0.5× to 1.45×)
- **Priority**: Target size overrides quality preset bitrates if both are set

#### Settings Behavior

- **Global Settings**: Top panel shows current default settings
- **Per-File Settings**: Each file "locks in" the settings at the moment it's dropped
- **Runtime Changes**: Global settings can be changed while processing; affects only new drops
- **Per-File Override**: Click any list item to open modal and override its specific settings

### 3. **Processing Queue**

#### Parallel Processing

- **Default**: 1 video at a time
- **User Control**: Slider/input to set concurrent processing (1-4 recommended max)
- **Dynamic Scaling**:
  - **Increase**: Immediately start more processes to match new count
  - **Decrease**: Complete current processes, don't start new ones until count matches
- **Minimum**: Always 1

#### Error Handling

- **Try-Catch**: Wrap each file's processing in comprehensive error handling
- **Error Logging**: Capture FFmpeg stderr and any JS errors
- **Error Display**: Show error message in file list item
- **Graceful Degradation**: Move to next file on error, don't stop queue

### 4. **Progress Tracking**

- **FFmpeg Progress**: Parse FFmpeg output for time/frame progress
- **Progress Bar**: Visual bar showing % complete
- **Time Estimate**: Display estimated time remaining (if FFmpeg provides data)
- **Status Indicators**:
  - Queued (gray)
  - Processing (blue/animated)
  - Complete (green)
  - Error (red)

### 5. **Output Files**

- **Location**: Same directory as source file
- **Naming Convention**:
  - Source: `video.mp4` → Output: `video.webm`
  - Source: `video.webm` → Output: `video[compressed].webm`
- **Collision Handling**: If output already exists:
  then `video[compressed].webm` becomes `video[compressed][compressed].webm`
  if `video[compressed][compressed].webm` given then `video[compressed][compressed][compressed].webm` and so on

---

## User Interface

### Layout (Grayscale Design)

```
┌─────────────────────────────────────────────────────────┐
│  WebM Compressor                                    ⊡ ✕ │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │   Drop videos here to compress                    │ │
│  │   📁 Drag & Drop                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─── Global Settings ─────────────────────────────┐   │
│  │  Quality: [Medium ▼]                            │   │
│  │  Resolution: [Original ▼] Max: [____] px        │   │
│  │  Target Size: [____] MB (optional)              │   │
│  │  Parallel: [1 ▼]                                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── Processing Queue ─────────────────────────────┐  │
│  │                                                   │  │
│  │  video1.mp4                          [████░░] 80% │  │
│  │  Medium • 1920x1080 • ~2 min left                │  │
│  │                                                   │  │
│  │  video2.mov                          [░░░░░] 0%  │  │
│  │  High • Original • Queued                        │  │
│  │                                                   │  │
│  │  video3.avi                          [████████] ✓│  │
│  │  Low • 1280x720 • Complete                       │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Processing Queue Scrollbar**:

- **Scrollable Area**: When the file list exceeds available vertical space, a scrollbar appears
- **Auto-hide**: Scrollbar is invisible when all files fit within the window
- **CSS**: Use `overflow-y: auto` to show scrollbar only when needed
- **Smooth Scrolling**: No need - just regular scrolling - keep it simple

### Settings Modal

- **Trigger**: Click any file in the list
- **Component**: Reuse same component as global settings
- allow removing lines from the list when in waiting state, once start processing only after stopping processing of that particular file. 
- **Content**:
  - Quality preset dropdown (Ultra/High/Medium/Low/Tiny)
  - Resolution options (Original / Max Width / Max Height)
  - Input field for max dimension (when not Original)
  - Save/Cancel buttons
- **Apply**: Updates only that specific file's settings

### Grayscale Color Scheme

```css
Background:      #1a1a1a (dark gray)
Card/Panel:      #2d2d2d (medium dark)
Text:            #e0e0e0 (light gray)
Borders:         #404040 (medium gray)
Drop Zone:       #3a3a3a (hover: #454545)
Progress Bar:    #666666 → #999999
Success:         #6b6b6b (muted green-gray)
Error:           #8a8a8a (muted red-gray)
```

---

## Technical Implementation

### 1. **Electron Main Process (`main.js`)**

- Initialize Electron app
- Create main window (800x600, resizable)
- Set custom icon
- Handle window close event:
  - If processing: Show confirmation modal
  - If idle: Close immediately
- IPC handlers for:
  - File processing requests
  - Progress updates
  - Config read/write

### 2. **Preload Script (`preload.js`)**

- Expose safe IPC methods via `contextBridge`:
  - `startProcessing(files, settings)`
  - `updateSettings(fileId, settings)`
  - `getProgress(fileId)`
  - `loadConfig()`
  - `saveConfig(settings)`
  - `onProgressUpdate(callback)`
  - `onProcessComplete(callback)`
  - `onError(callback)`

### 3. **FFmpeg Integration (`services/ffmpeg.js`)**

#### Binary Management

- **Bundling**: Include FFmpeg binaries for all platforms
- **Detection**: Auto-detect platform and use appropriate binary
- **Path**: Store in `electron/ffmpeg/bin/`

# INput formats

Accept all normal formats ffmpeg accepts.
Detect if input file is not video file. Ideally allow ffmpeg to handle it.

Maybe we could use some ffmpeg functionality to extract length of the video to determine this way if this is video which ffmpeg will be able to handle.

I just want to somehow interact with the file not just assume it is ok by just looking at the extension.
During this scanning we can early detect potential issues. 
Since we will be extracting how long video is and generally touching the file. add two columns to the list:
- Filename (by default)
- Video length
- Video size

#### Two-Pass Compression Process

**Pass 1 (Analysis)**:

```bash
ffmpeg -loglevel error \
  -i input.mp4 \
  -c:v libvpx-vp9 \
  -b:v 1800k \
  -minrate 900k \
  -maxrate 2610k \
  -tile-columns 4 \
  -g 240 \
  -threads 4 \
  -quality good \
  -speed 4 \
  -crf 32 \
  -pass 1 \
  -an \
  -f null \
  /dev/null  # Windows: NUL
```

**Pass 2 (Encoding)**:

```bash
ffmpeg -loglevel error \
  -i input.mp4 \
  -c:v libvpx-vp9 \
  -b:v 1800k \
  -minrate 900k \
  -maxrate 2610k \
  -tile-columns 4 \
  -g 240 \
  -threads 4 \
  -quality good \
  -speed 2 \
  -crf 32 \
  -pass 2 \
  -c:a libopus \
  -b:a 128k \
  -progress pipe:1 \
  -y \
  output.webm
```

**With Resolution Scaling** (if max width/height is set):

- No scaling filter applied by default
- If max width specified: `-vf scale='min(iw,1920):-2'`
- If max height specified: `-vf scale='-2:min(ih,1080)'`
- The `-2` ensures even dimensions (required for VP9)

# quality options

Control rather by size per second then by final file size. 
Usually it is much harder to control compression to achieve particular size of the output file - avoid that.

1. **Get video duration**:

   ```bash
   ffprobe -v error -show_entries format=duration \
     -of default=noprint_wrappers=1:nokey=1 input.mp4
   # Output: 125.5 (seconds)
   ```

2. **Calculate required bitrate**:

   ```javascript
   // Convert target size to bits
   const targetSizeBytes = targetSize * (unit === "MB" ? 1024 * 1024 : 1024);
   const targetSizeBits = targetSizeBytes * 8;

   // Reserve space for audio (128k * duration)
   const audioBitrate = 128 * 1024; // 128k in bits/sec
   const audioSizeBits = audioBitrate * duration;

   // Calculate video bitrate
   const videoBitrate = (targetSizeBits - audioSizeBits) / duration;

   // Apply min/max formula
   const minBitrate = videoBitrate * 0.5;
   const maxBitrate = videoBitrate * 1.45;
   ```


#### Progress Parsing

- Parse FFmpeg's `-progress pipe:1` output
- Extract: `time=`, `frame=`, `fps=`, `bitrate=`
- Calculate percentage based on input duration
- Estimate time remaining

### 4. **Queue Manager (`services/queue.js`)**

- **Queue Structure**: Array of file tasks
- **Task States**: `queued`, `processing`, `complete`, `error`
- **Scheduling**:
  - Maintain `activeProcesses` count
  - Start new tasks when `activeProcesses < maxParallel`
  - On completion/error, decrement and check queue
- **Dynamic Resize**:
  - `setMaxParallel(n)`: Update limit, auto-start if needed
  - Respect new limit when starting next task

### 5. **Config Management (`services/config.js`)**

#### Storage Location

```
~/WebMCompressor/config.json
```

#### Persisted Settings

```json
{
  "defaultQuality": "medium",
  "defaultResolution": "original",
  "maxWidth": null,
  "maxHeight": null,
  "targetSize": null,
  "targetSizeUnit": "MB",
  "parallelProcessing": 1,
  "overwriteExisting": false
}
```

#### Behavior

- **On Start**: Load config, apply to UI
- **On Change**: Save immediately (debounced)
- **File List**: NOT persisted (clears on restart)

### 6. **File List Persistence (In-Memory)**

- **Structure**:

```javascript
{
  id: 'unique-id',
  path: '/absolute/path/to/file.mp4',
  name: 'file.mp4',
  outputPath: '/absolute/path/to/file.webm',
  settings: {
    quality: 'medium',
    resolution: 'original',
    maxWidth: null,
    maxHeight: null,
    targetSize: null,
    targetSizeUnit: 'MB'
  },
  status: 'queued',
  progress: 0,
  error: null,
  startTime: null,
  endTime: null
}
```

### 7. **Renderer Process (`app.js`)**

#### Initialization

1. Load config from disk
2. Populate global settings UI
3. Set up event listeners:
   - Drop zone (dragover, drop)
   - Settings inputs (change)
   - File list clicks

#### File Drop

1. Prevent default drag behavior
2. Extract file paths from event
3. Filter for video files (mp4, mov, avi, mkv, webm, etc.) by extracting length of the video - vetting before accepting for processing.
4. Deduplicate against existing list
5. Create task objects with current global settings
6. Add to queue
7. Trigger processing

#### UI Updates

- **Progress**: Listen to IPC events, update progress bars
- **Status**: Update icons/colors based on task state
- **Completion**: Show checkmark, disable editing
- **Errors**: Display error message, allow retry

---

## Window & App Behavior

### Close Button (X)

- **Default**: Close app immediately
- **While Processing**: Show native dialog:

  ```
  Processing in progress

  Are you sure you want to quit?
  Incomplete conversions will be lost.

  [Cancel]  [Quit]
  ```

### App Lifecycle

- **On Launch**:
  - Load settings from `~/WebMCompressor/config.json`
  - File list starts empty
- **On Quit**:
  - Don't save settings on quit
  - settings save every time any option will be changed immediately to `~/WebMCompressor/config.json`

---

## .github Integration

### Modifications Needed

- **Workflow Files**: Update to reference `electron/package.json`
- **Build Scripts**: Ensure `electron-builder` is configured
- **Platform Targets**:
  - macOS (dmg, zip)
  - Windows (nsis, portable)
  - Linux (AppImage, deb)
- **Artifacts**: Publish built binaries to GitHub Releases
- **Auto-updater**: Optional, integrate `electron-updater`

### Files to Modify

```
.github/
├── workflows/
│   ├── build.yml           # Update working-directory to ./electron
│   ├── release.yml         # Update paths and build commands
│   └── test.yml            # Add any renderer tests
```

### Key Changes

1. Set `working-directory: ./electron` for all steps
2. Update `package.json` scripts to include `build:mac`, `build:win`, `build:linux`
3. Configure `electron-builder.yml` for packaging
4. Ensure FFmpeg binaries are bundled in `extraResources`

---

## Custom Icon Generation

### Requirements

- **Format**: PNG, 1024x1024 (will be converted to icns/ico)
- **Design**:
  - Modern, minimalist
  - Represents video compression/conversion
  - Icon should feature WebM logo or play button with compression waves
  - Grayscale or subtle color accent

### Integration

1. Generate icon asset (to be created via image generation)
2. Place in `electron/assets/icon.png`
3. Update `electron-builder.yml`:

```yaml
mac:
  icon: assets/icon.png
win:
  icon: assets/icon.png
linux:
  icon: assets/icon.png
```

---

## Error Handling Strategy

### Levels

#### 1. **FFmpeg Errors**

- **Detection**: Parse stderr from FFmpeg process
- **Common Errors**:
  - Invalid codec
  - Unsupported format
  - Disk full
  - Permission denied
- **Handling**:
  - Log full error to console
  - Display user-friendly message in UI
  - Mark task as failed
  - Continue to next file

#### 2. **File System Errors**

- **Reading**: Source file doesn't exist or is unreadable
- **Writing**: Output directory not writable
- **Handling**: Show error, skip file

#### 3. **Application Errors**

- **Uncaught**: Global error handler logs to file
- **IPC Errors**: Retry mechanism for communication failures

### Error Display

```
❌ video.mp4
   Error: Unable to encode - invalid codec
   [Retry] [Remove]
```

# list is in tab, in other tab process logs
log tab with all logs from ffmpeg processing whre user can see errors
---

## Development Workflow

### Phase 1: Setup

1. Initialize Electron project in `electron/`
2. Install dependencies: `electron`, `electron-builder`
3. Set up basic window with HTML/CSS

### Phase 2: Core Features

1. Implement drag & drop
2. Build settings UI
3. Integrate FFmpeg (test with sample file)
4. Create queue manager

### Phase 3: Advanced Features

1. Progress tracking with FFmpeg output parsing
2. Per-file settings modal
3. Config persistence
4. Error handling

### Phase 4: Polish

1. Generate custom icon
2. Refine grayscale UI
3. Add animations/transitions
4. Close confirmation modal

### Phase 5: Build & Release

1. Configure electron-builder
2. Update .github workflows
3. Test builds on all platforms
4. Document release process

---

## Testing Checklist

### Functional

- [ ] Drag & drop adds files to list
- [ ] Deduplication works correctly
- [ ] Files process one at a time (default)
- [ ] Parallel processing works (2-3 files)
- [ ] Changing parallel count scales up/down correctly
- [ ] Settings lock in at drop time
- [ ] Per-file settings modal saves correctly
- [ ] Original files remain unchanged
- [ ] Output files generated in correct location
- [ ] Naming convention handles .webm sources
- [ ] Progress bar updates accurately
- [ ] Time estimates are reasonable
- [ ] Errors don't crash app
- [ ] Error messages are helpful
- [ ] Settings persist after restart
- [ ] File list clears on restart
- [ ] Close confirmation appears when processing
- [ ] Close works immediately when idle

### UI/UX

- [ ] Drop zone is obvious and inviting
- [ ] Grayscale theme is consistent
- [ ] File list is scrollable
- [ ] Modal is centered and accessible
- [ ] Progress indicators are clear
- [ ] Status icons are intuitive

### Cross-Platform

- [ ] macOS: App builds and runs
- [ ] Windows: App builds and runs
- [ ] Linux: App builds and runs
- [ ] FFmpeg binaries work on all platforms
- [ ] Icon displays correctly on all platforms

---

## Dependencies

### Required npm Packages

```json
{
  "dependencies": {
    "electron": "^28.0.0"
  },
  "devDependencies": {
    "electron-builder": "^24.0.0"
  }
}
```

### FFmpeg

- **Version**: 6.0+ (supports VP9 and Opus)
- **Download Sources**:
  - Static builds: https://ffmpeg.org/download.html
  - Platform-specific: https://github.com/eugeneware/ffmpeg-static
- **License**: LGPL/GPL (ensure compliance, especially for redistribution)

---

## Future Enhancements (Post-MVP)

1. **Batch Actions**: Clear all, remove completed, pause all
2. **Audio Settings**: Separate audio quality control
3. **Format Options**: Support other output formats (MP4, AV1)
4. **Presets Import/Export**: Share quality presets
5. **Hardware Acceleration**: Use GPU encoding if available
6. **Preview**: Before/after quality comparison
7. **Metadata**: Preserve or strip video metadata
8. **Notifications**: System notifications on completion
9. **Dark/Light Mode**: Toggle (keeping grayscale palette)
10. **Filters**: Apply FFmpeg filters (crop, rotate, etc.)

---

## Notes

- **Vanilla JS**: No frameworks, pure JavaScript for renderer
- **Simplicity**: Keep UI minimal and functional
- **Robustness**: Prioritize error handling and recovery
- **Performance**: Handle large files and long processing times gracefully
- **User Control**: Give user full control over settings and queue

---

## Implementation Summary

### Key Technical Decisions

1. **Two-Pass VP9 Encoding**
   - Based on Google's VP9 VOD recommendations
   - Pass 1: Fast analysis with `-speed 4`
   - Pass 2: High-quality encoding with `-speed 2`
   - Constrained VBR (Variable Bitrate) with min/max bounds

2. **Bitrate Management**
   - Preset-based bitrates for quality levels
   - Optional target file size with automatic bitrate calculation
   - Formula: `minrate = 0.5×bitrate`, `maxrate = 1.45×bitrate`

3. **Progressive Enhancement**
   - Start with quality preset
   - Optionally add resolution constraints
   - Optionally override with target file size
   - All settings lock in at drop time

4. **Parallel Processing**
   - Dynamic scaling (1-4 concurrent processes recommended)
   - Scale up: Immediate
   - Scale down: Complete current, don't start new until count matches

5. **Error Isolation**
   - Each file processes independently
   - Errors don't block queue
   - Full error logging for debugging

---

## Questions / Decisions Needed

1. **Overwrite Behavior**: Should we ask before overwriting existing .webm files?
2. **Max Parallel**: What should be the maximum allowed parallel processes? (Suggest 4)
3. **File Filters**: Which video formats to accept in drop zone?
4. **Config Location**: Confirm `~/WebMCompressor/config.json` is acceptable
5. **Progress Accuracy**: FFmpeg progress can be unreliable - acceptable if estimates are rough?
6. **Icon Style**: Any specific preferences for the app icon design?
