# ITLASB — Intelligent Truck Load Assignment System using Backtracking

> A full-stack logistics platform that auto-assigns delivery work to drivers/trucks using a Backtracking optimization algorithm, with real-time map tracking via WebSockets.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React-Router, Leaflet   |
| Backend   | Node.js, Express, Socket.io       |
| Algorithm | Backtracking (custom service)     |
| Database  | MySQL 8 (two databases)           |
| Auth      | JWT + bcrypt                      |
| Realtime  | Socket.io WebSockets              |

---

## Prerequisites

Install these before running:

1. **Node.js** v18+ → https://nodejs.org
2. **MySQL 8** → https://dev.mysql.com/downloads/mysql/
   - Make sure MySQL is running on port 3306
   - Default credentials used: `root / root` (change in `backend/.env` if needed)

---

## Quick Start (3 Steps)

### Step 1 — Install dependencies

Open a terminal in the `ITLASB` folder and run:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Or from root:
```bash
npm run install:all
```

---

### Step 2 — Configure database credentials

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root        ← change this to your MySQL password
DB_LOGISTICS=logistics_db
DB_AUTH=auth_db
```

---

### Step 3 — Setup database + run

```bash
# From ITLASB root:

# 1. Create tables and seed data
npm run setup:db

# 2. Start both servers
npm run dev
```

- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

---

## Running in VS Code

1. Open `ITLASB.code-workspace` in VS Code (File → Open Workspace from File)
2. Open Terminal → Run Task → **"Start Both (Dev)"**
3. Or run manually:
   - Terminal 1: `cd backend && npm run dev`
   - Terminal 2: `cd frontend && npm start`

---

## Demo Accounts

| Role     | Username | Password    |
|----------|----------|-------------|
| Admin    | admin    | admin123    |
| Customer | alice    | customer123 |
| Customer | bob      | customer123 |

---

## Features

### Admin (login as `admin`)
- **Live Map** — real-time driver positions updating every 2 seconds
- **Driver Management** — add/remove drivers, see live status
- **Truck Management** — 15 trucks, track available vs assigned
- **Work Orders** — all assignments, statuses, routes
- **System Metrics** — fleet efficiency, active count, idle time

### Customer (login as `alice` or `bob`)
- **Create Work** — click map to set pickup + drop-off, or use quick-select Chennai areas
- **My Orders** — track all your deliveries with live progress bar
- **Live Tracking** — see your driver moving on the map in real time

### Algorithm Viewer (admin)
- **Backtracking Visualizer** — step-by-step execution log with pruning shown in red
- **Cost Function** display — dist(driver→truck) + dist(truck→source) + dist(source→dest)
- **Assignment Tree diagram** — visual tree showing explored vs pruned branches
- **Live stats** — iterations count, pruned branches, optimal cost

---

## Project Structure

```
ITLASB/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL pool config (logistics_db + auth_db)
│   ├── controllers/
│   │   ├── authController.js    # Login, register
│   │   ├── workController.js    # Create work + trigger backtracking
│   │   ├── driverController.js  # CRUD drivers
│   │   └── truckController.js   # CRUD trucks
│   ├── middleware/
│   │   └── auth.js              # JWT verify + adminOnly guard
│   ├── routes/
│   │   └── index.js             # All API routes
│   ├── scripts/
│   │   └── setupDatabase.js     # DB init + seed script
│   ├── services/
│   │   ├── backtracking.js      # ★ Core algorithm
│   │   ├── simulation.js        # Real-time driver movement engine
│   │   └── distance.js          # Haversine formula
│   ├── .env                     # Environment variables
│   └── server.js                # Express + Socket.io entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Admin/
│       │   │   └── AdminDashboard.js   # Full admin view
│       │   ├── Algorithm/
│       │   │   └── AlgorithmPage.js    # BT visualizer
│       │   ├── Customer/
│       │   │   ├── CreateWorkPage.js   # Map-based work creation
│       │   │   └── CustomerDashboard.js# Order tracking
│       │   ├── Map/
│       │   │   └── LiveMap.js          # Leaflet map component
│       │   └── Shared/
│       │       ├── Navbar.js
│       │       └── Toast.js
│       ├── context/
│       │   ├── AuthContext.js          # JWT auth state
│       │   └── SocketContext.js        # WebSocket + live drivers
│       ├── hooks/
│       │   └── useToast.js
│       ├── pages/
│       │   └── LoginPage.js
│       ├── utils/
│       │   └── api.js                  # Axios instance
│       ├── App.js
│       ├── index.js
│       └── index.css
│
├── package.json                  # Root scripts (concurrently)
├── ITLASB.code-workspace         # VS Code workspace
└── README.md
```

---

## API Endpoints

| Method | Route              | Auth     | Description              |
|--------|--------------------|----------|--------------------------|
| POST   | /api/auth/login    | None     | Login, get JWT           |
| POST   | /api/auth/register | None     | Register customer        |
| GET    | /api/drivers       | Any      | All drivers + live state |
| POST   | /api/drivers       | Admin    | Add driver               |
| DELETE | /api/drivers/:id   | Admin    | Remove driver            |
| GET    | /api/trucks        | Any      | All trucks               |
| POST   | /api/trucks        | Admin    | Add truck                |
| POST   | /api/work          | Customer | Create work → auto-assign|
| GET    | /api/work          | Admin    | All work orders          |
| GET    | /api/work/my       | Customer | My work orders           |
| GET    | /api/work/:id      | Any      | Single work detail       |

---

## Backtracking Algorithm

File: `backend/services/backtracking.js`

```
Cost(driver, truck, work) =
  dist(driver → truck)          [km]
  + dist(truck → work.source)   [km]
  + dist(source → destination)  [km]

Pruning rules:
  1. if dist(d→t) ≥ bestCost → skip (prune)
  2. if dist(d→t) + dist(t→src) ≥ bestCost → skip (prune)
  3. if total < bestCost → update bestCost, save assignment

Optimization:
  - Pre-sort drivers by dist to work.source, take top-K (default 5)
  - Pre-sort trucks by dist to work.source, take top-K (default 5)
  - Reduces search tree from O(D×T) to O(K²)
```

---

## Troubleshooting

**MySQL connection refused**
→ Make sure MySQL server is running: `mysql -u root -p`
→ Check `DB_PASSWORD` in `backend/.env`

**Port 3000 already in use**
→ React will ask to use a different port — press Y

**Port 5000 already in use**
→ Change `PORT=5001` in `backend/.env`

**Map tiles not loading**
→ You need internet for OpenStreetMap tiles. Works offline with cached tiles.

**Drivers not moving**
→ Check backend terminal for simulation logs. DB must be connected.
