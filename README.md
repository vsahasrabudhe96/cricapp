# 🏏 CricApp - Live Cricket Tracking SaaS

A production-ready SaaS web application for live cricket tracking. Track matches, follow your favorite teams, and get instant notifications for match events.

## 🚀 Features

- **Live Match Tracking**: Real-time scores for international, domestic, and franchise cricket
- **Favorite Teams**: Follow your favorite teams across all competitions
- **Smart Notifications**: Get notified for match start, toss results, playing XI, and results
- **Player Statistics**: Detailed career stats across all formats
- **Subscription Billing**: Free and Pro plans with Stripe integration
- **Authentication**: Email/password and OAuth (Google, GitHub)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI |
| **Backend API** | tRPC (type-safe APIs) |
| **Database** | PostgreSQL + Prisma ORM |
| **Caching** | Redis |
| **Job Queue** | BullMQ |
| **Authentication** | NextAuth.js |
| **Payments** | Stripe |
| **Email** | Resend |
| **Cricket Data** | CricketData.org API (abstracted for swapping) |

## 📁 Project Structure

```
cricapp/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (app)/            # Authenticated pages with navbar
│   │   │   ├── dashboard/    # User dashboard
│   │   │   ├── matches/      # Match listings
│   │   │   └── teams/        # Team browsing
│   │   ├── auth/             # Auth pages (login, register)
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   ├── cricket/          # Cricket-specific components
│   │   ├── layout/           # Navigation, headers
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── cricket-api/      # Cricket API abstraction
│   │   │   ├── providers/    # API provider implementations
│   │   │   ├── types.ts      # Normalized types
│   │   │   └── index.ts      # Factory & cached API
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Database client
│   │   ├── redis.ts          # Redis client & caching
│   │   ├── trpc.ts           # tRPC client
│   │   └── utils.ts          # Utility functions
│   ├── pages/api/            # API routes (tRPC, auth, webhooks)
│   ├── server/
│   │   ├── routers/          # tRPC routers
│   │   └── trpc.ts           # tRPC server setup
│   └── worker/
│       ├── jobs/             # Background job implementations
│       └── index.ts          # Worker entry point
├── .env.example              # Environment variables template
├── package.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Cricket API key (CricketData.org)

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd cricapp
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values in `.env.local`:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `CRICKET_API_KEY` - Get from [CricketData.org](https://cricketdata.org)
   - Stripe keys (optional for development)

3. **Set up the database**:
   ```bash
   npm run db:push       # Push schema to database
   npm run db:generate   # Generate Prisma client
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Start the background worker** (in a separate terminal):
   ```bash
   npm run worker:dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for session encryption | ✅ |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) | ✅ |
| `CRICKET_API_KEY` | CricketData.org API key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | For billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | For billing |
| `RESEND_API_KEY` | Resend API key | For emails |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | For OAuth |

## 📊 Database Schema

The schema includes:
- **Users & Authentication**: User accounts, sessions, OAuth accounts
- **Subscriptions**: Plans, billing status, Stripe integration
- **Cricket Data**: Competitions, teams, players, matches, innings
- **User Preferences**: Favorite teams, notification settings
- **Notifications**: In-app and email notification logs

Run `npm run db:studio` to explore the database with Prisma Studio.

## 🔌 Adding a New Cricket API Provider

The cricket API is abstracted to allow easy swapping:

1. Create a new file in `src/lib/cricket-api/providers/`
2. Implement the `CricketApiProvider` interface:
   ```typescript
   export interface CricketApiProvider {
     readonly name: string;
     getLiveMatches(): Promise<ApiResponse<ApiMatch[]>>;
     getUpcomingMatches(days?: number): Promise<ApiResponse<ApiMatch[]>>;
     getMatchById(id: string): Promise<ApiResponse<ApiMatch>>;
     // ... other methods
   }
   ```
3. Add the provider to the factory in `src/lib/cricket-api/index.ts`

## 🚀 Deployment

### Recommended Stack

- **Frontend**: [Vercel](https://vercel.com) (optimized for Next.js)
- **Database**: [Neon](https://neon.tech) or [Railway](https://railway.app)
- **Redis**: [Upstash](https://upstash.com) (serverless Redis)
- **Worker**: [Railway](https://railway.app) or [Render](https://render.com)

### Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Deploy Worker

The background worker needs to run separately:
```bash
npm run worker
```

Deploy to Railway or Render as a worker process.

## 📱 Subscription Plans

| Feature | Free | Pro ($9.99/mo) |
|---------|------|----------------|
| Live scores | ✅ | ✅ |
| Favorite teams | 3 max | Unlimited |
| In-app notifications | ✅ | ✅ |
| Email notifications | ❌ | ✅ |
| Advanced stats | ❌ | ✅ |
| Priority support | ❌ | ✅ |

## 🧪 Development

```bash
# Run development server
npm run dev

# Run background worker in dev mode
npm run worker:dev

# Database commands
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed sample data

# Type checking
npm run lint
```

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with 🏏 by cricket fans, for cricket fans.

