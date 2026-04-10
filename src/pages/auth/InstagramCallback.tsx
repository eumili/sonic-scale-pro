import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertCircle, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Status = 'loading' | 'success' | 'error';

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const exchangeCode = async () => {
    const code = searchParams.get('code');
    if (!code) {
      setErrorMsg('Lipsește codul de autorizare din URL.');
      setStatus('error');
      return;
    }
    if (!user) {
      setErrorMsg('Trebuie să fii autentificat.');
      setStatus('error');
      return;
    }

    try {
      const redirectUri = `${window.location.origin}/auth/instagram/callback`;
      const { data, error } = await supabase.functions.invoke('instagram-auth', {
        body: { code, redirect_uri: redirectUri, user_id: user.id },
      });

      if (error || data?.error) {
        setErrorMsg(data?.error || error?.message || 'Eroare la conectarea Instagram.');
        setStatus('error');
        return;
      }

      setUsername(data.username || 'Cont conectat');
      setStatus('success');

      // Auto-trigger metrics collection after successful Instagram connect
      try {
        await supabase.functions.invoke('collect-metrics', {
          body: { user_id: user.id, platform: 'instagram' },
        });
      } catch {
        // Non-blocking — metrics will be collected on next scheduled run
      }

      setTimeout(() => navigate('/dashboard/platforms'), 2000);
    } catch {
      setErrorMsg('Eroare de rețea. Încearcă din nou.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user) exchangeCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRetry = () => {
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    window.location.href = `https://www.facebook.com/v21.0/dialog/oauth?client_id=819536013926165&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement&response_type=code`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card p-8 max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
            <Instagram className="h-7 w-7" />
          </div>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Se conectează contul Instagram...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-foreground font-semibold">@{username}</p>
            <p className="text-muted-foreground text-sm">Conectat cu succes! Redirecționare...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive text-sm">{errorMsg}</p>
            <Button onClick={handleRetry} className="mt-2">
              Încearcă din nou
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
