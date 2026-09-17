import React from 'react';
import { 
  PlusCircle, 
  FolderClock, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  FileCheck2, 
  CheckCircle2, 
  BookOpen,
  Users
} from 'lucide-react';

interface HomeScreenProps {
  onMakeTest: () => void;
  onOpenPreviousProjects: () => void;
  onTakeTest?: (testSlugOrTitle: string) => void;
  hasPreviousProjects: boolean;
  projectsCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onMakeTest,
  onOpenPreviousProjects,
  onTakeTest,
  hasPreviousProjects,
  projectsCount,
}) => {
  const [studentTestInput, setStudentTestInput] = React.useState('');
  const [inputError, setInputError] = React.useState('');

  const handleStudentJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const query = studentTestInput.trim();
    if (!query) {
      setInputError('Please enter a test title or code (e.g. ca-aspirants)');
      return;
    }
    setInputError('');
    if (onTakeTest) {
      // If student pasted a full URL, extract slug
      let identifier = query;
      if (identifier.includes('/test/')) {
        identifier = identifier.split('/test/')[1].split(/[?#]/)[0];
      }
      onTakeTest(identifier);
    }
  };
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Title & Introduction */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1.5 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Test Creation & Assessment Platform
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-display mb-4">
          Create & Evaluate Tests Effortlessly
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Design custom examination papers with multiple choice, true/false, and auto-evaluated conceptual theory questions.
        </p>
      </div>

      {/* The Two Main Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
        {/* OPTION 1: Make a Test */}
        <div
          id="btn-option-make-test"
          onClick={onMakeTest}
          className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-300 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-6 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-8 h-8" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Creator Studio
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mb-3 group-hover:text-indigo-600 transition-colors">
              Make a Test
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Create a new test paper from scratch or presets. Configure multiple options, single or dual correct answers, partial marking, time limits, and conceptual theory grading.
            </p>

            <div className="space-y-2 text-xs font-semibold text-slate-500 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>MCQs with dynamic options count & multi-select</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auto-expanding theory questions with AI grading</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Instant student shareable link generation</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md shadow-indigo-600/20 group-hover:shadow-lg transition-all"
          >
            Start Making Test
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* OPTION 2: Previous Projects (Untouchable if new / 0 tests) */}
        {hasPreviousProjects ? (
          /* ACTIVE PREVIOUS PROJECTS */
          <div
            id="btn-option-previous-projects"
            onClick={onOpenPreviousProjects}
            className="group relative bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-400 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6 group-hover:scale-105 transition-transform">
                <FolderClock className="w-8 h-8" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {projectsCount} Test{projectsCount === 1 ? '' : 's'} Created
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mb-3 group-hover:text-indigo-600 transition-colors">
                Previous Projects
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Browse your previously created tests by title. Click into any test to copy its student link or inspect complete student submission reports and mistake analyses.
              </p>

              <div className="space-y-2 text-xs font-semibold text-slate-500 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>List of all tests by title</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>View student attendee rosters & scores</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inspect answers & AI theory feedback</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-md transition-all"
            >
              View Previous Projects
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          /* UNTOUCHABLE STATE FOR NEW USERS */
          <div
            id="option-previous-projects-untouchable"
            className="relative bg-slate-100/70 rounded-3xl p-8 sm:p-10 border border-slate-200/80 cursor-not-allowed select-none opacity-80 flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-400 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Untouchable • No tests created yet
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-400 font-display mb-3">
                Previous Projects
              </h2>

              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                You haven't created any test papers yet. Once you make your first test, this section will unlock to show all your test titles and student submission reports.
              </p>

              <div className="p-4 rounded-2xl bg-slate-200/50 text-xs text-slate-500 mb-8 border border-slate-200">
                <span className="font-bold text-slate-600 block mb-1">How to unlock:</span>
                Click <strong>"Make a Test"</strong> on the left, add your questions, and publish to activate your Previous Projects archive.
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-200 text-slate-400 font-bold text-base cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              Untouchable (Locked)
            </button>
          </div>
        )}
      </div>

      {/* STUDENT ENTRANCE: Take a test on any device by title */}
      <div className="mt-10 sm:mt-14 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 shadow-sm text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Student Exam Portal • Works on any phone or device
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mb-2">
            Taking a Test? Enter Test Title
          </h3>
          <p className="text-slate-600 text-sm max-w-lg mx-auto mb-6">
            If you are a student or taking a test on your mobile phone, enter the test title or paste the test link below to start immediately.
          </p>

          <form onSubmit={handleStudentJoin} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="input-student-test-title"
                type="text"
                value={studentTestInput}
                onChange={(e) => {
                  setStudentTestInput(e.target.value);
                  setInputError('');
                }}
                placeholder="e.g. ca-aspirants"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-medium text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              />
              <button
                id="btn-student-start-test"
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {inputError && (
              <p className="text-xs text-rose-600 font-medium mt-2 text-left">{inputError}</p>
            )}
          </form>

          {/* Quick links to sample/created tests */}
          <div className="mt-5 pt-5 border-t border-indigo-100/80 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">Quick tests:</span>
            <button
              type="button"
              onClick={() => onTakeTest && onTakeTest('ca-aspirants')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-700 font-semibold hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              ca-aspirants
            </button>
            <button
              type="button"
              onClick={() => onTakeTest && onTakeTest('fundamentals-of-science-renewable-energy')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-700 font-semibold hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
            >
              Fundamentals of Science
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
