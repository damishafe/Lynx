# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo-style workspace. Today there is one app:

- [frontend/](frontend/) — Next.js 16 + React 19 web app (App Router, TypeScript, Tailwind v4).

Future services would live as siblings to `frontend/`. The root has no build/test tooling of its own; commands run from inside the relevant subproject.

## Working in `frontend/`

All commands below run from [frontend/](frontend/):

- `npm run dev` — start the dev server on http://localhost:3000.
- `npm run build` — production build.
- `npm run start` — serve a built app.
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`, extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`).

There is no test runner configured yet. Type-check with `npx tsc --noEmit` (the `tsconfig.json` already sets `noEmit: true`, so a bare `tsc` works too).

## Environment variables

Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env.local` (gitignored) before running anything that touches auth or email:

- **`MONGODB_URI`** / **`MONGODB_DB`** — used by [lib/mongodb.ts](frontend/lib/mongodb.ts). Reads are lazy, so the build still succeeds without these set, but signup/login server actions will return a friendly "couldn't reach our servers" error until they're filled in. Atlas connection strings (`mongodb+srv://…`) and local `mongodb://localhost:27017` both work. The `users` collection auto-creates a unique index on `email` on first use.
- **`GMAIL_USER`** / **`GMAIL_APP_PASSWORD`** — used by [lib/email.ts](frontend/lib/email.ts) for the welcome email sent on successful signup. Must be a Gmail **App Password** (generate at https://myaccount.google.com/apppasswords); regular account passwords fail with 535-5.7.8. Requires 2-Step Verification on the Google account. Email send is fire-and-forget — if SMTP fails, signup still succeeds and the failure is logged.
- **`NEXT_PUBLIC_SITE_URL`** — used by `metadataBase` (OG image URLs) and as the link target inside the welcome email's CTA. Defaults to `https://lynx.app` for prod and `http://localhost:3000` for the welcome email when unset.

## UI/UX standards

The "Lynx UI/UX & Architecture Specification" — design manifesto, design tokens, component architecture rules (composition + `cn()`), the `BentoCard` blueprint, and required patterns for buttons / status pills / icons — lives in [frontend/AGENTS.md](frontend/AGENTS.md). It is auto-loaded into context when working in `frontend/` (via `frontend/CLAUDE.md` → `@AGENTS.md`).

When building any UI, follow that spec exactly: rounded `[2rem]` cards, optical shadows (no `shadow-md`/`shadow-lg`), Server Components by default with `"use client"` only at leaf nodes, and composition over configuration.

## Critical: this is Next.js 16, not the Next.js in your training data

[frontend/AGENTS.md](frontend/AGENTS.md) (imported by `frontend/CLAUDE.md`) calls out that Next 16 has **breaking changes** to APIs, conventions, and file structure. Before writing or modifying Next-specific code (routing, data fetching, caching, server components, metadata, fonts, image, middleware, route handlers, etc.):

1. Read the relevant page in [frontend/node_modules/next/dist/docs/](frontend/node_modules/next/dist/docs/) — the docs ship with the installed version, so they match what's actually running. Sections:
   - `01-app/` — App Router (this project uses App Router).
   - `02-pages/` — Pages Router (not used here).
   - `03-architecture/` — rendering, caching, runtime model.
2. Heed any deprecation notices you see at runtime or in the docs — assume your priors about defaults (e.g. caching behavior, async APIs, config keys) may be wrong.

Do not invent APIs from memory. If the docs disagree with what you "know," the docs win.

## Stack notes that affect code you write

- **App Router only.** Routes live under [frontend/app/](frontend/app/). There is no `pages/` directory.
- **Tailwind CSS v4**, not v3. Configured via PostCSS (`@tailwindcss/postcss`) and a single `@import "tailwindcss";` in [frontend/app/globals.css](frontend/app/globals.css). Theme tokens are declared inline with `@theme inline { ... }` in CSS — there is no `tailwind.config.js`. Don't add one unless you're intentionally migrating off the v4 CSS-first config model.
- **Path alias**: `@/*` resolves from the `frontend/` root (`tsconfig.json` `paths`). Prefer `@/app/...` over long relative imports.
- **Strict TypeScript** is on. `moduleResolution: "bundler"` — use modern import specifiers.
- Fonts come from `next/font/google` (Geist / Geist Mono) wired through CSS variables in [frontend/app/layout.tsx](frontend/app/layout.tsx).

## State of the project

The frontend is a working Next.js 16 app with auth, units, work orders, vendors, billing, reports, and a seeded demo path. Follow existing patterns in `frontend/app/` and `frontend/lib/` when adding features.

## ProofLoop (hackathon verification layer)

`proofloop/` is a zero-dependency CLI wired into Claude Code's Stop hook (`.claude/settings.json`). When you end a turn with uncommitted changes under `frontend/`, it maps them to business flows (`proofloop/proofloop.map.json`), runs the matching `kane/*_test.md` in real Chrome via Kane CLI, and **blocks the stop with Kane's failure report** until the flow passes (max 3 attempts). Requirements: `npm run dev` running in `frontend/`, `kane-cli login` done. Set `PROOFLOOP_DISABLED=1` to skip. Never edit `kane/*_test.md` to make a failing app pass. Run `node proofloop/src/cli.ts verify --all` to replay every flow; `npm test` in `proofloop/` runs the unit tests.
