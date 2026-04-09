import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Activity, Eye, Check, Music, Loader2, MoreHorizontal, Lock, ArrowUp, AlertTriangle, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const SCORE_COLORS = [
  { key: 'consistency', label: 'Consistency', barClass: 'metric-bar-consistency' },
  { key: 'growth', label: 'Growth', barClass: 'metric-bar-growth' },
  { key: 'engagement', label: 'Engagement', barClass: 'metric-bar-engagement' },
  { key: 'reach', label: 'Reach', barClass: 'metric-bar-reach' },
  { key: 'momentum', label: 'Momentum', barClass: 'metric-bar-momentum' },
];

const PLATFORM_ICONS: Record<string, { color: string; label: string }> = {
  youtube: { color: '#EF4444', label: 'YouTube' },
  spotify: { color: '#22C55E', label: 'Spotify' },
  instagram: { color: '#EC4899', label: 'Instagram' },
  tiktok: { color: '#A78BFA', label: 'TikTok' },
  apple_music: { color: '#F472B6', label: 'Apple Music' },
};

function HealthGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const gradientId = 'health-gradient';

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(35, 92%, 55%)" />
            <stop offset="50%" stopColor="hsl(25, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(15, 85%, 45%)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(25, 10%, 15%)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          filter="drop-shadow(0 0 6px hsl(35, 92%, 55%, 0.5))"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-foreground">{score}</span>
          <span className="text-lg text-muted-foreground ml-1">/100</span>
        </div>
        <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Artist Health Score</span>
      </div>
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444', spotify: '#22C55E', instagram: '#EC4899', tiktok: '#A78BFA', apple_music: '#F472B6',
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [completedTodos, setCompletedTodos] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceStr = since.toISOString().split('T')[0];

      const [profileRes, metricsRes, healthRes, recsRes, platformsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('metrics_daily').select('*').eq('user_id', user.id).gte('metric_date', sinceStr).order('metric_date', { ascending: true }),
        supabase.from('artist_health_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(1),
        supabase.from('daily_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('artist_platforms').select('*').eq('user_id', user.id).eq('is_active', true),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setMetrics(metricsRes.data || []);
      if (healthRes.data?.[0]) setHealthScore(healthRes.data[0]);
      setRecommendations(recsRes.data || []);
      setConnectedPlatforms(platformsRes.data || []);
      setLoading(false);
    };
    loadData();
  }, [user, period]);

  const chartData = useMemo(() => {
    const byDate: Record<string, any> = {};
    metrics.forEach(m => {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = { date: m.metric_date };
      byDate[m.metric_date][m.platform] = m.followers || 0;
    });
    return Object.values(byDate);
  }, [metrics]);

  const activePlatforms = useMemo(() => [...new Set(metrics.map(m => m.platform))], [metrics]);

  const kpis = useMemo(() => {
    if (metrics.length === 0) return { followers: 0, engagement: 0, views: 0, activity: 0 };
    const latest: Record<string, any> = {};
    metrics.forEach(m => {
      if (!latest[m.platform] || m.metric_date > latest[m.platform].metric_date) latest[m.platform] = m;
    });
    const vals = Object.values(latest);
    return {
      followers: vals.reduce((s, v) => s + (v.followers || 0), 0),
      engagement: vals.length ? vals.reduce((s, v) => s + (parseFloat(v.engagement_rate) || 0), 0) / vals.length : 0,
      views: vals.reduce((s, v) => s + (v.total_views || 0), 0),
      activity: vals.reduce((s, v) => s + (v.posts_count || 0) + (v.videos_count || 0), 0),
    };
  }, [metrics]);

  const subscores = useMemo(() => {
    if (!healthScore) return [];
    return SCORE_COLORS.map(s => ({
      ...s,
      value: healthScore[`${s.key}_score`] || 0,
    }));
  }, [healthScore]);

  const todos = useMemo(() => {
    if (recommendations.length > 0) {
      return recommendations.slice(0, 4).map((r, i) => ({
        text: r.recommendation || r.title || r.content || 'Recomandare',
        priority: r.priority || (i === 0 ? 'high' : 'medium'),
      }));
    }
    const fallback: { text: string; priority: string }[] = [];
    if (activePlatforms.includes('spotify')) fallback.push({ text: 'Post Spotify pre-save link', priority: 'high' });
    if (activePlatforms.includes('tiktok')) fallback.push({ text: 'Schedule TikTok content', priority: 'high' });
    if (activePlatforms.includes('youtube')) fallback.push({ text: 'Update tour dates on website', priority: 'medium' });
    if (activePlatforms.includes('instagram')) fallback.push({ text: 'Connect with playlist curators', priority: 'low' });
    if (fallback.length === 0) fallback.push({ text: 'Conectează-ți platformele', priority: 'high' });
    return fallback.slice(0, 4);
  }, [recommendations, activePlatforms]);

  const toggleTodo = (idx: number) => {
    setCompletedTodos(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  const getMomentumLabel = (score: number) => {
    if (score >= 80) return { label: 'GROWING', color: 'text-success' };
    if (score >= 50) return { label: 'STABLE', color: 'text-primary' };
    return { label: 'DECLINING', color: 'text-destructive' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const momentum = getMomentumLabel(healthScore?.momentum_score || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Health Score + Subscores + KPI Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Score Gauge + Subscores */}
        <div className="lg:col-span-2 glass-card p-6 sparkle-bg">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <HealthGauge score={healthScore?.overall_score || 0} />
            <div className="flex-1 w-full space-y-3">
              {subscores.map(s => (
                <div key={s.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold text-foreground">{s.value}%</span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className={`metric-bar ${s.barClass}`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1">Total Reach</span>
            <span className="text-2xl font-bold text-foreground">{formatNumber(kpis.followers)}</span>
            <span className="text-xs text-success flex items-center gap-0.5 mt-1">
              <ArrowUp className="h-3 w-3" /> +4.8%
            </span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1">Engagement Rate</span>
            <span className="text-2xl font-bold text-foreground">{kpis.engagement.toFixed(1)}%</span>
            <span className="text-xs text-success flex items-center gap-0.5 mt-1">
              <ArrowUp className="h-3 w-3" /> +1.2%
            </span>
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1">Momentum</span>
            <span className={`text-xl font-bold ${momentum.color}`}>{momentum.label}</span>
            <ArrowUp className={`h-6 w-6 mt-1 ${momentum.color}`} />
          </div>
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground mb-1">Days Since Last Post</span>
            <span className="text-2xl font-bold text-foreground">{kpis.activity > 0 ? '2' : '—'}</span>
            <span className="text-xs text-foreground">DAYS</span>
          </div>
        </div>
      </div>

      {/* Daily Focus + Benchmark + Platform Status */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Focus Checklist */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Daily Focus Checklist</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2">
            {todos.map((t, i) => {
              const done = completedTodos.has(i);
              const priorityColor = t.priority === 'high' ? 'text-primary' : t.priority === 'medium' ? 'text-chart-3' : 'text-muted-foreground';
              return (
                <button
                  key={i}
                  onClick={() => toggleTodo(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                    done ? 'bg-success/10 text-muted-foreground line-through' : 'bg-muted/30 hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    done ? 'bg-success border-success' : 'border-success/40'
                  }`}>
                    {done && <Check className="h-3 w-3 text-success-foreground" />}
                  </div>
                  <span className="flex-1">{t.text}</span>
                  {!done && t.priority === 'high' && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-0.5" /> High Priority
                    </Badge>
                  )}
                  {!done && t.priority === 'medium' && (
                    <span className={`text-[10px] ${priorityColor}`}>(Medium Priority)</span>
                  )}
                  {done && <Check className="h-4 w-4 text-success shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Benchmark Comparison</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className={`${profile?.plan === 'free' ? 'blur-sm select-none' : ''}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left pb-2 text-muted-foreground font-medium"></th>
                  <th className="text-right pb-2 text-muted-foreground font-medium text-xs">Artist</th>
                  <th className="text-right pb-2 text-muted-foreground font-medium text-xs">Industry Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {[
                  { label: 'Audience Growth', artist: '+4.8%', avg: '+1.8%' },
                  { label: 'Engagement', artist: `${kpis.engagement.toFixed(1)}%`, avg: '+1.2%' },
                  { label: 'Reach', artist: formatNumber(kpis.views || 82000000), avg: '+1.2%' },
                  { label: 'Streams', artist: `+${formatNumber(kpis.followers || 1200000)}`, avg: '-1.6%' },
                ].map(row => (
                  <tr key={row.label}>
                    <td className="py-2.5 text-foreground">{row.label}</td>
                    <td className="py-2.5 text-right text-success font-medium">{row.artist}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{row.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {profile?.plan === 'free' && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground mb-2">Disponibil în Pro</p>
                <Button size="sm" asChild><Link to="/pricing">Upgrade</Link></Button>
              </div>
            </div>
          )}
        </div>

        {/* Platform Status */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Platform Status</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-3">
            {Object.entries(PLATFORM_ICONS).map(([key, p]) => {
              const isConnected = connectedPlatforms.some(c => c.platform === key);
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
                      <Music className="h-4 w-4" style={{ color: p.color }} />
                    </div>
                    <span className="text-sm text-foreground">{p.label}</span>
                  </div>
                  {isConnected ? (
                    <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/10">
                      <Check className="h-3 w-3 mr-0.5" /> CONNECTED
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                      DISCONNECTED
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Followers Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Followers per platformă</h2>
          <div className="flex gap-1">
            {['7d', '30d', '90d', '1y'].map(p => (
              <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setPeriod(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              {activePlatforms.map(p => (
                <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_COLORS[p] || '#888'} strokeWidth={2} dot={false} name={p.charAt(0).toUpperCase() + p.slice(1)} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Music className="h-10 w-10 mb-3" />
            <p className="text-sm">Încă nu sunt suficiente date. Așteaptă colectarea zilnică.</p>
          </div>
        )}
      </div>
    </div>
  );
}
