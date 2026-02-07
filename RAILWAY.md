# Deploying to Railway

Set these **Variables** in your Railway project (Settings → Variables) so the app runs correctly in production.

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret used to sign cookies/tokens. **Required in production.** | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your app (no trailing slash). | `https://mactechtraining-production.up.railway.app` |
| `DATABASE_URL` | PostgreSQL connection string. | From Railway Postgres or your own DB (e.g. `postgresql://user:pass@host:5432/dbname`) |

## Optional

- Add any other env vars your app uses (e.g. from `.env.example`).

After adding or changing variables, redeploy the service so the new values are picked up. The `NO_SECRET` error goes away once `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set.
