# Prepper UI

React + TypeScript frontend for Prepper, built with Vite.

## Prerequisites

- Node.js `22.13.0+`
- npm
- Running Mastra backend (`apps/mastra`) for live API responses

## Environment

Create a local env file:

```bash
cp .env.example .env
```

The frontend service reads `VITE_MASTRA_API_URL`. Set it explicitly in `.env`:

```env
VITE_MASTRA_API_URL=http://localhost:4111/
```

## Run Locally

From this folder:

```bash
npm run dev
```

From repo root:

```bash
npm run dev -- --filter=prepper-ui
```

Default URL: `http://localhost:5173`

## Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # type-check + production build
npm run preview  # preview production build
npm run lint     # run ESLint
```
