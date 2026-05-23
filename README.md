# XLO - Image Downloader Chrome Extension

A mobile-friendly Chrome extension for downloading images from web pages.

# Features

- **Scan** — Extract all images from the current page via the content script
- **Filter** — Narrow results by image type (PNG/JPG, GIF/WebP) or dimension range
- **Select** — Toggle individual images, select all filtered results, or clear selection
- **Download** — Package selected images into a ZIP file with one click
- **Copy** — Copy selected image URLs to clipboard

# Install

See [release page](https://github.com/nano-go/xlo-downloader/releases/) for latest version.

# Build

1. Clone the repository and navigate to the project directory:

```bash
git clone git@github.com:nano-go/xlo-downloader.git
cd xlo-downloader
```

2. Install dependencies:

```bash
bun install
```

3. Build the extension:

```bash
bun run build # or `bun run zip` to generate a ZIP file
```
