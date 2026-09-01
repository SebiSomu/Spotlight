---
name: spotlight
description: Guidance for working on Spotlight, an online concert ticket booking platform (Rails API backend + React frontend). Use this skill whenever building features, fixing bugs, writing migrations, or reviewing code for Spotlight — covers architecture, domain model, conventions, and workflow so changes stay consistent with the rest of the codebase.
---

# Spotlight — Concert Ticket Booking Platform

Spotlight lets users discover concerts/events, pick seats or ticket tiers, and buy tickets online. This skill captures the project's architecture and conventions so any agent (or human) working on it produces consistent, idiomatic changes.

## Stack

- **Backend**: Ruby on Rails (API-only mode), PostgreSQL
- **Frontend**: React (SPA, consumes the Rails API over JSON) + Tailwind CSS (always use it!)
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
│   ├── db/seeds.rb          # real artist/venue seed data — see "Seeding artists & venues" below
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

## Seeding artists & venues with real data

When populating Artist and Venue records (seeds, fixtures, or ad-hoc data entry during feature work), agents should insert **real, accurate data** rather than placeholder/fake entries — this keeps the app demoable and realistic:

- **Artists**: real name, genre(s), and a short real bio. Don't invent fictional bands unless the task explicitly asks for test/dummy data.
- **Venues**: real venue name, real address/city, and a real (or realistic, sourced) capacity — don't fabricate an address.
- **Photos**: source artist images from an official/authorized source — the Spotify Web API's artist images endpoint is the preferred source (it's built for this and returns properly licensed CDN URLs), or another official profile (the artist's/venue's own verified page) if Spotify doesn't have the act. Store the image **URL**, not a downloaded/embedded copy of the file, so the app is always pointing at the source's own hosting rather than a redistributed copy.
- Never scrape or hotlink images from unofficial fan sites, social media reposts, or search-engine image results — stick to the artist/venue's own official source.
- If a real photo genuinely can't be sourced for a given artist/venue, leave the image field blank / use a neutral placeholder rather than substituting an unrelated or unverified image.
- Seed scripts (`db/seeds.rb` or dedicated rake tasks) should be idempotent — safe to re-run without duplicating artists/venues (`find_or_create_by` on a unique attribute like name+city, or an external ID from the source API).

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
- Use Tailwind CSS for all styling — no separate CSS files or inline style objects unless Tailwind genuinely can't express it.
- Keep checkout/seat-hold countdown state close to where it's used; don't let a stale hold silently show as "still reserved" in the UI after it expires server-side — poll or trust a server-provided expiry timestamp, not a client-only timer.
- Loading and error states are required for anything that hits the network (event listings, seat maps, checkout) — never leave a bare blank screen on failure.

**General**

- Use 4-space indentation everywhere (both Ruby and JS/JSX) — not the language's typical 2-space default.
- Never insert emojis in code, comments, or commit messages; remove any that show up.
- Never log raw payment details (card numbers, CVV) anywhere, including error logs/Sentry breadcrumbs.
- Any change touching Order/Ticket/Seat/Hold logic should call out how it affects concurrent-purchase safety in the PR description or commit message.

## Working with Antigravity

When Antigravity (or another agent) picks up this skill for a task:

1. Confirm which parts of the "Stack" and "Repository layout" sections above still match the actual repo before assuming them — they're defaults, not verified facts, until checked against `Gemfile`, `package.json`, and the real directory tree.
2. Prefer extending existing service objects / API endpoints over creating parallel ones for the same concern.
3. For anything touching purchase/seat/hold flows, write or update tests alongside the change — this is the area most likely to have subtle concurrency bugs.
4. Keep frontend and backend changes in the same PR when they implement one feature (e.g. a new endpoint + the component that calls it), so the API contract doesn't drift.
5. **Never commit or push code on your own** — make the changes and leave committing/pushing to the programmer.

## Open items to fill in as the project solidifies

- [ ] Confirm auth approach (Devise+JWT vs custom) and document token refresh flow
- [ ] Confirm payment gateway and webhook handling approach
- [ ] Confirm whether venues use reserved seating, GA-only, or both (affects Seat model necessity)
- [ ] Document deployment target (Heroku/Render/Fly/AWS) and CI setup once decided
- [ ] Add real directory tree once repo exists, replacing the "expected" layout above
