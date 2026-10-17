# API surface coverage

| Endpoint | Status | UI / reason |
|---|---|---|
| `GET /auth/kick/login` | Done | Public sign-in and reconnect links |
| `GET /auth/kick/callback` | Backend redirect | Login page presents recoverable error query state |
| `POST /auth/logout` | Done | App shell sign out |
| `GET /me` | Done | App shell, access, plan, token and pause banners |
| `DELETE /me/kick-connection` | Done | Account page |
| `DELETE /me` | Done | Account deletion confirmation |
| `GET, POST /channels` | Done | Channel list and add |
| `GET /channels/{id}` | Done | Channel detail loads only the channel it shows |
| `GET /channels/stats` | Done | Dashboard summary in a single request |
| `PATCH /channels/{id}` | Done | Per-channel amount and enable state |
| `PUT /channels/amounts` | Done | Bulk amount editor |
| `DELETE /channels/{id}` | Done | Remove while preserving backend history |
| `GET /channels/{id}/predictions` | Done | Detail page filters; cursor exposed by response |
| `GET /channels/{id}/predictions/{prediction_id}` | Done | Opens the accessible prediction detail dialog |
| `GET /channels/{id}/stats` | Done | Detail stats and dashboard aggregate |
| `GET /points/history` | Done | Points page (range + channel filters, trend area chart and share donut) and dashboard growth card |
| `GET /predictions/active` | Done | Dashboard and Predictions |
| `GET /votes` | Done | Votes filters and loaded-row CSV |
| `GET, PUT /settings` | Done | Settings form and persistence |
| `GET /billing/status` | Done | Billing state (plan, Premium expiry) on `/billing` |
| `POST /billing/qr-payments` | Done | Upload a transfer screenshot from `/billing` |
| `GET /billing/qr-payments` | Done | Caller's submission history on `/billing` |
| `GET /qr-payments` | Done | Admin review list on `/payments` (password-gated) |
| `GET /qr-payments/{id}/proof` | Done | Admin proof image on `/payments` (password-gated) |
| `POST /qr-payments/{id}/confirm` | Done | Admin confirms and grants Premium |
| `POST /qr-payments/{id}/reject` | Done | Admin rejects a submission |
| `GET /stream` | Done | App-shell EventSource, retry, invalidation |
| `GET /healthz`, `/readyz` | Done | Public status and admin readiness |
| `POST /admin/kill-switch` | Done | Admin control with typed confirmation |
| `GET /admin/overview` | Done | Admin overview |
| `GET /metrics` | Not surfaced | Infrastructure-only Prometheus endpoint |

The backend marks `/healthz` and `/readyz` with `include_in_schema=False`; they are confirmed from router code and queried directly. Other path types come from generated OpenAPI. Protected routes validate `/me` server-side and forward the incoming cookie. Real Kick listener behavior remains a backend integration concern; mocks cover the UI.
