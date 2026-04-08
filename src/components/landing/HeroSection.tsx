import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="gradient-hero absolute inset-0" />
      <div className="container mx-auto px-4 text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Primul audit complet pentru artiști independenți
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Știi cât de bine{' '}
          <span className="text-primary">crești cu adevărat</span>?
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Primul audit complet al prezenței tale digitale. Actualizat zilnic. Cu plan de acțiune.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="text-base px-8 py-6 animate-pulse-glow">
            <Link to="/auth/register">
              Obține auditul gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
            <a href="#features">Vezi cum funcționează</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
