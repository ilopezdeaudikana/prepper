# Prepper Monorepo

Prepper is an interview-practice app built as a Turborepo with:

- `apps/ui`: React + Vite frontend
- `apps/mastra`: Mastra agent/API backend
- `packages/shared-types`: shared TypeScript types

## Requirements

- Node.js `22.13.0+` (required by `apps/mastra`)
- npm `10+`

## Quick Start

1. Install dependencies from the repo root:

```bash
npm install
```

2. Create local environment files:

```bash
cp apps/mastra/.env.example apps/mastra/.env
cp apps/ui/.env.example apps/ui/.env
```

3. Start all dev servers from the repo root:

```bash
npm run dev
```

Default local URLs:

- UI: `http://localhost:5173`
- Mastra Studio / API host: `http://localhost:4111`

## Environment Variables

### `apps/mastra/.env`

- `OPENAI_API_KEY`: model provider key used by the Mastra backend.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key used by the Mastra API.

Run `apps/mastra/supabase/schema.sql` in your Supabase SQL editor before starting the backend.

### `apps/ui/.env`

The UI currently reads `VITE_MASTRA_API_URL` in code. Set it to the Mastra base URL, for example:

```env
VITE_MASTRA_API_URL=http://localhost:4111/
```

## Useful Commands

Run from repository root:

```bash
npm run dev                       # run all workspace dev tasks via Turbo
npm run build                     # build all workspaces
npm run lint                      # lint all workspaces
npm run dev -- --filter=prepper-ui
npm run dev -- --filter=prepper-mastra
```

## Project Structure

```text
apps/
  ui/         # frontend application
  mastra/     # agent + API service
packages/
  shared-types/
```
