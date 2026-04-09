import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Get customer_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.customer_id) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: profile.customer_id,
      limit: 24,
      status: "paid",
    });

    // Also fetch open/uncollectible invoices
    const openInvoices = await stripe.invoices.list({
      customer: profile.customer_id,
      limit: 5,
      status: "open",
    });

    const allInvoices = [...openInvoices.data, ...invoices.data];

    const mapped = allInvoices.map((inv) => ({
      id: inv.number || inv.id,
      date: inv.created ? new Date(inv.created * 1000).toISOString().split("T")[0] : "",
      amount: inv.amount_paid != null
        ? `€${(inv.amount_paid / 100).toFixed(2)}`
        : inv.amount_due != null
          ? `€${(inv.amount_due / 100).toFixed(2)}`
          : "€0.00",
      status: inv.status === "paid" ? "Platit" : inv.status === "open" ? "In asteptare" : inv.status === "uncollectible" ? "Esuat" : (inv.status || "Necunoscut"),
      pdf_url: inv.invoice_pdf || null,
      hosted_url: inv.hosted_invoice_url || null,
    }));

    return new Response(JSON.stringify({ invoices: mapped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-invoices error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
