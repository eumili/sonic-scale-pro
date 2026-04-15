import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'Ce este ArtistPulse?', a: 'ArtistPulse este primul dashboard care îți oferă un audit complet al prezenței tale digitale pe toate platformele de muzică, actualizat zilnic.' },
  { q: 'Cum se calculează Artist Health Score?', a: 'Scorul combină 5 dimensiuni: Consistență, Creștere, Engagement, Reach și Momentum. Fiecare e analizată pe baza datelor reale de pe platformele tale.' },
  { q: 'Ce platforme sunt suportate?', a: 'YouTube, Spotify, Instagram, TikTok și SoundCloud. Adăugăm constant platforme noi.' },
  { q: 'Este gratuit?', a: 'Da! Planul Free îți oferă acces la Health Score, un audit de bază și recomandări zilnice. Planurile Pro și Agency deblochează analytics avansat, multi-platformă și recomandări detaliate.' },
  { q: 'Cât durează configurarea?', a: 'Sub 2 minute. Conectezi platformele, aștepți auditul și ești gata.' },
  { q: 'Datele mele sunt în siguranță?', a: 'Absolut. Folosim criptare end-to-end și nu partajăm datele tale cu nimeni.' },
  { q: 'Pot anula oricând?', a: 'Da, poți anula subscripția în orice moment din setări. Fără întrebări.' },
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Întrebări frecvente</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass-card px-6 border-none">
              <AccordionTrigger className="text-foreground hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
