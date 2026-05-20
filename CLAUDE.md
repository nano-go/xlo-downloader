See [README.md](README.md) for project introduction.

# Architecture

```
entrypoints/
├── background.ts       # Service worker — handles download requests via offscreen document
├── content.ts          # Content script — injected into pages to extract images
├── offscreen.html      # Offscreen document — creates blob URLs for ZIP downloads
└── popup/              # Extension popup UI (React)
    ├── App.tsx
    ├── components/     # UI components
    └── hooks/          # React hooks (data fetching, filters, selection, async lock)

utils/                  # Shared utilities (error handling, page image types, etc.)
```

# Tech Stack

- **[WXT](https://wxt.dev)** — Extension framework
- **React 19** — UI
- **Tailwind CSS 4** — Styling
- **TypeScript** — Language
- **Vite** — Bundler
- **[client-zip](https://www.npmjs.com/package/client-zip)** — ZIP generation in browser
- **[react-icons](https://react-icons.github.io/react-icons/)** (Lucide) — Icons

# Permissions

- `activeTab` — Access the current page's DOM for image extraction
- `scripting` — Inject content scripts
- `downloads` — Trigger file downloads
- `offscreen` — Create an offscreen document for blob URL handling
- `host_permissions` (`<all_urls>`) — Fetch images from any origin

# Development

```bash
# Install dependencies
bun install

# Build for production
bun run build

# Compile (type-check only)
bun run compile

# Run tests
bun test

# Package for distribution
bun run zip
```

> Don't use `bun run dev` — it won't work with the current setup.
