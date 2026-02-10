# Deploying to Railway

This app is intended to **run on Railway** (not just local). Follow the steps below to deploy and configure it.

## 1. Create the app and database

- Create a new **Railway project** (or use an existing one).
- Add a **PostgreSQL** service (Railway will set `DATABASE_URL` on the project).
- Add a **new service** from your GitHub repo (this repo). Railway will detect Next.js and use `npm install`, `npm run build`, and `npm start` (see `railway.toml`).

## 2. Connecting Railway Postgres to your app

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

Railway’s **build** runs in an isolated environment and cannot reach the database (`postgres.railway.internal` is only available at runtime). So schema updates are **not** run during build. After you deploy schema changes (e.g. new columns for sign-up), run **once** from your machine (with Railway CLI or with `DATABASE_URL` set to your **public** Postgres URL from Railway):

```bash
railway link
railway run npx prisma db push
```

Use the **public** `DATABASE_URL` from the Postgres service (Variables → copy the URL that uses `*.railway.app`, not `postgres.railway.internal`) if you run from local without the CLI. Then **seed** once (and again if you want to reset or add demo data):

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

## Narration (TTS) and persistent storage

For **Generate narration** (text-to-speech) to work on Railway:

1. **OpenAI API key**  
   In your app service **Variables**, add:
   - **`OPENAI_API_KEY`** = your OpenAI API key (from [platform.openai.com](https://platform.openai.com/api-keys)).

2. **Persistent volume for audio files**  
   Narration saves MP3 files to disk; on Railway that must be a **Volume** so files survive redeploys.
   - In your **MacTech_Training** service, go to **Settings** (or **Variables**).
   - Add a **Volume** and note the **mount path** (e.g. `/data`).
   - In **Variables**, add:
   - **`RAILWAY_VOLUME_MOUNT_PATH`** = the volume mount path (e.g. `/data`).
   - Redeploy so the app uses the volume for narration storage.

Without a volume, the app will try to write to `/data` (or the path you set). If that path is not writable, generation will fail with a clear error in the UI.

---

## Reference: required variables

Set these on the **MacTech_Training** service (Variables tab). Redeploy after changing them.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (from Railway Postgres or your DB). |
| `NEXTAUTH_SECRET` | Yes | Secret for signing cookies/tokens. Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full public URL of your app, e.g. `https://your-app.up.railway.app` (no trailing slash). |
| `OPENAI_API_KEY` | For TTS | OpenAI API key so Admins/Trainers can generate narration. |
| `RAILWAY_VOLUME_MOUNT_PATH` | For TTS | Mount path of the Railway Volume for narration files (e.g. `/data`). |
