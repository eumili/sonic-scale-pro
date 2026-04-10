import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Music, Youtube, Instagram, Music2, Headphones, Link2, Unlink, ExternalLink, CheckCircle2, Loader2, RefreshCw, Users, BarChart3, Clock } from 'lucide-react';

interface PlatformConfig {
  key: string; name: string; icon: React.ReactNode; color: string; bgColor: string; oauth: boolean; placeholder: string;
}

const platforms: PlatformConfig[] = [
  { key: 'youtube', name: 'YouTube', icon: <Youtube className="h-6 w-6" />, color: '#EF4444', bgColor: 'bg-red-500/10', oauth: true, placeholder: 'https://youtube.com/@canal' },
  { key: 'spotify', name: 'Spotify', icon: <Music className="h-6 w-6" />, color: '#22C55E', bgColor: 'bg-green-500/10', oauth: true, placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'instagram', name: 'Instagram', icon: <Instagram className="h-6 w-6" />, color: '#EC4899', bgColor: 'bg-pink-500/10', oauth: true, placeholder: 'https://instagram.com/username' },
  { key: 'tiktok', name: 'TikTok', icon: <Music2 className="h-6 w-6" />, color: '#A78BFA', bgColor: 'bg-purple-500/10', oauth: true, placeholder: 'https://tiktok.com/@username' },
  { key: 'apple_music', name: 'Apple Music', icon: <Headphones className="h-6 w-6" />, color: '#F472B6', bgColor: 'bg-pink-500/10', oauth: false, placeholder: 'https://music.apple.com/artist/...' },
];

interface ConnectedPlatform { id: string; platform: string; url: string; is_active: boolean; }
interface MetricData { platform: string; followers: number; engagement_rate: string; metric_date: string; }

function getTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'acum câteva minute';
  if (hours < 24) return `acum ${hours}h`;
  const days = Math.floor(hours / 24);
  return `acum ${days}z`;
}

export default function Platforms() {
  const { user } = useAuth();
  const [connected, setConnected] = useState<ConnectedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<Record<string, MetricData>>({});

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('artist_platforms').select('id, platform, platform_url, is_active').eq('user_id', user.id),
      supabase.from('metrics_daily').select('platform, followers, engagement_rate, metric_date').eq('user_id', user.id).order('metric_date', { ascending: false }),
    ]).then(([platformsRes, metricsRes]) => {
      if (platformsRes.data) setConnected(platformsRes.data.map(d => ({ ...d, url: d.platform_url })));
      if (metricsRes.data) {
        const byPlatform: Record<string, MetricData> = {};
        metricsRes.data.forEach(m => {
          if (!byPlatform[m.platform]) byPlatform[m.platform] = m;
        });
        setLatestMetrics(byPlatform);
      }
      setLoading(false);
    });
  }, [user]);

  const isConnected = (key: string) => connected.find(c => c.platform === key && c.is_active);

  const handleInstagramOAuth = () => {
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=819536013926165&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement&response_type=code`;
  };

  const handleConnect = async (platform: PlatformConfig) => {
    if (platform.key === 'instagram') {
      handleInstagramOAuth();
      return;
    }
    const url = urls[platform.key];
    if (!url) { toast({ title: 'Introdu URL-ul profilului', variant: 'destructive' }); return; }
    setSaving(platform.key);
    const { error } = await supabase.from('artist_platforms').upsert({
      user_id: user!.id, platform: platform.key, platform_url: url, is_active: true,
    }, { onConflict: 'user_id,platform' });
    if (error) {
      const { error: insertError } = await supabase.from('artist_platforms').insert({
        user_id: user!.id, platform: platform.key, platform_url: url, is_active: true,
      });
      if (insertError) { toast({ title: 'Eroare la conectare', description: insertError.message, variant: 'destructive' }); setSaving(null); return; }
    }
    setConnected(prev => [...prev.filter(c => c.platform !== platform.key), { id: '', platform: platform.key, url, is_active: true }]);
    toast({ title: `${platform.name} conectat cu succes!` });
    setSaving(null);
  };

  const handleDisconnect = async (platformKey: string) => {
    setSaving(platformKey);
    await supabase.from('artist_platforms').update({ is_active: false }).eq('user_id', user!.id).eq('platform', platformKey);
    setConnected(prev => prev.map(c => c.platform === platformKey ? { ...c, is_active: false } : c));
    toast({ title: 'Platformă deconectată' });
    setSaving(null);
  };

  const handleSync = async (platformKey: string) => {
    setSyncing(platformKey);
    try {
      const { data, error } = await supabase.functions.invoke('collect-metrics', { body: { platform: platformKey } });
      if (error) throw error;
      if (data && data.ok === false) throw new Error(data.error || 'Sync failed');

      // Refresh metrics after successful sync
      const { data: freshMetrics } = await supabase
        .from('metrics_daily')
        .select('platform, followers, engagement_rate, metric_date')
        .eq('user_id', user!.id)
        .eq('platform', platformKey)
        .order('metric_date', { ascending: false })
        .limit(1);

      if (freshMetrics?.[0]) {
        setLatestMetrics(prev => ({ ...prev, [platformKey]: freshMetrics[0] }));
      }

      toast({ title: 'Sincronizare reușită!', description: 'Datele au fost actualizate cu succes.' });
    } catch (err: any) {
      toast({ title: 'Sincronizare eșuată', description: err?.message || 'Încearcă din nou mai târziu.', variant: 'destructive' });
    }
    setSyncing(null);
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="animate-fade-in space-y-6 sparkle-container warm-gradient-top">
      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-foreground">Platforme conectate</h1>
        <p className="text-muted-foreground mt-1">Conectează-ți conturile pentru a primi analytics și recomandări personalizate.</p>
      </div>

      <div className="grid gap-4 relative z-10">
        {platforms.map(platform => {
          const conn = isConnected(platform.key);
          const metric = latestMetrics[platform.key];
          return (
            <div key={platform.key} className="glass-card p-5 flex flex-col gap-4 backdrop-blur-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${platform.bgColor} flex items-center justify-center shrink-0`} style={{ color: platform.color }}>
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">{platform.name}</span>
                    {conn ? (
                      <Badge variant="outline" className="border-success/40 text-success text-xs bg-success/10">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> CONNECTED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">DISCONNECTED</Badge>
                    )}
                  </div>
                  {conn ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {platform.key === 'instagram' && conn.url.includes('instagram.com/')
                        ? `@${conn.url.split('instagram.com/')[1]}`
                        : conn.url}
                    </p>
                  ) : platform.key === 'instagram' ? (
                    <p className="text-xs text-muted-foreground mt-1">Conectează prin Facebook OAuth</p>
                  ) : (
                    <Input
                      placeholder={platform.placeholder}
                      value={urls[platform.key] || ''}
                      onChange={e => setUrls(prev => ({ ...prev, [platform.key]: e.target.value }))}
                      className="mt-1 max-w-md bg-muted/30 border-border/50"
                    />
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {conn && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(platform.key)}
                      disabled={syncing === platform.key}
                      className="gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncing === platform.key ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  )}
                  {conn ? (
                    <Button variant="outline" size="sm" onClick={() => handleDisconnect(platform.key)} disabled={saving === platform.key}>
                      {saving === platform.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4 mr-1" />}
                      Deconectează
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(platform)} disabled={saving === platform.key}>
                      {saving === platform.key ? <Loader2 className="h-4 w-4 animate-spin" /> : platform.key === 'instagram' ? <Instagram className="h-4 w-4 mr-1" /> : platform.oauth ? <ExternalLink className="h-4 w-4 mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
                      {platform.key === 'instagram' ? 'Conectează Instagram' : platform.oauth ? 'Conectează cu OAuth' : 'Adaugă manual'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats pills for connected platforms */}
              {conn && metric && (
                <div className="flex flex-wrap gap-2 pl-0 sm:pl-16">
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/50 px-3 py-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{formatNumber(metric.followers || 0)}</span>
                    <span className="text-xs text-muted-foreground">followers</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/50 px-3 py-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{parseFloat(metric.engagement_rate || '0').toFixed(1)}%</span>
                    <span className="text-xs text-muted-foreground">engagement</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/40 border border-border/50 px-3 py-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Synced {getTimeSince(metric.metric_date)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
