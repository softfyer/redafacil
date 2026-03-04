
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminStudentService } from '@/lib/services/adminStudentService';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    console.error('Webhook Error: No stripe-signature header value was provided.');
    return new NextResponse('No stripe-signature header value was provided', {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session?.metadata?.userId;
    const paymentIntentId = session.payment_intent as string;

    if (!userId || !paymentIntentId) {
      console.error(
        'Webhook Error: Missing userId or paymentIntentId from session metadata'
      );
      return new NextResponse('Missing required session data', { status: 400 });
    }

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      if (!lineItems || lineItems.data.length === 0) {
        throw new Error('Could not retrieve line items from session');
      }

      let totalCredits = 0;
      const paymentPromises: Promise<any>[] = [];

      for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product;
        if (!product || !item.price) {
            console.warn('Skipping item with no product or price data.', item);
            continue;
        }

        const credits = parseInt(product?.metadata.credits || '0', 10);
        const quantity = item.quantity || 1;
        const creditsToAdd = credits * quantity;
        totalCredits += creditsToAdd;

        const paymentData = {
          userId,
          productId: product.id,
          productName: product.name,
          amount: item.amount_total / 100, // Amount is in cents
          credits: creditsToAdd,
          paymentIntentId,
          status: 'completed' as const,
          createdAt: Timestamp.now(),
        };
        
        // Adiciona a promessa de criação de pagamento ao array
        paymentPromises.push(adminDb.collection('payments').add(paymentData));
      }

      // Adiciona os créditos totais e registra todos os pagamentos em paralelo
      await Promise.all([
        adminStudentService.addCredit(userId, totalCredits),
        ...paymentPromises,
      ]);

    } catch (error: any) {
      console.error(`Error processing checkout for user ${userId}:`, error);
      return new NextResponse(`Internal Server Error: ${error.message}`, {
        status: 500,
      });
    }
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
