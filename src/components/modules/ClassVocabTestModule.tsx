import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Copy,
  Check,
  Trophy,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  Search,
  ChevronRight,
  Medal,
  Lock,
  Zap,
  Share2,
  Globe,
  Settings,
  Award,
  Link as LinkIcon,
  XCircle,
  Eye,
  FileText,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { VocabTest, VocabTestSubmission, VocabQuestion, ClassGroup, Student, ExamScore, AttendanceRecord, AuthUser } from '../../types';
import { saveDocument, subscribeCollection, fetchDocument, addSubmissionToTest, fetchCollection } from '../../lib/firestoreService';
import { VocabLeaderboardExportModal } from '../modals/VocabLeaderboardExportModal';
import {
  getPublicBaseUrl,
  setPublicBaseUrl,
  getVocabTestShareUrl,
  getVocabZaloShareMessage,
  getReviewTestShareUrl,
  getReviewZaloShareMessage,
} from '../../utils/placementLink';

// Preset Initial Vocab Tests: Pre-create 31 lessons for each of the 4 courses (Khóa 1, 2, 3, 4) with unique links & anti-cheat
const COURSE_CONFIGS = [
  { level: 'Khóa 1', prefix: 'k1', name: 'Khóa 1' },
  { level: 'Khóa 2', prefix: 'k2', name: 'Khóa 2' },
  { level: 'Khóa 3', prefix: 'k3', name: 'Khóa 3' },
  { level: 'Khóa 4', prefix: 'k4', name: 'Khóa 4' },
];

const generatedTests: VocabTest[] = [];

COURSE_CONFIGS.forEach(course => {
  const maxLessons = course.prefix === 'k4' ? 120 : 31;
  for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
    const testId = `vt-${course.prefix}-${lessonNum < 10 ? '0' + lessonNum : lessonNum}`;
    
    let sampleQuestions: VocabQuestion[] = [
      {
        id: `${testId}-q1`,
        word: `Target Word 1 (Bài ${lessonNum} - ${course.level})`,
        meaning: `Nghĩa tiếng Việt chuẩn Bài ${lessonNum} - ${course.level}`,
        options: [`Nghĩa tiếng Việt chuẩn Bài ${lessonNum} - ${course.level}`, 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctOptionIndex: 0,
        questionType: 'multiple_choice' as const,
        timeLimitSeconds: 10,
      },
      {
        id: `${testId}-q2`,
        word: `Target Word 2 (Bài ${lessonNum} - ${course.level})`,
        meaning: `Nghĩa tiếng Việt chuẩn Bài ${lessonNum} - ${course.level}`,
        options: [`Nghĩa tiếng Việt chuẩn Bài ${lessonNum} - ${course.level}`, 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctOptionIndex: 0,
        questionType: 'matching' as const,
        timeLimitSeconds: 20,
      },
      {
        id: `${testId}-q3`,
        word: `Target Word 3 (Bài ${lessonNum} - ${course.level})`,
        meaning: `Nghĩa tiếng Việt chuẩn Bài ${lessonNum} - ${course.level}`,
        options: [`Nghĩa tiếng Việt chuẩn Bài ${lessonNum} - ${course.level}`, 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctOptionIndex: 0,
        questionType: 'type_input' as const,
        timeLimitSeconds: 20,
      }
    ];

    if (lessonNum === 1 && course.prefix === 'k1') {
      sampleQuestions = [
        {
          id: 'vt-k1-01-q1',
          word: 'Punctual',
          phonetic: '/ˈpʌŋk.tʃu.əl/',
          meaning: 'Đúng giờ, không bao giờ trễ hẹn',
          options: ['Đúng giờ', 'Lười biếng', 'Cẩn thận', 'Tự tin'],
          correctOptionIndex: 0,
          questionType: 'multiple_choice',
          timeLimitSeconds: 10,
        },
        {
          id: 'vt-k1-01-q2',
          word: 'Accomplish',
          phonetic: '/əˈkʌm.plɪʃ/',
          meaning: 'Hoàn thành, đạt được mục tiêu',
          options: ['Hủy bỏ', 'Hoàn thành, đạt được', 'Bắt đầu', 'Trì hoãn'],
          correctOptionIndex: 1,
          questionType: 'multiple_choice',
          timeLimitSeconds: 10,
        },
        {
          id: 'vt-k1-01-q3',
          word: 'Persevere',
          phonetic: '/ˌpɜː.sɪˈvɪər/',
          meaning: 'Kiên trì, nhẫn nại vượt qua khó khăn',
          options: ['Từ bỏ', 'Nghi ngờ', 'Kiên trì, nhẫn nại', 'Chờ đợi'],
          correctOptionIndex: 2,
          questionType: 'matching',
          timeLimitSeconds: 20,
        },
        {
          id: 'vt-k1-01-q4',
          word: 'Diligent',
          phonetic: '/ˈdɪl.ɪ.dʒənt/',
          meaning: 'Chăm chỉ, siêng năng',
          options: ['Thông minh', 'Chăm chỉ, siêng năng', 'Nhanh nhẹn', 'Thật thà'],
          correctOptionIndex: 1,
          questionType: 'type_input',
          timeLimitSeconds: 20,
        },
      ];
    }

    generatedTests.push({
      id: testId,
      title: `Test Từ Vựng Bài ${lessonNum} - ${course.level}`,
      courseLevel: course.level as any,
      unitName: `Bài ${lessonNum}`,
      timePerQuestionSeconds: 20,
      createdDate: '2026-09-10',
      isActive: true,
      questions: sampleQuestions,
      submissions: [],
    });
  }
});

export const INITIAL_VOCAB_TESTS: VocabTest[] = generatedTests;

// Preset Initial Review Tests: Pre-create 31 review lessons for each of the 4 courses (Khóa 1, 2, 3, 4)
const REVIEW_COURSE_CONFIGS = [
  { level: 'Khóa 1', prefix: 'rev-k1', name: 'Khóa 1' },
  { level: 'Khóa 2', prefix: 'rev-k2', name: 'Khóa 2' },
  { level: 'Khóa 3', prefix: 'rev-k3', name: 'Khóa 3' },
  { level: 'Khóa 4', prefix: 'rev-k4', name: 'Khóa 4' },
];

const generatedReviewTests: VocabTest[] = [];

REVIEW_COURSE_CONFIGS.forEach(course => {
  const maxLessons = course.prefix === 'rev-k4' ? 120 : 31;
  for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
    const testId = `${course.prefix}-${lessonNum < 10 ? '0' + lessonNum : lessonNum}`;
    
    let sampleQuestions: VocabQuestion[] = [
      {
        id: `${testId}-q1`,
        word: `Review Question 1 (Bài ${lessonNum} - ${course.level})`,
        meaning: `Đáp án ôn tập kiến thức chuẩn Bài ${lessonNum} - ${course.level}`,
        options: [`Đáp án ôn tập kiến thức chuẩn Bài ${lessonNum} - ${course.level}`, 'Phương án B', 'Phương án C', 'Phương án D'],
        correctOptionIndex: 0,
        questionType: 'multiple_choice',
        timeLimitSeconds: 15,
      },
      {
        id: `${testId}-q2`,
        word: `Review Question 2 (Bài ${lessonNum} - ${course.level})`,
        meaning: `Đáp án ôn tập kiến thức chuẩn Bài ${lessonNum} - ${course.level}`,
        options: [`Đáp án ôn tập kiến thức chuẩn Bài ${lessonNum} - ${course.level}`, 'Phương án B', 'Phương án C', 'Phương án D'],
        correctOptionIndex: 0,
        questionType: 'multiple_choice',
        timeLimitSeconds: 15,
      },
      {
        id: `${testId}-q3`,
        word: `Review Question 3 (Bài ${lessonNum} - ${course.level})`,
        meaning: `Đáp án ôn tập kiến thức chuẩn Bài ${lessonNum} - ${course.level}`,
        options: [`Đáp án ôn tập kiến thức chuẩn Bài ${lessonNum} - ${course.level}`, 'Phương án B', 'Phương án C', 'Phương án D'],
        correctOptionIndex: 0,
        questionType: 'type_input',
        timeLimitSeconds: 20,
      }
    ];

    generatedReviewTests.push({
      id: testId,
      title: `Test Ôn Tập Bài ${lessonNum} - ${course.level}`,
      courseLevel: course.level as any,
      unitName: `Bài ${lessonNum}`,
      timePerQuestionSeconds: 20,
      createdDate: '2026-09-10',
      isActive: true,
      questions: sampleQuestions,
      submissions: [],
    });
  }
});

export const INITIAL_REVIEW_TESTS: VocabTest[] = generatedReviewTests;

// Helper to normalize text for flexible answer matching
export const normalizeAnswerText = (text: string): string => {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Check if student's typed answer is correct given multiple acceptable answers separated by / or ,
export const checkIsTypeInputCorrect = (studentAnswer: string, question: VocabQuestion): boolean => {
  const normStudent = normalizeAnswerText(studentAnswer);
  if (!normStudent) return false;

  const candidateSet = new Set<string>();

  const addCandidatesFromRaw = (raw?: string) => {
    if (!raw) return;
    const rawTokens = raw.split(/[/;|]/);
    rawTokens.forEach((tok) => {
      const trimmed = tok.trim();
      if (trimmed) {
        candidateSet.add(trimmed);
        const norm = normalizeAnswerText(trimmed);
        if (norm) candidateSet.add(norm);
      }
      if (tok.includes(',')) {
        tok.split(',').forEach((subTok) => {
          const subTrim = subTok.trim();
          if (subTrim) {
            candidateSet.add(subTrim);
            const subNorm = normalizeAnswerText(subTrim);
            if (subNorm) candidateSet.add(subNorm);
          }
        });
      }
    });
  };

  addCandidatesFromRaw(question.meaning);
  addCandidatesFromRaw(question.word);
  if (question.options && question.options.length > 0) {
    addCandidatesFromRaw(question.options[question.correctOptionIndex]);
    question.options.forEach((opt) => addCandidatesFromRaw(opt));
  }

  for (const cand of candidateSet) {
    const normCand = normalizeAnswerText(cand);
    if (!normCand) continue;
    if (normStudent === normCand) return true;
    if (studentAnswer.trim().toLowerCase() === cand.trim().toLowerCase()) return true;
  }

  return false;
};

// Helper to strip lesson topic names or obsolete course titles and filter out mock students
const sanitizeVocabTest = (test: VocabTest): VocabTest => {
  let cleanTitle = (test.title || '').split(':')[0].trim();
  cleanTitle = cleanTitle.replace(/Buổi/gi, 'Bài');

  let cleanUnit = test.unitName ? test.unitName.split(':')[0].trim() : '';
  cleanUnit = cleanUnit.replace(/Ôn tập Kiến thức Buổi/gi, 'Bài').replace(/Buổi/gi, 'Bài').replace(/\(.*?\)/g, '').trim();

  if (!cleanUnit) {
    const match = cleanTitle.match(/(?:Bài|Lesson)\s*(\d+)/i);
    if (match) {
      cleanUnit = `Bài ${match[1]}`;
    } else {
      cleanUnit = 'Bài 1';
    }
  }

  const qTypeSanitized = (test.questions || []).map((q) => {
    const qType = q.questionType || 'multiple_choice';
    return {
      ...q,
      questionType: qType,
      timeLimitSeconds: q.timeLimitSeconds || (qType === 'multiple_choice' ? 10 : 20),
    };
  });

  const cleanedSubmissions = (test.submissions || []).filter(
    (sub) =>
      sub.studentName !== 'Nguyễn Văn Minh' &&
      sub.studentName !== 'Phạm Nhật Nam' &&
      !sub.studentName?.toLowerCase().includes('nguyễn văn minh') &&
      !sub.studentName?.toLowerCase().includes('phạm nhật nam') &&
      sub.id !== 'sub-1' &&
      sub.id !== 'sub-rev-1'
  );

  return {
    ...test,
    title: cleanTitle,
    unitName: cleanUnit,
    questions: qTypeSanitized,
    submissions: cleanedSubmissions,
  };
};

interface ClassVocabTestModuleProps {
  classGroup?: ClassGroup;
  classes?: ClassGroup[];
  students?: Student[];
  onAddExamScore?: (exam: ExamScore) => void;
  onSaveAttendance?: (records: AttendanceRecord[]) => void;
  showToast: (msg: string) => void;
  currentUser?: AuthUser;
  initialVocabTestId?: string;
  initialReviewTestId?: string;
}

export const ClassVocabTestModule: React.FC<ClassVocabTestModuleProps> = ({
  classGroup,
  classes = [],
  students = [],
  onAddExamScore,
  onSaveAttendance,
  showToast,
  currentUser,
  initialVocabTestId,
  initialReviewTestId,
}) => {
  const isStudentPortalMode = Boolean(initialVocabTestId || initialReviewTestId);
  const [isExited, setIsExited] = useState<boolean>(false);

  const getQuestionType = (q?: VocabQuestion): 'multiple_choice' | 'matching' | 'type_input' => {
    if (!q) return 'multiple_choice';
    return q.questionType || 'multiple_choice';
  };

  const getQuestionTimeLimit = (q?: VocabQuestion): number => {
    if (!q) return 10;
    if (q.timeLimitSeconds) return q.timeLimitSeconds;
    const type = q.questionType || 'multiple_choice';
    if (type === 'multiple_choice') return 10;
    return 20; // matching & type_input get 20s
  };

  const [activeTestType, setActiveTestType] = useState<'vocab' | 'review'>('vocab');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<'Khóa 1' | 'Khóa 2' | 'Khóa 3' | 'Khóa 4'>('Khóa 1');
  const [tests, setTests] = useState<VocabTest[]>(() =>
    INITIAL_VOCAB_TESTS.map((test) => sanitizeVocabTest(test))
  );

  const [reviewTests, setReviewTests] = useState<VocabTest[]>(() =>
    INITIAL_REVIEW_TESTS.map((test) => sanitizeVocabTest(test))
  );
  
  // Real-time synchronization for vocab tests from Firestore
  useEffect(() => {
    const unsub = subscribeCollection<VocabTest>('vocab_tests', INITIAL_VOCAB_TESTS, (data) => {
      const existingIds = new Set(data.map((t) => t.id));
      const missingPresets = INITIAL_VOCAB_TESTS.filter((t) => !existingIds.has(t.id));
      const fullData = missingPresets.length > 0 ? [...data, ...missingPresets] : data;
      const mappedData = fullData.map((test) => sanitizeVocabTest(test));
      setTests(mappedData);

      // Smoothly update submissions of the active test without touching any runner progress
      setActiveRunnerTest((prev) => {
        if (!prev) return null;
        const matchingUpdatedTest = mappedData.find((t) => t.id === prev.id);
        if (!matchingUpdatedTest) return prev;
        return {
          ...prev,
          submissions: matchingUpdatedTest.submissions || prev.submissions || [],
        };
      });

      if (missingPresets.length > 0) {
        missingPresets.forEach((test) => {
          saveDocument('vocab_tests', test).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  // Real-time synchronization for review tests from Firestore
  useEffect(() => {
    const unsub = subscribeCollection<VocabTest>('vocab_reviews', INITIAL_REVIEW_TESTS, (data) => {
      const existingIds = new Set(data.map((t) => t.id));
      const missingPresets = INITIAL_REVIEW_TESTS.filter((t) => !existingIds.has(t.id));
      const fullData = missingPresets.length > 0 ? [...data, ...missingPresets] : data;
      const mappedData = fullData.map((test) => sanitizeVocabTest(test));
      setReviewTests(mappedData);

      // Smoothly update submissions of the active test without touching any runner progress
      setActiveRunnerTest((prev) => {
        if (!prev) return null;
        const matchingUpdatedTest = mappedData.find((t) => t.id === prev.id);
        if (!matchingUpdatedTest) return prev;
        return {
          ...prev,
          submissions: matchingUpdatedTest.submissions || prev.submissions || [],
        };
      });

      if (missingPresets.length > 0) {
        missingPresets.forEach((test) => {
          saveDocument('vocab_reviews', test).catch(() => {});
        });
      }
    });
    return () => unsub();
  }, []);

  // Modals & Active Test States
  const [activeLeaderboardTest, setActiveLeaderboardTest] = useState<VocabTest | null>(null);
  const [leaderboardClassFilter, setLeaderboardClassFilter] = useState<string>('all');
  const [exportZaloModalTest, setExportZaloModalTest] = useState<VocabTest | null>(null);
  const [exportZaloInitialClass, setExportZaloInitialClass] = useState<string>('all');
  const [activeRunnerTest, setActiveRunnerTest] = useState<VocabTest | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Guard refs to prevent multiple-user Firestore updates from resetting or kicking out active test runners
  const autoLaunchedVocabIdRef = useRef<string | null>(null);
  const autoLaunchedReviewIdRef = useRef<string | null>(null);

  // Start runner with session recovery and multi-user isolation
  const handleStartRunner = (test: VocabTest, forceRestart: boolean = false) => {
    // If the student is already actively doing THIS test, DO NOT RESET THEM!
    if (!forceRestart && activeRunnerTest?.id === test.id && runnerStarted && !testCompletedSubmission) {
      return;
    }

    // Check if there is an in-progress saved session in sessionStorage for this test
    const sessionKey = `idv_active_test_${test.id}`;
    let savedSession: any = null;
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) savedSession = JSON.parse(raw);
    } catch (e) {}

    if (savedSession && savedSession.runnerStarted && !savedSession.completed && !forceRestart) {
      setIsExited(false);
      setActiveRunnerTest(test);
      setSelectedCourseLevel(test.courseLevel);
      setRunnerStudentName(savedSession.studentName || '');
      setRunnerClassName(savedSession.className || (classGroup ? classGroup.name : ''));
      setRunnerStudentPhone(savedSession.studentPhone || '');
      setRunnerStarted(true);
      setCurrentQuestionIndex(savedSession.currentQuestionIndex || 0);
      setSelectedAnswers(savedSession.selectedAnswers || {});
      setTypedAnswers(savedSession.typedAnswers || {});
      typedAnswersRef.current = savedSession.typedAnswers || {};
      selectedAnswersRef.current = savedSession.selectedAnswers || {};
      setTabSwitchCount(savedSession.tabSwitchCount || 0);
      tabSwitchCountRef.current = savedSession.tabSwitchCount || 0;
      setShowAntiCheatWarning(false);
      setTestCompletedSubmission(null);
      setResultActiveTab('answers');
      setWasTimeoutAutoSubmit(false);
      const qIndex = savedSession.currentQuestionIndex || 0;
      const qLimit = getQuestionTimeLimit(test.questions[qIndex]);
      setQuestionTimeLeft(
        typeof savedSession.questionTimeLeft === 'number' && savedSession.questionTimeLeft > 0
          ? savedSession.questionTimeLeft
          : qLimit
      );
      setTestStartTime(savedSession.testStartTime || Date.now());
      return;
    }

    setIsExited(false);
    setActiveRunnerTest(test);
    setSelectedCourseLevel(test.courseLevel);
    setRunnerStudentName('');
    setRunnerClassName(classGroup ? classGroup.name : '');
    setRunnerStudentPhone('');
    setRunnerStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTypedAnswers({});
    typedAnswersRef.current = {};
    selectedAnswersRef.current = {};
    setTabSwitchCount(0);
    tabSwitchCountRef.current = 0;
    setShowAntiCheatWarning(false);
    setTestCompletedSubmission(null);
    setResultActiveTab('answers');
    setWasTimeoutAutoSubmit(false);

    const firstQ = test.questions[0];
    const firstLimit = getQuestionTimeLimit(firstQ);
    setQuestionTimeLeft(firstLimit);
  };

  // Auto-launch test if initialVocabTestId is passed from URL
  useEffect(() => {
    if (!initialVocabTestId || tests.length === 0) return;

    // CRITICAL: If already launched or runner is already active with this test, never restart it!
    if (autoLaunchedVocabIdRef.current === initialVocabTestId) return;
    if (activeRunnerTest && activeRunnerTest.id.toLowerCase() === initialVocabTestId.toLowerCase()) {
      autoLaunchedVocabIdRef.current = initialVocabTestId;
      return;
    }

    setActiveTestType('vocab');
    let found = tests.find(
      (t) => t.id === initialVocabTestId || t.id.toLowerCase() === initialVocabTestId.toLowerCase()
    );

    if (!found) {
      // Search by level keyword or fallback to first test in that level
      const cleanId = initialVocabTestId.toLowerCase();
      if (cleanId.includes('k2') || cleanId.includes('khoa-2') || cleanId.includes('khóa 2')) {
        found = tests.find((t) => t.courseLevel === 'Khóa 2');
      } else if (cleanId.includes('k3') || cleanId.includes('khoa-3') || cleanId.includes('khóa 3')) {
        found = tests.find((t) => t.courseLevel === 'Khóa 3');
      } else if (cleanId.includes('k4') || cleanId.includes('khoa-4') || cleanId.includes('khóa 4')) {
        found = tests.find((t) => t.courseLevel === 'Khóa 4');
      } else {
        found = tests.find((t) => t.courseLevel === 'Khóa 1') || tests[0];
      }
    }

    if (found) {
      autoLaunchedVocabIdRef.current = initialVocabTestId;
      handleStartRunner(found);
    }
  }, [initialVocabTestId, tests, activeRunnerTest]);

  // Auto-launch test if initialReviewTestId is passed from URL
  useEffect(() => {
    if (!initialReviewTestId || reviewTests.length === 0) return;

    // CRITICAL: If already launched or runner is already active with this test, never restart it!
    if (autoLaunchedReviewIdRef.current === initialReviewTestId) return;
    if (activeRunnerTest && activeRunnerTest.id.toLowerCase() === initialReviewTestId.toLowerCase()) {
      autoLaunchedReviewIdRef.current = initialReviewTestId;
      return;
    }

    setActiveTestType('review');
    let found = reviewTests.find(
      (t) => t.id === initialReviewTestId || t.id.toLowerCase() === initialReviewTestId.toLowerCase()
    );

    if (!found) {
      const cleanId = initialReviewTestId.toLowerCase();
      if (cleanId.includes('k2') || cleanId.includes('khoa-2') || cleanId.includes('khóa 2')) {
        found = reviewTests.find((t) => t.courseLevel === 'Khóa 2');
      } else if (cleanId.includes('k3') || cleanId.includes('khoa-3') || cleanId.includes('khóa 3')) {
        found = reviewTests.find((t) => t.courseLevel === 'Khóa 3');
      } else if (cleanId.includes('k4') || cleanId.includes('khoa-4') || cleanId.includes('khóa 4')) {
        found = reviewTests.find((t) => t.courseLevel === 'Khóa 4');
      } else {
        found = reviewTests.find((t) => t.courseLevel === 'Khóa 1') || reviewTests[0];
      }
    }

    if (found) {
      autoLaunchedReviewIdRef.current = initialReviewTestId;
      handleStartRunner(found);
    }
  }, [initialReviewTestId, reviewTests, activeRunnerTest]);

  // New Test Creator / Editor Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [newTestForm, setNewTestForm] = useState({
    title: '',
    unitName: '',
    courseLevel: 'Khóa 1' as 'Khóa 1' | 'Khóa 2' | 'Khóa 3' | 'Khóa 4',
    timePerQuestionSeconds: 20,
  });

  // Runner state (when taking test)
  const [runnerStudentName, setRunnerStudentName] = useState('');
  const [runnerClassName, setRunnerClassName] = useState(classGroup?.name || '');
  const [runnerStudentPhone, setRunnerStudentPhone] = useState('');
  const [runnerStarted, setRunnerStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(20);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState<boolean>(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [testCompletedSubmission, setTestCompletedSubmission] = useState<VocabTestSubmission | null>(null);
  const [resultActiveTab, setResultActiveTab] = useState<'answers' | 'leaderboard'>('answers');
  const [wasTimeoutAutoSubmit, setWasTimeoutAutoSubmit] = useState<boolean>(false);
  const [customizedQuestions, setCustomizedQuestions] = useState<VocabQuestion[]>([]);
  const [typedAnswers, setTypedAnswers] = useState<Record<number, string>>({});
  const typedAnswersRef = useRef<Record<number, string>>({});
  const selectedAnswersRef = useRef<Record<number, number>>({});

  // Quick Auto Generator State by Pasting Vocab & Defining Question Type Counts
  const [showAutoGenerator, setShowAutoGenerator] = useState<boolean>(true);
  const [autoVocabText, setAutoVocabText] = useState<string>('');
  const [autoMcCount, setAutoMcCount] = useState<number>(7);
  const [autoMatchingCount, setAutoMatchingCount] = useState<number>(2);
  const [autoTypeInputCount, setAutoTypeInputCount] = useState<number>(1);
  const [createdTestShareModal, setCreatedTestShareModal] = useState<VocabTest | null>(null);

  // Initialize default questions when opening create modal if empty
  useEffect(() => {
    if (showCreateModal && customizedQuestions.length === 0) {
      setCustomizedQuestions([
        {
          id: `q-${Date.now()}-0`,
          word: 'Punctual',
          meaning: 'Đúng giờ',
          options: ['Đúng giờ', 'Cẩn thận', 'Lười biếng', 'Tự tin'],
          correctOptionIndex: 0,
          questionType: 'multiple_choice',
          timeLimitSeconds: 10,
        },
        {
          id: `q-${Date.now()}-1`,
          word: 'Accomplish',
          meaning: 'Hoàn thành',
          options: ['Hoàn thành', 'Bắt đầu', 'Trì hoãn', 'Hủy bỏ'],
          correctOptionIndex: 0,
          questionType: 'matching',
          timeLimitSeconds: 20,
        },
      ]);
    }
  }, [showCreateModal]);

  // Total elapsed time tracking
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const lastViolationTimeRef = useRef<number>(0);
  const lastReturnTimeRef = useRef<number>(0);
  const isUserAwayRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const tabSwitchCountRef = useRef<number>(0);

  // Autosave running session to sessionStorage so accidental reloads or background tabs never lose progress
  useEffect(() => {
    if (!activeRunnerTest || !runnerStarted || testCompletedSubmission) return;
    try {
      const sessionData = {
        testId: activeRunnerTest.id,
        studentName: runnerStudentName,
        className: runnerClassName,
        studentPhone: runnerStudentPhone,
        runnerStarted: true,
        currentQuestionIndex,
        selectedAnswers,
        typedAnswers,
        tabSwitchCount,
        questionTimeLeft,
        testStartTime,
      };
      sessionStorage.setItem(`idv_active_test_${activeRunnerTest.id}`, JSON.stringify(sessionData));
    } catch (e) {}
  }, [
    activeRunnerTest,
    runnerStarted,
    testCompletedSubmission,
    runnerStudentName,
    runnerClassName,
    runnerStudentPhone,
    currentQuestionIndex,
    selectedAnswers,
    typedAnswers,
    tabSwitchCount,
    questionTimeLeft,
    testStartTime,
  ]);

  // Helper to extract numeric lesson number for natural sorting (1, 2, ..., 10, 11, ..., 100, 101, ..., 120)
  const extractLessonNumber = (test: VocabTest): number => {
    if (test.unitName) {
      const match = test.unitName.match(/\d+/);
      if (match) return parseInt(match[0], 10);
    }
    if (test.title) {
      const match = test.title.match(/\d+/);
      if (match) return parseInt(match[0], 10);
    }
    if (test.id) {
      const matches = test.id.match(/\d+/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10);
      }
    }
    return 0;
  };

  // Filter tests by selected course level & active test type with natural numerical sorting
  const activeTestsList = activeTestType === 'review' ? reviewTests : tests;
  const filteredTests = activeTestsList
    .filter((t) => t.courseLevel === selectedCourseLevel)
    .sort((a, b) => extractLessonNumber(a) - extractLessonNumber(b));

  // Configurable Public Base URL state for sharing
  const [publicBaseUrl, setLocalPublicBaseUrl] = useState<string>(() => getPublicBaseUrl());
  const [showDomainConfig, setShowDomainConfig] = useState<boolean>(false);
  const [customDomainInput, setCustomDomainInput] = useState<string>(() => getPublicBaseUrl());

  useEffect(() => {
    if (activeRunnerTest || initialVocabTestId || initialReviewTestId) {
      document.title = activeTestType === 'review' ? 'Bài ôn tập kiến thức - IELTS Dương Vũ' : 'Bài kiểm tra từ vựng - IELTS Dương Vũ';
    }
  }, [activeRunnerTest, initialVocabTestId, initialReviewTestId, activeTestType]);

  useEffect(() => {
    const handleBaseUrlChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const newUrl = customEvent.detail || getPublicBaseUrl();
      setLocalPublicBaseUrl(newUrl);
      setCustomDomainInput(newUrl);
    };
    window.addEventListener('ielts-base-url-changed', handleBaseUrlChange);
    return () => window.removeEventListener('ielts-base-url-changed', handleBaseUrlChange);
  }, []);

  const handleSaveCustomDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setPublicBaseUrl(customDomainInput);
    setLocalPublicBaseUrl(getPublicBaseUrl());
    showToast('✅ Đã lưu cấu hình tên miền link làm bài cho học sinh!');
    setShowDomainConfig(false);
  };

  const handleResetCustomDomain = () => {
    setPublicBaseUrl('');
    const base = getPublicBaseUrl();
    setLocalPublicBaseUrl(base);
    setCustomDomainInput(base);
    showToast('🔄 Đã khôi phục tên miền về mặc định của hệ thống.');
  };

  // Helper to generate full share link
  const getTestShareUrl = (testId: string) => {
    if (activeTestType === 'review') {
      return getReviewTestShareUrl(testId, publicBaseUrl);
    }
    return getVocabTestShareUrl(testId, publicBaseUrl);
  };

  const handleCopyTestLink = (test: VocabTest, format: 'url' | 'zalo' | 'simple' = 'zalo') => {
    const url = getTestShareUrl(test.id);
    let textToCopy = '';

    if (format === 'url') {
      textToCopy = url;
    } else if (format === 'simple') {
      textToCopy = activeTestType === 'review'
        ? `📝 [IELTS DƯƠNG VŨ] BÀI ÔN TẬP KIẾN THỨC: ${test.title} (${test.courseLevel} - ${test.unitName})\n🔗 Link làm bài chính thức: ${url}`
        : `📝 [IELTS DƯƠNG VŨ] BÀI TEST TỪ VỰNG: ${test.title} (${test.courseLevel} - ${test.unitName})\n🔗 Link làm bài chính thức: ${url}`;
    } else {
      textToCopy = activeTestType === 'review'
        ? getReviewZaloShareMessage(test.title, test.courseLevel, test.unitName, url, test.timePerQuestionSeconds || 20)
        : getVocabZaloShareMessage(test.title, test.courseLevel, test.unitName, url, test.timePerQuestionSeconds || 20);
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedLinkId(test.id);
    showToast(format === 'url' ? `✅ Đã sao chép link công khai cho học sinh: ${url}` : `✅ Đã sao chép tên bài test "${test.title}" kèm link gửi Zalo!`);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  // Auto Generator Handler: Parse pasted vocab list and build specified question type counts
  const handleGenerateFromVocabText = () => {
    if (!autoVocabText.trim()) {
      showToast('⚠️ Vui lòng dán danh sách từ vựng kèm nghĩa vào ô!');
      return;
    }

    const lines = autoVocabText.split('\n');
    const parsedItems: { word: string; meaning: string }[] = [];

    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;
      // Strip leading numbers like "1. ", "1/ ", "- "
      trimmed = trimmed.replace(/^(?:\d+[\.\/\)-]?|\-|\*)\s*/, '').trim();
      if (!trimmed) continue;

      let parts = trimmed.split(/[:\-=\t–—]/);
      if (parts.length >= 2) {
        const word = parts[0].trim();
        const meaning = parts.slice(1).join(' - ').trim();
        if (word && meaning) {
          parsedItems.push({ word, meaning });
        }
      } else {
        const spaceParts = trimmed.split(/\s{2,}/);
        if (spaceParts.length >= 2) {
          parsedItems.push({ word: spaceParts[0].trim(), meaning: spaceParts.slice(1).join(' ').trim() });
        }
      }
    }

    if (parsedItems.length === 0) {
      showToast('⚠️ Không tìm thấy từ vựng hợp lệ! Định dạng mẫu: "Word: Nghĩa" (mỗi từ 1 dòng)');
      return;
    }

    const fallbackMeanings = [
      'Cẩn thận, tỉ mỉ',
      'Hoàn thành, đạt được',
      'Đúng giờ, chuẩn giờ',
      'Kiên trì, nhẫn nại',
      'Chăm chỉ, siêng năng',
      'Phát triển, mở rộng',
      'Thay đổi, biến đổi',
      'Nghiên cứu, tìm hiểu',
      'Tập trung, chú ý',
      'Đánh giá, phân tích',
    ];

    const generateOptionsForMeaning = (correctMeaning: string, currentItemIdx: number) => {
      const otherMeanings = parsedItems
        .filter((_, idx) => idx !== currentItemIdx)
        .map((i) => i.meaning);

      const distractorsSet = new Set<string>();
      otherMeanings.forEach((m) => {
        if (m.toLowerCase() !== correctMeaning.toLowerCase()) {
          distractorsSet.add(m);
        }
      });

      fallbackMeanings.forEach((m) => {
        if (distractorsSet.size < 3 && m.toLowerCase() !== correctMeaning.toLowerCase()) {
          distractorsSet.add(m);
        }
      });

      const distractors = Array.from(distractorsSet).slice(0, 3);
      while (distractors.length < 3) {
        distractors.push(`Phương án phụ ${distractors.length + 1}`);
      }

      const rawOptions = [correctMeaning, ...distractors];
      const shuffled = [...rawOptions].sort(() => Math.random() - 0.5);
      const correctIdx = shuffled.indexOf(correctMeaning);

      return { options: shuffled, correctIdx };
    };

    const newQuestions: VocabQuestion[] = [];
    let itemPointer = 0;

    const getItem = () => {
      const item = parsedItems[itemPointer % parsedItems.length];
      const idx = itemPointer % parsedItems.length;
      itemPointer++;
      return { item, idx };
    };

    // 1. Multiple choice questions
    for (let i = 0; i < autoMcCount; i++) {
      const { item, idx } = getItem();
      const { options, correctIdx } = generateOptionsForMeaning(item.meaning, idx);
      newQuestions.push({
        id: `q-mc-${Date.now()}-${i}`,
        word: item.word,
        meaning: item.meaning,
        options,
        correctOptionIndex: correctIdx,
        questionType: 'multiple_choice',
        timeLimitSeconds: 10,
      });
    }

    // 2. Matching questions
    for (let i = 0; i < autoMatchingCount; i++) {
      const { item, idx } = getItem();
      const { options, correctIdx } = generateOptionsForMeaning(item.meaning, idx);
      newQuestions.push({
        id: `q-match-${Date.now()}-${i}`,
        word: item.word,
        meaning: item.meaning,
        options,
        correctOptionIndex: correctIdx,
        questionType: 'matching',
        timeLimitSeconds: 20,
      });
    }

    // 3. Type input questions
    for (let i = 0; i < autoTypeInputCount; i++) {
      const { item } = getItem();
      newQuestions.push({
        id: `q-type-${Date.now()}-${i}`,
        word: item.word,
        meaning: item.meaning,
        options: [item.meaning, '', '', ''],
        correctOptionIndex: 0,
        questionType: 'type_input',
        timeLimitSeconds: 20,
      });
    }

    setCustomizedQuestions(newQuestions);

    if (!newTestForm.title.trim()) {
      const activeList = activeTestType === 'review' ? reviewTests : tests;
      const nextNum = activeList.length + 1;
      setNewTestForm({
        ...newTestForm,
        title: `Test ${activeTestType === 'review' ? 'Ôn Tập' : 'Từ Vựng'} Bài ${nextNum} - ${newTestForm.courseLevel}`,
        unitName: `Bài ${nextNum}`,
      });
    }

    showToast(`⚡ Đã tự động tạo ${newQuestions.length} câu hỏi (${autoMcCount} trắc nghiệm, ${autoMatchingCount} nối từ, ${autoTypeInputCount} điền từ) từ ${parsedItems.length} từ vựng!`);
  };

  // Create or Update test handler
  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestForm.title.trim()) {
      showToast('⚠️ Vui lòng nhập Tiêu đề bài test!');
      return;
    }

    const finalUnitName = newTestForm.unitName.trim() || 'Bài 1';

    if (customizedQuestions.length === 0) {
      showToast('⚠️ Vui lòng nhập hoặc kiểm tra danh sách câu hỏi!');
      return;
    }

    const collectionName = activeTestType === 'review' ? 'vocab_reviews' : 'vocab_tests';
    const activeList = activeTestType === 'review' ? reviewTests : tests;

    if (editingTestId) {
      // Update existing test
      const updatedList = activeList.map(t => {
        if (t.id === editingTestId) {
          return {
            ...t,
            title: newTestForm.title,
            unitName: finalUnitName,
            courseLevel: newTestForm.courseLevel,
            timePerQuestionSeconds: newTestForm.timePerQuestionSeconds,
            questions: customizedQuestions,
          };
        }
        return t;
      });
      if (activeTestType === 'review') setReviewTests(updatedList);
      else setTests(updatedList);

      const updatedTestObj = updatedList.find(t => t.id === editingTestId);
      if (updatedTestObj) {
        saveDocument(collectionName, updatedTestObj);
      }
      setEditingTestId(null);
      setShowCreateModal(false);
      showToast(`✅ Đã cập nhật thành công bài test: "${newTestForm.title}"!`);
    } else {
      // Create new test
      const newTest: VocabTest = {
        id: `${activeTestType === 'review' ? 'rev' : 'vt'}-${Date.now()}`,
        title: newTestForm.title,
        classId: classGroup?.id,
        className: classGroup?.name,
        courseLevel: newTestForm.courseLevel,
        unitName: finalUnitName,
        timePerQuestionSeconds: newTestForm.timePerQuestionSeconds,
        questions: customizedQuestions,
        createdDate: new Date().toISOString().split('T')[0],
        isActive: true,
        submissions: [],
      };

      if (activeTestType === 'review') {
        setReviewTests([newTest, ...reviewTests]);
      } else {
        setTests([newTest, ...tests]);
      }
      saveDocument(collectionName, newTest);
      setShowCreateModal(false);
      setCreatedTestShareModal(newTest);
      showToast(`✅ Đã khởi tạo thành công bài test cho ${newTestForm.courseLevel}!`);
    }
  };

  // --- ANTI-CHEAT & TIMER EFFECT FOR RUNNER ---
  useEffect(() => {
    if (!runnerStarted || !activeRunnerTest || testCompletedSubmission) return;

    const triggerExitViolation = (reason: string) => {
      if (isSubmittingRef.current) return;
      const now = Date.now();
      if (isUserAwayRef.current) return; // Already counted this exit cycle
      if (now - lastViolationTimeRef.current < 1500) return; // Debounce

      isUserAwayRef.current = true;
      lastViolationTimeRef.current = now;
      tabSwitchCountRef.current += 1;
      setTabSwitchCount(tabSwitchCountRef.current);
      setShowAntiCheatWarning(true);
    };

    const handleReturn = () => {
      isUserAwayRef.current = false;
      lastReturnTimeRef.current = Date.now();
    };

    // 1. Visibility change (when switching tab, minimizing, or app going background)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerExitViolation('Thoát màn hình / Rời tab làm bài');
      } else {
        handleReturn();
      }
    };

    // 2. Page Hide & Freeze (mobile backgrounding)
    const handlePageHide = () => {
      triggerExitViolation('Rời trang / Ẩn ứng dụng');
    };
    const handleFreeze = () => {
      triggerExitViolation('Tạm dừng màn hình');
    };

    // 3. Heartbeat drift detector (in case browser suspended JS before visibility event fired)
    let lastHeartbeat = Date.now();
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastHeartbeat;
      lastHeartbeat = now;

      // Only trigger if suspended for > 4500ms AND document is actually hidden or away
      if (delta > 4500 && !isUserAwayRef.current && Date.now() - lastReturnTimeRef.current > 2500) {
        if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
          triggerExitViolation('Rời màn hình làm bài');
        }
      }
    }, 250);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handleReturn);
    window.addEventListener('focus', handleReturn);
    document.addEventListener('freeze', handleFreeze);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handleReturn);
      window.removeEventListener('focus', handleReturn);
      document.removeEventListener('freeze', handleFreeze);
    };
  }, [runnerStarted, activeRunnerTest, testCompletedSubmission]);

  // Question Timer Countdown Effect
  useEffect(() => {
    if (!runnerStarted || !activeRunnerTest || testCompletedSubmission) return;

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [runnerStarted, activeRunnerTest, currentQuestionIndex, testCompletedSubmission]);

  // Trigger next question or finish test when timer reaches 0
  useEffect(() => {
    if (!runnerStarted || !activeRunnerTest || testCompletedSubmission) return;
    if (questionTimeLeft === 0) {
      handleNextQuestion(true);
    }
  }, [questionTimeLeft, runnerStarted, activeRunnerTest, testCompletedSubmission]);

  const handleConfirmStudentInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!runnerStudentName.trim()) {
      showToast('⚠️ Vui lòng nhập Họ và Tên đầy đủ của học sinh!');
      return;
    }
    if (!runnerClassName.trim()) {
      showToast('⚠️ Vui lòng nhập Số lớp (VD: 88, 89)!');
      return;
    }
    isSubmittingRef.current = false;
    setRunnerStarted(true);
    setTestStartTime(Date.now());
  };

  const handleSelectAnswer = (questionIdx: number, optionIdx: number) => {
    selectedAnswersRef.current = {
      ...selectedAnswersRef.current,
      [questionIdx]: optionIdx,
    };
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
    }));
  };

  const handleTypeAnswerChange = (questionIdx: number, val: string) => {
    typedAnswersRef.current = {
      ...typedAnswersRef.current,
      [questionIdx]: val,
    };
    setTypedAnswers((prev) => ({
      ...prev,
      [questionIdx]: val,
    }));
  };

  const handleNextQuestion = (isTimeout: boolean = false) => {
    if (!activeRunnerTest) return;
    if (currentQuestionIndex < activeRunnerTest.questions.length - 1) {
      const nextQ = activeRunnerTest.questions[currentQuestionIndex + 1];
      const nextLimit = getQuestionTimeLimit(nextQ);
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuestionTimeLeft(nextLimit);
    } else {
      // Finish test!
      if (isTimeout) {
        setWasTimeoutAutoSubmit(true);
      }
      finishVocabTest(isTimeout);
    }
  };

  const finishVocabTest = async (isTimeout: boolean = false) => {
    if (!activeRunnerTest || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (isTimeout) {
      setWasTimeoutAutoSubmit(true);
    }

    const totalQ = activeRunnerTest.questions.length;
    let correctCount = 0;
    const currentTyped = { ...typedAnswers, ...typedAnswersRef.current };
    const currentSelected = { ...selectedAnswers, ...selectedAnswersRef.current };

    activeRunnerTest.questions.forEach((q, idx) => {
      if (q.questionType === 'type_input') {
        const typed = (currentTyped[idx] !== undefined ? currentTyped[idx] : '').trim();
        const isCorrect = checkIsTypeInputCorrect(typed, q);
        if (isCorrect) {
          correctCount++;
        }
      } else {
        if (currentSelected[idx] === q.correctOptionIndex) {
          correctCount++;
        }
      }
    });

    const scoreOut10 = Math.round((correctCount / totalQ) * 10 * 10) / 10;
    const timeSpentSeconds = Math.round((Date.now() - testStartTime) / 1000);

    const cleanStudentName = runnerStudentName.trim();
    const cleanClassName = runnerClassName.trim();
    const cleanPhone = runnerStudentPhone.trim();
    const classDigits = cleanClassName.match(/\d+/g)?.[0];

    // Match student & class in center database
    const matchedStudent = students.find(
      (s) =>
        s.name.toLowerCase() === cleanStudentName.toLowerCase() ||
        (cleanPhone && s.phone && s.phone === cleanPhone)
    );

    const allClassOptions = classes.length > 0 ? classes : (classGroup ? [classGroup] : []);
    const matchedClass = allClassOptions.find((c) => {
      const cName = c.name.toLowerCase();
      const cId = c.id.toLowerCase();
      const inputName = cleanClassName.toLowerCase();
      if (!inputName) return false;
      if (cName.includes(inputName) || inputName.includes(cName) || cId.includes(inputName)) return true;
      if (classDigits) {
        if (cName.includes(classDigits) || cId.includes(classDigits)) return true;
      }
      return false;
    });

    const targetClassId = matchedClass ? matchedClass.id : (classDigits ? `class-ielts-${classDigits}` : (classGroup?.id || 'class-vocab-auto'));
    const targetClassName = matchedClass?.name || (classDigits ? `Lớp ${classDigits}` : (cleanClassName || classGroup?.name || 'Lớp Học IELTS'));

    const newSub: VocabTestSubmission = {
      id: `sub-${Date.now()}`,
      testId: activeRunnerTest.id,
      studentId: matchedStudent?.id,
      studentName: cleanStudentName,
      studentPhone: cleanPhone,
      className: cleanClassName || targetClassName,
      classId: targetClassId,
      score: scoreOut10,
      correctCount,
      totalQuestions: totalQ,
      timeSpentSeconds,
      tabSwitchViolations: Math.max(tabSwitchCount, tabSwitchCountRef.current),
      submittedAt: new Date().toISOString(),
    };

    try {
      // Persist to Firestore
      const isReview = activeTestType === 'review' || activeRunnerTest.id.startsWith('rev-');
      const collectionName = isReview ? 'vocab_reviews' : 'vocab_tests';
      
      // Use atomic array union to prevent race conditions
      await addSubmissionToTest(collectionName, activeRunnerTest.id, newSub);
      await saveDocument('vocab_test_submissions', newSub);

      // The subscription will automatically update the local state
      try {
        sessionStorage.removeItem(`idv_active_test_${activeRunnerTest.id}`);
      } catch (e) {}
      setTestCompletedSubmission(newSub);
    } catch (error) {
      console.error('Error submitting test:', error);
      showToast('❌ Lỗi khi lưu bài làm. Vui lòng thử lại!');
      isSubmittingRef.current = false;
      return;
    }

    const isReview = activeTestType === 'review' || activeRunnerTest.id.startsWith('rev-');
    const testCategoryLabel = isReview ? 'Bài Ôn Tập Kiến Thức' : 'Test Từ Vựng';

    // 1. Auto-save score to System Exam Score (Bảng Điểm Kiểm Tra)
    if (onAddExamScore) {
      const examRecord: ExamScore = {
        id: `exam-vocab-${Date.now()}`,
        studentId: matchedStudent ? matchedStudent.id : `student-vocab-${Date.now()}`,
        studentName: cleanStudentName,
        studentCode: matchedStudent ? matchedStudent.code : 'HV-TV',
        classId: targetClassId,
        className: targetClassName,
        examName: `${testCategoryLabel} (${activeRunnerTest.courseLevel}) - ${activeRunnerTest.unitName}`,
        examDate: new Date().toISOString().split('T')[0],
        totalScore: scoreOut10,
        rank: scoreOut10 >= 9 ? 'Xuất sắc' : scoreOut10 >= 7.5 ? 'Giỏi' : scoreOut10 >= 6 ? 'Khá' : 'Trung bình',
        teacherComment: `Hoàn thành ${testCategoryLabel.toLowerCase()} (${activeRunnerTest.courseLevel} - ${activeRunnerTest.unitName}). Lớp: ${targetClassName}. Đúng ${correctCount}/${totalQ} câu (${scoreOut10}/10đ). Thời gian: ${timeSpentSeconds}s. Vi phạm chuyển tab: ${tabSwitchCount} lần.`,
      };
      onAddExamScore(examRecord);
    }

    // 2. Auto-record result directly into current session / attendance record (Cập nhật kết quả vào buổi học)
    if (onSaveAttendance) {
      const todayStr = new Date().toISOString().split('T')[0];
      const attRecord: AttendanceRecord = {
        id: `att-vocab-${Date.now()}`,
        classId: targetClassId,
        date: todayStr,
        sessionNumber: 1,
        studentId: matchedStudent ? matchedStudent.id : `student-vocab-${Date.now()}`,
        studentName: cleanStudentName,
        status: 'Có mặt',
        skillTaught: isReview ? 'Ôn tập' : 'Từ vựng',
        skillsTaught: [isReview ? 'Ôn tập' : 'Từ vựng'],
        score: scoreOut10,
        skillScores: { [isReview ? 'Ôn tập' : 'Từ vựng']: scoreOut10 },
        skillTotalQuestions: { [isReview ? 'Ôn tập' : 'Từ vựng']: totalQ },
        note: `Kết quả ${testCategoryLabel} ${activeRunnerTest.unitName} (${activeRunnerTest.courseLevel}): ${scoreOut10}/10đ (${correctCount}/${totalQ} câu, ${timeSpentSeconds}s)`,
      };
      onSaveAttendance([attRecord]);
    }

    // 3. Auto-save score directly to the Class Spreadsheet (Bảng điểm nhập điểm học viên)
    const syncToSpreadsheet = async () => {
      try {
        const candidateSheetIds: string[] = [];
        if (targetClassId) candidateSheetIds.push(`sheet-${targetClassId}`);
        if (classDigits) {
          candidateSheetIds.push(`sheet-ielts-${classDigits}`);
          candidateSheetIds.push(`sheet-${classDigits}`);
        }
        if (cleanClassName) {
          const slug = cleanClassName.toLowerCase().replace(/\s+/g, '-');
          candidateSheetIds.push(`sheet-${slug}`);
        }

        let sheet = null;
        for (const candId of candidateSheetIds) {
          sheet = await fetchDocument<any>('class_spreadsheets', candId);
          if (sheet && sheet.rows && sheet.columns) {
            break;
          }
        }

        if (!sheet) {
          const allSheets = await fetchCollection<any>('class_spreadsheets');
          sheet = allSheets.find((s: any) => {
            if (!s.rows || !s.columns) return false;
            const sId = (s.id || '').toLowerCase();
            const sTitle = (s.classTitle || s.className || s.title || '').toLowerCase();
            if (classDigits && (sId.includes(classDigits) || sTitle.includes(classDigits))) {
              return true;
            }
            if (cleanClassName && (sId.includes(cleanClassName.toLowerCase()) || sTitle.includes(cleanClassName.toLowerCase()))) {
              return true;
            }
            return false;
          });
        }
        
        if (sheet && sheet.rows && sheet.columns) {
          const normalize = (str: string) =>
            str
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, ' ')
              .trim();

          const normalizedStudentName = normalize(cleanStudentName);
          
          let targetRowIdx = sheet.rows.findIndex((r: any) => 
            normalize(r.fullName || '') === normalizedStudentName
          );
          
          if (targetRowIdx === -1) {
            targetRowIdx = sheet.rows.findIndex((r: any) => {
              const rowName = normalize(r.fullName || '');
              return rowName.includes(normalizedStudentName) || normalizedStudentName.includes(rowName);
            });
          }
          
          const extractLessonNumber = (text: string): string | null => {
            const match = text.match(/(?:bài|lesson|session|unit|l|khóa|khoa)\s*(\d+)/i);
            if (match) {
              return `L${parseInt(match[1], 10)}`;
            }
            return null;
          };
          
          const lessonLabel = extractLessonNumber(activeRunnerTest.unitName) || extractLessonNumber(activeRunnerTest.title);
          
          if (lessonLabel) {
            let targetCol = sheet.columns.find((c: any) => 
              c.lessonLabel.toUpperCase() === lessonLabel.toUpperCase() && 
              (c.subSkill.toLowerCase().includes('từ vựng') || c.subSkill.toLowerCase().includes('vocab'))
            );
            
            if (!targetCol) {
              targetCol = sheet.columns.find((c: any) => 
                c.lessonLabel.toUpperCase() === lessonLabel.toUpperCase()
              );
            }
            
            if (targetRowIdx !== -1 && targetCol) {
              const updatedRows = [...sheet.rows];
              updatedRows[targetRowIdx] = {
                ...updatedRows[targetRowIdx],
                scores: {
                  ...updatedRows[targetRowIdx].scores,
                  [targetCol.id]: String(scoreOut10)
                }
              };
              
              const updatedSheet = {
                ...sheet,
                rows: updatedRows,
                updatedAt: new Date().toISOString()
              };
              
              await saveDocument('class_spreadsheets', updatedSheet);
              console.log(`Successfully synced score for ${cleanStudentName} in ${targetCol.id} to Firestore.`);
            } else {
              console.warn(`Spreadsheet sync skipped: Row found: ${targetRowIdx !== -1}, Column found: ${!!targetCol}`);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing score to spreadsheet:', err);
      }
    };
    
    // Trigger the spreadsheet sync asynchronously
    syncToSpreadsheet();

    if (isTimeout) {
      showToast(`⏰ Hết giờ làm bài! Hệ thống đã tự động nộp bài cho học sinh ${cleanStudentName} - Lớp ${targetClassName} (${scoreOut10}/10 điểm).`);
    } else {
      showToast(`🎉 Đã nộp bài thành công! Họ tên: ${cleanStudentName} - Lớp: ${targetClassName}. Điểm từ vựng: ${scoreOut10}/10. Đã cập nhật vào buổi học & bảng điểm học viên!`);
    }
  };

  if (isStudentPortalMode && (isExited || !activeRunnerTest)) {
    const isReview = Boolean(initialReviewTestId);
    const targetTest = isReview
      ? (initialReviewTestId && reviewTests.find((t) => t.id.toLowerCase() === initialReviewTestId.toLowerCase())) ||
        reviewTests.find((t) => t.courseLevel === selectedCourseLevel) ||
        reviewTests[0]
      : (initialVocabTestId && tests.find((t) => t.id.toLowerCase() === initialVocabTestId.toLowerCase())) ||
        tests.find((t) => t.courseLevel === selectedCourseLevel) ||
        tests[0];

    return (
      <div className="max-w-md mx-auto my-3 sm:my-6 p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 text-center space-y-4 sm:space-y-5 shadow-md animate-in fade-in zoom-in-95 w-full">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-2xl sm:text-3xl mx-auto shadow-inner border-2 border-purple-200">
          🎓
        </div>
        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wider">
            IELTS DƯƠNG VŨ
          </span>
          <h2 className="text-base sm:text-xl font-black text-slate-900">
            {isExited ? 'Bạn đã hoàn tất bài kiểm tra' : 'Bài Kiểm Tra Trực Tuyến IELTS Dương Vũ'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            {isExited
              ? 'Cảm ơn bạn đã tham gia bài kiểm tra! Điểm số và thông tin làm bài đã được hệ thống lưu lại an toàn.'
              : 'Vui lòng nhấn nút bên dưới để bắt đầu làm bài kiểm tra. Hệ thống sẽ tự động tính điểm và xếp hạng ngay sau khi hoàn thành.'}
          </p>
        </div>

        {targetTest && (
          <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 text-xs font-bold text-purple-950 flex items-center justify-between gap-2">
            <span className="truncate">{targetTest.title}</span>
            <span className="px-2 py-0.5 bg-white rounded-md text-[10px] text-purple-900 border border-purple-200 font-extrabold shrink-0">
              {targetTest.courseLevel}
            </span>
          </div>
        )}

        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {targetTest && !isExited && (
            <button
              type="button"
              onClick={() => {
                setIsExited(false);
                handleStartRunner(targetTest);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Bắt đầu làm bài</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              window.close();
              showToast('👉 Bạn có thể đóng tab trình duyệt này để hoàn tất.');
            }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>✕ Đóng Tab</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* TOP MODULE TYPE TABS: VOCABULARY TESTS VS KNOWLEDGE REVIEW TESTS */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTestType('vocab')}
          className={`py-2 px-2 sm:py-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all truncate ${
            activeTestType === 'vocab'
              ? 'bg-purple-700 text-white shadow-md'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">📚 Test Từ Vựng (31 Bài)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTestType('review')}
          className={`py-2 px-2 sm:py-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all truncate ${
            activeTestType === 'review'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">🧠 Test Ôn Tập (31 Bài)</span>
        </button>
      </div>

      {/* SECTION HEADER & COURSE SWITCHER (KHÓA 1, KHÓA 2, KHÓA 3, KHÓA 4) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${activeTestType === 'review' ? 'bg-amber-600 border-amber-500' : 'bg-amber-500 border-amber-400'} text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md border-2 shrink-0`}>
              {activeTestType === 'review' ? <Award className="w-5 h-5 sm:w-6 sm:h-6" /> : <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {activeTestType === 'review' ? 'Bài Test Ôn Tập Kiến Thức' : 'Bài Test Từ Vựng Trực Tuyến'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shrink-0">
                  <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                  <span className="hidden sm:inline">Chống gian lận &amp; Bấm giờ</span>
                  <span className="sm:hidden">Chống gian lận</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {activeTestType === 'review'
                  ? '31 bài test ôn tập kiến thức cho mỗi khóa, chống gian lận & tự động lưu điểm'
                  : 'Tạo bài test theo từng buổi học, lấy link gửi học sinh & tự động xếp hạng'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingTestId(null);
              setNewTestForm({
                title: '',
                unitName: '',
                courseLevel: selectedCourseLevel,
                timePerQuestionSeconds: 20,
              });
              setCustomizedQuestions([]);
              setShowCreateModal(true);
            }}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 ${activeTestType === 'review' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-700 hover:bg-purple-800'} text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0`}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{activeTestType === 'review' ? '+ Tạo Bài Ôn Tập Mới' : '+ Tạo Bài Test Mới'}</span>
          </button>
        </div>

        {/* Course Level Switcher Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 sm:pt-2">
          {(['Khóa 1', 'Khóa 2', 'Khóa 3', 'Khóa 4'] as const).map((level) => {
            const count = activeTestsList.filter((t) => t.courseLevel === level).length;
            const isSelected = selectedCourseLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedCourseLevel(level)}
                className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-purple-900 text-white border-purple-900 shadow-md ring-2 ring-purple-500/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div>
                  <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider">{level}</div>
                  <div className={`text-[10px] sm:text-[11px] mt-0.5 font-bold ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                    {count} bài test
                  </div>
                </div>
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                    isSelected ? 'bg-amber-400 text-purple-950' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {level.replace('Khóa ', 'K')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST OF VOCAB TESTS FOR SELECTED COURSE LEVEL */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>Danh sách bài test từ vựng - {selectedCourseLevel}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDomainConfig(!showDomainConfig)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                showDomainConfig || publicBaseUrl.includes('ais-dev-')
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
              }`}
              title="Cấu hình link công khai/tên miền để học sinh làm bài không bị lỗi 403 Google"
            >
              <Globe className="w-3.5 h-3.5 text-purple-700" />
              <span>Cấu hình Link công khai</span>
              {publicBaseUrl.includes('ais-dev-') && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            <span className="text-xs font-bold text-slate-500">
              Tổng số: <strong className="text-purple-700">{filteredTests.length}</strong> bài test
            </span>
          </div>
        </div>

        {/* Expandable Domain / Public Link Config Panel */}
        {showDomainConfig && (
          <form
            onSubmit={handleSaveCustomDomain}
            className="p-4 bg-gradient-to-br from-purple-50 via-white to-amber-50 rounded-3xl border border-purple-200 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-700" />
                <h4 className="font-extrabold text-xs text-slate-900">
                  Cấu hình Tên miền / Link Share gửi Học sinh
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDomainConfig(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-0.5"
              >
                ✕ Đóng
              </button>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              💡 <strong>Khắc phục lỗi 403 Google:</strong> Trong môi trường làm việc của AI Studio (link có chứa <code>ais-dev-</code>), chỉ tài khoản của bạn mới có quyền mở. Để học sinh bấm vào làm bài bình thường không bị lỗi 403, bạn chỉ cần nhấn <strong>Share (Chia sẻ)</strong> trên AI Studio, rồi copy link công khai hoặc tên miền riêng của trung tâm dán vào ô bên dưới:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="url"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                placeholder="VD: https://ais-pre-...run.app hoặc https://ieltsduongvu.com"
                className="w-full sm:flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Lưu tên miền
                </button>
                {window.location.origin.includes('ais-dev-') && (
                  <button
                    type="button"
                    onClick={() => {
                      const preUrl = window.location.origin.replace('ais-dev-', 'ais-pre-');
                      setCustomDomainInput(preUrl);
                      setPublicBaseUrl(preUrl);
                      setLocalPublicBaseUrl(preUrl);
                      showToast('✅ Đã chuyển sang link công khai (ais-pre-)!');
                    }}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                    title="Chuyển sang link Share công khai để học sinh mở trên điện thoại"
                  >
                    Dùng ais-pre-
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetCustomDomain}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  title="Đặt lại về địa chỉ đang chạy"
                >
                  Mặc định
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-purple-100">
              <span className="font-bold text-purple-900 shrink-0">Tên miền đang áp dụng:</span>
              <code className="text-purple-700 font-mono font-bold truncate">{publicBaseUrl}</code>
            </div>
          </form>
        )}

        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Chưa có bài test từ vựng nào cho {selectedCourseLevel}. Hãy tạo bài test đầu tiên!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTests.map((test) => {
              const shareUrl = getTestShareUrl(test.id);
              const isCopied = copiedLinkId === test.id;
              const submissionCount = test.submissions.length;

              return (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3 sm:space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                          {test.courseLevel}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug mt-1">
                          {test.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{test.unitName}</p>
                      </div>
                      <span className="px-2 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[10px] sm:text-[11px] font-bold shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>{test.timePerQuestionSeconds || 20}s/câu</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] sm:text-xs font-semibold text-slate-600 bg-slate-50 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-100">
                      <div>
                        Số câu hỏi: <strong className="text-slate-900 font-bold">{test.questions.length} câu</strong>
                      </div>
                      <div>•</div>
                      <div>
                        Đã làm: <strong className="text-purple-700 font-bold">{submissionCount} lượt</strong>
                      </div>
                    </div>
                  </div>

                  {/* Quick Share Link Box */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="text-[10.5px] sm:text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Link làm bài học sinh:</span>
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md font-bold border border-emerald-200">
                        Chống gian lận
                      </span>
                    </div>

                    <div className="p-2 sm:p-2.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200/80 space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          onClick={(e) => {
                            (e.target as HTMLInputElement).select();
                            navigator.clipboard.writeText(shareUrl);
                            setCopiedLinkId(test.id);
                            showToast(`✅ Đã chọn & sao chép link: ${shareUrl}`);
                            setTimeout(() => setCopiedLinkId(null), 2500);
                          }}
                          className="w-full text-[10.5px] sm:text-[11px] font-mono bg-white text-slate-800 px-2 py-1.5 rounded-lg sm:rounded-xl border border-slate-200 truncate cursor-pointer hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                          title="Bấm vào để bôi đen và sao chép toàn bộ đường link này"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleCopyTestLink(test, 'url')}
                          className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
                          title="Sao chép đường link URL trực tiếp để gửi Zalo/Facebook"
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Đã chép link!' : 'Copy Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyTestLink(test, 'zalo')}
                          className="flex-1 py-1.5 px-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95 whitespace-nowrap"
                          title="Sao chép tin nhắn Zalo đầy đủ kèm tiêu đề bài test"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Mẫu Zalo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.open(shareUrl, '_blank')}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl transition-all shrink-0"
                          title="Mở thử link bài test trong tab mới"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Actions Grid on Mobile, Flex on Desktop */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleStartRunner(test)}
                        className="py-1.5 sm:py-2 sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Làm bài</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingTestId(test.id);
                          setNewTestForm({
                            title: test.title,
                            unitName: test.unitName,
                            courseLevel: test.courseLevel,
                            timePerQuestionSeconds: test.timePerQuestionSeconds || 20,
                          });
                          setCustomizedQuestions(test.questions || []);
                          setShowCreateModal(true);
                        }}
                        className="py-1.5 sm:py-2 px-2.5 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold text-[11px] sm:text-xs rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95"
                        title="Chỉnh sửa câu hỏi và thông tin bài test"
                      >
                        ✏️ Sửa
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveLeaderboardTest(test)}
                        className="py-1.5 sm:py-2 px-2 bg-amber-500 hover:bg-amber-600 text-purple-950 font-black text-[11px] sm:text-xs rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <Trophy className="w-3.5 h-3.5 text-purple-950" />
                        <span>BXH ({submissionCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExportZaloInitialClass(classGroup ? classGroup.name : 'all');
                          setExportZaloModalTest(test);
                        }}
                        className="py-1.5 sm:py-2 px-2 bg-purple-900 hover:bg-purple-950 text-amber-300 font-black text-[11px] sm:text-xs rounded-lg sm:rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Tạo ảnh Bảng Xếp Hạng chất lượng cao gửi Zalo cho phụ huynh"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ảnh Zalo</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: BẢNG XẾP HẠNG (LEADERBOARD) AI LÀM NHANH NHẤT & CHÍNH XÁC NHẤT */}
      {activeLeaderboardTest && (() => {
        const allSubmissions = (activeLeaderboardTest.submissions || []).filter(
          (sub) =>
            sub.studentName &&
            sub.studentName !== 'Nguyễn Văn Minh' &&
            sub.studentName !== 'Phạm Nhật Nam' &&
            !sub.studentName.toLowerCase().includes('nguyễn văn minh') &&
            !sub.studentName.toLowerCase().includes('phạm nhật nam') &&
            sub.id !== 'sub-1' &&
            sub.id !== 'sub-rev-1'
        );

        // Extract list of unique classes present in submissions
        const availableClassList: string[] = Array.from(
          new Set(
            allSubmissions
              .map((s) => (s.className || '').trim())
              .filter((c) => Boolean(c))
          )
        ) as string[];

        // Filter submissions by selected class
        const filteredLeaderboardSubmissions = allSubmissions.filter((sub) => {
          if (leaderboardClassFilter === 'all') return true;
          const subClass = (sub.className || '').trim().toLowerCase();
          const filterVal = leaderboardClassFilter.trim().toLowerCase();
          if (subClass === filterVal) return true;
          
          const subNum = subClass.match(/\d+/)?.[0];
          const filterNum = filterVal.match(/\d+/)?.[0];
          if (subNum && filterNum && subNum === filterNum) return true;
          return subClass.includes(filterVal) || filterVal.includes(subClass);
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-xl shadow-md border border-amber-300 shrink-0">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Bảng Xếp Hạng Bài Test Từ Vựng
                    </h3>
                    <p className="text-xs text-slate-500">{activeLeaderboardTest.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExportZaloInitialClass(leaderboardClassFilter);
                      setExportZaloModalTest(activeLeaderboardTest);
                    }}
                    className="px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-amber-300 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/40"
                    title="Tạo ảnh Bảng Xếp Hạng gửi Zalo Phụ Huynh"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Tạo Ảnh Gửi Zalo</span>
                    <span className="sm:hidden">Ảnh Zalo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLeaderboardTest(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Leaderboard Rules Notice */}
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-medium">
                <span>🏆 <strong>Tiêu chí xếp hạng:</strong> 1. Số câu <strong>ĐÚNG</strong> nhiều nhất ➔ 2. Thời gian <strong>NHANH NHẤT</strong>.</span>
                <span className="text-[10px] font-bold bg-amber-400 text-purple-950 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0 shadow-2xs">
                  Xếp hạng theo lớp
                </span>
              </div>

              {/* Class Filter Control Tabs / Dropdown */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-700" />
                    <span>Xếp hạng theo Số Lớp học sinh đã nhập:</span>
                  </span>
                  <span className="text-[11px] font-extrabold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200">
                    {leaderboardClassFilter === 'all'
                      ? `Tất cả các lớp (${allSubmissions.length} lượt làm)`
                      : `${leaderboardClassFilter} (${filteredLeaderboardSubmissions.length} lượt làm)`}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setLeaderboardClassFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                      leaderboardClassFilter === 'all'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌐 Tất cả các lớp ({allSubmissions.length})
                  </button>

                  {availableClassList.map((clsName) => {
                    const clsCount = allSubmissions.filter((s) => {
                      const sc = (s.className || '').toLowerCase();
                      const fc = clsName.toLowerCase();
                      const sn = sc.match(/\d+/)?.[0];
                      const fn = fc.match(/\d+/)?.[0];
                      return sc === fc || (sn && fn && sn === fn) || sc.includes(fc) || fc.includes(sc);
                    }).length;

                    const isSelected =
                      leaderboardClassFilter.toLowerCase() === clsName.toLowerCase() ||
                      (leaderboardClassFilter.match(/\d+/)?.[0] &&
                        clsName.match(/\d+/)?.[0] &&
                        leaderboardClassFilter.match(/\d+/)?.[0] === clsName.match(/\d+/)?.[0]);

                    return (
                      <button
                        key={clsName}
                        type="button"
                        onClick={() => setLeaderboardClassFilter(clsName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        🏫 Lớp {clsName} ({clsCount})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submissions List Sorted by Score desc, Time asc */}
              {filteredLeaderboardSubmissions.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                  <p>Chưa có học sinh nào thuộc {leaderboardClassFilter === 'all' ? 'bài test này' : `lớp ${leaderboardClassFilter}`} nộp bài.</p>
                  <p className="text-[11px] text-slate-400">Hãy chép link bài test gửi cho học sinh làm bài!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeaderboardSubmissions
                    .slice()
                    .sort((a, b) => {
                      if (b.correctCount !== a.correctCount) {
                        return b.correctCount - a.correctCount;
                      }
                      return a.timeSpentSeconds - b.timeSpentSeconds;
                    })
                    .map((sub, rankIdx) => {
                      let rankBadge = `${rankIdx + 1}`;
                      let rowBg = 'bg-white border-slate-200';
                      if (rankIdx === 0) {
                        rankBadge = '🥇 TOP 1';
                        rowBg = 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30';
                      } else if (rankIdx === 1) {
                        rankBadge = '🥈 TOP 2';
                        rowBg = 'bg-slate-100 border-slate-300';
                      } else if (rankIdx === 2) {
                        rankBadge = '🥉 TOP 3';
                        rowBg = 'bg-orange-50 border-orange-200';
                      }

                      return (
                        <div
                          key={sub.id}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${rowBg}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1.5 rounded-xl font-black text-xs shrink-0 ${
                                rankIdx === 0
                                  ? 'bg-amber-500 text-purple-950 shadow-xs'
                                  : rankIdx === 1
                                  ? 'bg-slate-300 text-slate-900'
                                  : rankIdx === 2
                                  ? 'bg-orange-300 text-orange-950'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {rankBadge}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-slate-900 text-sm">{sub.studentName}</h4>
                                {sub.className && (
                                  <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                    Lớp: {sub.className}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {sub.studentPhone ? `SĐT: ${sub.studentPhone} • ` : ''}Nộp bài: {sub.submittedAt}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <div className="font-black text-purple-900 text-sm">
                              {sub.correctCount} / {sub.totalQuestions} câu ({sub.score}/10đ)
                            </div>
                            <div className="text-[11px] font-bold text-slate-600 flex items-center justify-end gap-2">
                              <span>⏱️ {sub.timeSpentSeconds} giây</span>
                              {sub.tabSwitchViolations > 0 ? (
                                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 font-bold">
                                  ⚠️ Thoát {sub.tabSwitchViolations} lần
                                </span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 font-bold">
                                  ✅ Trung thực
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setExportZaloInitialClass(leaderboardClassFilter);
                    setExportZaloModalTest(activeLeaderboardTest);
                  }}
                  className="px-4 py-2.5 bg-purple-900 hover:bg-purple-950 text-amber-300 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer border border-amber-400/40 active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 text-amber-300" />
                  <span>📸 Tạo Ảnh Gửi Zalo Phụ Huynh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLeaderboardTest(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Đóng Bảng Xếp Hạng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: TẠO BÀI TEST TỪ VỰNG MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTest}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-700" />
                <span>{editingTestId ? 'Chỉnh Sửa Bài Test Từ Vựng' : 'Tạo Bài Test Từ Vựng Mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <label className="text-slate-700 block mb-1">Dành cho Khóa học:</label>
                <select
                  value={newTestForm.courseLevel}
                  onChange={(e) =>
                    setNewTestForm({
                      ...newTestForm,
                      courseLevel: e.target.value as 'Khóa 1' | 'Khóa 2' | 'Khóa 3' | 'Khóa 4',
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="Khóa 1">Khóa 1</option>
                  <option value="Khóa 2">Khóa 2</option>
                  <option value="Khóa 3">Khóa 3</option>
                  <option value="Khóa 4">Khóa 4</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1">Thời gian mỗi câu (giây):</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={newTestForm.timePerQuestionSeconds}
                  onChange={(e) =>
                    setNewTestForm({ ...newTestForm, timePerQuestionSeconds: parseInt(e.target.value, 10) || 20 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-700 block mb-1">Tiêu đề bài test:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Test Từ Vựng Bài 1 - Khóa 1"
                  value={newTestForm.title}
                  onChange={(e) => setNewTestForm({ ...newTestForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-700 block mb-1">Mã/Tên bài (Tùy chọn):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 1"
                  value={newTestForm.unitName}
                  onChange={(e) => setNewTestForm({ ...newTestForm, unitName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>

              {/* Quick Auto-Generator by Pasting Vocab & Defining Question Type Counts */}
              <div className="sm:col-span-2 bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 p-3 sm:p-3.5 rounded-2xl border border-purple-200/90 space-y-2.5 shadow-2xs">
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowAutoGenerator(!showAutoGenerator)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-700 text-amber-300 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                        <span>Tự Động Tạo Bộ Câu Hỏi (Paste Từ Vựng &amp; Chọn Loại)</span>
                        <span className="px-2 py-0.2 rounded-full bg-amber-400 text-purple-950 text-[9px] font-black uppercase shadow-2xs">
                          Nhanh 5s
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Paste danh sách từ vựng ➔ Chọn số lượng Trắc nghiệm, Nối từ, Điền từ ➔ Bấm Generate!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-purple-700 bg-white/80 hover:bg-white px-2 py-1 rounded-lg border border-purple-200 shadow-2xs shrink-0"
                  >
                    {showAutoGenerator ? 'Thu gọn ▲' : 'Mở công cụ ▼'}
                  </button>
                </div>

                {showAutoGenerator && (
                  <div className="space-y-2.5 pt-1.5 border-t border-purple-200/60 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>✍️ Dán từ vựng kèm nghĩa (mỗi từ 1 dòng, VD: <code>Punctual: Đúng giờ</code>):</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoVocabText(
                              `Punctual: Đúng giờ, không bao giờ trễ hẹn\nAccomplish: Hoàn thành, đạt được mục tiêu\nPersevere: Kiên trì, nhẫn nại vượt khó\nDiligent: Chăm chỉ, siêng năng\nMeticulous: Tỉ mỉ, cẩn thận từng chi tiết\nResilient: Kiên cường, phục hồi nhanh\nEloquence: Khả năng hùng biện, lưu loát\nEvaluate: Đánh giá, phân tích\nObstacle: Trở ngại, chướng ngại vật\nCollaborate: Hợp tác, phối hợp`
                            );
                            showToast('💡 Đã nạp danh sách từ vựng mẫu!');
                          }}
                          className="text-[10px] text-purple-700 hover:text-purple-900 font-bold underline"
                        >
                          Nạp mẫu từ vựng
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={autoVocabText}
                        onChange={(e) => setAutoVocabText(e.target.value)}
                        placeholder={`Dán danh sách từ vựng tại đây, ví dụ:\nPunctual: Đúng giờ\nAccomplish - Hoàn thành, đạt được\nPersevere = Kiên trì, nhẫn nại\nDiligent: Chăm chỉ, siêng năng`}
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500/20 outline-none"
                      />
                    </div>

                    {/* Question Type Counts Inputs */}
                    <div className="grid grid-cols-3 gap-2 bg-white/90 p-2 rounded-xl border border-purple-100 text-center">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                          🎯 Trắc nghiệm (10s):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={autoMcCount}
                          onChange={(e) => setAutoMcCount(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-extrabold text-purple-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                          🧩 Nối từ (20s):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={autoMatchingCount}
                          onChange={(e) => setAutoMatchingCount(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-extrabold text-amber-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                          ⌨️ Điền từ (20s):
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={autoTypeInputCount}
                          onChange={(e) => setAutoTypeInputCount(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-extrabold text-emerald-900"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateFromVocabText}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-amber-600 hover:from-purple-800 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <span>⚡ Generate Bộ Câu Hỏi ({autoMcCount + autoMatchingCount + autoTypeInputCount} câu)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Question Builder UI */}
              <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-purple-950 font-black text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>Danh sách câu hỏi & Đáp án ({customizedQuestions.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomizedQuestions([
                        ...customizedQuestions,
                        {
                          id: `q-${Date.now()}-${customizedQuestions.length}`,
                          word: '',
                          meaning: '',
                          options: ['', '', '', ''],
                          correctOptionIndex: 0,
                          questionType: 'multiple_choice',
                          timeLimitSeconds: 10,
                        }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {customizedQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs relative group">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-950 font-black text-[10px] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <select
                            value={q.questionType || 'multiple_choice'}
                            onChange={(e) => {
                              const newType = e.target.value as 'multiple_choice' | 'matching' | 'type_input';
                              const newLimit = newType === 'multiple_choice' ? 10 : 20;
                              const updated = [...customizedQuestions];
                              updated[idx] = {
                                ...q,
                                questionType: newType,
                                timeLimitSeconds: newLimit,
                              };
                              setCustomizedQuestions(updated);
                            }}
                            className="bg-purple-50 border border-purple-200 text-purple-900 rounded-lg py-1 px-2 font-bold text-[10px] outline-none cursor-pointer"
                          >
                            <option value="multiple_choice">🎯 Trắc nghiệm (10s)</option>
                            <option value="matching">🧩 Ghép nối từ & nghĩa (20s)</option>
                            <option value="type_input">⌨️ Nhập đáp án / Sửa lỗi sai / Điền từ (20s)</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = customizedQuestions.filter((_, i) => i !== idx);
                            setCustomizedQuestions(updated);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 text-xs font-bold rounded-lg hover:bg-red-50 transition-all"
                          title="Xóa câu hỏi này"
                        >
                          🗑️ Xóa
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block mb-0.5 font-bold">
                            Câu hỏi / Từ vựng / Đề bài (Tiếng Anh hoặc Tiếng Việt):
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="VD: Punctual hoặc She don't like milk. (Sửa lỗi sai) hoặc Đất nước"
                            value={q.word}
                            onChange={(e) => {
                              const updated = [...customizedQuestions];
                              updated[idx] = { ...q, word: e.target.value };
                              setCustomizedQuestions(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-600 block mb-0.5 font-bold">
                            Đáp án đúng (Tiếng Việt hoặc Tiếng Anh - Ngăn cách / hoặc ,):
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="VD: Đúng giờ / Chuẩn giờ hoặc doesn't / does not hoặc Country / Nation"
                            value={q.meaning}
                            onChange={(e) => {
                              const updated = [...customizedQuestions];
                              updated[idx] = { ...q, meaning: e.target.value };
                              setCustomizedQuestions(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                          />
                        </div>
                      </div>

                      {q.questionType !== 'type_input' && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] text-slate-600 block font-bold">
                            4 Đáp án lựa chọn & Chọn đáp án đúng (tích vào nút tròn):
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[0, 1, 2, 3].map((optIdx) => (
                              <div key={optIdx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                                <input
                                  type="radio"
                                  name={`correct-${idx}`}
                                  checked={q.correctOptionIndex === optIdx}
                                  onChange={() => {
                                    const updated = [...customizedQuestions];
                                    updated[idx] = { ...q, correctOptionIndex: optIdx };
                                    setCustomizedQuestions(updated);
                                  }}
                                  className="accent-purple-600 cursor-pointer"
                                  title="Chọn là đáp án đúng"
                                />
                                <input
                                  type="text"
                                  required
                                  placeholder={`Đáp án ${optIdx + 1}`}
                                  value={q.options[optIdx] || ''}
                                  onChange={(e) => {
                                    const updatedOpts = [...(q.options || ['', '', '', ''])];
                                    updatedOpts[optIdx] = e.target.value;
                                    const updated = [...customizedQuestions];
                                    updated[idx] = { ...q, options: updatedOpts };
                                    setCustomizedQuestions(updated);
                                  }}
                                  className="w-full bg-transparent border-none text-xs font-medium outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.questionType === 'type_input' && (
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2 font-medium leading-relaxed">
                          💡 <strong>Dạng nhập đáp án / Điền từ / Sửa lỗi sai:</strong> Cho phép nhập 2 hoặc nhiều phương án đúng ở ô "Đáp án đúng" (ngăn cách bởi dấu <code>/</code> hoặc <code>,</code> ví dụ: <em>"doesn't / does not"</em> hoặc <em>"đúng giờ / chuẩn giờ"</em>). Học sinh nhập 1 trong các phương án đó đều được tính <strong>100% full điểm</strong>!
                        </div>
                      )}
                    </div>
                  ))}

                  {customizedQuestions.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      Chưa có câu hỏi nào. Nhấn nút "Thêm câu hỏi" ở góc trên để bắt đầu tạo câu hỏi.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {editingTestId ? 'Cập Nhật Bài Test' : 'Tạo Bài Test'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: RUNNER BÀI TEST TỪ VỰNG CHỐNG GIAN LẬN & BẤM GIỜ CHO HỌC SINH */}
      {activeRunnerTest && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-md flex flex-col justify-center items-center p-2 sm:p-4 overflow-y-auto overscroll-contain w-full min-h-screen">
          <div
            className={`bg-white rounded-2xl sm:rounded-3xl ${
              testCompletedSubmission ? 'max-w-lg' : 'max-w-md'
            } w-full p-3 sm:p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-2.5 sm:space-y-3.5 relative my-auto max-h-[96dvh] sm:max-h-[92vh] flex flex-col overflow-hidden`}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                if (runnerStarted && !testCompletedSubmission) {
                  if (window.confirm('Bạn có chắc chắn muốn thoát bài kiểm tra? Bài làm chưa nộp sẽ không được tính điểm.')) {
                    if (activeRunnerTest) {
                      try { sessionStorage.removeItem(`idv_active_test_${activeRunnerTest.id}`); } catch (e) {}
                    }
                    setTestCompletedSubmission(null);
                    setRunnerStarted(false);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setTypedAnswers({});
                    typedAnswersRef.current = {};
                    selectedAnswersRef.current = {};
                    setTabSwitchCount(0);
                    tabSwitchCountRef.current = 0;
                    isSubmittingRef.current = false;
                    setWasTimeoutAutoSubmit(false);
                    setIsExited(true);
                    setActiveRunnerTest(null);
                  }
                } else {
                  if (activeRunnerTest) {
                    try { sessionStorage.removeItem(`idv_active_test_${activeRunnerTest.id}`); } catch (e) {}
                  }
                  setTestCompletedSubmission(null);
                  setRunnerStarted(false);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                  setTypedAnswers({});
                  typedAnswersRef.current = {};
                  selectedAnswersRef.current = {};
                  setTabSwitchCount(0);
                  tabSwitchCountRef.current = 0;
                  isSubmittingRef.current = false;
                  setWasTimeoutAutoSubmit(false);
                  setIsExited(true);
                  setActiveRunnerTest(null);
                }
              }}
              className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200 cursor-pointer z-20 text-xs shadow-xs"
              title="Thoát bài kiểm tra"
            >
              ✕
            </button>

            {/* STEP A: STUDENT ENTER INFO */}
            {!runnerStarted && !testCompletedSubmission && (
              <form onSubmit={handleConfirmStudentInfo} className="space-y-2.5 sm:space-y-3.5 overflow-y-auto pr-0.5 flex-1">
                <div className="text-center space-y-1 pt-1 pr-6 sm:pr-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wide">
                    {activeRunnerTest.courseLevel} • {activeTestType === 'review' ? 'BÀI ÔN TẬP KIẾN THỨC' : 'BÀI KIỂM TRA TỪ VỰNG'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">{activeRunnerTest.title}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">{activeRunnerTest.unitName}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-2 sm:p-2.5 rounded-xl text-[10px] sm:text-xs text-amber-950 space-y-1 font-medium">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Quy định làm bài &amp; Chống gian lận:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-0.5 text-[10px] sm:text-[11px]">
                    <li>Mỗi câu có <strong>{activeRunnerTest.timePerQuestionSeconds || 20} giây</strong>. Hết giờ tự động chuyển câu!</li>
                    <li><strong>CHỐNG GIAN LẬN:</strong> Không chuyển tab/ứng dụng khi làm bài.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10.5px] sm:text-xs font-bold text-slate-700 block mb-0.5">Họ và Tên Học Sinh (*):</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Hoàng Nam"
                      value={runnerStudentName}
                      onChange={(e) => setRunnerStudentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] sm:text-xs font-bold text-slate-700 block mb-0.5">Số lớp (*):</label>
                    <input
                      type="text"
                      required
                      list="class-suggestions-list"
                      placeholder="Ví dụ: 88, 89"
                      value={runnerClassName}
                      onChange={(e) => setRunnerClassName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                    />
                    <datalist id="class-suggestions-list">
                      {classes.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                      {classGroup && <option value={classGroup.name} />}
                    </datalist>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">
                      Nhập số lớp để tự động đồng bộ kết quả vào điểm danh buổi học.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>BẮT ĐẦU LÀM BÀI</span>
                </button>
              </form>
            )}

            {/* STEP B: ACTIVE QUESTION RUNNER */}
            {runnerStarted && !testCompletedSubmission && (
              <div className="space-y-2.5 sm:space-y-3 relative flex-1 flex flex-col justify-between overflow-y-auto pr-0.5">
                <div className="space-y-2">
                  {/* Anti-cheat Alert Banner */}
                  {tabSwitchCount > 0 && (
                    <div className="bg-rose-50 border-2 border-rose-500 p-1.5 sm:p-2 rounded-xl text-rose-900 text-[10px] sm:text-xs font-bold flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">⚠️ ĐÃ GHI NHẬN: Rời màn hình ({tabSwitchCount} lần)!</span>
                      </span>
                    </div>
                  )}

                  {/* Progress & Question Timer Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] sm:text-xs font-extrabold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span>
                          Câu {currentQuestionIndex + 1} / {activeRunnerTest.questions.length}
                        </span>
                        {tabSwitchCount === 0 ? (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Trung thực</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 border border-rose-300 text-[9px] font-black rounded-full flex items-center gap-0.5 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            <span>Thoát: {tabSwitchCount}l</span>
                          </span>
                        )}
                      </div>
                      <span className="text-amber-700 font-mono flex items-center gap-1 text-xs font-black">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                        <span>{questionTimeLeft}s</span>
                      </span>
                    </div>

                    {/* Countdown Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-1000"
                        style={{
                          width: `${(questionTimeLeft / getQuestionTimeLimit(activeRunnerTest.questions[currentQuestionIndex])) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Conditional Question Styles based on questionType */}
                  {(() => {
                    const currentQ = activeRunnerTest.questions[currentQuestionIndex];
                    if (!currentQ) return null;
                    const qType = currentQ.questionType || 'multiple_choice';

                    if (qType === 'matching') {
                      const isSelected = selectedAnswers[currentQuestionIndex] !== undefined;
                      return (
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[8.5px] sm:text-[9px] font-black rounded-full uppercase tracking-widest border border-amber-300">
                              🧩 NỐI TỪ (MATCHING) - 20 Giây
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            {/* Target Word Card */}
                            <div className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-center shadow-2xs">
                              <span className="text-[8px] sm:text-[8.5px] font-black text-purple-600 uppercase tracking-widest">Từ vựng cần ghép</span>
                              <h3 className="text-sm sm:text-base font-black text-purple-950 mt-0.5 break-words leading-tight">{currentQ.word}</h3>
                              {currentQ.phonetic && (
                                <p className="text-[9.5px] sm:text-[10px] font-mono text-purple-600 mt-0.5 bg-purple-100/70 px-1.5 py-0.2 rounded-full">{currentQ.phonetic}</p>
                              )}
                            </div>

                            {/* Options List */}
                            <div className="space-y-1">
                              <span className="text-[8.5px] sm:text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Chọn nghĩa đúng:</span>
                              <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
                                {currentQ.options.map((optionText, optIdx) => {
                                  const isMatched = selectedAnswers[currentQuestionIndex] === optIdx;
                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => handleSelectAnswer(currentQuestionIndex, optIdx)}
                                      className={`p-2 sm:p-2.5 rounded-xl border text-left text-[11px] sm:text-xs font-bold transition-all flex items-center justify-between cursor-pointer leading-tight ${
                                        isMatched
                                          ? 'bg-amber-400 text-purple-950 border-amber-300 shadow-2xs ring-2 ring-amber-300 scale-[1.005]'
                                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[9px] text-slate-500 shrink-0">
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="truncate">{optionText}</span>
                                      </span>
                                      {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-purple-950 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-[9.5px] sm:text-[10px] p-1.5 rounded-xl text-center flex items-center justify-center gap-1 animate-in fade-in truncate">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">Đã chọn: <strong className="text-purple-950">{currentQ.word}</strong> ⟷ <strong className="text-purple-950">{currentQ.options[selectedAnswers[currentQuestionIndex]]}</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (qType === 'type_input') {
                      return (
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-900 text-[8.5px] sm:text-[9px] font-black rounded-full uppercase tracking-widest border border-purple-300">
                              ⌨️ NHẬP ĐÁP ÁN / ĐIỀN TỪ / SỬA LỖI
                            </span>
                          </div>

                          <div className="bg-purple-900 text-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl space-y-0.5 text-center shadow-xs">
                            <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-amber-300 tracking-wider">Đề bài:</span>
                            <h2 className="text-xs sm:text-base font-black tracking-wide text-white leading-snug break-words">
                              {currentQ.word}
                            </h2>
                            {currentQ.phonetic && (
                              <p className="text-[9.5px] sm:text-[11px] text-purple-200 font-mono">
                                {currentQ.phonetic}
                              </p>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-xl p-2 sm:p-2.5 border border-slate-200 space-y-1">
                            <label className="text-[10px] sm:text-xs font-black text-slate-700 block text-center">
                              ✍️ Nhập đáp án của bạn:
                            </label>
                            <input
                              type="text"
                              autoFocus
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck="false"
                              placeholder="Nhập câu trả lời tại đây..."
                              className="w-full p-2 sm:p-2.5 rounded-xl border-2 border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 font-extrabold text-center text-xs sm:text-sm outline-none transition-all bg-white"
                              value={typedAnswers[currentQuestionIndex] !== undefined ? typedAnswers[currentQuestionIndex] : (typedAnswersRef.current[currentQuestionIndex] || '')}
                              onChange={(e) => {
                                handleTypeAnswerChange(currentQuestionIndex, e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleNextQuestion();
                                }
                              }}
                            />
                            <p className="text-[8.5px] sm:text-[9px] text-slate-400 text-center font-medium">
                              Nhấn <kbd className="bg-slate-200 px-1 py-0.2 rounded border border-slate-300 text-[8px] font-mono">Enter</kbd> hoặc nút "Tiếp theo" để nộp câu này.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Default / Multiple Choice
                    return (
                      <div className="space-y-2">
                        <div className="text-center">
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-900 text-[8.5px] sm:text-[9px] font-black rounded-full uppercase tracking-widest border border-sky-300">
                            🎯 TRẮC NGHIỆM - 10 Giây
                          </span>
                        </div>

                        <div className="bg-purple-900 text-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl space-y-0.5 text-center shadow-xs">
                          <span className="text-[8.5px] sm:text-[9px] font-black uppercase text-amber-300 tracking-wider">Câu hỏi / Đề bài:</span>
                          <h2 className="text-xs sm:text-base font-black tracking-wide text-white leading-snug break-words">
                            {currentQ.word}
                          </h2>
                          {currentQ.phonetic && (
                            <p className="text-[9.5px] sm:text-[11px] text-purple-200 font-mono">
                              {currentQ.phonetic}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
                          {currentQ.options.map((optionText, optIdx) => {
                            const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectAnswer(currentQuestionIndex, optIdx)}
                                className={`p-2 sm:p-2.5 rounded-xl border text-left text-[11px] sm:text-xs font-bold transition-all flex items-center justify-between cursor-pointer leading-tight ${
                                  isSelected
                                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs ring-2 ring-purple-400'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                <span className="break-words pr-1 flex items-center gap-1.5">
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] shrink-0 ${isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-200 text-slate-600'}`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{optionText}</span>
                                </span>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] sm:max-w-none">
                    HS: <strong className="text-slate-700">{runnerStudentName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNextQuestion(false)}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 transition-all"
                  >
                    <span>
                      {currentQuestionIndex < activeRunnerTest.questions.length - 1 ? 'Tiếp theo ➔' : 'Nộp bài 🏁'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP C: RESULT, REVIEW ANSWERS & LEADERBOARD VIEW UPON COMPLETION */}
            {testCompletedSubmission && (
              <div className="space-y-2.5 sm:space-y-3.5 overflow-y-auto pr-0.5 flex-1">
                {/* Header Announcement */}
                <div className="text-center space-y-0.5 pt-1 pr-6 sm:pr-0">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center font-black text-lg sm:text-2xl mx-auto shadow-md border-2 border-amber-300">
                    {wasTimeoutAutoSubmit ? '⏰' : '🎉'}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase leading-snug">
                      {wasTimeoutAutoSubmit
                        ? 'Hết giờ làm bài - Đã tự động nộp bài!'
                        : activeTestType === 'review'
                        ? 'Hoàn thành bài ôn tập kiến thức!'
                        : 'Hoàn thành bài test từ vựng!'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      Học viên: <strong className="text-purple-900">{testCompletedSubmission.studentName}</strong> • Lớp:{' '}
                      <strong className="text-purple-900">{testCompletedSubmission.className || 'IELTS Dương Vũ'}</strong>
                    </p>
                  </div>
                </div>

                {/* Score and Stats Cards */}
                <div className="bg-slate-50 rounded-xl p-1.5 sm:p-2 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  <div className="bg-white p-1.5 rounded-lg border border-purple-100 shadow-2xs">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Điểm:</span>
                    <span className="text-sm sm:text-lg font-black text-purple-900">{testCompletedSubmission.score}/10</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Câu đúng:</span>
                    <span className="text-sm sm:text-lg font-black text-emerald-600">
                      {testCompletedSubmission.correctCount}/{testCompletedSubmission.totalQuestions}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-amber-100 shadow-2xs">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Thời gian:</span>
                    <span className="text-sm sm:text-lg font-black text-amber-700">{testCompletedSubmission.timeSpentSeconds}s</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Rời tab:</span>
                    <span
                      className={`text-sm sm:text-lg font-black ${
                        testCompletedSubmission.tabSwitchViolations > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {testCompletedSubmission.tabSwitchViolations > 0 ? `${testCompletedSubmission.tabSwitchViolations} lần` : '0 lần'}
                    </span>
                  </div>
                </div>

                {testCompletedSubmission.tabSwitchViolations > 0 && (
                  <div className="text-[9.5px] sm:text-[10.5px] font-bold text-rose-900 bg-rose-50 p-1.5 rounded-xl border border-rose-200 text-center">
                    ⚠️ Hệ thống đã ghi nhận <strong>{testCompletedSubmission.tabSwitchViolations} lần</strong> rời màn hình làm bài.
                  </div>
                )}

                {/* Tab Switcher: Xem Đáp Án Đúng & Xem Bảng Xếp Hạng */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setResultActiveTab('answers')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
                      resultActiveTab === 'answers'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Đáp Án ({testCompletedSubmission.correctCount}/{testCompletedSubmission.totalQuestions})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultActiveTab('leaderboard')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
                      resultActiveTab === 'leaderboard'
                        ? 'bg-amber-500 text-purple-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-purple-950 shrink-0" />
                    <span className="truncate">Bảng Xếp Hạng</span>
                  </button>
                </div>

                {/* TAB 1: REVIEW OF CORRECT ANSWERS */}
                {resultActiveTab === 'answers' && (
                  <div className="space-y-2 pt-0.5 text-left">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] sm:text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        Đối chiếu chi tiết đáp án:
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">
                        {activeRunnerTest.questions.length} câu
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[36vh] sm:max-h-[44vh] overflow-y-auto pr-0.5">
                      {activeRunnerTest.questions.map((q, idx) => {
                        let isCorrect = false;
                        let isAnswered = false;
                        const currentSelected = { ...selectedAnswers, ...selectedAnswersRef.current };
                        const currentTyped = { ...typedAnswers, ...typedAnswersRef.current };
                        const studentChoice = currentSelected[idx];
                        const studentTyped = (currentTyped[idx] !== undefined ? currentTyped[idx] : '').trim();

                        if (q.questionType === 'type_input') {
                          isAnswered = studentTyped.length > 0;
                          isCorrect = checkIsTypeInputCorrect(studentTyped, q);
                        } else {
                          isAnswered = studentChoice !== undefined;
                          isCorrect = isAnswered && studentChoice === q.correctOptionIndex;
                        }

                        return (
                          <div
                            key={q.id || idx}
                            className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : 'bg-rose-50/40 border-rose-300'
                            }`}
                          >
                            {/* Question Header Status */}
                            <div className="flex items-center justify-between gap-1.5 border-b border-slate-200/60 pb-1 mb-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-4 h-4 rounded-full font-black text-[9px] flex items-center justify-center text-white ${
                                    isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <span className="text-[10px] sm:text-[10.5px] font-black text-slate-800">
                                  Câu {idx + 1}
                                </span>
                                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                                  {q.questionType === 'type_input'
                                    ? '⌨️ Điền từ'
                                    : q.questionType === 'matching'
                                    ? '🧩 Nối từ'
                                    : '🎯 Trắc nghiệm'}
                                </span>
                              </div>

                              <div>
                                {isCorrect ? (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black text-[8.5px] flex items-center gap-0.5 border border-emerald-300">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" /> Đúng (+1đ)
                                  </span>
                                ) : isAnswered ? (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-black text-[8.5px] flex items-center gap-0.5 border border-rose-300">
                                    <XCircle className="w-2.5 h-2.5 text-rose-600" /> Chưa đúng (0đ)
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-black text-[8.5px] flex items-center gap-0.5 border border-amber-300">
                                    <Clock className="w-2.5 h-2.5 text-amber-600" /> Chưa làm
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Question Target Word & Meaning */}
                            <div className="mb-1 space-y-0.5">
                              <div className="text-xs sm:text-sm font-black text-purple-950 break-words">{q.word}</div>
                              {q.phonetic && (
                                <div className="text-[9px] font-bold text-slate-500 font-mono">{q.phonetic}</div>
                              )}
                              <div className="text-[10px] sm:text-[10.5px] text-slate-600">
                                <span className="font-semibold text-slate-500">Đáp án:</span>{' '}
                                <strong className="text-emerald-800 font-bold">{q.meaning}</strong>
                              </div>
                            </div>

                            {/* Options Breakdown for Multiple Choice & Matching */}
                            {q.questionType !== 'type_input' ? (
                              <div className="space-y-1 pt-0.5">
                                <div className="grid grid-cols-1 gap-1">
                                  {q.options.map((opt, optIdx) => {
                                    const isCorrectOpt = optIdx === q.correctOptionIndex;
                                    const isUserPicked = studentChoice === optIdx;

                                    let cardStyle = 'bg-white border-slate-200 text-slate-700 opacity-75';
                                    let badgeText = null;

                                    if (isUserPicked && isCorrectOpt) {
                                      cardStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black shadow-2xs ring-1 ring-emerald-400';
                                      badgeText = (
                                        <span className="text-[8px] text-emerald-800 font-black flex items-center gap-0.5 shrink-0">
                                          <Check className="w-2.5 h-2.5 text-emerald-600" /> Đã chọn
                                        </span>
                                      );
                                    } else if (isUserPicked && !isCorrectOpt) {
                                      cardStyle = 'bg-rose-100/80 border-rose-400 text-rose-950 font-bold ring-1 ring-rose-400';
                                      badgeText = (
                                        <span className="text-[8px] text-rose-700 font-bold flex items-center gap-0.5 shrink-0">
                                          <XCircle className="w-2.5 h-2.5 text-rose-600" /> Đã chọn
                                        </span>
                                      );
                                    } else if (isCorrectOpt) {
                                      cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                                      badgeText = (
                                        <span className="text-[8px] text-emerald-800 font-bold flex items-center gap-0.5 shrink-0">
                                          <Check className="w-2.5 h-2.5 text-emerald-600" /> Đúng
                                        </span>
                                      );
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-1.5 rounded-lg border text-[10px] sm:text-[10.5px] flex items-center justify-between gap-1.5 ${cardStyle}`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="w-3.5 h-3.5 rounded bg-black/5 flex items-center justify-center text-[8px] font-bold shrink-0">
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span className="truncate">{opt}</span>
                                        </div>
                                        {badgeText}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              /* Type Input Breakdown */
                              <div className="space-y-1 pt-0.5">
                                <div className="p-1.5 rounded-lg border border-slate-200 bg-white text-[10.5px] space-y-0.5">
                                  <div className="text-[9px] text-slate-500 font-bold">Câu trả lời bạn đã nhập:</div>
                                  <div
                                    className={`font-black break-words ${
                                      isCorrect ? 'text-emerald-700' : studentTyped ? 'text-rose-700' : 'text-slate-400 italic'
                                    }`}
                                  >
                                    {studentTyped ? `"${studentTyped}"` : '(Chưa nhập đáp án)'}
                                  </div>
                                </div>

                                <div className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-[10.5px] space-y-0.5">
                                  <div className="text-[9px] text-emerald-700 font-bold">Đáp án đúng:</div>
                                  <div className="font-black text-emerald-950">"{q.meaning}"</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: EMBEDDED LEADERBOARD (LỚP CỦA CHÍNH HỌC SINH) */}
                {resultActiveTab === 'leaderboard' && (() => {
                  const studentClass = (testCompletedSubmission?.className || runnerClassName || '').trim();
                  const studentClassNum = studentClass.match(/\d+/)?.[0];

                  const isSameClass = (subClassName?: string) => {
                    if (!subClassName) return !studentClass;
                    const sClass = subClassName.trim().toLowerCase();
                    const myClass = studentClass.toLowerCase();
                    if (sClass === myClass) return true;
                    const sNum = sClass.match(/\d+/)?.[0];
                    if (studentClassNum && sNum && studentClassNum === sNum) return true;
                    return sClass.includes(myClass) || myClass.includes(sClass);
                  };

                  // Deduplicate by ID
                  const subMap = new Map<string, VocabTestSubmission>();
                  (activeRunnerTest.submissions || []).forEach((s) => subMap.set(s.id, s));
                  if (testCompletedSubmission) subMap.set(testCompletedSubmission.id, testCompletedSubmission);

                  let subList = Array.from(subMap.values()).filter(
                    (s) =>
                      s.studentName &&
                      s.studentName !== 'Nguyễn Văn Minh' &&
                      s.studentName !== 'Phạm Nhật Nam' &&
                      !s.studentName.toLowerCase().includes('nguyễn văn minh') &&
                      !s.studentName.toLowerCase().includes('phạm nhật nam') &&
                      s.id !== 'sub-1' &&
                      s.id !== 'sub-rev-1' &&
                      isSameClass(s.className)
                  );

                  subList.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
                    return a.timeSpentSeconds - b.timeSpentSeconds;
                  });

                  return (
                    <div className="space-y-2 pt-0.5 text-left">
                      <div className="flex items-center justify-between gap-2 px-1">
                        <span className="text-[10.5px] sm:text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Bảng xếp hạng: <strong className="text-purple-950 font-black">Lớp {studentClass || 'Chung'}</strong>
                        </span>
                        <span className="text-[9.5px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                          {subList.length} học sinh
                        </span>
                      </div>

                      {subList.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 font-bold text-xs bg-slate-50 rounded-xl border border-slate-200">
                          Chưa có học sinh nào khác trong lớp {studentClass || ''} nộp bài.
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-[36vh] sm:max-h-[44vh] overflow-y-auto pr-0.5">
                          {subList.map((sub, rankIdx) => {
                            const isCurrentStudent = sub.id === testCompletedSubmission.id;

                            let medalBadge = (
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-black text-[10px] flex items-center justify-center shrink-0">
                                #{rankIdx + 1}
                              </span>
                            );

                            if (rankIdx === 0) {
                              medalBadge = (
                                <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                                  🥇
                                </span>
                              );
                            } else if (rankIdx === 1) {
                              medalBadge = (
                                <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                                  🥈
                                </span>
                              );
                            } else if (rankIdx === 2) {
                              medalBadge = (
                                <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs shrink-0">
                                  🥉
                                </span>
                              );
                            }

                            return (
                              <div
                                key={sub.id || rankIdx}
                                className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                  isCurrentStudent
                                    ? 'bg-purple-50/90 border-purple-400 shadow-xs ring-1 ring-purple-300'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {medalBadge}
                                  <div className="truncate">
                                    <div className="font-black text-slate-900 text-[11px] sm:text-xs flex items-center gap-1 truncate">
                                      <span className="truncate">{sub.studentName}</span>
                                      {isCurrentStudent && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-purple-700 text-amber-300 text-[8.5px] font-black shrink-0">
                                          ⭐ Bạn
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[8.5px] text-slate-500 font-bold flex items-center gap-1.5">
                                      <span>⏱️ {sub.timeSpentSeconds}s</span>
                                      {sub.tabSwitchViolations > 0 && (
                                        <span className="text-rose-600">⚠️ Thoát {sub.tabSwitchViolations}l</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-black text-purple-900 text-xs sm:text-sm">
                                    {sub.score}/10đ
                                  </div>
                                  <div className="text-[8.5px] font-bold text-emerald-700">
                                    {sub.correctCount}/{sub.totalQuestions} đúng
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Footer Action Buttons */}
                <div className="pt-1.5 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeRunnerTest) {
                        try { sessionStorage.removeItem(`idv_active_test_${activeRunnerTest.id}`); } catch (e) {}
                      }
                      setTestCompletedSubmission(null);
                      setRunnerStarted(false);
                      setCurrentQuestionIndex(0);
                      setSelectedAnswers({});
                      setTypedAnswers({});
                      typedAnswersRef.current = {};
                      selectedAnswersRef.current = {};
                      setTabSwitchCount(0);
                      tabSwitchCountRef.current = 0;
                      isSubmittingRef.current = false;
                      setWasTimeoutAutoSubmit(false);
                      setIsExited(true);
                      setActiveRunnerTest(null);
                    }}
                    className="w-full py-2.5 sm:py-3 bg-purple-900 hover:bg-purple-950 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <span>✕ Thoát Bài Kiểm Tra & Kết Thúc</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANTI-CHEAT FULL WARNING POPUP ON RETURNING TO APP */}
      {showAntiCheatWarning && runnerStarted && !testCompletedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-4 border-rose-500 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-950 uppercase tracking-tight">
                Cảnh Báo Thoát Màn Hình (Lần thứ {tabSwitchCount})
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hệ thống phát hiện bạn vừa <strong>rời khỏi màn hình làm bài</strong> (chuyển tab, chuyển sang ứng dụng khác hoặc thu nhỏ trình duyệt).
              </p>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-xs text-rose-950 font-medium text-left space-y-1.5">
              <p>• <strong>Số lần vi phạm:</strong> <span className="font-black text-rose-700">{tabSwitchCount} lần</span>.</p>
              <p>• <strong>Quy định:</strong> Thí sinh cần làm bài tập trung trên màn hình này.</p>
              <p className="text-[11px] text-slate-600">• Mọi lần thoát màn hình đều được ghi nhận vào phiếu điểm gửi Giáo viên.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAntiCheatWarning(false);
                setIsWindowBlurred(false);
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tôi Đã Hiểu — Tiếp Tục Làm Bài</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: TẠO ẢNH BẢNG XẾP HẠNG GỬI ZALO PHỤ HUYNH CHO GIÁO VIÊN & QUẢN LÝ */}
      {exportZaloModalTest && (
        <VocabLeaderboardExportModal
          isOpen={Boolean(exportZaloModalTest)}
          onClose={() => setExportZaloModalTest(null)}
          test={exportZaloModalTest}
          initialClassFilter={exportZaloInitialClass || (classGroup ? classGroup.name : 'all')}
          classes={classes}
        />
      )}

      {/* MODAL 5: ĐÃ TẠO BÀI TEST THÀNH CÔNG - LẤY LINK TỨC THÌ GỬI HỌC SINH */}
      {createdTestShareModal && (() => {
        const shareUrl = getTestShareUrl(createdTestShareModal.id);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 my-auto">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 text-2xl font-black shadow-inner border border-emerald-200">
                🎉
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                  {createdTestShareModal.courseLevel}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
                  Đã Tạo Bài Test Thành Công!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{createdTestShareModal.title}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5 text-left">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span>🔗 Link bài test gửi cho học sinh:</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Sẵn sàng
                  </span>
                </div>

                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    navigator.clipboard.writeText(shareUrl);
                    showToast('✅ Đã sao chép đường link!');
                  }}
                  className="w-full text-xs font-mono bg-white p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  title="Nhấn để bôi đen và sao chép"
                />

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleCopyTestLink(createdTestShareModal, 'url')}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyTestLink(createdTestShareModal, 'zalo')}
                    className="py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Mẫu Tin Zalo</span>
                  </button>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = createdTestShareModal;
                    setCreatedTestShareModal(null);
                    handleStartRunner(target);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-purple-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Làm Thử Bài Test</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatedTestShareModal(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
