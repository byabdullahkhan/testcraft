import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  FileText,
  User,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TestSubmission } from '../types';

interface TestResultReportProps {
  submission: TestSubmission;
  onRetakeOrReturn?: () => void;
}

export const TestResultReport: React.FC<TestResultReportProps> = ({
  submission,
  onRetakeOrReturn,
}) => {
  const [expandedTheoryIndex, setExpandedTheoryIndex] = useState<number | null>(null);

  // Filter mistakes
  const wrongQuestions = submission.evaluations.filter(e => e.status === 'wrong');
  const partialQuestions = submission.evaluations.filter(e => e.status === 'partial');
  const correctQuestions = submission.evaluations.filter(e => e.status === 'correct');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Official Assessment Report
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-2">
              {submission.testTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Subject: <strong className="text-slate-800">{submission.subject}</strong> • Completed on {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Student Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-right">
            <span className="text-xs text-slate-500 block">Candidate Name</span>
            <span className="text-base font-bold text-slate-900 flex items-center gap-1.5 justify-end">
              <User className="w-4 h-4 text-indigo-600" />
              {submission.studentName}
            </span>
            {submission.studentIdentifier && (
              <span className="text-xs text-slate-500 block">ID: {submission.studentIdentifier}</span>
            )}
          </div>
        </div>

        {/* Big Score Performance Banner */}
        <div
          className={`rounded-2xl p-6 sm:p-8 border flex flex-col md:flex-row items-center justify-between gap-6 mb-8 text-center md:text-left ${
            submission.passed
              ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-emerald-200'
              : 'bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-white border-rose-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-extrabold font-display shadow-md ${
                submission.passed
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-rose-600 text-white shadow-rose-200'
              }`}
            >
              {submission.grade}
            </div>

            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-2 ${
                  submission.passed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {submission.passed ? 'Assessment Passed' : 'Needs Review & Practice'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
                {submission.totalScore}{' '}
                <span className="text-xl sm:text-2xl text-slate-500 font-medium">
                  / {submission.maxScore} Marks
                </span>
              </h2>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Score Percentage: <strong className="text-slate-900">{submission.percentage}%</strong> • Time Taken: {Math.floor(submission.timeSpentSeconds / 60)}m {submission.timeSpentSeconds % 60}s
              </p>
            </div>
          </div>

          {/* Quick Stat Counters */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-white/90 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-xs text-emerald-700 font-bold block">Correct</span>
              <span className="text-xl font-extrabold text-emerald-800 font-display">
                {correctQuestions.length}
              </span>
            </div>
            <div className="bg-white/90 border border-amber-200 rounded-xl p-3 text-center">
              <span className="text-xs text-amber-700 font-bold block">Partial</span>
              <span className="text-xl font-extrabold text-amber-800 font-display">
                {partialQuestions.length}
              </span>
            </div>
            <div className="bg-white/90 border border-rose-200 rounded-xl p-3 text-center">
              <span className="text-xs text-rose-700 font-bold block">Mistakes</span>
              <span className="text-xl font-extrabold text-rose-800 font-display">
                {wrongQuestions.length}
              </span>
            </div>
          </div>
        </div>

        {onRetakeOrReturn && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
            <button
              onClick={onRetakeOrReturn}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Workspace
            </button>
          </div>
        )}
      </div>

      {/* Mistake Analysis Highlight Section */}
      {wrongQuestions.length > 0 && (
        <div className="mb-8 bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold text-rose-900 font-display">
              Mistake Analysis ({wrongQuestions.length} Question{wrongQuestions.length === 1 ? '' : 's'})
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-rose-800 mb-4">
            Review the questions where marks were lost. Examine the correct solutions and conceptual feedback below.
          </p>
          <div className="flex flex-wrap gap-2">
            {wrongQuestions.map((wq, i) => (
              <span
                key={wq.questionId}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-800 shadow-2xs"
              >
                Q: {wq.questionText.length > 40 ? wq.questionText.substring(0, 38) + '...' : wq.questionText} (0/{wq.maxMarks} pts)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Detailed Breakdown */}
      <div className="mb-8">
        <h3 className="text-xl font-extrabold text-slate-900 font-display mb-4">
          Detailed Question-by-Question Evaluation
        </h3>

        <div className="space-y-6">
          {submission.evaluations.map((evalItem, qIndex) => {
            const isCorrect = evalItem.status === 'correct';
            const isPartial = evalItem.status === 'partial';
            const isWrong = evalItem.status === 'wrong';

            return (
              <div
                key={evalItem.questionId}
                id={`report-item-${qIndex + 1}`}
                className={`bg-white rounded-2xl p-6 sm:p-7 border transition-all ${
                  isCorrect
                    ? 'border-emerald-200 shadow-sm'
                    : isPartial
                    ? 'border-amber-200 shadow-sm'
                    : 'border-rose-200 shadow-sm'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold font-display">
                      Q{qIndex + 1}
                    </span>

                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPartial
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {isPartial && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      {isWrong && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {isCorrect ? 'Correct' : isPartial ? 'Partial Credit' : 'Incorrect'}
                    </span>

                    <span className="text-xs font-bold uppercase text-slate-400">
                      • {evalItem.questionType.toUpperCase()}
                    </span>
                  </div>

                  <span className="font-bold text-sm font-display text-slate-900">
                    Awarded: <strong className={isCorrect ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-rose-600'}>{evalItem.marksAwarded}</strong> / {evalItem.maxMarks} Marks
                  </span>
                </div>

                {/* Question Statement */}
                <h4 className="text-base font-bold text-slate-900 mb-4">
                  {evalItem.questionText}
                </h4>

                {/* Answers Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  {/* Student Answer */}
                  <div
                    className={`p-4 rounded-xl border ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isPartial
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Your Answer:
                    </span>
                    <p className="font-semibold text-slate-900 leading-relaxed">
                      {evalItem.studentAnswerDisplay || '(No answer selected / blank)'}
                    </p>
                  </div>

                  {/* Correct Answer / Reference */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      {evalItem.questionType === 'theory' ? "Teacher's Reference Concept:" : 'Correct Answer:'}
                    </span>
                    <p className="font-semibold text-slate-900 leading-relaxed">
                      {evalItem.correctAnswerDisplay}
                    </p>
                  </div>
                </div>

                {/* AI Theory Conceptual Evaluation Box */}
                {evalItem.theoryFeedback && (
                  <div className="mt-4 p-4 sm:p-5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs sm:text-sm">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-200/60">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900 text-sm">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Conceptual Grading Assessment
                      </div>
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-purple-200/70 text-purple-800 text-xs">
                        {evalItem.theoryFeedback.conceptMatchPercentage}% Concept Match
                      </span>
                    </div>

                    <div className="space-y-2 text-purple-950">
                      <div>
                        <strong className="text-purple-900">Verdict: </strong>
                        <span>{evalItem.theoryFeedback.conceptualVerdict}</span>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Conceptual Strengths: </strong>
                        <span>{evalItem.theoryFeedback.strengths}</span>
                      </div>
                      {evalItem.theoryFeedback.missingPoints && evalItem.theoryFeedback.missingPoints !== 'None' && (
                        <div>
                          <strong className="text-amber-800">Missing Concepts / Nuances: </strong>
                          <span>{evalItem.theoryFeedback.missingPoints}</span>
                        </div>
                      )}
                      <div className="text-xs text-purple-700 italic pt-1 border-t border-purple-200/40">
                        Evaluator Note: {evalItem.theoryFeedback.rubricNotes}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Return or Retake action */}
      <div className="text-center py-6">
        <button
          id="btn-return-home"
          onClick={onRetakeOrReturn}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tests & Dashboard
        </button>
      </div>
    </div>
  );
};
