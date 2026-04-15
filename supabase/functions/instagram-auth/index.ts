import { createClient } from "npm:@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FacebookTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: {
    message?: string;
  };
};

type AccountsResponse = {
  data?: Array<{
    instagram_business_account?: {
      id?: string;
      username?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { code, redirect_uri, user_id } = await req.json();

    if (!code || !redirect_uri || !user_id) {
      return jsonResponse(
        { error: "Missing required fields: code, redirect_uri, user_id" },
        400,
      );
    }

    const appId = Deno.env.get("FACEBOOK_APP_ID");
    const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    // Symmetric key used by upsert_encrypted_oauth_token() to pgp_sym_encrypt
    // the Facebook long-lived token before it ever hits disk. Set in
    // Supabase Edge Function Secrets — never commit it to source.
    const encryptionKey = Deno.env.get("INSTAGRAM_TOKEN_ENCRYPTION_KEY");

    if (!appId || !appSecret || !supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: "Missing required environment configuration" }, 500);
    }
    if (!encryptionKey || encryptionKey.length < 16) {
      // We refuse to proceed without a key — the alternative is silently
      // falling back to plaintext storage, which is exactly what this
      // hardening was meant to prevent.
      console.error("INSTAGRAM_TOKEN_ENCRYPTION_KEY is missing or too short");
      return jsonResponse({ error: "Token encryption is not configured" }, 500);
    }

    const shortTokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    shortTokenUrl.searchParams.set("client_id", appId);
    shortTokenUrl.searchParams.set("client_secret", appSecret);
    shortTokenUrl.searchParams.set("redirect_uri", redirect_uri);
    shortTokenUrl.searchParams.set("code", code);

    const shortTokenRes = await fetch(shortTokenUrl.toString());
    const shortTokenData = (await shortTokenRes.json()) as FacebookTokenResponse;

    if (!shortTokenRes.ok || shortTokenData.error || !shortTokenData.access_token) {
      return jsonResponse(
        { error: shortTokenData.error?.message || "Failed to exchange code" },
        400,
      );
    }

    const longTokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", appId);
    longTokenUrl.searchParams.set("client_secret", appSecret);
    longTokenUrl.searchParams.set("fb_exchange_token", shortTokenData.access_token);

    const longTokenRes = await fetch(longTokenUrl.toString());
    const longTokenData = (await longTokenRes.json()) as FacebookTokenResponse;

    if (!longTokenRes.ok || longTokenData.error || !longTokenData.access_token) {
      return jsonResponse(
        { error: longTokenData.error?.message || "Failed to exchange long-lived token" },
        400,
      );
    }

    const longLivedToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in ?? 60 * 24 * 60 * 60;
    const oauthExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const accountsUrl = new URL("https://graph.facebook.com/v21.0/me/accounts");
    accountsUrl.searchParams.set(
      "fields",
      "id,name,instagram_business_account{id,username}",
    );
    accountsUrl.searchParams.set("access_token", longLivedToken);

    const accountsRes = await fetch(accountsUrl.toString());
    const accountsData = (await accountsRes.json()) as AccountsResponse;

    if (!accountsRes.ok || accountsData.error) {
      return jsonResponse(
        { error: accountsData.error?.message || "Failed to fetch Instagram Business Account" },
        400,
      );
    }

    const instagramAccount = accountsData.data?.find(
      (page) => page.instagram_business_account?.id,
    )?.instagram_business_account;

    if (!instagramAccount?.id) {
      return jsonResponse(
        { error: "No Instagram Business Account found for this Facebook user" },
        400,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Encrypt-on-write via the SECURITY DEFINER RPC. The plaintext token
    // is passed inside the parameter value (over TLS to Postgres) and is
    // immediately wrapped in pgp_sym_encrypt(), so the cleartext never
    // touches a column or a server log. The legacy oauth_access_token
    // column is null'd out by the RPC on every upsert.
    const { error: rpcError } = await supabase.rpc("upsert_encrypted_oauth_token", {
      p_user_id: user_id,
      p_platform: "instagram",
      p_platform_id: instagramAccount.id,
      p_platform_username: instagramAccount.username ?? null,
      p_access_token: longLivedToken,
      p_expires_at: oauthExpiresAt,
      p_encryption_key: encryptionKey,
    });

    if (rpcError) {
      console.error("Failed to save encrypted Instagram connection", rpcError);
      return jsonResponse({ error: "Failed to save platform connection" }, 500);
    }

    return jsonResponse({
      success: true,
      username: instagramAccount.username ?? "",
      platform_id: instagramAccount.id,
      oauth_expires_at: oauthExpiresAt,
    });
  } catch (error) {
    console.error("Instagram auth boot/runtime error", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
