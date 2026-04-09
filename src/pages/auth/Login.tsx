import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 dark sparkle-container warm-gradient-top">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ArtistPulse</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Bine ai revenit</h1>
          <p className="text-muted-foreground mt-1">Conectează-te la contul tău</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 backdrop-blur-lg">
          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="artist@email.com" required className="bg-muted/30" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parolă</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-muted/30" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Se conectează...' : 'Conectează-te'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Nu ai cont?{' '}
            <Link to="/auth/register" className="text-primary hover:underline">Creează cont gratuit</Link>
          </p>
        </form>
      </div>
    </div>
  );
}