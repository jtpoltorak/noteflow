# NoteFlow — Architecture Diagram

> Generated 2026-03-15. Refer to `CLAUDE.md` for coding conventions and setup instructions.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Angular 21 SPA (apps/web)                        │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │  Auth Pages  │  │  Shell (3-   │  │  Shared     │  │   PWA     │  │  │
│  │  │  (Login /    │  │  Panel       │  │  Note View  │  │  Service  │  │  │
│  │  │  Register)   │  │  Layout)     │  │             │  │  Worker   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  └───────────┘  │  │
│  │                          │                                            │  │
│  │           ┌──────────────┼──────────────────────┐                     │  │
│  │           ▼              ▼                       ▼                     │  │
│  │  ┌──────────────┐ ┌──────────┐ ┌──────────────────────────────────┐  │  │
│  │  │ Core Services │ │  Guards  │ │         Interceptors             │  │  │
│  │  │ (HTTP calls)  │ │ (Auth)   │ │  (withCredentials: true)        │  │  │
│  │  └──────┬───────┘ └──────────┘ └──────────────────────────────────┘  │  │
│  └─────────┼─────────────────────────────────────────────────────────────┘  │
│            │  HTTP + httpOnly cookies (JWT)                                  │
└────────────┼────────────────────────────────────────────────────────────────┘
             │
             │  CORS: mynoteflow.app / localhost:4200
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVER (apps/api)                                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                  Express + TypeScript (Node.js)                       │  │
│  │                                                                       │  │
│  │  ┌────────────────────────── Middleware ──────────────────────────┐   │  │
│  │  │  cors ──▶ json ──▶ cookieParser ──▶ requireAuth ──▶ validate  │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                              │                                        │  │
│  │  ┌──────────── Routes ───────┴────────────────────────────────────┐  │  │
│  │  │  auth │ notebooks │ sections │ notes │ tags │ templates │ ...  │  │  │
│  │  └──────────────────────┬─────────────────────────────────────────┘  │  │
│  │                         │                                             │  │
│  │  ┌──────── Services ────┴─────────────────────────────────────────┐  │  │
│  │  │  auth │ notebook │ section │ note │ search │ tag │ image │ ...│  │  │
│  │  └──────────────────────┬─────────────────────────────────────────┘  │  │
│  │                         │                                             │  │
│  │  ┌──────── Database ────┴─────────────────────────────────────────┐  │  │
│  │  │            better-sqlite3 (synchronous)                        │  │  │
│  │  │            noteflow.db — single file                           │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────────────────────┐ │
│  │ Static file  │  │ Account purge  │  │  Upload dir (images / audio)    │ │
│  │ serving      │  │ cron job       │  │  /api/v1/images/* (public)      │ │
│  └─────────────┘  └────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     SHARED (packages/shared-types)                          │
│                                                                             │
│  TypeScript interfaces (DTOs) imported by both apps/web and apps/api        │
│  Request DTOs: Create/Update Notebook, Section, Note, Template, etc.        │
│  Response DTOs: UserDto, NotebookDto, SectionDto, NoteDto, TagDto, etc.     │
│  API wrappers: ApiSuccessResponse<T>, ApiErrorResponse                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Package Structure

```
noteflow/
│
├── package.json                 ← npm workspaces root
├── tsconfig.base.json           ← shared TS config
├── CLAUDE.md                    ← project conventions
│
├── apps/
│   ├── web/                     ← Angular 21 front-end
│   │   ├── angular.json
│   │   ├── tailwind.config.js
│   │   └── src/app/
│   │       ├── core/            ← services, guards, interceptors, utils
│   │       ├── features/        ← auth, shell, shared-note
│   │       └── shared/          ← reusable dialogs & components
│   │
│   └── api/                     ← Express + TypeScript back-end
│       └── src/
│           ├── routes/          ← thin HTTP handlers
│           ├── services/        ← business logic
│           ├── middleware/      ← auth, error, validation
│           ├── db/              ← database + migrations (SQL)
│           └── cron/            ← scheduled jobs
│
└── packages/
    └── shared-types/            ← DTOs shared between web & api
        └── src/index.ts
```

---

## 3. Database Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     User     │       │     Notebook     │       │     Section      │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id      (PK) │──┐    │ id          (PK) │──┐    │ id          (PK) │──┐
│ email        │  │    │ userId      (FK) │  │    │ notebookId  (FK) │  │
│ passwordHash │  │    │ title            │  │    │ title            │  │
│ darkMode     │  └───▶│ order            │  └───▶│ order            │  │
│ deleteReq'dAt│       │ createdAt        │       │ createdAt        │  │
│ createdAt    │       │ updatedAt        │       │ updatedAt        │  │
└──────┬───────┘       └──────────────────┘       └────────┬─────────┘
       │                                                    │
       │  ┌─────────────────────┐                           │
       │  │   UserTemplate      │                           │
       │  ├─────────────────────┤       ┌──────────────────┐│
       │  │ id            (PK)  │       │      Note        ││
       │  │ userId        (FK)  │       ├──────────────────┤│
       └─▶│ name                │       │ id          (PK) │◀┘
          │ description         │       │ sectionId   (FK) │
          │ content             │       │ title            │
          │ category            │       │ content    (HTML)│
          │ createdAt           │       │ order            │
          │ updatedAt           │       │ archivedAt       │
          └─────────────────────┘       │ favoritedAt      │
                                        │ shareToken       │
  ┌──────────────────┐                  │ passwordHash     │
  │       Tag        │                  │ createdAt        │
  ├──────────────────┤                  │ updatedAt        │
  │ id          (PK) │                  └──┬───┬───────────┘
  │ userId      (FK) │                     │   │
  │ name             │    ┌────────────────┘   │
  │ createdAt        │    │                    │
  └───────┬──────────┘    │   ┌────────────────┘
          │               │   │
          ▼               ▼   ▼
  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐
  │  NoteTag     │  │   Image     │  │   Audio     │
  │ (join table) │  ├─────────────┤  ├─────────────┤
  ├──────────────┤  │ id     (PK) │  │ id     (PK) │
  │ noteId  (FK) │  │ noteId (FK) │  │ noteId (FK) │
  │ tagId   (FK) │  │ filename    │  │ filename    │
  └──────────────┘  │ originalName│  │ originalName│
                    │ mimeType    │  │ mimeType    │
                    │ size        │  │ size        │
                    │ createdAt   │  │ createdAt   │
                    └─────────────┘  └─────────────┘
```

**Relationships:**
- User 1 ──▶ N Notebooks (cascade delete)
- User 1 ──▶ N UserTemplates (cascade delete)
- User 1 ──▶ N Tags (cascade delete)
- Notebook 1 ──▶ N Sections (cascade delete)
- Section 1 ──▶ N Notes (cascade delete)
- Note 1 ──▶ N Images (cascade delete)
- Note 1 ──▶ N Audio (cascade delete)
- Note N ◀──▶ N Tags (via NoteTag join table)

---

## 4. API Request Flow

```
Client Request
      │
      ▼
┌─────────────┐
│    CORS      │  origin: mynoteflow.app | localhost:4200
└──────┬──────┘
       ▼
┌─────────────┐
│  JSON Parse  │  express.json()
└──────┬──────┘
       ▼
┌──────────────┐
│ Cookie Parse │  cookieParser()
└──────┬───────┘
       ▼
┌──────────────────┐
│  requireAuth?    │  Verifies JWT from httpOnly cookie
│  (protected      │  Populates req.user = { id, email }
│   routes only)   │  Returns 401 if invalid/missing
└──────┬───────────┘
       ▼
┌──────────────────┐
│  validate()      │  Zod schema validation on req.body
│                  │  Returns 400 with error details
└──────┬───────────┘
       ▼
┌──────────────────┐
│  Route Handler   │  Thin — extracts params, calls service
└──────┬───────────┘
       ▼
┌──────────────────┐
│  Service Layer   │  Business logic + database queries
│                  │  Throws on errors
└──────┬───────────┘
       ▼
┌──────────────────┐
│  Response        │  { data: T } or { data: T, message }
└──────────────────┘

       │ (on error)
       ▼
┌──────────────────┐
│  Error Middleware │  Catches thrown errors
│                  │  Returns { error: { message, code? } }
└──────────────────┘
```

---

## 5. Front-End Component Tree (Desktop Layout)

```
AppComponent
  └── Router
        ├── Login                          (/login)
        ├── Register                       (/register)
        ├── SharedNote                     (/shared/:token)
        │
        └── Shell [authGuard]              (/)
              │
              ├── Header
              │     ├── Logo + Quick Note button
              │     ├── User email
              │     └── Theme toggle │ PWA install │ Settings │ Help │ Logout
              │
              ├── Main Content Area (flex row)
              │     │
              │     ├── NavRail (icon sidebar)
              │     │     ├── Notes mode
              │     │     ├── Favorites mode
              │     │     ├── Shared mode
              │     │     ├── Tags mode
              │     │     ├── Search mode
              │     │     └── Archive mode
              │     │
              │     ├── Left Sidebar (contextual)
              │     │     ├── [notes]     NotebookList (w=56)
              │     │     ├── [favorites] FavoritesPanel (w=96)
              │     │     ├── [shared]    SharedPanel (w=96)
              │     │     ├── [tags]      TagsPanel (w=96)
              │     │     ├── [search]    SearchPanel (w=96)
              │     │     └── [archive]   ArchivePanel (w=96)
              │     │
              │     ├── Middle Panel (notes mode only)
              │     │     └── SectionList (w=52)
              │     │
              │     ├── NoteArea (flex-1)
              │     │     ├── Note list (collapsible)
              │     │     ├── TiptapEditor
              │     │     │     ├── SlashCommandMenu
              │     │     │     ├── FindReplacePanel
              │     │     │     ├── TableToolbar
              │     │     │     ├── LinkPopover
              │     │     │     ├── NoteLinkPicker
              │     │     │     └── CodeBlockLanguage extension
              │     │     ├── MoveNoteDialog
              │     │     └── PresentationView
              │     │
              │     └── HelpPanel (toggleable, w=80)
              │
              ├── Footer (version, about, feedback, legal)
              │
              └── Overlay Dialogs
                    ├── AboutDialog
                    ├── FeedbackDialog
                    ├── LegalDialog
                    ├── SettingsDialog
                    ├── QuickNoteDialog
                    ├── ReleaseNotesDialog
                    └── TemplatePicker
```

---

## 6. Angular Service Layer

```
core/
├── guards/
│   └── auth.guard.ts              ← canActivate: redirects to /login if not authenticated
│
├── interceptors/
│   └── auth.interceptor.ts        ← adds withCredentials: true to all API calls
│
├── services/
│   ├── auth.service.ts            ← login, register, logout, me, password change, account closure
│   ├── notebook.service.ts        ← CRUD notebooks
│   ├── section.service.ts         ← CRUD sections (scoped to notebook)
│   ├── note.service.ts            ← CRUD notes, archive, favorite, share, lock
│   ├── search.service.ts          ← full-text search across notes
│   ├── tag.service.ts             ← CRUD tags, tag/untag notes
│   ├── template.service.ts        ← CRUD user templates
│   ├── image.service.ts           ← upload images to notes
│   ├── audio.service.ts           ← upload audio to notes
│   ├── theme.service.ts           ← dark/light mode toggle (syncs to API)
│   ├── viewport.service.ts        ← responsive breakpoint detection
│   ├── editor-preferences.service.ts  ← editor settings (local storage)
│   ├── pwa.service.ts             ← PWA install prompt
│   └── pwa-update.service.ts      ← service worker update detection
│
└── utils/
    ├── export-html.ts             ← export note as HTML file
    ├── export-pdf.ts              ← export note as PDF
    ├── export-markdown.ts         ← export note as Markdown
    └── import-markdown.ts         ← import Markdown into note
```

---

## 7. API Route Map

```
/api/v1
├── /health                    GET        ← health check (no auth)
│
├── /auth
│   ├── /register              POST       ← create account
│   ├── /login                 POST       ← authenticate → set httpOnly cookie
│   ├── /logout                POST       ← clear cookie
│   ├── /me                    GET        ← current user info
│   ├── /preferences           PUT        ← update dark mode etc.
│   ├── /change-password       PUT        ← change password
│   ├── /close-account         POST       ← request account deletion (7-day grace)
│   └── /reactivate-account    POST       ← cancel pending deletion
│
├── /notebooks                 GET|POST   ← list / create         [auth required]
│   └── /:id                   GET|PUT|DEL ← read / update / delete
│       └── /sections          GET|POST   ← list / create sections
│
├── /sections
│   └── /:id                   PUT|DEL    ← update / delete section
│       └── /notes             GET|POST   ← list / create notes
│
├── /notes
│   └── /:id                   GET|PUT|DEL ← read / update / delete note
│       ├── /archive           POST       ← archive note
│       ├── /unarchive         POST       ← restore from archive
│       ├── /favorite          POST       ← toggle favorite
│       ├── /share             POST       ← generate share link
│       ├── /unshare           POST       ← revoke share link
│       ├── /lock              POST       ← password-protect note
│       ├── /unlock            POST       ← remove password
│       ├── /verify-password   POST       ← check note password
│       ├── /tags              GET|POST   ← list / add tags
│       │   └── /:tagId        DEL        ← remove tag
│       └── /images            POST       ← upload image
│
├── /shared/:token             GET        ← view shared note (no auth)
│
├── /tags                      GET        ← all user tags with counts
│   └── /:id                   PUT|DEL    ← rename / delete tag
│       └── /notes             GET        ← notes with this tag
│
├── /templates                 GET|POST   ← list / create templates
│   └── /:id                   PUT|DEL    ← update / delete template
│
├── /search?q=                 GET        ← full-text search
│
├── /images                    Static     ← uploaded images (no auth)
│   └── /notes/:noteId/images  POST       ← upload image
│
├── /audio                     Static     ← uploaded audio (no auth)
│   └── /notes/:noteId/audio   POST       ← upload audio
│
├── /archived-notes            GET        ← all archived notes
├── /favorite-notes            GET        ← all favorited notes
└── /shared-notes              GET        ← all notes with share links
```

---

## 8. Authentication Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Browser  │                    │  Express  │                    │  SQLite  │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │  POST /auth/login             │                               │
     │  { email, password }          │                               │
     │──────────────────────────────▶│                               │
     │                               │  SELECT user by email        │
     │                               │──────────────────────────────▶│
     │                               │◀──────────────────────────────│
     │                               │                               │
     │                               │  bcrypt.compare(password,    │
     │                               │    user.passwordHash)        │
     │                               │                               │
     │                               │  Sign JWT (access token)     │
     │                               │  Sign JWT (refresh token)    │
     │                               │                               │
     │  Set-Cookie: token=<jwt>;     │                               │
     │  HttpOnly; Secure; SameSite   │                               │
     │◀──────────────────────────────│                               │
     │                               │                               │
     │  GET /api/v1/notebooks        │                               │
     │  Cookie: token=<jwt>          │                               │
     │──────────────────────────────▶│                               │
     │                               │  requireAuth middleware:     │
     │                               │  verify JWT, set req.user    │
     │                               │                               │
     │  { data: [...notebooks] }     │                               │
     │◀──────────────────────────────│                               │
     │                               │                               │
```

---

## 9. Technology Stack Summary

```
┌─────────────────────────────────────────────────────────┐
│                      FRONT-END                          │
│                                                         │
│  Angular 21 (standalone components, Signals)            │
│  Tailwind CSS (utility-first styling)                   │
│  Font Awesome 6 (icons via @fortawesome)                │
│  Tiptap (rich-text editor)                              │
│  PWA (service worker, installable)                      │
├─────────────────────────────────────────────────────────┤
│                     SHARED TYPES                         │
│                                                         │
│  TypeScript interfaces (DTOs)                           │
│  @noteflow/shared-types package                         │
├─────────────────────────────────────────────────────────┤
│                      BACK-END                           │
│                                                         │
│  Node.js + Express + TypeScript                         │
│  Zod (request validation)                               │
│  bcrypt (password hashing, 12 rounds)                   │
│  jsonwebtoken (JWT access + refresh tokens)             │
│  cookie-parser (httpOnly cookie auth)                   │
│  multer (file uploads — images, audio)                  │
├─────────────────────────────────────────────────────────┤
│                      DATABASE                           │
│                                                         │
│  SQLite via better-sqlite3 (synchronous)                │
│  Single .db file — zero config                          │
│  12 sequential migrations (001 → 012)                   │
├─────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                        │
│                                                         │
│  Monorepo with npm workspaces                           │
│  Dev: tsx --watch (API) + ng serve (Web)                │
│  Prod: tsc compile (API) + ng build (Web)               │
│  Hosted: mynoteflow.app                                 │
└─────────────────────────────────────────────────────────┘
```
