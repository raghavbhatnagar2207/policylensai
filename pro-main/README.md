# PolicyLens AI — Governance Intelligence Platform

> AI-Driven Governance Transparency & Welfare Monitoring System

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ installed
- **npm** v9+

### 1. Start the Backend

```bash
cd backend
npm install
node server.js
```
Backend starts at `http://localhost:5000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend starts at `http://localhost:5173`

### 3. Open the App
Visit **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json
│   └── data/
│       └── dataset.json    # 105 mock beneficiary records
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── context/ThemeContext.jsx
    │   ├── lib/utils.js
    │   ├── components/Layout.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Heatmap.jsx
    │       ├── Insights.jsx
    │       ├── Complaints.jsx
    │       ├── Eligibility.jsx
    │       └── Simulation.jsx
    ├── tailwind.config.js
    └── package.json
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/data` | All beneficiaries (with query filters) |
| GET | `/anomalies` | Anomaly records only |
| GET | `/risk-score` | District-wise risk scores |
| GET | `/insights` | AI-generated insights |
| GET | `/complaints` | All complaints |
| POST | `/complaint` | Submit a complaint |
| POST | `/simulate` | Inject simulated anomalies |
| POST | `/simulate/reset` | Clear simulated data |

## ✨ Features

- **AI Anomaly Detection** — Flagged beneficiaries with explainable AI panel
- **Risk Heatmap** — Interactive Leaflet map with color-coded districts
- **AI Insights** — Auto-generated governance intelligence
- **Simulation Mode** — Inject fake fraud and observe live dashboard updates
- **Eligibility Checker** — Rule-based scheme matching for citizens
- **Complaint Portal** — File and track grievances
- **Dark/Light Mode** — Theme toggle with persistence
- **Admin/Citizen Modes** — Role-based sidebar navigation
