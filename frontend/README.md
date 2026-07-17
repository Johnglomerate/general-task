# Frontend

The General Task web app: a React + TypeScript single-page application bundled with [webpack](https://webpack.js.org/) and deployed to Cloudflare Workers. This is a browser-only web app — there is no Expo or React Native build, so nothing here targets iOS/Android.

## Prerequisites

- [Node.js](https://nodejs.org/) 18
- [Yarn](https://yarnpkg.com/) (`npm install -g yarn`)
- A FontAwesome Pro auth token (ask John/your mentor for access — see below)

## Setup

```
cd frontend
yarn install
```

### FontAwesome Pro registry

The `@fortawesome/*` packages come from FontAwesome's private registry. If `yarn install` fails with a `401 Unauthorized` from `npm.fontawesome.com`, you need to supply the auth token.

This project pins Yarn Classic (v1, per `yarn.lock`), which reads npm auth from `.npmrc` — not the `.yarnrc.yml` in this directory (that is a Yarn Berry config used by the Cloudflare build). For a local install, point the registry and token at `.npmrc` once, then install:

```
npm config set "@fortawesome:registry" https://npm.fontawesome.com/
npm config set "//npm.fontawesome.com/:_authToken" <your token>
yarn install
```

## Running locally

```
yarn start
```

This runs `webpack-dev-server` (config in `webpack.dev.js`) with hot module reload and serves the app at http://localhost:3000. Client-side routing is handled by webpack's `historyApiFallback`, so deep links resolve to the SPA.

By default the dev build points at a backend on `http://localhost:8080` and the frontend on `http://localhost:3000` (see `src/environment.ts`). Run the Go backend from the repo root to serve the API locally — there is no standalone mock API server.

## Environment / API URLs

API and site URLs are selected in `src/environment.ts` based on `process.env.NODE_ENV`:

- **development** (`yarn start`, `yarn build:test`) — points at `localhost` (API on `:8080`, frontend on `:3000`).
- **production** (`yarn build`) — points at the `generaltask.com` domains (`api.generaltask.com`, etc.).

## Writing platform-specific code

There is no platform abstraction layer — this is a plain browser app. Write standard web React (DOM APIs, `styled-components`, Mantine/Radix components). Do not use the React Native `Platform` library or `.native.tsx` / `.web.tsx` extensions; the stray `@types/react-native` dev dependency is unused.

## Scripts

- `yarn start` — dev server with hot reload (`webpack.dev.js`)
- `yarn build` — production bundle into `dist/` (`webpack.prod.js`)
- `yarn build:test` — build using the dev config
- `yarn test` — Jest unit tests
- `yarn cy:run` — Cypress end-to-end tests
- `yarn lint` — ESLint (`--fix`)
- `yarn prettier:check` / `yarn prettier:write` — Prettier

## Deploy to Cloudflare

Production is deployed via Cloudflare Workers using the [Workers Assets](https://developers.cloudflare.com/workers/static-assets/) setup configured in the repository-root [`wrangler.toml`](../wrangler.toml) (not a `frontend/`-local config). The legacy `wrangler publish` / `mapRequestToAsset` flow is gone.

`wrangler.toml` at the repo root drives the build and serves the output:

- `[build]` runs `cd frontend && … yarn install && yarn build`, which writes the production bundle to `frontend/dist/`.
- `[assets]` serves `./frontend/dist` with `not_found_handling = "single-page-application"`, so unknown paths fall back to `index.html` for client-side routing.

Deploys are wired into the project's Cloudflare/CI pipeline. To build and deploy manually from the repo root:

```
# ensure FONTAWESOME_NPM_AUTH_TOKEN is set in your environment
npx wrangler deploy
```

Then check your work at https://generaltask.com.
