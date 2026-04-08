import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const _corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: _corsHeaders });
  }

  try {
    // Use service role for cron/n8n calls
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify service role auth (n8n sends service_role key or a shared secret)
    const authHeader = req.headers.get("Authorization") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!authHeader.includes(serviceKey)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: _corsHeaders });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0];

    // 1. Users inactive for 7+ days
    const { data: inactiveUsers } = await supabase
      .from("profiles")
      .select("id, artist_name")
      .lt("last_sign_in_at", sevenDaysAgo);

    // 2. Users with health score drop > 15 in last 14 days
    const { data: scores } = await supabase
      .from("artist_health_scores")
      .select("user_id, total_score, score_date")
      .gte("score_date", fourteenDaysAgo)
      .order("score_date", { ascending: true });

    // Group scores by user and detect drops
    const scoresByUser: Record<string, { earliest: number; latest: number }> = {};
    for (const s of scores || []) {
      if (!scoresByUser[s.user_id]) {
        scoresByUser[s.user_id] = { earliest: s.total_score, latest: s.total_score };
      } else {
        scoresByUser[s.user_id].latest = s.total_score;
      }
    }

    const scoreDrop = Object.entries(scoresByUser)
      .filter(([_, v]) => v.earliest - v.latest > 15)
      .map(([uid, v]) => ({ user_id: uid, drop: v.earliest - v.latest }));

    // Combine unique user IDs
    const churnUsers = new Map<string, { user_name: string; days_inactive: number; score_drop: number }>();

    for (const u of inactiveUsers || []) {
      const daysInactive = Math.floor((now.getTime() - new Date(sevenDaysAgo).getTime()) / 86400000);
      churnUsers.set(u.id, {
        user_name: u.artist_name || "Artist",
        days_inactive: daysInactive,
        score_drop: 0,
      });
    }

    for (const sd of scoreDrop) {
      if (churnUsers.has(sd.user_id)) {
        churnUsers.get(sd.user_id)!.score_drop = sd.drop;
      } else {
        churnUsers.set(sd.user_id, {
          user_name: "Artist",
          days_inactive: 0,
          score_drop: sd.drop,
        });
      }
    }

    // Insert into email_queue
    const inserts = Array.from(churnUsers.entries()).map(([userId, data]) => ({
      user_id: userId,
      email_type: "churn_warning",
      template_data: data,
      scheduled_for: now.toISOString(),
      status: "pending",
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("email_queue").insert(inserts);
      if (error) {
        console.error("Insert error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: _corsHeaders });
      }
    }

    return new Response(JSON.stringify({ count: inserts.length }), {
      headers: { ..._corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: _corsHeaders });
  }
});
