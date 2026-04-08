import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function GDPR() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <h1 className="text-3xl font-bold text-foreground mb-8">Drepturile tale GDPR</h1>
          <p className="text-sm text-muted-foreground mb-6">Ultima actualizare: 8 aprilie 2026</p>

          <h2>Regulamentul (UE) 2016/679 (GDPR)</h2>
          <p>Conform GDPR, ai următoarele drepturi în legătură cu datele tale personale prelucrate de ArtistPulse:</p>

          <h2>1. Dreptul de acces (Art. 15)</h2>
          <p>Poți solicita o copie a tuturor datelor personale pe care le deținem despre tine.</p>

          <h2>2. Dreptul la rectificare (Art. 16)</h2>
          <p>Poți solicita corectarea datelor inexacte sau completarea datelor incomplete.</p>

          <h2>3. Dreptul la ștergere — „dreptul de a fi uitat" (Art. 17)</h2>
          <p>Poți solicita ștergerea completă a contului și a tuturor datelor asociate. Procesăm cererile în maxim 30 de zile.</p>

          <h2>4. Dreptul la restricționare (Art. 18)</h2>
          <p>Poți solicita restricționarea prelucrării datelor tale în anumite circumstanțe.</p>

          <h2>5. Dreptul la portabilitate (Art. 20)</h2>
          <p>Poți solicita datele tale într-un format structurat, utilizat frecvent și care poate fi citit automat (JSON/CSV).</p>

          <h2>6. Dreptul la opoziție (Art. 21)</h2>
          <p>Te poți opune prelucrării datelor în scopuri de marketing direct sau pe baza interesului legitim.</p>

          <h2>7. Dreptul de a nu fi supus deciziilor automate (Art. 22)</h2>
          <p>AI Chat și recomandările sunt instrumente de asistare, nu decizii automate cu efect juridic.</p>

          <h2>Cum îți exerciți drepturile</h2>
          <p>Trimite un email la <a href="mailto:privacy@getartistpulse.com" className="text-primary">privacy@getartistpulse.com</a> cu subiectul „Cerere GDPR — [dreptul solicitat]". Răspundem în maxim 30 de zile calendaristice.</p>

          <h2>Responsabil Protecția Datelor (DPO)</h2>
          <p>Email: <a href="mailto:privacy@getartistpulse.com" className="text-primary">privacy@getartistpulse.com</a><br />
          SC BETTER MUSIC DISTRIBUTION SRL<br />
          CUI 43328568, Reg. Com. J18/952/2020, Str. Seci nr. 40, Ap. BIR. 2, Bălești, jud. Gorj, cod 217045, România</p>

          <h2>Autoritatea de supraveghere</h2>
          <p>Ai dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) — <a href="https://www.dataprotection.ro" className="text-primary" target="_blank" rel="noopener noreferrer">www.dataprotection.ro</a>.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
