# Prepper Mastra Service

Mastra-based backend for Prepper. It powers challenge generation and answer evaluation used by the UI.

## Prerequisites

- Node.js `22.13.0+`
- npm
- `OPENAI_API_KEY` (or compatible provider key configured in this service)

## Environment

Create a local env file:

```bash
cp .env.example .env
```

Required variable:

```env
OPENAI_API_KEY=your-api-key
```

## Run Locally

From this folder:

```bash
npm run dev
```

From repo root:

```bash
npm run dev -- --filter=prepper-mastra
```

Default URL: `http://localhost:4111`

- Mastra Studio: `http://localhost:4111`
- API endpoints are served from the same host

## Scripts

```bash
npm run dev    # run Mastra in development mode
npm run build  # build the Mastra service
npm run start  # start built Mastra service
```
