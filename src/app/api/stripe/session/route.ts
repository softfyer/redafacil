
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items.data.price.product'],
    });
    
    // Verifica se a sessão de checkout foi concluída, em vez de verificar o status do pagamento.
    // Isso evita a condição de corrida em que o usuário chega antes da confirmação do pagamento.
    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'Checkout session is not complete' }, { status: 402 });
    }

    return NextResponse.json(session);

  } catch (error: any) {
    console.error(`Error retrieving session ${sessionId}:`, error);
    // Se a sessão não for encontrada ou a chave de API estiver incorreta, a Stripe retorna um erro
    return NextResponse.json({ error: 'Invalid session ID or server error' }, { status: 500 });
  }
}
