import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { PLAN_PRICING, formatPrice, yearlyDiscountPercent } from '@/lib/pricing';

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data }) => {
      if (data?.plan) setCurrentPlan(data.plan);
    });
  }, [user]);

  const handleCheckout = async (plan: 'pro' | 'agency') => {
    if (!user) { navigate(`/auth/register?plan=${plan}`); return; }
    setLoadingPlan(plan);
    try {
      const priceId = yearly ? PLAN_PRICING[plan].yearly.stripePriceId : PLAN_PRICING[plan].monthly.stripePriceId;
      if (!priceId) throw new Error('Preț Stripe lipsă pentru acest plan.');
      const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message || 'Nu s-a putut crea sesiunea de plată.', variant: 'destructive' });
    } finally { setLoadingPlan(null); }
  };

  // Yearly discount badge — calculated dynamically from PLAN_PRICING (was hardcoded "-17%").
  const proDiscount = yearlyDiscountPercent('pro');

  // Free tier features must match actual gating in Platforms.tsx (FREE_PLATFORMS)
  // and Recommendations.tsx (FREE_VISIBLE_COUNT). Pro features must match what's
  // actually implemented — "Export rapoarte PDF" and "Istoric audit nelimitat"
  // were removed because they are not yet built (audit item #7).
  const plans = [
    {
      key: 'free' as const, name: 'Free', desc: 'Pentru artiști curioși',
      features: [
        'Artist Health Score',
        'Audit de bază zilnic',
        '1 recomandare vizibilă pe zi',
        '1 platformă conectată (YouTube)',
        'Analytics 7 zile',
      ],
      cta: 'Începe gratuit', highlighted: false,
    },
    {
      key: 'pro' as const, name: 'Pro', desc: 'Pentru artiști serioși',
      features: [
        'Tot din Free',
        'Analytics detaliat 90 zile',
        'Benchmark vs artiști similari',
        'Toate recomandările personalizate',
        '5 platforme conectate (Spotify, Instagram, TikTok, Apple Music, YouTube)',
        'Email zilnic personalizat',
      ],
      cta: 'Începe Pro', highlighted: true,
    },
    {
      key: 'agency' as const, name: 'Agency', desc: 'Pentru echipe și manageri',
      features: [
        'Tot din Pro',
        'Multi-artist management',
        'API access complet',
        'Rapoarte white-label',
        'Suport prioritar dedicat',
        'Platforme nelimitate',
        'Onboarding personalizat',
      ],
      cta: 'Contactează-ne', highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <section className="py-20 sparkle-container warm-gradient-top">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Planuri simple, rezultate reale
          </h1>
          <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
            Alege planul potrivit pentru cariera ta. Upgrade sau downgrade oricând, fără angajament.
          </p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <Label className={`text-sm ${!yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Lunar</Label>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <Label className={`text-sm ${yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Anual</Label>
            {yearly && proDiscount > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-1">-{proDiscount}%</Badge>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => {
              const pricing = PLAN_PRICING[plan.key];
              const monthlyAmount = pricing.monthly.amount;
              const displayAmount = yearly && plan.key !== 'free'
                ? pricing.yearly.monthlyEquivalent
                : monthlyAmount;
              const isLoading = loadingPlan === plan.key;
              return (
                <div key={plan.name} className={`glass-card p-6 flex flex-col relative backdrop-blur-lg ${plan.highlighted ? 'border-primary/50 glow-primary scale-[1.02]' : ''}`}>
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-foreground mt-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">{formatPrice(displayAmount)}</span>
                    <span className="text-muted-foreground">/lună</span>
                    {yearly && plan.key !== 'free' && (
                      <p className="text-xs text-muted-foreground mt-1">Facturat {formatPrice(pricing.yearly.amount)}/an</p>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {currentPlan === plan.key ? (
                    <Button variant="outline" className="w-full border-primary/50 text-primary" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Planul tău curent
                    </Button>
                  ) : plan.key === 'free' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/auth/register">{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? 'default' : 'outline'}
                      className={`w-full ${plan.highlighted ? 'shadow-lg shadow-primary/25' : ''}`}
                      onClick={() => handleCheckout(plan.key as 'pro' | 'agency')}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {plan.cta}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12 text-sm text-muted-foreground max-w-lg mx-auto">
            <p>Toate planurile includ acces la dashboard și audit zilnic. Plata se face lunar prin Stripe. Anulează oricând.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}