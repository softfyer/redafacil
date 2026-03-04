
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return new NextResponse(JSON.stringify({ error: 'ID da sessão não encontrado.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Busca a sessão e expande o objeto 'payment_intent' para ter acesso ao seu ID.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    // Lógica de verificação para garantir que o pagamento foi concluído.
    if (session.status === 'open') {
        return new NextResponse(JSON.stringify({ error: 'Checkout session is not complete.' }), {
            status: 402, // "Payment Required" é um bom status para "ainda não pago"
            headers: { 'Content-Type': 'application/json' },
        });
    }
    if (session.status !== 'complete') {
        throw new Error(`A sessão de checkout não foi completada com sucesso (Status: ${session.status})`);
    }

    // 2. Extrai o ID do payment_intent.
    const paymentIntentId = session.payment_intent?.id;

    if (!paymentIntentId) {
        throw new Error('Não foi possível encontrar o ID do pagamento associado a esta sessão.');
    }
    
    // 3. Retorna o ID do pagamento para o frontend.
    return NextResponse.json({
      paymentId: paymentIntentId,
    });

  } catch (error: any) {
    console.error('Error fetching Stripe session:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
