# Scripts

These scripts talk to the database and need `DATABASE_URL` set.

## Running against Railway from your machine

Railway’s default `DATABASE_URL` uses an internal host (`postgres.railway.internal`) that only works inside Railway. To run scripts **locally** against the same database:

### Option A: Use Railway CLI (recommended)

1. **Get the public Postgres URL**  
   In [Railway](https://railway.app) → your project → **Postgres** service → **Connect** (or **Variables**). Copy the **public** connection string (TCP Proxy). It looks like:
   `postgresql://postgres:PASSWORD@HOST:PORT/railway`
   where `HOST` is a public hostname (e.g. `monorail.proxy.rlwy.net`), not `postgres.railway.internal`.

2. **Add it to your app service**  
   In Railway → **MacTech_Training** service → **Variables** → **Add variable**:
   - Name: `DATABASE_PUBLIC_URL`
   - Value: the public connection string from step 1.

3. **Run scripts with vars injected**  
   From the repo root (with `railway link` already done):

   ```bash
   cd MacTech_Training
   railway run npm run db:wipe-curriculum
   railway run npx tsx scripts/reset-user-enrollment.ts "user@example.com"
   ```

   `railway run` injects the service variables (including `DATABASE_PUBLIC_URL`). The scripts use `DATABASE_PUBLIC_URL` for `DATABASE_URL` when present.

### Option B: Use a local .env file

1. Put the **public** Postgres URL in a `.env` file in `MacTech_Training`:

   ```bash
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@PUBLIC_HOST:PORT/railway"
   ```

2. Run scripts as usual:

   ```bash
   cd MacTech_Training
   npm run db:wipe-curriculum
   npx tsx scripts/reset-user-enrollment.ts "user@example.com"
   ```

**Important:** Do not commit `.env` or any file containing real passwords or secrets.
