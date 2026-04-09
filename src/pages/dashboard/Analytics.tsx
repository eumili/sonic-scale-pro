import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Loader2, TrendingUp, Users, Eye, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

type Period = '7d' | '30d' | '90d';

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#EF4444',
  spotify: '#22C55E',
  instagram: '#EC4899',
  tiktok: '#A78BFA',
  apple_music: '#F472B6',
};

interface MetricRow {
  metric_date: string;
  platform: string;
  followers: number;
  new_followers_today: number;
  engagement_rate: number;
  total_views: number;
  posts_count: number;
  videos_count: number;
  subscribers: number;
  monthly_listeners: number;
  total_plays: number;
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
    supabase
      .from('metrics_daily')
      .select('*')
      .eq('user_id', user.id)
      .gte('metric_date', since.toISOString().split('T')[0])
      .order('metric_date', { ascending: true })
      .then(({ data }) => {
        setMetrics(data || []);
        setLoading(false);
      });
  }, [user, period]);

  const isProGated = period === '90d' && userPlan === 'free';

  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    metrics.forEach(m => {
      if (!byDate[m.metric_date]) byDate[m.metric_date] = { date: new Date(m.metric_date).getTime() as any };
      (byDate[m.metric_date] as any).date = m.metric_date;
      byDate[m.metric_date][`${m.platform}_followers`] = m.followers;
      byDate[m.metric_date][`${m.platform}_engagement`] = m.engagement_rate;
      byDate[m.metric_date][`${m.platform}_views`] = m.total_views;
    });
    return Object.values(byDate);
  }, [metrics]);

  const activePlatforms = useMemo(() => {
    return [...new Set(metrics.map(m => m.platform))];
  }, [metrics]);

  const totals = useMemo(() => {
    if (metrics.length === 0) return { followers: 0, engagement: 0, views: 0, posts: 0 };
    const latest: Record<string, MetricRow> = {};
    metrics.forEach(m => {
      const key = m.platform;
      if (!latest[key] || m.metric_date > latest[key].metric_date) latest[key] = m;
    });
    const vals = Object.values(latest);
    return {
      followers: vals.reduce((s, v) => s + (v.followers || 0), 0),
      engagement: vals.length ? vals.reduce((s, v) => s + (v.engagement_rate || 0), 0) / vals.length : 0,
      views: vals.reduce((s, v) => s + (v.total_views || 0), 0),
      posts: vals.reduce((s, v) => s + (v.posts_count || 0), 0),
    };
  }, [metrics]);

  if (isProGated) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-4">Analytics</h1>
        <Tabs value={period} onValueChange={v => setPeriod(v as Period)} className="mb-6">
          <TabsList>
            <TabsTrigger value="7d">7 zile</TabsTrigger>
            <TabsTrigger value="30d">30 zile</TabsTrigger>
            <TabsTrigger value="90d">90 zile</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="glass-card p-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Analytics pe 90 de zile — disponibil in Pro</h2>
          <p className="text-muted-foreground mb-4">Upgrade pentru a vedea tendinte pe termen lung.</p>
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
          <TabsList>
            <TabsTrigger value="7d">7 zile</TabsTrigger>
            <TabsTrigger value="30d">30 zile</TabsTrigger>
            <TabsTrigger value="90d">90 zile</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Followers', value: totals.followers.toLocaleString(), icon: Users, color: 'text-primary' },
          { label: 'Engagement Mediu', value: `${totals.engagement.toFixed(2)}%`, icon: TrendingUp, color: 'text-orange-400' },
          { label: 'Total Views', value: totals.views.toLocaleString(), icon: Eye, color: 'text-blue-400' },
          { label: 'Postari', value: totals.posts.toLocaleString(), icon: BarChart3, color: 'text-purple-400' },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Inca nu sunt date</h2>
          <p className="text-muted-foreground">Conecteaza platforme si asteapta primul audit zilnic.</p>
        </div>
      ) : (
        <>
          {/* Followers Chart */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Evolutie Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  {activePlatforms.map(p => (
                    <Area
                      key={p}
                      type="monotone"
                      dataKey={`${p}_followers`}
                      stroke={PLATFORM_COLORS[p] || '#888'}
                      fill={PLATFORM_COLORS[p] || '#888'}
                      fillOpacity={0.1}
                      name={`${p} followers`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Chart */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Engagement Rate (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  {activePlatforms.map(p => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={`${p}_engagement`}
                      stroke={PLATFORM_COLORS[p] || '#888'}
                      strokeWidth={2}
                      dot={false}
                      name={`${p} engagement`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Reach Chart */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Views per platforma</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  {activePlatforms.map(p => (
                    <Bar key={p} dataKey={`${p}_views`} fill={PLATFORM_COLORS[p] || '#888'} name={`${p} views`} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
