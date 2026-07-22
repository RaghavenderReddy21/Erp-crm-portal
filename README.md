# Mini ERP + CRM Operations Portal

A small internal ERP/CRM system for a wholesale/distribution company: customer CRM,
product & inventory management, and a sales challan workflow with real stock-control
business logic.

## Live Deployment

- **Frontend**: https://erp-crm-portal-theta.vercel.app
- **Backend API**: https://erp-crm-portal-5maj.onrender.com
- **GitHub repository**: https://github.com/RaghavenderReddy21/Erp-crm-portal

> Note: the backend runs on Render's free tier, which spins down after 15 minutes
> of inactivity. The first request after idle time may take 30-50 seconds to
> respond while it wakes up — this is expected behavior, not a bug.
## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js, PostgreSQL (via Prisma ORM), JWT auth, Zod validation
- **Frontend**: React, TypeScript, Vite, React Router, Axios
- **Deployment target**: Render/Railway (backend), Vercel/Netlify (frontend), Neon/Supabase (Postgres) — all free tier

## Architecture

```
erp-crm/
├── backend/          Express + TypeScript REST API
│   ├── prisma/
│   │   └── schema.prisma       # Data model: User, Customer, FollowUp, Product,
│   │                            StockMovement, Challan, ChallanItem
│   └── src/
│       ├── routes/             # Route definitions per module
│       ├── controllers/        # Request handlers / business logic
│       ├── middleware/         # JWT auth, role guard, error handler
│       ├── validators/         # Zod request schemas
│       └── utils/               # Prisma client, error classes, seed script
├── frontend/         React + TypeScript SPA
│   └── src/
│       ├── pages/               # One component per screen
│       ├── components/          # Layout, ProtectedRoute
│       ├── context/              # AuthContext (JWT + user state)
│       ├── api/                  # Axios client with auth interceptor
│       └── types/                # Shared TS types mirroring backend models
└── postman_collection.json
```

**Request flow**: React SPA → Axios (attaches JWT) → Express route → `requireAuth` /
`requireRole` middleware → Zod validation → controller (business logic, wrapped in a
Prisma `$transaction` where it touches stock) → Postgres via Prisma → JSON response →
global error handler formats any thrown error consistently.

### Key business logic

- **Stock never goes negative.** Every place stock is deducted (confirming a challan,
  a manual OUT stock movement) checks availability inside a DB transaction before
  writing, and throws a `409` with a clear message if there isn't enough stock.
- **Challans snapshot product data** (name, SKU, unit price) into `ChallanItem` at
  creation time, so editing or repricing a product later never rewrites history.
- **Status transitions carry side effects**: confirming a Draft challan deducts stock
  and logs a `StockMovement`; cancelling a Confirmed challan restores that stock and
  logs the reversal. A Cancelled challan is terminal.
- **Role-based access**: Admin has full access. Sales manages customers and creates
  challans. Warehouse manages products/stock and can confirm/cancel challans.
  Accounts has read access across modules (extend as needed for invoicing).

## Local Setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local install, or a free hosted one — see Deployment below)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL to your Postgres connection string, and set JWT_SECRET
npm install
npx prisma migrate dev --name init   # creates tables
npm run seed                          # creates test users + sample data
npm run dev                           # starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL should point at your backend, e.g. http://localhost:4000
npm install
npm run dev                           # starts on http://localhost:5173
```

Open http://localhost:5173 and log in with any seeded account below.

## Test Login Credentials

All seeded accounts use the password `Password123!`

| Role      | Email               |
|-----------|---------------------|
| Admin     | admin@erp.test      |
| Sales     | sales@erp.test      |
| Warehouse | warehouse@erp.test  |
| Accounts  | accounts@erp.test   |

## Environment Variables

**Backend (`backend/.env`)**
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random string in production |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `PORT` | Port the API listens on (default 4000) |
| `CORS_ORIGIN` | Comma-separated allowed origins for the frontend |

**Frontend (`frontend/.env`)**
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | URL of the backend API |

Never commit real `.env` files — only the `.env.example` templates are checked in.

## Deployment (free tier)

1. **Database**: Create a free Postgres instance on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com). Copy the connection string into `DATABASE_URL`.
2. **Backend**: Push this repo to GitHub, connect it on
   [Render](https://render.com) (or Railway/Fly.io) as a Web Service:
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`
   - Add the same environment variables from `backend/.env.example`.
3. **Frontend**: Connect the repo on [Vercel](https://vercel.com) or
   [Netlify](https://netlify.com), set the root directory to `frontend`, and set
   `VITE_API_BASE_URL` to your deployed backend URL. Build command `npm run build`,
   output directory `dist`.
4. Update the backend's `CORS_ORIGIN` to the deployed frontend URL and redeploy.

AWS deployment (EC2 + RDS, or ECS) follows the same pattern — provision an RDS
Postgres instance, run the same build/start commands on the compute side, and set
the identical environment variables.

## API Overview

All endpoints except `/auth/login` and `/health` require `Authorization: Bearer <token>`.

| Method | Route | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns JWT + user |
| GET | `/auth/me` | Any | Current user profile |
| GET | `/customers` | Any | List/search/paginate customers |
| POST | `/customers` | Admin, Sales | Create customer |
| GET | `/customers/:id` | Any | Customer detail + follow-ups + challans |
| PUT | `/customers/:id` | Admin, Sales | Update customer |
| POST | `/customers/:id/follow-ups` | Admin, Sales | Add follow-up note |
| GET | `/products` | Any | List/search/paginate products |
| POST | `/products` | Admin, Warehouse | Create product |
| GET | `/products/:id` | Any | Product detail + movement history |
| PUT | `/products/:id` | Admin, Warehouse | Update product (not stock directly) |
| POST | `/products/:id/stock-movements` | Admin, Warehouse | Record IN/OUT movement |
| GET | `/challans` | Any | List/filter challans |
| POST | `/challans` | Admin, Sales | Create challan (Draft or Confirmed) |
| GET | `/challans/:id` | Any | Challan detail with line items |
| PATCH | `/challans/:id/status` | Admin, Sales, Warehouse | Confirm/cancel challan |

Full request/response examples: see `postman_collection.json` (import into Postman
and set the `baseUrl`, `token`, `customerId`, `productId` collection variables).

## Assumptions Made

- "GST number optional" per spec — no format validation applied beyond free text.
- Challan numbers are generated sequentially per calendar year (`CH-2026-0001`).
- Editing a Product does not allow directly overwriting `currentStock` — all stock
  changes go through the stock-movement endpoint (or challan confirm/cancel) so
  there's always an audit trail, per the spirit of the "stock movement log" requirement.
- Accounts role currently has read-only access across all modules; the spec didn't
  define Accounts-specific write actions (e.g. invoicing) beyond what's listed, so
  those endpoints were intentionally left as a bonus/extension point.
- Simple JWT auth was used (per "Simple JWT-based authentication is acceptable"),
  no refresh tokens.

## Known Limitations / Not Implemented

- **Invoice module**: not built — the case study lists Sales Challan as the core
  flow; invoicing (PDF export) is called out as a bonus item.
- **Bonus items not implemented**: Docker setup, GitHub Actions CI/CD, PDF invoice
  export, product image upload to S3.
- **No automated test suite** (unit/integration tests) — given the 48-hour window,
  effort went into correctness of the core business logic (transactional stock
  handling) instead. Recommended next step if extending this project.
- **No password reset / user self-registration UI** — users are seeded directly;
  an Admin-only "manage users" screen would be a natural next addition.
- Frontend styling is a clean, functional hand-rolled admin UI (no component library)
  rather than a polished design system — prioritized correctness of business logic
  and API design within the time available.

## Scripts Reference

**Backend** (`backend/package.json`)
- `npm run dev` — start with hot reload
- `npm run build` / `npm start` — production build & run
- `npx prisma migrate dev` — create/apply a migration locally
- `npx prisma migrate deploy` — apply migrations in production
- `npm run seed` — seed test users + sample customer/products

**Frontend** (`frontend/package.json`)
- `npm run dev` — start dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally
