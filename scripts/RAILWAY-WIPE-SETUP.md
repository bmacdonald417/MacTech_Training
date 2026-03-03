# Run curriculum wipe against Railway Postgres (from your Mac)

1. **Get the public TCP proxy** from Railway:
   - Open [Railway](https://railway.app) → your project → click the **Postgres** service (the database, not the app).
   - Open **Variables** or **Settings → Networking**.
   - Note **RAILWAY_TCP_PROXY_DOMAIN** (e.g. `monorail.proxy.rlwy.net`) and **RAILWAY_TCP_PROXY_PORT** (e.g. `12345`).

2. **Create `.env`** in the project root (`MacTech_Training/`):

   ```bash
   cd /Users/patrick/training/MacTech_Training
   # Replace with your actual values from step 1:
   echo 'DATABASE_PUBLIC_URL="postgresql://postgres:qPzHpreSIvbRvfNDipQOdnmgDGXjLjVS@REPLACE_TCP_HOST:REPLACE_TCP_PORT/railway?schema=public"' > .env
   ```
   Edit `.env` and replace `REPLACE_TCP_HOST` and `REPLACE_TCP_PORT` with the proxy domain and port.

3. **Run the wipe:**

   ```bash
   npm run db:wipe-curriculum
   ```

The script uses `DATABASE_PUBLIC_URL` when set so Prisma can connect from your machine.
