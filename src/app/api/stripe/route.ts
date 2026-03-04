
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
    // Dinamicamente obtém a URL de origem da requisição
    const origin = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Usa a origem dinâmica para as URLs de sucesso e cancelamento
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/failure`,
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
