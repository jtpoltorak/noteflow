# NoteFlow

A web-based note-taking application inspired by Microsoft OneNote, built with Angular and Node.js.

**Live demo:** [noteflow on Railway](https://api-production-9d75.up.railway.app)

---

## Features

- **Notebooks, Sections & Notes** — Three-panel layout for organising notes hierarchically
- **Rich-text editor** — TipTap (ProseMirror) editor with slash commands, bubble menu formatting, and task lists
- **Slash commands** — Type `/` to insert headings, lists, code blocks, quotes, dividers, and todo checklists
- **Inline formatting** — Select text to toggle bold, italic, underline, strikethrough, and inline code
- **Global search** — Find notes across all notebooks and sections
- **Drag-and-drop** — Reorder notes and sections via drag handles
- **Dark mode** — System-aware theme with manual toggle
- **Responsive** — Full mobile layout with drill-down navigation
- **Auth** — Register, login, logout with JWT access + refresh tokens in httpOnly cookies
- **Session restore** — Automatically restores your last-viewed notebook, section, and note on page refresh

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Front-end | Angular 21, Tailwind CSS 4, TipTap  |
| Back-end  | Node.js, Express, TypeScript        |
| Database  | SQLite (sql.js)                     |
| Auth      | JWT (httpOnly cookies)              |
| Validation| Zod                                 |
| Icons     | Font Awesome 6                      |
| Monorepo  | npm workspaces                      |

---

## Project Structure

```
noteflow/
├── apps/
│   ├── web/          ← Angular front-end
│   └── api/          ← Express API
├── packages/
│   └── shared-types/ ← TypeScript DTOs shared by both apps
├── package.json      ← npm workspaces root
└── tsconfig.base.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

```bash
# Clone the repo
git clone https://github.com/jtpoltorak/noteflow.git
cd noteflow

# Install all workspace dependencies
npm install

# Create your environment file
cp .env.example .env
# Edit .env and set JWT_SECRET and REFRESH_TOKEN_SECRET to random strings

# Build shared types (required before either app will compile)
npm run build:shared
```

### Run in Development

```bash
# Terminal 1 — start the API (auto-restarts on save)
npm run dev --workspace=apps/api

# Terminal 2 — start the Angular dev server
npm run start --workspace=apps/web
```

- API: http://localhost:3000
- Web: http://localhost:4200

### Build for Production

```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

---

## Environment Variables

| Variable               | Description                        | Default              |
|------------------------|------------------------------------|----------------------|
| `PORT`                 | API server port                    | `3000`               |
| `JWT_SECRET`           | Access token signing secret        | —                    |
| `JWT_EXPIRES_IN`       | Access token lifetime              | `15m`                |
| `REFRESH_TOKEN_SECRET` | Refresh token signing secret       | —                    |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime         | `7d`                 |
| `DB_PATH`              | Path to SQLite database file       | `./data/noteflow.db` |

---

## API Endpoints

All routes prefixed with `/api/v1`. Auth routes are public; all others require a valid JWT cookie.

| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| POST   | `/auth/register`                      | Create account           |
| POST   | `/auth/login`                         | Log in (sets cookie)     |
| POST   | `/auth/logout`                        | Log out (clears cookie)  |
| GET    | `/auth/me`                            | Current user             |
| GET    | `/notebooks`                          | List notebooks           |
| POST   | `/notebooks`                          | Create notebook          |
| GET    | `/notebooks/:id`                      | Get notebook             |
| PUT    | `/notebooks/:id`                      | Update notebook          |
| DELETE | `/notebooks/:id`                      | Delete notebook          |
| GET    | `/notebooks/:notebookId/sections`     | List sections            |
| POST   | `/notebooks/:notebookId/sections`     | Create section           |
| PUT    | `/sections/:id`                       | Update section           |
| DELETE | `/sections/:id`                       | Delete section           |
| GET    | `/sections/:sectionId/notes`          | List notes               |
| POST   | `/sections/:sectionId/notes`          | Create note              |
| GET    | `/notes/:id`                          | Get note                 |
| PUT    | `/notes/:id`                          | Update note              |
| DELETE | `/notes/:id`                          | Delete note              |

---

## Built With Claude Code

This project was built entirely with [Claude Code](https://claude.com/claude-code) as a showcase of AI-assisted full-stack development.

---

## License

This project is for portfolio/demonstration purposes.
