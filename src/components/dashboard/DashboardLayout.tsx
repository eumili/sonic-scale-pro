import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Globe, BarChart3, Lightbulb, MessageSquare, Settings, Music2,
  Bell, LogOut, CreditCard, ChevronDown, ShieldCheck, Search, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/platforms', label: 'Platforme', icon: Globe },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/recommendations', label: 'Recomandări', icon: Lightbulb },
  { to: '/dashboard/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/dashboard/settings', label: 'Setări', icon: Settings },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [artistName, setArtistName] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      if (data && data.length > 0) setIsAdmin(true);
    });
    supabase.from('profiles').select('plan, artist_name').eq('id', user.id).single().then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
      if (data?.artist_name) setArtistName(data.artist_name);
    });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const planLabel = userPlan === 'free' ? 'FREE' : userPlan.toUpperCase();
  const planColor = userPlan === 'pro' ? 'bg-primary/20 text-primary border-primary/30' : userPlan === 'agency' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-muted text-muted-foreground border-border';

  const SidebarContent = () => (
    <>
      {/* User profile */}
      <div className="px-3 py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {artistName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{artistName || 'Artist'}</p>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${planColor}`}>
              {planLabel} PLAN
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map(item => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary font-medium shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              location.pathname === '/admin'
                ? 'bg-destructive/10 text-destructive font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto px-3 pb-4 pt-4 border-t border-border/50">
        {userPlan === 'free' ? (
          <div className="px-3 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-xs font-semibold text-primary">FREE PLAN</span>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade pentru mai mult</p>
            <Button size="sm" className="w-full mt-2 h-7 text-xs" asChild>
              <Link to="/pricing">Upgrade</Link>
            </Button>
          </div>
        ) : (
          <div className="px-3 py-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-xs font-semibold text-primary">{planLabel} PLAN</span>
              <p className="text-xs text-muted-foreground">Plan activ</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex dark">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-card/30">
        <Link to="/" className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Music2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground tracking-tight">ArtistPulse</span>
        </Link>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border/50 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Music2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">ArtistPulse</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 lg:px-6 bg-card/30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută..." className="pl-9 w-64 bg-muted/50 border-border/50 h-9" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {artistName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium text-foreground">{artistName || 'Artist'}</span>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${planColor}`}>
                      {planLabel}
                    </Badge>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="h-4 w-4 mr-2" /> Setări
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
                  <LogOut className="h-4 w-4 mr-2" /> Deconectează-te
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
