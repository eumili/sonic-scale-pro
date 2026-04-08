import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function Refund() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <h1 className="text-3xl font-bold text-foreground mb-8">Politica de Rambursare</h1>
          <p className="text-sm text-muted-foreground mb-6">Ultima actualizare: 8 aprilie 2026</p>

          <h2>1. Dreptul de retragere (OUG 34/2014)</h2>
          <p>Conform OUG 34/2014, ai dreptul de a te retrage din contract în termen de <strong>14 zile calendaristice</strong> de la data achiziției, fără a indica motive și fără costuri suplimentare.</p>

          <h2>2. Cum soliciți rambursarea</h2>
          <ol>
            <li>Trimite un email la <a href="mailto:support@getartistpulse.com" className="text-primary">support@getartistpulse.com</a> cu subiectul „Cerere rambursare"</li>
            <li>Include adresa de email a contului și data achiziției</li>
            <li>Vom confirma primirea cererii în maxim 24 de ore</li>
          </ol>

          <h2>3. Procesarea rambursării</h2>
          <ul>
            <li>Rambursarea se procesează în maxim <strong>14 zile calendaristice</strong> de la primirea cererii</li>
            <li>Suma se returnează prin aceeași metodă de plată folosită la achiziție (Stripe)</li>
            <li>Rambursarea include suma integrală plătită, fără deduceri</li>
          </ul>

          <h2>4. Excepții</h2>
          <p>Conform Art. 16 lit. (m) din OUG 34/2014, dreptul de retragere nu se aplică dacă serviciul digital a fost furnizat integral cu acordul prealabil al consumatorului și cu confirmarea că își pierde dreptul de retragere. La ArtistPulse, <strong>nu aplicăm această excepție</strong> — oferim rambursare completă în primele 14 zile indiferent de utilizare.</p>

          <h2>5. Anularea abonamentului</h2>
          <p>Poți anula abonamentul oricând din Dashboard → Setări → Facturare → „Gestionează abonamentul". Accesul continuă până la sfârșitul perioadei plătite. Nu se emit rambursări pro-rata după cele 14 zile.</p>

          <h2>6. Contact</h2>
          <p>
            Email suport: <a href="mailto:support@getartistpulse.com" className="text-primary">support@getartistpulse.com</a><br />
            SC BETTER MUSIC DISTRIBUTION SRL<br />
            CUI [CUI], Reg. Com. [J__/____/____]<br />
            [Adresa], România
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
