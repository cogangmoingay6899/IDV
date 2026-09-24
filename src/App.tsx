import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ModuleGrid } from './components/ModuleGrid';
import { FinanceModule } from './components/modules/FinanceModule';
import { StudentsModule } from './components/modules/StudentsModule';
import { AdmissionsModule } from './components/modules/AdmissionsModule';
import { ContactBookModule } from './components/modules/ContactBookModule';
import { PlacementModule } from './components/modules/PlacementModule';
import { TrialModule } from './components/modules/TrialModule';
import { HRModule } from './components/modules/HRModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { ExamsModule } from './components/modules/ExamsModule';
import { TeacherSessionsModule } from './components/modules/TeacherSessionsModule';
import { KPIModule } from './components/modules/KPIModule';
import { CurriculumModule } from './components/modules/CurriculumModule';
import { InventoryModule } from './components/modules/InventoryModule';
import { ClassSpreadsheetGradebookModule } from './components/modules/ClassSpreadsheetGradebookModule';

import { AddStudentModal } from './components/modals/AddStudentModal';
import { CollectTuitionModal } from './components/modals/CollectTuitionModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { NewLeadModal } from './components/modals/NewLeadModal';
import { CreateClassModal } from './components/modals/CreateClassModal';
import { LoginModal } from './components/modals/LoginModal';
import { StaffEmailManagementModal } from './components/modals/StaffEmailManagementModal';
import {
  DepartmentEmails,
  loadDepartmentEmails,
  saveDepartmentEmails,
} from './data/authStaff';
import { ImportSheetModal } from './components/modals/ImportSheetModal';
import { OnlinePlacementTestForm } from './components/modules/OnlinePlacementTestForm';
import { ClassVocabTestModule } from './components/modules/ClassVocabTestModule';
import { ClassPronunciationModule } from './components/modules/ClassPronunciationModule';
import { SpeakingPracticeModule } from './components/modules/SpeakingPracticeModule';
import { exportCenterDataToExcel } from './lib/excelExportService';

// Helper to check if URL is requesting the Online Placement Test Portal
const isPlacementTestUrl = () => {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  return (
    params.get('test') === 'online' ||
    params.get('mode') === 'placement-test' ||
    params.get('test') === 'placement' ||
    params.get('view') === 'test' ||
    href.includes('test=online') ||
    href.includes('test-online') ||
    hash.includes('test-online') ||
    hash.includes('placement-test') ||
    hash.includes('test-dau-vao')
  );
};

// Helper to check if URL is requesting the Student Pronunciation Portal
const isPronunciationPortalUrl = () => {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  return (
    params.get('mode') === 'pronunciation' ||
    params.get('practice') === 'pronunciation' ||
    params.get('view') === 'pronunciation' ||
    href.includes('mode=pronunciation') ||
    href.includes('practice=pronunciation') ||
    href.includes('phat-am') ||
    hash.includes('phat-am') ||
    hash.includes('pronunciation')
  );
};

// Helper to check if URL is requesting the Student Speaking AI Portal
const isSpeakingPortalUrl = () => {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  return (
    params.get('mode') === 'speaking' ||
    params.get('practice') === 'speaking' ||
    params.get('view') === 'speaking' ||
    href.includes('mode=speaking') ||
    href.includes('speaking-ai') ||
    hash.includes('speaking-ai')
  );
};

const getVocabTestIdParam = () => {
  if (typeof window === 'undefined') return null;
  const href = window.location.href;
  const search = window.location.search;
  const hash = window.location.hash;

  // 1. Direct regex match on full URL string (Catches ?vocabTestId=..., ?vt=..., #vocabTestId=..., &vocabTestId=...)
  const match = href.match(/(?:vocabTestId|vocabTest|vocab|testId|vt)=([^&/#?]+)/i);
  if (match) {
    const val = decodeURIComponent(match[1]);
    if (val !== 'online' && val !== 'placement' && val !== 'dau-vao') {
      return val;
    }
  }

  // 2. Direct match for test= parameter when value is a vocab test id (e.g. ?test=vt-k1-01)
  const testParamMatch = href.match(/(?:[?&]test)=([^&/#?]+)/i);
  if (testParamMatch) {
    const val = decodeURIComponent(testParamMatch[1]);
    if (val !== 'online' && val !== 'placement' && val !== 'dau-vao') {
      return val;
    }
  }

  // 3. Fallback search params
  const params = new URLSearchParams(search);
  const fromSearch =
    params.get('vocabTestId') ||
    params.get('vocabTest') ||
    params.get('vocab') ||
    params.get('testId') ||
    params.get('vt');
  if (fromSearch) return decodeURIComponent(fromSearch);

  if (hash.includes('?')) {
    const hashSearch = hash.split('?')[1];
    const hashParams = new URLSearchParams(hashSearch);
    const fromHashParams =
      hashParams.get('vocabTestId') ||
      hashParams.get('vocabTest') ||
      hashParams.get('vocab') ||
      hashParams.get('testId') ||
      hashParams.get('vt');
    if (fromHashParams) return decodeURIComponent(fromHashParams);
  }

  // 4. Fallback hash match like #vt-k1-01 or #vocab-k1-01
  const hashMatch = hash.match(/(vt-k[1-4]-\d+|vocab-[a-zA-Z0-9-]+)/i);
  if (hashMatch) return decodeURIComponent(hashMatch[1]);

  // 5. Fallback path or hash flags
  if (href.includes('test-vocab') || href.includes('vocab-test') || href.includes('tuvung')) {
    return 'vt-k1-01';
  }

  return null;
};

const getReviewTestIdParam = () => {
  if (typeof window === 'undefined') return null;
  const href = window.location.href;
  const match = href.match(/(?:reviewTestId|reviewId|rev)=([^&/#?]+)/i);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  const testParamMatch = href.match(/(?:[?&]test)=([^&/#?]+)/i);
  if (testParamMatch) {
    const val = decodeURIComponent(testParamMatch[1]);
    if (val.startsWith('rev-')) {
      return val;
    }
  }
  return null;
};

import {
  subscribeCollection,
  fetchCollection,
  saveDocument,
  saveBatchDocuments,
  deleteDocument,
  clearCollection,
  incrementClassStudentCount,
  isRecordDeleted,
} from './lib/firestoreService';

import {
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_LEADS,
  INITIAL_PLACEMENT_TESTS,
  INITIAL_TRIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_TRANSACTIONS,
  INITIAL_CONTACT_NOTES,
  INITIAL_MILESTONE_EVALUATIONS,
  INITIAL_EXAMS,
  INITIAL_COURSES,
  INITIAL_KPIS,
  INITIAL_INVENTORY,
} from './data/mockData';

import {
  ModuleId,
  Student,
  ClassGroup,
  Teacher,
  LeadAdmission,
  PlacementTest,
  TrialStudent,
  AttendanceRecord,
  TuitionTransaction,
  ContactBookNote,
  MilestoneEvaluationReport,
  ExamScore,
  CurriculumCourse,
  KPITarget,
  InventoryItem,
  AuthUser,
} from './types';

import {
  ArrowLeft,
  Wallet,
  Users2,
  UserPlus,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  MessageSquareText,
  CalendarCheck2,
  BarChart3,
  Award,
  CalendarDays,
  Target,
  BookMarked,
  PackageCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Shield,
  KeyRound,
  Lock,
  Plus,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';

export default function App() {
  // Authentication & RBAC state (Default to null requiring login and security PIN code)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('idv_auth_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Navigation & filter state
  const [currentModule, setCurrentModule] = useState<ModuleId>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState('Cơ sở 1 - Tô Hiệu (Hải Phòng)');
  const [searchQuery, setSearchQuery] = useState('');

  // Public Student Entrance Test & Vocab Test & Pronunciation Portal Mode
  const [isStudentPortal, setIsStudentPortal] = useState<boolean>(() => isPlacementTestUrl());
  const [isPronunciationPortal, setIsPronunciationPortal] = useState<boolean>(() => isPronunciationPortalUrl());
  const [isSpeakingPortal, setIsSpeakingPortal] = useState<boolean>(() => isSpeakingPortalUrl());
  const [vocabTestIdParam, setVocabTestIdParam] = useState<string | null>(() => getVocabTestIdParam());
  const [reviewTestIdParam, setReviewTestIdParam] = useState<string | null>(() => getReviewTestIdParam());

  useEffect(() => {
    const handleUrlChange = () => {
      const isPortal = isPlacementTestUrl();
      const isPronPortal = isPronunciationPortalUrl();
      const isSpeakPortal = isSpeakingPortalUrl();
      const vocabId = getVocabTestIdParam();
      const reviewId = getReviewTestIdParam();
      setIsStudentPortal(isPortal);
      setIsPronunciationPortal(isPronPortal);
      setIsSpeakingPortal(isSpeakPortal);
      setVocabTestIdParam(vocabId);
      setReviewTestIdParam(reviewId);

      if (vocabId || reviewId) {
        document.title = 'Bài kiểm tra trực tuyến - IELTS Dương Vũ';
      } else if (isPortal) {
        document.title = 'Bài kiểm tra đầu vào IELTS - IELTS Dương Vũ';
      } else if (isSpeakPortal) {
        document.title = 'Luyện Speaking AI - IELTS Dương Vũ';
      } else {
        document.title = 'Hệ Thống Quản Trị - IELTS Dương Vũ';
      }
    };

    handleUrlChange();

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    const timer = setInterval(handleUrlChange, 400);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      clearInterval(timer);
    };
  }, []);

  // Primary Business Entities State (Clean default empty data)
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('idv_deleted_class_ids') || '[]');
      const setDeleted = new Set(deletedIds);
      const cached = localStorage.getItem('vps_col_classes');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => !setDeleted.has(c.id));
        }
      }
    } catch (e) {}
    return [];
  });
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [leads, setLeads] = useState<LeadAdmission[]>(INITIAL_LEADS);
  const [placementTests, setPlacementTests] = useState<PlacementTest[]>(() => {
    try {
      const cached = localStorage.getItem('idv_placement_tests_cache');
      const submitted = localStorage.getItem('idv_submitted_candidate_placement_tests');
      let combined: PlacementTest[] = [];

      if (submitted) {
        const parsedSubmitted = JSON.parse(submitted);
        if (Array.isArray(parsedSubmitted)) {
          combined = [...parsedSubmitted];
        }
      }

      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(combined.map((c) => c.id));
          parsed.forEach((p: PlacementTest) => {
            if (!existingIds.has(p.id)) combined.push(p);
          });
        }
      }

      if (combined.length > 0) {
        return combined.filter((p: PlacementTest) => !isRecordDeleted(p.id, 'placementTests'));
      }
    } catch (e) {
      console.warn('Failed to read cached placement tests:', e);
    }
    return [];
  });
  const [trialStudents, setTrialStudents] = useState<TrialStudent[]>(INITIAL_TRIAL_STUDENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [transactions, setTransactions] = useState<TuitionTransaction[]>(INITIAL_TRANSACTIONS);
  const [contactNotes, setContactNotes] = useState<ContactBookNote[]>(INITIAL_CONTACT_NOTES);
  const [milestoneEvaluations, setMilestoneEvaluations] = useState<MilestoneEvaluationReport[]>(INITIAL_MILESTONE_EVALUATIONS);
  const [exams, setExams] = useState<ExamScore[]>(INITIAL_EXAMS);
  const [courses, setCourses] = useState<CurriculumCourse[]>(INITIAL_COURSES);
  const [kpis, setKpis] = useState<KPITarget[]>(INITIAL_KPIS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  // Real-time Cloud Database (Firebase Firestore) Sync across all devices
  useEffect(() => {
    const unsubStudents = subscribeCollection('students', INITIAL_STUDENTS, (items) => {
      setStudents(items.filter((s) => !isRecordDeleted(s.id, 'students')));
    });
    const unsubClasses = subscribeCollection('classes', [], (items) => {
      setClasses(items.filter((c) => !isRecordDeleted(c.id, 'classes')));
    });
    const unsubTeachers = subscribeCollection('teachers', INITIAL_TEACHERS, setTeachers);
    const unsubLeads = subscribeCollection('leads', INITIAL_LEADS, setLeads);
    const unsubPlacement = subscribeCollection('placementTests', [], (data) => {
      let cachedSubmissions: PlacementTest[] = [];
      try {
        const rawSubmissions = localStorage.getItem('idv_submitted_candidate_placement_tests');
        if (rawSubmissions) {
          const parsed = JSON.parse(rawSubmissions);
          if (Array.isArray(parsed)) cachedSubmissions = parsed;
        }
      } catch (e) {}

      const tests = (Array.isArray(data) ? data : []).filter((t) => !isRecordDeleted(t.id, 'placementTests'));
      const testMap = new Map<string, PlacementTest>();
      // Cloud data first
      tests.forEach((t) => testMap.set(t.id, t));
      // Ensure candidate submitted tests are merged and preserved if not deleted
      cachedSubmissions.forEach((t) => {
        if (!isRecordDeleted(t.id, 'placementTests')) {
          testMap.set(t.id, t);
        }
      });

      const updatedTests = Array.from(testMap.values()).map((t) => {
        if (!t.speakingAudioUrl && !t.testAnswers?.speakingAudioUrl) {
          if (t.id === 'pt-101' || t.id === 'pt-102') {
            return {
              ...t,
              speakingAudioUrl: '/audio/guitar_lesson_listening.mp3?v=2',
              speakingAudioDuration: 55,
            };
          }
        }
        return t;
      });
      try {
        localStorage.setItem('idv_placement_tests_cache', JSON.stringify(updatedTests.slice(0, 100)));
      } catch (e) {
        // ignore
      }
      setPlacementTests(updatedTests);
    });
    const unsubTrial = subscribeCollection('trialStudents', INITIAL_TRIAL_STUDENTS, setTrialStudents);
    const unsubAttendance = subscribeCollection('attendance', INITIAL_ATTENDANCE, setAttendance);
    const unsubTx = subscribeCollection('transactions', INITIAL_TRANSACTIONS, setTransactions);
    const unsubContact = subscribeCollection('contactNotes', INITIAL_CONTACT_NOTES, setContactNotes);
    const unsubMilestones = subscribeCollection('milestoneEvaluations', INITIAL_MILESTONE_EVALUATIONS, setMilestoneEvaluations);
    const unsubExams = subscribeCollection('exams', INITIAL_EXAMS, setExams);
    const unsubCourses = subscribeCollection('courses', INITIAL_COURSES, setCourses);
    const unsubKpis = subscribeCollection('kpis', INITIAL_KPIS, setKpis);
    const unsubInventory = subscribeCollection('inventory', INITIAL_INVENTORY, setInventory);

    // Cross-tab instant synchronization for placement tests (Immediate UI update when candidate submits in separate tab)
    let syncChannel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        syncChannel = new BroadcastChannel('idv_placement_sync_channel');
        syncChannel.onmessage = (event) => {
          if (event.data?.type === 'ADD_PLACEMENT_TEST' && event.data.test) {
            const incomingTest = event.data.test as PlacementTest;
            setPlacementTests((prev) => {
              if (prev.some((t) => t.id === incomingTest.id)) return prev;
              return [incomingTest, ...prev];
            });
            showToast(`Hệ thống vừa nhận bài kiểm tra đầu vào mới từ: ${incomingTest.candidateName}!`);
          } else if (event.data?.type === 'DELETE_PLACEMENT_TEST' && event.data.testId) {
            const targetId = event.data.testId as string;
            setPlacementTests((prev) => prev.filter((t) => t.id !== targetId));
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel init error:', e);
    }

    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === 'idv_placement_last_submission' && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          if (payload?.test) {
            const incomingTest = payload.test as PlacementTest;
            setPlacementTests((prev) => {
              if (prev.some((t) => t.id === incomingTest.id)) return prev;
              return [incomingTest, ...prev];
            });
            showToast(`Hệ thống vừa nhận bài kiểm tra đầu vào mới từ: ${incomingTest.candidateName}!`);
          }
        } catch (e) {
          console.warn('Error parsing storage sync:', e);
        }
      } else if (event.key === 'idv_placement_last_deletion' && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          if (payload?.testId) {
            setPlacementTests((prev) => prev.filter((t) => t.id !== payload.testId));
          }
        } catch (e) {
          console.warn('Error parsing storage deletion sync:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);

    // Cross-device server polling for new placement tests submitted by candidates
    const syncServerPlacementTests = async () => {
      try {
        const res = await fetch('/api/placement-tests');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            let deletedSet = new Set<string>();
            try {
              const deletedIds = JSON.parse(localStorage.getItem('idv_deleted_placement_test_ids') || '[]');
              if (Array.isArray(deletedIds)) deletedSet = new Set(deletedIds);
            } catch (e) {}

            const serverTests: PlacementTest[] = json.data.filter((t: PlacementTest) => !deletedSet.has(t.id));
            if (serverTests.length > 0) {
              setPlacementTests((prev) => {
                const map = new Map<string, PlacementTest>();
                // Keep server tests as source of truth for submissions
                serverTests.forEach((t) => map.set(t.id, t));
                prev.forEach((t) => {
                  if (!map.has(t.id) && !deletedSet.has(t.id)) {
                    map.set(t.id, t);
                  }
                });
                const merged = Array.from(map.values());
                if (merged.length !== prev.length) {
                  try {
                    localStorage.setItem('idv_placement_tests_cache', JSON.stringify(merged.slice(0, 100)));
                  } catch (e) {}
                }
                return merged;
              });
            }
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    // Initial server fetch and periodic poll every 5s
    syncServerPlacementTests();
    const serverPollTimer = setInterval(syncServerPlacementTests, 5000);

    return () => {
      clearInterval(serverPollTimer);
      syncChannel?.close();
      window.removeEventListener('storage', handleStorageSync);
      unsubStudents();
      unsubClasses();
      unsubTeachers();
      unsubLeads();
      unsubPlacement();
      unsubTrial();
      unsubAttendance();
      unsubTx();
      unsubContact();
      unsubMilestones();
      unsubExams();
      unsubCourses();
      unsubKpis();
      unsubInventory();
    };
  }, []);

  // Dual redundancy: Periodic local snapshot cache to ensure no data loss
  useEffect(() => {
    try {
      const systemSnapshot = {
        savedAt: new Date().toISOString(),
        studentsCount: students.length,
        classesCount: classes.length,
        transactionsCount: transactions.length,
      };
      localStorage.setItem('ielts_duongvu_system_health', JSON.stringify(systemSnapshot));
    } catch (e) {
      console.warn('Local storage snapshot quota or disabled:', e);
    }
  }, [students, classes, transactions]);

  const handleAddMilestoneEvaluation = (report: MilestoneEvaluationReport) => {
    setMilestoneEvaluations((prev) => [report, ...prev]);
    saveDocument('milestoneEvaluations', report);
  };

  const handleUpdateMilestoneEvaluation = (report: MilestoneEvaluationReport) => {
    setMilestoneEvaluations((prev) => prev.map((m) => (m.id === report.id ? report : m)));
    saveDocument('milestoneEvaluations', report);
  };

  // Security PIN State (Admin PIN: 0304062224, Kiến An: 6898, Tô Hiệu: 51159, Trợ lý: 8888)
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('idv_admin_pin') || '0304062224';
  });
  const [teacherPinKienAn, setTeacherPinKienAn] = useState<string>(() => {
    return localStorage.getItem('idv_teacher_pin_kienan') || '6898';
  });
  const [teacherPinToHieu, setTeacherPinToHieu] = useState<string>(() => {
    return localStorage.getItem('idv_teacher_pin_tohieu') || '51159';
  });
  const [assistantPin, setAssistantPin] = useState<string>(() => {
    return localStorage.getItem('idv_assistant_pin') || '8888';
  });
  const [pinLastUpdated, setPinLastUpdated] = useState<string>(() => {
    return localStorage.getItem('idv_teacher_pin_date') || '01/09/2026';
  });

  const handleUpdateTeacherPin = (branch: 'KienAn' | 'ToHieu', newPin: string) => {
    if (branch === 'KienAn') {
      setTeacherPinKienAn(newPin);
      localStorage.setItem('idv_teacher_pin_kienan', newPin);
    } else {
      setTeacherPinToHieu(newPin);
      localStorage.setItem('idv_teacher_pin_tohieu', newPin);
    }
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    setPinLastUpdated(dateStr);
    localStorage.setItem('idv_teacher_pin_date', dateStr);
  };

  const handleUpdateAssistantPin = (newPin: string) => {
    setAssistantPin(newPin);
    localStorage.setItem('idv_assistant_pin', newPin);
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    setPinLastUpdated(dateStr);
    localStorage.setItem('idv_teacher_pin_date', dateStr);
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('idv_admin_pin', newPin);
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    setPinLastUpdated(dateStr);
    localStorage.setItem('idv_teacher_pin_date', dateStr);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('idv_auth_user');
    setCurrentUser(null);
    setIsLoginModalOpen(false);
    showToast('Đã đăng xuất khỏi hệ thống thành công!');
  };

  // Department Emails whitelist state
  const [departmentEmails, setDepartmentEmails] = useState<DepartmentEmails>(() => {
    return loadDepartmentEmails();
  });
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);

  const handleUpdateDepartmentEmails = (emails: DepartmentEmails) => {
    setDepartmentEmails(emails);
    saveDepartmentEmails(emails);
    showToast('Đã lưu cập nhật danh sách Gmail nhân sự các bộ phận!');
  };

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTuitionModalOpen, setIsTuitionModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  const [activeReceiptTx, setActiveReceiptTx] = useState<TuitionTransaction | null>(null);

  // Role Enforcement according to exact specifications:
  // - Teacher: Only 'students' (Học viên & Lớp) and 'trial' (Học thử)
  // - Assistant Nhung Phan: Only 'students' (Nhật ký & Chấm điểm buổi học)
  // - Assistant (standard): 'students', 'admissions', 'exams', 'contact_book', 'placement', 'trial', 'teacher_sessions', 'curriculum'
  // - Admin: All modules
  const isTeacher = currentUser?.role === 'teacher';
  const isAssistant = currentUser?.role === 'assistant';
  const isNhungPhan = currentUser?.email?.trim().toLowerCase() === 'nhungphan.mkt@gmail.com';

  useEffect(() => {
    if (isNhungPhan) {
      if (currentModule !== 'students') {
        setCurrentModule('students');
      }
    } else if (isTeacher) {
      if (
        currentModule !== 'students' &&
        currentModule !== 'trial' &&
        currentModule !== 'exams' &&
        currentModule !== 'teacher_sessions'
      ) {
        setCurrentModule('students');
      }
    } else if (isAssistant) {
      const allowedAssistant: ModuleId[] = [
        'students',
        'curriculum',
        'admissions',
        'exams',
        'teacher_sessions',
        'contact_book',
        'placement',
        'trial',
      ];
      if (!allowedAssistant.includes(currentModule)) {
        setCurrentModule('students');
      }
    }
  }, [currentUser?.role, isTeacher, isAssistant, isNhungPhan, currentModule]);

  // Computed KPI stats for dashboard
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeClasses = classes.filter((c) => c.status === 'Đang diễn ra').length;
    const monthlyRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);
    const pendingLeads = leads.filter(
      (l) => l.stage !== 'Đã nhập học' && l.stage !== 'Hủy tư vấn'
    ).length;
    const unpaidCount = students.filter((s) => s.tuitionStatus !== 'Đã đóng đủ').length;
    const placementCount = placementTests.length;

    return {
      totalStudents,
      activeClasses,
      monthlyRevenue,
      pendingLeads,
      unpaidCount,
      placementCount,
    };
  }, [students, classes, transactions, leads, placementTests]);

  const effectiveClasses = useMemo(() => {
    if (isTeacher && currentUser?.name) {
      const tName = currentUser.name.toLowerCase();
      return classes.filter((c) => {
        const match =
          (c.teacherName && c.teacherName.toLowerCase().includes(tName)) ||
          (c.assistantTeacherName && c.assistantTeacherName.toLowerCase().includes(tName)) ||
          (c.teacherNames && c.teacherNames.some((tn) => tn.toLowerCase().includes(tName)));
        return match;
      });
    }
    return classes;
  }, [classes, currentUser, isTeacher]);

  const handleBatchClasses = (importedClasses: ClassGroup[]) => {
    const existingIds = new Set(classes.map((c) => c.id));
    const newOnes = importedClasses.filter((c) => !existingIds.has(c.id));
    if (newOnes.length > 0) {
      saveBatchDocuments('classes', newOnes);
      setClasses((prev) => [...prev, ...newOnes]);
      showToast(`Đã nhập thành công ${newOnes.length} lớp học mới từ Google Sheets/Excel!`);
    }
  };

  // Handler: Create Class
  const handleCreateClass = (
    newClass: ClassGroup,
    selectedStudentIds?: string[],
    newPastedStudents?: { name: string; phone?: string; note?: string }[]
  ) => {
    let studentCount = 0;
    if (selectedStudentIds && selectedStudentIds.length > 0) {
      studentCount += selectedStudentIds.length;
      setStudents((prev) => {
        const updated = prev.map((s) =>
          selectedStudentIds.includes(s.id)
            ? {
                ...s,
                classId: newClass.id,
                className: newClass.name,
                courseName: newClass.courseName,
                status: 'Đang học' as const,
              }
            : s
        );
        const enrolled = updated.filter((s) => selectedStudentIds.includes(s.id));
        if (enrolled.length > 0) saveBatchDocuments('students', enrolled);
        return updated;
      });
    }

    if (newPastedStudents && newPastedStudents.length > 0) {
      studentCount += newPastedStudents.length;
      const createdStudents: Student[] = newPastedStudents.map((item, idx) => {
        const cleanName = item.name.trim();
        const randId = `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        const codeNum = (students.length + idx + 1).toString().padStart(3, '0');
        const studentCode = `IDV-HV${codeNum}`;

        return {
          id: randId,
          code: studentCode,
          name: cleanName,
          dob: '2008-01-01',
          gender: 'Nam' as const,
          phone: item.phone || '',
          email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'hocvien'}${codeNum}@gmail.com`,
          parentName: '',
          parentPhone: item.phone || '',
          address: newClass.branch || 'Hải Phòng',
          classId: newClass.id,
          className: newClass.name,
          courseName: newClass.courseName,
          status: 'Đang học' as const,
          joinDate: newClass.startDate || new Date().toISOString().split('T')[0],
          tuitionStatus: 'Chưa đóng' as const,
          balanceOwed: newClass.tuitionFee || 14500000,
          customTuitionFee: newClass.tuitionFee || 14500000,
          courseTuitionFee: newClass.tuitionFee || 14500000,
          tuitionPayable: newClass.tuitionFee || 14500000,
        };
      });

      setStudents((prev) => [...createdStudents, ...prev]);
      saveBatchDocuments('students', createdStudents);
    }

    const finalClass = { ...newClass, currentStudents: studentCount };
    setClasses((prev) => [finalClass, ...prev]);
    saveDocument('classes', finalClass);

    // Update teacher active class count
    if (newClass.teacherId) {
      setTeachers((prev) => {
        const updated = prev.map((t) =>
          t.id === newClass.teacherId
            ? { ...t, activeClassesCount: (t.activeClassesCount || 0) + 1 }
            : t
        );
        const teacher = updated.find((t) => t.id === newClass.teacherId);
        if (teacher) saveDocument('teachers', teacher);
        return updated;
      });
    }

    showToast(`Đã tạo thành công lớp ${newClass.name} với ${studentCount} học viên!`);
  };

  // Handler: Update Class (Edit name, course, teacher, schedule, and sync student modifications / new pasted students)
  const handleUpdateClass = (
    updatedClass: ClassGroup,
    modifiedStudents?: Student[],
    newPastedStudents?: { name: string; phone?: string; note?: string; customTuitionFee?: number }[]
  ) => {
    let newCreatedCount = 0;
    let modifiedCount = 0;

    // 1. Process new pasted students if any
    let createdStudents: Student[] = [];
    if (newPastedStudents && newPastedStudents.length > 0) {
      newCreatedCount = newPastedStudents.length;
      createdStudents = newPastedStudents.map((item, idx) => {
        const cleanName = item.name.trim();
        const randId = `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        const codeNum = (students.length + (modifiedStudents?.length || 0) + idx + 1).toString().padStart(3, '0');
        const studentCode = `IDV-HV${codeNum}`;
        const fee = item.customTuitionFee || updatedClass.tuitionFee || 14500000;

        return {
          id: randId,
          code: studentCode,
          name: cleanName,
          dob: '2008-01-01',
          gender: 'Nam' as const,
          phone: item.phone || '',
          email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'hocvien'}${codeNum}@gmail.com`,
          parentName: '',
          parentPhone: item.phone || '',
          address: updatedClass.branch || 'Hải Phòng',
          classId: updatedClass.id,
          className: updatedClass.name,
          courseName: updatedClass.courseName,
          status: 'Đang học' as const,
          joinDate: updatedClass.startDate || new Date().toISOString().split('T')[0],
          tuitionStatus: 'Chưa đóng' as const,
          balanceOwed: fee,
          customTuitionFee: fee,
          courseTuitionFee: fee,
          tuitionPayable: fee,
          note: item.note || 'Dán nhanh từ chỉnh sửa lớp',
        };
      });
    }

    // 2. Update students state & batch save
    setStudents((prev) => {
      let nextStudents = [...prev];

      // Add newly created pasted students
      if (createdStudents.length > 0) {
        nextStudents = [...createdStudents, ...nextStudents];
        saveBatchDocuments('students', createdStudents);
      }

      // If modifiedStudents array is provided, merge them
      if (modifiedStudents && modifiedStudents.length > 0) {
        const modMap = new Map<string, Student>();
        modifiedStudents.forEach((st) => {
          modMap.set(st.id, {
            ...st,
            className: st.classId === updatedClass.id ? updatedClass.name : st.className,
            courseName: st.classId === updatedClass.id ? updatedClass.courseName : st.courseName,
          });
        });

        // Track newly added manual students that weren't in prev
        const existingIds = new Set(nextStudents.map((s) => s.id));
        const brandNewManual = modifiedStudents.filter((st) => !existingIds.has(st.id));

        nextStudents = nextStudents.map((s) => (modMap.has(s.id) ? modMap.get(s.id)! : s));
        if (brandNewManual.length > 0) {
          nextStudents = [...brandNewManual, ...nextStudents];
        }

        modifiedCount = modifiedStudents.length;
        saveBatchDocuments('students', modifiedStudents);
      } else {
        // Just sync className and courseName for all enrolled students
        nextStudents = nextStudents.map((s) =>
          s.classId === updatedClass.id
            ? {
                ...s,
                className: updatedClass.name,
                courseName: updatedClass.courseName,
              }
            : s
        );
        const classSts = nextStudents.filter((s) => s.classId === updatedClass.id);
        if (classSts.length > 0) saveBatchDocuments('students', classSts);
      }

      return nextStudents;
    });

    // 3. Update class record & save
    setClasses((prev) =>
      prev.map((c) => (c.id === updatedClass.id ? updatedClass : c))
    );
    saveDocument('classes', updatedClass);

    // 4. Sync exams records if any
    setExams((prev) => {
      const updated = prev.map((ex) =>
        ex.classId === updatedClass.id
          ? {
              ...ex,
              className: updatedClass.name,
            }
          : ex
      );
      const classExs = updated.filter((ex) => ex.classId === updatedClass.id);
      if (classExs.length > 0) saveBatchDocuments('exams', classExs);
      return updated;
    });

    // 5. Sync contactNotes if any
    setContactNotes((prev) => {
      const updated = prev.map((cn) =>
        cn.classId === updatedClass.id
          ? {
              ...cn,
              className: updatedClass.name,
            }
          : cn
      );
      const classCns = updated.filter((cn) => cn.classId === updatedClass.id);
      if (classCns.length > 0) saveBatchDocuments('contactNotes', classCns);
      return updated;
    });

    // 6. Toast summary
    const msg = [
      `Đã lưu cập nhật lớp ${updatedClass.name}!`,
      newCreatedCount > 0 ? `+${newCreatedCount} HV mới` : null,
      modifiedCount > 0 ? `Đã đồng bộ ${modifiedCount} học viên` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    showToast(msg);
  };

  // Handler: Add Student
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    saveDocument('students', newStudent);

    // If assigned to a class, update class current student count
    if (newStudent.classId) {
      setClasses((prev) => 
        prev.map((c) =>
          c.id === newStudent.classId ? { ...c, currentStudents: c.currentStudents + 1 } : c
        )
      );
      incrementClassStudentCount(newStudent.classId, 1);
    }

    if (newStudent.balanceOwed === 0 || newStudent.tuitionStatus === 'Đã đóng đủ') {
      const initialTx: TuitionTransaction = {
        id: `tx-${Date.now()}`,
        receiptCode: `PT-IDV-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: newStudent.id,
        studentName: newStudent.name,
        studentCode: newStudent.code,
        className: newStudent.className,
        amount: 14500000,
        paymentMethod: 'Chuyển khoản QR',
        transactionType: 'Thu học phí',
        date: new Date().toISOString().split('T')[0],
        collectorName: currentUser?.name || 'Ban Quản Lý IDV',
        status: 'Thành công',
        notes: `Học phí nhập học khóa ${newStudent.courseName} - ${selectedBranch}`,
      };
      setTransactions((prev) => [initialTx, ...prev]);
      saveDocument('transactions', initialTx);
      setActiveReceiptTx(initialTx);
    }
  };

  // Handler: Collect Tuition
  const handleCollectTuition = (newTx: TuitionTransaction) => {
    setTransactions((prev) => [newTx, ...prev]);
    saveDocument('transactions', newTx);

    // Update student balance
    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === newTx.studentId) {
          const newBalance = Math.max(0, s.balanceOwed - newTx.amount);
          return {
            ...s,
            balanceOwed: newBalance,
            tuitionStatus: newBalance === 0 ? 'Đã đóng đủ' : 'Còn nợ',
          };
        }
        return s;
      });
      const st = updated.find((s) => s.id === newTx.studentId);
      if (st) saveDocument('students', st);
      return updated;
    });

    setActiveReceiptTx(newTx);
  };

  // Handler: Update Student
  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    saveDocument('students', updatedStudent);
  };

  // Handler: Add Lead
  const handleAddLead = (newLead: LeadAdmission) => {
    setLeads((prev) => [newLead, ...prev]);
    saveDocument('leads', newLead);
  };

  // Handler: Update Lead Stage
  const handleUpdateLeadStage = (leadId: string, newStage: LeadAdmission['stage']) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l));
      const targetLead = updated.find((l) => l.id === leadId);
      if (targetLead) saveDocument('leads', targetLead);
      return updated;
    });
  };

  // Handler: Convert Trial to Student
  const handleConvertToStudent = (trial: TrialStudent) => {
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      code: `IDV-HV${Math.floor(100 + Math.random() * 900)}`,
      name: trial.studentName,
      dob: '2016-01-01',
      gender: 'Nam',
      phone: trial.phone,
      email: `${trial.studentName.toLowerCase().replace(/\s+/g, '')}@idv.edu.vn`,
      parentName: trial.parentName || 'Phụ huynh',
      parentPhone: trial.phone,
      address: 'Kiến An, Hải Phòng',
      classId: trial.classId,
      className: trial.className,
      courseName: trial.targetCourse,
      status: 'Đang học',
      joinDate: new Date().toISOString().split('T')[0],
      tuitionStatus: 'Chưa đóng',
      balanceOwed: 7500000,
    };
    handleAddStudent(newStudent);
  };

  // Handler: Import Data from Google Sheet / Excel
  const handleImportSheetData = (imported: {
    classes: ClassGroup[];
    students: Student[];
    transactions: TuitionTransaction[];
  }) => {
    setClasses((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const newClasses = imported.classes.filter((c) => !existingIds.has(c.id));
      if (newClasses.length > 0) saveBatchDocuments('classes', newClasses);
      return [...prev, ...newClasses];
    });

    setStudents((prev) => {
      const existingCodes = new Set(prev.map((s) => s.code));
      const newStudents = imported.students.filter((s) => !existingCodes.has(s.code));
      if (newStudents.length > 0) saveBatchDocuments('students', newStudents);
      return [...prev, ...newStudents];
    });

    setTransactions((prev) => {
      if (imported.transactions.length > 0) saveBatchDocuments('transactions', imported.transactions);
      return [...imported.transactions, ...prev];
    });
  };

  // Handler: Enroll or transfer student to a class
  const handleEnrollStudentToClass = (classId: string, studentIdOrData: string | Student) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    if (typeof studentIdOrData === 'string') {
      const studentId = studentIdOrData;
      setStudents((prev) => {
        const updated = prev.map((s) => {
          if (s.id === studentId) {
            const oldClassId = s.classId;
            if (oldClassId && oldClassId !== classId) {
              setClasses((clsList) => {
                const updatedCls = clsList.map((c) =>
                  c.id === oldClassId
                    ? { ...c, currentStudents: Math.max(0, c.currentStudents - 1) }
                    : c
                );
                const oldCls = updatedCls.find((c) => c.id === oldClassId);
                if (oldCls) saveDocument('classes', oldCls);
                return updatedCls;
              });
            }
            return {
              ...s,
              classId: targetClass.id,
              className: targetClass.name,
              courseName: targetClass.courseName,
            };
          }
          return s;
        });
        const enrolled = updated.find((s) => s.id === studentId);
        if (enrolled) saveDocument('students', enrolled);
        return updated;
      });
      setClasses((prev) => {
        const updated = prev.map((c) => (c.id === classId ? { ...c, currentStudents: c.currentStudents + 1 } : c));
        const newCls = updated.find((c) => c.id === classId);
        if (newCls) saveDocument('classes', newCls);
        return updated;
      });
    } else {
      const studentData = studentIdOrData;
      setStudents((prev) => {
        const exists = prev.some((s) => s.id === studentData.id);
        if (exists) {
          const oldClassId = prev.find((s) => s.id === studentData.id)?.classId;
          if (oldClassId && oldClassId !== classId) {
            setClasses((clsList) => {
              const updatedCls = clsList.map((c) =>
                c.id === oldClassId
                  ? { ...c, currentStudents: Math.max(0, c.currentStudents - 1) }
                  : c
              );
              const oldCls = updatedCls.find((c) => c.id === oldClassId);
              if (oldCls) saveDocument('classes', oldCls);
              return updatedCls;
            });
          }
          return prev.map((s) => s.id === studentData.id ? studentData : s);
        } else {
          return [studentData, ...prev];
        }
      });
      saveDocument('students', studentData);
      setClasses((prev) => {
        const updated = prev.map((c) => (c.id === classId ? { ...c, currentStudents: c.currentStudents + 1 } : c));
        const newCls = updated.find((c) => c.id === classId);
        if (newCls) saveDocument('classes', newCls);
        return updated;
      });
    }
  };

  // Handler: Remove student from a class and keep in dropped list
  const handleRemoveStudentFromClass = (classId: string, studentId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === studentId && (s.classId === classId || s.droppedClassId === classId)) {
          return {
            ...s,
            classId: '',
            className: targetClass ? `Đã nghỉ (${targetClass.name})` : 'Đã nghỉ học',
            status: 'Đã nghỉ học' as const,
            droppedClassId: classId,
            droppedClassName: targetClass?.name || 'Lớp đã học',
            droppedDate: new Date().toISOString().split('T')[0],
          };
        }
        return s;
      });
      const st = updated.find((s) => s.id === studentId);
      if (st) saveDocument('students', st);
      return updated;
    });

    setClasses((prev) => {
      const updated = prev.map((c) =>
        c.id === classId ? { ...c, currentStudents: Math.max(0, c.currentStudents - 1) } : c
      );
      const cls = updated.find((c) => c.id === classId);
      if (cls) saveDocument('classes', cls);
      return updated;
    });
  };

  // Handler: Restore dropped student back to class
  const handleRestoreStudentToClass = (classId: string, studentId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            classId: targetClass.id,
            className: targetClass.name,
            courseName: targetClass.courseName,
            status: 'Đang học' as const,
            droppedClassId: undefined,
            droppedClassName: undefined,
            droppedDate: undefined,
          };
        }
        return s;
      });
      const st = updated.find((s) => s.id === studentId);
      if (st) saveDocument('students', st);
      return updated;
    });

    setClasses((prev) => {
      const updated = prev.map((c) => (c.id === classId ? { ...c, currentStudents: c.currentStudents + 1 } : c));
      const cls = updated.find((c) => c.id === classId);
      if (cls) saveDocument('classes', cls);
      return updated;
    });
  };

  // Handler: Add Placement Test
  const handleAddPlacementTest = (test: PlacementTest) => {
    // If the test was previously deleted, remove from deleted IDs
    try {
      const existingDeleted: string[] = JSON.parse(localStorage.getItem('idv_deleted_placement_test_ids') || '[]');
      const updatedDeleted = existingDeleted.filter((id) => id !== test.id);
      localStorage.setItem('idv_deleted_placement_test_ids', JSON.stringify(updatedDeleted));
    } catch (e) {
      console.warn('Error clearing deleted id on add:', e);
    }

    // 1. Save to dedicated candidate submissions local backup
    try {
      const existingSubmitted: PlacementTest[] = JSON.parse(
        localStorage.getItem('idv_submitted_candidate_placement_tests') || '[]'
      );
      const filteredSubmitted = existingSubmitted.filter((t) => t.id !== test.id);
      const updatedSubmitted = [test, ...filteredSubmitted];
      localStorage.setItem('idv_submitted_candidate_placement_tests', JSON.stringify(updatedSubmitted.slice(0, 100)));
    } catch (e) {
      console.warn('Error saving to idv_submitted_candidate_placement_tests:', e);
    }

    setPlacementTests((prev) => {
      const filtered = prev.filter((t) => t.id !== test.id);
      const updated = [test, ...filtered];
      try {
        localStorage.setItem('idv_placement_tests_cache', JSON.stringify(updated.slice(0, 100)));
        localStorage.setItem('idv_placement_last_submission', JSON.stringify({ test, timestamp: Date.now() }));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });

    // 2. Save to Server Storage (Cross-device persistence)
    fetch('/api/placement-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test),
    }).catch((err) => console.warn('Server API save error:', err));

    // 3. Save to Firestore
    saveDocument('placementTests', test).catch((err) => {
      console.error('Error saving placement test to Firestore:', err);
    });

    // 4. Automatically create/update a Lead in Admissions
    try {
      const newLead: LeadAdmission = {
        id: `lead-pt-${test.id}`,
        code: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: test.candidateName,
        phone: test.phone,
        email: test.email || '',
        source: 'Form Test Online',
        targetCourse: test.recommendedCourse || 'Khóa 1',
        consultantName: 'Phòng Đào Tạo',
        stage: 'Hẹn test đầu vào',
        notes: `Nộp bài test lúc ${test.testDate || new Date().toISOString().split('T')[0]}. Mã: ${test.code}. L: ${test.listeningScore}, R: ${test.readingScore}, W: ${test.writingScore}, S: ${test.speakingScore} -> ${test.recommendedCourse}. Cơ sở: ${test.preferredCampus || 'Chưa rõ'}. Lịch: ${test.preferredSchedule || 'Chưa rõ'}.`,
        createdAt: test.testDate || new Date().toISOString().split('T')[0],
        expectedRevenue: 4500000,
      };
      setLeads((prev) => {
        if (prev.some((l) => l.phone === test.phone || l.id === newLead.id)) return prev;
        return [newLead, ...prev];
      });
      saveDocument('leads', newLead).catch(() => {});
    } catch (e) {
      console.warn('Error auto-creating lead for placement test:', e);
    }

    // 4. Cross-tab broadcast for instant update
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('idv_placement_sync_channel');
        bc.postMessage({ type: 'ADD_PLACEMENT_TEST', test });
        bc.close();
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  };

  // Handler: Manually sync all placement tests from Application Server & Cloud Firestore
  const handleSyncPlacementTestsFromCloud = async () => {
    try {
      let allFetched: PlacementTest[] = [];

      // 1. Fetch from application server
      try {
        const res = await fetch('/api/placement-tests');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            allFetched = [...json.data];
          }
        }
      } catch (err) {
        console.warn('Sync from server API failed:', err);
      }

      // 2. Fetch from Firestore as secondary
      try {
        const cloudTests = await fetchCollection<PlacementTest>('placementTests');
        if (cloudTests && cloudTests.length > 0) {
          const map = new Map(allFetched.map((t) => [t.id, t]));
          cloudTests.forEach((t) => map.set(t.id, t));
          allFetched = Array.from(map.values());
        }
      } catch (err) {
        console.warn('Sync from Firestore failed:', err);
      }

      const validTests = allFetched.filter((t) => !isRecordDeleted(t.id, 'placementTests'));
      if (validTests.length > 0) {
        setPlacementTests((prev) => {
          const prevMap = new Map(prev.map((t) => [t.id, t]));
          validTests.forEach((vt) => prevMap.set(vt.id, vt));
          const merged = Array.from(prevMap.values());
          try {
            localStorage.setItem('idv_placement_tests_cache', JSON.stringify(merged.slice(0, 100)));
          } catch (e) {}
          return merged;
        });
        showToast(`✅ Đã đồng bộ thành công ${validTests.length} bài test từ máy chủ & Cloud!`);
      } else {
        showToast('Hệ thống máy chủ đã cập nhật dữ liệu mới nhất.');
      }
    } catch (e) {
      console.error('Error syncing placement tests from cloud/server:', e);
      showToast('⚠️ Không thể tải từ máy chủ, vui lòng kiểm tra kết nối mạng.');
    }
  };

  // Handler: Assign candidate from Placement Test to a class or Waiting List
  const handleAssignPlacementToClass = (
    testId: string,
    targetClassId: string,
    customStudentData?: Partial<Student>
  ) => {
    const test = placementTests.find((t) => t.id === testId);
    if (!test) return;

    const targetClass = classes.find((c) => c.id === targetClassId);
    const isWaitingList = !targetClass || targetClassId === 'waiting_list';

    const cleanCandidateName = customStudentData?.name || test.candidateName;
    const cleanEmail =
      customStudentData?.email ||
      test.email ||
      `${cleanCandidateName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      code: `IDV-HV${Math.floor(100 + Math.random() * 900)}`,
      name: cleanCandidateName,
      dob: customStudentData?.dob || test.dob || '2008-01-01',
      gender: (customStudentData?.gender || test.gender || 'Nam') as 'Nam' | 'Nữ',
      phone: customStudentData?.phone || test.phone,
      email: cleanEmail,
      parentName: customStudentData?.parentName || test.parentName || `PH ${cleanCandidateName}`,
      parentPhone: customStudentData?.parentPhone || test.parentPhone || test.phone,
      address: customStudentData?.address || test.address || 'Hải Phòng',
      classId: isWaitingList ? 'waiting_list' : targetClass.id,
      className: isWaitingList ? 'Lớp Chờ Xếp (Waiting List)' : targetClass.name,
      courseName: isWaitingList ? (test.recommendedCourse || 'IELTS Nền Tảng') : targetClass.courseName,
      status: isWaitingList ? 'Chờ xếp lớp' : 'Đang học',
      joinDate: new Date().toISOString().split('T')[0],
      tuitionStatus: 'Chưa đóng',
      balanceOwed: isWaitingList ? 0 : (targetClass.tuitionFee || 14500000),
    };

    // Add student to global roster & Firestore
    setStudents((prev) => [newStudent, ...prev]);
    saveDocument('students', newStudent);

    // If assigned to an active class, increment student count
    if (!isWaitingList && targetClass) {
      setClasses((prev) => {
        const updated = prev.map((c) =>
          c.id === targetClass.id ? { ...c, currentStudents: c.currentStudents + 1 } : c
        );
        const cls = updated.find((c) => c.id === targetClass.id);
        if (cls) saveDocument('classes', cls);
        return updated;
      });
    }

    // Update test record in state & Firestore
    setPlacementTests((prev) => {
      const updated = prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              status: isWaitingList ? ('Đã xếp lớp chờ' as const) : ('Đã nhập học' as const),
              assignedClassId: isWaitingList ? 'waiting_list' : targetClass.id,
              assignedClassName: isWaitingList ? 'Lớp Chờ Xếp (Waiting List)' : targetClass.name,
            }
          : t
      );
      const updatedTest = updated.find((t) => t.id === testId);
      if (updatedTest) saveDocument('placementTests', updatedTest);
      return updated;
    });
  };

  // Handler: Update Placement Test status or data
  const handleUpdatePlacementTest = (updatedTest: PlacementTest) => {
    setPlacementTests((prev) =>
      prev.map((t) => (t.id === updatedTest.id ? updatedTest : t))
    );
    saveDocument('placementTests', updatedTest);
  };

  const handleDeleteClass = async (classId: string) => {
    const target = classes.find((c) => c.id === classId);
    const targetName = target ? target.name : 'lớp học';

    // 1. Record to deleted IDs set in localStorage to prevent any resurrection
    try {
      const existingDeleted: string[] = JSON.parse(localStorage.getItem('idv_deleted_class_ids') || '[]');
      if (!existingDeleted.includes(classId)) {
        existingDeleted.push(classId);
      }
      localStorage.setItem('idv_deleted_class_ids', JSON.stringify(existingDeleted));
    } catch (e) {
      console.warn('LocalStorage delete error for class:', e);
    }

    // 2. Optimistically update local state immediately
    setClasses((prev) => prev.filter((c) => c.id !== classId));

    // 3. Unassign students from this deleted class so they don't try to sync back
    setStudents((prev) => {
      const affected = prev.filter((s) => s.classId === classId);
      if (affected.length === 0) return prev;
      const updated = prev.map((s) =>
        s.classId === classId
          ? {
              ...s,
              classId: '',
              className: 'Chưa xếp lớp (Lớp đã xóa)',
            }
          : s
      );
      const changed = updated.filter((s) => s.classId === '' && affected.some((a) => a.id === s.id));
      if (changed.length > 0) saveBatchDocuments('students', changed);
      return updated;
    });

    // 4. Delete from Firebase Firestore & VPS
    await deleteDocument('classes', classId);

    // 5. Show friendly toast confirmation
    showToast(`Đã xóa thành công ${targetName}!`);
  };

  const handleClearAllClasses = async () => {
    setClasses([]);
    setStudents((prev) => {
      const updated = prev.map((s) => ({
        ...s,
        classId: '',
        className: 'Chưa xếp lớp',
      }));
      saveBatchDocuments('students', updated);
      return updated;
    });
    await clearCollection('classes');
    showToast('Đã xóa sạch toàn bộ danh sách lớp học trên toàn hệ thống (Firestore, Server & Bộ nhớ)!');
  };

  const handleDeleteStudent = async (studentId: string) => {
    const targetStudent = students.find((s) => s.id === studentId);
    const targetName = targetStudent?.name || 'Học viên';
    const classId = targetStudent?.classId;

    // 1. Record to deleted student IDs in localStorage blacklist
    try {
      const existingDeleted: string[] = JSON.parse(localStorage.getItem('idv_deleted_student_ids') || '[]');
      if (!existingDeleted.includes(studentId)) {
        existingDeleted.push(studentId);
      }
      localStorage.setItem('idv_deleted_student_ids', JSON.stringify(existingDeleted));
    } catch (e) {
      console.warn('LocalStorage student delete error:', e);
    }

    // 2. Immediately update state
    setStudents((prev) => prev.filter((s) => s.id !== studentId));

    // 3. If student belongs to a class, decrease the class's currentStudents count
    if (classId) {
      setClasses((prev) => {
        const updated = prev.map((c) =>
          c.id === classId
            ? { ...c, currentStudents: Math.max(0, (c.currentStudents || 1) - 1) }
            : c
        );
        const affectedClass = updated.find((c) => c.id === classId);
        if (affectedClass) saveDocument('classes', affectedClass);
        return updated;
      });
    }

    // 4. Delete from Firestore & VPS storage
    await deleteDocument('students', studentId);

    // 5. Toast notification
    showToast(`Đã xóa học viên ${targetName} khỏi hệ thống!`);
  };

  const handleDeletePlacementTest = async (testId: string) => {
    // 1. Record to deleted IDs set in localStorage to prevent initial/cached resurrection
    try {
      const existingDeleted: string[] = JSON.parse(localStorage.getItem('idv_deleted_placement_test_ids') || '[]');
      if (!existingDeleted.includes(testId)) {
        existingDeleted.push(testId);
      }
      localStorage.setItem('idv_deleted_placement_test_ids', JSON.stringify(existingDeleted));
      localStorage.setItem('idv_placement_last_deletion', JSON.stringify({ testId, timestamp: Date.now() }));
    } catch (e) {
      console.warn('LocalStorage delete error:', e);
    }

    // 2. Immediately update state
    setPlacementTests((prev) => {
      const updated = prev.filter((t) => t.id !== testId);
      try {
        localStorage.setItem('idv_placement_tests_cache', JSON.stringify(updated.slice(0, 100)));
      } catch (e) {
        console.warn('LocalStorage cache update error:', e);
      }
      return updated;
    });

    // 3. Delete from Server Storage
    fetch(`/api/placement-tests/${testId}`, { method: 'DELETE' }).catch((e) =>
      console.warn('Server API delete error:', e)
    );

    // 4. Delete from Firestore cloud database
    try {
      await deleteDocument('placementTests', testId);
    } catch (error) {
      console.error("Error deleting placement test from Firestore:", error);
    }

    // 5. Cross-tab broadcast for instant deletion update
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('idv_placement_sync_channel');
        bc.postMessage({ type: 'DELETE_PLACEMENT_TEST', testId });
        bc.close();
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  };

  // Handler: Add Trial Student
  const handleAddTrialStudent = (trial: TrialStudent) => {
    setTrialStudents((prev) => [trial, ...prev]);
    saveDocument('trialStudents', trial);
  };

  // Handler: Bulk Save Attendance
  const handleSaveAttendance = (newRecords: AttendanceRecord[]) => {
    setAttendance((prev) => {
      const filtered = prev.filter(
        (r) => !newRecords.some((nr) => nr.classId === r.classId && nr.date === r.date && nr.studentId === r.studentId)
      );
      return [...newRecords, ...filtered];
    });
    if (newRecords.length > 0) {
      saveBatchDocuments('attendance', newRecords);
    }
  };

  // Handler: Send Contact Note
  const handleSendMessage = (noteId: string) => {
    setContactNotes((prev) => {
      const updated = prev.map((n) => (n.id === noteId ? { ...n, sentVia: 'Zalo & App Phụ Huynh' } : n));
      const targetNote = updated.find((n) => n.id === noteId);
      if (targetNote) saveDocument('contactNotes', targetNote);
      return updated;
    });
  };

  // Handler: Add Teacher
  const handleAddTeacher = (teacher: Teacher) => {
    setTeachers((prev) => [teacher, ...prev]);
    saveDocument('teachers', teacher);
  };

  // Handler: Add Exam Score
  const handleAddExamScore = (exam: ExamScore) => {
    setExams((prev) => [exam, ...prev]);
    saveDocument('exams', exam);
  };

  // Handler: Update Inventory Stock
  const handleUpdateInventoryStock = (itemId: string, newStock: number) => {
    setInventory((prev) => {
      const updated = prev.map((item) => (item.id === itemId ? { ...item, inStock: newStock } : item));
      const targetItem = updated.find((item) => item.id === itemId);
      if (targetItem) saveDocument('inventory', targetItem);
      return updated;
    });
  };

  // Global search filtering across students and classes
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matchedStudents = students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.phone.includes(q)
    );
    const matchedClasses = classes.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
    const matchedTransactions = transactions.filter(
      (t) => t.receiptCode.toLowerCase().includes(q) || t.studentName.toLowerCase().includes(q)
    );
    return {
      students: matchedStudents,
      classes: matchedClasses,
      transactions: matchedTransactions,
    };
  }, [searchQuery, students, classes, transactions]);

  // List of modules for top pill navigation (Filtered by RBAC)
  const allNavModules: { id: ModuleId; title: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', title: 'Tổng quan', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'finance', title: 'Tài chính', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'students', title: 'Học viên & Lớp', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'admissions', title: 'Tuyển sinh', icon: <UserPlus className="w-3.5 h-3.5" /> },
    { id: 'exams', title: 'Điểm thi', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'teacher_sessions', title: 'Số buổi dạy', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: 'contact_book', title: 'Sổ liên lạc', icon: <MessageSquareText className="w-3.5 h-3.5" /> },
    { id: 'placement', title: 'Test đầu vào', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: 'speaking_practice', title: 'Luyện Speaking', icon: <MessageSquareText className="w-3.5 h-3.5" /> },
    { id: 'hr', title: 'Nhân sự', icon: <Users2 className="w-3.5 h-3.5" /> },
    { id: 'reports', title: 'Báo cáo', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'kpi', title: 'Chỉ tiêu', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'curriculum', title: 'Khóa học & Học phí', icon: <BookMarked className="w-3.5 h-3.5" /> },
    { id: 'inventory', title: 'Kho hàng', icon: <PackageCheck className="w-3.5 h-3.5" /> },
  ];

  const moduleNavList = isNhungPhan
    ? [{ id: 'students' as ModuleId, title: 'Nhật Ký & Chấm Điểm', icon: <BookOpen className="w-3.5 h-3.5 text-purple-600" /> }]
    : isTeacher
    ? allNavModules.filter((m) => m.id === 'students' || m.id === 'exams' || m.id === 'teacher_sessions' || m.id === 'speaking_practice')
    : isAssistant
    ? allNavModules.filter((m) =>
        ['students', 'curriculum', 'admissions', 'exams', 'teacher_sessions', 'contact_book', 'placement', 'speaking_practice'].includes(m.id)
      )
    : allNavModules;

  // Render standalone Student Vocab / Review Test Portal View when accessed via link (?vocabTestId=... or ?reviewTestId=...)
  if (vocabTestIdParam || reviewTestIdParam) {
    const isReview = Boolean(reviewTestIdParam);
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased">
        {/* Student Vocab Portal Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white font-black flex items-center justify-center text-lg shadow-md border-2 border-purple-500">
                DV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wide">
                    IELTS DƯƠNG VŨ
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✅ Trang kiểm tra chính thức
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                  {isReview ? 'Bài ôn tập kiến thức - IELTS Dương Vũ' : 'Bài kiểm tra từ vựng - IELTS Dương Vũ'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Hệ thống tự động chấm điểm &amp; xếp hạng
              </span>
            </div>
          </div>
        </header>

        {/* Student Vocab Test Body */}
        <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 flex-1">
          <ClassVocabTestModule
            classes={classes}
            students={students}
            onAddExamScore={handleAddExamScore}
            onSaveAttendance={handleSaveAttendance}
            initialVocabTestId={vocabTestIdParam || undefined}
            initialReviewTestId={reviewTestIdParam || undefined}
            showToast={showToast}
          />
        </main>

        {/* Global Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md max-w-md">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render standalone Student Pronunciation Portal View when accessed via link (?mode=pronunciation)
  if (isPronunciationPortal) {
    const classCodeFromUrl = new URLSearchParams(window.location.search).get('classCode') || '';
    const matchingClass =
      classes.find(
        (c) =>
          c.code.toLowerCase() === classCodeFromUrl.toLowerCase() ||
          c.name.toLowerCase().includes(classCodeFromUrl.toLowerCase())
      ) ||
      classes[0] || {
        id: 'class-default',
        name: classCodeFromUrl || 'Lớp IELTS',
        code: classCodeFromUrl || 'IDV-CLASS',
        branch: 'Kiến An',
        teacherName: 'Giáo viên IDV',
        courseName: 'IELTS Preparation',
      };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        {/* Student Pronunciation Portal Header */}
        <header className="bg-slate-900 border-b border-white/10 sticky top-0 z-40 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md border-2 border-indigo-400">
                🎙️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-500/40 uppercase tracking-wide">
                    IELTS DƯƠNG VŨ
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">CỔNG LUYỆN PHÁT ÂM HỌC SINH</span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-white leading-tight mt-0.5">
                  Cổng Luyện Tập & Thu Âm Lớp: {matchingClass.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Tính thời gian & Thu âm trực tiếp
              </span>
            </div>
          </div>
        </header>

        {/* Pronunciation Portal Body */}
        <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-8 flex-1">
          <ClassPronunciationModule
            classGroup={matchingClass as any}
            students={students.filter((s) => s.classId === matchingClass.id || s.className === matchingClass.name)}
            standalonePortalMode={true}
            showToast={showToast}
          />
        </main>

        {/* Global Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 backdrop-blur-md max-w-md">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render standalone Student Speaking AI Portal View when accessed via link (?mode=speaking)
  if (isSpeakingPortal) {
    const classCodeFromUrl = new URLSearchParams(window.location.search).get('classCode') || '';
    const matchingClass =
      classes.find(
        (c) =>
          c.code.toLowerCase() === classCodeFromUrl.toLowerCase() ||
          c.name.toLowerCase().includes(classCodeFromUrl.toLowerCase())
      ) ||
      classes[0] || {
        id: 'class-default',
        name: classCodeFromUrl || 'Lớp IELTS',
        code: classCodeFromUrl || 'IDV-CLASS',
        branch: 'Kiến An',
        teacherName: 'Giáo viên IDV',
        courseName: 'IELTS Preparation',
      };

    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md border-2 border-indigo-400">
                🗣️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wide">
                    IELTS DƯƠNG VŨ
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">CỔNG LUYỆN SPEAKING AI</span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                  Phòng Luyện Tập Lớp: {matchingClass.name}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 flex-1">
          <SpeakingPracticeModule
            activeStudent={null} // Will show login inside module if null and standalone
            standalonePortalMode={true}
          />
        </main>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 backdrop-blur-md max-w-md">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Render standalone Student Portal View when accessed via link (?test=online)
  if (isStudentPortal) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased">
        {/* Student Portal Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center text-lg shadow-md border-2 border-amber-400">
                DV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                    IELTS DƯƠNG VŨ
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Hải Phòng</span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                  Bài kiểm tra đầu vào IELTS Dương Vũ
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống tự động lưu điểm & xếp lớp
              </span>
            </div>
          </div>
        </header>

        {/* Student Test Form Body */}
        <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 flex-1">
          <OnlinePlacementTestForm
            placementTests={placementTests}
            classes={classes}
            courses={courses}
            onAddTest={handleAddPlacementTest}
            onDeleteTest={handleDeletePlacementTest}
            onSyncFromCloud={handleSyncPlacementTestsFromCloud}
            showToast={showToast}
            googleFormUrl=""
            currentUser={currentUser}
            isStudentPortal={true}
          />
        </main>

        {/* Global Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md max-w-md">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Gatekeeper: Authentication & Security PIN code is required to enter the internal system
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans antialiased">
        <LoginModal
          isOpen={true}
          isForcedAuth={true}
          onClose={() => {}}
          currentUser={null}
          teachers={teachers}
          selectedBranch={selectedBranch}
          onBranchChange={(branch) => setSelectedBranch(branch)}
          departmentEmails={departmentEmails}
          onUpdateDepartmentEmails={handleUpdateDepartmentEmails}
          teacherPinKienAn={teacherPinKienAn}
          teacherPinToHieu={teacherPinToHieu}
          assistantPin={assistantPin}
          adminPin={adminPin}
          pinLastUpdated={pinLastUpdated}
          onUpdateTeacherPin={handleUpdateTeacherPin}
          onUpdateAssistantPin={handleUpdateAssistantPin}
          onUpdateAdminPin={handleUpdateAdminPin}
          onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
          onSelectUser={(user) => {
            setCurrentUser(user);
            sessionStorage.setItem('idv_auth_user', JSON.stringify(user));
            setIsLoginModalOpen(false);
            if (user.role === 'teacher' || user.role === 'assistant') {
              setCurrentModule('students');
            }
            showToast(`Đăng nhập thành công: ${user.name}!`);
          }}
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md max-w-md">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
      
      {/* Top Main Navigation Header */}
      <Header
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        onOpenQuickTuition={() => setIsTuitionModalOpen(true)}
        onOpenQuickStudent={() => setIsStudentModalOpen(true)}
        onOpenCreateClass={() => setIsCreateClassModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
        onExportExcel={() => exportCenterDataToExcel({ classes: effectiveClasses, students, teachers, transactions })}
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        studentCount={students.length}
      />

      {/* Sub-Header Module Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar text-xs">
            {moduleNavList.map((m) => {
              const isActive = currentModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setCurrentModule(m.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-purple-700 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
                  }`}
                >
                  {m.icon}
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>

          {/* If Teacher, show role reminder */}
          {isTeacher && (
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 shrink-0">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phân quyền Giáo viên: Truy cập Lớp học & Điểm thi</span>
            </div>
          )}

          {/* If Assistant Nhung Phan, show role reminder */}
          {isNhungPhan && (
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-purple-900 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 shrink-0">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>Phân quyền Trợ lý Nhung Phan: Nhật ký & Chấm điểm buổi học</span>
            </div>
          )}
        </div>
      </div>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Global Search Results Overlay (If user is typing in the search bar) */}
        {searchResults && (
          <div className="mb-6 bg-white p-5 rounded-2xl border border-purple-200 shadow-md animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-purple-900">
                Kết quả tìm kiếm cho "{searchQuery}":
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Đóng tìm kiếm
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-700 mb-2">Học viên ({searchResults.students.length})</h4>
                {searchResults.students.length === 0 ? (
                  <p className="text-slate-400">Không tìm thấy</p>
                ) : (
                  searchResults.students.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setCurrentModule(isTeacher ? 'attendance' : 'students');
                        setSearchQuery('');
                      }}
                      className="p-2 hover:bg-purple-50 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <strong>{s.name}</strong> ({s.code})
                        <div className="text-[11px] text-slate-500">{s.className}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Lớp học ({searchResults.classes.length})</h4>
                {searchResults.classes.length === 0 ? (
                  <p className="text-slate-400">Không tìm thấy</p>
                ) : (
                  searchResults.classes.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCurrentModule('students');
                        setSearchQuery('');
                      }}
                      className="p-2 hover:bg-purple-50 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <strong>{c.name}</strong>
                        <div className="text-[11px] text-purple-700">{c.teacherName}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Biên lai phiếu thu ({searchResults.transactions.length})</h4>
                {searchResults.transactions.length === 0 ? (
                  <p className="text-slate-400">Không tìm thấy</p>
                ) : (
                  searchResults.transactions.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (!isTeacher) {
                          setCurrentModule('finance');
                          setSearchQuery('');
                          setActiveReceiptTx(t);
                        }
                      }}
                      className="p-2 hover:bg-purple-50 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <strong>{t.receiptCode}</strong> - {t.studentName}
                        <div className="text-[11px] text-emerald-700 font-bold">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Module Content Rendering with RBAC Enforcement */}
        
        {/* Dashboard: only accessible for admin */}
        {currentModule === 'dashboard' && !isTeacher && (
          <ModuleGrid
            onSelectModule={setCurrentModule}
            onOpenCreateClass={() => setIsCreateClassModalOpen(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onExportExcel={() => exportCenterDataToExcel({ classes: effectiveClasses, students, teachers, transactions })}
            currentUser={currentUser}
            stats={stats}
          />
        )}

        {/* Exams: accessible for both teacher and admin */}
        {currentModule === 'exams' && (
          <ExamsModule
            exams={exams}
            classes={effectiveClasses}
            students={students}
            onAddExamScore={handleAddExamScore}
            onOpenCreateClass={() => setIsCreateClassModalOpen(true)}
            currentUser={currentUser}
          />
        )}

        {/* Teacher Sessions: accessible for teacher, assistant and admin */}
        {currentModule === 'teacher_sessions' && (
          <TeacherSessionsModule
            classes={effectiveClasses}
            students={students}
            teachers={teachers}
            attendanceRecords={attendance}
            currentUser={currentUser}
          />
        )}

        {/* Speaking Practice: accessible for teacher, assistant and admin */}
        {currentModule === 'speaking_practice' && (
          <SpeakingPracticeModule activeStudent={currentUser} />
        )}

        {/* Students & Classes: accessible for both teacher and admin */}
        {currentModule === 'students' && (
          <StudentsModule
            students={students}
            classes={effectiveClasses}
            teachers={teachers}
            courses={courses}
            attendanceRecords={attendance}
            transactions={transactions}
            onSaveAttendance={handleSaveAttendance}
            onAddTeacher={handleAddTeacher}
            onAddExamScore={handleAddExamScore}
            onAddStudent={() => setIsStudentModalOpen(true)}
            onOpenCreateClass={() => setIsCreateClassModalOpen(true)}
            onUpdateClass={handleUpdateClass}
            onOpenImportSheet={() => setIsImportSheetOpen(true)}
            onEnrollStudentToClass={handleEnrollStudentToClass}
            onRemoveStudentFromClass={handleRemoveStudentFromClass}
            onRestoreStudentFromClass={handleRestoreStudentToClass}
            onUpdateStudent={handleUpdateStudent}
            onOpenQuickTuition={() => setIsTuitionModalOpen(true)}
            currentUser={currentUser}
            onDeleteClass={handleDeleteClass}
            onClearAllClasses={handleClearAllClasses}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {/* Admin-only Modules */}
        {!isTeacher && (
          <>
            {currentModule === 'finance' && (
              <FinanceModule
                transactions={transactions}
                students={students}
                classes={classes}
                onOpenCollectModal={() => setIsTuitionModalOpen(true)}
                onViewReceipt={(tx) => setActiveReceiptTx(tx)}
                allBackupData={{
                  students,
                  classes,
                  teachers,
                  leads,
                  placementTests,
                  trialStudents,
                  attendance,
                  transactions,
                  contactNotes,
                  milestoneEvaluations,
                  exams,
                  courses,
                  kpis,
                  inventory,
                }}
              />
            )}

            {currentModule === 'admissions' && (
              <AdmissionsModule
                leads={leads}
                onAddLead={() => setIsLeadModalOpen(true)}
                onUpdateStage={handleUpdateLeadStage}
              />
            )}

            {currentModule === 'contact_book' && (
              <ContactBookModule
                notes={contactNotes}
                students={students}
                classes={classes}
                attendanceRecords={attendance}
                exams={exams}
                milestoneEvaluations={milestoneEvaluations}
                onAddNote={(note) => setContactNotes([note, ...contactNotes])}
                onAddMilestoneEvaluation={handleAddMilestoneEvaluation}
                onUpdateMilestoneEvaluation={handleUpdateMilestoneEvaluation}
              />
            )}

            {currentModule === 'placement' && (
              <PlacementModule
                placementTests={placementTests}
                classes={classes}
                courses={courses}
                students={students}
                onAddTest={handleAddPlacementTest}
                onAssignToClass={handleAssignPlacementToClass}
                onUpdateTest={handleUpdatePlacementTest}
                onDeleteTest={handleDeletePlacementTest}
                onSyncFromCloud={handleSyncPlacementTestsFromCloud}
                currentUser={currentUser}
                onOpenStudentPortalPreview={() => {
                  window.open(`${window.location.origin}${window.location.pathname}?test=online`, '_blank');
                }}
              />
            )}

            {currentModule === 'trial' && (
              <TrialModule
                trialStudents={trialStudents}
                classes={classes}
                onAddTrialStudent={handleAddTrialStudent}
                onConvertToStudent={handleConvertToStudent}
              />
            )}

            {currentModule === 'hr' && (
              <HRModule
                teachers={teachers}
                classes={classes}
                students={students}
                onAddTeacher={handleAddTeacher}
                onUpdateClass={handleUpdateClass}
              />
            )}

            {currentModule === 'reports' && (
              <ReportsModule
                students={students}
                transactions={transactions}
                classes={effectiveClasses}
                teachers={teachers}
              />
            )}

            {currentModule === 'kpi' && (
              <KPIModule kpis={kpis} />
            )}

            {currentModule === 'curriculum' && (
              <CurriculumModule
                courses={courses}
                students={students}
                classes={classes}
                onUpdateStudent={handleUpdateStudent}
                currentUser={currentUser}
              />
            )}

            {currentModule === 'inventory' && (
              <InventoryModule
                inventory={inventory}
                onUpdateStock={handleUpdateInventoryStock}
                onAddItem={(newItem) => setInventory((prev) => [newItem, ...prev])}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 <strong>IDV Language Academy</strong> (Cơ sở 1: Tô Hiệu • Cơ sở 2: Kiến An, Hải Phòng).
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Phiên bản IDV v4.8</span>
            <span>•</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-purple-700 hover:underline font-bold flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Chuyển đổi vai trò / Đăng nhập</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
        onAddClass={handleCreateClass}
        onAddBatchClasses={handleBatchClasses}
        onSave={handleCreateClass}
        teachers={teachers}
        courses={courses}
        students={students}
        defaultBranch={selectedBranch}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        teachers={teachers}
        selectedBranch={selectedBranch}
        onBranchChange={(branch) => setSelectedBranch(branch)}
        departmentEmails={departmentEmails}
        onUpdateDepartmentEmails={handleUpdateDepartmentEmails}
        teacherPinKienAn={teacherPinKienAn}
        teacherPinToHieu={teacherPinToHieu}
        assistantPin={assistantPin}
        adminPin={adminPin}
        pinLastUpdated={pinLastUpdated}
        onUpdateTeacherPin={handleUpdateTeacherPin}
        onUpdateAssistantPin={handleUpdateAssistantPin}
        onUpdateAdminPin={handleUpdateAdminPin}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
        onSelectUser={(user) => {
          setCurrentUser(user);
          sessionStorage.setItem('idv_auth_user', JSON.stringify(user));
          if (user.role === 'teacher' || user.role === 'assistant') {
            setCurrentModule('students');
          }
          showToast(`Đã chuyển vai trò: ${user.name}`);
        }}
      />

      <StaffEmailManagementModal
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
        departmentEmails={departmentEmails}
        onUpdateDepartmentEmails={handleUpdateDepartmentEmails}
        adminPin={adminPin}
        assistantPin={assistantPin}
        teacherPinKienAn={teacherPinKienAn}
        teacherPinToHieu={teacherPinToHieu}
        onUpdateAdminPin={handleUpdateAdminPin}
        onUpdateAssistantPin={handleUpdateAssistantPin}
        onUpdateTeacherPin={handleUpdateTeacherPin}
      />

      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        classes={classes}
        onAddStudent={handleAddStudent}
      />

      <CollectTuitionModal
        isOpen={isTuitionModalOpen}
        onClose={() => setIsTuitionModalOpen(false)}
        students={students}
        onCollect={handleCollectTuition}
      />

      <NewLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onAddLead={handleAddLead}
      />

      <ReceiptModal
        transaction={activeReceiptTx}
        onClose={() => setActiveReceiptTx(null)}
      />

      <ImportSheetModal
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
        onImportData={handleImportSheetData}
      />

    </div>
  );
}
