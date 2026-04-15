-- AI Chat daily rate limiting
--
-- Pro plan: 50 messages/day, Agency plan: 200 messages/day. We track usage in
-- ai_chat_usage with one row per (user, day) and bump message_count atomically.
-- The edge function checks the count before serving a response and short-
-- circuits with HTTP 429 once the user is over their plan's daily cap.
--
-- The table is internal — only the service role (used by the edge function)
-- writes to it. RLS lets users SELECT their own row so the dashboard can show
-- a "X / 50 messages used today" indicator.

create table if not exists public.ai_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists ai_chat_usage_user_date_idx
  on public.ai_chat_usage (user_id, usage_date desc);

alter table public.ai_chat_usage enable row level security;

-- Users can read their own row to render usage in the UI; writes are service-
-- role only (bypass RLS), so no insert/update/delete policies are exposed.
drop policy if exists "ai_chat_usage select own" on public.ai_chat_usage;
create policy "ai_chat_usage select own"
  on public.ai_chat_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Atomic increment helper. Uses an upsert so concurrent requests can't race
-- past the cap: each call returns the post-increment count, which the edge
-- function compares against the plan's daily limit. If the cap is already
-- reached, the function returns the current count without incrementing.
create or replace function public.increment_ai_chat_usage(
  p_user_id uuid,
  p_limit integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Ensure today's row exists.
  insert into public.ai_chat_usage (user_id, usage_date, message_count)
  values (p_user_id, current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  -- Conditionally increment: only bump if we are still under the cap. The
  -- RETURNING clause hands us the post-increment count in the same statement,
  -- so two concurrent requests can never both squeeze past the limit.
  update public.ai_chat_usage
  set message_count = message_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and usage_date = current_date
    and message_count < p_limit
  returning message_count into v_count;

  if v_count is null then
    -- Already at the cap; return the current count untouched.
    select message_count into v_count
    from public.ai_chat_usage
    where user_id = p_user_id and usage_date = current_date;
  end if;

  return v_count;
end;
$$;

revoke all on function public.increment_ai_chat_usage(uuid, integer) from public;
grant execute on function public.increment_ai_chat_usage(uuid, integer) to service_role;

comment on table public.ai_chat_usage is
  'Per-day AI chat message counts. The ai-chat edge function calls increment_ai_chat_usage() and rejects requests that would exceed the plan cap.';
