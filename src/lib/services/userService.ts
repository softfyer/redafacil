import { doc, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser, signOut } from 'firebase/auth';
import { db } from '@/lib/firebase';

export const deleteUserAccount = async (uid: string, role: string) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || user.uid !== uid) {
    throw new Error("Ação não autorizada ou usuário não encontrado.");
  }
  
  try {
    // O caminho do documento do Firestore depende da função do usuário (por exemplo, 'students', 'teachers')
    const userDocRef = doc(db, `${role}s`, uid);
    await deleteDoc(userDocRef);

    // Excluir usuário do Firebase Authentication
    await deleteUser(user);
    
    // Fazer logout após a exclusão
    await signOut(auth);

  } catch (error) {
    console.error("Erro ao excluir usuário: ", error);
    // Re-lançar o erro para ser tratado pelo componente
    throw error;
  }
};
