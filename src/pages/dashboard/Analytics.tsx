import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Loader2, TrendingUp, TrendingDown, Users, Eye, BarChart3, Play, Music, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

type Period = '7d' | '30d' | '90d';
type ContentTab = 'overview' | 'youtube' | 'spotify';

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444', spotify: '#22C55E', instagram: '#EC4899', tiktok: '#A78BFA', apple_music: '#F472B6',
};

interface MetricRow {
  metric_date: string; platform: string; followers: number; new_followers_today: number;
  engagement_rate: number; total_views: number; posts_count: number; videos_count: number;
  subscribers: number; monthly_listeners: number; total_plays: number;
}

interface YouTubeVideo {
  video_id: string; title: string; published_at: string; thumbnail_url: string;
  view_count: number; like_count: number; comment_count: number;
  view_count_prev: number; growth_pct: number; collected_at: string;
}

interface SpotifyTrack {
  track_id: string; track_name: string; album_name: string; album_image_url: string;
  popularity: number; popularity_prev: number; growth_pct: number;
  duration_ms: number; collected_at: string;
}

function GrowthBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-400">
      <ArrowUp className="h-3 w-3" />{value.toFixed(1)}{suffix}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-400">
      <ArrowDown className="h-3 w-3" />{Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />0{suffix}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('7d');
  const [contentTab, setContentTab] = useState<ContentTab>('overview');
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [spTracks, setSpTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    });
  }, [user]);

  // Fetch aggregate metrics
  useEffect(() => {
    if (!user) return;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    setLoading(true);
    supabase.from('metrics_daily').select('*').eq('user_id', user.id)
      .gte('metric_date', since.toISOString().split('T')[0]).order('metric_date', { ascending: true })
      .then(({ data }) => { setMetrics(data || []); setLoading(false); });
  }, [user, period]);

  // Fetch YouTube videos (latest collected_at)
  useEffect(() => {
    if (!user) return;
    supabase.from('youtube_videos').select('*').eq('user_id', user.id)
      .order('collected_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Only keep the latest collection date
          const latestDate = data[0].collected_at;
          setYtVideos(data.filter((v: any) => v.collected_at === latestDate));
        } else {
          setYtVideos([]);
        }
      });
  }, [user]);

  // Fetch Spotify tracks (latest collected_at)
  useEffect(() => {
    if (!user) return;
    supabase.from('spotify_tracks').select('*').eq('user_id', user.id)
      .order('collected_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const latestDate = data[0].collected_at;
          setSpTracks(data.filter((t: any) => t.collected_at === latestDate));
        } else {
          setSpTracks([]);
        }
      });
  }, [user]);

  const isProGated = period === '90d' && userPlan === 'free';

  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, any>> = {};
    metrics.forEach(m => {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = { date: m.metric_date };
      byDate[m.metric_date][`${m.platform}_followers`] = m.followers;
      byDate[m.metric_date][`${m.platform}_engagement`] = m.engagement_rate;
      byDate[m.metric_date][`${m.platform}_views`] = m.total_views;
    });
    return Object.values(byDate);
  }, [metrics]);

  const activePlatforms = useMemo(() => [...new Set(metrics.map(m => m.platform))], [metrics]);

  const totals = useMemo(() => {
    if (metrics.length === 0) return { followers: 0, engagement: 0, views: 0, posts: 0 };
    const latest: Record<string, MetricRow> = {};
    metrics.forEach(m => { if (!latest[m.platform] || m.metric_date > latest[m.platform].metric_date) latest[m.platform] = m; });
    const vals = Object.values(latest);
    return {
      followers: vals.reduce((s, v) => s + (v.followers || 0), 0),
      engagement: vals.length ? vals.reduce((s, v) => s + (v.engagement_rate || 0), 0) / vals.length : 0,
      views: vals.reduce((s, v) => s + (v.total_views || 0), 0),
      posts: vals.reduce((s, v) => s + (v.posts_count || 0), 0),
    };
  }, [metrics]);

  // Sort YouTube videos by different criteria
  const ytMostPopular = useMemo(() => [...ytVideos].sort((a, b) => b.view_count - a.view_count), [ytVideos]);
  const ytMostGrowing = useMemo(() => [...ytVideos].sort((a, b) => b.growth_pct - a.growth_pct), [ytVideos]);
  const ytMostDeclining = useMemo(() => [...ytVideos].filter(v => v.growth_pct < 0).sort((a, b) => a.growth_pct - b.growth_pct), [ytVideos]);

  // Sort Spotify tracks by different criteria
  const spMostPopular = useMemo(() => [...spTracks].sort((a, b) => b.popularity - a.popularity), [spTracks]);
  const spMostGrowing = useMemo(() => [...spTracks].sort((a, b) => b.growth_pct - a.growth_pct), [spTracks]);
  const spMostDeclining = useMemo(() => [...spTracks].filter(t => t.growth_pct < 0).sort((a, b) => a.growth_pct - b.growth_pct), [spTracks]);

  const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' };

  if (isProGated) {
    return (
      <div className="animate-fade-in space-y-6 sparkle-container warm-gradient-top">
        <div className="flex items-center justify-between relative z-10">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList><TabsTrigger value="7d">7 zile</TabsTrigger><TabsTrigger value="30d">30 zile</TabsTrigger><TabsTrigger value="90d">90 zile</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <div className="glass-card p-12 text-center relative z-10">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Analytics pe 90 de zile — disponibil in Pro</h2>
          <p className="text-muted-foreground mb-4">Upgrade pentru a vedea tendinte pe termen lung.</p>
          <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 sparkle-container warm-gradient-top">
      {/* Header with period selector + content tabs */}
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList><TabsTrigger value="7d">7 zile</TabsTrigger><TabsTrigger value="30d">30 zile</TabsTrigger><TabsTrigger value="90d">90 zile</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <Tabs value={contentTab} onValueChange={v => setContentTab(v as ContentTab)}>
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="youtube" className="gap-1.5"><Play className="h-3.5 w-3.5" />YouTube Videos</TabsTrigger>
            <TabsTrigger value="spotify" className="gap-1.5"><Music className="h-3.5 w-3.5" />Spotify Tracks</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Followers', value: formatNumber(totals.followers), icon: Users },
          { label: 'Engagement Mediu', value: `${totals.engagement.toFixed(2)}%`, icon: TrendingUp },
          { label: 'Total Views', value: formatNumber(totals.views), icon: Eye },
          { label: 'Postari', value: totals.posts.toLocaleString(), icon: BarChart3 },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-4 backdrop-blur-lg">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12 relative z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {contentTab === 'overview' && (
            metrics.length === 0 ? (
              <div className="glass-card p-12 text-center relative z-10">
                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Inca nu sunt date</h2>
                <p className="text-muted-foreground">Conecteaza platforme si asteapta primul audit zilnic.</p>
              </div>
            ) : (
              <div className="space-y-5 relative z-10">
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Evolutie Followers</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {activePlatforms.map(p => (
                        <Area key={p} type="monotone" dataKey={`${p}_followers`} stroke={PLATFORM_COLORS[p] || '#888'} fill={PLATFORM_COLORS[p] || '#888'} fillOpacity={0.1} name={`${p} followers`} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Engagement Rate (%)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {activePlatforms.map(p => (
                        <Line key={p} type="monotone" dataKey={`${p}_engagement`} stroke={PLATFORM_COLORS[p] || '#888'} strokeWidth={2} dot={false} name={`${p} engagement`} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Views per platforma</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {activePlatforms.map(p => (
                        <Bar key={p} dataKey={`${p}_views`} fill={PLATFORM_COLORS[p] || '#888'} name={`${p} views`} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          )}

          {/* ── YOUTUBE TAB ── */}
          {contentTab === 'youtube' && (
            ytVideos.length === 0 ? (
              <div className="glass-card p-12 text-center relative z-10">
                <Play className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Inca nu sunt date YouTube</h2>
                <p className="text-muted-foreground">Conecteaza canalul YouTube si asteapta colectarea datelor.</p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {/* Most Popular */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-red-400" />
                    <h3 className="text-base font-semibold text-foreground">Cele mai populare videoclipuri</h3>
                  </div>
                  <div className="space-y-3">
                    {ytMostPopular.slice(0, 10).map((video, i) => (
                      <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <span className="text-sm font-bold text-muted-foreground w-6 text-right">{i + 1}</span>
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-24 h-14 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{video.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{formatNumber(video.view_count)} views</span>
                            <span className="text-xs text-muted-foreground">{formatNumber(video.like_count)} likes</span>
                            <span className="text-xs text-muted-foreground">{formatNumber(video.comment_count)} comments</span>
                          </div>
                        </div>
                        <GrowthBadge value={video.growth_pct} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Most Growing */}
                {ytMostGrowing.filter(v => v.growth_pct > 0).length > 0 && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-base font-semibold text-foreground">Cele mai in crestere</h3>
                    </div>
                    <div className="space-y-3">
                      {ytMostGrowing.filter(v => v.growth_pct > 0).slice(0, 5).map((video, i) => (
                        <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-sm font-bold text-emerald-400 w-6 text-right">{i + 1}</span>
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-20 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Play className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{video.title}</p>
                            <span className="text-xs text-muted-foreground">{formatNumber(video.view_count)} views</span>
                          </div>
                          <GrowthBadge value={video.growth_pct} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Most Declining */}
                {ytMostDeclining.length > 0 && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                      <h3 className="text-base font-semibold text-foreground">Cele mai in scadere</h3>
                    </div>
                    <div className="space-y-3">
                      {ytMostDeclining.slice(0, 5).map((video, i) => (
                        <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-sm font-bold text-red-400 w-6 text-right">{i + 1}</span>
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-20 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Play className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{video.title}</p>
                            <span className="text-xs text-muted-foreground">{formatNumber(video.view_count)} views</span>
                          </div>
                          <GrowthBadge value={video.growth_pct} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* ── SPOTIFY TAB ── */}
          {contentTab === 'spotify' && (
            spTracks.length === 0 ? (
              <div className="glass-card p-12 text-center relative z-10">
                <Music className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Inca nu sunt date Spotify</h2>
                <p className="text-muted-foreground">Conecteaza contul Spotify si asteapta colectarea datelor.</p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {/* Most Popular */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Music className="h-5 w-5 text-green-400" />
                    <h3 className="text-base font-semibold text-foreground">Cele mai populare piese</h3>
                  </div>
                  <div className="space-y-3">
                    {spMostPopular.slice(0, 10).map((track, i) => (
                      <a key={track.track_id} href={`https://open.spotify.com/track/${track.track_id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <span className="text-sm font-bold text-muted-foreground w-6 text-right">{i + 1}</span>
                        {track.album_image_url ? (
                          <img src={track.album_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Music className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-green-400 transition-colors">{track.track_name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">{track.album_name}</span>
                            <span className="text-xs text-muted-foreground">{formatDuration(track.duration_ms)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full" style={{ width: `${track.popularity}%` }} />
                            </div>
                            <span className="text-xs font-medium text-foreground w-7 text-right">{track.popularity}</span>
                          </div>
                          <GrowthBadge value={track.growth_pct} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Most Growing */}
                {spMostGrowing.filter(t => t.growth_pct > 0).length > 0 && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-base font-semibold text-foreground">Piese in crestere</h3>
                    </div>
                    <div className="space-y-3">
                      {spMostGrowing.filter(t => t.growth_pct > 0).slice(0, 5).map((track, i) => (
                        <a key={track.track_id} href={`https://open.spotify.com/track/${track.track_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-sm font-bold text-emerald-400 w-6 text-right">{i + 1}</span>
                          {track.album_image_url ? (
                            <img src={track.album_image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Music className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-green-400 transition-colors">{track.track_name}</p>
                            <span className="text-xs text-muted-foreground">Popularity: {track.popularity}</span>
                          </div>
                          <GrowthBadge value={track.growth_pct} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Most Declining */}
                {spMostDeclining.length > 0 && (
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                      <h3 className="text-base font-semibold text-foreground">Piese in scadere</h3>
                    </div>
                    <div className="space-y-3">
                      {spMostDeclining.slice(0, 5).map((track, i) => (
                        <a key={track.track_id} href={`https://open.spotify.com/track/${track.track_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-sm font-bold text-red-400 w-6 text-right">{i + 1}</span>
                          {track.album_image_url ? (
                            <img src={track.album_image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Music className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-red-400 transition-colors">{track.track_name}</p>
                            <span className="text-xs text-muted-foreground">Popularity: {track.popularity}</span>
                          </div>
                          <GrowthBadge value={track.growth_pct} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
