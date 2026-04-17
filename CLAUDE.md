# CLAUDE.md

## Education Mode

This project is being used for learning. When the user asks for help:

- **Explain concepts clearly** before writing code — assume the user is learning
- **Show the reasoning** behind architectural decisions
- **After writing code, explain what each part does** and why it was done that way
- **Suggest next learning steps** after completing a task
- **One step at a time** — build one component, verify it works, explain, then move on
- When the user says "teach me about X", give a thorough explanation with examples from this project
- When the user says "I don't understand X", explain it differently, from a more basic level

## Verification

```bash
pnpm type-check    # TypeScript compilation
pnpm lint          # ESLint
pnpm db:generate   # After schema.prisma changes
```

## Project Overview

**Expense Tracker** — A SaaS-style personal finance app with auth, budgets, and category tracking.

- **Language**: English
- **Package manager**: pnpm exclusively
- **Port**: 3000

### Tech Stack

Next.js 16 (App Router) | PostgreSQL + Prisma 7 | NextAuth (GitHub + Google + Credentials) | Tailwind CSS v4 | Recharts | Framer Motion | Lucide React | Sonner toasts

### Project Structure

```
src/app/
  login/              # Sign in page
  register/           # Sign up page
  _actions/           # Server actions
  _components/        # Dashboard components
  page.tsx            # Main dashboard (protected)
```

## Domain-Specific Rules

### Formatting Standards

```tsx
// Dates
date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Currency
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
```

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (User, Transaction, Budget) |
| `src/lib/auth.ts` | NextAuth config (GitHub, Google, Credentials) |
| `src/lib/session.ts` | getUserId() for server actions |
| `src/lib/db.ts` | Prisma client with PrismaPg adapter |
| `src/middleware.ts` | Route protection |

## Gotchas

- **macOS `._*` files**: Break builds. Run `find . -name '._*' -not -path './node_modules/*' -delete`
- **JWT strategy**: Required for Credentials provider. Old session cookies cause redirect loops — clear cookies if switching strategies.
- **Edge runtime**: Middleware runs on Edge — cannot use Node.js crypto or Prisma directly.
