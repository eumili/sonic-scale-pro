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

const PRICES = {
  pro: {
    monthly: { id: 'price_1TJugbGov5n78hOqT1YD3MGq', amount: '19' },
    yearly: { id: 'price_1TJugbGov5n78hOqQwPK03Ss', amount: '190' },
  },
  agency: {
    monthly: { id: 'price_1TJugcGov5n78hOqYt34TN96', amount: '49' },
    yearly: { id: 'price_1TJugdGov5n78hOqlGVni8yJ', amount: '490' },
  },
};

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.plan) setCurrentPlan(data.plan);
      });
  }, [user]);

  const handleCheckout = async (plan: 'pro' | 'agency') => {
    if (!user) {
      navigate(`/auth/register?plan=${plan}`);
      return;
    }
    setLoadingPlan(plan);
    try {
      const priceId = yearly ? PRICES[plan].yearly.id : PRICES[plan].monthly.id;
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message || 'Nu s-a putut crea sesiunea de plată.', variant: 'destructive' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      key: 'free' as const,
      name: 'Free',
      price: '0',
      yearlyPrice: '0',
      desc: 'Pentru artiști curioși',
      features: [
        'Artist Health Score',
        'Audit de bază zilnic',
        '3 recomandări pe zi',
        '2 platforme conectate',
        'Analytics 7 zile',
      ],
      cta: 'Începe gratuit',
      highlighted: false,
    },
    {
      key: 'pro' as const,
      name: 'Pro',
      price: '19',
      yearlyPrice: '190',
      monthlyEquiv: '15.83',
      desc: 'Pentru artiști serioși',
      features: [
        'Tot din Free',
        'Analytics detaliat 90 zile',
        'Benchmark vs artiști similari',
        'AI Chat nelimitat',
        'Alerte algoritm în timp real',
        '5 platforme conectate',
        'Email zilnic personalizat',
        'Export rapoarte PDF',
      ],
      cta: 'Începe Pro',
      highlighted: true,
    },
    {
      key: 'agency' as const,
      name: 'Agency',
      price: '49',
      yearlyPrice: '490',
      monthlyEquiv: '40.83',
      desc: 'Pentru echipe și manageri',
      features: [
        'Tot din Pro',
        'Multi-artist management',
        'API access complet',
        'Rapoarte white-label',
        'Suport prioritar dedicat',
        'Platforme nelimitate',
        'Dashboard echipă',
        'Onboarding personalizat',
      ],
      cta: 'Contactează-ne',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Planuri simple, rezultate reale
          </h1>
          <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
            Alege planul potrivit pentru cariera ta. Upgrade sau downgrade oricând, fără angajament.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Label className={`text-sm ${!yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Lunar</Label>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <Label className={`text-sm ${yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Anual</Label>
            {yearly && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-1">-17%</Badge>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => {
              const displayPrice = yearly && plan.key !== 'free'
                ? plan.monthlyEquiv
                : plan.price;
              const isLoading = loadingPlan === plan.key;

              return (
                <div
                  key={plan.name}
                  className={`glass-card p-6 flex flex-col relative ${plan.highlighted ? 'border-primary/50 glow-primary scale-[1.02]' : ''}`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-foreground mt-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">€{displayPrice}</span>
                    <span className="text-muted-foreground">/lună</span>
                    {yearly && plan.key !== 'free' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Facturat €{plan.yearlyPrice}/an
                      </p>
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
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Planul tău curent
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
