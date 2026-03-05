import Stripe from 'stripe';

// Removemos o "!" e adicionamos um fallback (uma string vazia)
// Isso permite que o objeto 'stripe' seja criado sem estourar erro no build.
const key = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(key, {
  apiVersion: '2024-04-10', // Mantendo sua versão original
  typescript: true,
});