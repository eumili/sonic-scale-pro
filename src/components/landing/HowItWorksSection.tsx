import { UserPlus, Zap, BarChart3 } from 'lucide-react';

const steps = [
  { icon: UserPlus, step: '01', title: 'Conecteaza-ti platformele', desc: 'YouTube, Spotify, Instagram, TikTok, SoundCloud — totul intr-un singur loc.' },
  { icon: Zap, step: '02', title: 'Primesti auditul instant', desc: 'Analizam datele, calculam Artist Health Score si generam recomandari.' },
  { icon: BarChart3, step: '03', title: 'Cresti cu un plan clar', desc: 'Primesti zilnic actiuni concrete si alerte despre schimbarile algoritmilor.' },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Cum functioneaza</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <s.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-primary mb-2 block">PASUL {s.step}</span>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
