import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, Crown } from 'lucide-react';

const features = [
  { name: 'Scor general + Stars rating', free: true, pro: true },
  { name: 'Lista indicatori cu status colorat', free: true, pro: true },
  { name: 'Audit zilnic automat (06:00)', free: true, pro: true },
  { name: '1 recomandare teaser vizibilă', free: true, pro: true },
  { name: 'Valori exacte per indicator', free: false, pro: true },
  { name: 'TOATE recomandările detaliate', free: false, pro: true },
  { name: 'Istoric audit nelimitat', free: false, pro: true },
  { name: 'Multi-platformă (Spotify, Instagram)', free: false, pro: true },
  { name: 'AI Chat nelimitat', free: false, pro: true },
  { name: 'Export rapoarte PDF', free: false, pro: true },
];

export default function PricingTableSection() {
  return (
    <section id="pricing-table" className="py-16 sm:py-24 bg-muted/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Plan simplu, rezultate reale</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Începe gratuit. Upgrade când ești gata pentru mai mult.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-border/30">
            <h3 className="text-xl font-bold text-foreground mb-1">Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-foreground">0</span>
              <span className="text-muted-foreground">lei / lună</span>
            </div>
            <Button asChild variant="outline" className="w-full mb-8" size="lg">
              <Link to="/auth/register">
                Începe gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f.name} className="flex items-center gap-3 text-sm">
                  {f.free ? (
                    <Check className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={f.free ? 'text-foreground' : 'text-muted-foreground/50'}>{f.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-primary/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl flex items-center gap-1">
              <Crown className="h-3 w-3" /> POPULAR
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-foreground">49</span>
              <span className="text-muted-foreground">lei / lună</span>
            </div>
            <Button asChild className="w-full mb-8 glow-primary" size="lg">
              <Link to="/auth/register">
                Upgrade la Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f.name} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-foreground">{f.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
