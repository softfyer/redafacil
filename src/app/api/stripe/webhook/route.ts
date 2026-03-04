
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminStudentService } from '@/lib/services/adminStudentService';
import { adminDb, status as adminStatus } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';


async function handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    if (!adminDb) {
        throw new Error('Erro Crítico de Servidor: Firebase Admin não foi inicializado.');
    }

    const userId = session?.metadata?.userId;
    // CORREÇÃO: Extrai o ID do objeto payment_intent expandido
    const paymentIntentId = (session.payment_intent as Stripe.PaymentIntent)?.id;

    if (!userId || !paymentIntentId) {
        console.error('Webhook/Validation Error: Missing userId or paymentIntentId');
        return;
    }

    const paymentsRef = adminDb.collection('payments');
    const q = paymentsRef.where('paymentIntentId', '==', paymentIntentId).limit(1);
    const snapshot = await q.get();

    if (!snapshot.empty) {
        console.log(`Payment intent ${paymentIntentId} has already been processed. Skipping.`);
        return; 
    }

    // Obtenha o payment_intent real para pegar a data de criação correta
    const paymentIntentDetails = await stripe.paymentIntents.retrieve(paymentIntentId);

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
    });

    if (!lineItems || lineItems.data.length === 0) {
        throw new Error(`Could not retrieve line items from session ${session.id}`);
    }

    let totalCredits = 0;
    const paymentPromises: Promise<any>[] = [];

    for (const item of lineItems.data) {
        const product = item.price?.product as Stripe.Product;
        if (!product || !item.price) continue;

        const credits = parseInt(product?.metadata.credits || '0', 10);
        const quantity = item.quantity || 1;
        const creditsToAdd = credits * quantity;
        totalCredits += creditsToAdd;

        const paymentData = {
            userId,
            productId: product.id,
            productName: product.name,
            amount: item.amount_total / 100,
            credits: creditsToAdd,
            paymentIntentId, // Agora é um ID de string
            status: 'completed' as const,
            createdAt: Timestamp.fromMillis(paymentIntentDetails.created * 1000),
        };
        
        paymentPromises.push(paymentsRef.add(paymentData));
    }

    const creditPromise = totalCredits > 0 ? adminStudentService.addCredit(userId, totalCredits) : Promise.resolve();
    
    await Promise.all([
        creditPromise,
        ...paymentPromises,
    ]);

    console.log(`Webhook: Successfully processed payment ${paymentIntentId} and awarded ${totalCredits} credits to user ${userId}.`);
}

export async function POST(req: NextRequest) {
  if (!adminStatus.isInitialized || !adminDb) {
    console.error("Stripe Webhook Error: Firebase Admin SDK not initialized.");
    return NextResponse.json(
        { message: `Server Error: ${adminStatus.error || 'Firebase Admin SDK not initialized.'}` },
        { status: 500 }
    );
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new NextResponse('No stripe-signature header', { status: 400 });
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
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
       // É importante expandir o payment_intent aqui também para consistência
      const sessionWithIntent = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['payment_intent'],
      });
      await handleSuccessfulPayment(sessionWithIntent);
    } catch (error: any) {
        console.error('[STRIPE_WEBHOOK_ERROR]', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  } else {
    console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
