import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface Recommendation {
  user_id: string;
  platform: string;
  category: string;
  priority: string;
  recommendation: string;
  reasoning: string;
}

function analyzeMetrics(
  latest: Record<string, any>,
  previous: Record<string, any>,
  healthScore: any | null
): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const [platform, data] of Object.entries(latest)) {
    const prev = previous[platform];

    // ── Spotify ──
    if (platform === "spotify") {
      if (data.followers > 0 && (data.posts_count || 0) === 0) {
        recs.push({
          user_id: data.user_id,
          platform: "spotify",
          category: "content",
          priority: "high",
          recommendation: "Lanseaza continut nou pe Spotify",
          reasoning: `Ai ${data.followers.toLocaleString()} followeri dar nicio lansare recenta. Un single nou poate reactiva audienta si creste monthly listeners.`,
        });
      }
      if (parseFloat(data.engagement_rate) < 2) {
        recs.push({
          user_id: data.user_id,
          platform: "spotify",
          category: "engagement",
          priority: "medium",
          recommendation: "Creste prezenta in playlist-uri Spotify",
          reasoning: "Engagement rate-ul tau Spotify este sub medie. Pitcheaza piese la curatii de playlist-uri si promoveaza pe social media.",
        });
      }
      if (prev && data.followers < prev.followers) {
        recs.push({
          user_id: data.user_id,
          platform: "spotify",
          category: "growth",
          priority: "high",
          recommendation: "Atentie: pierzi followeri pe Spotify",
          reasoning: `Ai pierdut ${prev.followers - data.followers} followeri fata de ieri. Verifica daca ai continut suficient de nou si promoveaza-ti profilul activ.`,
        });
      }
    }

    // ── YouTube ──
    if (platform === "youtube") {
      if (data.videos_count > 0 && data.total_views > 0) {
        const avgViews = data.total_views / data.videos_count;
        if (avgViews < (data.followers || data.subscribers || 1) * 0.1) {
          recs.push({
            user_id: data.user_id,
            platform: "youtube",
            category: "growth",
            priority: "medium",
            recommendation: "Optimizeaza thumbnail-urile si titlurile pe YouTube",
            reasoning: `Media de views per video (${Math.round(avgViews).toLocaleString()}) e sub 10% din subscriberi. Titluri SEO-friendly si thumbnail-uri atractive cresc CTR-ul semnificativ.`,
          });
        }
      }
      if (prev && data.total_views > prev.total_views) {
        const viewGrowth = data.total_views - prev.total_views;
        if (viewGrowth > 1000) {
          recs.push({
            user_id: data.user_id,
            platform: "youtube",
            category: "growth",
            priority: "low",
            recommendation: "Continua ritmul! Views-urile cresc pe YouTube",
            reasoning: `Ai castigat ${viewGrowth.toLocaleString()} views in ultima zi. Profita de momentum si posteaza continut nou cat publicul este activ.`,
          });
        }
      }
      if (data.subscribers > 0 && data.videos_count === 0) {
        recs.push({
          user_id: data.user_id,
          platform: "youtube",
          category: "content",
          priority: "high",
          recommendation: "Incepe sa postezi video-uri pe YouTube",
          reasoning: `Ai ${(data.subscribers || data.followers || 0).toLocaleString()} subscriberi dar niciun video recent. Canalul tau pierde relevanta fara continut nou.`,
        });
      }
    }

    // ── Instagram ──
    if (platform === "instagram") {
      if (data.followers > 0) {
        recs.push({
          user_id: data.user_id,
          platform: "instagram",
          category: "content",
          priority: "medium",
          recommendation: "Posteaza Reels constant pe Instagram (3-5/saptamana)",
          reasoning: "Algoritmul Instagram favorizeaza Reels. Postarea constanta creste reach-ul organic si atrage followeri noi din Explore.",
        });
      }
      if (prev && data.followers > prev.followers && (data.followers - prev.followers) > 50) {
        recs.push({
          user_id: data.user_id,
          platform: "instagram",
          category: "growth",
          priority: "low",
          recommendation: "Momentum bun pe Instagram! Capitalizeaza",
          reasoning: `+${data.followers - prev.followers} followeri ieri. Posteaza Stories si interactioneaza cu noii followeri cat sunt activi.`,
        });
      }
    }

    // ── TikTok ──
    if (platform === "tiktok") {
      if (data.followers > 0) {
        recs.push({
          user_id: data.user_id,
          platform: "tiktok",
          category: "content",
          priority: "medium",
          recommendation: "Foloseste trenduri audio pe TikTok",
          reasoning: "Trendurile audio au reach organic imens. Combina muzica ta cu formate virale — behind-the-scenes, povesti, transitions.",
        });
      }
    }

    // ── Cross-platform: follower decline ──
    if (prev && data.followers < prev.followers && (prev.followers - data.followers) > 10) {
      // Already handled per platform above for Spotify, skip duplicate
      if (platform !== "spotify") {
        recs.push({
          user_id: data.user_id,
          platform,
          category: "growth",
          priority: "high",
          recommendation: `Scadere de followeri pe ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          reasoning: `Ai pierdut ${prev.followers - data.followers} followeri ieri. Verifica activitatea recenta si calitatea continutului.`,
        });
      }
    }
  }

  // ── Health Score based recommendations ──
  if (healthScore) {
    const breakdown = healthScore.score_breakdown || {};
    if (healthScore.overall_score < 40) {
      recs.push({
        user_id: healthScore.user_id,
        platform: "general",
        category: "strategy",
        priority: "high",
        recommendation: "Scorul tau de sanatate este critic — actioneaza acum",
        reasoning: `Scor: ${healthScore.overall_score}/100. Focus pe postare zilnica pe cel putin 2 platforme si interactiune cu audienta.`,
      });
    } else if (healthScore.overall_score < 60) {
      recs.push({
        user_id: healthScore.user_id,
        platform: "general",
        category: "strategy",
        priority: "medium",
        recommendation: "Creste consistenta pentru un scor mai bun",
        reasoning: `Scor: ${healthScore.overall_score}/100. Consistenta in postare si engagement sunt cheile cresterii.`,
      });
    }

    if (breakdown.engagement_score != null && breakdown.engagement_score < 30) {
      recs.push({
        user_id: healthScore.user_id,
        platform: "general",
        category: "engagement",
        priority: "high",
        recommendation: "Engagement-ul tau este foarte scazut",
        reasoning: "Raspunde la comentarii, fa live sessions, si pune intrebari in captions pentru a stimula interactiunea.",
      });
    }

    if (breakdown.growth_score != null && breakdown.growth_score < 30) {
      recs.push({
        user_id: healthScore.user_id,
        platform: "general",
        category: "growth",
        priority: "high",
        recommendation: "Cresterea audientei stagneaza",
        reasoning: "Incearca colaborari cu alti artisti, guest features, si cross-promotion intre platforme.",
      });
    }
  }

  // ── Platform coverage ──
  const platformCount = Object.keys(latest).length;
  if (platformCount < 3 && Object.values(latest).length > 0) {
    const userId = Object.values(latest)[0]?.user_id;
    if (userId) {
      recs.push({
        user_id: userId,
        platform: "general",
        category: "strategy",
        priority: "medium",
        recommendation: "Conecteaza mai multe platforme",
        reasoning: `Ai date doar de pe ${platformCount} platforma(e). Mai multe surse = recomandari mai precise si scor mai complet.`,
      });
    }
  }

  return recs;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Get all users who have active platforms
    const { data: users, error: usersError } = await supabase
      .from("artist_platforms")
      .select("user_id")
      .eq("is_active", true);

    if (usersError) throw usersError;

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set((users || []).map((u) => u.user_id))];
    console.log(`Generating recommendations for ${uniqueUserIds.length} users`);

    let totalRecs = 0;

    for (const userId of uniqueUserIds) {
      // Get latest metrics (today or yesterday)
      const { data: todayMetrics } = await supabase
        .from("metrics_daily")
        .select("*")
        .eq("user_id", userId)
        .eq("metric_date", today);

      const { data: yesterdayMetrics } = await supabase
        .from("metrics_daily")
        .select("*")
        .eq("user_id", userId)
        .eq("metric_date", yesterday);

      // Build latest and previous maps
      const latest: Record<string, any> = {};
      const previous: Record<string, any> = {};

      // Use today's data if available, otherwise yesterday's
      const metricsToUse = todayMetrics?.length ? todayMetrics : yesterdayMetrics || [];
      metricsToUse.forEach((m) => {
        latest[m.platform] = m;
      });

      // For previous, use the day before the latest
      if (todayMetrics?.length) {
        (yesterdayMetrics || []).forEach((m) => {
          previous[m.platform] = m;
        });
      } else {
        // If we used yesterday as latest, get day before yesterday
        const dayBeforeYesterday = new Date(Date.now() - 172800000).toISOString().split("T")[0];
        const { data: olderMetrics } = await supabase
          .from("metrics_daily")
          .select("*")
          .eq("user_id", userId)
          .eq("metric_date", dayBeforeYesterday);
        (olderMetrics || []).forEach((m) => {
          previous[m.platform] = m;
        });
      }

      // Get health score
      const { data: healthScores } = await supabase
        .from("artist_health_scores")
        .select("*")
        .eq("user_id", userId)
        .order("score_date", { ascending: false })
        .limit(1);

      const healthScore = healthScores?.[0] || null;

      // Generate recommendations
      const recs = analyzeMetrics(latest, previous, healthScore);

      if (recs.length === 0) continue;

      // Delete old recommendations for this user (keep last 3 days)
      const threeDaysAgo = new Date(Date.now() - 259200000).toISOString();
      await supabase
        .from("daily_recommendations")
        .delete()
        .eq("user_id", userId)
        .lt("created_at", threeDaysAgo);

      // Insert new recommendations
      const rows = recs.map((r) => ({
        user_id: userId,
        platform: r.platform,
        category: r.category,
        priority: r.priority,
        recommendation: r.recommendation,
        reasoning: r.reasoning,
      }));

      const { error: insertError } = await supabase
        .from("daily_recommendations")
        .insert(rows);

      if (insertError) {
        console.error(`Error inserting recs for user ${userId}:`, insertError.message);
      } else {
        totalRecs += rows.length;
        console.log(`Generated ${rows.length} recommendations for user ${userId}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, users: uniqueUserIds.length, recommendations: totalRecs, date: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("generate-daily-recommendations error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
