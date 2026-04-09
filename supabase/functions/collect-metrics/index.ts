import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ─── Helper: resolve YouTube channel ID from URL ──────────
async function resolveYouTubeChannelId(platformUrl: string, apiKey: string): Promise<{ channelId: string; channelData: any } | null> {
  const handleMatch = platformUrl.match(/@([\w.-]+)/);
  const channelIdMatch = platformUrl.match(/channel\/(UC[\w-]+)/);

  if (handleMatch) {
    const handle = handleMatch[1];
    console.log("YouTube: Trying to resolve handle:", handle);

    // Try forHandle first
    let res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${apiKey}`);
    let data = await res.json();
    if (data.items?.length > 0 && data.items[0].statistics) {
      return { channelId: data.items[0].id, channelData: data.items[0] };
    }

    // Fallback: search
    res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${apiKey}`);
    data = await res.json();
    if (data.items?.length > 0) {
      const cid = data.items[0].snippet?.channelId || data.items[0].id?.channelId;
      if (cid) {
        const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails,snippet&id=${cid}&key=${apiKey}`);
        const chData = await chRes.json();
        if (chData.items?.length > 0) return { channelId: cid, channelData: chData.items[0] };
      }
    }

    // Fallback: forUsername
    res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forUsername=${handle}&key=${apiKey}`);
    data = await res.json();
    if (data.items?.length > 0) return { channelId: data.items[0].id, channelData: data.items[0] };
  } else if (channelIdMatch) {
    const cid = channelIdMatch[1];
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails,snippet&id=${cid}&key=${apiKey}`);
    const data = await res.json();
    if (data.items?.length > 0) return { channelId: cid, channelData: data.items[0] };
  }

  return null;
}

// ─── YouTube: fetch individual video stats ────────────────
async function fetchYouTubeVideos(channelId: string, apiKey: string): Promise<any[]> {
  try {
    // Get latest 20 videos from the channel
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=20&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    if (!searchData.items?.length) return [];

    const videoIds = searchData.items.map((v: any) => v.id.videoId).join(",");
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
    );
    const statsData = await statsRes.json();

    return (statsData.items || []).map((v: any) => ({
      video_id: v.id,
      title: v.snippet?.title || "",
      published_at: v.snippet?.publishedAt || null,
      thumbnail_url: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || "",
      view_count: parseInt(v.statistics?.viewCount) || 0,
      like_count: parseInt(v.statistics?.likeCount) || 0,
      comment_count: parseInt(v.statistics?.commentCount) || 0,
    }));
  } catch (err) {
    console.error("fetchYouTubeVideos error:", err);
    return [];
  }
}

// ─── YouTube ───────────────────────────────────────────────
async function collectYouTube(platformUrl: string) {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) { console.error("No YOUTUBE_API_KEY"); return null; }

  const resolved = await resolveYouTubeChannelId(platformUrl, apiKey);
  if (!resolved) {
    console.error("Could not resolve YouTube channel from URL:", platformUrl);
    return null;
  }

  const { channelId, channelData } = resolved;
  const stats = channelData.statistics;
  console.log("YouTube SUCCESS:", stats.subscriberCount, "subscribers, channelId:", channelId);

  // Fetch individual video stats
  const videos = await fetchYouTubeVideos(channelId, apiKey);
  console.log("YouTube videos fetched:", videos.length);

  return {
    followers: parseInt(stats.subscriberCount) || 0,
    subscribers: parseInt(stats.subscriberCount) || 0,
    total_views: parseInt(stats.viewCount) || 0,
    videos_count: parseInt(stats.videoCount) || 0,
    engagement_rate: 0,
    raw_data: { channel: channelData },
    _videos: videos, // individual video data to store separately
  };
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

  // Build individual track data for storage
  const trackItems = (topTracks.tracks || []).map((t: any) => ({
    track_id: t.id,
    track_name: t.name,
    album_name: t.album?.name || "",
    album_image_url: t.album?.images?.[0]?.url || "",
    popularity: t.popularity || 0,
    duration_ms: t.duration_ms || 0,
  }));

  return {
    followers: artist.followers?.total || 0,
    monthly_listeners: 0, // Not available via public API
    total_plays: 0,
    posts_count: albums?.total || albums?.items?.length || 0,
    engagement_rate: parseFloat((avgPopularity / 10).toFixed(2)), // Normalize popularity to ~0-10 range
    playlist_count: 0,
    raw_data: {
      artist: { name: artist.name, popularity: artist.popularity, genres: artist.genres },
      top_tracks: topTracks.tracks?.slice(0, 10).map((t: any) => ({ name: t.name, popularity: t.popularity, id: t.id })),
      albums_count: albums?.total || 0,
    },
    _tracks: trackItems, // individual track data to store separately
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

        // ── Store individual content BEFORE the follower guard ──
        // YouTube videos
        if (plat.platform === "youtube" && metrics._videos?.length > 0) {
          for (const video of metrics._videos) {
            const { data: prevVideo } = await supabase
              .from("youtube_videos")
              .select("view_count")
              .eq("user_id", plat.user_id)
              .eq("video_id", video.video_id)
              .lt("collected_at", today)
              .order("collected_at", { ascending: false })
              .limit(1)
              .single();

            const prevViews = prevVideo?.view_count || 0;
            const growthPct = prevViews > 0 ? ((video.view_count - prevViews) / prevViews * 100) : 0;

            await supabase.from("youtube_videos").upsert({
              user_id: plat.user_id,
              video_id: video.video_id,
              title: video.title,
              published_at: video.published_at,
              thumbnail_url: video.thumbnail_url,
              view_count: video.view_count,
              like_count: video.like_count,
              comment_count: video.comment_count,
              view_count_prev: prevViews,
              growth_pct: parseFloat(growthPct.toFixed(2)),
              collected_at: today,
            }, { onConflict: "user_id,video_id,collected_at" });
          }
          console.log(`Stored ${metrics._videos.length} YouTube videos for user ${plat.user_id}`);
        }

        // Spotify tracks
        if (plat.platform === "spotify" && metrics._tracks?.length > 0) {
          for (const track of metrics._tracks) {
            const { data: prevTrack } = await supabase
              .from("spotify_tracks")
              .select("popularity")
              .eq("user_id", plat.user_id)
              .eq("track_id", track.track_id)
              .lt("collected_at", today)
              .order("collected_at", { ascending: false })
              .limit(1)
              .single();

            const prevPop = prevTrack?.popularity || 0;
            const growthPct = prevPop > 0 ? ((track.popularity - prevPop) / prevPop * 100) : 0;

            await supabase.from("spotify_tracks").upsert({
              user_id: plat.user_id,
              track_id: track.track_id,
              track_name: track.track_name,
              album_name: track.album_name,
              album_image_url: track.album_image_url,
              popularity: track.popularity,
              popularity_prev: prevPop,
              growth_pct: parseFloat(growthPct.toFixed(2)),
              duration_ms: track.duration_ms,
              collected_at: today,
            }, { onConflict: "user_id,track_id,collected_at" });
          }
          console.log(`Stored ${metrics._tracks.length} Spotify tracks for user ${plat.user_id}`);
        }

        // GUARD: Don't overwrite good data with zeros (API rate limit / error)
        if (existing && existing.followers > 0 && (metrics.followers || 0) === 0) {
          console.log(`Skipping metrics update for ${plat.platform}: new followers=0 but existing=${existing.followers} (likely API error)`);
          results.push({
            platform: plat.platform,
            success: true,
            followers: existing.followers,
            videos: metrics._videos?.length || 0,
            tracks: metrics._tracks?.length || 0,
            error: "Skipped metrics update: API returned 0 followers, keeping existing data (content still stored)",
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
          videos: metrics._videos?.length || 0,
          tracks: metrics._tracks?.length || 0,
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
