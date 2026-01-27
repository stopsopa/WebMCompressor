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
- **Metadata**: `ffprobe` (via `extractMetadata.ts`)
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
  - For each dropped file, execute `extractMetadata.ts`.
  - If `extractMetadata.ts` fails, the file is considered "not a video" (or unsupported).
  - Maintain a list of absolute paths for accepted files.
- **Feedback Mechanism**:
  - Accepted files are immediately added to the **LIST SECTION**.
  - **Rejection Modal**: Display a list of files that failed validation, requiring user dismissal.
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
  - **Height Selection**: Provide buttons/radio buttons for standard resolutions: `240, 360, 480, 720, 1080, 1440, 2160`.
    - Clicking a resolution automatically ticks the "Scale" checkbox and populates the height input. - pupulate selected value to heigh input automatically
    - user can also just type in the height input manually.
  - **Width Selection**: User can also type in the width input manually. 
  - But user can input height or width but not both. , provide way for user to choose, maybe readio buttons again. Make it look decent/structured.
- **Automatic Parameters** (to be handled at start-of-compression):
  - `sourceFile`: Path from the individual list item. - that will be taken from the item state behind LIST SECTION. (obviously)
  - `ffmpegPath`/`ffprobePath`: Paths to bundled binaries. - that will be drived at the moment of calling @driveCompression.ts when it will be time to process video.
  - `date`: Current timestamp generated at execution time. - we can store time of dropping file on the item state behind LIST SECTION.
- **Internal State**:
  - Each video in the **LIST SECTION** stores its own copy of these settings, captured at the moment the file was dropped.

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
- **State Constraints**:
  - Editing is permitted only for videos that have not yet started processing (state: `queued` or `waiting`).
  - while editing (as long as modal is opened)  wideo will not be taken for processing. Immediately once edit modal is closed the video is returned to the pool. But don't remove it from the list. just add extra flag to the row in state behind LIST SECTION indicating that edit is in progress.

---

## Phase 4: Queue Management & Parallelism (STEP 4)

WARNING: Only at this phase (PHASE 4) do call @driveCompression.ts. - not before.

Implement the processing engine with configurable concurrency.

### Concurrency Control

- **Parallelism setting**: A set of radio buttons (1 to 8) at the top of the **LIST SECTION**.
- **Default**: 1 video at a time.
- **Dynamic Queue Logic**:
  - **Increase number**: If the count is increased, the system immediately picks the next files from the top of the queue and starts `driveCompression.ts` up to make sure N specified video are processed simultaneously.
  - **Decrease number**: If the count is decreased, current active processes are allowed to finish, but no new ones will start until the active count drops below the new limit.
  - processing videos (up to the N number of them simulatniously) should start immedeately after dropping files on DROPZONE SECTION. (as long as FORM SECTION is valid and no edit modal is opened).  

---

## Phase 5: Progress Visualization (STEP 5)

WARNING: FOCUS ONLY ON THE SCOPE OF THIS PHASE. - don't implement anything that is not in the scope of this phase. it is allowed now to edit logic of calling @driveCompression.ts at this phase

Provide detailed, real-time feedback for the two-pass compression process.

### UI Columns in LIST SECTION

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
- **App Defaults**: Shipped in `electron/setup.json`.
- **Startup Flow**:
  1. Check for `~/.webmcompressor/setup.json`.
  2. If missing, copy from `electron/setup.json`.
  3. Populate the **FORM SECTION** with these values on launch.
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

