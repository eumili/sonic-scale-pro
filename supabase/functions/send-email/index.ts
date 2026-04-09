const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "ArtistPulse <noreply@getartistpulse.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "purchase" | "cancellation";
  to: string;
  name?: string;
  plan?: string;
  amount?: string;
}

function getWelcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Bine ai venit pe ArtistPulse! 🎵",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#10b981;font-size:28px;margin:0;">🎵 ArtistPulse</h1>
  </div>
  <div style="background:#111;border-radius:12px;padding:32px;border:1px solid #222;">
    <h2 style="color:#fff;font-size:22px;margin:0 0 16px 0;">Salut, ${name}! 👋</h2>
    <p style="color:#aaa;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
      Bine ai venit pe ArtistPulse — platforma care te ajută să crești ca artist independent.
    </p>
    <p style="color:#aaa;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
      Contul tău este activ și poți începe imediat:
    </p>
    <ul style="color:#aaa;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px 0;">
      <li>Conectează-ți platformele (YouTube, Spotify, TikTok, Instagram)</li>
      <li>Primește primul tău Artist Health Score</li>
      <li>Descoperă recomandări personalizate bazate pe date</li>
    </ul>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://getartistpulse.com/dashboard" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
        Mergi la Dashboard →
      </a>
    </div>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:24px 0 0 0;border-top:1px solid #222;padding-top:16px;">
      Dacă ai întrebări, răspunde la acest email sau scrie-ne la
      <a href="mailto:contact@getartistpulse.com" style="color:#10b981;">contact@getartistpulse.com</a>.
    </p>
  </div>
  <p style="color:#444;font-size:12px;text-align:center;margin-top:24px;">
    © 2026 ArtistPulse — SC BETTER MUSIC DISTRIBUTION SRL<br>
    Str. Seci nr. 40, Ap. BIR. 2, Bălești, jud. Gorj, România
  </p>
</div>
</body>
</html>`,
  };
}

function getPurchaseEmail(name: string, plan: string, amount: string): { subject: string; html: string } {
  return {
    subject: `Confirmare abonament ${plan} — ArtistPulse`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#10b981;font-size:28px;margin:0;">🎵 ArtistPulse</h1>
  </div>
  <div style="background:#111;border-radius:12px;padding:32px;border:1px solid #222;">
    <h2 style="color:#fff;font-size:22px;margin:0 0 16px 0;">Mulțumim, ${name}! 🎉</h2>
    <p style="color:#aaa;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
      Abonamentul tău <strong style="color:#10b981;">${plan}</strong> este acum activ.
    </p>
    <div style="background:#0a0a0a;border-radius:8px;padding:20px;margin:0 0 24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#888;font-size:14px;padding:6px 0;">Plan</td>
          <td style="color:#fff;font-size:14px;padding:6px 0;text-align:right;font-weight:600;">${plan}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:14px;padding:6px 0;">Suma</td>
          <td style="color:#fff;font-size:14px;padding:6px 0;text-align:right;font-weight:600;">€${amount}</td>
        </tr>
        <tr>
          <td style="color:#888;font-size:14px;padding:6px 0;">Status</td>
          <td style="color:#10b981;font-size:14px;padding:6px 0;text-align:right;font-weight:600;">Activ ✓</td>
        </tr>
      </table>
    </div>
    <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 8px 0;">
      Acum ai acces la toate funcțiile ${plan}:
    </p>
    <ul style="color:#aaa;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px 0;">
      ${plan === "Agency" ? `
      <li>Multi-artist management</li>
      <li>API access complet</li>
      <li>Rapoarte white-label</li>
      <li>Suport prioritar dedicat</li>
      ` : `
      <li>Analytics detaliat 90 zile</li>
      <li>AI Chat nelimitat</li>
      <li>Alerte algoritm în timp real</li>
      <li>Export rapoarte PDF</li>
      `}
    </ul>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://getartistpulse.com/dashboard" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
        Explorează Dashboard →
      </a>
    </div>
    <p style="color:#666;font-size:13px;line-height:1.6;margin:24px 0 0 0;border-top:1px solid #222;padding-top:16px;">
      Poți gestiona abonamentul din <a href="https://getartistpulse.com/dashboard/settings" style="color:#10b981;">Setări</a>.
      Factura este disponibilă prin Stripe.
    </p>
  </div>
  <p style="color:#444;font-size:12px;text-align:center;margin-top:24px;">
    © 2026 ArtistPulse — SC BETTER MUSIC DISTRIBUTION SRL<br>
    Str. Seci nr. 40, Ap. BIR. 2, Bălești, jud. Gorj, România
  </p>
</div>
</body>
</html>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, name, plan, amount } = (await req.json()) as EmailRequest;

    if (!to || !type) {
      return new Response(JSON.stringify({ error: "Missing to or type" }), { status: 400, headers: corsHeaders });
    }

    let emailContent: { subject: string; html: string };

    switch (type) {
      case "welcome":
        emailContent = getWelcomeEmail(name || "Artist");
        break;
      case "purchase":
        emailContent = getPurchaseEmail(name || "Artist", plan || "Pro", amount || "19");
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid email type" }), { status: 400, headers: corsHeaders });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({ error: "Failed to send email", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
