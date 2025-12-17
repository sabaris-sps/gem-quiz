export interface Question {
  qno: number;
  question_text: string;
  options: string[];
  answer: string;
  hint: string;
  solution: string;
  page_ref: number;
}

export interface UserState {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface QuizProgress {
  currentQuestionIndex: number;
  answers: Record<number, string>; // qno -> selected option
  notes: Record<number, string>; // qno -> user note
  completed: boolean;
}

export enum AnswerStatus {
  Unanswered,
  Correct,
  Incorrect,
}