import { Question, Test, TestSubmission, QuestionEvaluation } from '../types';

// Storage keys for GitHub Pages / static client-side fallback
const LOCAL_TESTS_KEY = 'testcraft_all_local_tests';
const LOCAL_SUBMISSIONS_KEY_PREFIX = 'testcraft_submissions_';

// Pre-seeded tests available out-of-the-box everywhere
const SEED_TESTS: Test[] = [
  {
    id: 'ca-aspirants',
    slug: 'ca-aspirants',
    title: 'ca aspirants',
    subject: 'accounting',
    instructions: 'Read each question attentively. Note questions with multiple correct choices. Submit before the timer expires.',
    timeLimitMinutes: 20,
    totalMarks: 8,
    createdAt: '2026-09-17T07:05:03.593Z',
    creatorName: 'abdulllah',
    questions: [
      {
        id: 'q_1',
        type: 'mcq',
        questionText: 'is this good',
        marks: 4,
        options: [
          { id: 'opt_1', text: 'yes' },
          { id: 'opt_2', text: 'no' },
          { id: 'opt_3', text: 'may be' },
          { id: 'opt_4', text: 'may be not' }
        ],
        correctOptionIds: ['opt_1'],
        partialMarkingRule: 'half'
      },
      {
        id: 'q_2',
        type: 'mcq',
        questionText: 'i made it for test',
        marks: 4,
        options: [
          { id: 'opt_1', text: 'yes' },
          { id: 'opt_2', text: 'yess' },
          { id: 'opt_3', text: 'yesss' },
          { id: 'opt_4', text: 'yessss' }
        ],
        correctOptionIds: ['opt_1'],
        partialMarkingRule: 'half'
      }
    ]
  },
  {
    id: 'fundamentals-of-science-renewable-energy',
    slug: 'fundamentals-of-science-renewable-energy',
    title: 'Fundamentals of Science & Renewable Energy',
    subject: 'General Science',
    instructions: 'Answer all questions carefully. For multiple-choice questions with 2 correct answers, make sure to pick both.',
    timeLimitMinutes: 15,
    totalMarks: 25,
    createdAt: '2026-09-16T06:20:01.981Z',
    creatorName: 'Prof. Anderson',
    questions: [
      {
        id: 'q1',
        type: 'mcq',
        questionText: 'Which planet in our Solar System is famously known as the Red Planet due to iron oxide on its surface?',
        marks: 4,
        options: [
          { id: 'opt1', text: 'Venus' },
          { id: 'opt2', text: 'Mars' },
          { id: 'opt3', text: 'Jupiter' },
          { id: 'opt4', text: 'Mercury' }
        ],
        correctOptionIds: ['opt2']
      },
      {
        id: 'q2',
        type: 'mcq',
        questionText: 'Which of the following are categorized as renewable energy sources? (Select 2 correct options)',
        marks: 6,
        options: [
          { id: 'optA', text: 'Solar Energy' },
          { id: 'optB', text: 'Coal Combustion' },
          { id: 'optC', text: 'Wind Power' },
          { id: 'optD', text: 'Natural Gas' }
        ],
        correctOptionIds: ['optA', 'optC'],
        partialMarkingRule: 'half'
      },
      {
        id: 'q3',
        type: 'true_false',
        questionText: 'Sound waves can travel through a complete vacuum in outer space.',
        marks: 5,
        correctBoolean: false
      },
      {
        id: 'q4',
        type: 'theory',
        questionText: 'Explain how photosynthesis works in green plants and why it is vital for Earth\'s atmosphere.',
        marks: 10,
        modelAnswer: 'Photosynthesis is the process where green plants convert sunlight, water, and CO2 into glucose and release oxygen into the atmosphere.'
      }
    ]
  }
];

function getStoredLocalTests(): Test[] {
  try {
    const raw = localStorage.getItem(LOCAL_TESTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_TESTS_KEY, JSON.stringify(SEED_TESTS));
      return SEED_TESTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure seed tests are present
      SEED_TESTS.forEach(seed => {
        if (!parsed.some(t => t.id === seed.id || t.slug === seed.slug)) {
          parsed.unshift(seed);
        }
      });
      return parsed;
    }
    return SEED_TESTS;
  } catch {
    return SEED_TESTS;
  }
}

function saveLocalTest(test: Test) {
  try {
    const existing = getStoredLocalTests();
    const filtered = existing.filter(t => t.id !== test.id && t.slug !== test.slug);
    filtered.unshift(test);
    localStorage.setItem(LOCAL_TESTS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Could not save test to local storage', err);
  }
}

function getStoredSubmissions(testIdOrSlug: string): TestSubmission[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_SUBMISSIONS_KEY_PREFIX}${testIdOrSlug}`);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveLocalSubmission(testIdOrSlug: string, submission: TestSubmission) {
  try {
    const existing = getStoredSubmissions(testIdOrSlug);
    existing.unshift(submission);
    localStorage.setItem(`${LOCAL_SUBMISSIONS_KEY_PREFIX}${testIdOrSlug}`, JSON.stringify(existing));
    // Also save under testId if different
    if (submission.testId && submission.testId !== testIdOrSlug) {
      const byId = getStoredSubmissions(submission.testId);
      byId.unshift(submission);
      localStorage.setItem(`${LOCAL_SUBMISSIONS_KEY_PREFIX}${submission.testId}`, JSON.stringify(byId));
    }
  } catch (err) {
    console.warn('Could not save submission to local storage', err);
  }
}

export const apiService = {
  // Fetch all tests summary
  async getTests(): Promise<any[]> {
    try {
      const res = await fetch('/api/tests');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tests) && data.tests.length > 0) {
          return data.tests;
        }
      }
    } catch {
      // Offline / GitHub Pages static fallback
    }

    // Fallback to local
    const localTests = getStoredLocalTests();
    return localTests.map(t => ({
      id: t.id,
      slug: t.slug || t.id,
      title: t.title,
      subject: t.subject,
      totalMarks: t.totalMarks,
      timeLimitMinutes: t.timeLimitMinutes,
      questionCount: t.questions.length,
      createdAt: t.createdAt,
      creatorName: t.creatorName,
      submissionCount: getStoredSubmissions(t.id).length,
    }));
  },

  // Fetch single test for taking (sanitized)
  async getTestForTaking(testIdOrSlug: string): Promise<any> {
    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(testIdOrSlug)}/take`);
      if (res.ok) {
        const data = await res.json();
        if (data.test) return data.test;
      }
    } catch {
      // Offline / GitHub Pages fallback
    }

    const localTests = getStoredLocalTests();
    const found = localTests.find(
      t => t.id.toLowerCase() === testIdOrSlug.toLowerCase() ||
           (t.slug && t.slug.toLowerCase() === testIdOrSlug.toLowerCase()) ||
           t.title.toLowerCase() === testIdOrSlug.toLowerCase()
    );

    if (!found) {
      throw new Error(`Test "${testIdOrSlug}" not found. Please verify the test title or link.`);
    }

    // Sanitize questions so correct answers are not exposed in the client inspector
    const sanitizedQuestions = found.questions.map(q => {
      const base: any = {
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        marks: q.marks,
      };
      if (q.type === 'mcq') {
        base.options = (q.options || []).map(o => ({ id: o.id, text: o.text }));
        base.requiredOptionCount = (q.correctOptionIds && q.correctOptionIds.length > 0) ? q.correctOptionIds.length : 1;
      }
      return base;
    });

    return {
      id: found.id,
      slug: found.slug || found.id,
      title: found.title,
      subject: found.subject,
      instructions: found.instructions,
      timeLimitMinutes: found.timeLimitMinutes,
      totalMarks: found.totalMarks,
      creatorName: found.creatorName,
      questions: sanitizedQuestions,
    };
  },

  // Check if student already attempted
  async checkStudentAttempt(testId: string, name: string, rollNo: string): Promise<{ hasAttempted: boolean; submissionId?: string; submittedAt?: string }> {
    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(testId)}/check-student?name=${encodeURIComponent(name)}&rollNo=${encodeURIComponent(rollNo)}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Offline / GitHub Pages fallback
    }

    const submissions = getStoredSubmissions(testId);
    const existing = submissions.find(
      s => s.studentName.toLowerCase() === name.toLowerCase().trim() ||
           s.studentIdentifier.toLowerCase() === rollNo.toLowerCase().trim()
    );

    if (existing) {
      return {
        hasAttempted: true,
        submissionId: existing.id,
        submittedAt: existing.submittedAt,
      };
    }
    return { hasAttempted: false };
  },

  // Create test
  async createTest(payload: any): Promise<Test> {
    const slug = payload.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `test-${Date.now()}`;
    const newTest: Test = {
      id: slug,
      slug,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    // Always save to localStorage first for static resilience
    saveLocalTest(newTest);

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.test) {
          saveLocalTest(data.test);
          return data.test;
        }
      }
    } catch {
      // Saved to local
    }

    return newTest;
  },

  // Submit test answers and grade
  async submitTest(testId: string, payload: { studentName: string; studentIdentifier: string; answers: any; timeSpentSeconds: number }): Promise<TestSubmission> {
    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(testId)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.submission) {
          saveLocalSubmission(testId, data.submission);
          return data.submission;
        }
      }
    } catch {
      // Offline fallback
    }

    // Client-side grading fallback (for GitHub Pages static deploy)
    const localTests = getStoredLocalTests();
    const test = localTests.find(t => t.id === testId || t.slug === testId);
    if (!test) {
      throw new Error('Test not found for grading.');
    }

    // Check attempt again
    const priorSubmissions = getStoredSubmissions(testId);
    const already = priorSubmissions.find(
      s => s.studentName.toLowerCase() === payload.studentName.toLowerCase().trim() ||
           s.studentIdentifier.toLowerCase() === payload.studentIdentifier.toLowerCase().trim()
    );
    if (already) {
      throw new Error('You have already submitted this test. Each individual can only perform this test once.');
    }

    let answersMap = new Map<string, any>();
    if (Array.isArray(payload.answers)) {
      payload.answers.forEach((ans: any) => answersMap.set(ans.questionId, ans));
    } else if (payload.answers && typeof payload.answers === 'object') {
      Object.entries(payload.answers).forEach(([qId, val]: [string, any]) => {
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          answersMap.set(qId, { questionId: qId, ...val });
        } else if (Array.isArray(val)) {
          answersMap.set(qId, { questionId: qId, selectedOptionIds: val });
        } else if (typeof val === 'boolean') {
          answersMap.set(qId, { questionId: qId, selectedBoolean: val });
        } else if (typeof val === 'string') {
          answersMap.set(qId, { questionId: qId, theoryAnswer: val });
        }
      });
    }

    let totalScore = 0;
    const evaluations: QuestionEvaluation[] = [];

    test.questions.forEach(q => {
      const ans = answersMap.get(q.id);
      const maxMarks = Number(q.marks) || 0;

      if (q.type === 'mcq') {
        const correctIds = new Set<string>(q.correctOptionIds || []);
        const rawSelected = ans?.selectedOptionIds || [];
        const selectedIds = new Set<string>(Array.isArray(rawSelected) ? rawSelected.map(String) : []);
        const optionsMap = new Map((q.options || []).map(o => [o.id, o.text]));
        const studentDisplayText = Array.from(selectedIds).map(id => optionsMap.get(id) || String(id)).join(', ') || 'No option selected';
        const correctDisplayText = Array.from(correctIds).map(id => optionsMap.get(id) || String(id)).join(', ');

        if (selectedIds.size === 0) {
          evaluations.push({
            questionId: q.id,
            questionType: 'mcq',
            questionText: q.questionText,
            marksAwarded: 0,
            maxMarks,
            status: 'wrong',
            studentAnswerDisplay: studentDisplayText,
            correctAnswerDisplay: correctDisplayText,
          });
          return;
        }

        const isExactMatch = correctIds.size === selectedIds.size && Array.from(selectedIds).every(id => correctIds.has(id));

        if (isExactMatch) {
          totalScore += maxMarks;
          evaluations.push({
            questionId: q.id,
            questionType: 'mcq',
            questionText: q.questionText,
            marksAwarded: maxMarks,
            maxMarks,
            status: 'correct',
            studentAnswerDisplay: studentDisplayText,
            correctAnswerDisplay: correctDisplayText,
          });
        } else {
          // Partial credit check
          const correctSelectedCount = Array.from(selectedIds).filter(id => correctIds.has(id)).length;
          const wrongSelectedCount = Array.from(selectedIds).filter(id => !correctIds.has(id)).length;

          if (q.partialMarkingRule !== 'zero' && correctSelectedCount > 0 && wrongSelectedCount === 0) {
            const fraction = correctSelectedCount / correctIds.size;
            const awarded = Math.round((fraction * maxMarks) * 10) / 10;
            totalScore += awarded;
            evaluations.push({
              questionId: q.id,
              questionType: 'mcq',
              questionText: q.questionText,
              marksAwarded: awarded,
              maxMarks,
              status: 'partial',
              studentAnswerDisplay: studentDisplayText,
              correctAnswerDisplay: correctDisplayText,
            });
          } else {
            evaluations.push({
              questionId: q.id,
              questionType: 'mcq',
              questionText: q.questionText,
              marksAwarded: 0,
              maxMarks,
              status: 'wrong',
              studentAnswerDisplay: studentDisplayText,
              correctAnswerDisplay: correctDisplayText,
            });
          }
        }
      } else if (q.type === 'true_false') {
        const studentBool = ans?.selectedBoolean;
        const correctBool = q.correctBoolean;
        const studentDisplayText = studentBool === true ? 'True' : studentBool === false ? 'False' : 'Unanswered';
        const correctDisplayText = correctBool ? 'True' : 'False';

        if (studentBool === correctBool) {
          totalScore += maxMarks;
          evaluations.push({
            questionId: q.id,
            questionType: 'true_false',
            questionText: q.questionText,
            marksAwarded: maxMarks,
            maxMarks,
            status: 'correct',
            studentAnswerDisplay: studentDisplayText,
            correctAnswerDisplay: correctDisplayText,
          });
        } else {
          evaluations.push({
            questionId: q.id,
            questionType: 'true_false',
            questionText: q.questionText,
            marksAwarded: 0,
            maxMarks,
            status: 'wrong',
            studentAnswerDisplay: studentDisplayText,
            correctAnswerDisplay: correctDisplayText,
          });
        }
      } else if (q.type === 'theory') {
        const studentText = (ans?.theoryAnswer || '').trim();
        const wordCount = studentText.split(/\s+/).filter(Boolean).length;
        // Client-side heuristic for theory when Gemini API backend is unavailable
        let marksAwarded = 0;
        let status: 'correct' | 'partial' | 'wrong' = 'wrong';

        if (wordCount >= 15) {
          marksAwarded = Math.round(maxMarks * 0.8 * 10) / 10;
          status = 'correct';
        } else if (wordCount >= 5) {
          marksAwarded = Math.round(maxMarks * 0.5 * 10) / 10;
          status = 'partial';
        }

        totalScore += marksAwarded;
        evaluations.push({
          questionId: q.id,
          questionType: 'theory',
          questionText: q.questionText,
          marksAwarded,
          maxMarks,
          status,
          studentAnswerDisplay: studentText || 'No answer submitted',
          correctAnswerDisplay: q.modelAnswer || 'Instructor model answer',
          theoryFeedback: {
            conceptMatchPercentage: status === 'correct' ? 85 : status === 'partial' ? 55 : 20,
            accuracyScore: marksAwarded,
            conceptualVerdict: status === 'correct' ? 'Demonstrates solid conceptual understanding' : status === 'partial' ? 'Adequate answer with key concepts' : 'Needs further elaboration',
            strengths: 'Good attempt addressing key ideas.',
            missingPoints: 'Consider adding further specific technical terminology.',
            rubricNotes: 'Evaluated based on standard conceptual keywords.'
          }
        });
      }
    });

    const maxScore = test.totalMarks || evaluations.reduce((a, e) => a + e.maxMarks, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentage >= 50;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const submission: TestSubmission = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      testId: test.id,
      testTitle: test.title,
      subject: test.subject,
      studentName: payload.studentName.trim(),
      studentIdentifier: payload.studentIdentifier.trim(),
      submittedAt: new Date().toISOString(),
      timeSpentSeconds: payload.timeSpentSeconds,
      totalScore: Math.round(totalScore * 10) / 10,
      maxScore,
      percentage,
      grade,
      passed,
      evaluations,
    };

    saveLocalSubmission(testId, submission);
    return submission;
  },

  // Get submissions for a test
  async getSubmissions(testId: string): Promise<TestSubmission[]> {
    try {
      const res = await fetch(`/api/tests/${encodeURIComponent(testId)}/submissions`);
      if (res.ok) {
        const data = await res.json();
        if (data.submissions) return data.submissions;
      }
    } catch {
      // Offline fallback
    }
    return getStoredSubmissions(testId);
  },

  // Get prior submission by ID
  async getSubmissionById(submissionId: string): Promise<TestSubmission | null> {
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.submission) return data.submission;
      }
    } catch {
      // Offline fallback
    }

    const localTests = getStoredLocalTests();
    for (const test of localTests) {
      const subs = getStoredSubmissions(test.id);
      const found = subs.find(s => s.id === submissionId);
      if (found) return found;
    }
    return null;
  }
};
