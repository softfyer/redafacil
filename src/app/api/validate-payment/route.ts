
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
        throw new Error('Faltando userId ou paymentIntentId da sessão');
    }

    const paymentsRef = adminDb.collection('payments');
    const q = paymentsRef.where('paymentIntentId', '==', paymentIntentId).limit(1);
    const snapshot = await q.get();

    if (!snapshot.empty) {
        console.log(`Pagamento ${paymentIntentId} já foi processado.`);
        return;
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
    });

    if (!lineItems || lineItems.data.length === 0) {
        throw new Error('Não foi possível obter os itens da sessão');
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
            createdAt: Timestamp.now(),
        };
        
        paymentPromises.push(paymentsRef.add(paymentData));
    }

    if (totalCredits > 0) {
        await adminStudentService.addCredit(userId, totalCredits);
    }
    await Promise.all(paymentPromises);

    console.log(`Pagamento processado e ${totalCredits} créditos concedidos ao usuário ${userId}.`);
}

export async function POST(req: NextRequest) {
    if (!adminStatus.isInitialized || !adminDb) {
        console.error("API Error: Firebase Admin SDK não está inicializado.");
        return NextResponse.json(
            { message: `Erro de Servidor: ${adminStatus.error || 'Firebase Admin SDK não inicializado.'}` },
            { status: 500 }
        );
    }

    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ message: 'ID da sessão é obrigatório' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['line_items', 'payment_intent'],
        });

        if (session.payment_status === 'paid') {
            await handleSuccessfulPayment(session);
            return NextResponse.json({ message: 'Pagamento confirmado e créditos adicionados com sucesso!' }, { status: 200 });
        }

        return NextResponse.json({ message: 'O pagamento não foi concluído com sucesso.' }, { status: 402 });

    } catch (error: any) {
        console.error('[VALIDATE_PAYMENT_ERROR]', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
