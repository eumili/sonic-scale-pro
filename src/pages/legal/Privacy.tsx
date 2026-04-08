import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <h1 className="text-3xl font-bold text-foreground mb-8">Politica de Confidențialitate</h1>
          <p className="text-sm text-muted-foreground mb-6">Ultima actualizare: 8 aprilie 2026</p>

          <h2>1. Operatorul de date</h2>
          <p>SC BETTER MUSIC DISTRIBUTION SRL, CUI 43328568, Reg. Com. J18/952/2020 (EUID ROONRC.J18/952/2020), cu sediul în Str. Seci nr. 40, Ap. BIR. 2, Bălești, jud. Gorj, cod 217045, România.</p>

          <h2>2. Date colectate</h2>
          <ul>
            <li><strong>Date de cont:</strong> nume, adresă de email, parolă (criptată)</li>
            <li><strong>Date de platforme:</strong> metrici publice de pe YouTube, Spotify, Instagram, TikTok, SoundCloud (followers, engagement, reach)</li>
            <li><strong>Date de utilizare:</strong> paginile accesate, acțiunile din dashboard, timestamp-uri</li>
            <li><strong>Date de plată:</strong> procesate direct de Stripe — nu stocăm date de card</li>
          </ul>

          <h2>3. Scopurile prelucrării</h2>
          <ul>
            <li>Furnizarea serviciilor de audit și analiză</li>
            <li>Calcularea Artist Health Score</li>
            <li>Generarea de recomandări personalizate</li>
            <li>Comunicări legate de serviciu (alerte, rapoarte zilnice)</li>
            <li>Îmbunătățirea continuă a platformei</li>
          </ul>

          <h2>4. Temeiul juridic</h2>
          <p>Prelucrăm datele pe baza: consimțământului (Art. 6(1)(a) GDPR), executării contractului (Art. 6(1)(b)), obligațiilor legale (Art. 6(1)(c)) și interesului legitim (Art. 6(1)(f)).</p>

          <h2>5. Stocarea datelor</h2>
          <p>Datele sunt stocate pe servere securizate în UE (Supabase). Păstrăm datele pe durata contului activ + 30 de zile după ștergere.</p>

          <h2>6. Drepturile tale (GDPR)</h2>
          <p>Ai dreptul la: acces, rectificare, ștergere, restricționare, portabilitate, opoziție. Exercită-le scriind la <a href="mailto:privacy@getartistpulse.com" className="text-primary">privacy@getartistpulse.com</a>.</p>

          <h2>7. Partajarea datelor</h2>
          <p>Nu vindem datele tale. Le partajăm doar cu: Stripe (plăți), Anthropic (AI Chat — date anonimizate), și furnizori de hosting (Supabase/AWS).</p>

          <h2>8. Securitate</h2>
          <p>Folosim criptare TLS în tranzit, criptare la repaus, autentificare securizată și audit logging.</p>

          <h2>9. Contact DPO</h2>
          <p>Responsabil protecția datelor: <a href="mailto:privacy@getartistpulse.com" className="text-primary">privacy@getartistpulse.com</a></p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
