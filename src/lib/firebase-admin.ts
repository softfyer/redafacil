import * as admin from 'firebase-admin';

interface AdminStatus {
    isInitialized: boolean;
    error: string | null;
}

// Objeto que rastreia o status da inicialização
const status: AdminStatus = {
    isInitialized: false,
    error: null,
};

// Verifica se a variável de ambiente crucial existe
if (!process.env.FIREBASE_ADMIN_CONFIG) {
    status.error = 'A variável de ambiente FIREBASE_ADMIN_CONFIG não foi definida.';
    console.error(`🔴 ${status.error}`);
} else {
    // Inicializa o app apenas se ainda não houver um
    if (!admin.apps.length) {
        try {
            // Faz o parse da configuração a partir da variável de ambiente
            const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            console.log("✅ Firebase Admin SDK inicializado com sucesso.");
            status.isInitialized = true;

        } catch (e: any) {
            status.error = `Falha na inicialização do Firebase Admin: ${e.message}. Verifique o conteúdo da variável FIREBASE_ADMIN_CONFIG.`;
            console.error(`🔴 ${status.error}`);
        }
    } else {
        // Se já estiver inicializado, apenas confirme o status.
        status.isInitialized = true;
    }
}

// Exporta as instâncias do DB e Auth somente se a inicialização foi bem-sucedida
const adminDb = status.isInitialized ? admin.firestore() : null;
const adminAuth = status.isInitialized ? admin.auth() : null;

// Exporta tudo o que for necessário para outros arquivos
export { adminDb, adminAuth, status };
