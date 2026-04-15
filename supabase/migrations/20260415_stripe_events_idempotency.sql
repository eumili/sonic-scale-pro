-- Stripe webhook idempotency
--
-- Stripe retries failed webhook deliveries. Without idempotency, a single
-- checkout.session.completed could be processed multiple times, double-
-- upgrading users or sending duplicate emails. This table records every
-- event id we have already processed; the webhook handler does an
-- INSERT ... ON CONFLICT DO NOTHING and returns 200 immediately if the
-- row already exists.
--
-- The table is internal — only the service role (used by the edge function)
-- ever reads or writes it, so we lock it down with restrictive RLS.

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create index if not exists stripe_events_received_at_idx
  on public.stripe_events (received_at desc);

alter table public.stripe_events enable row level security;

-- No client should ever read or write this table directly. The edge
-- function uses the service role key, which bypasses RLS, so we deny
-- everything to authenticated and anon roles.
drop policy if exists "stripe_events deny all" on public.stripe_events;
create policy "stripe_events deny all"
  on public.stripe_events
  for all
  to authenticated, anon
  using (false)
  with check (false);

comment on table public.stripe_events is
  'Idempotency log for Stripe webhook events. The webhook handler inserts each event.id before processing; duplicate deliveries are short-circuited.';
