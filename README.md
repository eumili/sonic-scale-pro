# ArtistPulse

Romanian-language dashboard for music artists analyzing YouTube / Spotify / Instagram.

## Subscription tiers

Source of truth: `public.profiles.plan` (values: `free`, `starter`, `pro`, `growth`, `agency`).
Always read it via the `usePlan` hook in `src/hooks/usePlan.ts` — do **not** reintroduce a
second column name (e.g. `subscription_tier`). The Stripe webhook in
`supabase/functions/stripe-webhook` writes to this column on payment / cancellation events.

### Promised on landing (getartistpulse.com) vs implementation status

| Feature | Tier | Status |
|---|---|---|
| Overall score + stars rating | Free | ✅ Implemented |
| Indicator status list (colored dots) | Free | ✅ Implemented |
| Daily automated audit (06:00) | Free | ✅ Implemented (cron) |
| 1 teaser recommendation, rest blurred | Free | ✅ Implemented (DashboardOverview + Recommendations page) |
| Exact values per indicator | Pro | ✅ Implemented |
| All detailed recommendations | Pro | ✅ Implemented |
| Unlimited audit history | Pro | ⚠️ **NOT IMPLEMENTED** — see TODO below |
| Multi-platform (Spotify + Instagram) | Pro | ✅ Gated in `Platforms.tsx` |
| Unlimited AI Chat | Pro | ✅ Gated in `AIChat.tsx` |
| PDF report export | Pro | ⚠️ **NOT IMPLEMENTED** — see TODO below |

### TODO — features promised on landing but not yet built

1. **Unlimited audit history (Pro)** — landing advertises this but the current code only
   ever fetches the latest `youtube_audit` row (`limit(1)`). Build a page that lists all
   historical audits with a date filter, accessible only to Pro users.
2. **PDF report export (Pro)** — landing advertises this but no export code exists. Likely
   implementation: new Supabase edge function that renders a PDF (e.g. via
   `deno.land/x/pdfkit` or a headless-browser render) and streams it to the user.

Until these ship, the landing copy in `src/components/landing/PricingTableSection.tsx`
should be aligned with reality (either remove these two line items or mark them "în
curând").
