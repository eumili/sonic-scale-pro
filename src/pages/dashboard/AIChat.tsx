import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lock, Send, Loader2, Bot, User, Sparkles, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary/20' : 'bg-muted'}`}>
        {isUser ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
        {isUser ? message.content : (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChat() {
  const { user } = useAuth();
  const [userPlan, setUserPlan] = useState<string>('free');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [healthScore, setHealthScore] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    });
    supabase.from('artist_health_scores').select('*').eq('user_id', user.id)
      .order('score_date', { ascending: false }).limit(1).then(({ data }) => {
        if (data?.[0]) setHealthScore(data[0]);
      });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: newMessages },
      });

      if (error) {
        // Check for 402 upgrade required
        if (error.message?.includes('402') || (data && data.error === 'upgrade_required')) {
          setShowUpgrade(true);
          setMessages(prev => prev.slice(0, -1)); // remove user msg
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (data?.error === 'upgrade_required') {
        setShowUpgrade(true);
        setMessages(prev => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Eroare la conectarea cu AI. Incearca din nou.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (userPlan === 'free') {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-4">AI Chat</h1>
        <div className="glass-card p-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Disponibil in planul Pro</h2>
          <p className="text-muted-foreground mb-4">Intreaba AI-ul orice despre performanta ta muzicala.</p>
          <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Upgrade Modal */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Upgrade la Pro
            </DialogTitle>
            <DialogDescription>
              AI Chat este disponibil doar pentru planurile Pro și Agency. Upgrade acum pentru acces nelimitat.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button asChild className="flex-1">
              <Link to="/pricing">
                Vezi planurile <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setShowUpgrade(false)}>Inchide</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Chat</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Powered by Claude
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Chat area */}
        <Card className="flex-1 flex flex-col bg-card/50 border-border/50">
          <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">Intreaba-ma orice despre cariera ta muzicala.</p>
                <p className="text-muted-foreground/60 text-xs mt-1">De ex: "Cum imi cresc engagement-ul pe Instagram?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/50">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Scrie un mesaj..."
                className="bg-background/50"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Context panel */}
        <Card className="hidden xl:flex w-72 flex-col bg-card/50 border-border/50 p-4 gap-4">
          <h3 className="text-sm font-semibold text-foreground">Context</h3>
          <div className="glass-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Health Score</p>
            <p className="text-3xl font-bold text-primary">{healthScore?.overall_score ?? '—'}</p>
          </div>
          <div className="space-y-2">
            {[
              { key: 'consistency_score', label: 'Consistenta' },
              { key: 'growth_score', label: 'Crestere' },
              { key: 'engagement_score', label: 'Engagement' },
              { key: 'reach_score', label: 'Reach' },
              { key: 'momentum_score', label: 'Momentum' },
            ].map(m => (
              <div key={m.key} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="text-foreground font-medium">{healthScore?.[m.key] ?? '—'}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto text-xs text-muted-foreground/60">
            AI-ul vede automat datele tale din ultimele 14 zile.
          </div>
        </Card>
      </div>
    </div>
  );
}
