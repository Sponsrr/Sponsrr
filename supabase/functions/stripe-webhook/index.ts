import Stripe from 'https://esm.sh/stripe@13.3.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SB_URL')!,
  Deno.env.get('SB_SERVICE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan   = session.metadata?.plan;

        if (!userId || !plan) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Ensure profile exists
        await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' });

        // Upsert subscription
        await supabase.from('subscriptions').upsert({
          user_id:                userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id:     subscription.customer as string,
          plan:                   plan,
          status:                 subscription.status,
          current_period_start:   new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        console.log(`✅ Subscription created for user ${userId} on ${plan} plan`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const plan   = subscription.metadata?.plan;

        if (!userId) break;

        await supabase.from('subscriptions')
          .update({
            status:               subscription.status,
            plan:                 plan || 'monthly',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`✅ Subscription updated for ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`✅ Subscription cancelled for ${subscription.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        await supabase.from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription as string);

        console.log(`⚠️ Payment failed for subscription ${invoice.subscription}`);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});