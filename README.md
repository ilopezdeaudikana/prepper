# Prepper

Prepper is a React + TypeScript interview-practice app backed by a Mastra agent.

## Requirements

- Node.js 20+
- npm
- A model provider key in `.env` (for the Mastra agent)

## Setup

```bash
npm install
```

## Run locally

Start Mastra API server (port `4111`):

```bash
npx mastra dev
```

In another terminal, start the frontend (Vite):

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Scripts

```bash
npm run dev      # frontend
npm run build    # typecheck + production build
npm run preview  # preview production build
npm run lint     # lint
```
