import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Music, Youtube, Instagram, Music2, Headphones, Link2, Unlink, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';

interface PlatformConfig {
  key: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  oauth: boolean;
  placeholder: string;
}

const platforms: PlatformConfig[] = [
  { key: 'youtube', name: 'YouTube', icon: <Youtube className="h-6 w-6" />, color: 'text-red-500', oauth: true, placeholder: 'https://youtube.com/@canal' },
  { key: 'spotify', name: 'Spotify', icon: <Music className="h-6 w-6" />, color: 'text-green-500', oauth: true, placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'instagram', name: 'Instagram', icon: <Instagram className="h-6 w-6" />, color: 'text-pink-500', oauth: true, placeholder: 'https://instagram.com/username' },
  { key: 'tiktok', name: 'TikTok', icon: <Music2 className="h-6 w-6" />, color: 'text-foreground', oauth: true, placeholder: 'https://tiktok.com/@username' },
  { key: 'apple_music', name: 'Apple Music', icon: <Headphones className="h-6 w-6" />, color: 'text-pink-400', oauth: false, placeholder: 'https://music.apple.com/artist/...' },
];

interface ConnectedPlatform {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
}

export default function Platforms() {
  const { user } = useAuth();
  const [connected, setConnected] = useState<ConnectedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('artist_platforms')
      .select('id, platform, platform_url, is_active')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setConnected(data.map(d => ({ ...d, url: d.platform_url })));
        setLoading(false);
      });
  }, [user]);

  const isConnected = (key: string) => connected.find(c => c.platform === key && c.is_active);

  const handleConnect = async (platform: PlatformConfig) => {
    if (platform.oauth) {
      // For OAuth platforms, simulate connecting (real OAuth would redirect)
      const url = urls[platform.key];
      if (!url) {
        toast({ title: 'Introdu URL-ul profilului', variant: 'destructive' });
        return;
      }
      setSaving(platform.key);
      const { error } = await supabase.from('artist_platforms').upsert({
        user_id: user!.id,
        platform: platform.key,
        platform_url: url,
        is_active: true,
      }, { onConflict: 'user_id,platform' });

      if (error) {
        // If upsert with onConflict fails, try insert
        const { error: insertError } = await supabase.from('artist_platforms').insert({
          user_id: user!.id,
          platform: platform.key,
          platform_url: url,
          is_active: true,
        });
        if (insertError) {
          toast({ title: 'Eroare la conectare', description: insertError.message, variant: 'destructive' });
          setSaving(null);
          return;
        }
      }

      setConnected(prev => [...prev.filter(c => c.platform !== platform.key), { id: '', platform: platform.key, url, is_active: true }]);
      toast({ title: `${platform.name} conectat cu succes!` });
      setSaving(null);
    } else {
      // Manual URL entry for Apple Music
      const url = urls[platform.key];
      if (!url) {
        toast({ title: 'Introdu URL-ul profilului', variant: 'destructive' });
        return;
      }
      setSaving(platform.key);
      const { error } = await supabase.from('artist_platforms').insert({
        user_id: user!.id,
        platform: platform.key,
        platform_url: url,
        is_active: true,
      });
      if (error) {
        toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
        setSaving(null);
        return;
      }
      setConnected(prev => [...prev, { id: '', platform: platform.key, url, is_active: true }]);
      toast({ title: `${platform.name} conectat!` });
      setSaving(null);
    }
  };

  const handleDisconnect = async (platformKey: string) => {
    setSaving(platformKey);
    await supabase
      .from('artist_platforms')
      .update({ is_active: false })
      .eq('user_id', user!.id)
      .eq('platform', platformKey);
    setConnected(prev => prev.map(c => c.platform === platformKey ? { ...c, is_active: false } : c));
    toast({ title: 'Platforma deconectata' });
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platforme conectate</h1>
        <p className="text-muted-foreground mt-1">Conecteaza-ti conturile pentru a primi analytics si recomandari personalizate.</p>
      </div>

      <div className="grid gap-4">
        {platforms.map(platform => {
          const conn = isConnected(platform.key);
          return (
            <div key={platform.key} className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`${platform.color} shrink-0`}>{platform.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{platform.name}</span>
                  {conn ? (
                    <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Conectat
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">Deconectat</Badge>
                  )}
                </div>
                {conn ? (
                  <p className="text-sm text-muted-foreground truncate">{conn.url || connected.find(c => c.platform === platform.key)?.url}</p>
                ) : (
                  <Input
                    placeholder={platform.placeholder}
                    value={urls[platform.key] || ''}
                    onChange={e => setUrls(prev => ({ ...prev, [platform.key]: e.target.value }))}
                    className="mt-1 max-w-md bg-background/50"
                  />
                )}
              </div>
              <div className="shrink-0">
                {conn ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(platform.key)}
                    disabled={saving === platform.key}
                  >
                    {saving === platform.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4 mr-1" />}
                    Deconecteaza
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(platform)}
                    disabled={saving === platform.key}
                  >
                    {saving === platform.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : platform.oauth ? (
                      <ExternalLink className="h-4 w-4 mr-1" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-1" />
                    )}
                    {platform.oauth ? 'Conecteaza cu OAuth' : 'Adauga manual'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
