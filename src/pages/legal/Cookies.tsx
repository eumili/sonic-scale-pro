import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <h1 className="text-3xl font-bold text-foreground mb-8">Politica de Cookies</h1>
          <p className="text-sm text-muted-foreground mb-6">Ultima actualizare: 8 aprilie 2026</p>

          <h2>1. Ce sunt cookie-urile?</h2>
          <p>Cookie-urile sunt fișiere text mici stocate pe dispozitivul tău când vizitezi un site web. Le folosim pentru a asigura funcționarea corectă a platformei.</p>

          <h2>2. Categorii de cookies</h2>

          <h3>🟢 Necesare (întotdeauna active)</h3>
          <ul>
            <li><strong>sb-auth-token</strong> — Sesiune de autentificare Supabase (expiră la logout)</li>
            <li><strong>cookie-consent</strong> — Preferințele tale de cookies (1 an)</li>
          </ul>

          <h3>📊 Analitice (opționale)</h3>
          <ul>
            <li>Colectează date anonime despre utilizarea platformei pentru îmbunătățirea serviciului</li>
            <li>Nu identifică personal utilizatorii</li>
          </ul>

          <h3>📣 Marketing (opționale)</h3>
          <ul>
            <li>Utilizate pentru remarketing și măsurarea campaniilor</li>
            <li>Activate doar cu consimțământul tău explicit</li>
          </ul>

          <h2>3. Gestionarea cookies</h2>
          <p>Poți modifica preferințele oricând din bannerul de cookies sau din setările browserului. Dezactivarea cookie-urilor necesare poate afecta funcționarea platformei.</p>

          <h2>4. Contact</h2>
          <p>Pentru întrebări: <a href="mailto:privacy@getartistpulse.com" className="text-primary">privacy@getartistpulse.com</a></p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
