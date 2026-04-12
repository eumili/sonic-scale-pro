import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, TrendingUp, Music } from 'lucide-react';

function MockDashboard() {
  const bars = [65, 82, 45, 90, 73, 58, 88];
  return (
    <div className="relative mx-auto mt-8 sm:mt-12 max-w-3xl px-2 sm:px-0">
      <div className="glass-card p-4 sm:p-6 rounded-2xl border border-primary/10 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-success/60" />
          </div>
          <div className="h-5 w-32 rounded bg-muted/40" />
          <div className="flex gap-1.5">
            <div className="h-5 w-14 rounded bg-muted/30" />
            <div className="h-5 w-14 rounded bg-primary/20" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {[
            { label: 'Followers', value: '24.8K', icon: TrendingUp, change: '+12%' },
            { label: 'Engagement', value: '4.2%', icon: BarChart3, change: '+3.1%' },
            { label: 'Health Score', value: '78', icon: Music, change: '' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl bg-muted/20 border border-border/30 p-2 sm:p-3">
              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                <kpi.icon className="h-3 w-3 text-primary" />
                <span className="text-[8px] sm:text-[10px] text-muted-foreground">{kpi.label}</span>
              </div>
              <span className="text-sm sm:text-lg font-bold text-foreground">{kpi.value}</span>
              {kpi.change && <span className="text-[8px] sm:text-[10px] text-success ml-1">{kpi.change}</span>}
            </div>
          ))}
        </div>

        {/* Chart mockup */}
        <div className="flex items-end gap-2 h-24">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-primary/60 to-primary/20 transition-all duration-1000"
              style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
      {/* Glow behind */}
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 md:py-32 sparkle-container">
      <div className="gradient-hero absolute inset-0" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Primul audit complet pentru artiști independenți
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Știi cât de bine{' '}
          <span className="text-primary">crești cu adevărat</span>?
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Primul audit complet al prezenței tale digitale. Actualizat zilnic. Cu plan de acțiune.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="text-base px-8 py-6 glow-primary">
            <Link to="/auth/register">
              Obține auditul gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
            <a href="#features">Vezi cum funcționează</a>
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[
              'bg-gradient-to-br from-red-400 to-red-600',
              'bg-gradient-to-br from-blue-400 to-blue-600',
              'bg-gradient-to-br from-green-400 to-green-600',
              'bg-gradient-to-br from-purple-400 to-purple-600',
              'bg-gradient-to-br from-primary to-primary/70',
            ].map((bg, i) => (
              <div
                key={i}
                className={`h-8 w-8 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] font-bold text-foreground`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted by <span className="font-semibold text-foreground">500+</span> artiști
          </p>
        </div>

        {/* Mock dashboard */}
        <MockDashboard />
      </div>
    </section>
  );
}
