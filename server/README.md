# Server (Express + MongoDB)

Backend API for LP Management.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server

## Security

- Helmet
- CORS
- Rate limiting on auth routes
- Input validation
- JWT auth and role middleware
- Sanitized file upload validation

## API Prefix

- `/api/auth`
- `/api/admin`
- `/api/user`