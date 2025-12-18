import questionsData from './questions.json';
import { Question } from './types';

export const QUESTIONS: Question[] = questionsData as Question[];

// Exporting MOCK_QUESTIONS for backward compatibility if needed.
export const MOCK_QUESTIONS = QUESTIONS;