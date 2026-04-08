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
    features: ['Artist Health Score', 'Audit de baza', '3 recomandari zilnice', '2 platforme conectate'],
    cta: 'Incepe gratuit',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29',
    desc: 'Pentru artisti seriosi',
    features: ['Tot din Free', 'Analytics detaliat', 'Benchmark vs similari', 'AI Chat nelimitat', 'Alerte algoritm', '5 platforme conectate', 'Email zilnic personalizat'],
    cta: 'Incepe Pro',
    highlighted: true,
  },
  {
    name: 'Growth',
    price: '79',
    desc: 'Pentru echipe si manageri',
    features: ['Tot din Pro', 'Multi-artist management', 'API access', 'Rapoarte exportabile', 'Suport prioritar', 'Platforme nelimitate'],
    cta: 'Contacteaza-ne',
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">Planuri si preturi</h1>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Alege planul potrivit pentru tine. Upgrade sau downgrade oricand.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`glass-card p-6 flex flex-col ${plan.highlighted ? 'border-primary/50 glow-primary' : ''}`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-bold text-primary mb-2">POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                  <span className="text-muted-foreground">/luna</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className="w-full"
                  asChild
                >
                  <Link to="/auth/register">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
