# Client (Next.js)

LP Management frontend built with Next.js App Router + TypeScript + TailwindCSS.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Routes

- `/` splash routing gate
- `/login`
- `/reset-password`
- `/onboarding`
- `/kyc`
- `/dashboard`
- `/dashboard/profile`
- `/dashboard/deposit`
- `/dashboard/withdraw`
- `/dashboard/settings`
- `/dashboard/about`
- `/dashboard/help`
- `/dashboard/support`
- `/dashboard/faq`

## UX Behavior

- Dark mode default
- Responsive fixed sidebar (desktop)
- Drawer menu (mobile)
- Bottom nav for Profile, Deposit, Home, Withdraw, Settings
- Deposit/Withdraw disabled until KYC is approved
