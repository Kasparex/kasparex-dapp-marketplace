export type ChronicleQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type ChronicleQuizEntry = {
  txHash: string;
  used: boolean;
  paidAt: string;
};

export type ChronicleQuizWalletState = {
  completedSlugs: string[];
  activeEntry?: ChronicleQuizEntry;
};
