# Toss App-in-Ad Simulator — Agent Guidance

## Project: React + Vite + TypeScript based Toss in-app ad simulator

This repository is a frontend simulator for testing Toss App-in-Ad SDK functionality. It runs locally via Vite and displays a simulated mobile ad experience with bridge event monitoring.

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Copy env config (required for API calls)
cp .env.example .env.local
# Set GEMINI_API_KEY in .env.local

# 3. Run the app locally
npm run dev
```

The app runs at `http://localhost:3000`. Three tabs are available at the top:
- **📱 웹앱 미션뷰** — Mobile app frame preview (default)
- **⚙️ 테스터 콘솔** — Host simulator with URL params & bridge log monitor
- **📄 개발 가이드** — Code exporter (JS/React/Console manifest)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at `:3000`, host=0.0.0.0 |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` and `server.js` |

## Project Structure

```
src/
  main.tsx        — Entry point, renders App under StrictMode
  App.tsx         — Tabbed UI (preview/simulator/guide)
  types.ts        — AdParams, BridgeLog, AdStep interfaces
  components/     — AdContent, HostSimulator, CodeExporter
  index.css       — Tailwind @import
  utils/audio.ts  — Web Audio synth for click/reward/success sounds
```

**Key types** (`src/types.ts`):
- `AdParams` — userId, adId, rewardPoints, environment, hasQuiz, quizQuestion/Answer/Options
- `BridgeLog` — id, timestamp, type ('sent'/'received'/'info'), event, payload
- `AdStep` — `'intro' \| 'interaction' \| 'completed'`

## Architecture Notes

- **PostMessage bridge**: All SDK events flow via `window.parent.postMessage({source: 'toss-app-in-ad-sdk', event, payload}, '*')`. The host simulator captures these via `window.addEventListener('message', ...)`. Local custom events dispatch as `toss-bridge-event` for in-app preview.
- **Three-step flow**: `intro` → `interaction` (tap gimmick or quiz) → `completed`. State is managed with `step` in `App.tsx`.
- **Quiz mode**: Toggle `hasQuiz` on/off in the host simulator. When enabled, `quizQuestion`, `quizAnswer`, and `quizOptions` become configurable.
- **Audio**: Click, reward, and success sounds use the Web Audio API. If `ctx.state === 'suspended'`, `resume()` is called auto-magically.
- **No test script**: There is no automated test suite. Verification is manual via the running app.
- **Lint only**: `npm run lint` runs `tsc --noEmit` only — no ESLint, no prettier enforcement via scripts.

## Environment

- `.env.example` defines `GEMINI_API_KEY` and `APP_URL`. Both are loaded by `dotenv`.
- `.env*` files are gitignored; copy `.env.example` to `.env.local` and set values.
- The dev server uses `hmr: process.env.DISABLE_HMR !== 'true'` and `watch: process.env.DISABLE_HMR === 'true' ? null : {}` to disable file watching when needed.

## Mac Mini Management Safety Rules

<!-- These rules are inherited from the codex-manage-macmini workspace governance. They apply when operating on this macmini host. -->

Default to read-only investigation and planning. Do not create, modify, delete, or move files without explicit user approval. Do not install or uninstall software, change macOS settings, run `sudo`, or alter permissions without explicit user approval.

Do not open, inspect, copy, summarize, or print secrets or private stores, including passwords, API keys, Keychain data, `.env` files, certificates, tokens, or credentials. If a task appears to require secret access, stop and ask for a safer user-provided alternative.

Do not scan `/Users`, `/Volumes`, full disks, or broad system paths without permission. Inspect only paths the user explicitly names. If work outside this workspace is necessary, first present the exact path, the command to run, and the reason, then wait for approval before proceeding.

Do not begin Mac inspection proactively. First provide a plan, identify risks, and wait for the user to approve the next concrete action.

## Gotchas & Conventions

- **Tab binding**: The three top tabs (preview/simulator/guide) are mutually exclusive — only one is visible at a time per viewport width. On mobile (< lg), only one tab shows; on lg+, all three columns coexist.
- **Reset**: The "테스트 처음부터 다시하기" button resets `step` to `'intro'`, clears tap count, timer, quiz status, and dispatches `TEST_RESET` via the bridge.
- **Duplicate log suppression**: Both `AdContent` and `HostSimulator` guard against duplicate bridge events within 300ms (`Date.now() - new Date(l.timestamp).getTime() < 300`).
- **Audio must resume**: On first user interaction, `playClickSound()` calls `ctx.resume()` if the AudioContext is suspended (browser autoplay policy).
- **Type checking only**: `npm run lint` checks Typescript types but does not catch runtime errors or lint style issues beyond what `tsc` reports.