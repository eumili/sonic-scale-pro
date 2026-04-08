import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Music2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legal, setLegal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legal) { setError('Trebuie sa accepti termenii si conditiile.'); return; }
    setError('');
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ArtistPulse</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Creeaza cont gratuit</h1>
          <p className="text-muted-foreground mt-1">Incepe auditul in 2 minute</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="artist@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parola</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minim 6 caractere" required minLength={6} />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="legal" checked={legal} onCheckedChange={(c) => setLegal(c === true)} />
            <Label htmlFor="legal" className="text-sm text-muted-foreground leading-tight">
              Accept{' '}
              <span className="text-primary cursor-pointer">termenii si conditiile</span>{' '}
              si{' '}
              <span className="text-primary cursor-pointer">politica de confidentialitate</span>.
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Se creeaza contul...' : 'Creeaza cont'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ai deja cont?{' '}
            <Link to="/auth/login" className="text-primary hover:underline">Conecteaza-te</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
