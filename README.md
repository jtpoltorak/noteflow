# NoteFlow

A web-based note-taking application inspired by Microsoft OneNote, built as a full-stack TypeScript monorepo.

**Live demo:** [web-production-ea3c8.up.railway.app](https://web-production-ea3c8.up.railway.app)

## Features

- **Notebooks, Sections & Notes** — Organize notes in a three-level hierarchy with full CRUD
- **Rich Text Editor** — Contenteditable editor with slash commands (`/`) for headings, lists, todo checklists, code blocks, blockquotes, and dividers
- **Global Search** — Full-text search across all notes with snippet previews
- **Dark Mode** — Toggle between light and dark themes; preference persisted per user
- **Drag & Drop** — Reorder notebooks, sections, and notes via drag-and-drop
- **Responsive Layout** — Three-panel desktop view with collapsible sidebars; single-panel drill-down navigation on mobile
- **Full-Screen Editor** — Hide all side panels for distraction-free writing
- **Auth** — Email/password registration and login with JWT access + refresh tokens stored in httpOnly cookies

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | Angular 21, Tailwind CSS 4, Font Awesome 6 |
| Back-end | Node.js, Express 4, TypeScript |
| Database | SQLite via sql.js |
| Auth | JWT (access + refresh tokens in httpOnly cookies) |
| Validation | Zod |
| Shared | `@noteflow/shared-types` — DTOs shared across front-end and API |

## Project Structure

```
noteflow/
├── apps/
│   ├── web/                ← Angular 21 front-end
│   │   ├── src/app/
│   │   │   ├── core/       ← Services, guards, interceptors
│   │   │   ├── features/
│   │   │   │   ├── auth/   ← Login & register pages
│   │   │   │   └── shell/  ← Main app layout
│   │   │   │       ├── notebook-list/
│   │   │   │       ├── section-list/
│   │   │   │       ├── note-area/      ← Editor + slash commands
│   │   │   │       ├── search-panel/
│   │   │   │       ├── nav-rail/
│   │   │   │       └── help-panel/
│   │   │   └── shared/     ← Reusable dialogs & components
│   │   └── ...
│   │
│   └── api/                ← Node.js + Express API
│       └── src/
│           ├── routes/     ← Auth, notebooks, sections, notes, search
│           ├── services/   ← Business logic
│           ├── middleware/  ← Auth, validation, error handling
│           └── db/         ← Database connection & SQL migrations
│
└── packages/
    └── shared-types/       ← TypeScript interfaces shared by web & api
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/jtpoltorak/noteflow.git
cd noteflow

# Install all workspace dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and set JWT_SECRET / REFRESH_TOKEN_SECRET to random strings

# Build shared types (required before either app will compile)
npm run build --workspace=packages/shared-types

# Start the API (auto-restarts on save)
npm run dev --workspace=apps/api

# In a second terminal — start the Angular dev server
npm run start --workspace=apps/web
```

- API: http://localhost:3000
- Web: http://localhost:4200

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | API server port |
| `JWT_SECRET` | — | Secret for signing access tokens |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_SECRET` | — | Secret for signing refresh tokens |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `DB_PATH` | `./data/noteflow.db` | Path to SQLite database file |

## API Endpoints

Base URL: `/api/v1`

All routes except `/auth/*` require a valid JWT in an httpOnly cookie.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive tokens |
| `POST` | `/auth/logout` | Clear auth cookies |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/me` | Get current user |
| `PUT` | `/auth/preferences` | Update user preferences |
| `GET` | `/notebooks` | List all notebooks |
| `POST` | `/notebooks` | Create a notebook |
| `GET` | `/notebooks/:id` | Get a notebook |
| `PUT` | `/notebooks/:id` | Update a notebook |
| `DELETE` | `/notebooks/:id` | Delete a notebook |
| `GET` | `/notebooks/:notebookId/sections` | List sections |
| `POST` | `/notebooks/:notebookId/sections` | Create a section |
| `PUT` | `/sections/:id` | Update a section |
| `DELETE` | `/sections/:id` | Delete a section |
| `GET` | `/sections/:sectionId/notes` | List notes |
| `POST` | `/sections/:sectionId/notes` | Create a note |
| `GET` | `/notes/:id` | Get a note |
| `PUT` | `/notes/:id` | Update a note |
| `DELETE` | `/notes/:id` | Delete a note |
| `GET` | `/search?q=query` | Search across all notes |

## Deployment

Both apps are deployed on [Railway](https://railway.app):

- **Web:** https://web-production-ea3c8.up.railway.app
- **API:** https://api-production-9d75.up.railway.app

## License

This project is a personal portfolio/showcase application.
