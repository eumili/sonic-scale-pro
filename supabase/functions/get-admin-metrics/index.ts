import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    // Verify caller via anon client (uses caller's JWT)
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Service-role client for privileged reads
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify admin role serverside
    const { data: roles, error: roleErr } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);

    if (roleErr) {
      console.error("role check error", roleErr);
      return json({ error: "Role check failed" }, 500);
    }
    if (!roles || roles.length === 0) {
      return json({ error: "Forbidden" }, 403);
    }

    // Compute metrics directly from source tables (admin_metrics is a snapshot table; we fetch live)
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const [
      profilesRes,
      usersListRes,
      newUsersRes,
      churnedUsersRes,
      aiUsageRes,
      latestSnapshot,
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("plan, plan_status", { count: "exact" }),
      adminClient
        .from("profiles")
        .select("id, artist_name, genre, plan, plan_status, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan_status", "canceled"),
      adminClient
        .from("ai_conversations")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today),
      adminClient
        .from("admin_metrics")
        .select("*")
        .order("metric_date", { ascending: false })
        .limit(1),
    ]);

    const profiles = profilesRes.data ?? [];
    const totalUsers = profiles.length;
    const activeProfiles = profiles.filter((p) => p.plan_status === "active");
    const proUsers = activeProfiles.filter((p) => p.plan === "pro").length;
    const agencyUsers = activeProfiles.filter((p) => p.plan === "agency").length;
    const freeUsers = profiles.filter((p) => (p.plan ?? "free") === "free").length;

    // Pricing (EUR / month) — keep in sync with src/lib/pricing
    const PRO_MONTHLY = 19;
    const AGENCY_MONTHLY = 49;
    const mrr = proUsers * PRO_MONTHLY + agencyUsers * AGENCY_MONTHLY;
    const arr = mrr * 12;

    return json({
      computed_at: new Date().toISOString(),
      live: {
        total_users: totalUsers,
        free_users: freeUsers,
        pro_users: proUsers,
        agency_users: agencyUsers,
        new_users_7d: newUsersRes.count ?? 0,
        churned_users: churnedUsersRes.count ?? 0,
        ai_conversations_today: aiUsageRes.count ?? 0,
        mrr_eur: mrr,
        arr_eur: arr,
      },
      users: usersListRes.data ?? [],
      latest_snapshot: latestSnapshot.data?.[0] ?? null,
    });
  } catch (err) {
    console.error("get-admin-metrics error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
