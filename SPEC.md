# Albion Depths Killboard - Technical Specification

## 1. Project Overview

**Project Name:** Albion Depths Killboard
**Purpose:** A player ranking system for The Depths PvP content in Albion Online, featuring LoL-style MMR with tier progression.
**Target Users:** US region Albion Online players interested in competitive Depths tracking
**Data Source:** Albion Online Gameinfo API (`gameinfo.albiononline.com`)
**Initial Scope:** MVP with rankings, kill feed, player stats, and head-to-head tracking

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14+ (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| ORM | Prisma | 5.x |
| Database | MySQL | 8.x |
| Hosting | Vercel | - |

**Architecture:** Full-stack Next.js (frontend + API routes + server actions)

---

## 3. Data Model

### 3.1 Prisma Schema

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Player {
  id        String   @id
  name      String
  mmr       Int      @default(1000)
  kills     Int      @default(0)
  deaths    Int      @default(0)
  streak    Int      @default(0)
  lastKillAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  killerKills     Kill[] @relation("KillerKills")
  victimDeaths   Kill[] @relation("VictimDeaths")
  h2hAsKiller    HeadToHead[] @relation("H2HKiller")
  h2hAsVictim    HeadToHead[] @relation("H2HVictim")
}

model Kill {
  id          Int      @id @default(autoincrement())
  eventId     String   @unique
  killerId    String
  victimId    String
  mmrChange   Int
  killTime    DateTime
  fame        Int

  killer      Player   @relation("KillerKills", fields: [killerId], references: [id])
  victim      Player   @relation("VictimDeaths", fields: [victimId], references: [id])

  @@index([killerId])
  @@index([victimId])
  @@index([killTime])
}

model HeadToHead {
  id          Int       @id @default(autoincrement())
  killerId    String
  victimId    String
  killCount   Int       @default(0)
  lastKillAt  DateTime?

  killer      Player    @relation("H2HKiller", fields: [killerId], references: [id])
  victim      Player    @relation("H2HVictim", fields: [victimId], references: [id])

  @@unique([killerId, victimId])
}
```

### 3.2 API Response Types

```typescript
interface PlayerWithMMR {
  id: string;
  name: string;
  mmr: number;
  tier: 'Iron' | 'Bronze' | 'Silver' | 'Gold' | 'Crystal';
  kills: number;
  deaths: number;
  kd: number;
  streak: number;
  rank: number;
}

interface KillEvent {
  id: number;
  eventId: string;
  killer: { id: string; name: string; mmr: number };
  victim: { id: string; name: string; mmr: number };
  mmrChange: number;
  killTime: string;
  fame: number;
}

interface HeadToHeadStats {
  playerA: string;
  playerB: string;
  playerAKills: number;
  playerBKills: number;
  lastInteraction: string | null;
}
```

---

## 4. MMR System Specification

### 4.1 Tier Thresholds

| Tier | MMR Range |
|------|-----------|
| Iron | 0 - 899 |
| Bronze | 900 - 1199 |
| Silver | 1200 - 1499 |
| Gold | 1500 - 1999 |
| Crystal | 2000+ |

### 4.2 MMR Calculation Algorithm

```
Constants:
  - STARTING_MMR = 1000
  - K_FACTOR = 20
  - MIN_OPPONENT_MMR = 600 (threshold for awarding points)
  - STREAK_BONUS_MAX = 10
  - STREAK_BONUS_PER_WIN = 2

Function calculateMMRChange(playerMMR, opponentAvgMMR, isWin, currentStreak):
  if opponentAvgMMR < MIN_OPPONENT_MMR:
    return 0  // No points for farming low MMR players

  basePoints = K_FACTOR * (1 / (1 + 10^((opponentAvgMMR - playerMMR) / 400)))
  streakBonus = min(currentStreak * STREAK_BONUS_PER_WIN, STREAK_BONUS_MAX)

  if isWin:
    return round(basePoints + streakBonus)
  else:
    return round(-basePoints)
```

### 4.3 Behavior Rules

- **New players** start at 1000 MMR
- **Kill = +MMR**, Death = -MMR (symmetric calculation for both players)
- **Win streaks** add bonus MMR (max +10)
- **No MMR cap** - infinite scaling possible
- **Season reset** - manual trigger via admin (resets all MMR to 1000)

---

## 5. Features

### 5.1 Rankings Page (`/rankings`)
- Server-side paginated leaderboard (50 players per page)
- Display: rank, player name, tier badge, MMR, K/D ratio
- Sort by MMR descending
- Filter by tier

### 5.2 Live Kill Feed (`/`)
- Real-time display of recent kills in Depths
- Shows: killer name, victim name, MMR change, time ago
- Auto-refresh every 6 minutes (polling via SWR)
- Maximum 50 recent kills displayed

### 5.3 Player Profile (`/player/[id]`)
- Player name, current MMR, tier
- Total kills, deaths, K/D ratio
- Current win streak
- Recent kills/deaths history

### 5.4 Head-to-Head (`/h2h`)
- Kill count between two players
- Last encounter timestamp
- Mutual kills: A killed B, B killed A

### 5.5 Player Search (`/search`)
- Search players by name (partial match)
- Redirect to player profile on selection

### 5.6 Admin Panel (`/admin`)
- **Season Reset** - Reset all player MMR to 1000, clear streaks
- **Sync Now** - Manual trigger for data sync
- **Stats** - Total players, total kills, last sync time

---

## 6. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rankings` | Get MMR leaderboard (paginated, query: page, limit, tier) |
| GET | `/api/feed` | Get recent kill feed (query: limit) |
| GET | `/api/player/[id]` | Get player stats |
| GET | `/api/h2h` | Get head-to-head stats (query: playerA, playerB) |
| GET | `/api/search` | Search players by name (query: q) |
| POST | `/api/sync` | Trigger manual sync (admin) |
| POST | `/api/admin/reset-season` | Reset all MMR to 1000 (admin) |
| GET | `/api/admin/stats` | Get admin stats |
| GET | `/api/health` | Health check |

---

## 7. Background Job

**Scheduler:** Vercel Cron
**Frequency:** Every 6 minutes
**Tasks:**
1. Fetch latest kill events from Albion API (`/events?limit=50`)
2. Filter: `groupMemberCount >= 2 && groupMemberCount <= 3` (Depths detection)
3. For each new kill:
   - Create/update killer and victim players
   - Calculate MMR changes
   - Update kill/death counts
   - Update win streaks
   - Record head-to-head stats
   - Store kill event
4. Log sync status

---

## 8. Project Structure

```
albion-depths-killboard/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Kill feed (home)
│   │   ├── globals.css
│   │   ├── rankings/
│   │   │   └── page.tsx
│   │   ├── player/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── h2h/
│   │   │   └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── rankings/
│   │       │   └── route.ts
│   │       ├── feed/
│   │       │   └── route.ts
│   │       ├── player/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── h2h/
│   │       │   └── route.ts
│   │       ├── search/
│   │       │   └── route.ts
│   │       ├── sync/
│   │       │   └── route.ts
│   │       ├── admin/
│   │       │   ├── reset-season/
│   │       │   │   └── route.ts
│   │       │   └── stats/
│   │       │       └── route.ts
│   │       └── health/
│   │           └── route.ts
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── albion-api.ts         # Albion API fetch utilities
│   │   ├── mmr.ts                # MMR calculation logic
│   │   └── types.ts              # Shared TypeScript types
│   └── components/
│       ├── ui/                    # Reusable UI components
│       ├── KillFeed.tsx
│       ├── RankingsTable.tsx
│       ├── PlayerCard.tsx
│       ├── TierBadge.tsx
│       ├── HeadToHeadCard.tsx
│       ├── SearchBar.tsx
│       └── AdminPanel.tsx
├── scripts/
│   └── sync-kills.ts             # Standalone sync script
├── vercel.json                   # Cron configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

---

## 9. Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/albion_depths"

# Albion API
ALBION_API_BASE="https://gameinfo.albiononline.com/api/gameinfo"

# App Config
NEXT_PUBLIC_API_URL="/api"
```

---

## 10. Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@prisma/client": "5.x",
    "swr": "^2.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "prisma": "5.x",
    "tailwindcss": "3.x",
    "eslint": "8.x",
    "@types/node": "20.x",
    "@types/react": "18.x"
  }
}
```

---

## 11. Dark Theme Configuration

```typescript
// tailwind.config.ts
export default {
  content: [...],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        surfaceHover: '#252525',
        border: '#2a2a2a',
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
        accent: '#e63946',
        tier: {
          iron: '#8b8b8b',
          bronze: '#cd7f32',
          silver: '#c0c0c0',
          gold: '#ffd700',
          crystal: '#b9f2ff',
        },
      },
    },
  },
  plugins: [],
}
```

---

## 12. Implementation Phases

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Setup | Initialize Next.js, Prisma, Tailwind, DB connection | 30 min |
| 2. Data Layer | Implement Prisma schema, MMR utilities | 1 hour |
| 3. API Integration | Fetch from Albion API, filter by group size | 1 hour |
| 4. Sync Job | Create cron job to sync kills, update MMR | 2 hours |
| 5. Backend APIs | Implement /api/ranking, /api/feed, /api/player, /api/h2h | 2 hours |
| 6. Frontend - Feed | Home page with live kill feed | 1 hour |
| 7. Frontend - Rankings | Rankings page with tier badges | 1 hour |
| 8. Frontend - Player | Player profile page | 1 hour |
| 9. Frontend - H2H | Head-to-head comparison page | 1 hour |
| 10. Deployment | Deploy to Vercel, configure cron | 30 min |

**Total estimated:** ~10 hours