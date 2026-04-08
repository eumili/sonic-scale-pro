const testimonials = [
  { name: 'Alex M.', role: 'Rapper independent', quote: 'In sfarsit inteleg de ce unele piese prind si altele nu. Health Score-ul e genial.' },
  { name: 'Maria D.', role: 'Cantareata pop', quote: 'Email-ul zilnic m-a ajutat sa fiu mai consistenta. Am crescut 40% in 3 luni.' },
  { name: 'Andrei P.', role: 'Producer electronic', quote: 'Benchmark-ul cu artisti similari mi-a aratat exact unde pierdeam. Acum sunt pe Plus.' },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Ce spun artistii</h2>
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
