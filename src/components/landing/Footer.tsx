import { Link } from 'react-router-dom';
import { Music2 } from 'lucide-react';

const footerLinks = {
  Produs: [
    { label: 'Funcționalități', to: '/#features' },
    { label: 'Prețuri', to: '/pricing' },
    { label: 'AI Chat', to: '/auth/register' },
  ],
  Companie: [
    { label: 'Despre noi', to: '/' },
    { label: 'Contact', href: 'mailto:contact@getartistpulse.com' },
    { label: 'Blog', to: '/' },
  ],
  Legal: [
    { label: 'Termeni și Condiții', to: '/terms' },
    { label: 'Confidențialitate', to: '/privacy' },
    { label: 'Cookies', to: '/cookies' },
    { label: 'Drepturi GDPR', to: '/gdpr' },
    { label: 'Rambursare', to: '/refund' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
                <Music2 className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">ArtistPulse</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Primul audit complet al prezenței tale digitale. Actualizat zilnic.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Instagram</a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">TikTok</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">X</a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-foreground text-sm mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {'href' in link && link.href ? (
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to!} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">© 2026 SC BETTER MUSIC DISTRIBUTION SRL. Toate drepturile rezervate.</p>
          <p className="text-xs text-muted-foreground">
            <a href="mailto:contact@getartistpulse.com" className="hover:text-foreground transition-colors">contact@getartistpulse.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
