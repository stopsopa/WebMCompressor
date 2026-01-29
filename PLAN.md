# WebM Compressor - Development Plan

## Project Overview

A professional, high-performance video compression tool built with Electron, dedicated to converting videos to WebM format using `ffmpeg`. The application features a robust queue system, precise control over compression parameters, and a premium UI inspired by the AWS Management Console aesthetics.

# IMPLEMENTATION GUIDE - VERY IMPORTANT:

WARNING: only focus on one phase and only after getting clear instruction from operator move to next phase of implementation.
WARNING: only focus on one phase and only after getting clear instruction from operator move to next phase of implementation.
WARNING: this is very important
WARNING: this is very important
WARNING: move through phases in order from 1st to the last one but only after approval from operator (operator is me a programmer who will review your code)
WARNING: move through phases in order from 1st to the last one but only after approval from operator (operator is me a programmer who will review your code)

## Technology Stack

- **Framework**: Electron + React + TypeScript + raw CSS (no Tailwind, no CSS frameworks) + Vite
- **Audio/Video Engine**: `ffmpeg` (bundled)
- **Styling**: Vanilla CSS with AWS Console aesthetics (high-quality UI, vibrant colors, structured layout)
- **Window Sizing**:
  - **Production**: Default window size 1100x800.
  - **Development**: main usable app width (excluding DevTools) make 1100px to accommodate side-by-side DevTools without squeezing the main UI.
- we will have to bundle ffmpeg and ffprobe with the app. we will not relay on user having ffmpeg installed on his system. ffmpeg have to be shipped in the final electron binary of the app.
- keep current run.sh, compile.sh, dev.sh, install.sh scripts. I need to have manual way to control lifecycle of the app with single commands. - these have to work with the phase 1.
- keep modules in electron/tools untouched - you might entire directory to different location if needed. but don't modify anything. Its already designed and tailored to this spec in PLAN.md and tested.

---

## Phase 1: UI Foundation & Video Ingestion (STEP 1)

WARNING: At this stege don't implement calling @driveCompression.ts. - not yet, wait for (phase 4)
WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase.

Build the core layout and implement the video file ingestion logic.

### UI Sections

- **FORM SECTION (Top)**: Reserved area for global compression settings.
- **DROPZONE SECTION (Middle)**: A high-visibility area for dragging and dropping video files.
- **LIST SECTION (Bottom)**: A structured table/list to display the queue of videos.
- if list items on the section LIST SECTION grow beyond available vertical space allow list section to scroll vertically. - introduce vertical scrollbar in the LIST SECTION.

### Key Logic

- **Drag & Drop Implementation**:
  - intercept `drop` events.
  - Accept any file type for initial processing.
- **File Validation & Filtering**:
  - **Deduplication**: Before processing, check if the file's absolute path is already in the queue. Do not add duplicates.
  - For each dropped file, execute `extractMetadata.ts`.
  - If `extractMetadata.ts` fails, the file is considered "not a video" (or unsupported).
  - Maintain a list of absolute paths for accepted files.
- **Feedback Mechanism**:
  - Accepted files are immediately added to the **LIST SECTION**.
  - **Rejection Modal**:
    - Display a list of files that failed validation.
    - Each entry must show the full absolute path.
    - Below the path, show the specific error message in a distinct style.
    - Include a "Reveal in Finder" button next to each path for easy access.
    - UI: Extra-wide modal with reduced font size to maximize path visibility.
  - **Context Menu**: Right-clicking a row in the **LIST SECTION** should show a menu with a "Reveal in Finder" option.
- **Metadata Storage**:
  - Store the extracted metadata in an in-memory state object for each video in the list.

---

## Phase 2: Configuration & Parameter Mapping (STEP 2)

WARNING: At this stege don't implement calling @driveCompression.ts. - not yet, wait for (phase 4)
WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase.

Implement the **FORM SECTION** to drive parameters for `driveCompression.ts`.

### Parameter Mapping

The form will capture settings that serve as "defaults" for any new file dropped into the app.

- **Scale Settings**:
  - **Checkbox**: "Scale Video" (default unticked - indicates scale = false, default value, means user will reformat video to webm but keep original dimensions of the video). When user tick this to true, then heigh of width is needed to be set by user (becomes required field) - do validation like don't allow to leave it empty. as long as entire set of values in the FORM SECTION is not valid, dropping new files is not allowed.
    signal this state visually on DROPZONE SECTION - that DROPZONE is inactive due to validation error on the FORM SECTION.
  - **Height Selection**: Provide buttons/radio buttons for standard resolutions: look fo the list heightResolutions from file @electron/src/tools/closestResolution.ts.
    - Clicking a resolution automatically ticks the "Scale" checkbox and populates the height input. - pupulate selected value to heigh input automatically
    - user can also just type in the height input manually.
  - **Width Selection**: User can also type in the width input manually.
  - But user can input height or width but not both. , provide way for user to choose, maybe readio buttons again. Make it look decent/structured.
- **Drive Compression Mapping**:
  - The `Scale Video` checkbox maps to the `scale` boolean property in `DriveCompressionOptions`.
  - The Width and Height inputs map directly to `videoWidth` and `videoHeight` respectively.
  - **Mutual Exclusivity Logic**:
    - The UI provides **Radio Buttons** to toggle between Width and Height modes.
    - Selecting a mode disables the other input and clears its value in the state.
    - Clicking a **Standard Height button** (e.g., 720p) automatically:
      1. Ticks the "Scale Video" checkbox.
      2. Switches the active mode to "Height".
      3. Populates the Height input and clears the Width input.
  - **Storage Restriction**: The application state (returned by `getForm()`) must **only** store these three fields. No presets or parallel job settings are permitted in this phase.
- **Validation Criteria**:
  - **Scale Disabled**: The form is always valid regardless of `videoWidth`/`videoHeight` values.
  - **Scale Enabled**: The form is valid **only if**:
    - Either `videoWidth` **OR** `videoHeight` is a numerical value greater than 0.
    - If both are missing or 0, or if both are somehow present, the form is invalid.
- **Form State Structure**:
  ```typescript
  interface FormSettings {
    scale: boolean;
    videoWidth: number | null;
    videoHeight: number | null;
  }
  ```
- **Automatic Parameters** (to be handled at start-of-compression):
  - `sourceFile`: Path from the individual list item. - that will be taken from the item state behind LIST SECTION. (obviously)
  - `ffmpegPath`/`ffprobePath`: Paths to bundled binaries. - that will be drived at the moment of calling @driveCompression.ts when it will be time to process video.
  - `date`: Current timestamp generated at execution time. - we can store time of dropping file on the item state behind LIST SECTION.
- **Internal State**:
  - Each video in the **LIST SECTION** stores its own copy of these settings, captured at the moment the file was dropped.
  - Important: from now on present the state behind LIST SECTION and FORM SECTION in dev mode (when project ran using dev.sh script) - using react dev tools. (ideally expose global functions `getList()` and `getForm()` of the electron developer tools which I can always call to get current state of the list or form to print it with `console.log()`)
    - `getList()`: returns the current array of videos in the queue.
    - `getForm()`: returns the current `FormSettings` object.

---

## Phase 3: Component Encapsulation & Individual Editing (STEP 3)

WARNING: At this stege don't implement calling @driveCompression.ts. - not yet, wait for (phase 4)
WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase.

Refactor the setting form into a reusable component and allow per-video tweaks.

### Features

- **Settings Component**: Encapsulate the scale/resolution logic.
- **Edit Functionality**:
  - Add an "Edit" button to each row in the **LIST SECTION**. - last row.
  - Clicking "Edit" opens a **Settings Modal**.
  - The modal uses the same Settings Component but targets the specific video's configuration - for editing - the same component as in FORM SECTION but in edit mode.
  - **Visibility**: The "Edit" button is visible only when the video status is `queued` or `error`. It is removed once processing starts or completes successfully.
- **State Constraints**:
  - Editing is permitted only for videos that have not yet started processing (state: `queued` or `waiting`).
  - while editing (as long as modal is opened) wideo will not be taken for processing. Immediately once edit modal is closed the video is returned to the pool. But don't remove it from the list. just add extra flag to the row in state behind LIST SECTION indicating that edit is in progress.

---

## Phase 4: Queue Management & Parallelism (STEP 4)

WARNING: Only at this phase (PHASE 4) do call @driveCompression.ts. - not before.

Implement the processing engine with configurable concurrency.

### Concurrency Control & Core Engine

- **Parallelism setting**: A set of radio buttons (1 to 8) at the top of the **LIST SECTION**.
- **Default**: 1 video at a time.
- **Embedded Binaries**:
  - Bundle `ffmpeg` and `ffprobe` using `ffmpeg-static` and `ffprobe-static`.
  - Implement binary path resolution logic to use bundled versions in production and `node_modules` versions in development.
  - Update `electron-builder` configuration to include these binaries in the final app bundle.
- **Dynamic Queue Logic**:
  - **Increase number**: If the count is increased, the system immediately picks the next files from the top of the queue and starts `driveCompression.ts` up to make sure N specified video are processed simultaneously.
  - **Decrease number**: If the count is decreased, current active processes are allowed to finish, but no new ones will start until the active count drops below the new limit.
  - processing videos (up to the N number of them simulatniously) should start immedeately after dropping files on DROPZONE SECTION. (as long as FORM SECTION is valid and no edit modal is opened).
- **Settings State Structure**:
  ```typescript
  interface GlobalSettings {
    parallelProcessing: number;
  }
  ```
- **Dev Tools Helpers**:
  - `getSettings()`: returns the current `GlobalSettings` object.
- **Queue Cleanup**:
  - Render a "Clear" button under the **LIST SECTION** once all files in the queue have finished processing (either successfully or with errors). This button should be visible only when the total count of files is > 0 and no files are in `validating`, `queued`, or `processing` states.
- **Developer Transparency**:
  - Add a "Copy FFMPEG Command" option to the **LIST SECTION** context menu.
  - This should copy the full `ffmpeg` command (both passes, sequentially) to the clipboard, using absolute paths for binaries and files so the user can run it manually in their terminal.
- **App Footer**:
  - Implement a thin footer at the bottom of the application.
  - **Left Side**: Display the exact versions of bundled `ffmpeg` and `ffprobe`, each wrapped in a link to `https://ffmpeg.org`.
  - **Right Side**: Display a link to the project's GitHub repository (`https://github.com/stopsopa/WebMCompressor`) with a GitHub icon.

---

## Phase 5: Progress Visualization (STEP 5)

WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase. it is allowed now to edit logic of calling @driveCompression.ts at this phase

Provide detailed, real-time feedback for the two-pass compression process.

### UI Columns in LIST SECTION (two columns)

When we launch processing of videos. Let's show progress on the list for each item, like so:
- **Pass 1 Visual**:
  - While active: A "scanning" pulsing progress bar (indeterminate).
  - Upon completion: Display the duration of the first pass (e.g., "1st: 12.5s").
- **Pass 2 Visual**:
  - While active: A compact, detailed progress bar.
  - **Overlay Text**: "Progress: XX.XX% | Total: XXs | Remaining: XXs" (skipping 1st pass duration here as it's in the neighboring column).
- **Final Result**:
  - Display the overall processing time (Duration) once both passes are complete.

  Make sure to always maintain the same width of these two columns. But reserve it's width to always fit the content we will show in these columns.
  Set width for this bar to fixed value and allow me to modify it manually from one place.
  Use one number for state pulsing bar for first pass and another number for detailed progress bar for second pass.

- new columns for progress bar should be between "Scale" and "actions" columns

Example how to track progress for pass 1 and pass 2 can be found in electron/src/tools/driveCompression.run.ts

be aware that tracking progress for pass 1 is impossible. we can only tell when processing has started, we have to use it as a beginning of pass 1 to start showing "scanning" but then we have to way for end() for the fist pass to extract how long did it take. and then we will remove "pulsing" "scanning" bar and show the duration of the first pass.

Then immediatelly whe have to show progress bar as described in "Pass 2 Visual" section in thid document and here we can track progress with event `progressEvent` again see @driveCompression.run.ts.

once that finishes we should show some numbers in the place of progress bar.

Again to explan one more time:
When you look into electron/src/tools/driveCompression.run.ts you will see how driveComparison.ts progress is tracked:
you will see thre that once we call driveCompression.ts then we register two callbacks: `progressEvent` and `end`. 
Then once processing one video is happening first we know when we have called driveCompression.ts and that indicates start of "scanning" for pass 1. 
then we wait for first end() callback to be called. Which is happening end("first", null, timeHumanReadable(firstPassDurationMs)); and we need duration passed here to print after removing this bar "scanning" in the column for pass 1 on the LIST SECTION. We remove "scanning" bar and print duration of first pass in the same column.
Then this is also moment which we should treat as the beginning of the second pass. And from that moment we want to render progress bar for second pass in the column for pass 2 on the LIST SECTION. 
and from that meoment we will wait for progressEvent to to be triggered in rapid intervals and it provides different data which we will show in human redable format overlayed on the progress bar, but between these human readable information we have also `progressPercentNum` from ProgressData which is number between 0 and 100. 
That `progressPercentNum` we should use to drive progress bar visually.
And then the last thing we supposed to wait for is last end("second", null, timeHumanReadable(Date.now() - stepStartTime));
that will provide total duration which we will show after removing progress bar fro second pass in the same place.

---

## Phase 6: Error Handling & Status Signaling (STEP 6)

WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase. it is allowed now to edit logic of calling @driveCompression.ts at this phase

Ensure robustness and provide clear diagnostic information.

### Logic

- **Global Error Wrap**: Wrap `driveCompression.ts` calls in a robust try-catch block.
- **Error Capture**: Capture stderr, stack traces, and exit codes.
- **Visual Feedback**:
  - Rows with failures should change appearance (e.g., red background/border or error icon).
  - **Show Error Button**: A button appearing only on failed rows.
- **Error Modal**: Opens a detailed view of the captured error information for troubleshooting.
- allow me also to remove row from LIST SECTION. - add another delete button for that. row cannot be removed when it is currently processed by @driveCompression.ts.

---

## Phase 7: Persistence & Defaults (STEP 7)

WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase. it is allowed now to edit logic of calling @driveCompression.ts at this phase

Implement user settings persistence across sessions.

### Storage

- **User Config**: Store in `~/.webmcompressor/setup.json`.
- **Config file structure**:
  ```typescript
  interface AppSetup {
    form: FormSettings;
    settings: GlobalSettings;
  }
  ```
- **App Defaults**: Shipped in `electron/setup.json`.
- **Startup Flow**:
  1. Check for `~/.webmcompressor/setup.json`.
  2. If missing, copy from `electron/setup.json`.
  3. Populate the **FORM SECTION** and global settings with these values on launch.
  4. allow me later to tune electron/setup.json

---

## UI/UX Design Goals (AWS Console Style)

- **Structure**: Clean, boxed layouts with subtle borders (`#d5dbdb`).
- **Typography**: Sans-serif, clear hierarchy (Amazon Ember or system sans-serif).
- **Colors**:
  - Secondary actions: White with gray borders.
  - Primary actions: AWS Orange (`#ff9900`) for "Start/Process" or "Save".
  - Status: AWS Green for success, AWS Red for errors.
- **Spacing**: Generous padding and consistent alignment.
- **Interactivity**: Hover states for buttons and rows, smooth modal transitions.
- ffmpeg embedded in the app.

# do later

reordering before starting compression
