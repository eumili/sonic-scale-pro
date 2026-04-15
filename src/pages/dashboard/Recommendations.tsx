import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { planPriceLabel, PLAN_LIMITS } from '@/lib/pricing';

interface Recommendation {
  id: string; platform: string; category: string; priority: string;
  recommendation: string; reasoning: string; created_at: string;
}

const PRIORITY_CONFIG: Record<string, { dotColor: string; borderColor: string; label: string }> = {
  high: { dotColor: 'bg-red-400', borderColor: 'border-l-red-400', label: 'Urgent' },
  medium: { dotColor: 'bg-primary', borderColor: 'border-l-primary', label: 'Mediu' },
  low: { dotColor: 'bg-blue-400', borderColor: 'border-l-blue-400', label: 'Sugestie' },
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-500/10 text-red-400', spotify: 'bg-green-500/10 text-green-400',
  instagram: 'bg-pink-500/10 text-pink-400', tiktok: 'bg-purple-500/10 text-purple-400',
  apple_music: 'bg-pink-500/10 text-pink-300', general: 'bg-primary/10 text-primary',
};

// Number of full-detail recommendations a Free user can see. The rest are blurred
// with an upgrade paywall on top. Landing page promises "1 recomandare teaser vizibilă".
// Sourced from src/lib/pricing.ts so pricing UI and gating stay aligned.
const FREE_VISIBLE_COUNT = PLAN_LIMITS.free.recommendationsVisiblePerDay;

export default function Recommendations() {
  const { user } = useAuth();
  const { isFree, isLoading: planLoading } = usePlan();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const [recsRes, metricsRes, healthRes] = await Promise.all([
        supabase.from('daily_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('metrics_daily').select('*').eq('user_id', user.id).gte('metric_date', sevenDaysAgo.toISOString().split('T')[0]).order('metric_date', { ascending: false }),
        supabase.from('artist_health_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(1),
      ]);
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

  if (loading || planLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const blockedCount = isFree ? Math.max(0, displayRecs.length - FREE_VISIBLE_COUNT) : 0;

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6 sparkle-container warm-gradient-top">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 relative z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recomandări</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Bazate pe datele din ultimele 7 zile</p>
        </div>
        {healthScore && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary/10 border border-primary/20 self-start sm:self-auto">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-foreground">Health: {healthScore.overall_score}/100</span>
          </div>
        )}
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10">
        {(['high', 'medium', 'low'] as const).map(priority => {
          const count = displayRecs.filter(r => r.priority === priority).length;
          const config = PRIORITY_CONFIG[priority];
          return (
            <div key={priority} className="glass-card p-3 sm:p-4 flex items-center gap-2 sm:gap-3 backdrop-blur-lg">
              <div className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${config.dotColor} shrink-0`} />
              <div><p className="text-lg sm:text-2xl font-bold text-foreground">{count}</p><p className="text-[10px] sm:text-xs text-muted-foreground">{config.label}</p></div>
            </div>
          );
        })}
      </div>

      {/* Recommendation cards — Free sees first N fully, rest blurred with paywall */}
      <div className="space-y-3 sm:space-y-4 relative z-10">
        {displayRecs.map((rec, idx) => {
          const priorityConfig = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
          const platformColor = PLATFORM_COLORS[rec.platform] || PLATFORM_COLORS.general;
          const isBlocked = isFree && idx >= FREE_VISIBLE_COUNT;
          return (
            <div key={rec.id || idx} className="relative">
              <div
                className={`glass-card p-3 sm:p-5 border-l-4 ${priorityConfig.borderColor} transition-colors backdrop-blur-lg ${
                  isBlocked ? 'blur-sm select-none pointer-events-none' : 'hover:border-primary/30'
                }`}
                aria-hidden={isBlocked}
              >
                <div className="flex items-start gap-2.5 sm:gap-4">
                  <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${priorityConfig.dotColor} mt-1.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium ${platformColor}`}>{rec.platform === 'general' ? 'Strategie' : rec.platform.charAt(0).toUpperCase() + rec.platform.slice(1)}</span>
                      {rec.category && <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs bg-muted text-muted-foreground">{rec.category}</span>}
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 sm:mb-1">{rec.recommendation}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{rec.reasoning}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Single upgrade CTA at the end, summarising how many are locked. */}
        {isFree && blockedCount > 0 && (
          <div className="glass-card p-4 sm:p-6 border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                Încă {blockedCount} recomandăr{blockedCount === 1 ? 'e' : 'i'} detaliat{blockedCount === 1 ? 'ă' : 'e'} blocat{blockedCount === 1 ? 'ă' : 'e'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Upgrade la Pro ({planPriceLabel('pro')}) pentru toate recomandările personalizate.</p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto glow-primary">
              <Link to="/pricing">
                <Crown className="h-3.5 w-3.5 mr-1.5" />
                Upgrade la Pro
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* CTA "AI Chat" eliminat din UI publică: feature-ul este temporar
          ascuns pentru utilizatori. Codul rutei și paginii rămân. */}
    </div>
  );
}
