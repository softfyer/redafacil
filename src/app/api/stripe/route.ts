
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const prices = await stripe.prices.list({
      expand: ['data.product'],
    });
    return NextResponse.json(prices.data);
  } catch (error: any) {
    console.error('Error fetching Stripe prices:', error);
    return new NextResponse(
      JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const { priceId, userId } = await req.json();

  if (!userId) {
    return new NextResponse('User ID not found', { status: 401 });
  }

  try {
    // A fonte de verdade para a URL da aplicação agora é a variável de ambiente.
    // Isso é crucial para ambientes atrás de um proxy, como o Cloud Workstations.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error('A variável de ambiente NEXT_PUBLIC_APP_URL não está definida.');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Usa a URL base da variável de ambiente para construir os links.
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/failure`,
      metadata: {
        userId: userId,
      },
    });

    if (!session.url) {
      throw new Error('Could not create checkout session');
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, {
      status: 500,
    });
  }
}
