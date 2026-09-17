import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { TestCreator } from './components/TestCreator';
import { PreviousProjects } from './components/PreviousProjects';
import { TestTaker } from './components/TestTaker';
import { TestResultReport } from './components/TestResultReport';
import { Test, TestSubmission } from './types';
import { ArrowLeft } from 'lucide-react';
import { apiService } from './services/apiService';

export type AppView = 'home' | 'creator' | 'projects' | 'taker';

const CREATED_TESTS_STORAGE_KEY = 'testcraft_created_test_ids';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<TestSubmission | null>(null);
  const [userCreatedTestIds, setUserCreatedTestIds] = useState<string[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Initialize created test IDs from localStorage and sync with tests
  useEffect(() => {
    let ids: string[] = [];
    try {
      const stored = localStorage.getItem(CREATED_TESTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          ids = parsed;
          setUserCreatedTestIds(parsed);
        }
      }
    } catch (e) {
      console.error('Error reading created tests from storage', e);
    }

    // Also check available tests
    apiService.getTests().then(allTests => {
      if (allTests && allTests.length > 0) {
        const allIds = allTests.map(t => t.id);
        const merged = Array.from(new Set([...ids, ...allIds]));
        setUserCreatedTestIds(merged);
      }
    }).catch(console.error);
  }, []);

  // Parse URL on load: supports /test/:slug, ?test=..., ?testId=...
  useEffect(() => {
    let identifierFromUrl: string | null = null;
    
    // 1. Clean Pathname: e.g. /test/biology-chapter-1-quiz
    const path = window.location.pathname;
    if (path.includes('/test/')) {
      const parts = path.split('/test/');
      if (parts[1]) {
        const slug = parts[1].split('/')[0].split('?')[0].trim();
        if (slug) {
          identifierFromUrl = decodeURIComponent(slug);
        }
      }
    }

    // 2. Query param fallback: ?test=... or ?testId=...
    if (!identifierFromUrl) {
      const params = new URLSearchParams(window.location.search);
      identifierFromUrl = params.get('test') || params.get('testId');
    }

    // 3. Hash fallback: e.g. #/test/:slug or #test=...
    if (!identifierFromUrl && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('/test/')) {
        const parts = hash.split('/test/');
        if (parts[1]) {
          const slug = parts[1].split('/')[0].split('?')[0].trim();
          if (slug) identifierFromUrl = decodeURIComponent(slug);
        }
      } else if (hash.includes('test=')) {
        const match = hash.match(/test=([^&]+)/);
        if (match && match[1]) identifierFromUrl = decodeURIComponent(match[1]);
      }
    }

    if (identifierFromUrl) {
      setActiveTestId(identifierFromUrl);
      setCurrentView('taker');
      setCurrentSubmission(null);
      setIsPreviewMode(false);
    }
  }, []);

  // When a test is created by teacher
  const handleTestCreated = (newTest: Test) => {
    setActiveTestId(newTest.id);
    setUserCreatedTestIds(prev => {
      const updated = Array.from(new Set([newTest.id, ...prev]));
      try {
        localStorage.setItem(CREATED_TESTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Preview test as student from Creator or Projects
  const handlePreviewTest = (testIdOrSlug: string) => {
    setActiveTestId(testIdOrSlug);
    setCurrentSubmission(null);
    setIsPreviewMode(true);
    setCurrentView('taker');
    window.history.pushState({}, '', `/test/${encodeURIComponent(testIdOrSlug)}`);
  };

  // When student submits test
  const handleSubmissionComplete = (submission: TestSubmission) => {
    setCurrentSubmission(submission);
  };

  // When viewing prior result for single-attempt candidate
  const handleViewPriorResult = (submissionId: string) => {
    apiService.getSubmissionById(submissionId)
      .then(sub => {
        if (sub) {
          setCurrentSubmission(sub);
        }
      })
      .catch(console.error);
  };

  // Return to home
  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentSubmission(null);
    setIsPreviewMode(false);
    setActiveTestId(null);
    window.history.pushState({}, '', '/');
  };

  // ==========================================
  // 1. STUDENT VIEW / TEST-TAKING SCREEN
  // "student must join the test by link by putting their name and rollno their
  // then test open where they dont see any any logo of our just clean page with attractive test"
  // ==========================================
  if (currentView === 'taker' && activeTestId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100">
        {/* Optional small top bar ONLY for teacher preview mode so they can return */}
        {isPreviewMode && (
          <div className="bg-indigo-900 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
            <span className="font-semibold">Instructor Preview Mode (Test ID: {activeTestId})</span>
            <button
              onClick={handleBackToHome}
              className="flex items-center gap-1 font-bold underline hover:text-indigo-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Exit to Home
            </button>
          </div>
        )}

        <main className="py-6">
          {currentSubmission ? (
            <TestResultReport
              submission={currentSubmission}
              onRetakeOrReturn={isPreviewMode ? handleBackToHome : undefined}
            />
          ) : (
            <TestTaker
              key={activeTestId}
              testId={activeTestId}
              onSubmissionComplete={handleSubmissionComplete}
              onViewPriorResult={handleViewPriorResult}
            />
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // 2. MAIN TEACHER / CREATOR WORKSPACE
  // Two options on opening: "Make a test" & "Previous projects"
  // If new, "Previous projects" is untouchable!
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-100">
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeScreen
            onMakeTest={() => setCurrentView('creator')}
            onOpenPreviousProjects={() => setCurrentView('projects')}
            onTakeTest={handlePreviewTest}
            hasPreviousProjects={userCreatedTestIds.length > 0}
            projectsCount={userCreatedTestIds.length}
          />
        )}

        {currentView === 'creator' && (
          <TestCreator
            onTestCreated={handleTestCreated}
            onGoToTest={handlePreviewTest}
            onBackToHome={handleBackToHome}
            onGoToPreviousProjects={() => setCurrentView('projects')}
          />
        )}

        {currentView === 'projects' && (
          <PreviousProjects
            onBackToHome={handleBackToHome}
            onMakeNewTest={() => setCurrentView('creator')}
            onPreviewAsStudent={handlePreviewTest}
            filteredTestIds={userCreatedTestIds}
          />
        )}
      </main>

      {/* Subtle footer on creator views */}
      {currentView === 'home' && (
        <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/70">
          <p>Online Examination & Conceptual Evaluation System</p>
        </footer>
      )}
    </div>
  );
}
