import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { User, Globe, CreditCard, Bell, Loader2, ExternalLink, Upload, FileText, Download } from 'lucide-react';

interface Invoice { id: string; date: string; amount: string; status: string; pdf_url: string | null; hosted_url: string | null; }

export default function DashboardSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [notifications, setNotifications] = useState({ emailAlerts: true, weeklyDigest: true, platformAlerts: true, recommendations: false });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) { setProfile(data); setArtistName(data.artist_name || ''); if (data.notification_preferences) setNotifications(prev => ({ ...prev, ...data.notification_preferences })); }
      setLoading(false);
    });
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ artist_name: artistName }).eq('id', user!.id);
    toast(error ? { title: 'Eroare', description: error.message, variant: 'destructive' } : { title: 'Profil salvat!' });
    setSaving(false);
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    const { error } = await supabase.from('profiles').update({ notification_preferences: notifications }).eq('id', user!.id);
    toast(error ? { title: 'Eroare', description: error.message, variant: 'destructive' } : { title: 'Preferințe salvate!' });
    setSavingNotifications(false);
  };

  const loadInvoices = async () => {
    if (invoicesLoaded || invoicesLoading || !profile || profile.plan === 'free') return;
    setInvoicesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-invoices');
      if (error) throw error;
      setInvoices(data?.invoices || []);
    } catch (err: any) { toast({ title: 'Eroare la încărcarea facturilor', description: err.message, variant: 'destructive' }); }
    setInvoicesLoading(false); setInvoicesLoaded(true);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Setări</h1>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm"><User className="h-3.5 w-3.5" /> Profil</TabsTrigger>
          <TabsTrigger value="platforms" className="gap-1.5 text-xs sm:text-sm"><Globe className="h-3.5 w-3.5" /> Platforme</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm" onClick={loadInvoices}><CreditCard className="h-3.5 w-3.5" /> Billing</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm"><Bell className="h-3.5 w-3.5" /> Notificări</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Profil artist</h3>
              <p className="text-sm text-muted-foreground">Actualizează informațiile tale de profil.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
                {artistName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <Button variant="outline" size="sm" className="gap-2"><Upload className="h-3.5 w-3.5" /> Schimbă avatar</Button>
            </div>
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2"><Label>Nume artist</Label><Input value={artistName} onChange={e => setArtistName(e.target.value)} className="bg-muted/30" /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ''} disabled className="opacity-60" /></div>
              <div className="space-y-2"><Label>Gen muzical</Label><Input value={profile?.genre || ''} disabled className="opacity-60" /></div>
              <div className="space-y-2"><Label>Stadiu carieră</Label><Input value={profile?.career_stage || ''} disabled className="opacity-60" /></div>
            </div>
            <Button onClick={saveProfile} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvează</Button>
          </div>
        </TabsContent>

        <TabsContent value="platforms">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-foreground mb-1">Platforme conectate</h3>
            <p className="text-sm text-muted-foreground mb-4">Gestionează platformele din pagina dedicată.</p>
            <Button asChild><Link to="/dashboard/platforms" className="gap-2"><Globe className="h-4 w-4" /> Mergi la Platforme <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Plan curent</h3>
              <div className="flex items-center gap-3">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">{(profile?.plan || 'free').toUpperCase()}</Badge>
                <span className="text-muted-foreground text-sm">{profile?.plan === 'pro' ? '€19/lună' : profile?.plan === 'agency' ? '€49/lună' : 'Gratuit'}</span>
              </div>
              <div className="flex gap-2">
                {profile?.plan === 'free' && <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>}
                {profile?.plan !== 'free' && (
                  <Button variant="outline" onClick={async () => {
                    try { const { data, error } = await supabase.functions.invoke('create-portal-session'); if (error) throw error; if (data?.url) window.location.href = data.url; }
                    catch (err: any) { toast({ title: 'Eroare', description: err.message || 'Nu s-a putut deschide portalul.', variant: 'destructive' }); }
                  }}>Gestionează subscripția</Button>
                )}
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold text-foreground mb-4">Istoric facturi</h3>
              {profile?.plan === 'free' ? (
                <p className="text-sm text-muted-foreground">Nicio factură — ești pe planul gratuit.</p>
              ) : invoicesLoading ? (
                <div className="flex items-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Se încarcă facturile din Stripe...</span></div>
              ) : invoices.length === 0 && invoicesLoaded ? (
                <p className="text-sm text-muted-foreground">Nicio factură găsită.</p>
              ) : invoices.length === 0 && !invoicesLoaded ? (
                <Button variant="outline" size="sm" onClick={loadInvoices} className="gap-2"><FileText className="h-4 w-4" /> Încarcă facturile</Button>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border/50 text-left"><th className="pb-2 text-muted-foreground font-medium">Nr.</th><th className="pb-2 text-muted-foreground font-medium">Data</th><th className="pb-2 text-muted-foreground font-medium">Sumă</th><th className="pb-2 text-muted-foreground font-medium">Status</th><th className="pb-2"></th></tr></thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-border/30">
                          <td className="py-2.5 text-foreground">{inv.id}</td>
                          <td className="py-2.5 text-muted-foreground">{inv.date}</td>
                          <td className="py-2.5 text-foreground">{inv.amount}</td>
                          <td className="py-2.5"><Badge variant="outline" className={inv.status === 'Plătit' ? 'text-success border-success/30 text-xs' : 'text-primary border-primary/30 text-xs'}>{inv.status}</Badge></td>
                          <td className="py-2.5">{inv.pdf_url && <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Download className="h-4 w-4" /></a>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Notificări</h3>
              <p className="text-sm text-muted-foreground">Alege ce notificări vrei să primești.</p>
            </div>
            <div className="space-y-5">
              {[
                { key: 'emailAlerts', label: 'Alerte email', desc: 'Primește alerte când apar schimbări importante.' },
                { key: 'weeklyDigest', label: 'Rezumat săptămânal', desc: 'Primește un email săptămânal cu performanța ta.' },
                { key: 'platformAlerts', label: 'Alerte platformă', desc: 'Notificări la schimbări de algoritm.' },
                { key: 'recommendations', label: 'Recomandări AI', desc: 'Primește recomandări personalizate pe email.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <Switch checked={(notifications as any)[item.key]} onCheckedChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
            </div>
            <Button onClick={saveNotifications} disabled={savingNotifications}>{savingNotifications && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvează preferințe</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
