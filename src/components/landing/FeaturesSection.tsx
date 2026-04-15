import { Activity, Globe, Mail, Users, Bell, Sparkles } from 'lucide-react';

// "AI Chat contextual" eliminat din public marketing — feature-ul rămâne în
// cod (route + edge function) dar nu este expus utilizatorilor.
const features = [
  { icon: Activity, title: 'Artist Health Score', desc: 'Un scor unic 0-100 care măsoară sănătatea prezenței tale digitale.' },
  { icon: Globe, title: 'Audit Multi-Platformă', desc: 'YouTube, Spotify, Instagram, TikTok și SoundCloud — toate analizate împreună.' },
  { icon: Mail, title: 'Email zilnic personalizat', desc: 'Primești un raport scurt cu ce s-a schimbat și ce trebuie să faci.' },
  { icon: Users, title: 'Benchmark vs similari', desc: 'Compară-te cu artiști la un nivel similar și vezi unde ești în urmă.' },
  { icon: Bell, title: 'Alerte algoritm', desc: 'Fii primul care află când se schimbă algoritmii pe platformele tale.' },
  { icon: Sparkles, title: 'Recomandări personalizate', desc: 'Acțiuni concrete prioritizate pe baza datelor tale, livrate zilnic.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">Funcționalități</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Tot ce ai nevoie ca să înțelegi, să crești și să dominezi.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card p-6 hover:border-primary/30 transition-all hover:-translate-y-1 duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
