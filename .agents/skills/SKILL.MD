---
name: spotlight
description: Guidance for working on Spotlight, an online concert ticket booking platform (Rails API backend + React frontend). Use this skill whenever building features, fixing bugs, writing migrations, or reviewing code for Spotlight — covers architecture, domain model, conventions, and workflow so changes stay consistent with the rest of the codebase.
---

# Spotlight — Concert Ticket Booking Platform

Spotlight lets users discover concerts/events, pick seats or ticket tiers, and buy tickets online. This skill captures the project's architecture and conventions so any agent (or human) working on it produces consistent, idiomatic changes.

## Stack

- **Backend**: Ruby on Rails (API-only mode), PostgreSQL
- **Frontend**: React (SPA, consumes the Rails API over JSON)
- **Auth**: token/session-based (JWT or Devise + JWT — confirm which before touching auth code)
- **Background jobs**: Sidekiq (assumed — for things like email confirmations, hold-expiry cleanup)
- **Payments**: external gateway (e.g. Stripe) — never log or persist raw card data

> Update this section once the real gems/tools are locked in (Devise vs custom auth, Sidekiq vs GoodJob, Stripe vs alternative, etc). Treat anything above as a placeholder default until confirmed against `Gemfile` / `package.json`.

## Repository layout (expected)

```
spotlight/
├── backend/                # Rails API
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   ├── models/
│   │   ├── serializers/
│   │   ├── services/        # booking, payment, seat-hold logic lives here, not in controllers
│   │   └── jobs/
│   ├── db/migrate/
│   └── spec/                # RSpec
└── frontend/                 # React app
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── api/               # API client / fetch wrappers
    │   ├── hooks/
    │   └── store/              # state management (Redux/Zustand/Context — confirm)
    └── tests/
```

If the real repo differs from this, treat this section as provisional and update it to match — don't force the codebase to fit the doc.

## Core domain model

Concert ticketing has a few recurring hard parts. Model them explicitly rather than improvising per-feature:

- **Event** — a concert: artist/act, venue, `starts_at`, status (draft/published/cancelled/sold_out)
- **Venue** — name, address, capacity, optional seat map
- **TicketType / Tier** — e.g. GA, VIP, balcony — has price, quantity available, per-order purchase limit
- **Seat** (if reserved seating) — belongs to a Venue's seat map, has a status (available/held/sold)
- **Order** — belongs to a User, has line items (tickets), a status (pending/paid/failed/refunded), and a total
- **Ticket** — the actual issued ticket after payment succeeds; has a unique code/QR for entry, belongs to an Order and a TicketType (and Seat, if applicable)
- **Hold** — a short-lived reservation (e.g. 10–15 min) on a Seat or TicketType quantity while a user is checking out; must expire automatically (background job) and release inventory back

**Inventory correctness is the top priority.** Never let two orders sell the same seat or oversell a TicketType's quantity:

- Use DB-level constraints (unique index on `seat_id` for non-cancelled tickets) or row locking (`SELECT ... FOR UPDATE`) around the hold → purchase transition, not just app-level checks.
- Wrap hold creation, payment confirmation, and ticket issuance in a single DB transaction per order.
- Expire holds via a scheduled job, not just client-side timers.

## Conventions

**Rails (backend)**

- API-only controllers: thin — validate params, delegate to a service object, return a serialized response. No business logic in controllers.
- Booking/payment/seat-hold logic goes in `app/services/`, one class per operation (e.g. `Bookings::CreateHold`, `Bookings::ConfirmPayment`), each with a single `call` entry point.
- Use serializers (e.g. `ActiveModel::Serializer` or plain PORO serializers) to shape JSON responses — don't call `.to_json` on models directly.
- Money: store as integer cents, never floats. Use a `Money`-style value object or a well-tested helper for currency formatting.
- Timestamps: store and compare in UTC; let the frontend handle timezone display.
- Write a request spec (or model/service spec) for every new endpoint or service object. Payment and inventory logic needs the most thorough coverage — race conditions and double-booking are the main failure mode to guard against.

**React (frontend)**

- Components are functional with hooks; no class components.
- All API calls go through the `src/api/` client layer — no raw `fetch`/`axios` calls scattered in components.
- Keep checkout/seat-hold countdown state close to where it's used; don't let a stale hold silently show as "still reserved" in the UI after it expires server-side — poll or trust a server-provided expiry timestamp, not a client-only timer.
- Loading and error states are required for anything that hits the network (event listings, seat maps, checkout) — never leave a bare blank screen on failure.

**General**

- Never log raw payment details (card numbers, CVV) anywhere, including error logs/Sentry breadcrumbs.
- Any change touching Order/Ticket/Seat/Hold logic should call out how it affects concurrent-purchase safety in the PR description or commit message.

Bonus rule:

- never commit code by yourself to github or push; leave it to the programmer
