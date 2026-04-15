-- Encrypt OAuth tokens at rest with pgcrypto
--
-- Instagram (and future) OAuth access tokens were stored in
-- artist_platforms.oauth_access_token as plaintext. Anyone with a
-- read-only Postgres role or a copy of a backup could exfiltrate live
-- session tokens for every connected user. We now store them as a
-- pgp_sym_encrypt() bytea blob in oauth_access_token_encrypted.
--
-- The symmetric key never lives in the database. The instagram-auth
-- edge function reads it from the INSTAGRAM_TOKEN_ENCRYPTION_KEY env
-- var and passes it to upsert_encrypted_oauth_token() / read it back
-- via get_decrypted_oauth_token() — both SECURITY DEFINER, both
-- restricted to the service role. RLS already prevents end users from
-- selecting other users' rows; this migration adds defense in depth
-- against DB-level disclosure.

create extension if not exists pgcrypto;

-- 1. New ciphertext column. Keep the old plaintext column for one
--    deploy cycle so a botched rollout can't lock out connected users;
--    a follow-up migration will drop oauth_access_token once the
--    edge function has been writing the encrypted column for >24h.
alter table public.artist_platforms
  add column if not exists oauth_access_token_encrypted bytea;

comment on column public.artist_platforms.oauth_access_token_encrypted is
  'pgp_sym_encrypt() of the OAuth access token. Key is held by the edge function in INSTAGRAM_TOKEN_ENCRYPTION_KEY, never stored in the DB.';

-- 2. Atomic upsert that also encrypts the token in the same call.
--    The edge function exchanges the OAuth code, then calls this
--    function — the plaintext token is only ever in flight in the
--    function's memory and pgcrypto's encrypt path. It is never
--    written to disk in cleartext, never logged, never returned.
create or replace function public.upsert_encrypted_oauth_token(
  p_user_id uuid,
  p_platform text,
  p_platform_id text,
  p_platform_username text,
  p_access_token text,
  p_expires_at timestamptz,
  p_encryption_key text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if p_access_token is null or length(p_access_token) = 0 then
    raise exception 'access token is required';
  end if;
  if p_encryption_key is null or length(p_encryption_key) < 16 then
    raise exception 'encryption key is missing or too short';
  end if;

  insert into public.artist_platforms (
    user_id,
    platform,
    platform_id,
    platform_username,
    oauth_access_token_encrypted,
    oauth_expires_at,
    is_oauth_connected,
    is_active
  )
  values (
    p_user_id,
    p_platform,
    p_platform_id,
    p_platform_username,
    pgp_sym_encrypt(p_access_token, p_encryption_key),
    p_expires_at,
    true,
    true
  )
  on conflict (user_id, platform)
  do update set
    platform_id = excluded.platform_id,
    platform_username = excluded.platform_username,
    oauth_access_token_encrypted = excluded.oauth_access_token_encrypted,
    oauth_expires_at = excluded.oauth_expires_at,
    is_oauth_connected = true,
    is_active = true,
    -- Null out the legacy plaintext column on every write so we don't
    -- leave stale cleartext tokens lying around after re-connect.
    oauth_access_token = null;
end;
$$;

-- 3. Decrypt helper for the (future) Instagram metrics collector.
--    Returns NULL if the row is missing or the ciphertext can't be
--    decrypted with the provided key — never raises, so a bad key
--    rotation is observable as "no metrics" rather than a 500.
create or replace function public.get_decrypted_oauth_token(
  p_user_id uuid,
  p_platform text,
  p_encryption_key text
)
returns text
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_cipher bytea;
  v_plain text;
begin
  if p_encryption_key is null or length(p_encryption_key) < 16 then
    raise exception 'encryption key is missing or too short';
  end if;

  select oauth_access_token_encrypted into v_cipher
  from public.artist_platforms
  where user_id = p_user_id and platform = p_platform;

  if v_cipher is null then
    return null;
  end if;

  begin
    v_plain := pgp_sym_decrypt(v_cipher, p_encryption_key);
  exception when others then
    -- Wrong key, corrupted blob, etc. Don't leak the failure mode.
    return null;
  end;

  return v_plain;
end;
$$;

-- 4. Lock down both functions: only the service role (used by the
--    edge function) may call them. The encryption key is a secret —
--    we don't want random authenticated clients invoking these RPCs.
revoke all on function public.upsert_encrypted_oauth_token(uuid, text, text, text, text, timestamptz, text) from public;
revoke all on function public.get_decrypted_oauth_token(uuid, text, text) from public;
grant execute on function public.upsert_encrypted_oauth_token(uuid, text, text, text, text, timestamptz, text) to service_role;
grant execute on function public.get_decrypted_oauth_token(uuid, text, text) to service_role;
