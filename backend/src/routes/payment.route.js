import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, planName } = req.body;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId || "price_1U7zpuCH9KlriAmIzJZI3epT",
          quantity: 1,
        },
      ],
      metadata: {
        plan: planName || "Pro Creator",
      },
      success_url: `${clientUrl}/dashboard?success=true`,
      cancel_url: `${clientUrl}/?canceled=true`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;