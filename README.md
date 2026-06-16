# Blacklist

A very simple website blocker for Google Chrome, designed for personal use to
help with procrastination.

When you find yourself on a site that's eating your time, click the Blacklist
toolbar icon and hit **Blacklist this site**. From then on, navigating to that
site redirects you to a block page while Blacklist is enabled.

To start visiting a blocked site again, navigate to it, and on the block page
click **Unlist this site**. You then have to wait out a 15-second countdown
(you can cancel it) before the site is unlisted and you're redirected back —
just enough friction to make you think twice.

To disable Blacklist entirely, open `chrome://extensions` and toggle it off.

## 2026 rewrite

This was originally written in 2012 against Manifest V2. It has been rewritten
for modern Chrome:

- **Manifest V3** — service worker instead of a persistent background page,
  `action` instead of `browser_action`.
- **`declarativeNetRequest`** dynamic redirect rules instead of the removed
  blocking `webRequest` API.
- **TypeScript** throughout, bundled with **esbuild**.
- **No jQuery, no Bootstrap** — vanilla DOM and modern CSS (incl. dark mode).

## Project layout

```
src/
  manifest.json          MV3 manifest
  service-worker.ts       owns the declarativeNetRequest rules
  lib/blocklist.ts        storage + DNR rule sync (shared)
  lib/messages.ts         typed messaging helpers
  popup/                  toolbar popup (html/css/ts)
  blocked/                block page with unlist countdown (html/css/ts)
icons/                    extension icons
build.mjs                 esbuild build script
```

## Development

```sh
npm install
npm run build      # one-off build into build/
npm run watch      # rebuild on change
npm run typecheck  # tsc --noEmit
```

Then load the unpacked extension:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `build/` directory

To package for the Chrome Web Store, zip the contents of `build/`.

## License

MIT — see the `LICENSE` file.
