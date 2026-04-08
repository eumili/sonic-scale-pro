import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { User, Globe, CreditCard, Bell, Loader2, ExternalLink, Upload } from 'lucide-react';

export default function DashboardSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: true,
    platformAlerts: true,
    recommendations: false,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setArtistName(data.artist_name || '');
      }
      setLoading(false);
    });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ artist_name: artistName }).eq('id', user!.id);
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profil salvat!' });
    }
    setSaving(false);
  };

  const mockInvoices = [
    { id: 'INV-001', date: '2024-12-01', amount: '€19.00', status: 'Platit' },
    { id: 'INV-002', date: '2024-11-01', amount: '€19.00', status: 'Platit' },
    { id: 'INV-003', date: '2024-10-01', amount: '€19.00', status: 'Platit' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Setari</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" /> Profil
          </TabsTrigger>
          <TabsTrigger value="platforms" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" /> Platforme
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5" /> Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" /> Notificari
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Profil artist</CardTitle>
              <CardDescription>Actualizeaza informatiile tale de profil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {artistName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-3.5 w-3.5" /> Schimba avatar
                </Button>
              </div>
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>Nume artist</Label>
                  <Input value={artistName} onChange={e => setArtistName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Gen muzical</Label>
                  <Input value={profile?.genre || ''} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Stadiu cariera</Label>
                  <Input value={profile?.career_stage || ''} disabled className="opacity-60" />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salveaza
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Platforme conectate</CardTitle>
              <CardDescription>Gestioneaza platformele din pagina dedicata.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/dashboard/platforms" className="gap-2">
                  <Globe className="h-4 w-4" /> Mergi la Platforme
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Plan curent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">
                    {(profile?.plan || 'free').toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {profile?.plan === 'pro' ? '€19/luna' : profile?.plan === 'agency' ? '€49/luna' : 'Gratuit'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {profile?.plan === 'free' && (
                    <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
                  )}
              {profile?.plan !== 'free' && (
                    <Button variant="outline" onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('create-portal-session');
                        if (error) throw error;
                        if (data?.url) window.location.href = data.url;
                      } catch (err: any) {
                        toast({ title: 'Eroare', description: err.message || 'Nu s-a putut deschide portalul.', variant: 'destructive' });
                      }
                    }}>
                      Gestioneaza subscriptia
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Istoric facturi</CardTitle>
              </CardHeader>
              <CardContent>
                {profile?.plan === 'free' ? (
                  <p className="text-sm text-muted-foreground">Nicio factura — esti pe planul gratuit.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left">
                          <th className="pb-2 text-muted-foreground font-medium">ID</th>
                          <th className="pb-2 text-muted-foreground font-medium">Data</th>
                          <th className="pb-2 text-muted-foreground font-medium">Suma</th>
                          <th className="pb-2 text-muted-foreground font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockInvoices.map(inv => (
                          <tr key={inv.id} className="border-b border-border/30">
                            <td className="py-2.5 text-foreground">{inv.id}</td>
                            <td className="py-2.5 text-muted-foreground">{inv.date}</td>
                            <td className="py-2.5 text-foreground">{inv.amount}</td>
                            <td className="py-2.5">
                              <Badge variant="outline" className="text-primary border-primary/30 text-xs">{inv.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Notificari</CardTitle>
              <CardDescription>Alege ce notificari vrei sa primesti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: 'emailAlerts', label: 'Alerte email', desc: 'Primeste alerte cand apar schimbari importante.' },
                { key: 'weeklyDigest', label: 'Rezumat saptamanal', desc: 'Primeste un email saptamanal cu performanta ta.' },
                { key: 'platformAlerts', label: 'Alerte platforma', desc: 'Notificari la schimbari de algoritm.' },
                { key: 'recommendations', label: 'Recomandari AI', desc: 'Primeste recomandari personalizate pe email.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(notifications as any)[item.key]}
                    onCheckedChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
              <Button onClick={() => toast({ title: 'Preferinte salvate!' })}>Salveaza preferinte</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
