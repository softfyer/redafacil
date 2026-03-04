
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { studentService } from '@/lib/services/studentService';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
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
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session?.metadata?.userId || !session.line_items) {
        console.error('Missing metadata or line items from session');
        return new NextResponse('Missing metadata or line items', {
          status: 400,
        });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ['data.price.product'],
        }
      );

      if (!lineItems) {
        console.error('Could not get line items from session');
        return new NextResponse('Could not get line items', { status: 400 });
      }

      const creditsToAdd = lineItems.data.reduce((acc, item) => {
        const product = item.price?.product as Stripe.Product;
        const credits = parseInt(product.metadata.credits || '0', 10);
        return acc + credits * (item.quantity || 1);
      }, 0);

      try {
        await studentService.addCredit(session.metadata.userId, creditsToAdd);
      } catch (error) {
        console.error(`Failed to add credit to user ${session.metadata.userId}`);
        return new NextResponse(
          `Failed to add credit to user ${session.metadata.userId}`,
          { status: 500 }
        );
      }

      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new NextResponse(null, { status: 200 });
}
