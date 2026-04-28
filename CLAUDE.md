# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup (install deps + Prisma generate + migrate)
npm run setup

# Development (Turbopack)
npm run dev

# Build & start production
npm run build
npm run start

# Lint
npm run lint

# Tests (Vitest)
npm run test

# Reset database
npm run db:reset
```

All `package.json` scripts prepend `NODE_OPTIONS='--require ./node-compat.cjs'` — this is required for the runtime and must not be removed.

## Environment

Copy `.env` and add your key:
```
ANTHROPIC_API_KEY=sk-ant-...
```
If the key is absent the app falls back to a `MockLanguageModel` that returns static responses — useful for UI work without API costs.

## Architecture

UIGen is an AI-powered React component generator. Users describe a component in chat; Claude generates/edits code via tool calls; a live preview renders the result in a sandboxed iframe.

### Request lifecycle

1. Chat message → `POST /api/chat` (streaming via Vercel AI SDK)
2. Claude responds with tool calls (`str_replace_editor`, `file_manager`)
3. Tool results flow back through `FileSystemContext`, updating the in-memory virtual FS
4. `PreviewFrame` watches the FS, runs Babel on the changed files, and rebuilds the iframe `srcdoc`

### Virtual file system (`src/lib/file-system.ts`)

All generated code lives in a `Map<string, string>` — nothing is written to disk during generation. The FS serializes to/from JSON for database persistence. `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) owns this state and exposes CRUD helpers used both by the UI and by tool-call result handlers.

### AI tools (`src/lib/tools/`)

Two tools are registered with the Claude call:
- `str_replace_editor` — view, create, str_replace, insert operations on virtual files
- `file_manager` — rename and delete

The system prompt lives in `src/lib/prompts/`. Prompt caching (`anthropic-beta: prompt-caching`) is enabled on the system prompt block.

### JSX preview (`src/lib/transform/`)

`jsx-transformer.ts` uses Babel standalone (browser build) to transpile JSX → JS, then wraps all files into a single `srcdoc` HTML document with an import map pointing to `esm.sh` for React and popular libraries. Entry-point detection order: `App.jsx` → `App.tsx` → `index.jsx` → `index.tsx`.

### State management

No Redux/Zustand. Two contexts:
- `ChatProvider` — wraps Vercel AI SDK's `useChat`, owns messages and streaming state
- `FileSystemProvider` — owns virtual FS, processes tool-call results, fires refresh triggers for the preview

### Auth (`src/lib/auth.ts`)

JWT sessions with HMAC-SHA256, stored in an HttpOnly cookie. Server actions (`src/actions/`) handle sign-up/sign-in/sign-out and Prisma queries. The `[projectId]` route is protected; unauthenticated users get an anonymous session on first visit.

### UI layout (`src/app/main-content.tsx`)

Three resizable panels:
- Left: Chat (35 % default)
- Right-top: Preview or Code tabs
- Right-bottom (code tab): file tree + Monaco editor

Components live under `src/components/{auth,chat,editor,preview,ui}`. The `ui/` folder is shadcn/ui (Radix primitives) — edit those files carefully as they are generated.

### Database

Prisma with SQLite (`prisma/schema.prisma`). Two models: `User` and `Project` (stores serialized file system + message history). The generated client is at `src/generated/`.

## Key constraints

- The model used for generation is `claude-haiku-4-5` (set in `src/lib/provider.ts`). Change this carefully — the system prompt is tuned for Haiku's context window and tool-call behaviour.
- Preview runs in a sandboxed iframe (`allow-scripts allow-same-origin allow-forms`). Do not widen sandbox permissions without reviewing XSS implications.
- Babel runs in the browser on every file-system change — keep transform logic synchronous and cheap.
