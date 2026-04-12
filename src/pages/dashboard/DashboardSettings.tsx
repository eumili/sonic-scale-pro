import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { User, Globe, CreditCard, Bell, Loader2, ExternalLink, Upload, FileText, Download, X } from 'lucide-react';

const CAREER_STAGES = [
  { value: 'emerging', label: 'Emerging' },
  { value: 'rising', label: 'Rising' },
  { value: 'established', label: 'Established' },
  { value: 'star', label: 'Star' },
];

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Folk', 'Jazz', 'Classical', 'R&B', 'Latin', 'Country', 'Manele', 'Reggaeton',
];

interface Invoice { id: string; date: string; amount: string; status: string; pdf_url: string | null; hosted_url: string | null; }

export default function DashboardSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [notifications, setNotifications] = useState({ emailAlerts: true, weeklyDigest: true, platformAlerts: true, recommendations: false });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setArtistName(data.artist_name || '');
        setCareerStage(data.career_stage || '');
        if (data.genre) {
          const genres = typeof data.genre === 'string' ? data.genre.split(',').map((g: string) => g.trim()).filter(Boolean) : Array.isArray(data.genre) ? data.genre : [];
          setSelectedGenres(genres);
        }
        if (data.notification_preferences) setNotifications(prev => ({ ...prev, ...data.notification_preferences }));
      }
      setLoading(false);
    });
  }, [user]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      artist_name: artistName,
      career_stage: careerStage,
      genre: selectedGenres.join(', '),
    }).eq('id', user!.id);
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
    <div className="animate-fade-in space-y-4 sm:space-y-6 sparkle-container warm-gradient-top">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground relative z-10">Setări</h1>
      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6 relative z-10">
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="profile" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="hidden sm:inline">Profil</span><span className="sm:hidden">Profil</span></TabsTrigger>
          <TabsTrigger value="platforms" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="hidden sm:inline">Platforme</span><span className="sm:hidden">Platf.</span></TabsTrigger>
          <TabsTrigger value="billing" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3" onClick={loadInvoices}><CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span>Billing</span></TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 text-[10px] sm:text-sm px-2 sm:px-3"><Bell className="h-3 w-3 sm:h-3.5 sm:w-3.5" /><span className="hidden sm:inline">Notificări</span><span className="sm:hidden">Notif.</span></TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6 backdrop-blur-lg">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Profil artist</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Actualizează informațiile tale de profil.</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary shrink-0">
                {artistName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9"><Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Schimbă avatar</Button>
            </div>
            <div className="grid gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Nume artist</Label>
                <Input value={artistName} onChange={e => setArtistName(e.target.value)} className="bg-muted/30 h-9 sm:h-10 text-sm" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Email</Label>
                <Input value={user?.email || ''} disabled className="opacity-60 h-9 sm:h-10 text-sm" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Stadiu carieră</Label>
                <Select value={careerStage} onValueChange={setCareerStage}>
                  <SelectTrigger className="bg-muted/30 h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Alege stadiul" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREER_STAGES.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Gen muzical</Label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {GENRES.map(genre => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`inline-flex items-center gap-0.5 sm:gap-1 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-muted/40 text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground'
                        }`}
                      >
                        {genre}
                        {isSelected && <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                      </button>
                    );
                  })}
                </div>
                {selectedGenres.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{selectedGenres.join(', ')}</p>
                )}
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}Salvează</Button>
          </div>
        </TabsContent>

        <TabsContent value="platforms">
          <div className="glass-card p-4 sm:p-6 backdrop-blur-lg">
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Platforme conectate</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Gestionează platformele din pagina dedicată.</p>
            <Button asChild size="sm" className="h-8 sm:h-9 text-xs sm:text-sm"><Link to="/dashboard/platforms" className="gap-1.5 sm:gap-2"><Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Platforme <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></Link></Button>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-3 sm:space-y-4">
            <div className="glass-card p-4 sm:p-6 space-y-3 sm:space-y-4 backdrop-blur-lg">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Plan curent</h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">{(profile?.plan || 'free').toUpperCase()}</Badge>
                <span className="text-muted-foreground text-xs sm:text-sm">{profile?.plan === 'pro' ? '€19/lună' : profile?.plan === 'agency' ? '€49/lună' : 'Gratuit'}</span>
              </div>
              <div className="flex gap-2">
                {profile?.plan === 'free' && <Button asChild size="sm"><Link to="/pricing">Upgrade la Pro</Link></Button>}
                {profile?.plan !== 'free' && (
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={async () => {
                    try { const { data, error } = await supabase.functions.invoke('create-portal-session'); if (error) throw error; if (data?.url) window.location.href = data.url; }
                    catch (err: any) { toast({ title: 'Eroare', description: err.message || 'Nu s-a putut deschide portalul.', variant: 'destructive' }); }
                  }}>Gestionează subscripția</Button>
                )}
              </div>
            </div>
            <div className="glass-card p-4 sm:p-6 backdrop-blur-lg">
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Istoric facturi</h3>
              {profile?.plan === 'free' ? (
                <p className="text-xs sm:text-sm text-muted-foreground">Nicio factură — ești pe planul gratuit.</p>
              ) : invoicesLoading ? (
                <div className="flex items-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-xs sm:text-sm text-muted-foreground">Se încarcă...</span></div>
              ) : invoices.length === 0 && invoicesLoaded ? (
                <p className="text-xs sm:text-sm text-muted-foreground">Nicio factură găsită.</p>
              ) : invoices.length === 0 && !invoicesLoaded ? (
                <Button variant="outline" size="sm" onClick={loadInvoices} className="gap-2 text-xs sm:text-sm"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Încarcă facturile</Button>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs sm:text-sm min-w-[400px]">
                    <thead><tr className="border-b border-border/50 text-left"><th className="pb-2 text-muted-foreground font-medium">Nr.</th><th className="pb-2 text-muted-foreground font-medium">Data</th><th className="pb-2 text-muted-foreground font-medium">Sumă</th><th className="pb-2 text-muted-foreground font-medium">Status</th><th className="pb-2"></th></tr></thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id} className="border-b border-border/30">
                          <td className="py-2 text-foreground text-xs">{inv.id}</td>
                          <td className="py-2 text-muted-foreground text-xs">{inv.date}</td>
                          <td className="py-2 text-foreground text-xs">{inv.amount}</td>
                          <td className="py-2"><Badge variant="outline" className={`${inv.status === 'Plătit' ? 'text-success border-success/30' : 'text-primary border-primary/30'} text-[10px] sm:text-xs`}>{inv.status}</Badge></td>
                          <td className="py-2">{inv.pdf_url && <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></a>}</td>
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
          <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6 backdrop-blur-lg">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">Notificări</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Alege ce notificări vrei să primești.</p>
            </div>
            <div className="space-y-4 sm:space-y-5">
              {[
                { key: 'emailAlerts', label: 'Alerte email', desc: 'Alerte la schimbări importante.' },
                { key: 'weeklyDigest', label: 'Rezumat săptămânal', desc: 'Email săptămânal cu performanța ta.' },
                { key: 'platformAlerts', label: 'Alerte platformă', desc: 'Notificări schimbări algoritm.' },
                { key: 'recommendations', label: 'Recomandări AI', desc: 'Recomandări personalizate pe email.' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={(notifications as any)[item.key]} onCheckedChange={v => setNotifications(prev => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
            </div>
            <Button onClick={saveNotifications} disabled={savingNotifications} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">{savingNotifications && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}Salvează preferințe</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
