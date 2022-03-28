import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);


export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const bufRequest = await buffer(req);
    const secretCode = req.headers["stripe-signature"];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        bufRequest, secretCode, process.env.STRIPE_WEBHOOK_SECRET
      );

    } catch(err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    const { type: eventType } = event;

    if (relevantEvents.has(eventType)) {
      try {
        switch (eventType) {
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            );

            break;

          case "checkout.session.completed":

            const checkoutSession = event.data.object as Stripe.Checkout.Session;

            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );

            break;
          default:
            throw new Error("Unhandled Event.");
        }
      } catch (err) {
        return res.json({ error: "webhook handler failed" });
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader("ALLOW", "POST");
    res.status(405).end("Method not allowed");
  }
}
