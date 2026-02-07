# Deploying to Railway

## Fixing the "NO_SECRET" / "Please define a secret in production" error

The app **must** have these variables set **on the service that runs your app** (the MacTech_Training service), and you **must redeploy** after adding them.

### Step 1: Open your service

- In Railway, open your **project** (e.g. heartfelt-passion).
- Click the **MacTech_Training** **service** (the one that runs the Next.js app), not the Postgres plugin or the project root.

### Step 2: Add variables

- Go to the **Variables** tab for that service.
- Click **+ New Variable** or **Add variable** and add:

| Variable | Value |
|----------|--------|
| `NEXTAUTH_SECRET` | A long random string. In a terminal run: `openssl rand -base64 32` and paste the output. |
| `NEXTAUTH_URL` | `https://mactechtraining-production.up.railway.app` (no trailing slash) |
| `DATABASE_URL` | Your production Postgres URL (from Railway Postgres or your own database) |

- **Name must be exactly** `NEXTAUTH_SECRET` (no typos, no spaces).
- Save the variables.

### Step 3: Redeploy

- Variables only apply when a **new deployment** starts.
- Go to **Deployments**, open the **⋮** menu on the latest deployment, and choose **Redeploy**.
- Or push a new commit to trigger a deploy.

After the new deployment is running, the `NO_SECRET` errors should stop and login should work.

---

## If the container crashes with "run: command not found"

Railway is trying to run the wrong start command. Fix it:

1. Open your **MacTech_Training** service.
2. Go to **Settings** (or the service’s config).
3. Find **Start Command** / **Deploy** / **Run** (wording may vary).
4. Set it to **`npm run start`** (or leave it empty so Railway uses `package.json`’s `start` script).
5. Redeploy.

The repo includes a **Procfile** with `web: npm run start` so Railway can pick the correct command if it uses Procfile.

---

## Reference: required variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Secret for signing cookies/tokens. Required in production. |
| `NEXTAUTH_URL` | Full public URL of your app. |
| `DATABASE_URL` | PostgreSQL connection string. |
