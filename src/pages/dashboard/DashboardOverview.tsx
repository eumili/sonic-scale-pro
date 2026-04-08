import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Activity, Zap, Check } from 'lucide-react';
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

const mockChartData = [
  { date: '1 Ian', youtube: 450, spotify: 1200, instagram: 800, tiktok: 300 },
  { date: '8 Ian', youtube: 470, spotify: 1250, instagram: 830, tiktok: 350 },
  { date: '15 Ian', youtube: 500, spotify: 1300, instagram: 900, tiktok: 400 },
  { date: '22 Ian', youtube: 520, spotify: 1380, instagram: 950, tiktok: 480 },
  { date: '29 Ian', youtube: 550, spotify: 1450, instagram: 1020, tiktok: 550 },
  { date: '5 Feb', youtube: 580, spotify: 1520, instagram: 1080, tiktok: 620 },
  { date: '12 Feb', youtube: 610, spotify: 1600, instagram: 1150, tiktok: 700 },
];

const subscores = [
  { label: 'Consistenta', value: 78, max: 100 },
  { label: 'Crestere', value: 65, max: 100 },
  { label: 'Engagement', value: 82, max: 100 },
  { label: 'Reach', value: 58, max: 100 },
  { label: 'Momentum', value: 71, max: 100 },
];

const kpis = [
  { label: 'Total Reach', value: '4.2K', change: '+12%', icon: Users },
  { label: 'Engagement', value: '3.8%', change: '+0.5%', icon: Activity },
  { label: 'Activitate', value: '12 posts', change: '+3', icon: TrendingUp },
  { label: 'Momentum', value: '71/100', change: '+5', icon: Zap },
];

const todos = [
  'Posteaza un Instagram Reel azi',
  'Raspunde la comentariile de pe YouTube',
  'Actualizeaza bio-ul pe Spotify',
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [period, setPeriod] = useState('30d');
  const [completedTodos, setCompletedTodos] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) setProfile(data);
      });
    }
  }, [user]);

  const toggleTodo = (idx: number) => {
    setCompletedTodos(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

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
          <HealthScoreCircle score={72} />
          <p className="text-sm text-muted-foreground mt-3">Scor bun! Focus pe Reach si Crestere.</p>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Subscoruri</h2>
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            <span className="text-xs text-primary">{k.change}</span>
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
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockChartData}>
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
            <Line type="monotone" dataKey="youtube" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="spotify" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="instagram" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tiktok" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
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
          <div className="space-y-3 blur-sm select-none">
            <div className="bg-muted rounded-xl p-3"><p className="text-sm text-foreground">Scor mediu gen: 68</p></div>
            <div className="bg-muted rounded-xl p-3"><p className="text-sm text-foreground">Top 10% engagement: 5.2%</p></div>
            <div className="bg-muted rounded-xl p-3"><p className="text-sm text-foreground">Crestere medie: +8%/luna</p></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm">
            <div className="text-center">
              <p className="font-semibold text-foreground mb-2">Disponibil in Pro</p>
              <Button size="sm" asChild><a href="/pricing">Upgrade</a></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
