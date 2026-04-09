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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: _corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: _corsHeaders });
    }

    // Check subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("artist_name, plan")
      .eq("id", user.id)
      .single();

    const tier = profile?.plan || "free";
    if (!["pro", "agency"].includes(tier)) {
      return new Response(JSON.stringify({ error: "upgrade_required" }), { status: 402, headers: _corsHeaders });
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: _corsHeaders });
    }

    // Load context: last 14 days metrics + latest health score
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];

    const [metricsRes, healthRes] = await Promise.all([
      supabase
        .from("metrics_daily")
        .select("platform, metric_date, followers_total, new_followers_today, engagement_rate, reach, posts_count")
        .eq("user_id", user.id)
        .gte("metric_date", fourteenDaysAgo)
        .order("metric_date", { ascending: false })
        .limit(100),
      supabase
        .from("artist_health_scores")
        .select("total_score, consistency, growth, engagement, reach, momentum, score_date")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(1),
    ]);

    const metrics = metricsRes.data || [];
    const health = healthRes.data?.[0] || null;
    const artistName = profile?.artist_name || "Artist";

    const systemPrompt = `Ești un consultant muzical AI pentru ${artistName} pe platforma ArtistPulse.
Răspunzi DOAR în limba română.
Ai acces la datele artistului din ultimele 14 zile.

Health Score curent: ${health ? `${health.total_score}/100 (Consistență: ${health.consistency}, Creștere: ${health.growth}, Engagement: ${health.engagement}, Reach: ${health.reach}, Momentum: ${health.momentum})` : "Nedisponibil"}

Metrici recente (JSON):
${JSON.stringify(metrics.slice(0, 30))}

Oferă sfaturi concrete, acționabile, bazate pe date. Fii concis dar util. Dacă observi tendințe (creștere/scădere), menționează-le explicit.`;

    // Call Anthropic
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: _corsHeaders });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic error:", anthropicRes.status, errBody);
      return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502, headers: _corsHeaders });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "";
    const usage = data.usage || {};

    return new Response(JSON.stringify({ text, usage }), {
      headers: { ..._corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: _corsHeaders });
  }
});
