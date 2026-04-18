const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

const PRICE_IDS: Record<string, string> = {
  weekly:    'price_1TLPoR2lAgnxlUR2GgO1qfq5',
  monthly:   'price_1TLPoS2IAgnxIUR2kM8EEpAJ',
  quarterly: 'price_1TLPoR2IAgnxIUR2kMAdKNg2',
  annual:    'price_1TLPoS2IAgnxIUR2ABqEaVyL',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, userId, userEmail, returnUrl } = await req.json();

    if (!plan || !userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('payment_method_types[]', 'card');
    params.append('customer_email', userEmail);
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${returnUrl}/pricing`);
    params.append('metadata[userId]', userId);
    params.append('metadata[plan]', plan);
    params.append('subscription_data[metadata][userId]', userId);
    params.append('subscription_data[metadata][plan]', plan);

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error('Stripe error:', JSON.stringify(session));
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Stripe error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Checkout error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});