import { Music2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
              <Music2 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">ArtistPulse</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 ArtistPulse. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
}
