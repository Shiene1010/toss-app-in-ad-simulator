export interface AdParams {
  userId: string;
  adId: string;
  rewardPoints: number;
  environment: 'development' | 'production';
  hasQuiz: boolean;
  quizQuestion: string;
  quizAnswer: string;
  quizOptions: string[];
}

export interface BridgeLog {
  id: string;
  timestamp: string;
  type: 'sent' | 'received' | 'info';
  event: string;
  payload: any;
}

export type AdStep = 'intro' | 'interaction' | 'completed';
