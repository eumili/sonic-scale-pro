import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, TrendingDown, CreditCard, Search, Loader2, ShieldAlert, Music2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

interface ProfileRow {
  id: string;
  artist_name: string | null;
  genre: string | null;
  plan: string | null;
  created_at: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      if (data && data.length > 0) {
        setIsAdmin(true);
      } else {
        // Fallback: check profiles for legacy role field
        supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data: profile }) => {
          // Only allow if user_roles has admin, deny otherwise
          setIsAdmin(false);
        });
      }
    });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from('profiles')
      .select('id, artist_name, genre, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setUsers(data);
        setLoading(false);
      });
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Acces interzis</h1>
        <p className="text-muted-foreground">Aceasta pagina este doar pentru administratori.</p>
        <Button asChild variant="outline"><Link to="/dashboard">Inapoi la Dashboard</Link></Button>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    (u.artist_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.genre || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'pro').length;
  const agencyUsers = users.filter(u => u.plan === 'agency').length;
  const mrr = proUsers * 19 + agencyUsers * 49;
  const recentSignups = users.filter(u => {
    const d = new Date(u.created_at);
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return d >= week;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 px-6 py-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Music2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">ArtistPulse</span>
        </Link>
        <Badge variant="outline" className="text-destructive border-destructive/30">ADMIN</Badge>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Dashboard</Link></Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
            { label: 'MRR', value: `€${mrr}`, icon: DollarSign, color: 'text-green-400' },
            { label: 'Churn Rate', value: '2.1%', icon: TrendingDown, color: 'text-orange-400' },
            { label: 'Active Subs', value: proUsers + agencyUsers, icon: CreditCard, color: 'text-blue-400' },
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

        {/* Users Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Utilizatori ({filteredUsers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cauta artist sau gen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left">
                      <th className="pb-2 text-muted-foreground font-medium">Artist</th>
                      <th className="pb-2 text-muted-foreground font-medium">Gen</th>
                      <th className="pb-2 text-muted-foreground font-medium">Plan</th>
                      <th className="pb-2 text-muted-foreground font-medium">Inregistrat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border/30">
                        <td className="py-2.5 text-foreground font-medium">{u.artist_name || '—'}</td>
                        <td className="py-2.5 text-muted-foreground">{u.genre || '—'}</td>
                        <td className="py-2.5">
                          <Badge variant="outline" className={
                            u.plan === 'pro' ? 'text-primary border-primary/30' :
                            u.plan === 'agency' ? 'text-blue-400 border-blue-400/30' :
                            'text-muted-foreground'
                          }>
                            {(u.plan || 'free').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('ro-RO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Inregistrari recente (ultimele 7 zile)</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nicio inregistrare noua.</p>
            ) : (
              <div className="space-y-2">
                {recentSignups.slice(0, 10).map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.artist_name || 'Anonim'}</p>
                      <p className="text-xs text-muted-foreground">{u.genre || 'Fara gen'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('ro-RO')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
