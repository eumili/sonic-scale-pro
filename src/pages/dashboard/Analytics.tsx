import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Loader2, TrendingUp, TrendingDown, Users, Eye, BarChart3, Play, Music, ArrowUp, ArrowDown, Minus, Instagram, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

type Period = '7d' | '30d' | '90d';
type ContentTab = 'overview' | 'youtube' | 'spotify' | 'instagram' | 'tiktok';

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444', spotify: '#22C55E', instagram: '#EC4899', tiktok: '#A78BFA', apple_music: '#F472B6',
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube', spotify: 'Spotify', instagram: 'Instagram', tiktok: 'TikTok', apple_music: 'Apple Music',
};

interface MetricRow {
  metric_date: string;
  platform: string;
  followers_count: number;
  likes_count: number;
  comments_count: number;
  views_count: number;
  posts_count: number;
  shares_count: number;
  engagement_rate: number;
  streams_count: number;
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
    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium text-emerald-400">
      <ArrowUp className="h-3 w-3" />{value.toFixed(1)}{suffix}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium text-red-400">
      <ArrowDown className="h-3 w-3" />{Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
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

/* ── Platform metrics table component ── */
function PlatformMetricsTable({ metrics, platform }: { metrics: MetricRow[]; platform: string }) {
  const filtered = metrics.filter(m => m.platform === platform).sort((a, b) => b.metric_date.localeCompare(a.metric_date));

  if (filtered.length === 0) {
    return (
      <div className="glass-card p-8 sm:p-12 text-center relative z-10">
        <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Încă nu sunt date {PLATFORM_LABELS[platform]}</h2>
        <p className="text-sm text-muted-foreground">Conectează contul {PLATFORM_LABELS[platform]} și apasă Sync Now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 relative z-10">
      {/* Summary cards */}
      {(() => {
        const latest = filtered[0];
        const prev = filtered.length > 1 ? filtered[1] : null;
        const followerGrowth = prev ? ((latest.followers_count - prev.followers_count) / (prev.followers_count || 1)) * 100 : 0;
        const engGrowth = prev ? latest.engagement_rate - prev.engagement_rate : 0;
        return (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
            <div className="glass-card p-3 sm:p-4">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Followers</span>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{formatNumber(latest.followers_count || 0)}</p>
              <GrowthBadge value={followerGrowth} />
            </div>
            <div className="glass-card p-3 sm:p-4">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Engagement</span>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{(latest.engagement_rate || 0).toFixed(2)}%</p>
              <GrowthBadge value={engGrowth} suffix="pp" />
            </div>
            <div className="glass-card p-3 sm:p-4">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Views</span>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{formatNumber(latest.views_count || 0)}</p>
            </div>
            <div className="glass-card p-3 sm:p-4">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Likes</span>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{formatNumber(latest.likes_count || 0)}</p>
            </div>
          </div>
        );
      })()}

      {/* Metrics table */}
      <div className="glass-card p-3 sm:p-6 overflow-x-auto">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Date zilnice — {PLATFORM_LABELS[platform]}</h3>
        <table className="w-full text-[10px] sm:text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground">
              <th className="text-left py-1.5 sm:py-2 px-1 sm:px-2">Data</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Followers</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Views</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Likes</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Comments</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Shares</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Posts</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Eng%</th>
              <th className="text-right py-1.5 sm:py-2 px-1 sm:px-2">Streams</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.metric_date} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-foreground whitespace-nowrap">{row.metric_date}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{formatNumber(row.followers_count || 0)}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{formatNumber(row.views_count || 0)}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{formatNumber(row.likes_count || 0)}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{formatNumber(row.comments_count || 0)}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{formatNumber(row.shares_count || 0)}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{row.posts_count || 0}</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{(row.engagement_rate || 0).toFixed(2)}%</td>
                <td className="py-1.5 sm:py-2 px-1 sm:px-2 text-right text-foreground">{formatNumber(row.streams_count || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    setLoading(true);
    supabase.from('metrics_daily').select('*').eq('user_id', user.id)
      .gte('metric_date', since.toISOString().split('T')[0]).order('metric_date', { ascending: true })
      .then(({ data }) => { setMetrics((data as MetricRow[]) || []); setLoading(false); });
  }, [user, period]);

  useEffect(() => {
    if (!user) return;
    supabase.from('youtube_videos').select('*').eq('user_id', user.id)
      .order('collected_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const latestDate = data[0].collected_at;
          setYtVideos(data.filter((v: any) => v.collected_at === latestDate));
        } else setYtVideos([]);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from('spotify_tracks').select('*').eq('user_id', user.id)
      .order('collected_at', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const latestDate = data[0].collected_at;
          setSpTracks(data.filter((t: any) => t.collected_at === latestDate));
        } else setSpTracks([]);
      });
  }, [user]);

  const isProGated = period === '90d' && userPlan === 'free';

  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, any>> = {};
    metrics.forEach(m => {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = { date: m.metric_date };
      byDate[m.metric_date][`${m.platform}_followers`] = m.followers_count;
      byDate[m.metric_date][`${m.platform}_engagement`] = m.engagement_rate;
      byDate[m.metric_date][`${m.platform}_views`] = m.views_count;
      byDate[m.metric_date][`${m.platform}_likes`] = m.likes_count;
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
      followers: vals.reduce((s, v) => s + (v.followers_count || 0), 0),
      engagement: vals.length ? vals.reduce((s, v) => s + (v.engagement_rate || 0), 0) / vals.length : 0,
      views: vals.reduce((s, v) => s + (v.views_count || 0), 0),
      posts: vals.reduce((s, v) => s + (v.posts_count || 0), 0),
    };
  }, [metrics]);

  const platformBreakdowns = useMemo(() => {
    const latest: Record<string, MetricRow> = {};
    const prev: Record<string, MetricRow> = {};
    const sorted = [...metrics].sort((a, b) => b.metric_date.localeCompare(a.metric_date));
    sorted.forEach(m => {
      if (!latest[m.platform]) { latest[m.platform] = m; return; }
      if (!prev[m.platform] && m.metric_date < latest[m.platform].metric_date) prev[m.platform] = m;
    });
    return Object.entries(latest).map(([platform, lat]) => {
      const p = prev[platform];
      const followerGrowth = p ? ((lat.followers_count - p.followers_count) / (p.followers_count || 1)) * 100 : 0;
      return { platform, ...lat, followerGrowth };
    });
  }, [metrics]);

  const ytMostPopular = useMemo(() => [...ytVideos].sort((a, b) => b.view_count - a.view_count), [ytVideos]);
  const ytMostGrowing = useMemo(() => [...ytVideos].sort((a, b) => b.growth_pct - a.growth_pct), [ytVideos]);
  const ytMostDeclining = useMemo(() => [...ytVideos].filter(v => v.growth_pct < 0).sort((a, b) => a.growth_pct - b.growth_pct), [ytVideos]);

  const spMostPopular = useMemo(() => [...spTracks].sort((a, b) => b.popularity - a.popularity), [spTracks]);
  const spMostGrowing = useMemo(() => [...spTracks].sort((a, b) => b.growth_pct - a.growth_pct), [spTracks]);
  const spMostDeclining = useMemo(() => [...spTracks].filter(t => t.growth_pct < 0).sort((a, b) => a.growth_pct - b.growth_pct), [spTracks]);

  const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' };

  if (isProGated) {
    return (
      <div className="animate-fade-in space-y-4 sm:space-y-6 sparkle-container warm-gradient-top">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Analytics</h1>
          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList><TabsTrigger value="7d" className="text-xs sm:text-sm">7d</TabsTrigger><TabsTrigger value="30d" className="text-xs sm:text-sm">30d</TabsTrigger><TabsTrigger value="90d" className="text-xs sm:text-sm">90d</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <div className="glass-card p-8 sm:p-12 text-center relative z-10">
          <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Analytics 90 zile — disponibil in Pro</h2>
          <p className="text-sm text-muted-foreground mb-4">Upgrade pentru tendințe pe termen lung.</p>
          <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6 sparkle-container warm-gradient-top">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Analytics</h1>
          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList><TabsTrigger value="7d" className="text-xs sm:text-sm">7d</TabsTrigger><TabsTrigger value="30d" className="text-xs sm:text-sm">30d</TabsTrigger><TabsTrigger value="90d" className="text-xs sm:text-sm">90d</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <Tabs value={contentTab} onValueChange={v => setContentTab(v as ContentTab)}>
          <TabsList className="bg-card/50 border border-border/50 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="hidden xs:inline">Overview</span><span className="xs:hidden">All</span></TabsTrigger>
            <TabsTrigger value="youtube" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />YT</TabsTrigger>
            <TabsTrigger value="spotify" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><Music className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Spotify</TabsTrigger>
            <TabsTrigger value="instagram" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><Instagram className="h-3 w-3 sm:h-3.5 sm:w-3.5" />IG</TabsTrigger>
            <TabsTrigger value="tiktok" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><Hash className="h-3 w-3 sm:h-3.5 sm:w-3.5" />TT</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4 relative z-10">
        {[
          { label: 'Followers', value: formatNumber(totals.followers), icon: Users },
          { label: 'Engagement', value: `${totals.engagement.toFixed(2)}%`, icon: TrendingUp },
          { label: 'Views', value: formatNumber(totals.views), icon: Eye },
          { label: 'Postări', value: totals.posts.toLocaleString(), icon: BarChart3 },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-3 sm:p-4 backdrop-blur-lg">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <kpi.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-foreground">{kpi.value}</p>
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
              <div className="glass-card p-8 sm:p-12 text-center relative z-10">
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Încă nu sunt date</h2>
                <p className="text-sm text-muted-foreground">Conectează platforme și apasă Sync Now.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 relative z-10">
                {/* Per-platform breakdown cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {platformBreakdowns.map(pb => (
                    <div key={pb.platform} className="glass-card p-4 sm:p-5" style={{ borderLeft: `3px solid ${PLATFORM_COLORS[pb.platform] || '#888'}` }}>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm font-semibold text-foreground">{PLATFORM_LABELS[pb.platform] || pb.platform}</span>
                        <GrowthBadge value={pb.followerGrowth} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                        <div>
                          <p className="text-sm sm:text-lg font-bold text-foreground">{formatNumber(pb.followers_count || 0)}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">Followers</p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-lg font-bold text-foreground">{(pb.engagement_rate || 0).toFixed(2)}%</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">Engagement</p>
                        </div>
                        <div>
                          <p className="text-sm sm:text-lg font-bold text-foreground">{formatNumber(pb.views_count || 0)}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">Views</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Followers chart */}
                <div className="glass-card p-3 sm:p-6">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Evoluție Followers</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={35} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {activePlatforms.map(p => (
                        <Area key={p} type="monotone" dataKey={`${p}_followers`} stroke={PLATFORM_COLORS[p] || '#888'} fill={PLATFORM_COLORS[p] || '#888'} fillOpacity={0.1} name={`${PLATFORM_LABELS[p] || p}`} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Engagement chart */}
                <div className="glass-card p-3 sm:p-6">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Engagement Rate (%)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={35} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {activePlatforms.map(p => (
                        <Line key={p} type="monotone" dataKey={`${p}_engagement`} stroke={PLATFORM_COLORS[p] || '#888'} strokeWidth={2} dot={false} name={`${PLATFORM_LABELS[p] || p}`} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Content performance */}
                <div className="glass-card p-3 sm:p-6">
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Views & Likes</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9 }} width={35} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {activePlatforms.map(p => (
                        <Bar key={`${p}_v`} dataKey={`${p}_views`} fill={PLATFORM_COLORS[p] || '#888'} name={`${PLATFORM_LABELS[p] || p} views`} />
                      ))}
                      {activePlatforms.map(p => (
                        <Bar key={`${p}_l`} dataKey={`${p}_likes`} fill={PLATFORM_COLORS[p] || '#888'} fillOpacity={0.5} name={`${PLATFORM_LABELS[p] || p} likes`} />
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
              <div className="glass-card p-8 sm:p-12 text-center relative z-10">
                <Play className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Încă nu sunt date YouTube</h2>
                <p className="text-sm text-muted-foreground">Conectează canalul YouTube și apasă Sync Now.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 relative z-10">
                <div className="glass-card p-3 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">Cele mai populare</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {ytMostPopular.slice(0, 10).map((video, i) => (
                      <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <span className="text-xs sm:text-sm font-bold text-muted-foreground w-5 sm:w-6 text-right shrink-0">{i + 1}</span>
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-16 h-10 sm:w-24 sm:h-14 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-10 sm:w-24 sm:h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><Play className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{video.title}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{formatNumber(video.view_count)} views</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">{formatNumber(video.like_count)} likes</span>
                          </div>
                        </div>
                        <GrowthBadge value={video.growth_pct} />
                      </a>
                    ))}
                  </div>
                </div>

                {ytMostGrowing.filter(v => v.growth_pct > 0).length > 0 && (
                  <div className="glass-card p-3 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">În creștere</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {ytMostGrowing.filter(v => v.growth_pct > 0).slice(0, 5).map((video, i) => (
                        <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400 w-5 sm:w-6 text-right shrink-0">{i + 1}</span>
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="w-14 h-8 sm:w-20 sm:h-12 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-8 sm:w-20 sm:h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><Play className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{video.title}</p>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{formatNumber(video.view_count)} views</span>
                          </div>
                          <GrowthBadge value={video.growth_pct} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {ytMostDeclining.length > 0 && (
                  <div className="glass-card p-3 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">În scădere</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {ytMostDeclining.slice(0, 5).map((video, i) => (
                        <a key={video.video_id} href={`https://youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-xs sm:text-sm font-bold text-red-400 w-5 sm:w-6 text-right shrink-0">{i + 1}</span>
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt="" className="w-14 h-8 sm:w-20 sm:h-12 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-8 sm:w-20 sm:h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><Play className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{video.title}</p>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">{formatNumber(video.view_count)} views</span>
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
              <div className="glass-card p-8 sm:p-12 text-center relative z-10">
                <Music className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Încă nu sunt date Spotify</h2>
                <p className="text-sm text-muted-foreground">Conectează contul Spotify și apasă Sync Now.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 relative z-10">
                <div className="glass-card p-3 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Music className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">Cele mai populare piese</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {spMostPopular.slice(0, 10).map((track, i) => (
                      <a key={track.track_id} href={`https://open.spotify.com/track/${track.track_id}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <span className="text-xs sm:text-sm font-bold text-muted-foreground w-5 sm:w-6 text-right shrink-0">{i + 1}</span>
                        {track.album_image_url ? (
                          <img src={track.album_image_url} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><Music className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-green-400 transition-colors">{track.track_name}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
                            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{track.album_name}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">{formatDuration(track.duration_ms)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                          <div className="flex items-center gap-1">
                            <div className="w-12 sm:w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full" style={{ width: `${track.popularity}%` }} />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-foreground w-6 text-right">{track.popularity}</span>
                          </div>
                          <GrowthBadge value={track.growth_pct} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {spMostGrowing.filter(t => t.growth_pct > 0).length > 0 && (
                  <div className="glass-card p-3 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Piese în creștere</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {spMostGrowing.filter(t => t.growth_pct > 0).slice(0, 5).map((track, i) => (
                        <a key={track.track_id} href={`https://open.spotify.com/track/${track.track_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400 w-5 sm:w-6 text-right shrink-0">{i + 1}</span>
                          {track.album_image_url ? (
                            <img src={track.album_image_url} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><Music className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-green-400 transition-colors">{track.track_name}</p>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">Popularity: {track.popularity}</span>
                          </div>
                          <GrowthBadge value={track.growth_pct} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {spMostDeclining.length > 0 && (
                  <div className="glass-card p-3 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Piese în scădere</h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {spMostDeclining.slice(0, 5).map((track, i) => (
                        <a key={track.track_id} href={`https://open.spotify.com/track/${track.track_id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors group">
                          <span className="text-xs sm:text-sm font-bold text-red-400 w-5 sm:w-6 text-right shrink-0">{i + 1}</span>
                          {track.album_image_url ? (
                            <img src={track.album_image_url} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><Music className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-red-400 transition-colors">{track.track_name}</p>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">Popularity: {track.popularity}</span>
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

          {/* ── INSTAGRAM TAB ── */}
          {contentTab === 'instagram' && (
            <PlatformMetricsTable metrics={metrics} platform="instagram" />
          )}

          {/* ── TIKTOK TAB ── */}
          {contentTab === 'tiktok' && (
            <PlatformMetricsTable metrics={metrics} platform="tiktok" />
          )}
        </>
      )}
    </div>
  );
}
