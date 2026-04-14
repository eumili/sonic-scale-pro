import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Music2, Youtube, Music, Instagram, Video, Headphones, Loader2 } from 'lucide-react';

const genres = ['Pop', 'Hip-Hop/Rap', 'Rock', 'Electronic', 'R&B', 'Jazz', 'Classical', 'Folk', 'Manele', 'Altele'];
const stages = [
  { value: 'starting', label: 'Just starting' },
  { value: 'emerging', label: 'Emerging' },
  { value: 'growing', label: 'Growing' },
  { value: 'established', label: 'Established' },
];

const platforms = [
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@canal' },
  { key: 'spotify', label: 'Spotify', icon: Music, placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'tiktok', label: 'TikTok', icon: Video, placeholder: 'https://tiktok.com/@username' },
  { key: 'soundcloud', label: 'SoundCloud', icon: Headphones, placeholder: 'https://soundcloud.com/username' },
];

const auditMessages = [
  'Analizăm profilul YouTube...', 'Verificăm Spotify...', 'Scanăm Instagram...',
  'Procesăm TikTok...', 'Calculăm Health Score...', 'Generăm recomandări...',
  'Comparăm cu artiști similari...', 'Finalizare audit...',
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [platformUrls, setPlatformUrls] = useState<Record<string, string>>({});
  const [auditMsgIdx, setAuditMsgIdx] = useState(0);

  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setAuditMsgIdx(prev => (prev + 1) % auditMessages.length);
      }, 4000);
      const timeout = setTimeout(() => {
        setStep(4);
      }, 30000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [step]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      artist_name: artistName,
      genre,
      career_stage: careerStage,
      plan: 'free',
      plan_status: 'active',
    });
  };

  const savePlatforms = async () => {
    if (!user) return;
    const rows = Object.entries(platformUrls)
      .filter(([, url]) => url.trim())
      .map(([platform, url]) => ({
        user_id: user.id,
        platform,
        platform_url: url.trim(),
        is_active: true,
      }));
    if (rows.length > 0) {
      await supabase.from('artist_platforms').upsert(rows, { onConflict: 'user_id,platform' });
    }
  };

  const handleStep1Next = async () => {
    await saveProfile();
    setStep(2);
  };

  const handleStep2Next = async () => {
    await savePlatforms();
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 dark sparkle-container warm-gradient-top">
      <div className="flex items-center gap-2 mb-8 relative z-10">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center glow-primary">
          <Music2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground">ArtistPulse</span>
      </div>

      <div className="w-full max-w-lg mb-8 relative z-10">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary glow-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">Pasul {step} din 4</p>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {step === 1 && (
          <div className="glass-card p-6 space-y-4 animate-fade-in backdrop-blur-lg">
            <h2 className="text-xl font-bold text-foreground">Spune-ne despre tine</h2>
            <div className="space-y-2">
              <Label>Numele de artist</Label>
              <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Numele tău de scenă" className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>Gen muzical</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Alege genul" /></SelectTrigger>
                <SelectContent>
                  {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stadiul carierei</Label>
              <Select value={careerStage} onValueChange={setCareerStage}>
                <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Unde ești acum" /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStep1Next} className="w-full" disabled={!artistName || !genre || !careerStage}>
              Continuă
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="glass-card p-6 space-y-4 animate-fade-in backdrop-blur-lg">
            <h2 className="text-xl font-bold text-foreground">Conectează-ți platformele</h2>
            <p className="text-sm text-muted-foreground">Adaugă URL-urile profilurilor tale (minim 1).</p>
            {platforms.map(p => (
              <div key={p.key} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <p.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder={p.placeholder}
                  value={platformUrls[p.key] || ''}
                  onChange={e => setPlatformUrls(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className="flex-1 bg-muted/30"
                />
                {platformUrls[p.key]?.trim() && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>
            ))}
            <Button
              onClick={handleStep2Next}
              className="w-full"
              disabled={!Object.values(platformUrls).some(u => u.trim())}
            >
              Rulează auditul
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="glass-card p-8 text-center animate-fade-in backdrop-blur-lg">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-foreground mb-2">Rulăm auditul...</h2>
            <p className="text-muted-foreground animate-pulse">{auditMessages[auditMsgIdx]}</p>
          </div>
        )}

        {step === 4 && (
          <div className="glass-card p-6 text-center animate-fade-in backdrop-blur-lg">
            <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
              <span className="text-2xl font-bold text-primary-foreground">72</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Artist Health Score</h2>
            <p className="text-muted-foreground text-sm mb-6">Ai un scor bun! Dar poți crește.</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-2xl font-bold text-foreground">1.2K</p>
                <p className="text-xs text-muted-foreground">Total followers</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-2xl font-bold text-foreground">3.4%</p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-2xl font-bold text-foreground">+12%</p>
                <p className="text-xs text-muted-foreground">Creștere luna</p>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Mergi la Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}