# Online Presence

Fullstack web application built with Next.js 16 (App Router).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand, React Query
- **Database:** SQLite via Prisma
- **Auth:** Auth.js v5
- **PWA:** next-pwa
- **Validation:** Zod, next-safe-action

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Run database migrations |
| `npx prisma studio` | Open Prisma Studio |
