import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Analytics() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-4">Analytics</h1>
      <div className="glass-card p-12 text-center">
        <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Disponibil in planul Pro</h2>
        <p className="text-muted-foreground mb-4">Deblocheaza analytics detaliat per platforma.</p>
        <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
      </div>
    </div>
  );
}
