<p align="left">
  <img src="electron/public/icon.png" alt="WebMCompressor Icon" width="128">  
</p>

# WebMCompressor

![Image](https://github.com/user-attachments/assets/2c552c07-5b02-4edb-95e8-1ad4d0a1c94a)

[![Latest Release](https://img.shields.io/github/v/release/stopsopa/webmcompressor)](https://github.com/stopsopa/webmcompressor/releases)

Minimalistic desktop application for **macOS and Windows** for high-efficiency video recompression to WebM format using **ffmpeg two-pass VP9 encoding**, following [Google's VP9 VOD recommendations](https://developers.google.com/media/vp9/settings/vod/) (essentially achieving the same result when uploading to YouTube - the same levels of compression and quality).

## ✨ Key Features

- 🚀 **Two-Pass VP9 Encoding** – Uses Google's recommended settings (Analysis + Encoding) for the best quality-to-size ratio.
- 🧵 **Parallel Processing** – Scale up to 8 simultaneous jobs to utilize your CPU's full potential.
- 🎯 **Quality Presets** – Choose from Ultra, High, Medium, Low, and Tiny presets with optimized bitrate targets.
- ⚠️ **Upscaling Detection** – Visual warnings if target dimensions exceed the original video size to prevent quality loss.
- 📦 **Bulk Operations** – Select multiple files for removal or reconfiguration.
- 🖱️ **Contextual Power** – Right-click rows to reveal files in Finder/Explorer or copy the exact FFmpeg command used.
- 🧠 **Smart Defaults** – Automatically calculates aspect ratios and suggests optimal settings based on the source.
- 🌐 **Native Browser Support** – WebM is natively supported by all [modern browsers](https://caniuse.com/webm), including **Chrome**, **Firefox**, **Edge**, and **Safari**, ensuring seamless playback across the web.

## 🛠 Tech Stack

- **Framework:** [Electron](https://www.electronjs.org/)
- **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Engine:** [FFmpeg](https://ffmpeg.org/) & [FFprobe](https://ffmpeg.org/ffprobe.html)
- **Styling:** Vanilla CSS with modern CSS features
- **CI/CD:** GitHub Actions with automated releases for Win/Mac (x64 & ARM64)

## 📥 Installation (TLDR version)

Just go to [download binary selector helper](https://stopsopa.github.io/WebMCompressor/main/download.html)

>
> [!NOTE]
> Pay attention to "possible issues" section below the download list.
>

## 📥 Installation

Pretty much follow instruction for other similar tool [LaymanSync](https://github.com/stopsopa/LaymanSync?tab=readme-ov-file#installation) (installation is described there in details) but obviously download from this repository [release page](https://github.com/stopsopa/WebMCompressor/releases)


## 📄 License

Distributed under the GPL-2.0 License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/stopsopa">stopsopa</a>
</p>
