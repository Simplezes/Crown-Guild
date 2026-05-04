# Crown Guild — Website

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Turso](https://img.shields.io/badge/Database-Turso%20LibSQL-orange.svg)
![Pusher](https://img.shields.io/badge/Realtime-Pusher-blueviolet.svg)

<p align="center">
  <img src="icon.png" alt="Crown Guild Icon" width="120" />
</p>

> **Crown Guild** is a crown-tracking and matchmaking hub for **Monster Hunter Wilds**. Log your crown records, find hunters who host investigation quests, and watch live missions unfold — all in one place.

---

## Features

| Feature | Description |
|---|---|
| **Crown Registry** | Browse every hunter's crown collection filtered by monster, crown type, and tempered status |
| **Hunter Profiles** | Per-user pages showing full crown history, status message, and contact options |
| **Monster Pages** | Detailed pages per monster with aggregate stats and a list of all hunters holding a crown for it |
| **Live Mission Board** | Home page displays active hunts in real-time, pushed via Pusher WebSockets |
| **Find a Host** | Search for hunters currently offering investigation quests for a specific monster |
| **Beacon System** | Hunters can raise a beacon to broadcast that they need help on a specific crown |
| **Mission Dashboard** | Full mission management UI — request, check, and complete hunts |
| **Toast Notifications** | Real-time in-app notifications whenever mission or crown events are broadcast |
| **Discord OAuth** | One-click sign-in with your Discord account via NextAuth |
| **Settings** | Personal lobby preferences and communication opt-ins |

---

## Environment Variables

Create a `.env.local` file in this directory with the following keys:

```env
# Discord Application
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_PUBLIC_KEY=
DISCORD_GUILD_ID=

# Turso Database
TURSO_DB_URL=
TURSO_AUTH_TOKEN=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Pusher
PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

### Variable Reference

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token (used by the companion bot, not the web app directly) |
| `DISCORD_CLIENT_ID` | OAuth2 application client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 application client secret |
| `DISCORD_PUBLIC_KEY` | Interaction endpoint verification key |
| `DISCORD_GUILD_ID` | Target guild ID for slash-command registration |
| `TURSO_DB_URL` | `libsql://` URL to your Turso database |
| `TURSO_AUTH_TOKEN` | Auth token issued by Turso |
| `NEXTAUTH_URL` | Canonical URL of this app (e.g. `https://crownguild.vercel.app`) |
| `NEXTAUTH_SECRET` | Random secret for session encryption (`openssl rand -hex 32`) |
| `PUSHER_APP_ID` | Pusher application ID (server-side) |
| `PUSHER_SECRET` | Pusher secret key (server-side) |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher publishable key (exposed to client) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster region (e.g. `us2`) |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- A [Turso](https://turso.tech/) database with the Crown Guild schema applied
- A Discord application with OAuth2 enabled
- A [Pusher](https://pusher.com/) Channels app

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.local.example .env.local

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Build for Production

```bash
npm run build
npm start
```

---

## 📡 Real-time Architecture

Crown Guild uses **Pusher Channels** on the `public-channel` for broadcasting events to all connected clients:

| Event | Trigger | Effect |
|---|---|---|
| `crown_update` | New/edited/deleted crown | Refreshes the registry and profile pages |
| `mission_update` | Mission requested, completed, or cancelled | Updates the live mission board and mission control panel |
| `beacon_update` | Beacon raised or dismissed | Shows/hides the beacon notification popup |

The companion **Discord bot** (hosted separately on Fly.io) also triggers these events whenever a slash command is processed, keeping the web dashboard in sync without polling.

---

## API Endpoints

### Authentication
| Method | Route | Description |
|---|---|---|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth Discord OAuth handler |

### Crowns
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/crowns` | Add a new crown record |
| `PUT` | `/api/crowns/[id]` | Update an existing crown |
| `DELETE` | `/api/crowns/[id]` | Delete a crown record |

### Missions
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/missions/beacon` | Raise a beacon for a monster crown |
| `GET` | `/api/missions/check` | Check if a mission is active for the session user |
| `POST` | `/api/missions/complete` | Mark an active mission as complete |
| `GET` | `/api/missions/current` | Fetch all currently active missions |

### Monsters & Users
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/monsters` | List all monsters |
| `GET` | `/api/user` | Get the current user's profile |

---

## Database Schema (Turso / LibSQL)

```sql
CREATE TABLE users (
  id         TEXT PRIMARY KEY,   -- Discord user ID
  username   TEXT NOT NULL,
  avatar_url TEXT,
  status     TEXT,               -- Custom hunter status message
  settings   TEXT                -- JSON blob for user preferences
);

CREATE TABLE monsters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  emoji      TEXT,
  image_name TEXT,
  is_large   INTEGER DEFAULT 1
);

CREATE TABLE crowns (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL REFERENCES users(id),
  monster_id      INTEGER NOT NULL REFERENCES monsters(id),
  type            TEXT NOT NULL,          -- 'small' | 'large'
  tempered        INTEGER DEFAULT 0,      -- 0 | 1
  strength_rating INTEGER,
  quest           TEXT,                   -- Quest type category
  remaining_uses  INTEGER,               -- For Investigation quests
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE active_missions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL,
  tempered     INTEGER DEFAULT 0,
  strength_rating INTEGER,
  monster_id   INTEGER REFERENCES monsters(id),
  host_id      TEXT REFERENCES users(id),
  requester_id TEXT REFERENCES users(id),
  created_at   TEXT DEFAULT (datetime('now'))
);
```

---

## Deployment (Vercel)

1. Push the `web/` directory to its own GitHub repository (or configure the Vercel root directory).
2. Import the project on [vercel.com](https://vercel.com).
3. Add all environment variables from the table above in **Project → Settings → Environment Variables**.
4. Set `NEXTAUTH_URL` to your production domain (e.g. `https://crownguild.vercel.app`).
5. Deploy — every push to `main` triggers an automatic build.

> **Note:** The persistent Discord bot must run on a separate always-on service (e.g. Fly.io). Vercel's serverless functions are stateless and cannot maintain a WebSocket connection to Discord.

---

## Related Projects

- **[Crown Guild Bot](../bot/)** — The companion Discord bot that handles slash commands (`/crown`, `/hunt`, `/beacon`) and triggers Pusher events to keep the website in sync.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](../LICENSE) for details.
