import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <h1 className="text-3xl font-bold text-foreground mb-8">Termeni și Condiții</h1>
          <p className="text-sm text-muted-foreground mb-6">Ultima actualizare: 8 aprilie 2026</p>

          <h2>1. Operatorul</h2>
          <p>SC BETTER MUSIC DISTRIBUTION SRL, CUI 43328568, Reg. Com. J18/952/2020 (EUID ROONRC.J18/952/2020), cu sediul în Str. Seci nr. 40, Ap. BIR. 2, Bălești, jud. Gorj, cod 217045, România. Contact: <a href="mailto:contact@getartistpulse.com" className="text-primary">contact@getartistpulse.com</a>.</p>

          <h2>2. Definiții</h2>
          <p><strong>ArtistPulse</strong> — platforma SaaS accesibilă la getartistpulse.com, care oferă servicii de audit și analiză a prezenței digitale pentru artiști muzicali.</p>
          <p><strong>Utilizator</strong> — orice persoană fizică sau juridică care creează un cont pe platformă.</p>

          <h2>3. Acceptarea termenilor</h2>
          <p>Prin crearea unui cont sau utilizarea platformei, acceptați acești termeni în integralitate. Dacă nu sunteți de acord, nu utilizați serviciul.</p>

          <h2>4. Serviciile oferite</h2>
          <ul>
            <li>Artist Health Score — scor zilnic de sănătate digitală</li>
            <li>Audit multi-platformă (YouTube, Spotify, Instagram, TikTok, SoundCloud)</li>
            <li>Recomandări personalizate bazate pe date</li>
            <li>AI Chat contextual (disponibil în planurile Pro și Agency)</li>
            <li>Alerte și rapoarte zilnice</li>
          </ul>

          <h2>5. Conturi și securitate</h2>
          <p>Sunteți responsabil pentru păstrarea confidențialității credențialelor contului. Notificați-ne imediat în caz de acces neautorizat.</p>

          <h2>6. Planuri și plăți</h2>
          <p>Planurile Pro (19€/lună) și Agency (49€/lună) sunt facturate recurent prin Stripe. Puteți anula oricând din setări, iar accesul continuă până la sfârșitul perioadei plătite.</p>

          <h2>7. Proprietate intelectuală</h2>
          <p>Conținutul platformei, codul sursă, designul și marca ArtistPulse sunt proprietatea SC BETTER MUSIC DISTRIBUTION SRL. Datele încărcate de utilizatori rămân proprietatea acestora.</p>

          <h2>8. Limitarea răspunderii</h2>
          <p>Serviciul este oferit „ca atare". Nu garantăm rezultate specifice de creștere. Răspunderea noastră este limitată la valoarea abonamentului plătit în ultimele 12 luni.</p>

          <h2>9. Modificări</h2>
          <p>Ne rezervăm dreptul de a modifica acești termeni. Modificările semnificative vor fi comunicate prin email cu 30 de zile înainte.</p>

          <h2>10. Legea aplicabilă</h2>
          <p>Acești termeni sunt guvernați de legislația română. Litigiile se soluționează de instanțele competente din România.</p>

          <h2>11. Contact</h2>
          <p>Pentru orice întrebări: <a href="mailto:contact@getartistpulse.com" className="text-primary">contact@getartistpulse.com</a></p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
