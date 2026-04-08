import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music2, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
          <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>

          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted/40" />
          ) : user ? (
            <>
              <span className="hidden lg:inline text-sm text-muted-foreground max-w-[180px] truncate">
                {user.email}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Button asChild size="sm">
                <Link to="/auth/register">Start Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
