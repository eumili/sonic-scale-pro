import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function PricingCTASection() {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Gata să crești?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Începe gratuit. Upgrade oricând ai nevoie de mai mult.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="px-8">
            <Link to="/auth/register">
              Începe gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link to="/pricing">Vezi planurile</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
