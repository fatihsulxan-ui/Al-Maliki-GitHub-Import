---
name: AL-RISALA auth roles
description: Role-scoped token design for the restaurant menu system.
---

## Token scheme

Two static tokens live in `artifacts/api-server/src/routes/store.ts`:
- `ADMIN_TOKEN` — admin-only access
- `WAITER_TOKEN` — waiter-only access

`getTokenForRole(role)` returns the correct token on login.
`verifyToken(token)` returns `{ valid, role }`.

## Middleware

- `authMiddleware` — accepts both admin and waiter tokens (sets `req.userRole`)
- `adminOnly` — accepts admin token only (403 for waiter)

**Why:** Original code issued the same token to both roles, allowing waiter credentials to call admin-protected routes.

**How to apply:** All write routes for menu, categories, tables, settings, upload use `adminOnly`. Waiter-facing read/write routes (orders, waiter-calls) use `authMiddleware`.

## Initialization

`initMenu(INITIAL_MENU)` and `initCategories(INITIAL_CATEGORIES)` are called in `src/index.ts` at startup (before `initTables`/`initSettings`). They load from Supabase if available, otherwise seed from initial-data.ts.
