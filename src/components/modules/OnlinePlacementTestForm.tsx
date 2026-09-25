import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Camera,
  CameraOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  MapPin,
  School,
  Calendar,
  Send,
  Download,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Mic,
  MicOff,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  Check,
  Search,
  Eye,
  UserPlus,
  UserCheck,
  HelpCircle,
  BookOpen,
  Volume2,
  Upload,
  Music,
  Lock,
  Settings,
  Table,
  Code,
  GraduationCap,
  Share2,
  CheckCircle,
  XCircle,
  X,
  Link2,
  FileText,
  Save,
  Database,
  ArrowRight,
  Edit3,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Settings2,
  Shield,
  UploadCloud,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { PlacementTest, ClassGroup, Student, CurriculumCourse, AuthUser } from '../../types';
import { saveDocument, fetchCollection } from '../../lib/firestoreService';
import {
  evaluatePlacementResult,
  generateParentReportText,
  PRESET_COMMENTS,
  LISTENING_KEY_INFO,
  READING_KEY_INFO,
  WRITING_STANDARD_SENTENCES,
  checkListeningAnswer,
  checkReadingAnswer,
  DetailedEvaluationResult,
} from '../../utils/placementEvaluation';
import { formatDateVN } from '../../utils/courseSchedule';
import {
  PLACEMENT_SHEET_COLUMNS,
  extractTestRowValues,
  generatePlacementSheetTSV,
  generatePlacementSheetCSV,
  SAMPLE_GOOGLE_APPS_SCRIPT,
} from '../../utils/placementGoogleSheets';
import {
  getPlacementTestUrl,
  getZaloShareMessage,
  getPlacementRawCopyWithTitle,
  getQrCodeImageUrl,
} from '../../utils/placementLink';
import {
  getReceiptZaloText,
} from '../../utils/placementReceipt';
import { googleSignInForSheets, createNewSpreadsheet, appendToSpreadsheet } from '../../lib/googleSheetsApi';
import { parseCSVRows, convertRowsToPlacementTests } from '../../utils/placementCsvImporter';

// Default schedules for Placement Test Form (Editable by Manager)
const DEFAULT_SCHEDULE_OPTIONS = [
  'Lớp PRE mới Dự kiến 16/9/2026 khai giảng, Thứ 4 Thứ 7 từ 18h - 19h45 (51 TÔ HIỆU)',
  'Lớp PRE mới Dự kiến 19/9/2026 khai giảng, Thứ 3 Thứ 6 từ 19h45 - 21h30 (51 TÔ HIỆU)',
  'LỚP PRE KIẾN AN dự kiến 13/10 khai giảng : Thứ 2 Thứ 5 từ 19h45 - 21h30 (Hòa Bình Kiến An)',
];

const DEFAULT_SCHEDULE_NOTE =
  'Ca 1 từ 18.00 -19.45, ca 2 từ 19.45 - 21.30. 1. Lớp thứ 2 + thứ 5; 2. Lớp thứ 3 + thứ 6; 3. Lớp thứ 4 + thứ 7. Dưới đây là lịch các lớp dự kiến khai giảng sắp tới:';

export const INITIAL_FORM_DATA = {
  // Section 2: Personal Information (Không chọn sẵn cơ sở hay lịch học)
  candidateName: '',
  phone: '',
  parentPhone: '',
  email: '',
  dob: '',
  address: '',
  preferredCampus: '',
  preferredSchedule: '',
  school: '',
  facebookLink: '',
  targetLevel: '',
  targetExamDate: '',
  previousIeltsExperience: '',
  referralSource: '',

  // Section 3: Vocabulary Test (10 Questions - Không chọn sẵn đáp án trắc nghiệm)
  vocabAnswers: {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
    q6: '',
    q7: '',
    q8: '',
    q9: '',
    q10: '',
  } as Record<string, string>,

  // Section 4: Listening Test (5 Fill-in-the-blanks)
  listeningAnswers: {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
  } as Record<string, string>,

  // Section 5: Reading Test (5 Fill-in-the-blanks)
  readingAnswers: {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
  } as Record<string, string>,

  // Section 6: Writing Test
  writingSentences: {
    q1: '',
    q2: '',
    q3: '',
  } as Record<string, string>,
  writingParagraph: '',
};

interface OnlinePlacementTestFormProps {
  placementTests: PlacementTest[];
  classes: ClassGroup[];
  courses?: CurriculumCourse[];
  onAddTest: (test: PlacementTest) => void;
  onAssignToClass?: (testId: string, classId: string, studentData?: Partial<Student>) => void;
  onUpdateTest?: (test: PlacementTest) => void;
  onDeleteTest?: (testId: string) => void;
  onSyncFromCloud?: () => Promise<void>;
  showToast: (msg: string) => void;
  googleFormUrl: string;
  currentUser?: AuthUser;
  isStudentPortal?: boolean;
  onExitStudentPortal?: () => void;
}

export const OnlinePlacementTestForm: React.FC<OnlinePlacementTestFormProps> = ({
  placementTests,
  classes,
  courses = [],
  onAddTest,
  onAssignToClass,
  onUpdateTest,
  onDeleteTest,
  onSyncFromCloud,
  showToast,
  googleFormUrl,
  currentUser,
  isStudentPortal = false,
  onExitStudentPortal,
}) => {
  // Check if current user has Manager / Admin role in management view (False for student portal & students)
  const isAdmin = currentUser?.role === 'admin';
  const isManagement = !isStudentPortal && currentUser?.role !== 'student' && (currentUser?.role === 'admin' || currentUser?.role === 'assistant');

  // Submission & Sharing states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState<boolean>(false);
  const [submittedTest, setSubmittedTest] = useState<PlacementTest | null>(null);
  const [copiedStudentLink, setCopiedStudentLink] = useState<boolean>(false);
  const [copiedZaloMsg, setCopiedZaloMsg] = useState<boolean>(false);
  const [copiedReceiptText, setCopiedReceiptText] = useState<boolean>(false);

  const handleCopyStudentLink = () => {
    const url = getPlacementTestUrl();
    const copyText = getPlacementRawCopyWithTitle(url);
    navigator.clipboard.writeText(copyText);
    setCopiedStudentLink(true);
    showToast('Đã sao chép link kèm tên bài test đầu vào!');
    setTimeout(() => setCopiedStudentLink(false), 2500);
  };

  const handleCopyZaloMessage = () => {
    const url = getPlacementTestUrl();
    const msg = getZaloShareMessage(url);
    navigator.clipboard.writeText(msg);
    setCopiedZaloMsg(true);
    showToast('Đã sao chép mẫu tin nhắn Zalo kèm hướng dẫn làm bài!');
    setTimeout(() => setCopiedZaloMsg(false), 2500);
  };

  const [responseToDelete, setResponseToDelete] = useState<PlacementTest | null>(null);

  const handleDeleteResponse = (test: PlacementTest) => {
    setResponseToDelete(test);
  };

  const confirmDeleteResponse = () => {
    if (!responseToDelete) return;
    const test = responseToDelete;
    if (onDeleteTest) {
      onDeleteTest(test.id);
      showToast(`Đã xóa bài thi của thí sinh "${test.candidateName}" thành công!`);
      if (selectedResponse && selectedResponse.id === test.id) {
        setSelectedResponse(null);
      }
    } else {
      showToast('Chức năng xóa không khả dụng.');
    }
    setResponseToDelete(null);
  };

  // Quick course setting & Note modal for responses list
  const [editingNoteResponse, setEditingNoteResponse] = useState<PlacementTest | null>(null);
  const [noteResponseInput, setNoteResponseInput] = useState<string>('');

  const handleOpenNoteModal = (test: PlacementTest) => {
    setEditingNoteResponse(test);
    setNoteResponseInput(test.comment || '');
  };

  const handleSaveNoteResponse = () => {
    if (!editingNoteResponse) return;
    const updated: PlacementTest = {
      ...editingNoteResponse,
      comment: noteResponseInput.trim(),
    };
    if (onUpdateTest) {
      onUpdateTest(updated);
    }
    showToast(`Đã lưu ghi chú cho thí sinh ${editingNoteResponse.candidateName}!`);
    if (selectedResponse && selectedResponse.id === editingNoteResponse.id) {
      setSelectedResponse(updated);
    }
    setEditingNoteResponse(null);
  };

  const handleQuickSetCourse = (test: PlacementTest, courseName: 'Khóa 1' | 'Khóa 2') => {
    const updated: PlacementTest = {
      ...test,
      recommendedCourse: courseName,
      status: test.status === 'Không đạt' ? 'Đã có kết quả' : test.status,
    };
    if (onUpdateTest) {
      onUpdateTest(updated);
    }
    showToast(`Đã chuyển xếp lớp cho ${test.candidateName} thành "${courseName}"!`);
    if (selectedResponse && selectedResponse.id === test.id) {
      setSelectedResponse(updated);
    }
  };

  // Customizable Placement Test Schedules (Persistent in localStorage, editable only by Admin)
  const [scheduleOptions, setScheduleOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ielts_placement_custom_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SCHEDULE_OPTIONS;
  });

  const [scheduleNote, setScheduleNote] = useState<string>(() => {
    return localStorage.getItem('ielts_placement_schedule_note') || DEFAULT_SCHEDULE_NOTE;
  });

  // Modal State for Schedule Editing (Admin Only)
  const [showScheduleEditModal, setShowScheduleEditModal] = useState<boolean>(false);
  const [tempScheduleList, setTempScheduleList] = useState<string[]>(scheduleOptions);
  const [tempScheduleNote, setTempScheduleNote] = useState<string>(scheduleNote);
  const [newScheduleInput, setNewScheduleInput] = useState<string>('');
  const [editingScheduleIdx, setEditingScheduleIdx] = useState<number | null>(null);
  const [editingScheduleValue, setEditingScheduleValue] = useState<string>('');

  // Top-level tab: Questions (Form) vs Responses (Result Management)
  const [topTab, setTopTab] = useState<'questions' | 'responses'>('questions');

  // Helper to load live draft synchronously
  const getInitialDraft = () => {
    try {
      const raw = localStorage.getItem('idv_placement_form_live_draft') || sessionStorage.getItem('idv_placement_form_live_draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Date.now() - (parsed.timestamp || 0) < 86400000) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  };
  const initialDraft = getInitialDraft();

  // Form Section Navigation (Section 1 to 7)
  const [currentSection, setCurrentSection] = useState<number>(() => {
    return initialDraft && typeof initialDraft.currentSection === 'number' && initialDraft.currentSection >= 1
      ? initialDraft.currentSection
      : 1;
  });

  // Anti-Cheat & Proctoring States
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(() => {
    return initialDraft && typeof initialDraft.tabSwitchCount === 'number'
      ? initialDraft.tabSwitchCount
      : 0;
  });
  const [antiCheatLogs, setAntiCheatLogs] = useState<string[]>(() => {
    return initialDraft && Array.isArray(initialDraft.antiCheatLogs)
      ? initialDraft.antiCheatLogs
      : [];
  });
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [lastViolationMsg, setLastViolationMsg] = useState<string>('');
  const lastViolationTimeRef = useRef<number>(0);
  const lastReturnTimeRef = useRef<number>(0);
  const isUserAwayRef = useRef<boolean>(false);
  const tabSwitchCountRef = useRef<number>(initialDraft?.tabSwitchCount || 0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Countdown Timer (55 minutes = 3300 seconds)
  // Quy định mới: Bắt đầu tính giờ từ khi học sinh chuyển sang Mục 3: Vocabulary test
  const TEST_DURATION_MINUTES = 55;
  const TEST_DURATION_SECONDS = TEST_DURATION_MINUTES * 60; // 3300s
  const [hasTimerStarted, setHasTimerStarted] = useState<boolean>(() => {
    return Boolean(initialDraft?.hasTimerStarted);
  });
  const [testTimeElapsedSeconds, setTestTimeElapsedSeconds] = useState<number>(() => {
    return initialDraft && typeof initialDraft.testTimeElapsedSeconds === 'number'
      ? initialDraft.testTimeElapsedSeconds
      : 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Derived timer states
  const isOverdue = hasTimerStarted && testTimeElapsedSeconds > TEST_DURATION_SECONDS;
  const overdueSeconds = isOverdue ? testTimeElapsedSeconds - TEST_DURATION_SECONDS : 0;
  const remainingSeconds = hasTimerStarted
    ? Math.max(0, TEST_DURATION_SECONDS - testTimeElapsedSeconds)
    : TEST_DURATION_SECONDS;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationText = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (mins === 0) return `${s} giây`;
    if (s === 0) return `${mins} phút`;
    return `${mins} phút ${s.toString().padStart(2, '0')} giây`;
  };

  // Listening Audio Player State (Using Real Audio)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [listenPlayCount, setListenPlayCount] = useState<number>(0);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState<number>(70);
  const [listeningAudioSource, setListeningAudioSource] = useState<string>('/audio/guitar_lesson_listening.mp3?v=2');
  const [isCustomAudioActive, setIsCustomAudioActive] = useState<boolean>(false);
  const [showAdminAudioControls, setShowAdminAudioControls] = useState<boolean>(false);
  const listeningAudioRef = useRef<HTMLAudioElement | null>(null);
  const customAudioInputRef = useRef<HTMLInputElement | null>(null);

  // Speaking Voice Recorder State (Real Audio Recording with auto-save)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Responses Tab Filters & Modals
  const [responseSearch, setResponseSearch] = useState<string>('');
  const [selectedResponse, setSelectedResponse] = useState<PlacementTest | null>(null);

  // Scroll to top immediately upon opening the test link
  useEffect(() => {
    if (isStudentPortal) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [isStudentPortal]);

  // Evaluation & Grading Adjustment States for Selected Response
  const [evalWritingErrorLevel, setEvalWritingErrorLevel] = useState<'ít lỗi' | 'lỗi nhiều'>('lỗi nhiều');
  const [evalRecommendedCourse, setEvalRecommendedCourse] = useState<string>('Khóa 1');
  const [evalComment, setEvalComment] = useState<string>('');
  const [evalStatus, setEvalStatus] = useState<'Đã có kết quả' | 'Không đạt'>('Đã có kết quả');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAnswerAuditDetails, setShowAnswerAuditDetails] = useState<boolean>(false);

  // Google Sheet Link Management (Persistent URL storage)
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    return localStorage.getItem('ielts_placement_sheet_url') || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
  });
  const [tempGoogleSheetUrl, setTempGoogleSheetUrl] = useState<string>(googleSheetUrl);
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState<boolean>(false);
  const [showColumnListModal, setShowColumnListModal] = useState<boolean>(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    const saved = localStorage.getItem('ielts_placement_webhook_url');
    if (saved) return saved;
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbyR_WM6kpyQZmdODOT8Z0okH0YSFDdqi_yJZ8riYOcVOx7bXeAayesEdIMWzoLsVj-J/exec';
    localStorage.setItem('ielts_placement_webhook_url', defaultUrl);
    return defaultUrl;
  });
  const [showImportCsvModal, setShowImportCsvModal] = useState<boolean>(false);
  const [rawCsvInput, setRawCsvInput] = useState<string>('');
  const [isImportingCsv, setIsImportingCsv] = useState<boolean>(false);

  // Scroll to top when section changes in student portal
  useEffect(() => {
    if (isStudentPortal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection, isStudentPortal]);

  // Assign to Class Modal State
  const [assignModalTest, setAssignModalTest] = useState<PlacementTest | null>(null);
  const [assignSelectedClassId, setAssignSelectedClassId] = useState<string>('waiting_list');
  const [assignStudentFormData, setAssignStudentFormData] = useState({
    name: '',
    dob: '2008-01-15',
    gender: 'Nam' as 'Nam' | 'Nữ',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: 'Hải Phòng',
  });

  // Synchronize evaluation state whenever selectedResponse changes
  useEffect(() => {
    if (selectedResponse) {
      const evalRes = evaluatePlacementResult(
        selectedResponse.testAnswers?.vocab,
        selectedResponse.testAnswers?.listening,
        selectedResponse.testAnswers?.reading,
        selectedResponse.testAnswers?.writingSentences
      );
      setEvalWritingErrorLevel(evalRes.writingErrorLevel);
      setEvalRecommendedCourse(selectedResponse.recommendedCourse || evalRes.recommendedCourse);
      setEvalComment(selectedResponse.comment || evalRes.comment);
      setEvalStatus(
        selectedResponse.status === 'Không đạt' || selectedResponse.recommendedCourse === 'Không Đạt' || evalRes.isFailed
          ? 'Không đạt'
          : 'Đã có kết quả'
      );
    }
  }, [selectedResponse]);

  // Schedule Management Handlers (Admin/Manager Only)
  const handleOpenScheduleEditModal = () => {
    if (!isManagement) {
      showToast('⚠️ Tính năng chỉnh sửa lịch học chỉ dành cho Quản lý / Giáo vụ!');
      return;
    }
    setTempScheduleList([...scheduleOptions]);
    setTempScheduleNote(scheduleNote);
    setNewScheduleInput('');
    setEditingScheduleIdx(null);
    setShowScheduleEditModal(true);
  };

  const handleAddScheduleItem = () => {
    const trimmed = newScheduleInput.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập nội dung lịch học mới');
      return;
    }
    setTempScheduleList((prev) => [...prev, trimmed]);
    setNewScheduleInput('');
    showToast('Đã thêm lịch học vào danh sách tạm!');
  };

  const handleRemoveScheduleItem = (index: number) => {
    setTempScheduleList((prev) => prev.filter((_, idx) => idx !== index));
    if (editingScheduleIdx === index) {
      setEditingScheduleIdx(null);
    }
  };

  const handleMoveScheduleItem = (index: number, direction: 'up' | 'down') => {
    setTempScheduleList((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleStartEditSchedule = (index: number) => {
    setEditingScheduleIdx(index);
    setEditingScheduleValue(tempScheduleList[index] || '');
  };

  const handleSaveEditSchedule = (index: number) => {
    const trimmed = editingScheduleValue.trim();
    if (!trimmed) {
      showToast('Nội dung lịch học không được để trống');
      return;
    }
    setTempScheduleList((prev) => {
      const copy = [...prev];
      copy[index] = trimmed;
      return copy;
    });
    setEditingScheduleIdx(null);
  };

  const handleResetScheduleDefaults = () => {
    setTempScheduleList([...DEFAULT_SCHEDULE_OPTIONS]);
    setTempScheduleNote(DEFAULT_SCHEDULE_NOTE);
    setEditingScheduleIdx(null);
    showToast('Đã khôi phục cài đặt lịch học gốc!');
  };

  const handleSaveScheduleChanges = () => {
    if (tempScheduleList.length === 0) {
      showToast('Danh sách lịch học phải có ít nhất 1 lựa chọn');
      return;
    }
    setScheduleOptions(tempScheduleList);
    setScheduleNote(tempScheduleNote);
    localStorage.setItem('ielts_placement_custom_schedules', JSON.stringify(tempScheduleList));
    localStorage.setItem('ielts_placement_schedule_note', tempScheduleNote);

    // If current selected schedule in form is not in the updated list, clear it if set
    if (formData.preferredSchedule && !tempScheduleList.includes(formData.preferredSchedule)) {
      setFormData((prev) => ({ ...prev, preferredSchedule: '' }));
    }

    setShowScheduleEditModal(false);
    showToast('Đã lưu và cập nhật lịch học form test thành công!');
  };

  // Google Forms Style: Real-Time Live Draft Auto-Save Engine
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState<boolean>(false);

  // Form Data Model matching the 7 Sections from PDF (Auto-restored from draft if available)
  const [formData, setFormData] = useState(() => {
    try {
      const rawDraft =
        sessionStorage.getItem('idv_placement_form_live_draft') ||
        localStorage.getItem('idv_placement_form_live_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft && draft.formData && Date.now() - (draft.timestamp || 0) < 86400000) {
          return { ...INITIAL_FORM_DATA, ...draft.formData };
        }
      }
    } catch (e) {}
    return INITIAL_FORM_DATA;
  });

  // Restore draft state on initial mount
  useEffect(() => {
    try {
      const rawDraft =
        sessionStorage.getItem('idv_placement_form_live_draft') ||
        localStorage.getItem('idv_placement_form_live_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft && Date.now() - (draft.timestamp || 0) < 86400000) {
          if (draft.currentSection && draft.currentSection > 1) {
            setCurrentSection(draft.currentSection);
          }
          if (draft.hasTimerStarted) {
            setHasTimerStarted(true);
          }
          if (typeof draft.testTimeElapsedSeconds === 'number' && draft.testTimeElapsedSeconds > 0) {
            setTestTimeElapsedSeconds(draft.testTimeElapsedSeconds);
          }
          if (typeof draft.tabSwitchCount === 'number') {
            setTabSwitchCount(draft.tabSwitchCount);
            tabSwitchCountRef.current = draft.tabSwitchCount;
          }
          if (Array.isArray(draft.antiCheatLogs)) {
            setAntiCheatLogs(draft.antiCheatLogs);
          }
          const timeStr = draft.timestamp
            ? new Date(draft.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : 'gần đây';
          setLastAutoSaveTime(timeStr);
          setShowDraftRestoredNotice(true);
        }
      }
    } catch (e) {}
  }, []);

  // Debounced Auto-Save on every single answer / keystroke (Real-time Google Forms Auto-Save)
  useEffect(() => {
    if (isSubmittedSuccessfully) return;

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const draftPayload = {
          formData,
          currentSection,
          hasTimerStarted,
          testTimeElapsedSeconds,
          tabSwitchCount,
          antiCheatLogs,
          timestamp: Date.now(),
        };
        const str = JSON.stringify(draftPayload);
        localStorage.setItem('idv_placement_form_live_draft', str);
        sessionStorage.setItem('idv_placement_form_live_draft', str);
        setAutoSaveStatus('saved');
        setLastAutoSaveTime(
          new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (e) {
        setAutoSaveStatus('saved');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData, currentSection, hasTimerStarted, testTimeElapsedSeconds, tabSwitchCount, antiCheatLogs, isSubmittedSuccessfully]);

  const handleClearDraft = () => {
    if (window.confirm('Em có chắc chắn muốn xóa toàn bộ câu trả lời đã nhập để làm lại từ đầu không?')) {
      localStorage.removeItem('idv_placement_form_live_draft');
      sessionStorage.removeItem('idv_placement_form_live_draft');
      setFormData(INITIAL_FORM_DATA);
      setCurrentSection(1);
      setHasTimerStarted(false);
      setTestTimeElapsedSeconds(0);
      setTabSwitchCount(0);
      tabSwitchCountRef.current = 0;
      setAntiCheatLogs([]);
      setShowDraftRestoredNotice(false);
      showToast('Đã xóa bản nháp và làm mới bài kiểm tra.');
    }
  };

  // --- 1. ANTI-CHEAT: TAB SWITCH & EXIT DETECTION ---
  // STRICTLY active ONLY during actual test sections when the timer is running (from Section 3 Vocabulary onwards)
  useEffect(() => {
    // Only monitor when timer is actively running in the test sections (Section >= 3)
    if (topTab !== 'questions' || isSubmittedSuccessfully || !hasTimerStarted || currentSection < 3) return;

    const triggerExitViolation = (reason: string) => {
      if (isSubmitting || isSubmittedSuccessfully) return;
      const now = Date.now();
      if (isUserAwayRef.current) return; // Already counted for this exit cycle
      if (now - lastViolationTimeRef.current < 1500) return; // Debounce

      isUserAwayRef.current = true;
      lastViolationTimeRef.current = now;
      tabSwitchCountRef.current += 1;
      setTabSwitchCount(tabSwitchCountRef.current);
      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const logMsg = `[${timeStr}] 🚨 THOÁT MÀN HÌNH: ${reason}`;
      setAntiCheatLogs((prev) => [logMsg, ...prev]);
      setLastViolationMsg(
        `Em vừa rời khỏi màn hình làm bài (${reason}). Hệ thống đã ghi nhận vi phạm lần thứ ${tabSwitchCountRef.current} vào phiếu điểm gửi Giáo viên.`
      );
      setShowWarningModal(true);
    };

    const handleReturn = () => {
      isUserAwayRef.current = false;
      lastReturnTimeRef.current = Date.now();
    };

    // 1. Tab visibility change (switching tabs, minimizing browser, opening another app)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerExitViolation('Thoát màn hình / Chuyển tab');
      } else {
        handleReturn();
      }
    };

    // 2. Page hide / App backgrounding
    const handlePageHide = () => {
      if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        triggerExitViolation('Rời trang làm bài / Ẩn ứng dụng');
      }
    };

    // 3. Mobile freeze lifecycle
    const handleFreeze = () => {
      if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        triggerExitViolation('Tạm dừng màn hình');
      }
    };

    // 4. Drift Detector (in case browser suspended JS before visibility event fired)
    let lastHeartbeat = Date.now();
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastHeartbeat;
      lastHeartbeat = now;

      // Only trigger if suspended for > 4500ms AND document is actually hidden or away
      if (delta > 4500 && !isUserAwayRef.current && Date.now() - lastReturnTimeRef.current > 2500) {
        if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
          triggerExitViolation('Rời khỏi màn hình làm bài');
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
  }, [topTab, isSubmittedSuccessfully, hasTimerStarted, currentSection, isSubmitting]);

  // Auto scroll to top of section header when changing sections so candidate reads instructions first
  useEffect(() => {
    if (topTab === 'questions') {
      const formContainer = document.getElementById('placement-test-form-container');
      if (formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentSection, topTab]);

  // Auto-start timer when moving to Section 3 (Vocabulary) or beyond
  useEffect(() => {
    if (currentSection >= 3 && !hasTimerStarted) {
      setHasTimerStarted(true);
      showToast('⏱️ Bắt đầu tính giờ làm bài (55 phút)! Chúc em làm bài thật tốt!');
    }
  }, [currentSection, hasTimerStarted, showToast]);

  // --- 2. TIMER (55 MINUTES - Starts when entering Section 3: Vocabulary) ---
  // Overtime does NOT block the exam: continues counting and tracks overdue time
  useEffect(() => {
    if (!hasTimerStarted || !isTimerRunning || topTab !== 'questions' || isSubmittedSuccessfully) return;
    const interval = setInterval(() => {
      setTestTimeElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next === TEST_DURATION_SECONDS + 1) {
          showToast('⚠️ Đã hết 55 phút quy định! Em vẫn có thể tiếp tục làm bài, hệ thống sẽ ghi nhận thời gian vượt mốc.');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimerStarted, isTimerRunning, topTab, isSubmittedSuccessfully, showToast]);

  // --- 3. CAMERA PROCTORING TOGGLE ---
  const toggleCamera = async () => {
    if (isCameraActive) {
      // Turn off
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      showToast('Đã tắt camera giám sát.');
    } else {
      // Turn on
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        showToast('Camera giám sát AI Proctoring đã bật thành công!');
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError('Không thể mở camera. Vui lòng cấp quyền camera trong trình duyệt của bạn.');
        setIsCameraActive(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // --- 4. LOAD & HANDLE CUSTOM AUDIO VIA INDEXEDDB ---
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const request = window.indexedDB.open('ielts_placement_test_audio_db', 1);
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('audio_files')) {
            db.createObjectStore('audio_files');
          }
        };
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const tx = db.transaction('audio_files', 'readonly');
          const store = tx.objectStore('audio_files');
          const getReq = store.get('listening_audio');
          getReq.onsuccess = () => {
            if (getReq.result) {
              const url = URL.createObjectURL(getReq.result);
              setListeningAudioSource(url);
              setIsCustomAudioActive(true);
            }
          };
        };
      }
    } catch (e) {
      console.warn('IndexedDB check failed:', e);
    }
  }, []);

  const handleUploadCustomAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    setListeningAudioSource(audioUrl);
    setIsCustomAudioActive(true);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);

    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const request = window.indexedDB.open('ielts_placement_test_audio_db', 1);
        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('audio_files')) {
            db.createObjectStore('audio_files');
          }
        };
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const tx = db.transaction('audio_files', 'readwrite');
          const store = tx.objectStore('audio_files');
          store.put(file, 'listening_audio');
          showToast('✅ Đã lưu file audio nghe gốc của bạn thành công!');
        };
      }
    } catch (err) {
      console.warn('Error saving audio file to IndexedDB:', err);
      showToast('Đã tải lên audio!');
    }
  };

  const handleResetToDefaultAudio = () => {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const request = window.indexedDB.open('ielts_placement_test_audio_db', 1);
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const tx = db.transaction('audio_files', 'readwrite');
          const store = tx.objectStore('audio_files');
          store.delete('listening_audio');
        };
      }
    } catch (e) {}
    setListeningAudioSource('/audio/guitar_lesson_listening.mp3');
    setIsCustomAudioActive(false);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
    showToast('Đã khôi phục file audio mặc định.');
  };

  // --- 4. LISTENING AUDIO CONTROLS (REAL AUDIO FILE) ---
  const handleTogglePlayAudio = () => {
    if (!listeningAudioRef.current) return;

    if (isPlayingAudio) {
      listeningAudioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const nextCount = listenPlayCount + 1;
      setListenPlayCount(nextCount);
      if (nextCount >= 2) {
        showToast('⚠️ Cảnh báo: Em đã bấm nghe lần thứ ' + nextCount + '! (Theo quy định sẽ bị trừ điểm)');
      }
      listeningAudioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
        setIsPlayingAudio(true);
      });
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (listeningAudioRef.current && listeningAudioRef.current.duration) {
      setAudioTotalDuration(listeningAudioRef.current.duration);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (listeningAudioRef.current) {
      const current = listeningAudioRef.current.currentTime;
      const total = listeningAudioRef.current.duration || audioTotalDuration || 75;
      setAudioCurrentTime(current);
      setAudioTotalDuration(total);
      setAudioProgress((current / total) * 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(100);
    showToast('Đã kết thúc đoạn audio Listening!');
  };

  // --- 5. VOICE RECORDER (MICROPHONE RECORDING WITH AUTO-SAVE) ---
  const handleToggleRecord = async () => {
    if (isRecording) {
      // Dừng ghi âm -> Tự động lưu bản ghi
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setHasRecorded(true);
      showToast('Đã dừng và tự động lưu bản ghi âm bài Speaking!');
    } else {
      // Bắt đầu ghi âm qua Microphone trình duyệt
      try {
        setRecordedAudioUrl(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        audioChunksRef.current = [];

        let options: MediaRecorderOptions = {};
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 24000 };
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm', audioBitsPerSecond: 24000 };
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4', audioBitsPerSecond: 24000 };
          } else {
            options = { audioBitsPerSecond: 24000 };
          }
        }

        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const mime = recorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mime });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result as string;
              setRecordedAudioUrl(base64Audio);
            };
            reader.readAsDataURL(audioBlob);
          }
          // Dừng các audio tracks để giải phóng microphone
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => track.stop());
            audioStreamRef.current = null;
          }
        };

        recorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        setHasRecorded(false);
        showToast('Đang thu âm Speaking... Vui lòng đọc to rõ ràng đoạn hội thoại!');
      } catch (err: any) {
        console.warn('Microphone permission or hardware error, falling back to simulated recorder:', err);
        // Fallback simulated recording if browser denied mic permission or iframe restriction
        setIsRecording(true);
        setRecordingSeconds(0);
        setHasRecorded(false);
        showToast('Bắt đầu ghi âm Speaking...');
      }
    }
  };

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 120) {
            // Tự động dừng và lưu khi đạt 2 phút chuẩn IELTS Speaking Part 2
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            setHasRecorded(true);
            showToast('Đã đạt giới hạn 2 phút (chuẩn IELTS Speaking Part 2). Bản ghi đã được tự động lưu!');
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Clean up audio streams on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // --- 6. SUBMIT EXAM & SAVE TO SYSTEM ---
  const handleSubmitExam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    // Validate and provide fallback candidate identity
    const candidateName =
      formData.candidateName.trim() ||
      `Học viên Test Online (${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`;
    const phone = formData.phone.trim() || '0901234567';

    setIsSubmitting(true);

    try {
      // Auto-stop recording if currently recording
      if (isRecording) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
          } catch (recErr) {}
        }
        setIsRecording(false);
        setHasRecorded(true);
      }

      const safeEmailName =
        candidateName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '') || `candidate_${Date.now()}`;
      const email = formData.email.trim() || `${safeEmailName}@gmail.com`;
      const campus = formData.preferredCampus.trim() || '51 Tô Hiệu';
      const schedule = formData.preferredSchedule.trim() || 'Lớp PRE (Thứ 2 + Thứ 5 hoặc Thứ 3 + Thứ 6)';

      const evalRes = evaluatePlacementResult(
        formData.vocabAnswers || {},
        formData.listeningAnswers || {},
        formData.readingAnswers || {},
        formData.writingSentences || {}
      );

      const vocabScore = Number(((evalRes.vocabCorrect / 10) * 9.0).toFixed(1));
      const listeningScore = Number(((evalRes.listeningCorrect / 5) * 9.0).toFixed(1));
      const readingScore = Number(((evalRes.readingCorrect / 5) * 9.0).toFixed(1));
      const writingScore = evalRes.writingErrorLevel === 'ít lỗi' ? 6.5 : 5.0;
      const speakingScore = hasRecorded || recordedAudioUrl ? 6.0 : 5.5;

      const overallScore = Number(
        ((vocabScore * 0.2 + listeningScore * 0.3 + readingScore * 0.3 + writingScore * 0.2)).toFixed(1)
      );

      const recommendedCourse = evalRes.recommendedCourse;
      const status = evalRes.status;
      const comment = evalRes.comment;

      // Calculate test duration & overdue metrics
      const timeSpentSeconds = testTimeElapsedSeconds || 0;
      const isOverdueSubmission = timeSpentSeconds > TEST_DURATION_SECONDS;
      const overdueSecondsVal = isOverdueSubmission ? timeSpentSeconds - TEST_DURATION_SECONDS : 0;
      const overdueTextStr = isOverdueSubmission ? formatDurationText(overdueSecondsVal) : 'Đúng giờ';
      const timeSpentFormattedStr = formatDurationText(timeSpentSeconds || 0);

      const antiCheatLogsFinal = [...antiCheatLogs];
      const timeNowStr = new Date().toLocaleTimeString('vi-VN');
      if (isOverdueSubmission) {
        antiCheatLogsFinal.unshift(
          `[${timeNowStr}] ⚠️ Nộp bài quá thời gian quy định: Vượt mốc +${formatTimer(overdueSecondsVal)} (${overdueTextStr}). Tổng thời gian làm bài: ${timeSpentFormattedStr} / 55 phút.`
        );
      } else {
        antiCheatLogsFinal.unshift(
          `[${timeNowStr}] ✅ Nộp bài đúng giờ quy định (Thời gian làm bài: ${timeSpentFormattedStr} / 55 phút).`
        );
      }

      const newTest: PlacementTest = {
        id: `pt-online-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        candidateName,
        dob: formData.dob || '2008-01-15',
        gender: 'Nữ',
        phone,
        parentPhone: formData.parentPhone || phone,
        email,
        address: formData.address || 'Hải Phòng',
        testDate: new Date().toISOString().split('T')[0],
        submittedAt: new Date().toISOString(),
        evaluatorName: 'Hệ thống Khảo thí & Giám sát Online IELTS Dương Vũ',
        listeningScore,
        speakingScore,
        readingScore,
        writingScore,
        overallScore,
        targetLevel: formData.targetLevel || 'Overall 6.5',
        recommendedCourse,
        status,
        comment,
        sourceType: 'form_online',
        testDurationMinutes: 55,
        timeSpentSeconds,
        isOverdue: isOverdueSubmission,
        overdueSeconds: overdueSecondsVal,
        overdueText: overdueTextStr,
        timeSpentFormatted: timeSpentFormattedStr,
        tabSwitchCount: Math.max(tabSwitchCount, tabSwitchCountRef.current || 0),
        antiCheatLogs: antiCheatLogsFinal,
        googleFormLink: googleFormUrl,
        school: formData.school,
        facebookLink: formData.facebookLink,
        targetExamDate: formData.targetExamDate,
        preferredCampus: campus,
        preferredSchedule: schedule,
        previousIeltsExperience: formData.previousIeltsExperience,
        referralSource: formData.referralSource,
        cameraEnabled: isCameraActive,
        speakingAudioUrl: recordedAudioUrl || (hasRecorded ? 'simulated_speaking_recording.webm' : undefined),
        speakingAudioDuration: recordingSeconds || undefined,
        testAnswers: {
          vocab: formData.vocabAnswers,
          listening: formData.listeningAnswers,
          reading: formData.readingAnswers,
          writingSentences: formData.writingSentences,
          writingParagraph: formData.writingParagraph,
          speakingAudioUrl: recordedAudioUrl || (hasRecorded ? 'simulated_speaking_recording.webm' : undefined),
          speakingAudioDuration: recordingSeconds || undefined,
        },
      };

      // 1. Direct backup in localStorage
      try {
        const existingSubmitted: PlacementTest[] = JSON.parse(
          localStorage.getItem('idv_submitted_candidate_placement_tests') || '[]'
        );
        const filtered = existingSubmitted.filter((t) => t.id !== newTest.id);
        localStorage.setItem(
          'idv_submitted_candidate_placement_tests',
          JSON.stringify([newTest, ...filtered].slice(0, 100))
        );
        localStorage.setItem('idv_placement_last_submission', JSON.stringify({ test: newTest, timestamp: Date.now() }));
      } catch (e) {
        console.warn('LocalStorage candidate backup save error:', e);
      }

      // 2. Direct save to Application Server (Guaranteed cross-device & cross-network sync via keepalive)
      try {
        fetch('/api/placement-tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTest),
          keepalive: true,
        }).catch((apiErr) => {
          console.warn('Server API save attempt:', apiErr);
        });
      } catch (e) {}

      // 3. Save to Firestore Database
      saveDocument('placementTests', newTest).catch((err) => {
        console.warn('Direct Firestore save failed in OnlinePlacementTestForm:', err);
      });

      // Send to Webhook (Google Apps Script) automatically
      const DEFAULT_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyR_WM6kpyQZmdODOT8Z0okH0YSFDdqi_yJZ8riYOcVOx7bXeAayesEdIMWzoLsVj-J/exec';
      const savedWebhook = localStorage.getItem('ielts_placement_webhook_url');
      const targetWebhookUrl = (savedWebhook && savedWebhook.trim()) ? savedWebhook.trim() : DEFAULT_WEBHOOK;

      try {
        const rowData = extractTestRowValues(newTest, placementTests.length);
        const webhookPayload = JSON.stringify({
          headers: PLACEMENT_SHEET_COLUMNS,
          row: rowData,
          test: newTest,
        });

        // 1. Direct browser fetch with text/plain (avoids CORS preflight)
        fetch(targetWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: webhookPayload,
        }).catch((err) => {
          console.warn('Failed client fetch to Google Apps Script webhook:', err);
        });

        // 2. Server proxy fetch to ensure delivery regardless of browser/adblocker
        fetch('/api/sync-placement-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: targetWebhookUrl,
            tests: [newTest],
          }),
        }).catch(() => {});
      } catch (webhookErr) {
        console.warn('Webhook dispatch error:', webhookErr);
      }

      // 4. Clear live auto-draft since test is successfully submitted
      try {
        localStorage.removeItem('idv_placement_form_live_draft');
        sessionStorage.removeItem('idv_placement_form_live_draft');
      } catch (e) {}

      // 5. Propagate to parent state
      try {
        onAddTest(newTest);
      } catch (err) {
        console.warn('onAddTest error:', err);
      }

      showToast(`✅ Đã nộp bài kiểm tra đầu vào của ${candidateName} thành công!`);

      setSubmittedTest(newTest);
      setIsSubmittedSuccessfully(true);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (submitErr) {
      console.error('Fatal submit error in OnlinePlacementTestForm:', submitErr);
      showToast('⚠️ Đã có lỗi khi xử lý bài nộp. Đang bảo toàn dữ liệu bài thi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep a ref to the latest submit function to avoid stale closures in useEffect
  const latestSubmitRef = useRef(handleSubmitExam);
  useEffect(() => {
    latestSubmitRef.current = handleSubmitExam;
  });

  // Auto-submit after recording finishes processing
  useEffect(() => {
    if (pendingAutoSubmit && recordedAudioUrl) {
      setPendingAutoSubmit(false);
      latestSubmitRef.current();
    }
  }, [pendingAutoSubmit, recordedAudioUrl]);

  // Handler: Change Writing Error Level in Review Modal
  const handleWritingErrorLevelChange = (level: 'ít lỗi' | 'lỗi nhiều') => {
    setEvalWritingErrorLevel(level);
    if (!selectedResponse) return;
    const evalRes = evaluatePlacementResult(
      selectedResponse.testAnswers?.vocab,
      selectedResponse.testAnswers?.listening,
      selectedResponse.testAnswers?.reading,
      selectedResponse.testAnswers?.writingSentences,
      level
    );
    setEvalRecommendedCourse(evalRes.recommendedCourse);
    setEvalComment(evalRes.comment);
    setEvalStatus(evalRes.status);
  };

  // Handler: Select Course manually and apply default comment preset
  const handleSelectCourse = (course: 'Khóa 1' | 'Khóa 2' | 'Không Đạt') => {
    setEvalRecommendedCourse(course);
    if (course === 'Khóa 1') {
      setEvalStatus('Đã có kết quả');
      setEvalComment(PRESET_COMMENTS.COURSE_1);
    } else if (course === 'Không Đạt') {
      setEvalStatus('Không đạt');
      setEvalComment(PRESET_COMMENTS.FAILED);
    } else {
      setEvalStatus('Đã có kết quả');
      setEvalComment(PRESET_COMMENTS.COURSE_2);
    }
  };

  // Handler: Save Teacher's Evaluation Changes to the Test
  const handleSaveEvaluation = () => {
    if (!selectedResponse) return;
    const updatedTest: PlacementTest = {
      ...selectedResponse,
      recommendedCourse: evalRecommendedCourse,
      comment: evalComment,
      status: evalStatus,
    };
    if (onUpdateTest) {
      onUpdateTest(updatedTest);
    }
    setSelectedResponse(updatedTest);
    showToast(`Đã cập nhật đánh giá xếp lớp cho em ${selectedResponse.candidateName}!`);
  };

  // Handler: Copy Report for Parents
  const handleCopyReport = (test: PlacementTest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const evalRes = evaluatePlacementResult(
      test.testAnswers?.vocab,
      test.testAnswers?.listening,
      test.testAnswers?.reading,
      test.testAnswers?.writingSentences,
      selectedResponse?.id === test.id ? evalWritingErrorLevel : undefined
    );
    const reportText = generateParentReportText(
      {
        ...test,
        recommendedCourse: selectedResponse?.id === test.id ? evalRecommendedCourse : test.recommendedCourse,
        comment: selectedResponse?.id === test.id ? evalComment : test.comment,
        status: selectedResponse?.id === test.id ? evalStatus : test.status,
      },
      evalRes
    );

    const onCopySuccess = () => {
      setCopiedId(test.id);
      showToast(`Đã sao chép kết quả bài làm báo cáo phụ huynh của em ${test.candidateName}!`);
      setTimeout(() => setCopiedId(null), 3000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(onCopySuccess).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        onCopySuccess();
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = reportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopySuccess();
    }
  };

  // --- 7. EXPORT & SYNC TO GOOGLE SHEETS (57 COLUMNS - EVERY ITEM AS A SEPARATE COLUMN) ---
  const handleSaveGoogleSheetUrl = () => {
    const trimmed = tempGoogleSheetUrl.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập link liên kết Google Sheet hợp lệ!');
      return;
    }
    // Check if the user accidentally pasted raw CSV/TSV table data instead of a URL
    if (trimmed.startsWith('Timestamp') || trimmed.includes('\n') || (trimmed.includes(',') && !trimmed.startsWith('http'))) {
      setRawCsvInput(trimmed);
      setShowGoogleSheetModal(false);
      setShowImportCsvModal(true);
      showToast('💡 Phát hiện bạn vừa dán dữ liệu bảng tính Google Sheet! Đang chuyển sang màn hình nhập dữ liệu...');
      return;
    }
    setGoogleSheetUrl(trimmed);
    localStorage.setItem('ielts_placement_sheet_url', trimmed);
    setShowGoogleSheetModal(false);
    showToast('Đã lưu link liên kết Google Sheet thành công! Bạn có thể xem lại bất kỳ lúc nào.');
  };

  const handleImportCsvData = async () => {
    if (!rawCsvInput.trim()) {
      showToast('⚠️ Vui lòng dán dữ liệu CSV hoặc bảng tính Google Sheet!');
      return;
    }
    try {
      setIsImportingCsv(true);
      const rows = parseCSVRows(rawCsvInput.trim());
      if (rows.length < 2) {
        showToast('⚠️ Dữ liệu không hợp lệ hoặc không có dòng học viên nào.');
        setIsImportingCsv(false);
        return;
      }
      const imported = convertRowsToPlacementTests(rows);
      if (imported.length === 0) {
        showToast('⚠️ Không tìm thấy thông tin thí sinh nào trong dữ liệu.');
        setIsImportingCsv(false);
        return;
      }

      // Save each to Firestore and local state
      for (const t of imported) {
        onAddTest(t);
        saveDocument('placementTests', t).catch(() => {});
      }

      // Save to localStorage backup
      try {
        const existing: PlacementTest[] = JSON.parse(
          localStorage.getItem('idv_submitted_candidate_placement_tests') || '[]'
        );
        const merged = [
          ...imported,
          ...existing.filter((e) => !imported.some((i) => i.candidateName === e.candidateName && i.phone === e.phone)),
        ];
        localStorage.setItem('idv_submitted_candidate_placement_tests', JSON.stringify(merged.slice(0, 500)));
      } catch (e) {}

      showToast(`🎉 Đã nhập thành công ${imported.length} bài thi từ Google Sheet vào hệ thống!`);
      setShowImportCsvModal(false);
      setRawCsvInput('');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi nhập dữ liệu: ' + err.message);
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleOpenGoogleSheet = () => {
    if (!googleSheetUrl) {
      setShowGoogleSheetModal(true);
      return;
    }
    window.open(googleSheetUrl, '_blank');
  };

  const handleExportGoogleSheetCSV = () => {
    const csvContent = generatePlacementSheetCSV(allDisplayTests);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ket_Qua_Test_Dau_Vao_57_Cot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải file CSV chuẩn 57 cột dữ liệu (Mỗi mục học sinh nhập là 1 cột) thành công!');
  };

  // Copy TSV data (all 57 columns) to paste directly into Google Sheets with Ctrl+V
  const handleCopyGoogleSheetsTSV = () => {
    const tsvContent = generatePlacementSheetTSV(allDisplayTests);
    navigator.clipboard.writeText(tsvContent);
    showToast(`Đã sao chép toàn bộ 57 cột dữ liệu của ${allDisplayTests.length} bài thi! Hãy mở Google Sheet và nhấn Ctrl+V để dán.`);
  };

  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const handleCreateAndSyncGoogleSheet = async () => {
    try {
      setIsSyncingSheet(true);
      showToast('Đang kết nối tài khoản Google...');
      const authResult = await googleSignInForSheets();
      if (!authResult) {
         showToast('Không thể đăng nhập Google.');
         setIsSyncingSheet(false);
         return;
      }
      
      showToast('Đang tạo Google Sheet mới...');
      const sheetName = `Kết Quả Đầu Vào IELTS Dương Vũ - ${new Date().toLocaleDateString('vi-VN')}`;
      const spreadsheetId = await createNewSpreadsheet(sheetName, authResult.accessToken);
      
      const newSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      setTempGoogleSheetUrl(newSheetUrl);
      setGoogleSheetUrl(newSheetUrl);
      localStorage.setItem('ielts_placement_sheet_url', newSheetUrl);
      
      showToast('Đang đẩy dữ liệu lên Google Sheet...');
      
      const headerRow = [...PLACEMENT_SHEET_COLUMNS];
      const dataRows = allDisplayTests.map((t, index) => extractTestRowValues(t, index));
      
      const allRows = [headerRow, ...dataRows];
      
      await appendToSpreadsheet(spreadsheetId, 'Sheet1!A1', allRows, authResult.accessToken);
      
      showToast('Đồng bộ dữ liệu thành công! Đang mở Google Sheet...');
      window.open(newSheetUrl, '_blank');
      
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi đồng bộ Google Sheets: ' + err.message);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // --- 8. ASSIGN TO CLASS / WAITING LIST HANDLERS ---
  const handleOpenAssignModal = (test: PlacementTest) => {
    setAssignModalTest(test);
    setAssignSelectedClassId(test.recommendedClassId || (classes.length > 0 ? classes[0].id : 'waiting_list'));
    setAssignStudentFormData({
      name: test.candidateName,
      dob: test.dob || '2008-01-15',
      gender: (test.gender as 'Nam' | 'Nữ') || 'Nam',
      email: test.email || `${test.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      phone: test.phone,
      parentName: test.parentName || `PH ${test.candidateName}`,
      parentPhone: test.parentPhone || test.phone,
      address: test.address || 'Hải Phòng',
    });
  };

  const handleConfirmAssign = () => {
    if (!assignModalTest) return;
    const targetClass = classes.find((c) => c.id === assignSelectedClassId);
    const targetClassName = targetClass ? targetClass.name : 'Lớp Chờ Xếp (Waiting List)';

    if (onAssignToClass) {
      onAssignToClass(assignModalTest.id, assignSelectedClassId, assignStudentFormData);
    } else if (onUpdateTest) {
      onUpdateTest({
        ...assignModalTest,
        assignedClassId: assignSelectedClassId,
        assignedClassName: targetClassName,
        status: 'Đã nhập học',
      });
    }

    showToast(`Đã thêm học viên ${assignStudentFormData.name} vào ${targetClassName} thành công!`);
    setAssignModalTest(null);

    // If candidate detail modal is open for this student, sync its display
    if (selectedResponse && selectedResponse.id === assignModalTest.id) {
      setSelectedResponse((prev) =>
        prev
          ? {
              ...prev,
              assignedClassId: assignSelectedClassId,
              assignedClassName: targetClassName,
              status: 'Đã nhập học',
            }
          : null
      );
    }
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncFromCloudManual = async () => {
    setIsSyncingCloud(true);
    try {
      let serverCount = 0;
      try {
        const res = await fetch('/api/placement-tests');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            json.data.forEach((t: PlacementTest) => onAddTest(t));
            serverCount = json.data.length;
          }
        }
      } catch (err) {
        console.warn('Sync from /api/placement-tests:', err);
      }

      if (onSyncFromCloud) {
        await onSyncFromCloud();
      } else {
        const cloudDocs = await fetchCollection<PlacementTest>('placementTests');
        if (cloudDocs && cloudDocs.length > 0) {
          cloudDocs.forEach((t) => onAddTest(t));
        }
      }
      showToast(`Đã đồng bộ máy chủ thành công! (${serverCount > 0 ? `${serverCount} bài nộp ghi nhận` : 'Dữ liệu mới nhất'})`);
    } catch (e) {
      console.error(e);
      showToast('Đã có lỗi khi kết nối với máy chủ.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const allDisplayTests = React.useMemo(() => {
    let localSubmissions: PlacementTest[] = [];
    try {
      const raw = localStorage.getItem('idv_submitted_candidate_placement_tests');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localSubmissions = parsed;
      }
    } catch (e) {}

    const map = new Map<string, PlacementTest>();
    // Add props placement tests first
    placementTests.forEach((t) => map.set(t.id, t));
    // Add local candidate submissions
    localSubmissions.forEach((t) => map.set(t.id, t));
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [placementTests]);

  const filteredResponses = allDisplayTests.filter((t) => {
    const q = responseSearch.toLowerCase();
    return (
      t.candidateName.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.code && t.code.toLowerCase().includes(q))
    );
  });

  if (isSubmittedSuccessfully && submittedTest) {
    return (
      <div className="max-w-3xl mx-auto my-6 sm:my-10 px-4 space-y-6 animate-in fade-in">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-8 sm:p-10 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xs border-2 border-white/30 shadow-inner">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-sm font-bold uppercase tracking-wider mb-2 border border-white/20">
              IELTS DƯƠNG VŨ • HỆ THỐNG KHẢO THÍ TRỰC TUYẾN
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              NỘP BÀI KIỂM TRA ĐẦU VÀO THÀNH CÔNG!
            </h1>
            <p className="text-emerald-100 text-sm sm:text-sm mt-2 max-w-xl mx-auto">
              Bài thi của em đã được ghi nhận và lưu tự động vào cơ sở dữ liệu trung tâm để thầy cô phòng Đào tạo chấm điểm và xếp lớp.
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Candidate Confirmation Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                <span className="text-sm font-bold text-slate-500 uppercase">Thông tin bài thi</span>
                <span className="font-mono text-sm font-extrabold px-3 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-full">
                  MÃ BÀI: {submittedTest.code}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 block">Họ và tên thí sinh:</span>
                  <span className="font-bold text-slate-900 text-sm">{submittedTest.candidateName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại liên hệ:</span>
                  <span className="font-bold text-slate-900 text-sm">{submittedTest.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Địa chỉ Gmail:</span>
                  <span className="font-bold text-slate-900">{submittedTest.email || 'Chưa cung cấp'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày sinh:</span>
                  <span className="font-bold text-slate-900">{submittedTest.dob || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cơ sở đăng ký:</span>
                  <span className="font-bold text-emerald-800">{submittedTest.preferredCampus || 'Chưa chọn'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lịch học mong muốn:</span>
                  <span className="font-bold text-purple-900">{submittedTest.preferredSchedule || 'Chưa chọn'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Thời gian làm bài:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>{submittedTest.timeSpentFormatted || '55 phút'}</span>
                    {submittedTest.isOverdue ? (
                      <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Vượt mốc: +{submittedTest.overdueText}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✅ Đúng quy định 55 phút
                      </span>
                    )}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Mục tiêu đầu ra:</span>
                  <span className="font-bold text-amber-700">{submittedTest.targetLevel || 'Overall 6.5'}</span>
                </div>
              </div>
            </div>

            {/* Next steps notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm space-y-2 text-amber-950 font-medium">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Quy trình tiếp theo tại IELTS Dương Vũ:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>Thầy cô phòng Khảo thí sẽ chấm chi tiết bài Viết (Writing) và Phát âm (Speaking) của em.</li>
                <li>Bộ phận Tư vấn & Xếp lớp sẽ liên hệ qua SĐT <strong className="text-slate-900">{submittedTest.phone}</strong> hoặc Zalo để thông báo kết quả chi tiết và lịch khai giảng.</li>
                <li>Em có thể chụp ảnh lại màn hình này hoặc lưu mã bài thi <strong className="text-purple-900 font-mono">{submittedTest.code}</strong> để đối chiếu khi đến trung tâm.</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (!submittedTest) return;
                  navigator.clipboard.writeText(getReceiptZaloText(submittedTest));
                  setCopiedReceiptText(true);
                  showToast('✅ Đã sao chép biên nhận! Hãy gửi Zalo cho trợ lý/tư vấn viên.');
                  setTimeout(() => setCopiedReceiptText(false), 3000);
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-purple-950 font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                {copiedReceiptText ? <Check className="w-4 h-4 text-purple-950" /> : <Copy className="w-4 h-4 text-purple-950" />}
                <span>{copiedReceiptText ? 'Đã chép nội dung biên nhận!' : '💬 Gửi Zalo trợ lý biên nhận đã hoàn thành bài kiểm tra'}</span>
              </button>

              {!isStudentPortal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmittedSuccessfully(false);
                    setTopTab('responses');
                    setSelectedResponse(submittedTest);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Chi Tiết Trong Danh Sách Responses</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* =========================================================
          TOP GOOGLE FORM STYLE BAR (QUESTIONS vs RESPONSES)
         ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-amber-400 shrink-0">
            DV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wide">
                IELTS DƯƠNG VŨ
              </span>
              <span className="text-[11px] text-slate-400">
                {isStudentPortal ? 'Cổng Khảo Thí Trực Tuyến' : 'Đăng ký & Kiểm Tra Đầu Vào'}
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900 leading-tight mt-0.5">
              {isStudentPortal
                ? 'Bài Kiểm Tra Năng Lực Đầu Vào Trực Tuyến'
                : 'Form Kiểm Tra Đầu Vào Trực Tuyến'}
            </h2>
          </div>
        </div>

        {/* Tabs Switcher: Questions vs Responses & Schedule Manager for Admin */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {isManagement && (
            <button
              type="button"
              onClick={handleOpenScheduleEditModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all font-bold text-sm shadow-xs hover:scale-105 active:scale-95"
              title="Chỉnh sửa danh sách lịch học & ca học trong form kiểm tra đầu vào (Dành riêng cho Quản lý)"
            >
              <Settings2 className="w-4 h-4 text-amber-700" />
              <span>Chỉnh sửa lịch học</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-black">
                Quản lý
              </span>
            </button>
          )}

          {isManagement ? (
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-sm font-bold w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setTopTab('questions')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all ${
                  topTab === 'questions'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Questions (Làm bài test)</span>
              </button>

              <button
                type="button"
                onClick={() => setTopTab('responses')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all ${
                  topTab === 'responses'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Responses ({allDisplayTests.length})</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-mono">
                  Live
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* =========================================================
          VIEW 1: QUESTIONS TAB (7 SECTIONS FROM GOOGLE FORM)
         ========================================================= */}
      {topTab === 'questions' && (
        <div className="space-y-5">
          {/* LINK SHARING BANNER FOR ADMIN (Visible when in management view) */}
          {!isStudentPortal && (
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 border border-purple-800/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-purple-950 flex items-center justify-center shrink-0 font-black shadow-md">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-white">
                      Link Gửi Học Sinh Làm Bài (Tự Động Lưu Vào Hệ Thống)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Tự động lưu Firestore
                    </span>
                  </div>
                  <p className="text-sm text-purple-200">
                    Gửi link này cho học sinh qua Zalo/Facebook. Khi học sinh nộp bài, kết quả sẽ tự động lưu vào danh sách &quot;Responses&quot; để xếp lớp.
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-sm font-mono bg-black/50 px-3 py-1.5 rounded-xl border border-white/10 text-amber-300 break-all select-all">
                      {getPlacementTestUrl()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyStudentLink}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {copiedStudentLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedStudentLink ? 'Đã sao chép link!' : 'Sao chép link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyZaloMessage}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-1.5 transition-all border border-white/20 active:scale-95"
                  title="Sao chép mẫu tin nhắn kèm hướng dẫn gửi Zalo"
                >
                  {copiedZaloMsg ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4 text-emerald-300" />}
                  <span>{copiedZaloMsg ? 'Đã chép Zalo!' : 'Mẫu Zalo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.open(getPlacementTestUrl(), '_blank')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-1.5 transition-all border border-white/20 active:scale-95"
                  title="Mở link bài thi trong tab mới để học sinh làm thử"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở tab mới</span>
                </button>
              </div>
            </div>
          )}

          {/* Proctoring & Anti-Cheat Control Bar */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-black text-sm">
                  <span>Hệ Thống Giám Sát Chống Gian Lận (AI Anti-Cheat)</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    HOẠT ĐỘNG
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  Tự động phát hiện khi thoát tab, mở từ điển, ChatGPT hoặc thu nhỏ trình duyệt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Google Forms Style: Real-Time Auto-Save Draft Indicator */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium"
                title="Tự động lưu câu trả lời theo thời gian thực (Như Google Form)"
              >
                {autoSaveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span className="text-amber-300">Đang lưu bản nháp...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">
                      Đã lưu nháp {lastAutoSaveTime ? `(${lastAutoSaveTime})` : 'tự động'}
                    </span>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="ml-1 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-rose-300 hover:bg-slate-700 rounded-md transition-all cursor-pointer"
                  title="Xóa bản nháp để làm lại bài từ đầu"
                >
                  Làm mới
                </button>
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-mono font-bold border transition-all ${
                  isOverdue
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md animate-pulse'
                    : !hasTimerStarted
                    ? 'bg-slate-800 border-slate-700 text-amber-300'
                    : remainingSeconds <= 300
                    ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-emerald-300'
                }`}
                title={
                  !hasTimerStarted
                    ? 'Thời gian 55 phút sẽ bắt đầu tính từ khi em sang Mục 3 (Vocabulary)'
                    : isOverdue
                    ? `Đã vượt mốc thời gian quy định +${formatTimer(overdueSeconds)}`
                    : `Thời gian còn lại: ${formatTimer(remainingSeconds)}`
                }
              >
                <Clock className={`w-4 h-4 ${isOverdue ? 'text-white' : 'text-amber-400'}`} />
                <span>
                  {!hasTimerStarted
                    ? 'Thời gian: 55:00 (Bắt đầu ở Vocabulary)'
                    : isOverdue
                    ? `QUÁ GIỜ: +${formatTimer(overdueSeconds)}`
                    : `Còn: ${formatTimer(remainingSeconds)}`}
                </span>
              </div>

              {/* Tab-switch violation badge */}
              <div
                className={`px-3 py-1.5 rounded-xl text-sm font-bold border font-mono ${
                  tabSwitchCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-bounce'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {tabSwitchCount > 0 ? `⚠️ Rời tab: ${tabSwitchCount} lần` : '0 lần vi phạm tab'}
              </div>

              {/* Quick Submit button in top bar */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitExam()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
                title="Bấm để nộp bài kiểm tra và lưu kết quả ngay lập tức"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Nộp Bài Thi</span>
              </button>

              {/* Toggle Webcam Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  isCameraActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                <span>{isCameraActive ? 'Tắt Camera' : 'Bật Camera Giám Sát'}</span>
              </button>

              {/* Test simulate tab switch button (Manager only) */}
              {!isStudentPortal && (
                <button
                  type="button"
                  onClick={() => {
                    const timeStr = new Date().toLocaleTimeString('vi-VN');
                    const logMsg = `[${timeStr}] ⚠️ (Giả lập test) Thí sinh rời tab bài thi`;
                    setTabSwitchCount((prev) => prev + 1);
                    setAntiCheatLogs((prev) => [logMsg, ...prev]);
                    setLastViolationMsg('Giả lập: Thí sinh vừa rời khỏi tab kiểm tra đầu vào!');
                    setShowWarningModal(true);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-sm font-bold transition-colors"
                  title="Bấm để thử nghiệm cơ chế phát hiện rời tab"
                >
                  ⚡ Thử Rời Tab
                </button>
              )}
            </div>
          </div>

          {/* Floating Webcam Picture-In-Picture when active */}
          {isCameraActive && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-2xl p-2 w-56 text-white text-sm space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold px-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>AI Proctoring Live</span>
                </span>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="text-slate-400 hover:text-white"
                  title="Đóng camera"
                >
                  ✕
                </button>
              </div>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-32 object-cover rounded-xl bg-black" />
              <div className="text-[10px] text-slate-300 text-center font-medium">
                Camera đang theo dõi khuôn mặt thí sinh
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* DRAFT AUTO-RESTORED BANNER (Google Forms Style) */}
          {showDraftRestoredNotice && (
            <div className="p-3.5 px-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-sm flex items-center justify-between gap-3 flex-wrap shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0 font-bold">
                  <Cloud className="w-4 h-4 text-emerald-800" />
                </div>
                <span>
                  <strong>Khôi phục bản nháp:</strong> Hệ thống đã tự động khôi phục các câu trả lời gần nhất ({lastAutoSaveTime || 'trước đó'}) của em.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDraftRestoredNotice(false)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-all"
                  title="Xóa bản nháp này để bắt đầu lại từ đầu"
                >
                  Xóa làm lại
                </button>
              </div>
            </div>
          )}

          {/* OVERTIME WARNING ALERT BANNER */}
          {isOverdue && (
            <div className="p-4 bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-2 border-rose-400 rounded-3xl shadow-lg text-rose-950 text-sm flex items-start gap-3.5 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-sm text-rose-900 uppercase tracking-wide">
                    ⚠️ CẢNH BÁO: BẠN ĐÃ VƯỢT MỐC THỜI GIAN LÀM BÀI QUY ĐỊNH (55 PHÚT)
                  </span>
                  <span className="px-3 py-1 bg-rose-600 text-white font-mono font-black rounded-xl text-sm shadow-xs">
                    Vượt quá: +{formatTimer(overdueSeconds)} ({formatDurationText(overdueSeconds)})
                  </span>
                </div>
                <p className="text-rose-800 leading-relaxed font-medium">
                  Hệ thống <strong>vẫn cho phép em tiếp tục làm bài</strong> để hoàn thành trọn vẹn các phần thi. Tuy nhiên, thời gian làm bài thực tế và số phút vượt mốc sẽ được <strong>tự động lưu vào kết quả khảo thí</strong> để giáo viên đánh giá. Em vui lòng khẩn trương hoàn thiện và bấm <strong>Nộp bài</strong> sớm nhé!
                </p>
              </div>
            </div>
          )}

          {/* TIMER PREPARATION NOTICE (Sections 1 & 2) */}
          {!hasTimerStarted && currentSection < 3 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-950 text-sm flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Quy định thời gian:</strong> Thời gian làm bài là <strong>55 phút</strong>, hệ thống sẽ <strong>bắt đầu tính giờ khi em chuyển sang Mục 3 (Vocabulary test)</strong>.
                </span>
              </div>
              <span className="px-2.5 py-1 bg-purple-200/80 text-purple-900 font-mono font-bold rounded-lg text-[11px] shrink-0">
                ⏱️ Chưa tính giờ (Chuẩn bị)
              </span>
            </div>
          )}

          {/* SECTION STEPPER PILLS (1 of 7 to 7 of 7) */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-1 overflow-x-auto text-sm font-bold">
            {[
              { id: 1, title: 'Sec 1: Giới thiệu' },
              { id: 2, title: 'Sec 2: Thông tin cá nhân' },
              { id: 3, title: 'Sec 3: Vocabulary' },
              { id: 4, title: 'Sec 4: Listening' },
              { id: 5, title: 'Sec 5: Reading' },
              { id: 6, title: 'Sec 6: Writing' },
              { id: 7, title: 'Sec 7: Pronunciation' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentSection(s.id);
                  if (s.id >= 3 && !hasTimerStarted) {
                    setHasTimerStarted(true);
                    showToast('⏱️ Bắt đầu tính giờ làm bài (55 phút)! Chúc em làm bài thật tốt!');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  currentSection === s.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* THE FORM CONTAINER */}
          <div id="placement-test-form-container" className="max-w-4xl mx-auto bg-white rounded-3xl border border-purple-200/80 shadow-xl overflow-hidden scroll-mt-6">
            {/* Google Form Brand Header Image (Page 1 in PDF) */}
            <div className="bg-amber-500 text-center py-6 px-4 border-b-4 border-amber-600">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-wider drop-shadow-md">
                IELTS DƯƠNG VŨ
              </h1>
              <p className="text-amber-100 sm:text-xl font-bold tracking-wide mt-1.5 drop-shadow-xs">
                (9.0 đầu tiên ở Hải Phòng)
              </p>
            </div>

            <div className="p-6 sm:p-10 space-y-8">
              {/* ====================================================
                  SECTION 1 OF 7: BÀI KIỂM TRA ĐẦU VÀO - IELTS DƯƠNG VŨ
                 ==================================================== */}
              {currentSection === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 1 of 7</span>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">
                      Bài Kiểm Tra Đầu Vào - IELTS Dương Vũ
                    </h2>
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-sm text-slate-800 leading-relaxed font-medium">
                    <p className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>
                        Thời gian làm bài: 55 phút (hệ thống bắt đầu tính giờ từ khi chuyển sang Mục 3: Vocabulary; bao gồm 10 câu Từ vựng, 5 câu Nghe, 5 câu Đọc, 3 câu Viết + Đoạn văn, và Phát âm).
                      </span>
                    </p>
                    <p className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 font-bold">
                      ⚠️ Note: Em cần nơi yên tĩnh để làm bài, tốt nhất dùng máy tính, không dùng từ điển hay AI/ google.{' '}
                      <span className="underline">NẾU THOÁT RA ĐỂ TRA SẼ BỊ PHÁT HIỆN.</span>
                    </p>
                    <p className="font-bold text-amber-950">
                      📢 BUỔI 1 LẠI LÀM BÀI KIỂM TRA KHÁC TRỰC TIẾP TRÊN LỚP NỮA NÊN EM PHẢI TRUNG THỰC NHÉ.
                    </p>
                    <p className="text-slate-600 italic">Sau khi hoàn thành NHỚ chọn &apos;Submit&apos;.</p>

                    <div className="pt-2 border-t border-amber-200/80 space-y-1">
                      <p className="font-extrabold text-slate-900">📍 ĐỊA CHỈ LỚP HỌC:</p>
                      <p>• CS1: 51 TÔ HIỆU (TẦNG 4), LÊ CHÂN, HẢI PHÒNG</p>
                      <p>• CS2: 15/9 HÒA BÌNH, KIẾN AN, HẢI PHÒNG (gần cấp 3 Kiến An)</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(2)}
                      className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-2xl shadow-md transition-all flex items-center gap-2 text-sm"
                    >
                      <span>Tiếp tục: Điền thông tin cá nhân (Part 1)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================
                  SECTION 2 OF 7: PART 1: THÔNG TIN CÁ NHÂN (14 FIELDS)
                 ==================================================== */}
              {currentSection === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 2 of 7</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Part 1: Thông tin cá nhân</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Bạn cần điền chi tiết theo mẫu để Dương Vũ có thể tư vấn tốt nhất nhé. Các mục có dấu <span className="text-rose-500 font-bold">*</span> là bắt buộc.
                    </p>
                  </div>

                  <div className="space-y-5 text-sm">
                    {/* 1. Họ tên */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-black text-slate-800 block">
                        1. Họ tên của em <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Short answer text"
                        value={formData.candidateName}
                        onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* 2. SĐT của em & 3. SĐT phụ huynh */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="font-black text-slate-800 block">
                          2. Số điện thoại của em <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Short answer text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="font-black text-slate-800 block">
                          3. Số điện thoại phụ huynh <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="Short answer text"
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    {/* 4. Email / Gmail (BẮT BUỘC) */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-black text-slate-800 block">
                        4. Địa chỉ Gmail của em, không nên dùng của bố mẹ. Nếu chưa có em lập gmail riêng, sau này thầy còn gửi bài tập qua email <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="Nhập địa chỉ Gmail của em (ví dụ: nguyenvanan@gmail.com)"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* 5. Ngày tháng năm sinh & 6. Địa chỉ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="font-black text-slate-800 block">
                          5. Ngày tháng năm sinh <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="VD: 15/08/2008 hoặc 2008"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="font-black text-slate-800 block">
                          6. Địa chỉ nhà em, ghi phường/xã, quận/huyện <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Short answer text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    {/* 7. Chọn cơ sở (BẮT BUỘC) */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="font-black text-slate-800 block">
                        7. Chọn cơ sở em muốn đăng ký theo học <span className="text-rose-500">*</span>:
                      </label>
                      <div className="space-y-2">
                        {[
                          'CS1: 51 Tô Hiệu (tầng 4), Lê Chân, Hải Phòng',
                          'CS2: 15/9 Hòa Bình, Kiến An (gần cấp 3 Kiến An)',
                        ].map((campus) => (
                          <label
                            key={campus}
                            className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                              formData.preferredCampus === campus
                                ? 'bg-purple-50 border-purple-500 font-bold text-purple-950 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="campus"
                              required
                              checked={formData.preferredCampus === campus}
                              onChange={() => setFormData({ ...formData, preferredCampus: campus })}
                            />
                            <span>{campus}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 8. Chọn lịch học */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                        <label className="font-black text-slate-800 block text-sm">
                          8. Chọn lịch học của lớp em có thể học. Em sẽ học theo lịch sắp xếp của trung tâm tuần 2 buổi. <span className="text-rose-500">*</span>
                        </label>

                        {/* Chỉ hiển thị nút chỉnh sửa với Quản lý */}
                        {isManagement && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-700" />
                              <span>Quyền Quản Lý</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleOpenScheduleEditModal}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-xs transition-all hover:scale-105 active:scale-95"
                              title="Chỉnh sửa danh sách các ca/lịch học trong form đăng ký"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa lịch học</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {scheduleNote}
                      </p>

                      <div className="space-y-2">
                        {scheduleOptions.map((schedule, idx) => (
                          <label
                            key={idx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                              formData.preferredSchedule === schedule
                                ? 'bg-purple-50 border-purple-500 font-bold text-purple-950 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <input
                                type="radio"
                                name="schedule"
                                checked={formData.preferredSchedule === schedule}
                                onChange={() => setFormData({ ...formData, preferredSchedule: schedule })}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm leading-relaxed">{schedule}</span>
                            </div>

                            {/* Nút sửa nhanh nếu là Quản lý */}
                            {isManagement && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenScheduleEditModal();
                                }}
                                className="text-slate-400 hover:text-purple-700 p-1 rounded-lg hover:bg-purple-50 transition-colors shrink-0"
                                title="Quản lý chỉnh sửa danh sách lịch này"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </label>
                        ))}
                      </div>

                      {isManagement && (
                        <div className="pt-2 flex items-center justify-between text-[11px] text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Bạn đang đăng nhập với quyền <strong>Quản lý</strong>. Bạn có thể thêm, sửa, xóa các lớp dự kiến khai giảng ở đây.</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenScheduleEditModal}
                            className="font-bold underline hover:text-amber-950 shrink-0 ml-2"
                          >
                            Quản lý lịch học &gt;
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 9. Trường em đang theo học */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-black text-slate-800 block">
                        9. Trường em đang theo học <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: THPT Chuyên Trần Phú / Đại học Y Dược Hải Phòng"
                        value={formData.school}
                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* 10. Link Facebook */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-black text-slate-800 block">
                        10. Link facebook (chứ không chỉ ghi tên tài khoản nhé) để Dương Vũ add em vào nhóm của lớp. Tạo tài khoản nếu em chưa có nhé. <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="https://facebook.com/ten.cua.em"
                        value={formData.facebookLink}
                        onChange={(e) => setFormData({ ...formData, facebookLink: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* 11. Mục tiêu & 12. Khi nào cần chứng chỉ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="font-black text-slate-800 block">
                          11. Mục tiêu của em (Ví dụ: Overall 6.0) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Overall 6.5"
                          value={formData.targetLevel}
                          onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                        <label className="font-black text-slate-800 block">
                          12. Khi nào em cần chứng chỉ IELTS? <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Tháng 12/2026 trước kỳ thi tốt nghiệp"
                          value={formData.targetExamDate}
                          onChange={(e) => setFormData({ ...formData, targetExamDate: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    {/* 13. Kinh nghiệm IELTS */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-black text-slate-800 block">
                        13. Em đã học IELTS bao giờ chưa, nếu có ghi lại thời gian, tóm tắt qua nội dung đã học nhé:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Long answer text"
                        value={formData.previousIeltsExperience}
                        onChange={(e) => setFormData({ ...formData, previousIeltsExperience: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    {/* 14. Nguồn biết đến */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-black text-slate-800 block">
                        14. Em biết đến IELTS Dương Vũ qua nguồn nào? Nếu có người giới thiệu, vui lòng ghi tên người giới thiệu nhé:
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text"
                        value={formData.referralSource}
                        onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(1)}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.candidateName.trim()) {
                          showToast('Vui lòng nhập Họ và tên của em!');
                          return;
                        }
                        if (!formData.phone.trim()) {
                          showToast('Vui lòng nhập Số điện thoại của em!');
                          return;
                        }
                        if (!formData.parentPhone.trim()) {
                          formData.parentPhone = formData.phone;
                        }
                        if (!formData.email.trim()) {
                          formData.email = `${formData.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
                        }
                        if (!formData.dob) {
                          formData.dob = '2008-01-15';
                        }
                        if (!formData.preferredCampus.trim()) {
                          formData.preferredCampus = '51 Tô Hiệu';
                        }
                        if (!formData.preferredSchedule.trim()) {
                          formData.preferredSchedule = 'Lớp PRE (Thứ 2 + Thứ 5 hoặc Thứ 3 + Thứ 6)';
                        }
                        setCurrentSection(3);
                        if (!hasTimerStarted) {
                          setHasTimerStarted(true);
                          showToast('⏱️ Bắt đầu tính giờ làm bài (55 phút)! Chúc em làm bài thật tốt!');
                        }
                      }}
                      className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Tiếp tục: Vocabulary Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================
                  SECTION 3 OF 7: VOCABULARY TEST (10 QUESTIONS)
                 ==================================================== */}
              {currentSection === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 3 of 7</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Vocabulary test</h2>
                    <p className="text-sm text-slate-500 mt-1">Choose the best answer</p>
                  </div>

                  {/* Timer Start Notice in Section 3 */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-sm flex items-center justify-between gap-3 flex-wrap shadow-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        ⏱️ <strong>Hệ thống đang tính giờ làm bài (55 phút)!</strong> Hãy phân bổ thời gian cẩn thận giữa các phần thi.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      {isOverdue ? (
                        <span className="px-2.5 py-1 bg-rose-600 text-white font-black rounded-lg">
                          QUÁ GIỜ: +{formatTimer(overdueSeconds)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-200 text-emerald-950 font-bold rounded-lg">
                          Còn lại: {formatTimer(remainingSeconds)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    {[
                      {
                        key: 'q1',
                        title: '1. At the weekend I ________ with some friends - we went for a curry, then had a couple of drinks.',
                        options: ['went out', 'played', 'enjoyed', 'went for fun'],
                      },
                      {
                        key: 'q2',
                        title: '2. Every time I wear something white, I ________ coffee or orange juice or something on it.',
                        options: ['let', 'spill', 'pour', 'drop'],
                      },
                      {
                        key: 'q3',
                        title: '3. I love all fruit, but ________ strawberries.',
                        options: ['specially', 'mostly', 'especially', 'specifically'],
                      },
                      {
                        key: 'q4',
                        title: "4. I don't ________ going out tonight.",
                        options: ['have mood to', 'like', 'want to', 'feel like'],
                      },
                      {
                        key: 'q5',
                        title: "5. I've been so busy all week. I don't want to do anything at the weekend - I'll just stay at home and ________",
                        options: ['make a rest', 'make it easy', 'take it easy', 'have a relax'],
                      },
                      {
                        key: 'q6',
                        title: "6. It's a good idea, but it's ________ that the boss will agree with you.",
                        options: ['unlikely', 'improbably', 'unprobably', 'likely'],
                      },
                      {
                        key: 'q7',
                        title: "7. Excuse me, I think you've ________ a mistake in our bill.",
                        options: ['given', 'done', 'had', 'made'],
                      },
                      {
                        key: 'q8',
                        title: '8. They never argue and they enjoy spending time together. = They ________',
                        options: ['like themselves very much', 'have relationship very good', 'get on very well', 'relate very well'],
                      },
                      {
                        key: 'q9',
                        title: "9. You can't smoke here - please ________ your cigarette.",
                        options: ['put away', 'put up with', 'put down', 'put out'],
                      },
                      {
                        key: 'q10',
                        title: "10. I don't like my job very much. I'm going to ________ and look for another one",
                        options: ['end', 'retire', 'finish', 'resign'],
                      },
                    ].map((item) => (
                      <div key={item.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {item.options.map((opt) => (
                            <label
                              key={opt}
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                                formData.vocabAnswers[item.key] === opt
                                  ? 'bg-purple-50 border-purple-500 font-bold text-purple-900 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name={item.key}
                                checked={formData.vocabAnswers[item.key] === opt}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    vocabAnswers: { ...formData.vocabAnswers, [item.key]: opt },
                                  })
                                }
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(2)}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentSection(4)}
                      className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Tiếp tục: Listening Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================
                  SECTION 4 OF 7: LISTENING TEST
                 ==================================================== */}
              {currentSection === 4 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 4 of 7</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Listening Test</h2>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-sm font-medium mt-2 space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-slate-800">
                        Em kéo xuống đọc câu hỏi trước rồi bấm nghe nhé
                      </p>
                      <p className="font-bold text-amber-900">
                        Bấm vào clip đính kèm để làm bài nghe, em chỉ được nghe 1 lần nhé, nghe 2 lần sẽ bị trừ điểm. Hệ thống lưu lại được em bấm nghe mấy lần!
                      </p>
                      <p className="font-bold text-slate-700">
                        Time: 5 minutes
                      </p>
                    </div>
                  </div>

                  {/* Clip Nghe Gốc Dương Vũ IELTS (YouTube Embed) */}
                  <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Volume2 className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <span className="font-black text-sm sm:text-sm text-white block">
                            Audio Gốc: BÀI KIỂM TRA ĐẦU VÀO LISTENING - IELTS DƯƠNG VŨ
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Nguồn chính thức từ kênh DƯƠNG VŨ IELTS
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextCount = listenPlayCount + 1;
                            setListenPlayCount(nextCount);
                            if (nextCount > 1) {
                              showToast('⚠️ Cảnh báo: Em đã bấm nghe lần thứ ' + nextCount + '! (Theo quy định sẽ bị trừ điểm)');
                            } else {
                              showToast('Đã xác nhận lượt nghe bài thi 1/1');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-mono text-[11px] font-bold"
                          title="Ghi nhận lượt nghe"
                        >
                          Lượt nghe: <span className={listenPlayCount > 1 ? 'text-rose-400' : 'text-emerald-400'}>{listenPlayCount}/1</span>
                        </button>
                      </div>
                    </div>

                    {/* Audio Player for Listening Test */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner p-4 flex flex-col items-center justify-center min-h-[120px]">
                      <div className="flex items-center gap-3 mb-4 w-full px-4">
                        <Music className="w-6 h-6 text-emerald-400" />
                        <span className="text-white font-bold text-sm">BÀI KIỂM TRA ĐẦU VÀO LISTENING - IELTS DƯƠNG VŨ</span>
                      </div>
                      <audio
                        ref={listeningAudioRef}
                        src={listeningAudioSource}
                        controls
                        className="w-full max-w-2xl h-12"
                        controlsList="nodownload"
                        onPlay={() => {
                          const nextCount = listenPlayCount + 1;
                          setListenPlayCount(nextCount);
                          if (nextCount >= 2) {
                            showToast('⚠️ Cảnh báo: Em đã bấm nghe lần thứ ' + nextCount + '! (Theo quy định sẽ bị trừ điểm)');
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400 pt-1 flex-wrap gap-2">
                      <span className="text-[11px]">
                        👉 Bấm nút <strong className="text-white">Play ▶</strong> trên thanh phát âm thanh để bắt đầu nghe. Em chỉ được nghe đúng 1 lần.
                      </span>
                      <span className="text-[11px] text-amber-300 font-medium">
                        Khuyến khích đeo tai nghe để làm bài đạt kết quả tốt nhất
                      </span>
                    </div>
                  </div>

                  {/* Questions: Guitar Lesson Booking Form */}
                  <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-4 text-sm">
                    <h4 className="font-black text-sm text-purple-950">Guitar Lesson Booking Form</h4>

                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <label className="font-bold text-slate-800 block mb-1">
                          Student&apos;s name: Emily 1. ________:
                        </label>
                        <input
                          type="text"
                          placeholder="Short answer text"
                          value={formData.listeningAnswers.q1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listeningAnswers: { ...formData.listeningAnswers, q1: e.target.value },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <label className="font-bold text-slate-800 block mb-1">
                          Address: 2. ________ Street:
                        </label>
                        <input
                          type="text"
                          placeholder="Short answer text"
                          value={formData.listeningAnswers.q2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listeningAnswers: { ...formData.listeningAnswers, q2: e.target.value },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <label className="font-bold text-slate-800 block mb-1">
                          Course fee: 3. £________:
                        </label>
                        <input
                          type="text"
                          placeholder="Short answer text"
                          value={formData.listeningAnswers.q3}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listeningAnswers: { ...formData.listeningAnswers, q3: e.target.value },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <label className="font-bold text-slate-800 block mb-1">
                          First lesson: 4. ________ morning:
                        </label>
                        <input
                          type="text"
                          placeholder="Short answer text"
                          value={formData.listeningAnswers.q4}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listeningAnswers: { ...formData.listeningAnswers, q4: e.target.value },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <label className="font-bold text-slate-800 block mb-1">
                          Bring a 5. ________ to the first class:
                        </label>
                        <input
                          type="text"
                          placeholder="Short answer text"
                          value={formData.listeningAnswers.q5}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              listeningAnswers: { ...formData.listeningAnswers, q5: e.target.value },
                            })
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(3)}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentSection(5)}
                      className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Tiếp tục: Reading Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================
                  SECTION 5 OF 7: READING TEST
                 ==================================================== */}
              {currentSection === 5 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 5 of 7</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Reading test</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Read the passage below and fill in the gaps. Choose <strong>ONE WORD or A NUMBER only</strong>.
                      <br />
                      Time: 10 minutes.
                    </p>
                  </div>

                  {/* Reading Passage from PDF Page 5 */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                    <p>
                      There are many websites on the internet which provide lists of the world&apos;s best cities to visit, live or work in. These lists usually grade the cities in order, from &apos;best&apos; to &apos;worst&apos;, and are based on facts and figures provided by local or national organisations. The City Brands Index (CBI) also provides a list of best and worst cities. However, unlike other surveys, it is based on the idea that cities are similar to products in shops. It asks ordinary people in other countries to grade cities in the same way that they would grade a product, like a soft drink or a car. What is particularly different about the CBI is that the people who take part in the survey may not have ever visited the cities. Instead, they are asked to say what they think the cities are like, basing their opinions on things like news stories, magazine articles or television programmes they have heard or seen.
                    </p>
                    <p>
                      Each year, about 10,000 people in 20 countries take part in the CBI survey, and they grade a total of 50 cities. They do this by filling in an online questionnaire. There are several categories in the survey. These include things like the economy, education, the environment, local culture, climate and what the city&apos;s residents are like. The CBI list is useful because it helps people choose a good place to live, find work or take a holiday. It also helps regional governments to understand why people and businesses are, or are not, coming to their cities, and so shows them areas which they could develop or improve.
                    </p>
                  </div>

                  {/* 5 Gap-fill Questions */}
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="font-bold text-slate-800 block mb-1">
                        The CBI believes that cities are like 1. ________ which people can buy when they go shopping.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (ONE WORD only)"
                        value={formData.readingAnswers.q1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            readingAnswers: { ...formData.readingAnswers, q1: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="font-bold text-slate-800 block mb-1">
                        Surveys take place every 2. ________
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (ONE WORD only)"
                        value={formData.readingAnswers.q2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            readingAnswers: { ...formData.readingAnswers, q2: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="font-bold text-slate-800 block mb-1">
                        A maximum of 3. ________ cities are included in the survey.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (A NUMBER only)"
                        value={formData.readingAnswers.q3}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            readingAnswers: { ...formData.readingAnswers, q3: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="font-bold text-slate-800 block mb-1">
                        The CBI list is helpful for: people who are trying to decide where to 4. ________ or get a job.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (ONE WORD only)"
                        value={formData.readingAnswers.q4}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            readingAnswers: { ...formData.readingAnswers, q4: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="font-bold text-slate-800 block mb-1">
                        The CBI list is helpful for: local 5. ________ who want to make their city a better place.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (ONE WORD only)"
                        value={formData.readingAnswers.q5}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            readingAnswers: { ...formData.readingAnswers, q5: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(4)}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentSection(6)}
                      className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Tiếp tục: Writing Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================
                  SECTION 6 OF 7: WRITING TEST (PART A & PART B)
                 ==================================================== */}
              {currentSection === 6 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 6 of 7</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Writing Test</h2>
                  </div>

                  {/* Part A: Write full sentences */}
                  <div className="space-y-4 text-sm">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <h4 className="font-black text-purple-950 text-sm">A. Write full sentences</h4>
                      <p className="text-[11px] text-purple-700">Time: 5 minutes</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        1. Use/ mobile phone/ much/ can/ do/ more harm/ good.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (Write full complete sentence)"
                        value={formData.writingSentences.q1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            writingSentences: { ...formData.writingSentences, q1: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        2. There/ a number of/ benefit/ use / mobile phone.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (Write full complete sentence)"
                        value={formData.writingSentences.q2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            writingSentences: { ...formData.writingSentences, q2: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        3. government/ need/ find/ solution/ problem.
                      </label>
                      <input
                        type="text"
                        placeholder="Short answer text (Write full complete sentence)"
                        value={formData.writingSentences.q3}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            writingSentences: { ...formData.writingSentences, q3: e.target.value },
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-medium"
                      />
                    </div>

                    {/* Part B: Writing a paragraph */}
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2 mt-4">
                      <h4 className="font-black text-purple-950 text-sm">B. Writing a paragraph</h4>
                      <p className="text-[11px] text-purple-700">Time: 10 minutes</p>
                      <p className="font-bold text-slate-800 leading-snug">
                        Write a short paragraph (4 sentences) about the reasons why you want to study IELTS. If you are confident, you can write about the benefits of studying abroad.{' '}
                        <strong className="text-purple-900 underline">CHOOSE ONE TOPIC ONLY.</strong>
                      </p>
                      <textarea
                        rows={5}
                        placeholder="Long answer text (Viết tối thiểu 4 câu hoàn chỉnh tiếng Anh...)"
                        value={formData.writingParagraph}
                        onChange={(e) => setFormData({ ...formData, writingParagraph: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(5)}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentSection(7)}
                      className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Tiếp tục: Pronunciation & Speaking</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ====================================================
                  SECTION 7 OF 7: PRONUNCIATION AND SPEAKING
                 ==================================================== */}
              {currentSection === 7 && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-sm font-bold text-slate-400">Section 7 of 7</span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Pronunciation and speaking</h2>
                  </div>

                  {/* Reading Dialogue Script from PDF Page 6 */}
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-sm sm:text-base text-slate-900 font-sans leading-relaxed">
                    <div className="font-extrabold text-purple-950 text-base pb-2 border-b border-slate-200 flex items-center justify-between">
                      <span>An Outdoor Exhibit (Speaking Script)</span>
                      <span className="text-sm font-normal text-slate-500">Đọc to rõ ràng đoạn hội thoại sau trước khi ghi âm</span>
                    </div>
                    <p className="py-0.5"><strong>A:</strong> Do you like photographs?</p>
                    <p className="py-0.5"><strong>B:</strong> What kind of photos?</p>
                    <p className="py-0.5"><strong>A:</strong> Photos of plants and animals, for example. Or mountains and oceans.</p>
                    <p className="py-0.5"><strong>B:</strong> The sort of photographs a nature magazine would publish.</p>
                    <p className="py-0.5"><strong>A:</strong> That&apos;s right.</p>
                    <p className="py-0.5"><strong>B:</strong> Of course! I love nature photos. They are very beautiful.</p>
                    <p className="py-0.5"><strong>A:</strong> Some of them are very colorful.</p>
                    <p className="py-0.5"><strong>B:</strong> Yes. Most nature photos are so interesting. Sometimes, I buy nature magazines just for the photos.</p>
                    <p className="py-0.5"><strong>A:</strong> Me, too. I like taking nature photos with my camera. But they are not very good.</p>
                    <p className="py-0.5"><strong>B:</strong> My photos are not good, either. Famous nature magazines only publish very good photos.</p>
                    <p className="py-0.5"><strong>A:</strong> That&apos;s true. People must be very talented to get their photos published.</p>
                  </div>

                  {/* Voice Recorder Tool with Auto-Save */}
                  <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-rose-400" />
                        <span className="font-bold text-sm">Ghi âm bài Speaking trực tiếp (Tự động lưu khi bấm dừng):</span>
                      </div>
                      {isRecording && (
                        <span className="text-sm font-mono text-rose-400 font-bold animate-pulse flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          ● ĐANG THU ÂM {recordingSeconds}s
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={handleToggleRecord}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                          isRecording
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        <span>{isRecording ? 'Dừng & Tự Động Lưu Ghi Âm' : 'Bắt Đầu Ghi Âm Bài Đọc'}</span>
                      </button>

                      {hasRecorded && (
                        <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-700 px-3 py-1.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã tự động lưu bản ghi âm ({recordingSeconds}s)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submit Action Bar */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentSection(6)}
                      className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmitExam()}
                      className={`px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center gap-2 text-sm cursor-pointer ${
                        isSubmitting ? 'opacity-75 cursor-not-allowed' : 'active:scale-95'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang Nộp Bài & Lưu Vào Hệ Thống...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Nộp Bài Kiểm Tra (Submit) & Lưu Vào Hệ Thống</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 2: RESPONSES TAB (KẾT QUẢ & XUẤT GOOGLE SHEETS)
         ========================================================= */}
      {topTab === 'responses' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Metric Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng số phản hồi</div>
              <div className="text-2xl font-black text-purple-900 mt-0.5">{allDisplayTests.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Thí sinh đã nộp bài</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Điểm TB Overall</div>
              <div className="text-2xl font-black text-amber-600 mt-0.5">
                {(
                  allDisplayTests.reduce((acc, c) => acc + (c.overallScore || 0), 0) /
                    (allDisplayTests.length || 1)
                ).toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Band điểm trung bình</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Phát hiện rời tab</div>
              <div className="text-2xl font-black text-rose-600 mt-0.5">
                {allDisplayTests.filter((t) => (t.tabSwitchCount || 0) > 0).length}
              </div>
              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Bài có cảnh báo gian lận</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Giám sát Camera</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {allDisplayTests.filter((t) => t.cameraEnabled).length}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Thí sinh bật camera</div>
            </div>
          </div>

          {/* Google Sheets Link & Data Integration Hub */}
          <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-purple-950 p-5 rounded-3xl text-white shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">
                    Link Liên Kết Google Sheet (Lưu & Xem Lại Toàn Bộ Dữ Liệu)
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    57 Cột Chi Tiết
                  </span>
                </div>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Mỗi mục thí sinh điền hay làm bài (10 câu từ vựng, 5 câu nghe, 5 câu đọc, 3 câu viết, đoạn văn, link ghi âm speaking, điểm số, chống gian lận) đều được xuất ra một cột riêng biệt chuẩn Google Sheets.
                </p>
              </div>

              {/* Action Buttons for Google Sheets */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenGoogleSheet}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-sm font-black shadow-md transition-all"
                  title="Mở Google Sheet đã lưu để xem lại dữ liệu"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Google Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGoogleSheetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/15 transition-all"
                  title="Đổi hoặc cập nhật link liên kết Google Sheet"
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Đổi Link Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportCsvModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-black shadow-md transition-all cursor-pointer"
                  title="Nhập dữ liệu bài thi từ bảng tính Google Sheet (Dán CSV hoặc TSV)"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Nhập Từ Sheet (Dán CSV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowColumnListModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/15 transition-all"
                  title="Xem danh sách 57 cột dữ liệu"
                >
                  <Table className="w-3.5 h-3.5 text-purple-300" />
                  <span>Xem 57 Cột</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAppsScriptModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-xl text-sm font-bold border border-purple-400/30 transition-all"
                  title="Cấu hình Google Apps Script để tự động ghi khi thí sinh nộp bài"
                >
                  <Code className="w-3.5 h-3.5 text-purple-300" />
                  <span>Webhook Tự Động</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleCreateAndSyncGoogleSheet}
                  disabled={isSyncingSheet}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                  title="Tự động tạo Sheet mới và đồng bộ dữ liệu bằng API"
                >
                  {isSyncingSheet ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{isSyncingSheet ? 'Đang tạo...' : 'Tạo & Đồng bộ API'}</span>
                </button>
              </div>
            </div>

            {/* Quick Export & Copy Action Bar */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300 truncate max-w-lg">
                <span className="text-slate-400 shrink-0 font-medium">Link hiện tại:</span>
                <span className="font-mono text-emerald-300 text-[11px] truncate underline cursor-pointer" onClick={handleOpenGoogleSheet}>
                  {googleSheetUrl || 'Chưa lưu link Google Sheet'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyGoogleSheetsTSV}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-xs transition-all"
                  title="Sao chép toàn bộ 57 cột dạng bảng để dán (Ctrl+V) vào Google Sheet"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép 57 Cột (Ctrl+V vào Sheet)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportGoogleSheetCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all"
                  title="Tải file CSV tiếng Việt chuẩn Google Sheets"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file CSV (57 cột)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Export & Search Buttons */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên thí sinh, SĐT, email..."
                  value={responseSearch}
                  onChange={(e) => setResponseSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              <span className="text-sm text-slate-500 font-semibold">
                Tổng cộng: <strong className="text-purple-900">{filteredResponses.length}</strong> bài thi
              </span>

              <button
                type="button"
                onClick={handleSyncFromCloudManual}
                disabled={isSyncingCloud}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all disabled:opacity-50"
                title="Tải lại toàn bộ bài kiểm tra nộp thành công từ Cloud Firestore"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Đồng bộ Cloud'}</span>
              </button>

              {/* Open Google Form in new tab */}
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở Google Form gốc</span>
              </a>
            </div>
          </div>

          {/* Table of Candidate Responses */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Thí sinh</th>
                    <th className="py-3 px-3">Liên hệ</th>
                    <th className="py-3 px-3">Cơ sở & Lịch học</th>
                    <th className="py-3 px-3 text-center">Điểm kỹ năng</th>
                    <th className="py-3 px-3 text-center">Overall</th>
                    <th className="py-3 px-3">Khóa đề xuất</th>
                    <th className="py-3 px-3 text-center">Xếp lớp học</th>
                    <th className="py-3 px-3 text-center">Anti-Cheat / Cam</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResponses.map((test) => {
                    const isFailed = test.status === 'Không đạt' || test.recommendedCourse === 'Không Đạt';
                    const isEnrolled = test.status === 'Đã nhập học' || !!test.assignedClassId;

                    return (
                      <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-extrabold text-slate-900">{test.candidateName}</div>
                          <div className="text-[11px] text-slate-400">
                            {test.code} • {formatDateVN(test.dob) || '2008'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-mono text-slate-700 font-semibold">{test.phone}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{test.email}</div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-slate-800 font-medium truncate max-w-[160px]">
                            {test.preferredCampus || 'CS1: 51 Tô Hiệu'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                            {test.preferredSchedule || 'Thứ 4 & Thứ 7'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                            <span title="Listening" className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">
                              L:{test.listeningScore}
                            </span>
                            <span title="Reading" className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                              R:{test.readingScore}
                            </span>
                            <span title="Writing" className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 font-bold">
                              W:{test.writingScore}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-black text-sm text-purple-800">
                          {test.overallScore}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickSetCourse(test, 'Khóa 1')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                  test.recommendedCourse === 'Khóa 1'
                                    ? 'bg-purple-600 text-white border-purple-700 shadow-2xs'
                                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                }`}
                                title="Xếp vào Khóa 1 (PRE)"
                              >
                                Khóa 1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickSetCourse(test, 'Khóa 2')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                  test.recommendedCourse === 'Khóa 2'
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                }`}
                                title="Xếp vào Khóa 2 (INSPIRE)"
                              >
                                Khóa 2
                              </button>
                            </div>
                            {test.comment && (
                              <div
                                onClick={() => handleOpenNoteModal(test)}
                                className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 cursor-pointer truncate max-w-[130px]"
                                title={`Ghi chú: ${test.comment} (bấm để sửa)`}
                              >
                                📝 {test.comment}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* NÚT THÊM VÀO LỚP SAU KHI CÓ ĐIỂM ĐẠT */}
                        <td className="py-3 px-3 text-center">
                          {isFailed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Không đạt
                            </span>
                          ) : isEnrolled ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-emerald-600" />
                                <span>{test.assignedClassName || 'Đã vào lớp'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(test)}
                                className="text-[9px] text-purple-700 hover:text-purple-900 font-bold underline"
                              >
                                Đổi lớp
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(test)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
                              title="Thêm học viên này vào lớp học ngay sau khi có điểm đạt"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Thêm vào lớp</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {(test.tabSwitchCount || 0) > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                ⚠️ Rời tab: {test.tabSwitchCount}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✅ Nghiêm túc
                              </span>
                            )}
                            {test.cameraEnabled && (
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5" /> Có bật cam
                              </span>
                            )}
                            {(test.speakingAudioUrl || test.testAnswers?.speakingAudioUrl) ? (
                              <button
                                type="button"
                                onClick={() => setSelectedResponse(test)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 transition-all shadow-2xs"
                                title="Bấm để mở và nghe file ghi âm bài nói Speaking của thí sinh"
                              >
                                <Volume2 className="w-3 h-3 text-blue-600 animate-pulse" />
                                <span>Nghe nói ({test.speakingAudioDuration || test.testAnswers?.speakingAudioDuration || 45}s)</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-medium">Chưa có ghi âm</span>
                            )}
                            {test.isOverdue ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300"
                                title={`Thời gian làm bài: ${test.timeSpentFormatted || ''}`}
                              >
                                ⏱️ Quá giờ: +{test.overdueText}
                              </span>
                            ) : test.timeSpentFormatted ? (
                              <span className="text-[10px] text-slate-500 font-mono font-medium" title="Thời gian làm bài">
                                ⏱️ {test.timeSpentFormatted}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleCopyReport(test, e)}
                              className="px-2.5 py-1 text-[11px] font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 flex items-center gap-1 transition-all"
                              title="Sao chép báo cáo kết quả gửi phụ huynh"
                            >
                              {copiedId === test.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-purple-600" />
                              )}
                              <span>{copiedId === test.id ? 'Đã copy' : 'Báo cáo PH'}</span>
                            </button>
                            {(test.speakingAudioUrl || test.testAnswers?.speakingAudioUrl) && (
                              <button
                                type="button"
                                onClick={() => setSelectedResponse(test)}
                                className="px-2.5 py-1 text-[11px] font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 rounded-lg border border-sky-300 flex items-center gap-1 transition-all"
                                title="Nghe bài nói Speaking của thí sinh"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                                <span>Nghe nói</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedResponse(test)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenNoteModal(test)}
                              className={`px-2 py-1 text-[11px] font-bold rounded-lg border flex items-center gap-1 transition-all ${
                                test.comment
                                  ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border-slate-300'
                              }`}
                              title="Thêm hoặc chỉnh sửa ghi chú"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-600" />
                              <span>Ghi chú</span>
                              {test.comment && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteResponse(test)}
                              className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center gap-1 transition-all"
                              title="Xóa bài thi này khỏi hệ thống"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredResponses.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                        Chưa có dữ liệu phản hồi nào phù hợp với tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 1: CẢNH BÁO GIAN LẬN / THOÁT TAB & MỞ HÉ ĐA NHIỆM
         ========================================================= */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-rose-500 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-rose-600">CẢNH BÁO VI PHẠM RỜI MÀN HÌNH!</h3>
              <p className="text-sm font-bold text-slate-800">
                {lastViolationMsg || 'Hệ thống vừa phát hiện hành vi chuyển tab hoặc mở ứng dụng khác.'}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-sm text-rose-950 font-medium text-left space-y-1.5">
              <p>
                • <strong>Số lần vi phạm:</strong> <span className="font-black text-rose-700">Lần thứ {tabSwitchCount}</span>.
              </p>
              <p>• <strong>Quy định:</strong> Thí sinh cần làm bài trung thực và tập trung trên màn hình này.</p>
              <p className="text-slate-600 text-[11px]">
                • Hệ thống đã ghi nhận số lần vi phạm vào phiếu điểm gửi Giáo viên. Em vui lòng bấm nút bên dưới để tiếp tục làm bài.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowWarningModal(false);
                setIsWindowBlurred(false);
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Tôi Đã Hiểu — Tiếp Tục Làm Bài</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: CHI TIẾT BÀI THI & ĐÁNH GIÁ XẾP KHÓA CỦA THÍ SINH
         ========================================================= */}
      {selectedResponse && (() => {
        const evalRes = evaluatePlacementResult(
          selectedResponse.testAnswers?.vocab,
          selectedResponse.testAnswers?.listening,
          selectedResponse.testAnswers?.reading,
          selectedResponse.testAnswers?.writingSentences,
          evalWritingErrorLevel
        );

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Chi Tiết & Đánh Giá Bài Test Đầu Vào</h3>
                  <p className="text-sm text-slate-500">
                    Thí sinh: <strong className="text-slate-900">{selectedResponse.candidateName}</strong> ({selectedResponse.code})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Nút Thêm vào lớp sau khi có điểm đạt */}
                  {evalStatus !== 'Không đạt' && evalRecommendedCourse !== 'Không Đạt' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(selectedResponse)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
                      title="Thêm học viên vào lớp học hoặc chuyển lớp"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{selectedResponse.status === 'Đã nhập học' ? 'Chuyển Lớp Học' : 'Thêm Vào Lớp Học'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleCopyReport(selectedResponse, e)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
                    title="Sao chép toàn bộ kết quả bài làm để gửi báo cáo phụ huynh"
                  >
                    {copiedId === selectedResponse.id ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedId === selectedResponse.id ? 'Đã Sao Chép Báo Cáo!' : '📋 Sao Chép Báo Cáo Phụ Huynh'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteResponse(selectedResponse)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                    title="Xóa vĩnh viễn bài thi này khỏi hệ thống"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xóa bài thi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResponse(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Candidate Info Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">SĐT Thí sinh</span>
                  <strong className="text-slate-800">{selectedResponse.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SĐT Phụ huynh</span>
                  <strong className="text-slate-800">{selectedResponse.parentPhone || 'Chưa có'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cơ sở đăng ký</span>
                  <strong className="text-slate-800">{selectedResponse.preferredCampus || 'CS1: 51 Tô Hiệu'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Lịch học dự kiến</span>
                  <strong className="text-slate-800">{selectedResponse.preferredSchedule || 'Thứ 4 & Thứ 7'}</strong>
                </div>
              </div>

              {/* SECTION: MỤC ĐÁNH GIÁ KẾT QUẢ THEO QUY ĐỊNH */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-2xl border-2 border-purple-200/80 space-y-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <h4 className="font-black text-slate-900 text-sm">Mục Đánh Giá Kết Quả & Phân Khóa Học</h4>
                  </div>
                  <span className="text-[11px] text-purple-800 font-semibold bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                    Áp dụng quy chuẩn đánh giá của trung tâm
                  </span>
                </div>

                {/* 4 Quy chuẩn đánh giá */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tiêu chí 1: Từ vựng */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">1. Từ vựng (Vocabulary):</span>
                      <strong className="text-purple-700 font-mono text-sm">{evalRes.vocabCorrect}/10 câu</strong>
                    </div>
                    <p className="text-[10px] text-slate-500">Quy định: Nếu từ vựng dưới 5 xếp Khóa 1.</p>
                    <div className="pt-1">
                      {evalRes.vocabCorrect < 5 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md">
                          ⚠️ Dưới 5 câu (Xếp Khóa 1)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                          ✅ Đạt yêu cầu từ vựng (≥ 5/10)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tiêu chí 2: Nghe */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">2. Kỹ năng Nghe (Listening):</span>
                      <span className="text-slate-700 text-sm">
                        Đúng <strong className="text-blue-700 font-mono">{evalRes.listeningCorrect}/5</strong> (Sai <strong className="text-rose-600 font-mono">{evalRes.listeningWrong}</strong> câu)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Quy định: Nếu nghe sai 3 thì báo Không Đạt.</p>
                    <div className="pt-1">
                      {evalRes.listeningWrong >= 3 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-md">
                          🔴 Nghe sai ≥ 3 câu (Không Đạt)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                          ✅ Đạt kỹ năng nghe (Sai {evalRes.listeningWrong}/5)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tiêu chí 3: Đọc */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">3. Kỹ năng Đọc (Reading):</span>
                      <span className="text-slate-700 text-sm">
                        Đúng <strong className="text-emerald-700 font-mono">{evalRes.readingCorrect}/5</strong> (Sai <strong className="text-rose-600 font-mono">{evalRes.readingWrong}</strong> câu)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Quy định: Nếu đọc sai 3 thì báo Không Đạt.</p>
                    <div className="pt-1">
                      {evalRes.readingWrong >= 3 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-md">
                          🔴 Đọc sai ≥ 3 câu (Không Đạt)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                          ✅ Đạt kỹ năng đọc (Sai {evalRes.readingWrong}/5)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tiêu chí 4: Viết câu & Ngữ pháp */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">4. Viết câu (Writing Part A):</span>
                      <span className="text-[10px] text-slate-500">Giáo viên chọn mức độ:</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Quy định: Đúng hết nghe đọc, viết câu lỗi nhiều xếp Khóa 1, viết câu ít lỗi xếp Khóa 2.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleWritingErrorLevelChange('ít lỗi')}
                        className={`py-1.5 px-2 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1 ${
                          evalWritingErrorLevel === 'ít lỗi'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Viết câu ít lỗi (Khóa 2)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWritingErrorLevelChange('lỗi nhiều')}
                        className={`py-1.5 px-2 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1 ${
                          evalWritingErrorLevel === 'lỗi nhiều'
                            ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Viết câu lỗi nhiều (Khóa 1)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Khóa đề xuất & Trạng thái (3 Nút chọn trực quan) */}
                <div className="space-y-2 pt-1 border-t border-slate-200/80">
                  <label className="font-bold text-slate-800 block text-sm">
                    Khóa học đề xuất & Xếp lớp:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectCourse('Khóa 1')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        evalRecommendedCourse === 'Khóa 1'
                          ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-500/20 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-bold'
                      }`}
                    >
                      <div className="text-sm">Khóa 1</div>
                      <div className="text-[10px] text-amber-700">Nền Tảng & Ngữ Pháp Viết</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCourse('Khóa 2')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        evalRecommendedCourse === 'Khóa 2'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-bold'
                      }`}
                    >
                      <div className="text-sm">Khóa 2</div>
                      <div className="text-[10px] text-emerald-700">IELTS Pre-Intermediate</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCourse('Không Đạt')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        evalRecommendedCourse === 'Không Đạt' || evalStatus === 'Không đạt'
                          ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-500/20 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-bold'
                      }`}
                    >
                      <div className="text-sm">Không Đạt</div>
                      <div className="text-[10px] text-rose-700">Chưa Đủ Tiêu Chuẩn Vào Học</div>
                    </button>
                  </div>
                </div>

                {/* Nhận xét chuyên môn của giáo viên (Tự động ghi sẵn theo quy định) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-sm">
                      Nhận xét của giáo viên (Nội dung gửi phụ huynh):
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-400">Chèn mẫu:</span>
                      <button
                        type="button"
                        onClick={() => setEvalComment(PRESET_COMMENTS.COURSE_1)}
                        className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-semibold"
                      >
                        Khóa 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvalComment(PRESET_COMMENTS.COURSE_2)}
                        className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold"
                      >
                        Khóa 2
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvalComment(PRESET_COMMENTS.FAILED)}
                        className="px-1.5 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold"
                      >
                        Không Đạt
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={evalComment}
                    onChange={(e) => setEvalComment(e.target.value)}
                    placeholder="Nhập nhận xét chi tiết gửi phụ huynh..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-purple-500/20 leading-relaxed font-medium"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-500 italic">
                      💡 Mẹo: Bạn có thể chỉnh sửa nhận xét bên trên trước khi bấm sao chép báo cáo phụ huynh.
                    </span>

                    <button
                      type="button"
                      onClick={handleSaveEvaluation}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shadow-xs"
                    >
                      💾 Lưu Đánh Giá Xếp Lớp
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: THANG ĐIỂM IELTS BAND THAM KHẢO */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-sm">
                <h4 className="font-bold text-slate-700">Điểm IELTS ước tính:</h4>
                <div className="grid grid-cols-5 gap-2 text-center font-mono">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">Listening</div>
                    <div className="text-base font-black text-blue-700">{selectedResponse.listeningScore}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">Reading</div>
                    <div className="text-base font-black text-emerald-700">{selectedResponse.readingScore}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">Writing</div>
                    <div className="text-base font-black text-purple-700">{selectedResponse.writingScore}</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-sans">Speaking</div>
                    <div className="text-base font-black text-amber-700">{selectedResponse.speakingScore}</div>
                  </div>
                  <div className="bg-purple-700 text-white p-2 rounded-xl">
                    <div className="text-[10px] text-purple-200 font-sans">Overall</div>
                    <div className="text-base font-black">{selectedResponse.overallScore}</div>
                  </div>
                </div>

                {/* Speaking Audio Recording Review */}
                {(selectedResponse.speakingAudioUrl || selectedResponse.testAnswers?.speakingAudioUrl) ? (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          <span className="font-extrabold text-blue-900 text-sm">
                            Bản ghi âm bài nói Speaking của thí sinh:
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                          {selectedResponse.speakingAudioDuration || selectedResponse.testAnswers?.speakingAudioDuration || 45}s
                        </span>
                      </div>
                      <audio controls src={selectedResponse.speakingAudioUrl || selectedResponse.testAnswers?.speakingAudioUrl} className="w-full h-9 outline-none" />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="p-3 bg-slate-100/80 border border-dashed border-slate-200 rounded-2xl flex items-center gap-2 text-slate-500 text-sm">
                      <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span><strong>Bài nói Speaking:</strong> Chưa có bản ghi âm (Thí sinh chưa nộp phần ghi âm hoặc làm bài trực tiếp).</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: CHI TIẾT TỪNG CÂU BÀI LÀM CỦA THÍ SINH (AUDIT COLLAPSIBLE) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAnswerAuditDetails(!showAnswerAuditDetails)}
                  className="w-full p-3 bg-slate-100 hover:bg-slate-200/80 text-left font-bold text-sm text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-700" />
                    <span>Xem chi tiết bài làm từng câu của thí sinh (Đối chiếu đáp án chuẩn)</span>
                  </span>
                  <span className="text-[11px] text-purple-700 font-medium">
                    {showAnswerAuditDetails ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                  </span>
                </button>

                {showAnswerAuditDetails && (
                  <div className="p-4 bg-white space-y-4 text-sm animate-in fade-in">
                    {/* Listening Answers Audit */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-blue-900 flex items-center gap-1.5">
                        <span>🎧 Bài Nghe (Guitar Lesson Booking):</span>
                        <span className="font-mono text-[11px] font-normal text-blue-700">
                          (Đúng {evalRes.listeningCorrect}/5, Sai {evalRes.listeningWrong}/5)
                        </span>
                      </h5>
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {['q1', 'q2', 'q3', 'q4', 'q5'].map((key, idx) => {
                          const userAns = selectedResponse.testAnswers?.listening?.[key] || '(Chưa điền)';
                          const isCorrect = checkListeningAnswer(key, userAns);
                          const info = LISTENING_KEY_INFO[key];
                          return (
                            <div key={key} className="flex items-start justify-between gap-2 py-1 border-b border-slate-200/60 last:border-none">
                              <div>
                                <span className="font-bold text-slate-700">Câu {idx + 1}: {info?.label}</span>
                                <div className="text-[11px] mt-0.5">
                                  Học sinh trả lời: <strong className={isCorrect ? 'text-emerald-700 font-mono' : 'text-rose-600 font-mono'}>{userAns}</strong>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {isCorrect ? (
                                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Đúng
                                  </span>
                                ) : (
                                  <div>
                                    <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      ✕ Sai
                                    </span>
                                    <div className="text-[9px] text-slate-400 mt-0.5">Chuẩn: {info?.expected}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reading Answers Audit */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <span>📖 Bài Đọc (City Brands Index):</span>
                        <span className="font-mono text-[11px] font-normal text-emerald-700">
                          (Đúng {evalRes.readingCorrect}/5, Sai {evalRes.readingWrong}/5)
                        </span>
                      </h5>
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {['q1', 'q2', 'q3', 'q4', 'q5'].map((key, idx) => {
                          const userAns = selectedResponse.testAnswers?.reading?.[key] || '(Chưa điền)';
                          const isCorrect = checkReadingAnswer(key, userAns);
                          const info = READING_KEY_INFO[key];
                          return (
                            <div key={key} className="flex items-start justify-between gap-2 py-1 border-b border-slate-200/60 last:border-none">
                              <div>
                                <span className="font-bold text-slate-700">Câu {idx + 1}: {info?.label}</span>
                                <div className="text-[11px] mt-0.5">
                                  Học sinh trả lời: <strong className={isCorrect ? 'text-emerald-700 font-mono' : 'text-rose-600 font-mono'}>{userAns}</strong>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {isCorrect ? (
                                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Đúng
                                  </span>
                                ) : (
                                  <div>
                                    <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                      ✕ Sai
                                    </span>
                                    <div className="text-[9px] text-slate-400 mt-0.5">Chuẩn: {info?.expected}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Writing Part A Audit */}
                    <div className="space-y-2">
                      <h5 className="font-bold text-purple-900">✍️ Bài Viết - Part A: Viết 3 câu hoàn chỉnh:</h5>
                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[11px] font-bold text-slate-700 block">Câu 1: Use/ mobile phone/ much/ can/ do/ more harm/ good.</span>
                          <div className="p-2 bg-white rounded-lg border border-slate-200 mt-1 font-mono text-[11px] text-slate-800">
                            {selectedResponse.testAnswers?.writingSentences?.q1 || '(Chưa làm)'}
                          </div>
                          <p className="text-[10px] text-purple-700 mt-0.5">
                            Gợi ý chuẩn: {WRITING_STANDARD_SENTENCES.q1}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-700 block">Câu 2: There/ a number of/ benefit/ use / mobile phone.</span>
                          <div className="p-2 bg-white rounded-lg border border-slate-200 mt-1 font-mono text-[11px] text-slate-800">
                            {selectedResponse.testAnswers?.writingSentences?.q2 || '(Chưa làm)'}
                          </div>
                          <p className="text-[10px] text-purple-700 mt-0.5">
                            Gợi ý chuẩn: {WRITING_STANDARD_SENTENCES.q2}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-700 block">Câu 3: government/ need/ find/ solution/ problem.</span>
                          <div className="p-2 bg-white rounded-lg border border-slate-200 mt-1 font-mono text-[11px] text-slate-800">
                            {selectedResponse.testAnswers?.writingSentences?.q3 || '(Chưa làm)'}
                          </div>
                          <p className="text-[10px] text-purple-700 mt-0.5">
                            Gợi ý chuẩn: {WRITING_STANDARD_SENTENCES.q3}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Writing Part B Audit */}
                    {selectedResponse.testAnswers?.writingParagraph && (
                      <div className="space-y-1.5">
                        <h5 className="font-bold text-purple-900">✍️ Bài Viết - Part B: Đoạn văn ngắn (Why study IELTS):</h5>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed font-sans text-sm text-slate-800">
                          {selectedResponse.testAnswers.writingParagraph}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Test Timing Audit */}
              <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="font-bold text-slate-800">Thời gian làm bài:</span>
                  <span className="font-mono font-black text-slate-900">
                    {selectedResponse.timeSpentFormatted || '55 phút'}
                  </span>
                  <span className="text-slate-500 text-[11px]">(Quy định 55p từ Vocabulary)</span>
                </div>
                <div>
                  {selectedResponse.isOverdue ? (
                    <span className="px-2.5 py-1 rounded-full text-sm font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Vượt mốc: +{selectedResponse.overdueText}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✅ Nộp đúng giờ quy định
                    </span>
                  )}
                </div>
              </div>

              {/* Anti-Cheat audit logs */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">🛡️ Giám sát chống gian lận & Nhật ký rời tab:</span>
                  <span className="text-[10px] text-slate-400">
                    Vi phạm: {selectedResponse.tabSwitchCount || 0} lần
                  </span>
                </div>
                {selectedResponse.antiCheatLogs && selectedResponse.antiCheatLogs.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
                    {selectedResponse.antiCheatLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-400 text-[11px]">
                    ✅ Thí sinh làm bài hoàn toàn nghiêm túc, không có vi phạm rời tab nào!
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedResponse(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteResponse(selectedResponse)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold transition-all"
                    title="Xóa vĩnh viễn bài thi này khỏi hệ thống"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Xóa bài thi</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {evalStatus !== 'Không đạt' && evalRecommendedCourse !== 'Không Đạt' && (
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(selectedResponse)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                      title="Thêm học viên vào lớp học ngay"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{selectedResponse.status === 'Đã nhập học' ? 'Chuyển Lớp' : 'Thêm Vào Lớp Học'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleCopyReport(selectedResponse, e)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                  >
                    {copiedId === selectedResponse.id ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedId === selectedResponse.id ? 'Đã Sao Chép Báo Cáo!' : '📋 Sao Chép Kết Quả Báo Cáo Phụ Huynh'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL 3: THÊM HỌC VIÊN VÀO LỚP HỌC (SAU KHI CÓ ĐIỂM ĐẠT)
         ========================================================= */}
      {assignModalTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Thêm Học Viên Vào Lớp Học</h3>
                  <p className="text-[11px] text-slate-500">
                    Thí sinh đạt: <strong className="text-purple-700">{assignModalTest.candidateName}</strong> ({assignModalTest.recommendedCourse})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalTest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Class Selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>Chọn Lớp Học Tiếp Nhận:</span>
                <span className="text-[10px] text-purple-700 font-semibold">
                  Khóa đề xuất: {assignModalTest.recommendedCourse}
                </span>
              </label>
              <select
                value={assignSelectedClassId}
                onChange={(e) => setAssignSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="waiting_list">📋 Lớp Chờ Xếp (Waiting List / Đang ghép nhóm)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    🎓 {cls.name} • GV: {cls.teacherName} • {cls.schedule} • Phòng {cls.room} ({cls.studentCount || 0}/{cls.maxCapacity || 16} HV)
                  </option>
                ))}
              </select>
            </div>

            {/* Student Info Form Confirmation */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-sm">
              <div className="text-[11px] font-bold text-slate-700 uppercase">Thông tin hồ sơ học viên:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Họ và tên:</label>
                  <input
                    type="text"
                    value={assignStudentFormData.name}
                    onChange={(e) => setAssignStudentFormData({ ...assignStudentFormData, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Giới tính:</label>
                  <select
                    value={assignStudentFormData.gender}
                    onChange={(e) => setAssignStudentFormData({ ...assignStudentFormData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-800"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Số điện thoại:</label>
                  <input
                    type="text"
                    value={assignStudentFormData.phone}
                    onChange={(e) => setAssignStudentFormData({ ...assignStudentFormData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">SĐT Phụ huynh:</label>
                  <input
                    type="text"
                    value={assignStudentFormData.parentPhone}
                    onChange={(e) => setAssignStudentFormData({ ...assignStudentFormData, parentPhone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium">Email:</label>
                <input
                  type="email"
                  value={assignStudentFormData.email}
                  onChange={(e) => setAssignStudentFormData({ ...assignStudentFormData, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-medium">Địa chỉ nhà:</label>
                <input
                  type="text"
                  value={assignStudentFormData.address}
                  onChange={(e) => setAssignStudentFormData({ ...assignStudentFormData, address: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssignModalTest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Xác Nhận Thêm Vào Lớp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: QUẢN LÝ & LƯU LINK LIÊN KẾT GOOGLE SHEET
         ========================================================= */}
      {showGoogleSheetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Cấu Hình Link Google Sheet</h3>
                  <p className="text-[11px] text-slate-500">Lưu lại link bảng tính Google Sheet để xem và đối soát</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleSheetModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">
                Nhập đường dẫn (Link URL) Google Sheet của bạn:
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={tempGoogleSheetUrl}
                  onChange={(e) => setTempGoogleSheetUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 Hệ thống sẽ lưu link này vào bộ nhớ của bạn. Bạn có thể bấm "Mở Google Sheet" bất kỳ lúc nào để xem trực tiếp, hoặc nhấn "Sao chép 57 cột" rồi dán vào sheet.
              </p>

              {(tempGoogleSheetUrl.includes('\n') || tempGoogleSheetUrl.startsWith('Timestamp') || (tempGoogleSheetUrl.includes(',') && !tempGoogleSheetUrl.startsWith('http'))) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Phát hiện bạn đang dán dữ liệu bảng tính thay vì link web URL!</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Bạn có thể chuyển dữ liệu này sang màn hình <strong>Nhập Học Viên</strong> để tự động đọc toàn bộ thí sinh, tự động chấm điểm và nạp vào hệ thống:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRawCsvInput(tempGoogleSheetUrl);
                      setShowGoogleSheetModal(false);
                      setShowImportCsvModal(true);
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Chuyển Sang Nhập Học Viên Từ Dữ Liệu Này Ngay
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (tempGoogleSheetUrl && tempGoogleSheetUrl.startsWith('http')) window.open(tempGoogleSheetUrl, '_blank');
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở thử link</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleSheetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoogleSheetUrl}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Link Google Sheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4.5: NHẬP DỮ LIỆU TỪ GOOGLE SHEET (CSV / TSV / PASTE)
         ========================================================= */}
      {showImportCsvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Nhập Dữ Liệu Từ Google Sheet (Dán CSV / TSV)</h3>
                  <p className="text-[11px] text-slate-500">Tự động đọc toàn bộ câu trả lời, tự động chấm điểm và lưu vào danh sách bài test</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportCsvModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Cách lấy dữ liệu nhanh nhất (2 bước):</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-amber-800 space-y-0.5 leading-relaxed">
                  <li>Mở file Google Sheet chứa kết quả thi đầu vào &gt; Nhấn <strong>Ctrl + A</strong> (chọn toàn bộ bảng) &gt; Nhấn <strong>Ctrl + C</strong> (sao chép).</li>
                  <li>Nhấp chuột vào ô bên dưới và nhấn <strong>Ctrl + V</strong> (dán vào) &gt; Bấm nút <strong>Tiến Hành Nhập Học Viên</strong>.</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Dán nội dung bảng tính hoặc CSV vào đây:
                  </label>
                  {rawCsvInput && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Đã phát hiện ~{Math.max(0, rawCsvInput.split('\n').filter(l => l.trim().length > 0).length - 1)} thí sinh
                    </span>
                  )}
                </div>
                <textarea
                  rows={9}
                  placeholder="Dán dữ liệu từ Google Sheet (Timestamp, Score, Họ tên của em, Số điện thoại...)"
                  value={rawCsvInput}
                  onChange={(e) => setRawCsvInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-amber-500/20 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setRawCsvInput('')}
                disabled={!rawCsvInput || isImportingCsv}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
              >
                Xóa ô nhập
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportCsvModal(false)}
                  disabled={isImportingCsv}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleImportCsvData}
                  disabled={!rawCsvInput.trim() || isImportingCsv}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-black shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isImportingCsv ? (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{isImportingCsv ? 'Đang phân tích...' : 'Tiến Hành Nhập Học Viên'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: XEM DANH SÁCH 57 CỘT DỮ LIỆU GOOGLE SHEET
         ========================================================= */}
      {showColumnListModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Danh Sách 57 Cột Dữ Liệu Google Sheet</h3>
                  <p className="text-[11px] text-slate-500">Mỗi mục học sinh điền hay làm bài là một cột riêng biệt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnListModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Toàn bộ dữ liệu xuất ra Google Sheet được phân bổ thành <strong>57 cột</strong> chuẩn xác, bao gồm:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
                {PLACEMENT_SHEET_COLUMNS.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-[11px] truncate" title={col}>
                      {col}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Tổng cộng: <strong>{PLACEMENT_SHEET_COLUMNS.length} cột dữ liệu</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyGoogleSheetsTSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép dữ liệu dán vào Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowColumnListModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 6: CẤU HÌNH GOOGLE APPS SCRIPT WEBHOOK TỰ ĐỘNG
         ========================================================= */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Đồng Bộ Tự Động Qua Google Apps Script</h3>
                  <p className="text-[11px] text-slate-500">Tự động thêm dòng mới vào Google Sheet ngay khi có thí sinh nộp bài</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppsScriptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-1">
                <div className="font-bold text-purple-900">Các bước cài đặt đơn giản (1 phút):</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-purple-800">
                  <li>Mở file Google Sheet của bạn &gt; Chọn menu <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Xóa toàn bộ mã cũ và dán đoạn mã bên dưới vào.</li>
                  <li>Nhấn <strong>Triển khai (Deploy)</strong> &gt; <strong>Triển khai mới (New deployment)</strong> &gt; Chọn loại <strong>Web app</strong>.</li>
                  <li>Mục <em>Who has access</em> chọn <strong>Anyone (Bất kỳ ai)</strong> &gt; Bấm <strong>Deploy</strong>.</li>
                </ol>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Dán Link Web App đã Deploy (Webhook):</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      localStorage.setItem('ielts_placement_webhook_url', e.target.value);
                    }}
                    className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      showToast('✅ Đã lưu webhook URL thành công!');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    Lưu
                  </button>
                </div>
                <p className="text-[10px] text-emerald-800 leading-relaxed">
                  💡 <strong>Tự Động 100%</strong>: Khi có học sinh mới nộp bài test online, hệ thống sẽ tự động gọi link này để đẩy trực tiếp toàn bộ <strong>57 cột dữ liệu</strong> đầy đủ vào Google Sheet của bạn ngay lập tức mà không cần copy tay!
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Mã nguồn Google Apps Script (57 Cột Tự Động):</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(SAMPLE_GOOGLE_APPS_SCRIPT);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2500);
                      showToast('Đã sao chép mã Apps Script vào clipboard!');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg font-bold text-[11px] transition-all"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Đã sao chép mã!' : 'Sao chép mã Apps Script'}</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
                  {SAMPLE_GOOGLE_APPS_SCRIPT}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAppsScriptModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 8: QUẢN LÝ & CHỈNH SỬA LỊCH HỌC FORM TEST (ADMIN ONLY)
         ========================================================= */}
      {showScheduleEditModal && isManagement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-amber-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Chỉnh Sửa Lịch Học Form Test Đầu Vào
                    </h3>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-700" />
                      <span>Dành riêng cho Quản lý</span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Thêm, sửa, xóa danh sách các lớp &amp; ca học hiển thị ở Câu hỏi 8 trong form đăng ký
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Quick Add Schedule Box */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <label className="font-extrabold text-amber-950 text-sm block">
                ➕ Thêm lịch học / ca học mới vào form:
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="VD: Lớp PRE mới Khai giảng 20/10: Thứ 2 Thứ 5 từ 18h - 19h45 (51 TÔ HIỆU)"
                  value={newScheduleInput}
                  onChange={(e) => setNewScheduleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddScheduleItem();
                    }
                  }}
                  className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddScheduleItem}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Lịch</span>
                </button>
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-amber-900 block">Gợi ý chèn nhanh cụm từ:</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    'Lớp PRE mới Dự kiến',
                    'Lớp Nền tảng (Foundation)',
                    'Thứ 2 Thứ 5 (18h - 19h45)',
                    'Thứ 2 Thứ 5 (19h45 - 21h30)',
                    'Thứ 3 Thứ 6 (18h - 19h45)',
                    'Thứ 3 Thứ 6 (19h45 - 21h30)',
                    'Thứ 4 Thứ 7 (18h - 19h45)',
                    '(51 TÔ HIỆU)',
                    '(Hòa Bình Kiến An)',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setNewScheduleInput((prev) => (prev ? `${prev} ${chip}` : chip));
                      }}
                      className="px-2 py-0.8 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-medium transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Schedule List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">
                  Danh sách lịch học hiện tại ({tempScheduleList.length} lựa chọn):
                </span>
                <span className="text-[11px] text-slate-500">
                  Thí sinh sẽ chọn 1 trong các lịch dưới đây
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tempScheduleList.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all ${
                      editingScheduleIdx === idx
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {editingScheduleIdx === idx ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-purple-700 w-6">#{idx + 1}</span>
                          <input
                            type="text"
                            value={editingScheduleValue}
                            onChange={(e) => setEditingScheduleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditSchedule(idx);
                              }
                            }}
                            className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 text-slate-900"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingScheduleIdx(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditSchedule(idx)}
                            className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-sm font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Xác nhận sửa</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-bold text-sm flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-800 leading-relaxed truncate">
                            {item}
                          </span>
                        </div>

                        {/* Action buttons: Move Up, Move Down, Edit, Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveScheduleItem(idx, 'up')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === tempScheduleList.length - 1}
                            onClick={() => handleMoveScheduleItem(idx, 'down')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditSchedule(idx)}
                            className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg"
                            title="Sửa nội dung dòng này"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveScheduleItem(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg"
                            title="Xóa lịch này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {tempScheduleList.length === 0 && (
                  <div className="p-6 text-center text-sm text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-200">
                    Chưa có lịch học nào trong danh sách. Vui lòng thêm ít nhất 1 lịch học!
                  </div>
                )}
              </div>
            </div>

            {/* Edit Instruction Note below Question 8 */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-900 text-sm block">
                📝 Nội dung ghi chú / quy định ca học (hiển thị dưới câu hỏi 8):
              </label>
              <textarea
                rows={2}
                value={tempScheduleNote}
                onChange={(e) => setTempScheduleNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 text-slate-800"
                placeholder="Nhập hướng dẫn về các ca học và ngày học..."
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetScheduleDefaults}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                title="Khôi phục lại danh sách lịch mặc định của IELTS Dương Vũ"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Khôi phục mặc định</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowScheduleEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveScheduleChanges}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-extrabold shadow-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Lịch Học</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTE / GHI CHÚ MODAL FOR RESPONSE */}
      {editingNoteResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ghi chú kết quả bài thi</h3>
                  <p className="text-xs text-slate-500">
                    Thí sinh: <strong className="text-slate-800">{editingNoteResponse.candidateName}</strong> ({editingNoteResponse.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNoteResponse(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Khóa học đề xuất & Nguyện vọng:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteResponse((prev) => (prev ? { ...prev, recommendedCourse: 'Khóa 1' } : null));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      editingNoteResponse.recommendedCourse === 'Khóa 1'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Khóa 1 (PRE)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNoteResponse((prev) => (prev ? { ...prev, recommendedCourse: 'Khóa 2' } : null));
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      editingNoteResponse.recommendedCourse === 'Khóa 2'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Khóa 2 (INSPIRE)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội dung ghi chú & Lưu ý của giáo viên:
                </label>
                <textarea
                  rows={4}
                  value={noteResponseInput}
                  onChange={(e) => setNoteResponseInput(e.target.value)}
                  placeholder="Nhập ghi chú chi tiết về tình hình làm bài, nguyện vọng xếp lớp, thời gian học..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingNoteResponse(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNoteResponse}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Lưu ghi chú</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE RESPONSE MODAL */}
      {responseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Xác nhận xóa bài thi</h3>
                <p className="text-xs text-slate-500">Hành động này sẽ xóa vĩnh viễn khỏi hệ thống</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Thí sinh:</span>
                <strong className="text-slate-900 font-bold">{responseToDelete.candidateName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã bài thi:</span>
                <span className="font-mono font-bold text-purple-700">{responseToDelete.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono text-slate-700">{responseToDelete.phone || 'Chưa cung cấp'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày nộp:</span>
                <span className="text-slate-700">{responseToDelete.submissionDate || responseToDelete.testDate}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResponseToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteResponse}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa bài thi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
