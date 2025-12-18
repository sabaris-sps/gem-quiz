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
  answers: Record<number, string>; // qno -> selected option
  notes: Record<number, string>; // qno -> user note
  marks: Record<number, string>; // qno -> color hex/class
  completed: boolean;
  lastUpdated: number; // Timestamp in ms
}

export enum AnswerStatus {
  Unanswered,
  Correct,
  Incorrect,
}