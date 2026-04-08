import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Globe, BarChart3, Lightbulb, MessageSquare, Settings, Music2,
  Bell, LogOut, CreditCard, ChevronDown, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/platforms', label: 'Platforme', icon: Globe },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/recommendations', label: 'Recomandari', icon: Lightbulb },
  { to: '/dashboard/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/dashboard/settings', label: 'Setari', icon: Settings },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      if (data && data.length > 0) setIsAdmin(true);
    });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-card/50 p-4">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Music2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">ArtistPulse</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-destructive/10 text-destructive font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-xs font-semibold text-primary">FREE PLAN</span>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade pentru mai mult</p>
            <Button size="sm" className="w-full mt-2 h-7 text-xs" asChild>
              <Link to="/pricing">Upgrade</Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 lg:px-6 bg-card/50">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
                <Music2 className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </Link>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="h-4 w-4 mr-2" /> Setari
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <CreditCard className="h-4 w-4 mr-2" /> Billing
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <ShieldCheck className="h-4 w-4 mr-2" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Deconecteaza-te
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
