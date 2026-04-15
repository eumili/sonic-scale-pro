import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, TrendingDown, CreditCard, Search, Loader2, ShieldAlert, Music2, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserRow {
  id: string;
  artist_name: string | null;
  genre: string | null;
  plan: string | null;
  plan_status: string | null;
  created_at: string;
}

interface AdminMetrics {
  computed_at: string;
  live: {
    total_users: number;
    free_users: number;
    pro_users: number;
    agency_users: number;
    new_users_7d: number;
    churned_users: number;
    ai_conversations_today: number;
    mrr_eur: number;
    arr_eur: number;
  };
  users: UserRow[];
}

type State =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AdminMetrics };

export default function Admin() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-admin-metrics');
        if (cancelled) return;
        if (error) {
          // Supabase wraps non-2xx as error; check status
          const status = (error as { context?: { status?: number } })?.context?.status;
          if (status === 403) return setState({ status: 'forbidden' });
          return setState({ status: 'error', message: error.message || 'Eroare la încărcare' });
        }
        if (!data) return setState({ status: 'error', message: 'Răspuns gol' });
        setState({ status: 'ready', data });
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: (e as Error).message });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state.status === 'forbidden') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Acces interzis</h1>
        <p className="text-muted-foreground">Această pagină este doar pentru administratori.</p>
        <Button asChild variant="outline"><Link to="/dashboard">Înapoi la Dashboard</Link></Button>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Eroare</h1>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button asChild variant="outline"><Link to="/dashboard">Înapoi la Dashboard</Link></Button>
      </div>
    );
  }

  const { live, users } = state.data;

  const filteredUsers = users.filter(u =>
    (u.artist_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.genre || '').toLowerCase().includes(search.toLowerCase())
  );

  const recentSignups = users.filter(u => {
    const d = new Date(u.created_at);
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return d >= week;
  });

  const kpis = [
    { label: 'Total Users', value: live.total_users, icon: Users },
    { label: 'MRR', value: `€${live.mrr_eur}`, icon: DollarSign },
    { label: 'Active Subs', value: live.pro_users + live.agency_users, icon: CreditCard },
    { label: 'AI mesaje azi', value: live.ai_conversations_today, icon: Activity },
    { label: 'Noi (7 zile)', value: live.new_users_7d, icon: Users },
    { label: 'Churn', value: live.churned_users, icon: TrendingDown },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      <header className="border-b border-border/50 bg-card/30 px-6 py-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center"><Music2 className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-bold text-foreground">ArtistPulse</span>
        </Link>
        <Badge variant="outline" className="text-destructive border-destructive/30 animate-pulse">ADMIN</Badge>
        <div className="ml-auto"><Button variant="ghost" size="sm" asChild><Link to="/dashboard">Dashboard</Link></Button></div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6 sparkle-container warm-gradient-top">
        <div className="flex items-end justify-between relative z-10">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Calculat: {new Date(state.data.computed_at).toLocaleString('ro-RO')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
          {kpis.map(kpi => (
            <div key={kpi.label} className="glass-card p-4 backdrop-blur-lg">
              <div className="flex items-center gap-2 mb-1"><kpi.icon className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">{kpi.label}</span></div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Utilizatori ({filteredUsers.length}/{users.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută artist sau gen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted/30" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50 text-left">
                <th className="pb-2 text-muted-foreground font-medium">Artist</th>
                <th className="pb-2 text-muted-foreground font-medium">Gen</th>
                <th className="pb-2 text-muted-foreground font-medium">Plan</th>
                <th className="pb-2 text-muted-foreground font-medium">Status</th>
                <th className="pb-2 text-muted-foreground font-medium">Înregistrat</th>
              </tr></thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-border/30">
                    <td className="py-2.5 text-foreground font-medium">{u.artist_name || '—'}</td>
                    <td className="py-2.5 text-muted-foreground">{u.genre || '—'}</td>
                    <td className="py-2.5">
                      <Badge variant="outline" className={u.plan === 'pro' ? 'text-primary border-primary/30' : u.plan === 'agency' ? 'text-blue-400 border-blue-400/30' : 'text-muted-foreground'}>
                        {(u.plan || 'free').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs ${u.plan_status === 'active' ? 'text-success' : u.plan_status === 'past_due' ? 'text-yellow-500' : u.plan_status === 'canceled' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {u.plan_status || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('ro-RO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6 relative z-10">
          <h3 className="text-base font-semibold text-foreground mb-4">Înregistrări recente (ultimele 7 zile)</h3>
          {recentSignups.length === 0 ? <p className="text-sm text-muted-foreground">Nicio înregistrare nouă.</p> : (
            <div className="space-y-2">
              {recentSignups.slice(0, 10).map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div><p className="text-sm font-medium text-foreground">{u.artist_name || 'Anonim'}</p><p className="text-xs text-muted-foreground">{u.genre || 'Fără gen'}</p></div>
                  <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('ro-RO')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
