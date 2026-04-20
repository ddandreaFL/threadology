import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const customerId = session.customer as string | null;

    if (userId) {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ is_premium: true, stripe_customer_id: customerId })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update premium status:", error);
        return NextResponse.json(
          { error: "Database update failed" },
          { status: 500 }
        );
      }

      console.log(`User ${userId} upgraded to premium`);
    }
  }

  if (
    event.type === "customer.subscription.updated" &&
    event.data.object.cancel_at_period_end === false &&
    event.data.object.status === "active"
  ) {
    const customerId = event.data.object.customer as string;
    await supabaseAdmin
      .from("users")
      .update({ is_premium: true })
      .eq("stripe_customer_id", customerId);
  }

  if (
    event.type === "customer.subscription.deleted" ||
    (event.type === "customer.subscription.updated" &&
      event.data.object.cancel_at_period_end === true)
  ) {
    const subscription = event.data.object;
    const customerId = subscription.customer as string;

    const { error } = await supabaseAdmin
      .from("users")
      .update({ is_premium: false })
      .eq("stripe_customer_id", customerId);

    if (error) {
      console.error("Failed to downgrade user:", error);
    } else {
      console.log(`User with customer ${customerId} downgraded`);
    }
  }

  return NextResponse.json({ received: true });
}
