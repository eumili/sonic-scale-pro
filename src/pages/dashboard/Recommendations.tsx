import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface Recommendation {
  id: string;
  platform: string;
  category: string;
  priority: string;
  recommendation: string;
  reasoning: string;
  created_at: string;
}

const PRIORITY_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  high: { color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertTriangle, label: 'Prioritate ridicata' },
  medium: { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: TrendingUp, label: 'Prioritate medie' },
  low: { color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: Lightbulb, label: 'Sugestie' },
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-500/10 text-red-400',
  spotify: 'bg-green-500/10 text-green-400',
  instagram: 'bg-pink-500/10 text-pink-400',
  tiktok: 'bg-purple-500/10 text-purple-400',
  apple_music: 'bg-pink-500/10 text-pink-300',
  general: 'bg-blue-500/10 text-blue-400',
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
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [profileRes, recsRes, metricsRes, healthRes] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase
          .from('daily_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('metrics_daily')
          .select('*')
          .eq('user_id', user.id)
          .gte('metric_date', sevenDaysAgo.toISOString().split('T')[0])
          .order('metric_date', { ascending: false }),
        supabase
          .from('artist_health_scores')
          .select('*')
          .eq('user_id', user.id)
          .order('score_date', { ascending: false })
          .limit(1),
      ]);

      if (profileRes.data?.plan) setUserPlan(profileRes.data.plan);
      setRecommendations(recsRes.data || []);
      setMetrics(metricsRes.data || []);
      if (healthRes.data?.[0]) setHealthScore(healthRes.data[0]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Generate smart recommendations based on actual metrics if no DB recommendations exist
  const displayRecs = useMemo(() => {
    if (recommendations.length > 0) return recommendations;

    // Generate recommendations from metrics analysis
    const generated: Recommendation[] = [];
    const latest: Record<string, any> = {};
    metrics.forEach(m => {
      if (!latest[m.platform] || m.metric_date > latest[m.platform].metric_date) {
        latest[m.platform] = m;
      }
    });

    const platforms = Object.entries(latest);

    // Platform-specific recommendations
    platforms.forEach(([platform, data]) => {
      if (platform === 'spotify') {
        if (data.followers > 0 && data.posts_count === 0) {
          generated.push({
            id: `spotify-release-${Date.now()}`,
            platform: 'spotify',
            category: 'content',
            priority: 'high',
            recommendation: 'Lanseaza continut nou pe Spotify pentru a creste engagement-ul',
            reasoning: `Ai ${data.followers.toLocaleString()} followeri pe Spotify dar activitatea de lansari este scazuta. Un single nou sau un EP poate reactiva audienta.`,
            created_at: new Date().toISOString(),
          });
        }
        if (parseFloat(data.engagement_rate) < 2) {
          generated.push({
            id: `spotify-engagement-${Date.now()}`,
            platform: 'spotify',
            category: 'engagement',
            priority: 'medium',
            recommendation: 'Creste engagement-ul pe Spotify prin playlist-uri collaborative',
            reasoning: 'Engagement rate-ul pe Spotify poate fi imbunatatit prin adaugarea de piese in playlist-uri populare si prin promovarea pe social media.',
            created_at: new Date().toISOString(),
          });
        }
      }

      if (platform === 'youtube') {
        if (data.videos_count > 0 && data.total_views > 0) {
          const avgViews = data.total_views / data.videos_count;
          if (avgViews < data.followers * 0.1) {
            generated.push({
              id: `yt-views-${Date.now()}`,
              platform: 'youtube',
              category: 'growth',
              priority: 'medium',
              recommendation: 'Optimizeaza titlurile si thumbnail-urile pe YouTube',
              reasoning: `Media de vizualizari per video este sub 10% din numarul de subscriberi. Thumbnail-uri atractive si titluri SEO-friendly pot creste CTR-ul.`,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      if (platform === 'instagram') {
        generated.push({
          id: `ig-reels-${Date.now()}`,
          platform: 'instagram',
          category: 'content',
          priority: 'medium',
          recommendation: 'Posteaza Reels constant pe Instagram (3-5 pe saptamana)',
          reasoning: 'Algoritmul Instagram favorizeaza Reels-urile. Postarea constanta creste reach-ul organic si atrage followeri noi.',
          created_at: new Date().toISOString(),
        });
      }

      if (platform === 'tiktok') {
        generated.push({
          id: `tt-trends-${Date.now()}`,
          platform: 'tiktok',
          category: 'content',
          priority: 'medium',
          recommendation: 'Foloseste trenduri audio pe TikTok pentru a creste vizibilitatea',
          reasoning: 'Trendurile audio au un reach organic foarte mare pe TikTok. Combina muzica ta cu formate virale.',
          created_at: new Date().toISOString(),
        });
      }
    });

    // General recommendations
    if (platforms.length < 3) {
      generated.push({
        id: `general-platforms-${Date.now()}`,
        platform: 'general',
        category: 'strategy',
        priority: 'high',
        recommendation: 'Conecteaza mai multe platforme pentru un scor complet',
        reasoning: `Ai doar ${platforms.length} platforma(e) cu date. Cu cat conectezi mai multe platforme, cu atat recomandarile si scorul sunt mai precise.`,
        created_at: new Date().toISOString(),
      });
    }

    if (healthScore && healthScore.overall_score < 50) {
      generated.push({
        id: `general-health-${Date.now()}`,
        platform: 'general',
        category: 'strategy',
        priority: 'high',
        recommendation: 'Focus pe consistenta — posteaza pe cel putin 2 platforme pe zi',
        reasoning: `Scorul tau de sanatate este ${healthScore.overall_score}/100. Consistenta in postare este cel mai rapid mod de a-l creste.`,
        created_at: new Date().toISOString(),
      });
    }

    // Always add at least one recommendation
    if (generated.length === 0) {
      generated.push({
        id: `general-start-${Date.now()}`,
        platform: 'general',
        category: 'strategy',
        priority: 'low',
        recommendation: 'Asteapta colectarea zilnica de date pentru recomandari personalizate',
        reasoning: 'Dupa ce se acumuleaza date din cel putin 3 zile, vei primi recomandari personalizate bazate pe performanta ta.',
        created_at: new Date().toISOString(),
      });
    }

    return generated;
  }, [recommendations, metrics, healthScore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recomandari</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recomandari personalizate bazate pe datele tale din ultimele 7 zile
          </p>
        </div>
        {healthScore && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Health Score: {healthScore.overall_score}/100
            </span>
          </div>
        )}
      </div>

      {/* Priority summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        {(['high', 'medium', 'low'] as const).map(priority => {
          const count = displayRecs.filter(r => r.priority === priority).length;
          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;
          return (
            <Card key={priority} className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color.split(' ').slice(1).join(' ')}`}>
                  <Icon className={`h-5 w-5 ${config.color.split(' ')[0]}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations list */}
      <div className="space-y-4">
        {displayRecs.map((rec, idx) => {
          const priorityConfig = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
          const PriorityIcon = priorityConfig.icon;
          const platformColor = PLATFORM_COLORS[rec.platform] || PLATFORM_COLORS.general;

          return (
            <Card key={rec.id || idx} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${priorityConfig.color.split(' ').slice(1).join(' ')}`}>
                    <PriorityIcon className={`h-5 w-5 ${priorityConfig.color.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${platformColor}`}>
                        {rec.platform === 'general' ? 'Strategie' : rec.platform.charAt(0).toUpperCase() + rec.platform.slice(1)}
                      </span>
                      {rec.category && (
                        <span className="px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground">
                          {rec.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">{rec.recommendation}</h3>
                    <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CTA to AI Chat */}
      {['pro', 'agency'].includes(userPlan) && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <Sparkles className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-semibold text-foreground">Vrei sfaturi mai detaliate?</h3>
              <p className="text-sm text-muted-foreground">Intreaba AI-ul nostru despre strategii personalizate pentru cresterea ta.</p>
            </div>
            <Button asChild>
              <Link to="/dashboard/ai-chat">
                Deschide AI Chat <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
