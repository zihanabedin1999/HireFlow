# LinkedIn Sourcing Agent (TypeScript)

A modern, modular LinkedIn Sourcing Agent built with TypeScript, Node.js, and Express. It features a REST API, SQLite database, OpenAI-powered scoring, and a beautiful dashboard UI for sourcing and ranking candidates based on job descriptions.

## Features
- **REST API** for job and candidate management
- **Custom and mock LinkedIn search** with a synthetic candidate database
- **Skill-based candidate scoring** (out of 1000)
- **OpenAI integration** (optional, for advanced scoring)
- **Modern dashboard UI** (Tailwind CSS, JavaScript)
- **SQLite database** for persistence
- **Modular service architecture**
- **Logging and error handling**

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd SkillScope
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your API keys (OpenAI, SerpAPI, etc.)
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

### Build and Run
1. **Build the TypeScript project:**
   ```bash
   npm run build
   ```
2. **Start the server:**
   ```bash
   npm start
   ```
   The server will run on [http://localhost:3000](http://localhost:3000)

### Development
- For hot-reloading during development:
  ```bash
  npm run dev
  ```

## Usage

### Dashboard UI
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Enter a job description and requirements.
- View and rank top candidates based on skill match (score out of 1000).

### API Endpoints
- `POST /api/search` — Search for candidates by job description
- `GET /api/candidates` — List all candidates
- `GET /api/candidates/:id` — Get candidate details
- `POST /api/jobs` — Add a new job
- `GET /api/jobs` — List jobs

## Configuration
- Edit `.env` to set your API keys and environment variables.
- Edit `src/services/custom-database.ts` to customize the synthetic candidate dataset.
- Edit `src/services/scoring.ts` to adjust scoring logic.

## Project Structure
```
SkillScope/
  src/
    config/           # Environment and config
    server/           # Express server setup
    services/         # Modular business logic (search, scoring, database, etc.)
    types/            # TypeScript types
    utils/            # Utilities (logger, etc.)
  public/             # Static dashboard UI
  data/               # SQLite DB and cache
  logs/               # Log files
  .env.example        # Environment variable template
  README.md           # This file
```

## Customization
- **Candidate dataset:** Edit or expand the generator in `custom-database.ts`.
- **Scoring:** Adjust the skill keyword list or scoring formula in `scoring.ts`.
- **UI:** Edit `public/index.html` and `public/js/dashboard.js` for dashboard changes.

## License
MIT

---

*Built with ❤️ by your AI assistant.* 
