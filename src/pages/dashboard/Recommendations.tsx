import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Lightbulb, TrendingUp, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface Recommendation {
  id: string; platform: string; category: string; priority: string;
  recommendation: string; reasoning: string; created_at: string;
}

const PRIORITY_CONFIG: Record<string, { color: string; borderColor: string; icon: any; label: string }> = {
  high: { color: 'text-red-400', borderColor: 'border-red-400/20 bg-red-400/10', icon: AlertTriangle, label: 'Prioritate ridicată' },
  medium: { color: 'text-primary', borderColor: 'border-primary/20 bg-primary/10', icon: TrendingUp, label: 'Prioritate medie' },
  low: { color: 'text-success', borderColor: 'border-success/20 bg-success/10', icon: Lightbulb, label: 'Sugestie' },
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-500/10 text-red-400', spotify: 'bg-green-500/10 text-green-400',
  instagram: 'bg-pink-500/10 text-pink-400', tiktok: 'bg-purple-500/10 text-purple-400',
  apple_music: 'bg-pink-500/10 text-pink-300', general: 'bg-primary/10 text-primary',
};

export default function Recommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState('free');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const [profileRes, recsRes, metricsRes, healthRes] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('daily_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('metrics_daily').select('*').eq('user_id', user.id).gte('metric_date', sevenDaysAgo.toISOString().split('T')[0]).order('metric_date', { ascending: false }),
        supabase.from('artist_health_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(1),
      ]);
      if (profileRes.data?.plan) setUserPlan(profileRes.data.plan);
      setRecommendations(recsRes.data || []);
      setMetrics(metricsRes.data || []);
      if (healthRes.data?.[0]) setHealthScore(healthRes.data[0]);
      setLoading(false);
    };
    loadData();
  }, [user]);

  const displayRecs = useMemo(() => {
    if (recommendations.length > 0) return recommendations;
    const generated: Recommendation[] = [];
    const latest: Record<string, any> = {};
    metrics.forEach(m => { if (!latest[m.platform] || m.metric_date > latest[m.platform].metric_date) latest[m.platform] = m; });
    const platforms = Object.entries(latest);
    platforms.forEach(([platform, data]) => {
      if (platform === 'spotify' && data.followers > 0 && data.posts_count === 0) {
        generated.push({ id: `spotify-${Date.now()}`, platform: 'spotify', category: 'content', priority: 'high', recommendation: 'Lansează conținut nou pe Spotify', reasoning: `Ai ${data.followers.toLocaleString()} followeri pe Spotify dar activitatea este scăzută.`, created_at: new Date().toISOString() });
      }
      if (platform === 'instagram') generated.push({ id: `ig-${Date.now()}`, platform: 'instagram', category: 'content', priority: 'medium', recommendation: 'Postează Reels constant pe Instagram (3-5 pe săptămână)', reasoning: 'Algoritmul Instagram favorizează Reels-urile.', created_at: new Date().toISOString() });
      if (platform === 'tiktok') generated.push({ id: `tt-${Date.now()}`, platform: 'tiktok', category: 'content', priority: 'medium', recommendation: 'Folosește trenduri audio pe TikTok', reasoning: 'Trendurile audio au un reach organic foarte mare pe TikTok.', created_at: new Date().toISOString() });
    });
    if (platforms.length < 3) generated.push({ id: `gen-${Date.now()}`, platform: 'general', category: 'strategy', priority: 'high', recommendation: 'Conectează mai multe platforme', reasoning: `Ai doar ${platforms.length} platformă(e). Cu cât conectezi mai multe, cu atât recomandările sunt mai precise.`, created_at: new Date().toISOString() });
    if (generated.length === 0) generated.push({ id: `start-${Date.now()}`, platform: 'general', category: 'strategy', priority: 'low', recommendation: 'Așteaptă colectarea zilnică de date', reasoning: 'După acumularea datelor vei primi recomandări personalizate.', created_at: new Date().toISOString() });
    return generated;
  }, [recommendations, metrics, healthScore]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recomandări</h1>
          <p className="text-muted-foreground text-sm mt-1">Recomandări personalizate bazate pe datele din ultimele 7 zile</p>
        </div>
        {healthScore && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Health Score: {healthScore.overall_score}/100</span>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {(['high', 'medium', 'low'] as const).map(priority => {
          const count = displayRecs.filter(r => r.priority === priority).length;
          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;
          return (
            <div key={priority} className="glass-card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.borderColor}`}><Icon className={`h-5 w-5 ${config.color}`} /></div>
              <div><p className="text-2xl font-bold text-foreground">{count}</p><p className="text-xs text-muted-foreground">{config.label}</p></div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {displayRecs.map((rec, idx) => {
          const priorityConfig = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
          const PriorityIcon = priorityConfig.icon;
          const platformColor = PLATFORM_COLORS[rec.platform] || PLATFORM_COLORS.general;
          return (
            <div key={rec.id || idx} className="glass-card p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${priorityConfig.borderColor}`}><PriorityIcon className={`h-5 w-5 ${priorityConfig.color}`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${platformColor}`}>{rec.platform === 'general' ? 'Strategie' : rec.platform.charAt(0).toUpperCase() + rec.platform.slice(1)}</span>
                    {rec.category && <span className="px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">{rec.category}</span>}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{rec.recommendation}</h3>
                  <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {['pro', 'agency'].includes(userPlan) && (
        <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-primary/5 flex flex-col sm:flex-row items-center gap-4">
          <Sparkles className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-semibold text-foreground">Vrei sfaturi mai detaliate?</h3>
            <p className="text-sm text-muted-foreground">Întreabă AI-ul nostru despre strategii personalizate.</p>
          </div>
          <Button asChild><Link to="/dashboard/ai-chat">Deschide AI Chat <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      )}
    </div>
  );
}
