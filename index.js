// Install dependencies first:
// npm install express stripe cors dotenv

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Stripe with your secret key
const stripe = Stripe('secret key');

// Create Checkout Session endpoint
app.post("/create-checkout-session", async (req, res) => {
  const { amount, name } = req.body;
  console.log(amount, name);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'bancontact', 'eps', 'ideal', 'p24', 'sepa_debit'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd', // You can change to 'inr'
            product_data: {
              name: name,
              description: 'Personal coding project',
            },
            unit_amount: amount, // amount in cents (e.g., 5000 = $50)
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:5173/?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/cancel',
    });

   

    res.json({ url: session.url }); // send Checkout Session URL to frontend
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
const endpointSecret = 'whsec_XXXXXXXXXXXXXXXX'; // replace with your Stripe webhook secret

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💰 Payment successful for session:', session.id);
      // handle your order fulfillment here
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(' PaymentIntent succeeded:', paymentIntent.id);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod attached:', paymentMethod.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.sendStatus(200);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
