# 🌌 ASTRAM: Event-Driven Congestion Intelligence Platform

> **Bengaluru Traffic Digital Twin & Proactive Orchestration Command**

ASTRAM (Active Space-Time Routing and Adaptive Mitigation) is a state-of-the-art traffic intelligence command center. It transitions municipal traffic management from a **reactive policing model** (acting only after gridlock occurs) to a **proactive data-driven city orchestration model**.

Using real-time telemetry from citizen sentiment feeds, simulated field officer reports, and historical incident logs, ASTRAM performs real-time machine learning predictions to optimize signal timings, suggest route diversions, and trigger localized flood or collision playbooks.

---

## 🚀 Quick Start & Onboarding

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/)

### 2. Development Setup
To streamline the local onboarding experience, we have consolidated both the frontend and backend startup routines into a single command using `concurrently`. 

In the root directory, simply run:
```bash
npm run dev
```

This starts both services simultaneously:
*   **Next.js Frontend**: running at [http://localhost:3000](http://localhost:3000)
*   **Express Backend & WebSocket Engine**: running at [http://localhost:3001](http://localhost:3001)

### 3. Verification Endpoints
To verify the health of your local server and database connectivity:
*   **Backend Health Check**: [http://localhost:3001/health](http://localhost:3001/health)
*   **Express REST API (Active Incidents)**: [http://localhost:3001/api/v1/incidents](http://localhost:3001/api/v1/incidents)

---

## 🏗️ Architecture & Tech Stack

```
           +---------------------------------------+
           |       Next.js 16 (Turbopack) UI       |
           |             (Port 3000)               |
           +---------------------------------------+
                      ^                  |
         WebSocket    |                  |  REST API
         Broadcasts   |                  v  POST/PUT/GET
           +---------------------------------------+
           |      Node.js/Express Backend Server   |
           |             (Port 3001)               |
           +---------------------------------------+
                      |                  ^
         Read / Write |                  | SQLite Seed
                      v                  |
           +---------------------------------------+
           |           SQLite Database             |
           |            (`astram.db`)              |
           +---------------------------------------+
```

### Frontend (`/src`)
*   **Framework**: Next.js 16 (App Router) + React
*   **Map Visualization**: Leaflet & React-Leaflet
*   **State & WebSocket Sync**: Custom `useRealtimeEngine` hook connecting to port 3001.

### Backend (`/backend`)
*   **Engine**: Node.js & Express.js
*   **Database**: SQLite (`backend/astram.db`) for forensic telemetry and active incident storage.
*   **WebSocket Engine**: Broadcasts mutations (e.g. newly reported incidents, diversion updates) to all connected command terminals in real-time.

---

## ⚡ Key Interactive Features

### 📖 Interactive Onboarding Tour
When first loading the ASTRAM dashboard, a beautiful glassmorphic **System Guide Tour** will walk you through the key concepts (Digital Twin, Simulation clock, Webster signal adjustments, ML models, etc.). You can trigger this tour manually at any time by clicking the glowing **✨ Quick Tour** button in the header.

### 🗺️ Digital Twin Map Operations
The digital twin map is live and actionable:
*   **Barricade Planner**: Click coordinates on the map to deploy instant road-work barriers.
*   **Webster Signal Overrides**: Click on major junctions (Hebbal, Chinnaswamy Stadium, Silk Board) to override automatic Webster cycle timings.
*   **Route Vaccination**: Inject diversion nodes directly into MapMyIndia API mocks to redirect traffic before gridlocks form.

### 🌊 Weather-Traffic Fusion
Change the weather to **Downpour** or scrub the system timeline. ASTRAM triggers a Naive Bayes probability model on 8,100+ historical incidents to estimate temporal risk factors and adjust the citywide **Commuter Impact Score (CIS)** dynamically.

### 💬 WhatsApp Officer Simulator
Located at `/whatsapp` (and embedded on the dashboard), this bot mimics a mobile field officer reporting incidents. 
*   **NLP classification**: Type messages like `"Accident near Silk Board"` or use the new **on-field command suggestion chips** (`🌲 Tree Fall`, `🚗 Accident`, etc.) to trigger instant classifier parsing.
*   **Backend Sync**: Unlike local-only alerts, fullscreen WhatsApp actions now post directly to the Express backend database, which updates the central dashboard for all active dispatchers using WebSocket broadcasts.

### 🐦 Citizen Pulse Sentiment Monitor
Scrapes Twitter/X sentiment telemetry. 
*   **Filter Badges**: Click any "Trending Alert Location" pill (e.g., *Silk Board*, *ORR Marathahalli*, or *Tin Factory*) to filter the sentiment stream in real-time. Click **Clear Filter** to restore.
*   **Dispatcher Action**: Click "Create Incident" on any high-urgency post to instantly feed it into the ML routing engines.
