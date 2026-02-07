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
