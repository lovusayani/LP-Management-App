# LP Management Web Application

LP Management is a full-stack application built with Next.js + TypeScript (frontend) and Node.js + Express + MongoDB (backend).

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, TailwindCSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Auth: JWT (Access + Refresh token)
- Storage: Local file upload service abstraction (ready for S3 swap)

## Folder Structure

```txt
/server
  /config
  /controllers
  /middlewares
  /models
  /routes
  /services
  /types
  /utils
  server.ts

/client
  /app
  /components
  /layouts
  /hooks
  /services
  /types
```

## Features Implemented

### Authentication + Security

- Admin-only LP user creation
- Password hashing with bcrypt
- JWT access + refresh flow
- Forced password reset on first login
- Helmet enabled
- CORS configured
- Rate limiting on auth routes
- Input validation via `express-validator`
- File upload restrictions (type + size)

### LP User Flow

Splash routing logic:

1. No session → `/login`
2. `mustChangePassword = true` → `/reset-password`
3. `onboardingCompleted = false` → `/onboarding`
4. `kycSubmitted = false` → `/kyc`
5. Else → `/dashboard`

### Modules

- Onboarding (4 placeholder slides with Next/Skip)
- KYC submission (company proof, PAN, Aadhaar, selfie)
- Dashboard with bottom navigation + responsive sidebar
- Profile (info, KYC badge, history/report placeholders)
- Deposit & Withdraw UI (disabled if KYC not approved)
- Settings persisted in DB (theme, font size, sound, alerts)

### Admin Capabilities

- Create LP user
- View all LP users
- Approve/Reject KYC
- Activate/Suspend users

## Local Setup

## 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000` by default.

Optional bootstrap admin (from `.env`):

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## 2) Frontend

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## API Base

- Health: `GET /api/health`
- Auth: `/api/auth/*`
- Admin: `/api/admin/*`
- User: `/api/user/*`

## Core API Endpoints

### Auth

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### Admin (admin role required)

- `POST /api/admin/users`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/kyc-status`
- `PATCH /api/admin/users/:id/status`

### User (authenticated)

- `POST /api/user/onboarding/complete`
- `POST /api/user/kyc`
- `GET /api/user/profile`
- `GET /api/user/settings`
- `PUT /api/user/settings`
- `GET /api/user/transaction-access`

## Notes

- KYC files are stored in `/server/uploads` and served from `/uploads/*`.
- Deposit/Withdraw are currently UI placeholders per scope.
- Local storage abstraction is ready for future S3 implementation.
