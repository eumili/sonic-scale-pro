import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'Ce este ArtistPulse?', a: 'ArtistPulse este primul dashboard care iti ofera un audit complet al prezentei tale digitale pe toate platformele de muzica, actualizat zilnic.' },
  { q: 'Cum se calculeaza Artist Health Score?', a: 'Scorul combina 5 dimensiuni: Consistenta, Crestere, Engagement, Reach si Momentum. Fiecare e analizata pe baza datelor reale de pe platformele tale.' },
  { q: 'Ce platforme sunt suportate?', a: 'YouTube, Spotify, Instagram, TikTok si SoundCloud. Adaugam constant platforme noi.' },
  { q: 'Este gratuit?', a: 'Da! Planul Free iti ofera acces la Health Score, un audit de baza si recomandari zilnice. Planurile Pro si Growth deblocheaza analytics avansat si AI Chat.' },
  { q: 'Cat dureaza configurarea?', a: 'Sub 2 minute. Conectezi platformele, astepti auditul si esti gata.' },
  { q: 'Datele mele sunt in siguranta?', a: 'Absolut. Folosim criptare end-to-end si nu partajam datele tale cu nimeni.' },
  { q: 'Pot anula oricand?', a: 'Da, poti anula subscriptia in orice moment din setari. Fara intrebari.' },
  { q: 'Cum functioneaza AI Chat?', a: 'AI Chat-ul cunoaste toate datele tale si poate raspunde la intrebari specifice despre performanta, tendinte si recomandari.' },
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">Intrebari frecvente</h2>
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
