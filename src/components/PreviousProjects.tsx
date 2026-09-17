import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  PlusCircle, 
  Users, 
  Clock, 
  Award, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { TestSubmission } from '../types';
import { getStudentShareUrl } from '../utils/urlHelper';
import { apiService } from '../services/apiService';

interface TestSummary {
  id: string;
  slug?: string;
  title: string;
  subject: string;
  totalMarks: number;
  timeLimitMinutes: number | null;
  questionCount: number;
  createdAt: string;
  creatorName: string;
  submissionCount: number;
}

interface PreviousProjectsProps {
  onBackToHome: () => void;
  onMakeNewTest: () => void;
  onPreviewAsStudent: (testId: string) => void;
  filteredTestIds?: string[];
}

export const PreviousProjects: React.FC<PreviousProjectsProps> = ({
  onBackToHome,
  onMakeNewTest,
  onPreviewAsStudent,
  filteredTestIds,
}) => {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [copiedTestId, setCopiedTestId] = useState<string | null>(null);
  const [searchTestQuery, setSearchTestQuery] = useState('');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // Fetch tests
  useEffect(() => {
    setLoadingTests(true);
    apiService.getTests()
      .then(allTestsList => {
        let allTests: TestSummary[] = allTestsList || [];
        // If teacher has specific created test IDs stored locally, prioritize or filter to them
        if (filteredTestIds && filteredTestIds.length > 0) {
          const userOnly = allTests.filter(t => filteredTestIds.includes(t.id));
          if (userOnly.length > 0) {
            allTests = userOnly;
          }
        }
        setTests(allTests);
        if (allTests.length > 0 && !selectedTestId) {
          setSelectedTestId(allTests[0].id);
        }
        setLoadingTests(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingTests(false);
      });
  }, [filteredTestIds]);

  // Fetch submissions when test is selected
  useEffect(() => {
    if (!selectedTestId) return;

    setLoadingSubmissions(true);
    apiService.getSubmissions(selectedTestId)
      .then(subs => {
        setSubmissions(subs || []);
        setLoadingSubmissions(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingSubmissions(false);
      });
  }, [selectedTestId]);

  const handleCopyLink = (testOrId: TestSummary | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const testObj = typeof testOrId === 'object' ? testOrId : tests.find(t => t.id === testOrId);
    const testId = typeof testOrId === 'string' ? testOrId : testOrId.id;
    const url = getStudentShareUrl(testId, testObj);
    navigator.clipboard.writeText(url);
    setCopiedTestId(testId);
    setTimeout(() => setCopiedTestId(null), 2500);
  };

  const selectedTest = tests.find(t => t.id === selectedTestId);

  // Filter tests by search
  const visibleTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchTestQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTestQuery.toLowerCase())
  );

  // Filter submissions by student name or roll number
  const visibleSubmissions = submissions.filter(s =>
    s.studentName.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    (s.studentIdentifier && s.studentIdentifier.toLowerCase().includes(searchStudentQuery.toLowerCase()))
  );

  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((a, b) => a + b.percentage, 0) / submissions.length)
    : 0;
  const passCount = submissions.filter(s => s.passed).length;
  const passRate = submissions.length > 0 ? Math.round((passCount / submissions.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-home"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Previous Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Browse all your created tests by title and inspect student performance reports.
            </p>
          </div>
        </div>

        <button
          id="btn-make-another-test"
          onClick={onMakeNewTest}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Make a Test
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Test Papers Listed by Title (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Tests by Title ({visibleTests.length})
            </h2>
            <span className="text-xs text-slate-500">Click title to view report</span>
          </div>

          {/* Search tests by title */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTestQuery}
              onChange={(e) => setSearchTestQuery(e.target.value)}
              placeholder="Search tests by title or subject..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {loadingTests ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading tests...</p>
            </div>
          ) : visibleTests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No test papers found.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTests.map(test => {
                const isSelected = test.id === selectedTestId;

                return (
                  <div
                    key={test.id}
                    id={`project-test-${test.id}`}
                    onClick={() => setSelectedTestId(test.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {test.subject || 'General'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(test, e)}
                        className={`text-xs flex items-center gap-1 font-bold px-2.5 py-1 rounded-md transition-all ${
                          copiedTestId === test.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-2xs'
                        }`}
                        title="Copy student examination link"
                      >
                        {copiedTestId === test.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied Link
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Share Link
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prominent Test Title */}
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug mb-2 font-display line-clamp-2">
                      {test.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>{test.questionCount} Questions • {test.totalMarks} Marks</span>
                      <span className="font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-full">
                        {test.submissionCount} Submission{test.submissionCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Test View & Student Reports (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTest ? (
            <div className="space-y-6">
              {/* Selected Test Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
                  <div className="max-w-xl">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                      Active Project Details
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mt-1">
                      {selectedTest.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Subject: <strong className="text-slate-800">{selectedTest.subject}</strong> • Duration: {selectedTest.timeLimitMinutes ? `${selectedTest.timeLimitMinutes} Minutes` : 'Untimed'} • Total: {selectedTest.totalMarks} Marks
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 max-w-full text-xs">
                        <span className="font-semibold text-indigo-900 text-[11px] shrink-0">Test Link:</span>
                        <span className="font-mono text-indigo-700 truncate max-w-xs sm:max-w-md select-all">
                          {getStudentShareUrl(selectedTest.id, selectedTest)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(selectedTest)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                    >
                      {copiedTestId === selectedTest.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied Link
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Test Link
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onPreviewAsStudent(selectedTest.slug || selectedTest.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview Paper
                    </button>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Total Students</span>
                    <span className="text-2xl font-extrabold text-slate-900 font-display">
                      {submissions.length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Average Score</span>
                    <span className="text-2xl font-extrabold text-indigo-600 font-display">
                      {avgScore}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Pass Rate (≥50%)</span>
                    <span className="text-2xl font-extrabold text-emerald-600 font-display">
                      {passRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Performance Reports */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 font-display">
                      Student Reports ({submissions.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      View scores, mistake records, and AI theory conceptual evaluations.
                    </p>
                  </div>

                  <div className="relative w-56 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchStudentQuery}
                      onChange={(e) => setSearchStudentQuery(e.target.value)}
                      placeholder="Search student or roll no..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                {loadingSubmissions ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Loading student answer sheets...</p>
                  </div>
                ) : visibleSubmissions.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-800 text-sm mb-1">No Student Submissions Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Share the student link with your candidates. When they submit, their full performance report will appear here automatically.
                    </p>
                    <button
                      onClick={() => handleCopyLink(selectedTest.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Student Link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleSubmissions.map((sub) => {
                      const isExpanded = expandedSubmissionId === sub.id;
                      const wrongCount = sub.evaluations.filter(e => e.status === 'wrong').length;

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                        >
                          {/* Student Row */}
                          <div
                            onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                            className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-display shadow-xs">
                                {sub.grade}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  {sub.studentName}
                                  {sub.studentIdentifier && (
                                    <span className="text-xs font-mono font-normal text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                      Roll: {sub.studentIdentifier}
                                    </span>
                                  )}
                                </h4>
                                <span className="text-xs text-slate-500">
                                  Completed {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString()} • Time: {Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="font-extrabold text-slate-900 text-sm sm:text-base block font-display">
                                  {sub.totalScore} / {sub.maxScore} pts ({sub.percentage}%)
                                </span>
                                <span
                                  className={`text-[11px] font-bold ${
                                    wrongCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {wrongCount > 0 ? `${wrongCount} mistake(s)` : 'Zero mistakes'}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              >
                                {isExpanded ? 'Hide Paper' : 'Inspect Paper'}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Student Answer Sheet */}
                          {isExpanded && (
                            <div className="p-5 sm:p-6 bg-slate-50/80 border-t border-slate-200 space-y-4">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Candidate's Answers & Conceptual Evaluation:
                              </h5>

                              <div className="space-y-3">
                                {sub.evaluations.map((ev, qIdx) => {
                                  const isCorrect = ev.status === 'correct';
                                  const isPartial = ev.status === 'partial';

                                  return (
                                    <div
                                      key={ev.questionId}
                                      className="bg-white p-4 rounded-xl border border-slate-200 text-xs sm:text-sm shadow-2xs"
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="font-bold text-slate-800">
                                          Q{qIdx + 1}: {ev.questionText}
                                        </span>
                                        <span
                                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                                            isCorrect
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : isPartial
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {ev.marksAwarded} / {ev.maxMarks} pts
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                          <span className="font-bold text-slate-500 block mb-0.5">
                                            Student's Answer:
                                          </span>
                                          <span className="text-slate-900 font-medium">
                                            {ev.studentAnswerDisplay || '(Blank / No answer)'}
                                          </span>
                                        </div>

                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                          <span className="font-bold text-slate-500 block mb-0.5">
                                            Model / Correct Answer:
                                          </span>
                                          <span className="text-slate-900 font-medium">
                                            {ev.correctAnswerDisplay}
                                          </span>
                                        </div>
                                      </div>

                                      {/* AI Theory Analysis */}
                                      {ev.theoryFeedback && (
                                        <div className="mt-3 p-3.5 rounded-lg bg-purple-50/80 border border-purple-200 text-purple-950 text-xs space-y-1.5">
                                          <div className="flex items-center justify-between font-bold text-purple-900">
                                            <span className="flex items-center gap-1">
                                              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Conceptual Analysis
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-purple-200/60">
                                              {ev.theoryFeedback.conceptMatchPercentage}% Concept Match
                                            </span>
                                          </div>
                                          <p><strong>Verdict:</strong> {ev.theoryFeedback.conceptualVerdict}</p>
                                          <p><strong>Conceptual Strengths:</strong> {ev.theoryFeedback.strengths}</p>
                                          {ev.theoryFeedback.missingPoints && ev.theoryFeedback.missingPoints !== 'None' && (
                                            <p><strong>Missing Nuances:</strong> {ev.theoryFeedback.missingPoints}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
              Select any test paper title from the left to view details and student reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
