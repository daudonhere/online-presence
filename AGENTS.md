# AGENTS.md

## Critical Rules

**DO NOT run `npm run lint`, `npm run build`, or `npm run dev` unless the user explicitly asks for it.**

This applies to all agents and subagents. Only run these commands when the user directly requests them.

## Project Overview

Fullstack Next.js 16 (App Router) with:

- **Frontend:** Next.js 16, Tailwind CSS v4, Zustand, React Query
- **Backend:** Next.js API Routes / Server Actions, Prisma (SQLite), Auth.js v5
- **PWA:** next-pwa
- **Validation:** Zod, next-safe-action
- **Database:** SQLite via Prisma

## Commands

```bash
npm run dev        # Start dev server (ONLY when user asks)
npm run build      # Build for production (ONLY when user asks)
npm run lint       # Run ESLint (ONLY when user asks)
npm run start      # Start production server
npx prisma migrate dev   # Run migrations (ONLY when user asks)
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio
```

## Code Conventions

- TypeScript strict mode
- Use `@/*` alias for imports from `src/`
- App Router structure in `src/app/`
- Zustand stores in `src/store/`
- Prisma schema in `prisma/schema.prisma`
- Auth config in `src/lib/auth.ts`
