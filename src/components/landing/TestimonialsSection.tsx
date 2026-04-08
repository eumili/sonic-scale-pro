const testimonials = [
  { name: 'Alex M.', role: 'Rapper independent', quote: 'În sfârșit înțeleg de ce unele piese prind și altele nu. Health Score-ul e genial.' },
  { name: 'Maria D.', role: 'Cântăreață pop', quote: 'Email-ul zilnic m-a ajutat să fiu mai consistentă. Am crescut 40% în 3 luni.' },
  { name: 'Andrei P.', role: 'Producer electronic', quote: 'Benchmark-ul cu artiști similari mi-a arătat exact unde pierdeam. Acum sunt pe plus.' },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Ce spun artiștii</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card p-6">
              <p className="text-foreground mb-4 italic">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
