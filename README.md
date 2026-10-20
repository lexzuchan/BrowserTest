# Vixenn

A futuristic Windows desktop browser built with Electron, Chromium, and Blink. This is a working first-version source project, not a Chromium fork.

## Run on Windows

Install Node.js 22 or newer from https://nodejs.org, open PowerShell in this folder, then run:

```powershell
npm install
npm run check
npm start
```

## Build the executable

```powershell
npm run dist
```

The portable executable appears in `release/Vixenn-0.1.0-Windows.exe`. It is unsigned; signing and an updater must be configured before public distribution. Dependency installation and packaging require internet access. The included GitHub Actions workflow also builds a downloadable executable artifact.

## Included

- Independent website tabs using WebContentsView, rather than iframe embeds
- Address and Google search bar, back/forward, reload/stop, popups opened in new tabs
- Persistent cookies, bookmarks, and local browsing history (500 entries)
- Downloads with a save dialog and progress panel
- Violet, crimson, and cyan themes; custom window controls; fullscreen
- Ctrl+L, Ctrl+T, Ctrl+W, Ctrl+R, Ctrl+D, Ctrl+Tab, Ctrl+Shift+Tab, F11

Website renderers have sandboxing and context isolation enabled, Node.js disabled, and no privileged preload bridge. Only the trusted local interface can issue app commands. Unsupported URL schemes are rejected. Certificate validation is left enabled. Website permissions are denied in this version.

## Current limits

This is an early development browser. There is no extension store, password manager, sync, private mode, session restore, automatic updater, ad blocker, or DRM integration. New-window links open as tabs, but window.opener-dependent authentication flows may not work. Do not present it as a finished security-audited everyday browser. Regular Electron security updates are required.

Bookmarks/history/preferences are saved in Electron's Vixenn user-data folder (normally `%APPDATA%/Vixenn` or `%APPDATA%/vixenn`); website storage is under its persistent session. Clearing history does not erase website cookies. Downloads are shown for the current app session.

## GitHub

Copy these files to your BrowserTest repository, including `.github/workflows/build.yml`. Push to `main`, or launch the **Build Windows** workflow manually. Download the **Vixenn-Windows** artifact from its successful run.
