import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── YouTube ───────────────────────────────────────────────
async function collectYouTube(platformUrl: string) {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) { console.error("No YOUTUBE_API_KEY"); return null; }

  // Extract handle or channel ID from URL
  let channelId = "";
  const handleMatch = platformUrl.match(/@([\w.-]+)/);
  const channelIdMatch = platformUrl.match(/channel\/(UC[\w-]+)/);

  if (handleMatch) {
    const handle = handleMatch[1];
    console.log("YouTube: Trying to resolve handle:", handle, "from URL:", platformUrl);

    // Try forHandle first
    let searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${apiKey}`
    );
    let searchData = await searchRes.json();
    console.log("YouTube forHandle response status:", searchRes.status, "items:", searchData.items?.length || 0);
    if (searchData.error) {
      console.error("YouTube API error:", JSON.stringify(searchData.error));
    }

    // If forHandle returns items with statistics, return directly
    if (searchData.items?.length > 0 && searchData.items[0].statistics) {
      const ch = searchData.items[0];
      const stats = ch.statistics;
      console.log("YouTube forHandle SUCCESS:", stats.subscriberCount, "subscribers");
      return {
        followers: parseInt(stats.subscriberCount) || 0,
        subscribers: parseInt(stats.subscriberCount) || 0,
        total_views: parseInt(stats.viewCount) || 0,
        videos_count: parseInt(stats.videoCount) || 0,
        engagement_rate: 0,
        raw_data: { channel: ch },
      };
    }

    // Fallback: try search endpoint
    console.log("forHandle returned no items, trying search endpoint for:", handle);
    searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${apiKey}`
    );
    searchData = await searchRes.json();
    console.log("YouTube search response status:", searchRes.status, "items:", searchData.items?.length || 0);
    if (searchData.error) {
      console.error("YouTube search API error:", JSON.stringify(searchData.error));
    }

    if (searchData.items?.length > 0) {
      channelId = searchData.items[0].snippet?.channelId || searchData.items[0].id?.channelId;
      console.log("YouTube search found channelId:", channelId);
      if (channelId) {
        // Now fetch full channel stats
        const chRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails,snippet&id=${channelId}&key=${apiKey}`
        );
        const chData = await chRes.json();
        if (chData.items?.length > 0) {
          const ch = chData.items[0];
          const stats = ch.statistics;
          console.log("YouTube channel stats SUCCESS:", stats.subscriberCount, "subscribers");
          return {
            followers: parseInt(stats.subscriberCount) || 0,
            subscribers: parseInt(stats.subscriberCount) || 0,
            total_views: parseInt(stats.viewCount) || 0,
            videos_count: parseInt(stats.videoCount) || 0,
            engagement_rate: 0,
            raw_data: { channel: ch },
          };
        }
      }
    }

    // Last fallback: try forUsername (some older channels)
    console.log("Search also failed, trying forUsername for:", handle);
    const usernameRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forUsername=${handle}&key=${apiKey}`
    );
    const usernameData = await usernameRes.json();
    if (usernameData.items?.length > 0) {
      const ch = usernameData.items[0];
      const stats = ch.statistics;
      console.log("YouTube forUsername SUCCESS:", stats.subscriberCount, "subscribers");
      return {
        followers: parseInt(stats.subscriberCount) || 0,
        subscribers: parseInt(stats.subscriberCount) || 0,
        total_views: parseInt(stats.viewCount) || 0,
        videos_count: parseInt(stats.videoCount) || 0,
        engagement_rate: 0,
        raw_data: { channel: ch },
      };
    }
  } else if (channelIdMatch) {
    channelId = channelIdMatch[1];
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.items?.length > 0) {
      const stats = data.items[0].statistics;
      return {
        followers: parseInt(stats.subscriberCount) || 0,
        subscribers: parseInt(stats.subscriberCount) || 0,
        total_views: parseInt(stats.viewCount) || 0,
        videos_count: parseInt(stats.videoCount) || 0,
        engagement_rate: 0,
        raw_data: { channel: data.items[0] },
      };
    }
  }

  console.error("Could not resolve YouTube channel from URL:", platformUrl);
  return null;
}

// ─── Spotify ───────────────────────────────────────────────
async function collectSpotify(platformUrl: string) {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) { console.error("No Spotify credentials"); return null; }

  // Extract artist ID from URL
  const artistIdMatch = platformUrl.match(/artist\/(\w+)/);
  if (!artistIdMatch) { console.error("Cannot extract Spotify artist ID from:", platformUrl); return null; }
  const artistId = artistIdMatch[1];

  // Get access token via client credentials
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: "grant_type=client_credentials",
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) { console.error("Spotify token error:", tokenData); return null; }

  // Get artist data
  const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const artist = await artistRes.json();

  if (artist.error) { console.error("Spotify artist error:", artist.error); return null; }

  // Get top tracks for engagement estimate
  const topTracksRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const topTracks = await topTracksRes.json();

  // Get albums count
  const albumsRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const albums = await albumsRes.json();

  const totalPopularity = topTracks.tracks?.reduce((s: number, t: any) => s + (t.popularity || 0), 0) || 0;
  const avgPopularity = topTracks.tracks?.length ? totalPopularity / topTracks.tracks.length : 0;

  return {
    followers: artist.followers?.total || 0,
    monthly_listeners: 0, // Not available via public API
    total_plays: 0,
    posts_count: albums?.total || albums?.items?.length || 0,
    engagement_rate: parseFloat((avgPopularity / 10).toFixed(2)), // Normalize popularity to ~0-10 range
    playlist_count: 0,
    raw_data: {
      artist: { name: artist.name, popularity: artist.popularity, genres: artist.genres },
      top_tracks: topTracks.tracks?.slice(0, 5).map((t: any) => ({ name: t.name, popularity: t.popularity })),
      albums_count: albums?.total || 0,
    },
  };
}

// ─── Instagram (public scraping - basic) ───────────────────
async function collectInstagram(platformUrl: string) {
  // Instagram Graph API requires user token (OAuth), so we'll use a basic approach
  // For now return null - Instagram requires business account + Meta Graph API token
  console.log("Instagram collection requires OAuth - skipping for now:", platformUrl);
  return null;
}

// ─── TikTok (public API limited) ────────────────────────────
async function collectTikTok(platformUrl: string) {
  // TikTok Research API requires approved access
  console.log("TikTok collection requires approved API access - skipping for now:", platformUrl);
  return null;
}

// ─── Main handler ──────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Get all users with active platforms
    const { data: platforms, error: platError } = await supabase
      .from("artist_platforms")
      .select("id, user_id, platform, platform_url, is_active")
      .eq("is_active", true);

    if (platError) throw platError;
    if (!platforms || platforms.length === 0) {
      return new Response(JSON.stringify({ message: "No active platforms found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const results: any[] = [];

    for (const plat of platforms) {
      let metrics: any = null;

      switch (plat.platform) {
        case "youtube":
          metrics = await collectYouTube(plat.platform_url);
          break;
        case "spotify":
          metrics = await collectSpotify(plat.platform_url);
          break;
        case "instagram":
          metrics = await collectInstagram(plat.platform_url);
          break;
        case "tiktok":
          metrics = await collectTikTok(plat.platform_url);
          break;
        default:
          console.log(`No collector for platform: ${plat.platform}`);
      }

      if (metrics) {
        // Check if we already have a record for today
        const { data: existing } = await supabase
          .from("metrics_daily")
          .select("id, followers")
          .eq("user_id", plat.user_id)
          .eq("platform", plat.platform)
          .eq("metric_date", today)
          .single();

        // GUARD: Don't overwrite good data with zeros (API rate limit / error)
        if (existing && existing.followers > 0 && (metrics.followers || 0) === 0) {
          console.log(`Skipping update for ${plat.platform}: new followers=0 but existing=${existing.followers} (likely API error)`);
          results.push({
            platform: plat.platform,
            success: true,
            followers: existing.followers,
            error: "Skipped update: API returned 0 followers, keeping existing data",
          });
          continue;
        }

        // Get yesterday's data for delta calculation
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const { data: yesterdayData } = await supabase
          .from("metrics_daily")
          .select("followers")
          .eq("user_id", plat.user_id)
          .eq("platform", plat.platform)
          .eq("metric_date", yesterday)
          .single();

        const newFollowersToday = yesterdayData
          ? (metrics.followers || 0) - (yesterdayData.followers || 0)
          : 0;

        const row = {
          user_id: plat.user_id,
          platform: plat.platform,
          metric_date: today,
          followers: metrics.followers || 0,
          subscribers: metrics.subscribers || 0,
          monthly_listeners: metrics.monthly_listeners || 0,
          total_plays: metrics.total_plays || 0,
          total_views: metrics.total_views || 0,
          likes: metrics.likes || 0,
          posts_count: metrics.posts_count || 0,
          videos_count: metrics.videos_count || 0,
          engagement_rate: metrics.engagement_rate || 0,
          avg_views_per_video: metrics.avg_views_per_video || 0,
          playlist_count: metrics.playlist_count || 0,
          new_followers_today: newFollowersToday,
          new_plays_today: metrics.new_plays_today || 0,
          days_since_last_post: metrics.days_since_last_post || 0,
          raw_data: metrics.raw_data || {},
        };

        let result;
        if (existing) {
          result = await supabase
            .from("metrics_daily")
            .update(row)
            .eq("id", existing.id);
        } else {
          result = await supabase
            .from("metrics_daily")
            .insert(row);
        }

        // Update last_collected_at on platform
        await supabase
          .from("artist_platforms")
          .update({ last_collected_at: new Date().toISOString() })
          .eq("id", plat.id);

        results.push({
          platform: plat.platform,
          success: !result.error,
          followers: metrics.followers,
          error: result.error?.message,
        });
      } else {
        results.push({
          platform: plat.platform,
          success: false,
          error: "No data collected (API not available or error)",
        });
      }
    }

    return new Response(JSON.stringify({ date: today, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("collect-metrics error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
