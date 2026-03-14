# NoteFlow

A web-based note-taking application inspired by Microsoft OneNote, built with Angular and Node.js.

**Live demo:** [noteflow on Railway](https://api-production-9d75.up.railway.app)

---

## Features

### Editor
- **Rich-text editor** — TipTap (ProseMirror) with formatting toolbar, bubble menu, and block drag handles
- **Slash commands** — Type `/` to insert headings, lists, code blocks, quotes, dividers, todos, images, YouTube videos, and note links
- **Syntax highlighting** — Code blocks with a language selector dropdown supporting 33+ languages and auto-detect
- **YouTube embeds** — Embed videos via toolbar button, `/youtube` slash command, or by pasting a URL
- **Images** — Upload, drag-and-drop, or paste images with resizable drag handles
- **Find & Replace** — In-note search with Ctrl+F / Ctrl+H
- **Note linking** — Link between notes via `/note-link` slash command or toolbar button
- **Smart typography** — Toggleable curly quotes, em dashes, and ellipses
- **Text styling** — Color picker, highlight colors, inline formatting (bold, italic, underline, strikethrough, code)

### Organisation
- **Three-panel layout** — Notebooks sidebar, sections column, and notes area with editor
- **Tags** — Organise notes with custom tags and browse by tag
- **Favorites** — Star notes for quick access
- **Archive** — Hide notes and restore them later
- **Drag-and-drop** — Reorder notebooks, sections, and notes; move sections between notebooks
- **Templates** — Built-in and custom user templates for new notes
- **Global search** — Full-text search across all notebooks and sections

### Sharing & Security
- **Public sharing** — Share notes via unique public links with revoke support
- **Password protection** — Lock individual notes with a password
- **Presentation mode** — Full-screen overlay for presenting note content

### Account & Data
- **Auth** — Register, login, logout with JWT access + refresh tokens in httpOnly cookies
- **Data export** — Export individual notes as Markdown or HTML; export all data as JSON or Markdown ZIP
- **Print** — Print individual notes
- **Account closure** — Self-service with 7-day grace period and reactivation
- **Settings** — General tab (font size, smart typography) and Account tab (password change, export, closure)

### Experience
- **Dark mode** — System-aware theme with manual toggle and persistent preference
- **Responsive** — Full mobile layout with drill-down navigation
- **PWA** — Installable as a standalone app with install prompt
- **Session restore** — Automatically restores your last-viewed notebook, section, and note
- **Font sizes** — Four global size levels (default, large, XL, XXL)
- **Quick Note** — Create notes without leaving your current view
- **Note metadata** — Word count, reading time, timestamps, and save indicator
- **Release notes** — Clickable version display with in-app changelog

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Front-end  | Angular 21, Tailwind CSS 4, TipTap  |
| Back-end   | Node.js, Express, TypeScript        |
| Database   | SQLite (sql.js)                     |
| Auth       | JWT (httpOnly cookies)              |
| Validation | Zod                                 |
| Icons      | Font Awesome 6                      |
| Monorepo   | npm workspaces                      |

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

| Variable                   | Description                    | Default              |
|----------------------------|--------------------------------|----------------------|
| `PORT`                     | API server port                | `3000`               |
| `JWT_SECRET`               | Access token signing secret    | —                    |
| `JWT_EXPIRES_IN`           | Access token lifetime          | `15m`                |
| `REFRESH_TOKEN_SECRET`     | Refresh token signing secret   | —                    |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime         | `7d`                 |
| `DB_PATH`                  | Path to SQLite database file   | `./data/noteflow.db` |

---

## API Endpoints

All routes prefixed with `/api/v1`. Auth routes are public; all others require a valid JWT cookie.

### Auth
| Method | Endpoint                | Description                |
|--------|-------------------------|----------------------------|
| POST   | `/auth/register`        | Create account             |
| POST   | `/auth/login`           | Log in (sets cookie)       |
| POST   | `/auth/logout`          | Log out (clears cookie)    |
| POST   | `/auth/refresh`         | Refresh access token       |
| GET    | `/auth/me`              | Current user               |
| PUT    | `/auth/preferences`     | Update user preferences    |
| PUT    | `/auth/password`        | Change password            |
| GET    | `/auth/export/json`     | Export all data as JSON    |
| GET    | `/auth/export/markdown` | Export all data as Markdown ZIP |
| POST   | `/auth/close-account`   | Request account closure    |
| POST   | `/auth/reactivate-account` | Cancel account closure  |

### Notebooks
| Method | Endpoint          | Description      |
|--------|-------------------|------------------|
| GET    | `/notebooks`      | List notebooks   |
| POST   | `/notebooks`      | Create notebook  |
| GET    | `/notebooks/:id`  | Get notebook     |
| PUT    | `/notebooks/:id`  | Update notebook  |
| DELETE | `/notebooks/:id`  | Delete notebook  |

### Sections
| Method | Endpoint                          | Description    |
|--------|-----------------------------------|----------------|
| GET    | `/notebooks/:notebookId/sections` | List sections  |
| PUT    | `/sections/:id`                   | Update section |
| DELETE | `/sections/:id`                   | Delete section |

### Notes
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/sections/:sectionId/notes`| List notes in section    |
| GET    | `/notes/:id`                | Get note                 |
| GET    | `/notes/:id/context`        | Get note with context    |
| PUT    | `/notes/:id`                | Update note              |
| DELETE | `/notes/:id`                | Delete note              |
| GET    | `/notes/archived`           | List archived notes      |
| POST   | `/notes/:id/archive`        | Archive/unarchive note   |
| GET    | `/notes/favorites`          | List favorite notes      |
| POST   | `/notes/:id/favorite`       | Favorite a note          |
| POST   | `/notes/:id/unfavorite`     | Unfavorite a note        |
| GET    | `/notes/shared`             | List shared notes        |
| POST   | `/notes/:id/share`          | Generate share link      |
| POST   | `/notes/:id/unshare`        | Revoke share link        |

### Tags
| Method | Endpoint                      | Description            |
|--------|-------------------------------|------------------------|
| GET    | `/tags`                       | List all tags          |
| POST   | `/tags`                       | Create tag             |
| PUT    | `/tags/:id`                   | Rename tag             |
| DELETE | `/tags/:id`                   | Delete tag             |
| GET    | `/tags/:id/notes`             | List notes with tag    |
| GET    | `/notes/:id/tags`             | Get tags for a note    |
| POST   | `/notes/:id/tags`             | Add tag to note        |
| DELETE | `/notes/:noteId/tags/:tagId`  | Remove tag from note   |

### Templates
| Method | Endpoint         | Description       |
|--------|------------------|--------------------|
| GET    | `/templates`     | List templates     |
| POST   | `/templates`     | Create template    |
| PUT    | `/templates/:id` | Update template    |
| DELETE | `/templates/:id` | Delete template    |

### Other
| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| GET    | `/search?q=...`    | Full-text search               |
| GET    | `/shared/:token`   | View shared note (public)      |

---

## Built With Claude Code

This project was built entirely with [Claude Code](https://claude.com/claude-code) as a showcase of AI-assisted full-stack development.

---

## License

This project is for portfolio/demonstration purposes.
