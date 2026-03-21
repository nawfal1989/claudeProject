# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies, generate Prisma client, run migrations
npm run setup

# Development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
npx vitest run src/path/to/file.test.ts

# Lint
npm run lint

# Reset database
npm run db:reset
```

> `NODE_OPTIONS="--require ./node-compat.cjs"` is injected automatically via the npm scripts — do not omit it when running Next.js directly.

## Environment

Create a `.env` file at the root. The only required variable for full AI functionality:

```
ANTHROPIC_API_KEY=...
```

Without it, the app falls back to a mock provider that returns static component examples.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat interface; Claude generates files into a **virtual (in-memory) file system**, and a sandboxed iframe renders the result in real time.

### Data flow

1. User sends a message → `POST /api/chat`
2. Server streams a response from Anthropic Claude using Vercel AI SDK
3. Claude calls tools (`str_replace_editor`, `file_manager`) to create/edit virtual files
4. Tool results are streamed back; `FileSystemProvider` applies the changes client-side
5. `PreviewFrame` detects file system changes, transpiles JSX via `@babel/standalone`, and re-renders the iframe
6. On save, the serialized file system + chat messages are persisted to SQLite via Prisma

### Key abstractions

| Layer | Location | Responsibility |
|---|---|---|
| Virtual FS | `src/lib/file-system.ts` | In-memory file tree; serialize/deserialize for DB persistence |
| FileSystemProvider | `src/lib/contexts/file-system-context.tsx` | React context exposing FS state and tool call handlers |
| ChatProvider | `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat`; integrates with FS context |
| AI provider | `src/lib/provider.ts` | Selects Anthropic model or `MockLanguageModel` fallback |
| Tools | `src/lib/tools/` | `str_replace_editor` (edit files) and `file_manager` (rename/delete) |
| JSX transformer | `src/lib/transform/jsx-transformer.ts` | Client-side Babel transpilation → blob URLs for iframe |
| System prompt | `src/lib/prompts/generation.tsx` | Instructs Claude to use `/App.jsx` as entry point and Tailwind for styles |
| Auth | `src/lib/auth.ts` | JWT sessions (7-day, HTTP-only cookies) via `jose` |
| Middleware | `src/middleware.ts` | Protects `/api/projects` and `/api/filesystem` routes |

### Routing

- `/` — home; redirects authenticated users to their first project (or creates one), shows anonymous UI otherwise
- `/[projectId]` — project workspace; validates ownership, loads FS + messages from DB
- `/api/chat` — streaming AI generation endpoint
- Server actions in `src/actions/` handle auth (sign up/in/out) and project CRUD

### Database (Prisma + SQLite)

Schema lives in `prisma/schema.prisma` — reference it anytime you need to understand the structure of data stored in the database. Two models: `User` (email/password) and `Project` (stores serialized file system as `data: String` and chat history as `messages: String`, both JSON). Projects cascade-delete with their owner.

### Anonymous users

`src/lib/anon-work-tracker.ts` persists chat and file system state to `localStorage` so anonymous sessions survive page refreshes. On sign-up, this work can be merged into the new account.

### Preview entry point convention

The iframe renderer (`PreviewFrame`) looks for `App.jsx` (or `App.tsx`, `index.jsx`, etc.) as the component entry point. Claude's system prompt enforces creating `/App.jsx` as the root file.

## Code Style

- Use comments sparingly. Only comment complex or non-obvious code logic — not straightforward code.
