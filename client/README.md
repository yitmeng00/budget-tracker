# Ledgr client

React 19 + TypeScript frontend for Ledgr, built with Vite 8 and Tailwind CSS v4.

See the [root README](../README.md) for setup, environment variables and the API overview.

## Scripts

Run from this directory, or from the repo root with `--workspace=client`:

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the Vite dev server on port 5173          |
| `npm run build`     | Type-check and build to `dist/`                 |
| `npm run preview`   | Serve the production build locally on port 4173 |
| `npm run lint`      | Run ESLint                                      |
| `npm run typecheck` | Run TypeScript type checks                      |

In development, requests to `/api/*` are proxied to the API server at `http://localhost:3001` with the `/api` prefix stripped (see `vite.config.ts`).
