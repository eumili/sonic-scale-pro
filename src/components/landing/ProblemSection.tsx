import { TrendingDown, Eye, ShieldAlert } from 'lucide-react';

const problems = [
  { icon: TrendingDown, title: 'Nu știi dacă crești sau stagnezi', desc: 'Datele sunt împrăștiate pe 5 platforme diferite. Nimeni nu le pune cap la cap.' },
  { icon: Eye, title: 'Nu ai vizibilitate reală', desc: 'Vanity metrics nu spun povestea adevărată. Ai nevoie de context și benchmarks.' },
  { icon: ShieldAlert, title: 'Pierzi oportunități zilnic', desc: 'Fără alerte și recomandări, algoritmii se schimbă și tu nu știi.' },
];

export default function ProblemSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">Problema</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Majoritatea artiștilor zboară pe pilot automat. Fără date, fără direcție.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div key={i} className="glass-card p-6 hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
