import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Lock, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        {message.content}
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('plan').eq('id', user.id).single().then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Mock response — will be replaced with edge function call
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Feature coming soon. Aceasta functionalitate va fi disponibila in curand cu AI real care iti analizeaza performanta muzicala.' },
      ]);
      setIsLoading(false);
    }, 1500);
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Chat</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Powered by AI
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
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
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
            <p className="text-3xl font-bold text-primary">—</p>
          </div>
          <div className="space-y-2">
            {['Consistenta', 'Crestere', 'Engagement', 'Reach', 'Momentum'].map(m => (
              <div key={m} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{m}</span>
                <span className="text-foreground font-medium">—</span>
              </div>
            ))}
          </div>
          <div className="mt-auto text-xs text-muted-foreground/60">
            Datele se actualizeaza automat din audit-ul zilnic.
          </div>
        </Card>
      </div>
    </div>
  );
}
