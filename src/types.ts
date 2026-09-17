export type QuestionType = 'mcq' | 'true_false' | 'theory';

export type PartialMarkingRule = 'half' | 'zero';

export interface McqOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  marks: number;
  // MCQ specific
  options?: McqOption[];
  correctOptionIds?: string[];
  partialMarkingRule?: PartialMarkingRule; // 'half' (50% for 1 correct + 1 wrong in 2-choice) or 'zero'
  // True / False specific
  correctBoolean?: boolean;
  // Theory specific
  modelAnswer?: string; // Reference conceptual answer provided by teacher
}

export interface Test {
  id: string;
  slug?: string;
  title: string;
  subject: string;
  instructions: string;
  timeLimitMinutes: number | null; // null means no time limit
  questions: Question[];
  totalMarks: number;
  createdAt: string;
  creatorName: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  selectedBoolean?: boolean | null;
  theoryAnswer?: string;
  isLocked?: boolean;
}

export interface TheoryFeedback {
  conceptMatchPercentage: number; // 0 to 100
  accuracyScore: number; // 0 to 10
  conceptualVerdict: string;
  strengths: string;
  missingPoints: string;
  rubricNotes: string;
}

export interface QuestionEvaluation {
  questionId: string;
  questionType: QuestionType;
  questionText: string;
  marksAwarded: number;
  maxMarks: number;
  status: 'correct' | 'partial' | 'wrong';
  studentAnswerDisplay: string;
  correctAnswerDisplay: string;
  theoryFeedback?: TheoryFeedback;
}

export interface TestSubmission {
  id: string;
  testId: string;
  testTitle: string;
  subject: string;
  studentName: string;
  studentIdentifier?: string;
  submittedAt: string;
  timeSpentSeconds: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  passed: boolean;
  evaluations: QuestionEvaluation[];
}
