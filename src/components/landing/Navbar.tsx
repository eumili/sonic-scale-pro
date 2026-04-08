import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music2 } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Music2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">ArtistPulse</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
          <Button asChild size="sm">
            <Link to="/auth/register">Start Free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
