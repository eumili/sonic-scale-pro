import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const plans = [
  {
    name: 'Free',
    price: '0',
    desc: 'Pentru artisti curiosi',
    features: [
      'Artist Health Score',
      'Audit de baza zilnic',
      '3 recomandari pe zi',
      '2 platforme conectate',
      'Analytics 7 zile',
    ],
    cta: 'Incepe gratuit',
    ctaLink: '/auth/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '19',
    desc: 'Pentru artisti seriosi',
    features: [
      'Tot din Free',
      'Analytics detaliat 90 zile',
      'Benchmark vs artisti similari',
      'AI Chat nelimitat',
      'Alerte algoritm in timp real',
      '5 platforme conectate',
      'Email zilnic personalizat',
      'Export rapoarte PDF',
    ],
    cta: 'Incepe Pro',
    ctaLink: '/auth/register?plan=pro',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '49',
    desc: 'Pentru echipe si manageri',
    features: [
      'Tot din Pro',
      'Multi-artist management',
      'API access complet',
      'Rapoarte white-label',
      'Suport prioritar dedicat',
      'Platforme nelimitate',
      'Dashboard echipa',
      'Onboarding personalizat',
    ],
    cta: 'Contacteaza-ne',
    ctaLink: '/auth/register?plan=agency',
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Planuri simple, rezultate reale
          </h1>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Alege planul potrivit pentru cariera ta. Upgrade sau downgrade oricand, fara angajament.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => (
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
                  <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                  <span className="text-muted-foreground">/luna</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className={`w-full ${plan.highlighted ? 'shadow-lg shadow-primary/25' : ''}`}
                  asChild
                >
                  <Link to={plan.ctaLink}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ-like note */}
          <div className="text-center mt-12 text-sm text-muted-foreground max-w-lg mx-auto">
            <p>Toate planurile includ acces la dashboard si audit zilnic. Plata se face lunar prin Stripe. Anuleaza oricand.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
