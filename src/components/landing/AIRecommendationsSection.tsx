import { Zap, Info, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockRecs = [
  { status: 'red' as const, badge: 'URGENT', category: 'Shorts', issue: 'Nu publici Shorts deloc — pierzi vizibilitate organică majoră.', action: 'Începe să publici minim 2-3 Shorts pe săptămână.' },
  { status: 'red' as const, badge: 'URGENT', category: 'Thumbnails', issue: 'Nu folosești thumbnail-uri custom — CTR scăzut dramatic.', action: 'Creează thumbnail-uri custom pentru TOATE videoclipurile.' },
  { status: 'yellow' as const, badge: 'ATENȚIE', category: 'Community', issue: 'Postezi pe Community, dar nu suficient de regulat.', action: 'Creează un calendar: Luni = sondaj, Joi = behind-the-scenes.' },
];

export default function AIRecommendationsSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nu doar scoruri. Acțiuni concrete.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Fiecare indicator sub-optim vine cu o recomandare specifică: ce să faci, ce impact va avea și cât efort necesită.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {mockRecs.map((rec, i) => {
            const isRed = rec.status === 'red';
            return (
              <div key={i} className="glass-card p-4 sm:p-5 rounded-xl border border-border/30">
                <div className="flex items-start gap-3">
                  {isRed ? (
                    <Zap className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                  ) : (
                    <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#eab308' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-[10px] font-bold ${isRed ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' : 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/30'}`}>
                        {rec.badge}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{rec.category}</span>
                    </div>
                    <p className="text-sm text-foreground mb-1">{rec.issue}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="h-3 w-3 text-primary" />
                      {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
