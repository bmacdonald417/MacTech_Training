# Deploying to Railway

## Connecting Railway Postgres to your app

After you create a PostgreSQL database in Railway:

### 1. Get the connection URL

- In Railway, open your **project**.
- Click the **PostgreSQL service** (the database you created).
- Open **Variables** or **Connect**.
- Copy **`DATABASE_URL`** (the full `postgresql://...` connection string).

### 2. Point the app at it

- Open the **MacTech_Training** service (your Next.js app).
- Go to **Variables**.
- Set **`DATABASE_URL`** to the URL you copied (or use Railway’s variable reference to the Postgres service if available).
- **Redeploy** the MacTech_Training service so the new variable is used.

### 3. Create tables and seed data (one-time)

Run this **once** against the Railway database so the app has tables and demo users:

From your project folder, with the **Railway Postgres** URL set as `DATABASE_URL`:

```powershell
# PowerShell (replace with your actual Railway Postgres URL)
$env:DATABASE_URL="postgresql://postgres:xxxxx@xxxxx.railway.app:5432/railway?schema=public"
npx prisma db push
npm run db:seed
```

Or install [Railway CLI](https://docs.railway.app/develop/cli) and run:

```bash
railway link
railway run npx prisma db push
railway run npm run db:seed
```

After that, the production app and login (e.g. `admin@demo.com` / `password123`) will use the Railway Postgres database.

---

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
