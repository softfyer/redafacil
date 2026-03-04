
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const addCredit = async (userId: string, creditsToAdd: number): Promise<void> => {
  // VERIFICAÇÃO DE SEGURANÇA: Garante que o serviço não execute se o DB não estiver disponível.
  if (!adminDb) {
    throw new Error(
      'ERRO CRÍTICO: O Firebase Admin SDK não foi inicializado. Verifique a configuração do servidor.'
    );
  }

  if (!userId) {
    throw new Error('O ID do usuário é obrigatório para adicionar créditos.');
  }
  if (creditsToAdd <= 0) {
    throw new Error('O número de créditos a adicionar deve ser positivo.');
  }

  const studentRef = adminDb.collection('students').doc(userId);

  try {
    await studentRef.update({
      credits: FieldValue.increment(creditsToAdd),
    });
    console.log(`Créditos adicionados com sucesso (${creditsToAdd}) ao usuário ${userId}`);
  } catch (error) {
    console.error(`Falha ao adicionar créditos ao usuário ${userId}:`, error);
    throw new Error(`Não foi possível atualizar os créditos para o usuário ${userId}.`);
  }
};

export const adminStudentService = {
  addCredit,
};
