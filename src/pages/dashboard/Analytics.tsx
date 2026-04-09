import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Loader2, TrendingUp, Users, Eye, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

type Period = '7d' | '30d' | '90d';

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444', spotify: '#22C55E', instagram: '#EC4899', tiktok: '#A78BFA', apple_music: '#F472B6',
};

interface MetricRow {
  metric_date: string; platform: string; followers: number; new_followers_today: number;
  engagement_rate: number; total_views: number; posts_count: number; videos_count: number;
  subscribers: number; monthly_listeners: number; total_plays: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('7d');
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data }) => {
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
      .then(({ data }) => { setMetrics(data || []); setLoading(false); });
  }, [user, period]);

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

  const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' };

  if (isProGated) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList><TabsTrigger value="7d">7 zile</TabsTrigger><TabsTrigger value="30d">30 zile</TabsTrigger><TabsTrigger value="90d">90 zile</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <div className="glass-card p-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Analytics pe 90 de zile — disponibil în Pro</h2>
          <p className="text-muted-foreground mb-4">Upgrade pentru a vedea tendințe pe termen lung.</p>
          <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
          <TabsList><TabsTrigger value="7d">7 zile</TabsTrigger><TabsTrigger value="30d">30 zile</TabsTrigger><TabsTrigger value="90d">90 zile</TabsTrigger></TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Followers', value: totals.followers.toLocaleString(), icon: Users },
          { label: 'Engagement Mediu', value: `${totals.engagement.toFixed(2)}%`, icon: TrendingUp },
          { label: 'Total Views', value: totals.views.toLocaleString(), icon: Eye },
          { label: 'Postări', value: totals.posts.toLocaleString(), icon: BarChart3 },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : metrics.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Încă nu sunt date</h2>
          <p className="text-muted-foreground">Conectează platforme și așteaptă primul audit zilnic.</p>
        </div>
      ) : (
        <>
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Evoluție Followers</h3>
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
            <h3 className="text-base font-semibold text-foreground mb-4">Views per platformă</h3>
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
        </>
      )}
    </div>
  );
}
