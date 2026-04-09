import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Activity, Zap, Check, Eye, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Health score circle component
function HealthScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score <= 40 ? 'hsl(0, 84%, 60%)' : score <= 70 ? 'hsl(35, 92%, 55%)' : score <= 85 ? 'hsl(80, 60%, 50%)' : 'hsl(160, 84%, 39%)';

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">din 100</span>
      </div>
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444',
  spotify: '#22C55E',
  instagram: '#EC4899',
  tiktok: '#A78BFA',
  apple_music: '#F472B6',
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
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

      const [profileRes, metricsRes, healthRes, recsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('metrics_daily')
          .select('*')
          .eq('user_id', user.id)
          .gte('metric_date', sinceStr)
          .order('metric_date', { ascending: true }),
        supabase
          .from('artist_health_scores')
          .select('*')
          .eq('user_id', user.id)
          .order('score_date', { ascending: false })
          .limit(1),
        supabase
          .from('daily_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setMetrics(metricsRes.data || []);
      if (healthRes.data?.[0]) setHealthScore(healthRes.data[0]);
      setRecommendations(recsRes.data || []);
      setLoading(false);
    };

    loadData();
  }, [user, period]);

  // Build chart data from real metrics
  const chartData = useMemo(() => {
    const byDate: Record<string, any> = {};
    metrics.forEach(m => {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = { date: m.metric_date };
      byDate[m.metric_date][m.platform] = m.followers || 0;
    });
    return Object.values(byDate);
  }, [metrics]);

  // Get active platforms from metrics
  const activePlatforms = useMemo(() => {
    return [...new Set(metrics.map(m => m.platform))];
  }, [metrics]);

  // Calculate KPIs from latest metrics per platform
  const kpis = useMemo(() => {
    if (metrics.length === 0) return { followers: 0, engagement: 0, views: 0, activity: 0 };
    const latest: Record<string, any> = {};
    metrics.forEach(m => {
      if (!latest[m.platform] || m.metric_date > latest[m.platform].metric_date) {
        latest[m.platform] = m;
      }
    });
    const vals = Object.values(latest);
    return {
      followers: vals.reduce((s, v) => s + (v.followers || 0), 0),
      engagement: vals.length ? vals.reduce((s, v) => s + (parseFloat(v.engagement_rate) || 0), 0) / vals.length : 0,
      views: vals.reduce((s, v) => s + (v.total_views || 0), 0),
      activity: vals.reduce((s, v) => s + (v.posts_count || 0) + (v.videos_count || 0), 0),
    };
  }, [metrics]);

  // Subscores from health score
  const subscores = useMemo(() => {
    if (!healthScore) return [];
    return [
      { label: 'Consistenta', value: healthScore.consistency_score || 0, max: 100 },
      { label: 'Crestere', value: healthScore.growth_score || 0, max: 100 },
      { label: 'Engagement', value: healthScore.engagement_score || 0, max: 100 },
      { label: 'Reach', value: healthScore.reach_score || 0, max: 100 },
      { label: 'Momentum', value: healthScore.momentum_score || 0, max: 100 },
    ];
  }, [healthScore]);

  // Build todos from recommendations
  const todos = useMemo(() => {
    if (recommendations.length > 0) {
      return recommendations.slice(0, 3).map(r => r.recommendation || r.title || r.content || 'Recomandare');
    }
    // Fallback based on available data
    const fallback: string[] = [];
    if (activePlatforms.includes('youtube')) fallback.push('Verifica analytics-ul YouTube si raspunde la comentarii');
    if (activePlatforms.includes('spotify')) fallback.push('Actualizeaza playlist-urile si descrierea artistului pe Spotify');
    if (activePlatforms.includes('instagram')) fallback.push('Posteaza un Instagram Story sau Reel');
    if (activePlatforms.includes('tiktok')) fallback.push('Creeaza un TikTok nou cu un trend actual');
    if (fallback.length === 0) fallback.push('Conecteaza-ti platformele pentru a primi recomandari personalizate');
    return fallback.slice(0, 3);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Buna, {profile?.artist_name || 'Artist'} 👋
        </h1>
        <p className="text-muted-foreground">Iata cum arati azi.</p>
      </div>

      {/* Health Score + Subscores */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center">
          <h2 className="text-lg font-semibold text-foreground mb-4">Artist Health Score</h2>
          <HealthScoreCircle score={healthScore?.overall_score || 0} />
          <p className="text-sm text-muted-foreground mt-3">
            {healthScore
              ? healthScore.overall_score >= 70
                ? 'Scor bun! Continua asa si focus pe zonele slabe.'
                : healthScore.overall_score >= 40
                ? 'Scor mediu. Urmeaza recomandarile pentru a creste.'
                : 'Scor scazut. Conecteaza mai multe platforme si posteaza constant.'
              : 'Scorul se calculeaza dupa prima colectare de date.'}
          </p>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Subscoruri</h2>
          {subscores.length > 0 ? (
            <div className="space-y-3">
              {subscores.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{s.label}</span>
                    <span className="text-muted-foreground">{s.value}/{s.max}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${(s.value / s.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Subscorurile se calculeaza dupa prima colectare de date.</p>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Followers', value: formatNumber(kpis.followers), icon: Users },
          { label: 'Engagement', value: `${kpis.engagement.toFixed(2)}%`, icon: Activity },
          { label: 'Total Views', value: formatNumber(kpis.views), icon: Eye },
          { label: 'Activitate', value: `${kpis.activity} posts`, icon: TrendingUp },
        ].map(k => (
          <div key={k.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Followers Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Followers per platforma</h2>
          <div className="flex gap-1">
            {['7d', '30d', '90d', '1y'].map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPeriod(p)}
              >
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
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              {activePlatforms.map(p => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={PLATFORM_COLORS[p] || '#888'}
                  strokeWidth={2}
                  dot={false}
                  name={p.charAt(0).toUpperCase() + p.slice(1)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Music className="h-10 w-10 mb-3" />
            <p className="text-sm">Inca nu sunt suficiente date. Asteapta colectarea zilnica.</p>
          </div>
        )}
      </div>

      {/* To-Do + Benchmark */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">To-Do zilnic</h2>
          <div className="space-y-3">
            {todos.map((t, i) => (
              <button
                key={i}
                onClick={() => toggleTodo(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                  completedTodos.has(i) ? 'bg-primary/5 line-through text-muted-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                  completedTodos.has(i) ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {completedTodos.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card p-6 relative overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground mb-4">Benchmark vs similari</h2>
          <div className={`space-y-3 ${profile?.plan === 'free' ? 'blur-sm select-none' : ''}`}>
            <div className="bg-muted rounded-xl p-3"><p className="text-sm text-foreground">Scor mediu gen: 68</p></div>
            <div className="bg-muted rounded-xl p-3"><p className="text-sm text-foreground">Top 10% engagement: 5.2%</p></div>
            <div className="bg-muted rounded-xl p-3"><p className="text-sm text-foreground">Crestere medie: +8%/luna</p></div>
          </div>
          {profile?.plan === 'free' && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm">
              <div className="text-center">
                <p className="font-semibold text-foreground mb-2">Disponibil in Pro</p>
                <Button size="sm" asChild><a href="/pricing">Upgrade</a></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
