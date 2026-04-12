import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lock, Send, Loader2, Bot, User, Sparkles, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTION_CHIPS = [
  'Cum cresc engagement-ul?',
  'Ce conținut funcționează?',
  'Analizează ultima săptămână',
  'YouTube vs Spotify',
];

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${isUser ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-border/50'}`}>
        {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />}
      </div>
      <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/30 text-foreground'}`}>
        {isUser ? message.content : (
          <div className="prose prose-sm prose-invert max-w-none text-xs sm:text-sm"><ReactMarkdown>{message.content}</ReactMarkdown></div>
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
    supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data }) => { if (data?.plan) setUserPlan(data.plan); });
    supabase.from('artist_health_scores').select('*').eq('user_id', user.id).order('score_date', { ascending: false }).limit(1).then(({ data }) => { if (data?.[0]) setHealthScore(data[0]); });
  }, [user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;
    const userMsg: Message = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); setInput(''); setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages: newMessages } });
      if (error) {
        if (error.message?.includes('402') || (data && data.error === 'upgrade_required')) { setShowUpgrade(true); setMessages(prev => prev.slice(0, -1)); setIsLoading(false); return; }
        throw error;
      }
      if (data?.error === 'upgrade_required') { setShowUpgrade(true); setMessages(prev => prev.slice(0, -1)); setIsLoading(false); return; }
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Eroare la conectarea cu AI. Încearcă din nou.' }]);
    } finally { setIsLoading(false); }
  };

  if (userPlan === 'free') {
    return (
      <div className="animate-fade-in sparkle-container warm-gradient-top">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 relative z-10">AI Chat</h1>
        <div className="glass-card p-8 sm:p-12 text-center relative z-10">
          <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Disponibil în planul Pro</h2>
          <p className="text-sm text-muted-foreground mb-4">Întreabă AI-ul orice despre performanța ta muzicală.</p>
          <Button asChild><Link to="/pricing">Upgrade la Pro</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-5rem)] sm:h-[calc(100vh-7rem)] sparkle-container warm-gradient-top">
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="sm:max-w-md max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base"><Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Upgrade la Pro</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">AI Chat este disponibil doar pentru planurile Pro și Agency.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Button asChild className="flex-1" size="sm"><Link to="/pricing">Vezi planurile <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
            <Button variant="outline" size="sm" onClick={() => setShowUpgrade(false)}>Închide</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI Chat</h1>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" /> Claude
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 relative z-10">
        <div className="flex-1 flex flex-col glass-card overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-2 sm:mb-3" />
                <p className="text-muted-foreground text-xs sm:text-sm mb-1">Întreabă-mă orice despre cariera ta muzicală.</p>
                <p className="text-muted-foreground/60 text-[10px] sm:text-xs mb-4 sm:mb-6">De ex: "Cum îmi cresc engagement-ul?"</p>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {SUGGESTION_CHIPS.map(chip => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="rounded-full border border-foreground/20 bg-muted/30 px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}
            {isLoading && (
              <div className="flex gap-2 sm:gap-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center"><Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /></div>
                <div className="bg-muted rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5"><Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-muted-foreground" /></div>
              </div>
            )}
          </div>
          <div className="p-2.5 sm:p-4 border-t border-border/50">
            <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Scrie un mesaj..." className="bg-muted/30 border-border/50 h-9 sm:h-10 text-xs sm:text-sm" disabled={isLoading} />
              <Button type="submit" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 shrink-0" disabled={isLoading || !input.trim()}><Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
            </form>
          </div>
        </div>

        {/* Context sidebar — hidden on mobile & tablet */}
        <div className="hidden xl:flex w-72 flex-col glass-card p-4 gap-4">
          <h3 className="text-sm font-semibold text-foreground">Context</h3>
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Health Score</p>
            <p className="text-3xl font-bold text-primary">{healthScore?.overall_score ?? '—'}</p>
          </div>
          <div className="space-y-2">
            {[
              { key: 'consistency_score', label: 'Consistență' },
              { key: 'growth_score', label: 'Creștere' },
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
          <div className="mt-auto text-xs text-muted-foreground/60">AI-ul vede automat datele tale din ultimele 14 zile.</div>
        </div>
      </div>
    </div>
  );
}
