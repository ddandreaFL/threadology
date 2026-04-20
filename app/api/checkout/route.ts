import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";
import { getUserProfile } from "@/lib/auth";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getUserProfile(user.id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vault/${profile?.username}?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
