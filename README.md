<p align="center">
  <img src="electron/public/banner.png" alt="WebMCompressor Banner" width="600">
</p>

# WebMCompressor

[![Latest Release](https://img.shields.io/github/v/release/stopsopa/webmcompressor)](https://github.com/stopsopa/webmcompressor/releases)

A premium desktop application for high-efficiency video recompression to WebM format using **two-pass VP9 encoding**. Built with Electron, React, and Vite, it provides a powerful yet intuitive interface for batch processing videos with professional-grade quality.

## ✨ Key Features

- 🚀 **Two-Pass VP9 Encoding** – Uses Google's recommended settings (Analysis + Encoding) for the best quality-to-size ratio.
- 🧵 **Parallel Processing** – Scale up to 8 simultaneous jobs to utilize your CPU's full potential.
- 🎯 **Quality Presets** – Choose from Ultra, High, Medium, Low, and Tiny presets with optimized bitrate targets.
- ⚠️ **Upscaling Detection** – Visual warnings if target dimensions exceed the original video size to prevent quality loss.
- 📦 **Bulk Operations** – Select multiple files for removal or reconfiguration.
- 🖱️ **Contextual Power** – Right-click rows to reveal files in Finder/Explorer or copy the exact FFmpeg command used.
- 🧠 **Smart Defaults** – Automatically calculates aspect ratios and suggests optimal settings based on the source.
- 🎨 **Modern Aesthetics** – Sleek dark-mode interface with glassmorphism elements and smooth transitions.

## 🛠 Tech Stack

- **Framework:** [Electron](https://www.electronjs.org/)
- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Engine:** [FFmpeg](https://ffmpeg.org/) & [FFprobe](https://ffmpeg.org/ffprobe.html)
- **Styling:** Vanilla CSS with modern CSS features
- **CI/CD:** GitHub Actions with automated releases for Win/Mac (x64 & ARM64)

## 📥 Installation

You can download the latest production-ready installers for Windows and macOS directly from the **[Releases](https://github.com/stopsopa/webmcompressor/releases)** page.

- **Windows:** Download the `.exe` installer (available for x64 and ARM64).
- **macOS:** Download the `.dmg` installer (available for Intel/x64 and Apple Silicon/ARM64).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

_Note: You don't need to install FFmpeg manually for production builds; the app bundles the appropriate binaries for your architecture._

### Development

1. Clone the repository:

   ```bash
   git clone https://github.com/stopsopa/webmcompressor.git
   cd webmcompressor/electron
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Download platform-specific binaries for development:

   ```bash
   ./download-bins.sh
   ```

4. Launch the application:
   ```bash
   npm run dev
   ```

### Local Build Scripts

For specialized build tasks or testing CI/CD logic locally, several utility scripts are available in the `electron/` directory:

- **`./download-bins.sh [os] [arch]`**: Manual FFmpeg/FFprobe binary downloader. Defaults to your current system if no arguments are provided.
- **`./build.dmg.sh`**: (macOS only) A complete "clean build" script that replicates the automated Mac production build process.
- **`./test-win.sh`**: A versatile script to test various target builds (Windows/Mac, x64/ARM64). It features an interactive menu to select your target.
- **`./run.sh`**: A quick-launch script to run the local development build.

Example: To build for Windows ARM64 from macOS:

```bash
/bin/bash ./test-win.sh "win32 arm64"
```

---

### Building

To create a production-ready installer:

```bash
npm run build
```

Artifacts will be generated in the `electron/release` directory.

## 📈 Quality Presets

| Preset     | CRF | Target Bitrate | Use Case                              |
| :--------- | :-- | :------------- | :------------------------------------ |
| **Ultra**  | 24  | 5000k          | Archival quality, large files         |
| **High**   | 28  | 3000k          | High-end streaming, great balance     |
| **Medium** | 32  | 1800k          | Standard web usage, optimized size    |
| **Low**    | 36  | 1000k          | Bandwidth saving, mobile-friendly     |
| **Tiny**   | 40  | 500k           | Maximum compression, small thumbnails |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the GPL-2.0 License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/stopsopa">stopsopa</a>
</p>
