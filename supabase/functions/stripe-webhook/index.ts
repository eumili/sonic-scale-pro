import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature" }), { status: 400, headers: corsHeaders });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: unknown) {
      console.error("Webhook signature verification failed:", (err as Error).message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: corsHeaders });
    }

    // Use service role key for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        // Get subscription details to determine plan
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;

        // Map price ID to plan
        let plan = "pro";
        const agencyPriceIds = [
          "price_1TJugcGov5n78hOqYt34TN96", // agency monthly
          "price_1TJugdGov5n78hOqlGVni8yJ", // agency yearly
        ];
        if (agencyPriceIds.includes(priceId)) {
          plan = "agency";
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            plan,
            plan_status: "active",
            customer_id: customerId,
          })
          .eq("id", userId);

        if (error) {
          console.error("Error updating profile:", error);
        } else {
          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer_id
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (!profile) {
          console.error("No profile found for customer:", customerId);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        let plan = "pro";
        const agencyPriceIds = [
          "price_1TJugcGov5n78hOqYt34TN96",
          "price_1TJugdGov5n78hOqlGVni8yJ",
        ];
        if (agencyPriceIds.includes(priceId)) {
          plan = "agency";
        }

        const status = subscription.status === "active" ? "active" : subscription.status;

        const { error } = await supabase
          .from("profiles")
          .update({ plan, plan_status: status })
          .eq("id", profile.id);

        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Subscription updated for user ${profile.id}: ${plan} (${status})`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (!profile) {
          console.error("No profile found for customer:", customerId);
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({ plan: "free", plan_status: "canceled" })
          .eq("id", profile.id);

        if (error) {
          console.error("Error downgrading user:", error);
        } else {
          console.log(`User ${profile.id} downgraded to free (subscription canceled)`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("customer_id", customerId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ plan_status: "past_due" })
            .eq("id", profile.id);
          console.log(`Payment failed for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
