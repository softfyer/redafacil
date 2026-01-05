export type Essay = {
  id: string;
  studentName: string;
  studentId: string;
  title: string;
  topic: string;
  textType: 'dissertativo-argumentativo' | 'carta' | 'artigo-de-opiniao' | 'outro';
  targetExam: string;
  promptCommands: string;
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
    topic: 'Violência contra a mulher',
    textType: 'dissertativo-argumentativo',
    targetExam: 'ENEM 2015',
    promptCommands: 'A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema "A persistência da violência contra a mulher na sociedade brasileira", apresentando proposta de intervenção que respeite os direitos humanos. Selecione, organize e relacione, de forma coerente e coesa, argumentos e fatos para defesa de seu ponto de vista.',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'submitted',
    fileUrl: '/placeholder.pdf',
  },
  {
    id: 'essay-2',
    studentName: 'Carlos Souza',
    studentId: 'user-2',
    title: 'Desafios para a formação educacional de surdos no Brasil',
    topic: 'Educação de surdos',
    textType: 'dissertativo-argumentativo',
    targetExam: 'ENEM 2017',
    promptCommands: 'Escreva uma redação sobre os desafios para a formação educacional de surdos no Brasil.',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'submitted',
    fileUrl: '/placeholder.pdf',
  },
  {
    id: 'essay-3',
    studentName: 'Juliana Pereira',
    studentId: 'user-1',
    title: 'Caminhos para combater a intolerância religiosa no Brasil',
    topic: 'Intolerância religiosa',
    textType: 'dissertativo-argumentativo',
    targetExam: 'ENEM 2016',
    promptCommands: 'Desenvolva um texto sobre como combater a intolerância religiosa no Brasil.',
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