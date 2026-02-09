# MacTech Training

A professional, modular, enterprise-grade training platform built by MacTech.

## Features

- **Multi-tenant architecture** - Isolated data per organization
- **Role-based access control** - Admin, Trainer, and Trainee roles
- **Modular learning objects** - Articles, Slide Decks, Videos, Forms, Quizzes, Attestations
- **Curriculum builder** - Combine learning objects into structured training paths
- **Assignment system** - Assign to individuals or groups with due dates
- **Progress tracking** - Monitor completion status and progress
- **Certificates** - Issue certificates upon completion
- **Audit logging** - Track all system events for compliance

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Prisma ORM** with PostgreSQL
- **NextAuth** for authentication
- **react-hook-form** + **zod** for form validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker (for PostgreSQL)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/mactech_training?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure secret for NextAuth:
```bash
openssl rand -base64 32
```

3. Start PostgreSQL with Docker:
```bash
docker-compose up -d
```

Or manually:
```bash
docker run --name mactech-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mactech_training -p 5432:5432 -d postgres:15
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Run database migrations:
```bash
npm run db:push
```

6. Seed the database:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000)

## Login Credentials

After seeding, you can log in with:

- **Admin**: `admin@demo.com` / `password123`
- **Trainer**: `trainer@demo.com` / `password123`
- **Trainee**: `trainee@demo.com` / `password123`

Organization slug: `demo`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/             # Login page
│   └── org/[slug]/        # Organization-scoped routes
├── components/            # React components
│   ├── layout/           # Layout components (sidebar, topbar)
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── rbac.ts           # Role-based access control
│   └── utils.ts          # General utilities
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data script
└── types/                # TypeScript type definitions
```

## Database Schema

The application uses a comprehensive Prisma schema with:

- **Organizations** - Multi-tenant isolation
- **Users & Memberships** - User management with roles
- **Content Items** - Modular learning objects
- **Curricula** - Structured training paths
- **Assignments & Enrollments** - Training assignments
- **Certificates** - Certificate templates and issuance
- **Event Logs** - Audit trail
- **Narration (TTS)** - Text-to-speech for slides and articles, stored on a persistent volume

## Text-to-Speech (Narration) & Railway Volume

Narration generates MP3 audio from slide or article text via OpenAI TTS. Audio files are stored on a **persistent volume** (not in `/public` or the repo).

### Environment variables

- **`OPENAI_API_KEY`** (required for TTS) – Used only from the environment; never hardcode.
- **`RAILWAY_VOLUME_MOUNT_PATH`** (optional) – Base path for the persistent volume. Defaults to `/data` in production. In local dev, if unset, the app uses `./tmp/narration` and logs a warning.

### Railway deployment

1. Attach a **Railway Volume** to your service.
2. Set the volume mount path (e.g. `/data`) in the service settings.
3. Set **`RAILWAY_VOLUME_MOUNT_PATH=/data`** in your Railway environment variables so the app uses the same path in code.
4. Set **`OPENAI_API_KEY`** so Admins/Trainers can generate narration.

Storage layout on the volume: `{mount}/narration/{orgId}/{entityType}/{entityId}.mp3`. Regenerating overwrites the file; playback uses a cache-busting query param (`?v=updatedAt`).

### Local development

- If no Railway volume is available, the app uses **`RAILWAY_VOLUME_MOUNT_PATH`** when set (e.g. `/data` if you create that folder), or falls back to **`./tmp/narration`** when the env is unset.
- Use the same env name in both environments so behavior is consistent; ensure the path is writable or the fallback dir exists.

### Permissions

- **Admin / Trainer**: Can **Generate** (overwrites existing) and **Play** narration.
- **Trainee**: **Play** only (no access to `POST /api/org/[slug]/tts/generate`).

## CMMC Level 2 Security Awareness & Training Course

The **CMMC Level 2 AT course** (AT.L2-3.2.1 / 3.2.2 / 3.2.3) is included in the repo and created when you seed the database.

### Where it lives in the repo

- **`prisma/seed-cmmc-at.ts`** – Full course: 40 slides (with instructor notes), 20-question quiz (80% pass), attestation, curriculum, certificate template.
- **`prisma/CMMC-AT-Instructor-Package.md`** – Instructor package: evidence checklist, attestation text, role breakouts, scenario bank.
- **`prisma/seed.ts`** – Calls `seedCmmcAt(prisma, org.id)` for the demo org so the course is created during seed.

### Seeing the CMMC course in the app

The course appears in the app only **after the database has been seeded**. Pushing to Git does not run the seed.

- **Local:** Run `npm run db:seed`, then log in as Trainer or Admin, go to **Curricula** or **Content** in the **demo** org. The course is **“CMMC Level 2 Security Awareness, Role-Based Cyber Duties, and Insider Threat Training (AT.L2-3.2.1/3.2.2/3.2.3)”**.
- **Production (e.g. Railway):** Run the seed **once** against the production database. From your machine with `DATABASE_URL` set to the production Postgres URL:
  ```bash
  DATABASE_URL="postgresql://..." npm run db:seed
  ```
  Or use Railway’s shell/CLI and run `npm run db:seed` there. After that, the CMMC curriculum and content will show in the app for the demo org.

## Development

### Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

### Building for Production

```bash
npm run build
npm start
```

## License

Proprietary - MacTech
