# Social Network Analyzer

An interactive social network visualization and analysis tool powered by a Python backend (for graph algorithms) and a React frontend.

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/aryan-chauhan59/SOCIAL-NETWORK-GRAPH-ANALYZER)

This project is divided into separate backend and frontend codebases, orchestrated via **npm workspaces** from the root directory.

## Project Structure

```text
├── backend/                  # Express server & Python graph engine
│   ├── server.ts             # API routing and terminal handlers
│   ├── server-auth.ts        # Mock authentication API
│   ├── social_graph.py       # BFS, DFS, Centrality, and Set Intersection
│   └── tsconfig.json         # Backend TypeScript config
│
├── frontend/                 # React & Vite client
│   ├── src/                  # Components, styles, and types
│   ├── vite.config.ts        # Vite configuration (proxies /api to port 3000)
│   └── tsconfig.json         # Frontend TypeScript config
│
├── package.json              # Root workspaces & orchestration script
└── README.md                 # This file
```

## Running Locally

### Prerequisites

- Node.js (version 18 or higher recommended)
- Python 3

### 1. Install Dependencies

Install all dependencies for both frontend and backend at once using npm workspaces:

```bash
npm install
```

### 2. Configure Environment Variables (Optional)

Configure any API keys or secrets (such as `GEMINI_API_KEY`) by creating a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

### 3. Run in Development Mode

Start both the backend server (port 3000) and the Vite development server (port 5173) concurrently:

```bash
npm run dev
```

Open your browser and visit: **[http://localhost:5173](http://localhost:5173)](https://social-network-graph-analyzer-front.vercel.app/)**

---

## Production Build & Run

To build and run the application in a production-like environment:

### 1. Build Both Projects

```bash
npm run build
```

This compiles the frontend assets into `frontend/dist`.

### 2. Start the Backend Server

```bash
npm run start
```

In production mode, the backend server will automatically serve the compiled frontend static files from `frontend/dist`. Open your browser and visit: **[http://localhost:3000](http://localhost:3000)**
