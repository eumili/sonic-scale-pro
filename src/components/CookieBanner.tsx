import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

type Consent = { necessary: boolean; analytics: boolean; marketing: boolean };

const DEFAULT_CONSENT: Consent = { necessary: true, analytics: false, marketing: false };

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<Consent>(DEFAULT_CONSENT);

  useEffect(() => {
    const saved = localStorage.getItem('cookie-consent');
    if (!saved) {
      setVisible(true);
    }
  }, []);

  const save = (c: Consent) => {
    localStorage.setItem('cookie-consent', JSON.stringify(c));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="glass-card p-5 border border-border/50 shadow-xl">
          {!showSettings ? (
            <>
              <p className="text-sm text-foreground mb-1 font-medium">🍪 Folosim cookies</p>
              <p className="text-xs text-muted-foreground mb-4">
                Utilizăm cookies pentru funcționarea platformei și, cu acordul tău, pentru analiză și marketing.{' '}
                <Link to="/cookies" className="text-primary underline">Detalii</Link>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => save({ necessary: true, analytics: true, marketing: true })}>
                  Acceptă toate
                </Button>
                <Button size="sm" variant="outline" onClick={() => save(DEFAULT_CONSENT)}>
                  Doar necesare
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>
                  Setări
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground mb-3 font-medium">Setări cookies</p>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">Necesare</Label>
                  <Switch checked disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-foreground">Analitice</Label>
                    <p className="text-xs text-muted-foreground">Statistici anonime de utilizare</p>
                  </div>
                  <Switch checked={consent.analytics} onCheckedChange={(v) => setConsent(c => ({ ...c, analytics: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-foreground">Marketing</Label>
                    <p className="text-xs text-muted-foreground">Remarketing și campanii</p>
                  </div>
                  <Switch checked={consent.marketing} onCheckedChange={(v) => setConsent(c => ({ ...c, marketing: v }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => save(consent)}>Salvează preferințele</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>Înapoi</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
