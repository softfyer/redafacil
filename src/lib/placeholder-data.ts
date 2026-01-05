export type Essay = {
  id: string;
  studentName: string;
  studentId: string;
  title: string;
  submittedAt: Date;
  status: 'submitted' | 'corrected';
  fileUrl: string; // URL to the original document
  correctedFileUrl?: string; // URL to the corrected document
  audioFeedbackUrl?: string; // URL to the audio feedback
  textFeedback?: string;
};

export type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

export const mockEssays: Essay[] = [
  {
    id: 'essay-1',
    studentName: 'Ana Silva',
    studentId: 'user-1',
    title: 'A persistência da violência contra a mulher na sociedade brasileira',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'submitted',
    fileUrl: '/placeholder.pdf',
  },
  {
    id: 'essay-2',
    studentName: 'Carlos Souza',
    studentId: 'user-2',
    title: 'Desafios para a formação educacional de surdos no Brasil',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'submitted',
    fileUrl: '/placeholder.pdf',
  },
  {
    id: 'essay-3',
    studentName: 'Juliana Pereira',
    studentId: 'user-1', // Belongs to Ana Silva for testing
    title: 'Caminhos para combater a intolerância religiosa no Brasil',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    status: 'corrected',
    fileUrl: '/placeholder.pdf',
    correctedFileUrl: '/placeholder-corrected.pdf',
    audioFeedbackUrl: '/placeholder-audio.mp3',
    textFeedback: 'Ótimo trabalho! Você demonstrou bom domínio do tema e argumentou de forma consistente. Preste atenção à concordância verbal em alguns trechos. No geral, sua redação está excelente, continue assim!'
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    message: 'Sua redação "Caminhos para combater a intolerância religiosa no Brasil" foi corrigida!',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
    {
    id: 'notif-2',
    message: 'Bem-vindo(a) à Redação Online!',
    read: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
];
