import { Activity, Globe, Mail, Users, Bell, MessageSquare } from 'lucide-react';

const features = [
  { icon: Activity, title: 'Artist Health Score', desc: 'Un scor unic 0-100 care masoara sanatatea prezentei tale digitale.' },
  { icon: Globe, title: 'Audit Multi-Platforma', desc: 'YouTube, Spotify, Instagram, TikTok si SoundCloud — toate analizate impreuna.' },
  { icon: Mail, title: 'Email zilnic personalizat', desc: 'Primesti un raport scurt cu ce s-a schimbat si ce trebuie sa faci.' },
  { icon: Users, title: 'Benchmark vs similari', desc: 'Compara-te cu artisti la un nivel similar si vezi unde esti in urma.' },
  { icon: Bell, title: 'Alerte algoritm', desc: 'Fii primul care afla cand se schimba algoritmii pe platformele tale.' },
  { icon: MessageSquare, title: 'AI Chat contextual', desc: 'Intreaba orice despre datele tale si primesti raspunsuri bazate pe metrici reale.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">Features</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Tot ce ai nevoie ca sa intelegi, sa cresti si sa dominezi.
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
