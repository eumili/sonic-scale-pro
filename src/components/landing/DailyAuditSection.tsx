import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react';

export default function DailyAuditSection() {
  const mockBars = [42, 55, 48, 62, 58, 71, 68, 75, 72, 78, 74, 82];

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-4">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizat zilnic la 06:00
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Auditul canalului tău, refresh zilnic
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            În fiecare dimineață la 06:00, sistemul nostru analizează automat canalul tău YouTube.
            Urmărești evoluția în timp și vezi exact ce s-a schimbat.
          </p>
        </div>

        <div className="max-w-3xl mx-auto glass-card p-6 sm:p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Evoluție Overall Score</h3>
                <p className="text-xs text-muted-foreground">Ultimele 12 zile</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">+40pts</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 sm:gap-2 h-32 sm:h-40">
            {mockBars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary/70 to-primary/30 transition-all duration-700"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[8px] text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
