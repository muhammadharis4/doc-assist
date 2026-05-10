# Security

This document summarizes how DocAssist handles sensitive data and known limitations for anyone running, auditing, or deploying the project.

## Threat model (important)

- **No end-user authentication** is implemented on the REST API. Any client that can reach the backend can call document and query endpoints. **Do not expose the backend to the public internet** without adding your own auth, network controls (VPN, reverse proxy rules), or equivalent.
- The **Next.js app** proxies the browser to the backend using `BACKEND_API_URL`. That URL must point to **a backend you trust**. Do not supply a user-controlled `BACKEND_API_URL` on a shared server deployment.

## Secrets and configuration

- Store secrets in environment variables or a secrets manager — **never** commit real tokens to git. Backend reads `Backend/.env` locally via `python-dotenv`; use `.gitignore`d `.env` files only.
- **Minimal backend env vars** are documented in the root `README.md` and `Backend/README.md`. Tuning that is not environment-driven lives in `Backend/src/constants.py`.

## Telegram webhook

- When `TELEGRAM_WEBHOOK_URL` is set, **set `TELEGRAM_WEBHOOK_SECRET`** to a strong random value and configure the same secret in the Bot API / Telegram client. The backend validates the `X-Telegram-Bot-Api-Secret-Token` header using a **constant-time** comparison when a secret is configured.
- If a webhook URL is set **without** a secret, the app logs a **warning** at startup: the endpoint is easier to abuse if it is reachable by untrusted parties.
- User-facing error text from the bot does **not** include raw exception messages (avoids leaking stack or internal details to chat).

## Docker Compose / OpenSearch

- The bundled `docker-compose.yml` runs OpenSearch with **`DISABLE_SECURITY_PLUGIN=true`**. That is **only appropriate for local development or isolated demos**.
- OpenSearch **port 9200 is not published** to the host by default; only the `backend` service can reach it on the Docker network. Do not re-expose it without authentication and TLS in production.
- For production, use a **managed OpenSearch** or a properly secured cluster, and set `OPENSEARCH_URL` accordingly.

## Dependency and container hygiene

- Rebuild images and upgrade dependencies regularly. Run your own vulnerability scans (`pip-audit`, `npm audit`, container scanners) in CI.
- The backend image includes ML stack dependencies; keep base images patched.

## Reporting issues

If you discover a security vulnerability, please **do not** open a public issue with exploit details. Contact the maintainers privately (e.g. repository owner email or security advisories, if enabled) so a fix can be coordinated before disclosure.
