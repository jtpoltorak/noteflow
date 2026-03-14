# CLAUDE.md — NoteFlow

This file provides Claude Code with project context, architecture decisions, and coding conventions.
**Read this entire file before making any changes to the codebase.**

---

## Project Overview

**NoteFlow** is a web-based note-taking application inspired by Microsoft OneNote.
It is a showcase/portfolio project demonstrating full-stack TypeScript development with AI-assisted coding.

- Small user base (developer + a handful of friends, ~5 users)
- Hosted on GitHub: single monorepo, one `main` branch for stable code, feature branches for new work
- Prioritise clean, readable, well-structured code over premature optimisation
- Goal: demoable MVP (auth + notebooks + sections + notes) within one week

---

## Monorepo Structure

```
noteflow/                          ← git repository root
├── CLAUDE.md                      ← you are here
├── package.json                   ← root npm workspaces config
├── tsconfig.base.json             ← shared TypeScript base config
├── .env.example                   ← committed; .env is gitignored
├── .gitignore
│
├── apps/
│   ├── web/                       ← Angular 21 front-end
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/          ← singleton services, guards, interceptors
│   │   │   │   ├── features/      ← lazy-loaded feature areas
│   │   │   │   │   ├── auth/      ← login, register pages
│   │   │   │   │   ├── notebooks/ ← notebook list & management
│   │   │   │   │   ├── sections/  ← sections within a notebook
│   │   │   │   │   └── editor/    ← note editor
│   │   │   │   ├── shared/        ← reusable components, pipes, directives
│   │   │   │   ├── app.component.ts
│   │   │   │   └── app.routes.ts
│   │   │   ├── environments/
│   │   │   │   ├── environment.ts
│   │   │   │   └── environment.prod.ts
│   │   │   ├── styles.css         ← Tailwind directives + any global overrides
│   │   │   └── main.ts
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── angular.json
│   │   └── package.json
│   │
│   └── api/                       ← Node.js + Express API (TypeScript)
│       ├── src/
│       │   ├── routes/            ← Express route handlers (thin, no business logic)
│       │   ├── services/          ← All business logic lives here
│       │   ├── middleware/        ← auth.middleware.ts, error.middleware.ts, validate.middleware.ts
│       │   ├── db/
│       │   │   ├── database.ts    ← better-sqlite3 connection singleton
│       │   │   └── migrations/    ← 001_init.sql, 002_*.sql etc. — never edit existing files
│       │   └── index.ts           ← Express app entry point
│       ├── tsconfig.json
│       └── package.json
│
└── packages/
    └── shared-types/              ← TypeScript interfaces shared by web + api
        ├── src/
        │   └── index.ts           ← all exports from one file
        └── package.json
```

---

## Tech Stack

| Layer      | Technology                     | Notes                                               |
|------------|--------------------------------|-----------------------------------------------------|
| Front-end  | Angular 21                     | Standalone components, Signals, built-in control flow |
| Styling    | Tailwind CSS (free)            | Utility-first; no component library                 |
| Icons      | Font Awesome 6 (free)          | Via `@fortawesome/angular-fontawesome`              |
| Back-end   | Node.js + Express + TypeScript | Dev: `tsx --watch`; Prod: compiled with `tsc`       |
| Database   | SQLite via `better-sqlite3`    | Single `.db` file, synchronous, zero-config         |
| Auth       | JWT (access + refresh tokens)  | Stored in `httpOnly` cookies; never localStorage    |
| Shared     | `packages/shared-types`        | DTOs used by both web and api                       |
| Validation | `zod`                          | API request validation before hitting services      |

---

## Data Model

```
User
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  email        TEXT UNIQUE NOT NULL
  passwordHash TEXT NOT NULL
  createdAt    TEXT NOT NULL  (ISO 8601)

Notebook
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  userId       INTEGER NOT NULL REFERENCES User(id) ON DELETE CASCADE
  title        TEXT NOT NULL
  createdAt    TEXT NOT NULL
  updatedAt    TEXT NOT NULL

Section
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  notebookId   INTEGER NOT NULL REFERENCES Notebook(id) ON DELETE CASCADE
  title        TEXT NOT NULL
  order        INTEGER NOT NULL DEFAULT 0
  createdAt    TEXT NOT NULL
  updatedAt    TEXT NOT NULL

Note
  id           INTEGER PRIMARY KEY AUTOINCREMENT
  sectionId    INTEGER NOT NULL REFERENCES Section(id) ON DELETE CASCADE
  title        TEXT NOT NULL
  content      TEXT NOT NULL DEFAULT ''   (stored as HTML)
  createdAt    TEXT NOT NULL
  updatedAt    TEXT NOT NULL
```

---

## API Design

Base URL: `/api/v1`

All routes except `/api/v1/auth/*` require a valid JWT in an `httpOnly` cookie.
The auth middleware populates `req.user` with `{ id, email }`.

### Auth
```
POST   /auth/register       body: { email, password }
POST   /auth/login          body: { email, password } → sets httpOnly cookie
POST   /auth/logout         clears cookie
GET    /auth/me             returns current user
```

### Notebooks
```
GET    /notebooks
POST   /notebooks           body: { title }
GET    /notebooks/:id
PUT    /notebooks/:id       body: { title }
DELETE /notebooks/:id
```

### Sections
```
GET    /notebooks/:notebookId/sections
POST   /notebooks/:notebookId/sections   body: { title }
PUT    /sections/:id                     body: { title?, order? }
DELETE /sections/:id
```

### Notes
```
GET    /sections/:sectionId/notes
POST   /sections/:sectionId/notes   body: { title, content? }
GET    /notes/:id
PUT    /notes/:id                   body: { title?, content? }
DELETE /notes/:id
```

All successful responses: `{ data: T }` or `{ data: T, message: string }`
All error responses: `{ error: { message: string, code?: string } }`

---

## Shared Types (`packages/shared-types`)

Define all DTOs and API response shapes here — imported by both apps.

```typescript
// Request bodies
export interface CreateNotebookDto { title: string }
export interface UpdateNotebookDto { title: string }
export interface CreateSectionDto  { title: string }
export interface UpdateSectionDto  { title?: string; order?: number }
export interface CreateNoteDto     { title: string; content?: string }
export interface UpdateNoteDto     { title?: string; content?: string }

// Response shapes
export interface UserDto     { id: number; email: string }
export interface NotebookDto { id: number; title: string; createdAt: string; updatedAt: string }
export interface SectionDto  { id: number; notebookId: number; title: string; order: number }
export interface NoteDto     { id: number; sectionId: number; title: string; content: string; createdAt: string; updatedAt: string }
```

Build the package before importing it in either app:
```bash
npm run build --workspace=packages/shared-types
```

---

## Coding Conventions

### General
- **TypeScript everywhere** — no `.js` files inside any `src/` directory
- **No `any`** — use `unknown` and type-narrow, or define an explicit interface
- `async/await` over raw Promises; DB calls are synchronous by design (better-sqlite3)
- Small, single-purpose functions; services own logic, routes own HTTP plumbing

### Angular (apps/web)
- **Standalone components** — no NgModules anywhere in the project
- **Signals** for reactive state: `signal()`, `computed()`, `effect()`
- **Built-in control flow**: `@if`, `@for`, `@switch` — never `*ngIf` / `*ngFor`
- Use `inject()` function — not constructor injection
- All HTTP calls go through a service in `core/services/` — never directly in a component
- Lazy-load every feature route via `loadComponent()` or `loadChildren()`
- Font Awesome icons via `FaIconComponent` imported as a standalone component
- Tailwind utility classes only — no custom CSS unless there is genuinely no utility alternative

### Node.js API (apps/api)
- Routes are **thin**: parse params/body → call service → send response
- Validate all request bodies with `zod` via `validate.middleware.ts` before reaching the service
- Centralised error handling in `middleware/error.middleware.ts` — services throw, middleware catches
- All SQL lives in `db/` only — no raw queries anywhere else
- Passwords hashed with `bcrypt` (12 rounds minimum)
- JWT secrets and all config from environment variables — **never hardcoded**

### Database
- `better-sqlite3` is synchronous — keep it that way, do not wrap in Promises
- Migrations in `db/migrations/` numbered sequentially: `001_init.sql`, `002_add_order_column.sql`
- **Never edit an existing migration** — always add a new numbered file
- Parameterised queries always — no string interpolation in SQL

---

## Environment Variables

`.env` is gitignored. `.env.example` is committed. Copy to get started:

```bash
cp .env.example .env
```

`.env.example` contents:
```
PORT=3000
JWT_SECRET=replace-this-with-a-long-random-string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace-this-too
REFRESH_TOKEN_EXPIRES_IN=7d
DB_PATH=./data/noteflow.db
```

Angular environment config lives in `apps/web/src/environments/environment.ts` — not in `.env`.

---

## Git Workflow

- Repository on GitHub, remote named `origin`
- `main` branch — always stable and demoable
- Feature branches: `feature/<short-description>` (e.g. `feature/auth`, `feature/note-editor`)
- Commit messages imperative: `Add notebook list endpoint`, `Fix JWT cookie expiry`
- `.gitignore` must cover: `.env`, `node_modules/`, `dist/`, `*.db`, `.angular/cache`

---

## Versioning & Release Checklist

Every feature or bug fix that gets committed/pushed **must** include these updates:

### Version bumping
- **Features** → bump **minor** version (e.g. 0.4.0 → 0.5.0)
- **Bug fixes** → bump **patch** version (e.g. 0.4.0 → 0.4.1)
- **Major** version stays at `0` until the app goes live (unless explicitly told otherwise)
- Keep these files in sync:
  - `apps/web/src/app/version.ts` — `APP_VERSION` constant
  - Root `package.json` — `version` field

### Release notes
- Add an entry to `apps/web/src/app/release-notes.ts`
- New features get a new version group at the top; multiple changes in the same release share a group
- Include version number, date (ISO 8601), and description of changes

### Help panel
- Update `apps/web/src/app/features/shell/help-panel/help-panel.ts` with documentation for new features
- Add or update the relevant section so users can discover and learn the new functionality
- Bug fixes only need a help panel update if they change user-facing behavior

---

## Running Locally

```bash
# Install all workspace dependencies from the repo root
npm install

# Build shared types first (required before either app will compile)
npm run build --workspace=packages/shared-types

# Start the API in dev mode (auto-restarts on save)
npm run dev --workspace=apps/api

# In a second terminal: start the Angular dev server
npm run start --workspace=apps/web
```

API → http://localhost:3000
Web → http://localhost:4200

---

## MVP-1 Scope (Week 1 Target)

Must-have for a demoable result:

1. **Auth** — register, login, logout; JWT stored in httpOnly cookie; Angular route guard
2. **Three-panel layout** — left sidebar (notebooks), middle column (sections), main area (notes list + editor)
3. **Notebooks** — create, rename, delete
4. **Sections** — create, rename, delete within a notebook
5. **Notes** — create, rename, delete; basic rich-text body (contenteditable or a lightweight editor)
6. **Persistence** — all data in SQLite; survives server restart

Out of scope for MVP-1: search, sharing, tags, attachments, real-time collaboration, mobile layout.

---

## Claude Code — Notes for the Developer

This project is intentionally being built with Claude Code as a learning exercise.

### Essential commands
```bash
claude                   # start a session (run from the repo root)
claude --model opus      # explicitly start with Opus 4.6
/model                   # switch model mid-session
/compact                 # summarise context to conserve token budget — run after each major feature
/clear                   # wipe context entirely — use when switching between api and web work
/status                  # check how much of your usage window remains
```

### Prompting effectively
- **Be specific about scope**: "Add the POST /notebooks route, its zod schema, and service method — don't touch other files" beats "build the notebooks feature"
- **Reference CLAUDE.md explicitly**: "Following the conventions in CLAUDE.md, add a new Section service"
- **Ask for a plan first**: "Before writing any code, list the files you'll create or modify for this task" — review it, then say "go ahead"
- **One feature at a time**: finish and manually test each piece before starting the next
- **Use the `opusplan` model alias** for architecture work: Opus reasons through the plan, Sonnet writes the code — best use of your Max 5x budget

### Suggested build order for MVP-1
1. Scaffold monorepo (root `package.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`)
2. `packages/shared-types` — initial DTOs
3. `apps/api` — Express skeleton, DB connection singleton, run migrations on startup
4. `apps/api` — auth endpoints (register, login, logout, me)
5. `apps/api` — notebooks, sections, notes routes + services
6. `apps/web` — Angular scaffold with Tailwind and Font Awesome wired up
7. `apps/web` — auth pages (login, register) + HTTP interceptor for credentials + route guard
8. `apps/web` — three-panel shell layout component
9. `apps/web` — notebook / section / note CRUD connected to the API
10. Smoke test the full flow end-to-end

### What Claude Code is great at for this project
- Scaffolding workspace configs, tsconfig files, and Express/Angular boilerplate
- Writing zod schemas directly from the DTO definitions in this file
- Writing SQL migrations from the data model above
- Generating Angular services that mirror the API endpoints above
- Catching missing error handling or unhandled edge cases
- Refactoring a file when given a clear description of the desired change

### Token tips for Max 5x
- Run `/compact` after completing each numbered build step above
- Use `/clear` when switching between api and web sessions — they share little context
- Keep each session focused on one feature area; context sprawl wastes tokens fast
