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

export interface AssignmentProgress {
  answers: Record<number, string>; // qno -> selected option
  notes: Record<number, string>; // qno -> user note
  marks: Record<number, string>; // qno -> color class
  completed: boolean;
  lastUpdated: number; // Timestamp in ms
}

export interface QuizProgress {
  // Map of assignmentId -> AssignmentProgress
  assignments: Record<string, AssignmentProgress>;
  lastUpdated: number;
}

export interface Assignment {
  "asgn-unique-name": string;
  "asgn-display-name": string;
  "num_of_questions": number;
  "has_pg_ref": boolean;
  "has_hints": boolean;
  "has_solutions": boolean;
}

export enum AnswerStatus {
  Unanswered,
  Correct,
  Incorrect,
}