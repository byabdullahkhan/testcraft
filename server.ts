import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { Test, TestSubmission, QuestionEvaluation, TheoryFeedback, Question } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with safety check
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory database with persistent demo seed tests
const testsMap = new Map<string, Test>();
const submissionsMap = new Map<string, TestSubmission[]>();

function slugifyTitle(title: string): string {
  if (!title) return 'test';
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'test'
  );
}

function findTestByIdOrSlug(idOrSlug: string): Test | undefined {
  if (!idOrSlug) return undefined;
  const decoded = decodeURIComponent(idOrSlug).trim().toLowerCase();

  // 1. Direct ID match
  const direct = testsMap.get(decoded) || testsMap.get(idOrSlug.trim());
  if (direct) return direct;

  // 2. Direct Slug match or ID match in values
  const bySlug = Array.from(testsMap.values()).find(
    t => (t.slug && t.slug.toLowerCase() === decoded) || 
         (t.id && t.id.toLowerCase() === decoded)
  );
  if (bySlug) return bySlug;

  // 3. Normalized slug comparison with title
  const targetSlug = slugifyTitle(decoded);
  return Array.from(testsMap.values()).find(
    t => (t.slug && t.slug.toLowerCase() === targetSlug) ||
         slugifyTitle(t.title) === targetSlug
  );
}

// Seed a rich default test for instant demonstration
const sampleTestId = 'fundamentals-of-science-renewable-energy';
const sampleTest: Test = {
  id: sampleTestId,
  slug: 'fundamentals-of-science-renewable-energy',
  title: 'Fundamentals of Science & Renewable Energy',
  subject: 'General Science',
  instructions: 'Answer all questions carefully. For multiple-choice questions with 2 correct answers, make sure to pick both. Theory answers will be evaluated conceptually by AI.',
  timeLimitMinutes: 15,
  totalMarks: 25,
  createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
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
        { id: 'opt4', text: 'Mercury' },
      ],
      correctOptionIds: ['opt2'],
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
        { id: 'optD', text: 'Natural Gas' },
        { id: 'optE', text: 'Diesel Fuel' },
      ],
      correctOptionIds: ['optA', 'optC'],
      partialMarkingRule: 'half', // 50% credit if 1 correct and 1 wrong
    },
    {
      id: 'q3',
      type: 'true_false',
      questionText: 'Sound waves can travel through a complete vacuum in outer space.',
      marks: 5,
      correctBoolean: false,
    },
    {
      id: 'q4',
      type: 'theory',
      questionText: 'Explain how photosynthesis works in green plants and why it is vital for Earth\'s atmosphere.',
      marks: 10,
      modelAnswer: 'Photosynthesis is the biological process by which green plants, algae, and some bacteria convert light energy (typically from the sun) into chemical energy. Using chlorophyll inside chloroplasts, plants take in carbon dioxide from the air and water from the soil to produce glucose (sugar) for energy and food, while releasing oxygen as a byproduct into the atmosphere. It is vital because it generates the oxygen aerobic organisms breathe and acts as a primary carbon sink regulating global atmospheric carbon levels.',
    },
  ],
};

testsMap.set(sampleTestId, sampleTest);
submissionsMap.set(sampleTestId, [
  {
    id: 'sub-sample-1',
    testId: sampleTestId,
    testTitle: sampleTest.title,
    subject: sampleTest.subject,
    studentName: 'Alex Rivera',
    studentIdentifier: 'STU-9021',
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    timeSpentSeconds: 420,
    totalScore: 23,
    maxScore: 25,
    percentage: 92,
    grade: 'A',
    passed: true,
    evaluations: [
      {
        questionId: 'q1',
        questionType: 'mcq',
        questionText: sampleTest.questions[0].questionText,
        marksAwarded: 4,
        maxMarks: 4,
        status: 'correct',
        studentAnswerDisplay: 'Mars',
        correctAnswerDisplay: 'Mars',
      },
      {
        questionId: 'q2',
        questionType: 'mcq',
        questionText: sampleTest.questions[1].questionText,
        marksAwarded: 6,
        maxMarks: 6,
        status: 'correct',
        studentAnswerDisplay: 'Solar Energy, Wind Power',
        correctAnswerDisplay: 'Solar Energy, Wind Power',
      },
      {
        questionId: 'q3',
        questionType: 'true_false',
        questionText: sampleTest.questions[2].questionText,
        marksAwarded: 5,
        maxMarks: 5,
        status: 'correct',
        studentAnswerDisplay: 'False',
        correctAnswerDisplay: 'False',
      },
      {
        questionId: 'q4',
        questionType: 'theory',
        questionText: sampleTest.questions[3].questionText,
        marksAwarded: 8,
        maxMarks: 10,
        status: 'partial',
        studentAnswerDisplay: 'Plants use sunlight, water, and CO2 absorbed through their leaves to create food and sugars for themselves, and they expel oxygen into the air. This maintains the oxygen balance that humans and animals need to breathe.',
        correctAnswerDisplay: sampleTest.questions[3].modelAnswer || '',
        theoryFeedback: {
          conceptMatchPercentage: 85,
          accuracyScore: 8.5,
          conceptualVerdict: 'Strong conceptual understanding with clear explanation',
          strengths: 'Accurately recognized sunlight, CO2, and water inputs, formation of sugars/food, and oxygen release vital for animal respiration.',
          missingPoints: 'Could have mentioned chloroplasts/chlorophyll pigment and carbon cycle regulation.',
          rubricNotes: 'Clear and coherent answer capturing all principal biological mechanisms.',
        },
      },
    ],
  },
]);

// File-based persistence directory
const DATA_DIR = path.join(process.cwd(), 'data');
const TESTS_FILE = path.join(DATA_DIR, 'tests.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

function initPersistence() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(TESTS_FILE)) {
      const testsArr: Test[] = JSON.parse(fs.readFileSync(TESTS_FILE, 'utf-8'));
      testsArr.forEach(t => {
        if (!t.slug) {
          t.slug = slugifyTitle(t.title);
        }
        testsMap.set(t.id, t);
      });
    }
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const subsObj: Record<string, TestSubmission[]> = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
      Object.entries(subsObj).forEach(([id, subs]) => submissionsMap.set(id, subs));
    }
  } catch (err) {
    console.error('Error initializing file persistence:', err);
  }
}

function persistData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TESTS_FILE, JSON.stringify(Array.from(testsMap.values()), null, 2));
    const subsObj: Record<string, TestSubmission[]> = {};
    submissionsMap.forEach((subs, id) => {
      subsObj[id] = subs;
    });
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(subsObj, null, 2));
  } catch (err) {
    console.error('Error persisting data:', err);
  }
}

// Initialize persistence on startup
initPersistence();

// Helper to evaluate theory question using Gemini AI
async function evaluateTheoryWithAI(
  questionText: string,
  modelAnswer: string,
  studentAnswer: string,
  maxMarks: number
): Promise<{ marks: number; feedback: TheoryFeedback }> {
  const trimmedAnswer = (studentAnswer || '').trim();

  if (!trimmedAnswer) {
    return {
      marks: 0,
      feedback: {
        conceptMatchPercentage: 0,
        accuracyScore: 0,
        conceptualVerdict: 'No answer provided',
        strengths: 'None',
        missingPoints: 'The student did not submit an answer for this question.',
        rubricNotes: 'Zero marks awarded due to missing submission.',
      },
    };
  }

  // If Gemini API Key is available, perform deep conceptual evaluation
  if (geminiApiKey) {
    try {
      const prompt = `You are an expert, fair, and encouraging academic evaluator.
Task: Grade a student's theory response by comparing it conceptually to the teacher's model answer.

Question: "${questionText}"
Total Marks Available: ${maxMarks}
Teacher's Model Answer (Reference concept): "${modelAnswer}"

Student's Written Response: "${trimmedAnswer}"

Important Instructions:
1. Focus on Conceptual Understanding: Do NOT penalize the student just because they used different phrasing, casual wording, or simpler sentence structures compared to the teacher's model.
2. If the student clearly grasps and communicates the underlying principles, mechanisms, and key facts, award full or near-full marks.
3. If they partially explained the idea with minor omissions, award proportional partial marks.
4. If there are severe misconceptions or irrelevant content, deduct accordingly.
5. Provide a constructive feedback summary.

Respond strictly in valid JSON format matching the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marksAwarded: {
                type: Type.NUMBER,
                description: `Marks awarded to student, between 0 and ${maxMarks}. Can have 1 decimal place.`,
              },
              conceptMatchPercentage: {
                type: Type.NUMBER,
                description: 'Percentage match of conceptual coverage (0 to 100).',
              },
              accuracyScore: {
                type: Type.NUMBER,
                description: 'Score out of 10 for conceptual correctness and clarity.',
              },
              conceptualVerdict: {
                type: Type.STRING,
                description: 'Brief verdict on conceptual understanding (e.g. Excellent grasp, Solid understanding, Partial grasp, Incomplete).',
              },
              strengths: {
                type: Type.STRING,
                description: 'Key concepts or correct facts the student articulated well.',
              },
              missingPoints: {
                type: Type.STRING,
                description: 'Any critical concept or detail from the model answer that was missing or unclear.',
              },
              rubricNotes: {
                type: Type.STRING,
                description: 'Friendly constructive explanation of how the score was calculated.',
              },
            },
            required: [
              'marksAwarded',
              'conceptMatchPercentage',
              'accuracyScore',
              'conceptualVerdict',
              'strengths',
              'missingPoints',
              'rubricNotes',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const awarded = Math.min(
        maxMarks,
        Math.max(0, Number(parsed.marksAwarded ?? (maxMarks * 0.7)))
      );

      return {
        marks: Math.round(awarded * 10) / 10,
        feedback: {
          conceptMatchPercentage: Math.min(100, Math.max(0, Math.round(Number(parsed.conceptMatchPercentage || 70)))),
          accuracyScore: Math.min(10, Math.max(0, Math.round(Number(parsed.accuracyScore || 7) * 10) / 10)),
          conceptualVerdict: parsed.conceptualVerdict || 'Conceptually evaluated',
          strengths: parsed.strengths || 'Articulated core concept directly.',
          missingPoints: parsed.missingPoints || 'Could expand further on technical nuances.',
          rubricNotes: parsed.rubricNotes || 'Graded on conceptual alignment with teacher model answer.',
        },
      };
    } catch (err) {
      console.error('Gemini grading error, applying fallback conceptual analyzer:', err);
    }
  }

  // Fallback conceptual analyzer if API key is not active or during offline test
  const modelTokens = new Set(
    modelAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  );
  const studentTokens = new Set(
    trimmedAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  );

  let matchCount = 0;
  for (const token of studentTokens) {
    if (modelTokens.has(token)) {
      matchCount++;
    }
  }

  const coverageRatio = modelTokens.size > 0 ? Math.min(1, matchCount / Math.max(3, modelTokens.size * 0.45)) : 0.6;
  const lengthRatio = Math.min(1, trimmedAnswer.split(/\s+/).length / 15);
  const combinedScore = Math.min(1, coverageRatio * 0.7 + lengthRatio * 0.3);
  const awarded = Math.round(maxMarks * combinedScore * 10) / 10;
  const matchPct = Math.round(combinedScore * 100);

  return {
    marks: awarded,
    feedback: {
      conceptMatchPercentage: matchPct,
      accuracyScore: Math.round(combinedScore * 10 * 10) / 10,
      conceptualVerdict: matchPct >= 80 ? 'Thorough conceptual understanding' : matchPct >= 50 ? 'Demonstrates basic conceptual grasp' : 'Key concepts omitted',
      strengths: 'Conveyed meaningful context related to the topic.',
      missingPoints: matchPct < 80 ? 'Compare with the teacher model answer for additional specific details.' : 'Comprehensive response provided.',
      rubricNotes: 'Evaluated using conceptual keywords and depth of explanation.',
    },
  };
}

// ------------------------------------
// API ROUTES
// ------------------------------------

// 1. Get all tests (Teacher view)
app.get('/api/tests', (req, res) => {
  const testsList = Array.from(testsMap.values()).map(test => {
    const submissions = submissionsMap.get(test.id) || [];
    return {
      id: test.id,
      slug: test.slug || slugifyTitle(test.title),
      title: test.title,
      subject: test.subject,
      totalMarks: test.totalMarks,
      timeLimitMinutes: test.timeLimitMinutes,
      questionCount: test.questions.length,
      createdAt: test.createdAt,
      creatorName: test.creatorName,
      submissionCount: submissions.length,
    };
  });
  res.json({ tests: testsList });
});

// 2. Get test by ID or slug for student taking the test (Hides correct answers & model answers)
app.get('/api/tests/:id/take', (req, res) => {
  const { id } = req.params;
  const test = findTestByIdOrSlug(id);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  // Sanitize questions so student cannot cheat by inspecting network payload
  const sanitizedQuestions = test.questions.map(q => {
    const base = {
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      marks: q.marks,
    };

    if (q.type === 'mcq') {
      const correctCount = (q.correctOptionIds || []).length;
      return {
        ...base,
        options: q.options || [],
        correctCount: correctCount > 0 ? correctCount : 1,
        isMultipleCorrect: correctCount > 1,
        partialMarkingRule: q.partialMarkingRule || 'half',
      };
    }

    if (q.type === 'true_false') {
      return {
        ...base,
      };
    }

    // Theory question: do not reveal model answer
    return {
      ...base,
    };
  });

  res.json({
    test: {
      id: test.id,
      slug: test.slug || slugifyTitle(test.title),
      title: test.title,
      subject: test.subject,
      instructions: test.instructions,
      timeLimitMinutes: test.timeLimitMinutes,
      totalMarks: test.totalMarks,
      questionCount: test.questions.length,
      questions: sanitizedQuestions,
    },
  });
});

// 3. Get complete test details (Teacher view)
app.get('/api/tests/:id', (req, res) => {
  const { id } = req.params;
  const test = findTestByIdOrSlug(id);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  res.json({ test });
});

// 4. Create new test
app.post('/api/tests', (req, res) => {
  const body = req.body;

  if (!body.title || !body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
    return res.status(400).json({ error: 'Test must have a title and at least one question.' });
  }

  const testTitle = (body.title || 'Untitled Test').trim();
  const baseSlug = slugifyTitle(testTitle);
  let finalSlug = baseSlug;
  let counter = 1;
  while (Array.from(testsMap.values()).some(t => (t.slug === finalSlug || t.id === finalSlug))) {
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }

  // The test ID is literally the clean title slug - NO random characters or timestamps!
  const testId = finalSlug;
  
  // Calculate total marks dynamically
  let calculatedTotalMarks = 0;
  const processedQuestions: Question[] = body.questions.map((q: any, index: number) => {
    const marks = Number(q.marks) > 0 ? Number(q.marks) : 1;
    calculatedTotalMarks += marks;

    const baseQuestion: Question = {
      id: q.id || `q_${index + 1}_${Date.now()}`,
      type: q.type,
      questionText: q.questionText || `Question ${index + 1}`,
      marks: marks,
    };

    if (q.type === 'mcq') {
      baseQuestion.options = Array.isArray(q.options) ? q.options : [];
      baseQuestion.correctOptionIds = Array.isArray(q.correctOptionIds) ? q.correctOptionIds : [];
      baseQuestion.partialMarkingRule = q.partialMarkingRule === 'zero' ? 'zero' : 'half';
    } else if (q.type === 'true_false') {
      baseQuestion.correctBoolean = Boolean(q.correctBoolean);
    } else if (q.type === 'theory') {
      baseQuestion.modelAnswer = (q.modelAnswer || '').trim();
    }

    return baseQuestion;
  });

  const newTest: Test = {
    id: testId,
    slug: finalSlug,
    title: testTitle,
    subject: (body.subject || 'General').trim(),
    instructions: (body.instructions || '').trim(),
    timeLimitMinutes: body.timeLimitMinutes ? Number(body.timeLimitMinutes) : null,
    questions: processedQuestions,
    totalMarks: calculatedTotalMarks,
    createdAt: new Date().toISOString(),
    creatorName: (body.creatorName || 'Instructor').trim(),
  };

  testsMap.set(testId, newTest);
  submissionsMap.set(testId, []);
  persistData();

  res.status(201).json({
    message: 'Test created successfully',
    test: newTest,
  });
});

// Import or sync a test from link payload (useful across multiple container instances or dev/pre sync)
app.post('/api/tests/import', (req, res) => {
  const { test } = req.body;
  if (!test || !test.id || !test.questions) {
    return res.status(400).json({ error: 'Invalid test payload' });
  }

  if (!test.slug) {
    test.slug = slugifyTitle(test.title || test.id);
  }

  if (!testsMap.has(test.id)) {
    testsMap.set(test.id, test);
    if (!submissionsMap.has(test.id)) {
      submissionsMap.set(test.id, []);
    }
    persistData();
  }

  res.json({ message: 'Test imported successfully', test: testsMap.get(test.id) });
});

// 5. Check if student already attempted this test (one attempt rule)
app.get('/api/tests/:id/check-student', (req, res) => {
  const { id } = req.params;
  const test = findTestByIdOrSlug(id);
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const name = ((req.query.name as string) || '').trim().toLowerCase();
  const rollNo = ((req.query.rollNo as string) || '').trim().toLowerCase();

  const submissions = submissionsMap.get(test.id) || [];
  const existing = submissions.find(s => {
    const matchName = name && s.studentName.trim().toLowerCase() === name;
    const matchRoll = rollNo && s.studentIdentifier && s.studentIdentifier.trim().toLowerCase() === rollNo;
    return matchName || matchRoll;
  });

  if (existing) {
    return res.json({
      hasAttempted: true,
      submissionId: existing.id,
      submittedAt: existing.submittedAt,
    });
  }

  res.json({ hasAttempted: false });
});

// 6. Submit student test and perform automatic + AI grading
app.post('/api/tests/:id/submit', async (req, res) => {
  const { id } = req.params;
  const test = findTestByIdOrSlug(id);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const { studentName, studentIdentifier, answers, timeSpentSeconds } = req.body;

  if (!studentName || !studentName.trim()) {
    return res.status(400).json({ error: 'Student name is required' });
  }

  const existingSubmissions = submissionsMap.get(test.id) || [];
  const normalizedName = studentName.trim().toLowerCase();
  const normalizedRoll = (studentIdentifier || '').trim().toLowerCase();

  // Enforce one attempt per student (by name or roll number)
  const priorSubmission = existingSubmissions.find(s => {
    const matchName = s.studentName.trim().toLowerCase() === normalizedName;
    const matchRoll = normalizedRoll && s.studentIdentifier && s.studentIdentifier.trim().toLowerCase() === normalizedRoll;
    return matchName || matchRoll;
  });

  if (priorSubmission) {
    return res.status(409).json({
      error: 'You have already submitted this test. Each individual can only perform this test once.',
      priorSubmissionId: priorSubmission.id,
    });
  }

  // Answer map for quick lookup
  const studentAnswersMap = new Map<string, any>();
  if (Array.isArray(answers)) {
    answers.forEach((ans: any) => {
      studentAnswersMap.set(ans.questionId, ans);
    });
  } else if (answers && typeof answers === 'object') {
    Object.entries(answers).forEach(([qId, val]: [string, any]) => {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        studentAnswersMap.set(qId, { questionId: qId, ...val });
      } else if (Array.isArray(val)) {
        studentAnswersMap.set(qId, { questionId: qId, selectedOptionIds: val });
      } else if (typeof val === 'boolean') {
        studentAnswersMap.set(qId, { questionId: qId, selectedBoolean: val });
      } else if (typeof val === 'string') {
        studentAnswersMap.set(qId, { questionId: qId, theoryAnswer: val });
      }
    });
  }

  const evaluations: QuestionEvaluation[] = [];
  let totalScore = 0;

  for (const question of test.questions) {
    const studentAns = studentAnswersMap.get(question.id);

    if (question.type === 'mcq') {
      const selectedIds: string[] = studentAns?.selectedOptionIds || [];
      const correctIds: string[] = question.correctOptionIds || [];
      const optionsMap = new Map((question.options || []).map(o => [o.id, o.text]));

      const studentAnswerText = selectedIds
        .map(oid => optionsMap.get(oid) || oid)
        .join(', ') || 'No option selected';

      const correctAnswerText = correctIds
        .map(oid => optionsMap.get(oid) || oid)
        .join(', ');

      const correctCount = correctIds.length;
      let marksAwarded = 0;
      let status: 'correct' | 'partial' | 'wrong' = 'wrong';

      if (correctCount === 1) {
        // Single correct MCQ
        if (selectedIds.length === 1 && selectedIds[0] === correctIds[0]) {
          marksAwarded = question.marks;
          status = 'correct';
        } else {
          marksAwarded = 0;
          status = 'wrong';
        }
      } else {
        // Multiple correct options (e.g. 2 correct)
        const correctSelected = selectedIds.filter(id => correctIds.includes(id)).length;
        const incorrectSelected = selectedIds.filter(id => !correctIds.includes(id)).length;

        if (correctSelected === correctCount && incorrectSelected === 0) {
          marksAwarded = question.marks;
          status = 'correct';
        } else if (correctSelected > 0 && incorrectSelected <= 1) {
          // Check partial marking setting
          if (question.partialMarkingRule === 'half') {
            marksAwarded = Math.round((question.marks * 0.5) * 10) / 10;
            status = 'partial';
          } else {
            marksAwarded = 0;
            status = 'wrong';
          }
        } else {
          marksAwarded = 0;
          status = 'wrong';
        }
      }

      totalScore += marksAwarded;
      evaluations.push({
        questionId: question.id,
        questionType: 'mcq',
        questionText: question.questionText,
        marksAwarded,
        maxMarks: question.marks,
        status,
        studentAnswerDisplay: studentAnswerText,
        correctAnswerDisplay: correctAnswerText,
      });
    } else if (question.type === 'true_false') {
      const selectedBool = studentAns?.selectedBoolean;
      const correctBool = question.correctBoolean;

      const studentAnswerText = selectedBool === true ? 'True' : selectedBool === false ? 'False' : 'No answer';
      const correctAnswerText = correctBool === true ? 'True' : 'False';

      let marksAwarded = 0;
      let status: 'correct' | 'partial' | 'wrong' = 'wrong';

      if (selectedBool === correctBool) {
        marksAwarded = question.marks;
        status = 'correct';
      }

      totalScore += marksAwarded;
      evaluations.push({
        questionId: question.id,
        questionType: 'true_false',
        questionText: question.questionText,
        marksAwarded,
        maxMarks: question.marks,
        status,
        studentAnswerDisplay: studentAnswerText,
        correctAnswerDisplay: correctAnswerText,
      });
    } else if (question.type === 'theory') {
      const theoryText = studentAns?.theoryAnswer || '';
      const modelAnswer = question.modelAnswer || '';

      const { marks, feedback } = await evaluateTheoryWithAI(
        question.questionText,
        modelAnswer,
        theoryText,
        question.marks
      );

      totalScore += marks;
      const status: 'correct' | 'partial' | 'wrong' =
        marks >= question.marks * 0.85
          ? 'correct'
          : marks >= question.marks * 0.4
          ? 'partial'
          : 'wrong';

      evaluations.push({
        questionId: question.id,
        questionType: 'theory',
        questionText: question.questionText,
        marksAwarded: marks,
        maxMarks: question.marks,
        status,
        studentAnswerDisplay: theoryText || '(Blank response)',
        correctAnswerDisplay: modelAnswer,
        theoryFeedback: feedback,
      });
    }
  }

  // Calculate percentage and grade
  const maxScore = test.totalMarks || 1;
  const percentage = Math.round((totalScore / maxScore) * 100);

  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  const passed = percentage >= 50;
  const submissionId = 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

  const submission: TestSubmission = {
    id: submissionId,
    testId: test.id,
    testTitle: test.title,
    subject: test.subject,
    studentName: studentName.trim(),
    studentIdentifier: (studentIdentifier || '').trim(),
    submittedAt: new Date().toISOString(),
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    totalScore: Math.round(totalScore * 10) / 10,
    maxScore: test.totalMarks,
    percentage,
    grade,
    passed,
    evaluations,
  };

  existingSubmissions.push(submission);
  submissionsMap.set(test.id, existingSubmissions);
  persistData();

  res.status(201).json({
    message: 'Test submitted and graded successfully',
    submission,
  });
});

// 7. Get submissions for a test (Teacher dashboard)
app.get('/api/tests/:id/submissions', (req, res) => {
  const { id } = req.params;
  const test = findTestByIdOrSlug(id);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const submissions = submissionsMap.get(test.id) || [];
  res.json({ submissions });
});

// 8. Get individual submission report by ID
app.get('/api/submissions/:submissionId', (req, res) => {
  const { submissionId } = req.params;

  for (const subs of submissionsMap.values()) {
    const found = subs.find(s => s.id === submissionId);
    if (found) {
      return res.json({ submission: found });
    }
  }

  res.status(404).json({ error: 'Submission not found' });
});

// ------------------------------------
// SERVER START & VITE MIDDLEWARE
// ------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TestCraft AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
