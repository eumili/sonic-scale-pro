import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dark sparkle-container warm-gradient-top">
      <div className="text-center relative z-10">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-foreground mb-2">Pagină negăsită</p>
        <p className="text-muted-foreground mb-6">Pagina pe care o cauți nu există.</p>
        <Button asChild><Link to="/">Înapoi acasă</Link></Button>
      </div>
    </div>
  );
};

export default NotFound;