# Tally frontend

## Run locally

```sh
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

The app calls the backend through same-origin `/api/v1/*`, which Next rewrites to `API_INTERNAL_URL` (server-only, defaults to `http://localhost:8000`). Protected routes validate the HttpOnly session cookie server-side.

## Kick sign-in

1. Create an OAuth application in Kick's developer settings and register the exact callback URL `http://localhost:8000/api/v1/auth/kick/callback` (use your deployed API host in production).
2. In `kick-backend/.env`, set `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`, `KICK_SCOPES=user:read`, and `KICK_REDIRECT_URI` to that registered callback. Keep the client secret only in the backend environment. Set `API_URL=http://localhost:8000` and `SITE_URL=http://localhost:3000`.
3. In `frontend/.env.local`, set `API_INTERNAL_URL=http://localhost:8000`.
4. Start the backend with its PostgreSQL and Redis dependencies, then restart the frontend after changing its environment.

The backend needs its database for OAuth state/session storage. No Kick API credential belongs in the frontend. `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET` are required to complete real OAuth; the example development values are placeholders.

## Checks

```sh
pnpm run gen:api
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run test:e2e
pnpm run build
```

The OpenAPI snapshot in `openapi.json` was generated from the backend app. Regenerate TypeScript definitions whenever that contract changes.
