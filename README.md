# Devon Collection

E-commerce site for **Devon Collection** — luxury abayas from the UAE. *Luxury in Each Detail.*

- **Storefront**: home, shop and collections, product pages with lengths (52–60) and reviews, bag, checkout (cash or card on delivery), order tracking, customer accounts, size guide, WhatsApp home-service booking.
- **Admin** (`/admin`): dashboard with revenue, products (images, variants, stock), categories, inventory, orders (status, tracking, packing slip), reviews, discount coupons, and a store open/closed switch.

Stack: Next.js 16 (App Router) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vercel.

## Brand

| Token | Value |
| --- | --- |
| Ink | `#111010` |
| Ivory | `#faf7f4` |
| Fuchsia (ribbon) | `#de097f` |
| Headings | Playfair Display (closest open match to the wordmark) |
| UI / body | Montserrat |

The wordmark in `public/brand/` is cut from the original logo artwork. Photos are from [@devon_collection](https://www.instagram.com/devon_collection/) — see `public/images/CREDITS.md`.

## Run locally

Requirements: Node 22+, pnpm, Docker (for local Supabase).

```bash
pnpm install
supabase start                 # local Postgres/Auth/Storage on ports 5532x; applies migrations + seed
cp .env.example .env.local     # API URL + publishable key from `supabase status`
pnpm dev -p 3100
```

### Make yourself an admin

Sign up at `/account/login`, then in SQL:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Database

Schema, row-level security and storage policies live in `supabase/migrations/`; the starter catalogue (3 collections,
7 abayas, coupons `WELCOME10` and `EID100`) is in `supabase/seed.sql`. Prices, stock checks and coupons are all
validated server-side inside the `place_order` function.

For a hosted project:

```bash
supabase link --project-ref <ref>
supabase db push
psql "$DB_URL" -f supabase/seed.sql   # optional starter data
```

## Deploy

Vercel: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`, then deploy.
