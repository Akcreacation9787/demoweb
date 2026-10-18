# ATER KOMPANY — Financial Dashboard

Premium full-stack financial platform with navy-blue sidebar, ledger-accurate accounting, referral genealogy, and auditable workflows.

## Technology
- Next.js 16 (App Router) + React 19 + Tailwind 4
- PostgreSQL + Prisma ORM/Studio integration (existing application queries remain compatible with Drizzle during migration)
- JWT (HttpOnly cookie) + bcryptjs
- Recharts + Lucide React
- Drizzle Kit migrations

## Quick Start

```bash
npm install
cp .env.example .env  # set DATABASE_URL and JWT_SECRET
npm run db:push
curl -X POST http://localhost:3000/api/seed   # seed demo data
npm run dev   # http://localhost:3000
```

Demo credentials (after seeding):
- User: demo@aterkompany.com / Demo@123
- Admin: admin@aterkompany.com / Admin@123

## Features
- Landing, Login, Register, Forgot
- Dashboard: total investment, earnings, today activity, direct/team stats, charts, recent transactions, referral link
- Investment Records (CRUD + ledger entry)
- My Team + Genealogy tree (level 1/2, search, CSV export)
- Earnings History (ledger-verified)
- Transactions (pagination, filters, export)
- Withdrawals (pending → under_review → approved → processing → completed, idempotency, balance check)
- Reports (PDF/Excel via CSV, charts)
- Calculator (simulation vs verified, NUMERIC)
- Notifications (real-time polling every 15s, mark read)
- Support Tickets
- Profile & Settings (audit-logged)
- Admin: user management, withdrawal approvals, stats, audit logs, config, CSV export
- Multi-language EN/TA, dark mode toggle, responsive (mobile/tablet/desktop)

## API
All under `/api/v1/` with auth middleware (cookie or Bearer), rate-limit boundary, consistent errors, pagination:

- POST /api/v1/auth/register, /login, /logout, GET /me
- GET /dashboard (aggregates wallet, ledger, team, chart)
- GET/POST /investments, /transactions, /team, /referrals, /withdrawals, /notifications, /support, /calc, /profile
- GET/POST /admin/users, /admin/withdrawals, /admin/stats

## Database
Tables: users, sessions, user_profiles, referral_relationships, wallet_accounts, ledger_entries (NUMERIC), investment_records, withdrawal_requests, calculation_configs/history, notifications, support_tickets, audit_logs, system_settings.

Schema: `prisma/schema.prisma` → `npm run db:push`. Inspect data with `npm run db:studio`.

## Razorpay payments
Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env` using Razorpay test keys. The investment screen creates an order on the server, verifies Razorpay's signature on the server, and atomically creates the payment, investment, ledger entry, and wallet update.

## Security
- bcrypt password hashing, JWT 7d HttpOnly SameSite=Lax
- Role checks on every admin endpoint (server-side)
- No cross-user data leakage (userId from token)
- IDOR prevention — all queries scoped to auth user
- Decimal via NUMERIC(18,2), atomic checks, duplicate-withdrawal prevention
- Audit logs for profile, admin status/role, withdrawal state changes
- Rate limiting, CORS, security headers (boundary implemented, configure reverse proxy)
- No secrets committed (.env.example only)

## Backup & Restore
```bash
pg_dump $DATABASE_URL > backup_$(date +%F).sql
psql $DATABASE_URL < backup.sql
```
Documented in Admin → Config & Audit.

## Deployment
1. Set DATABASE_URL, JWT_SECRET in production env
2. Run `npm run db:push` against the production database
3. `npm run build && npm start` (or Vercel/Render/Fly with Postgres)
4. Health: GET /api/health → { ok:true }
5. HTTPS via provider (Vercel auto, or Nginx + certbot)

## Known Limitations
- Email verification/reset is integration boundary (needs SMTP creds)
- Razorpay test/live mode depends on the keys configured in the environment
- Referral rewards not auto-paid — requires business/compliance review
- Calculations are simulations until approved business rules confirmed
- Rate limiting is in-memory — use Redis for multi-instance

## Testing (manual)
1. Register with referral code → check referrer team
2. Create investment → ledger entry appears
3. Request withdrawal → admin approves → balance updates
4. Calculator simulation ≠ ledger
5. Mobile nav (hamburger) responsive
6. Unauthorized API → 401/403

## License
Internal demo — simulations are not guaranteed returns.
