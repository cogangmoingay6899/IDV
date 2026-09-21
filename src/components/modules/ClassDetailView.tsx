import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Search,
  Users,
  Calendar,
  Clock,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  School,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Plus,
  BookOpen,
  Award,
  Save,
  Check,
  History,
  FileSpreadsheet,
  Calculator,
  PenTool,
  MessageCircle,
  Copy,
  ExternalLink,
  Share2,
  Layers,
  ChevronRight,
  ListOrdered,
  Edit3,
  RotateCcw,
  UserX,
  RefreshCw,
  Eye,
  Printer,
  Download,
  Mail,
  DollarSign,
  Lock,
  ShieldAlert,
  Coins,
  CreditCard,
  Bell,
  Sliders,
  Trash2,
} from 'lucide-react';
import { Student, ClassGroup, Teacher, AttendanceRecord, ExamScore, CurriculumCourse, AuthUser } from '../../types';
import { ClassSpreadsheetGradebookModule } from './ClassSpreadsheetGradebookModule';
import { ClassVocabTestModule } from './ClassVocabTestModule';
import { CreateTeacherModal } from '../modals/CreateTeacherModal';
import { EditClassModal } from '../modals/EditClassModal';
import { ClassScoreExportModal } from '../modals/ClassScoreExportModal';
import { HomeworkConfigModal } from '../modals/HomeworkConfigModal';
import { ClassFullScheduleModal } from '../modals/ClassFullScheduleModal';
import { CourseTuitionTable } from './CourseTuitionTable';
import {
  calculateCourseSchedule,
  detectCourseLevel,
  formatDateVN,
  COURSE_LEVEL_CONFIGS,
} from '../../utils/courseSchedule';

interface ClassDetailViewProps {
  classGroup: ClassGroup;
  allStudents: Student[];
  teachers?: Teacher[];
  courses?: CurriculumCourse[];
  attendanceRecords?: AttendanceRecord[];
  onSaveAttendance?: (records: AttendanceRecord[]) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  onAddExamScore?: (exam: ExamScore) => void;
  onUpdateClass?: (
    updatedClass: ClassGroup,
    modifiedStudents?: Student[],
    newPastedStudents?: { name: string; phone?: string; note?: string; customTuitionFee?: number }[]
  ) => void;
  onBack: () => void;
  onEnrollStudent: (classId: string, studentIdOrData: string | Student) => void;
  onRemoveStudent: (classId: string, studentId: string) => void;
  onRestoreStudent?: (classId: string, studentId: string) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onDeleteClass?: (classId: string) => void;
  currentUser?: AuthUser;
}

const COMMON_SKILLS = [
  'Từ vựng',
  'Nghe',
  'Đọc',
  'Nói',
  'Viết',
  'Viết Task 1',
  'Viết Task 2',
  'Phát âm',
  'Ngữ pháp',
  'Ôn tập',
];

const SKILL_ICONS: Record<string, string> = {
  'Từ vựng': '📚',
  'Nghe': '🎧',
  'Đọc': '📖',
  'Nói': '🗣️',
  'Viết': '✍️',
  'Viết Task 1': '📝',
  'Viết Task 2': '✒️',
  'Phát âm': '🎙️',
  'Ngữ pháp': '✏️',
  'Ôn tập': '🔄',
};

export interface StudentRowState {
  status: AttendanceRecord['status'];
  skillScores: Record<string, string>; // e.g. { 'Từ vựng': '9.0', 'Nghe': '8.5', 'Đọc': '8.0' }
  penaltyCopies: string; // for 'Viết'
  penaltyFee?: string; // e.g. '50.000 đ'
  previousDebt?: string; // Nợ chưa nộp các buổi trước
  penaltyBankAccount?: string;
  feedback: string;
  homeworkStatus: 'Đã làm' | 'Thiếu' | 'Chưa làm';
  missingHomeworkItems?: string[];
  quizletStatus: 'Đã học' | 'Chưa học';
  note: string;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({
  classGroup,
  allStudents,
  teachers = [],
  courses = [],
  attendanceRecords = [],
  onSaveAttendance,
  onAddTeacher,
  onAddExamScore,
  onUpdateClass,
  onBack,
  onEnrollStudent,
  onRemoveStudent,
  onRestoreStudent,
  onUpdateStudent,
  onDeleteClass,
  currentUser,
}) => {
  // Permission: Only Center Managers (admin) and Assistants (assistant) are allowed to access Course Management & Student Tuition
  const canAccessCourseTuition = !currentUser || currentUser.role === 'admin' || currentUser.role === 'assistant';
  const isManager = currentUser?.role === 'admin';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  // Default directly to grading log as requested by user
  const [activeTab, setActiveTab] = useState<'daily_log' | 'students' | 'sheet_view' | 'vocab_tests'>('daily_log');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for course term management
  const [isTermHistoryModalOpen, setIsTermHistoryModalOpen] = useState(false);
  const [activeTermModalTab, setActiveTermModalTab] = useState<'tuition_students' | 'term_settings' | 'term_history'>('tuition_students');
  const [currentTermInput, setCurrentTermInput] = useState(1);
  const [currentTermNameInput, setCurrentTermNameInput] = useState('');
  const [tuitionFeeInput, setTuitionFeeInput] = useState(14500000);
  const [newTermName, setNewTermName] = useState('');
  const [newTermTuition, setNewTermTuition] = useState(14500000);
  const [newTermTotalSessions, setNewTermTotalSessions] = useState(36);
  const [newTermStartDate, setNewTermStartDate] = useState('');
  const [newTermEndDate, setNewTermEndDate] = useState('');
  const [isUpgradingFormOpen, setIsUpgradingFormOpen] = useState(false);

  // States for dynamic student tuition (joining later / custom tuition)
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<Student | null>(null);
  const [enrollCustomTuition, setEnrollCustomTuition] = useState(14500000);
  const [enrollPaidAmount, setEnrollPaidAmount] = useState(0);

  // Populate term states when classGroup changes or modal opens
  useEffect(() => {
    if (classGroup) {
      setCurrentTermInput(classGroup.currentTerm || 1);
      setCurrentTermNameInput(classGroup.currentTermName || `Khóa ${classGroup.currentTerm || 1}`);
      setTuitionFeeInput(classGroup.tuitionFee || 14500000);
      setNewTermName(`Khóa ${(classGroup.currentTerm || 1) + 1}`);
      setNewTermTuition(classGroup.tuitionFee || 14500000);
      setNewTermTotalSessions(classGroup.totalSessions || 36);
      
      const todayStr = new Date().toISOString().split('T')[0];
      setNewTermStartDate(todayStr);
      
      // Default end date is 3 months from today
      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      setNewTermEndDate(future.toISOString().split('T')[0]);

      // Initialize tuition for joining student
      setEnrollCustomTuition(classGroup.tuitionFee || 14500000);
      setEnrollPaidAmount(0);

      setNewStudentForm((prev) => ({
        ...prev,
        customTuitionFee: classGroup.tuitionFee || 14500000,
        paidAmount: 0,
      }));
    }
  }, [classGroup, isTermHistoryModalOpen]);

  // Full Roster Modal State (Xem toàn bộ danh sách học viên lớp ngắn gọn STT, Tên, DOB, Gmail, SĐT)
  const [isFullRosterModalOpen, setIsFullRosterModalOpen] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  // Zalo Message Modals
  const [selectedStudentForZalo, setSelectedStudentForZalo] = useState<Student | null>(null);
  const [isClassZaloModalOpen, setIsClassZaloModalOpen] = useState(false);
  const [copiedZaloId, setCopiedZaloId] = useState<string | null>(null);

  // Add student modal internal tabs
  const [modalTab, setModalTab] = useState<'existing' | 'new'>('existing');
  const [existingSearch, setExistingSearch] = useState('');

  // Form for new student
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    phone: '',
    dob: '2008-01-15',
    gender: 'Nữ' as 'Nam' | 'Nữ' | 'Khác',
    parentName: '',
    parentPhone: '',
    tuitionStatus: 'Đã đóng đủ' as 'Đã đóng đủ' | 'Còn nợ' | 'Chưa đóng',
    balanceOwed: 0,
    customTuitionFee: 14500000,
    paidAmount: 0,
  });

  // Modal & form state for registering waiting student for next cohort
  const [isAddWaitingStudentModalOpen, setIsAddWaitingStudentModalOpen] = useState(false);
  const [newWaitingForm, setNewWaitingForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '2008-05-20',
    gender: 'Nữ' as 'Nam' | 'Nữ',
    parentName: '',
    parentPhone: '',
    waitingNote: `Chờ xếp khóa sau (${classGroup.courseName})`,
  });

  // Students currently active in this class
  const classStudents = allStudents.filter(
    (s) => s.classId === classGroup.id && s.status !== 'Đã nghỉ học'
  );

  // Overdue tuition count for this class (promise date exceeded by 1+ days)
  const overdueClassStudentsCount = classStudents.filter((st) => {
    if (!st.tuitionPromiseDate || st.tuitionStatus === 'Đã đóng đủ' || (st.tuitionPaidDate && st.tuitionPaidDate.length > 0)) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = st.tuitionPromiseDate.split('-');
    if (parts.length !== 3) return false;
    const promiseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    promiseDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  }).length;

  // Students waiting to join the next course / waiting list for this class/course
  const waitingForNextCourseStudents = allStudents.filter(
    (s) =>
      s.status === 'Chờ xếp lớp' ||
      s.waitingForClassId === classGroup.id ||
      (!s.classId && s.courseName === classGroup.courseName && s.status !== 'Đã nghỉ học')
  );

  const handleAddWaitingStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaitingForm.name.trim()) return;

    const cleanName = newWaitingForm.name.trim();
    const cleanEmail =
      newWaitingForm.email.trim() ||
      `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

    const newStudent: Student = {
      id: `std-w-${Date.now()}`,
      code: `IDV-DUBI${Math.floor(100 + Math.random() * 900)}`,
      name: cleanName,
      dob: newWaitingForm.dob,
      gender: newWaitingForm.gender,
      phone: newWaitingForm.phone.trim() || '0900000000',
      email: cleanEmail,
      parentName: newWaitingForm.parentName.trim() || `PH ${cleanName}`,
      parentPhone: newWaitingForm.parentPhone.trim() || newWaitingForm.phone.trim() || '0900000000',
      address: 'Hải Phòng',
      classId: 'waiting_list',
      className: `Chờ Khóa Sau (${classGroup.name})`,
      courseName: classGroup.courseName,
      status: 'Chờ xếp lớp',
      joinDate: new Date().toISOString().split('T')[0],
      tuitionStatus: 'Chưa đóng',
      balanceOwed: 0,
      waitingForClassId: classGroup.id,
      waitingNote: newWaitingForm.waitingNote,
    };

    onEnrollStudent('waiting_list', newStudent);
    setIsAddWaitingStudentModalOpen(false);
    setToastMessage(`Đã đăng ký thành công học sinh dự bị/chờ khóa sau: ${cleanName}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate course schedule, estimated end date, exam dates & session 29 TA reminder
  const classCourseSchedule = useMemo(() => {
    return calculateCourseSchedule(
      classGroup.startDate,
      classGroup.schedule,
      classGroup.totalSessions,
      classGroup.offDates || [],
      classGroup.courseLevel || classGroup.courseName
    );
  }, [
    classGroup.startDate,
    classGroup.schedule,
    classGroup.totalSessions,
    classGroup.offDates,
    classGroup.courseLevel,
    classGroup.courseName,
  ]);

  const [isTaReminderCopied, setIsTaReminderCopied] = useState(false);

  const handleCopyTaReminder = () => {
    const teacherDisplayName = teacherName || classGroup.teacherName || 'Giáo viên';
    const message = `Kính gửi Quản lý trung tâm IELTS DƯƠNG VŨ:\n${teacherDisplayName} xin thông báo lớp ${classGroup.name} (${classGroup.code}) hôm nay/sắp tới học Buổi 29.\nTheo quy định của trung tâm, nhờ Quản lý hỗ trợ sắp xếp Trợ giảng (TA) hỗ trợ lớp học và chuẩn bị cho đợt kiểm tra cuối khóa.\nTrân trọng cảm ơn!`;
    navigator.clipboard.writeText(message);
    setIsTaReminderCopied(true);
    setToastMessage('Đã sao chép tin nhắn nhắc Quản lý sắp xếp Trợ giảng (TA)!');
    setTimeout(() => {
      setToastMessage(null);
      setIsTaReminderCopied(false);
    }, 3500);
  };

  // Copy Full Roster Text for Excel / Sheets / Zalo
  const handleCopyFullRoster = () => {
    const header = `DANH SÁCH HỌC VIÊN LỚP: ${classGroup.name} (${classGroup.code})\nKhóa học: ${classGroup.courseName} | Sĩ số: ${classStudents.length} HV\n\nSTT\tHọ và tên\tNgày sinh\tGmail\tPhụ huynh\tTrạng thái\n`;
    const body = classStudents
      .map((st, idx) => {
        const email = st.email || `${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
        return `${idx + 1}\t${st.name}\t${formatDateVN(st.dob) || 'Chưa cập nhật'}\t${email}\t${st.parentName || 'Chưa cập nhật'}\t${st.status}`;
      })
      .join('\n');
    navigator.clipboard.writeText(header + body);
    setToastMessage('Đã sao chép bảng danh sách toàn bộ học viên lớp vào bộ nhớ tạm!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export Full Roster to CSV
  const handleExportCSV = () => {
    const headers = ['STT', 'Mã HV', 'Họ và tên', 'Ngày sinh (DOB)', 'Gmail', 'Phụ huynh', 'Trạng thái'];
    const rows = classStudents.map((st, idx) => {
      const email = st.email || `${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
      return [
        idx + 1,
        st.code,
        `"${st.name}"`,
        `"${formatDateVN(st.dob) || ''}"`,
        `"${email}"`,
        `"${st.parentName || ''}"`,
        `"${st.status}"`,
      ];
    });
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_hoc_vien_${classGroup.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage('Đã xuất file Excel / CSV danh sách học viên thành công!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Students who were in this class and have dropped/left
  const droppedStudents = allStudents.filter(
    (s) =>
      s.droppedClassId === classGroup.id ||
      (s.classId === classGroup.id && s.status === 'Đã nghỉ học')
  );

  // Filter active students by search in right panel
  const filteredStudents = classStudents.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.parentPhone && s.parentPhone.includes(q))
    );
  });

  // Filter dropped students by search
  const filteredDroppedStudents = droppedStudents.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.parentPhone && s.parentPhone.includes(q))
    );
  });

  // Candidate students not in this class
  const unassignedStudents = allStudents.filter((s) => {
    const notInThisClass = s.classId !== classGroup.id;
    const matchesSearch =
      existingSearch === '' ||
      s.name.toLowerCase().includes(existingSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(existingSearch.toLowerCase()) ||
      s.phone.includes(existingSearch);
    return notInThisClass && matchesSearch;
  });

  // State for Daily Lesson & Grading
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionNumber, setSessionNumber] = useState<number>(classGroup.completedSessions + 1 || 1);
  const [teacherName, setTeacherName] = useState<string>(classGroup.teacherName || '');
  
  // Flexible multiple skills in a single session e.g. ['Từ vựng', 'Nghe', 'Đọc']
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Từ vựng', 'Nghe', 'Đọc']);
  const [lessonTopic, setLessonTopic] = useState<string>('');
  const [enableOverallScore, setEnableOverallScore] = useState<boolean>(true);
  const [overallScoreType, setOverallScoreType] = useState<'average' | 'ielts_band'>('average');

  // Total questions per skill (e.g., Nghe: 40, Đọc: 40)
  const [skillTotalQuestions, setSkillTotalQuestions] = useState<Record<string, string>>({});
  const [totalPenaltyAmount, setTotalPenaltyAmount] = useState<string>('0 đ');
  const [penaltyBankAccount, setPenaltyBankAccount] = useState<string>(() => {
    return localStorage.getItem('idv_penalty_bank_account') || '0798934698 - MB Bank (IELTS DƯƠNG VŨ)';
  });

  const handlePenaltyBankChange = (newVal: string) => {
    setPenaltyBankAccount(newVal);
    localStorage.setItem('idv_penalty_bank_account', newVal);
  };

  const handleSkillTotalQuestionsChange = (skill: string, total: string) => {
    setSkillTotalQuestions((prev) => ({
      ...prev,
      [skill]: total,
    }));
  };

  const handleSetAllPenaltyFees = (amount: string) => {
    setTotalPenaltyAmount(amount);
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], penaltyFee: amount };
        }
      });
      return next;
    });
  };

  const handleSetAllPreviousDebts = (debt: string) => {
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], previousDebt: debt };
        }
      });
      return next;
    });
    setToastMessage(`Đã gán nợ buổi trước ${debt} cho cả lớp!`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSetAllPenaltyStks = (stk: string) => {
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], penaltyBankAccount: stk };
        }
      });
      return next;
    });
    setToastMessage('Đã đồng bộ STK nộp phạt cho cả lớp!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const hasWritingSkill = selectedSkills.includes('Viết') || selectedSkills.includes('Viết Task 1') || selectedSkills.includes('Viết Task 2');

  const [studentRows, setStudentRows] = useState<Record<string, StudentRowState>>({});

  // Homework item tracking (e.g. Nghe, Nói, Đọc, Viết, Chép phạt, Chữa bài)
  const [homeworkItems, setHomeworkItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('idv_homework_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return ['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài'];
  });
  const [isHwConfigModalOpen, setIsHwConfigModalOpen] = useState(false);
  const [isFullScheduleModalOpen, setIsFullScheduleModalOpen] = useState(false);

  // Parse penalty amount helper
  const parsePenaltyAmount = (val?: string | number): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().trim().toLowerCase();
    if (str === '0' || str === '0 đ' || str === '0đ' || str === '0k' || str === '' || str === '-') return 0;
    if (str.endsWith('k') || str.includes('k')) {
      const n = parseFloat(str.replace('k', '').replace(/\./g, '').replace(/,/g, ''));
      return isNaN(n) ? 0 : n * 1000;
    }
    const digits = str.replace(/[^\d]/g, '');
    const n = parseInt(digits, 10);
    return isNaN(n) ? 0 : (n < 1000 ? n * 1000 : n);
  };

  // Auto-calculated total penalty amount based on assistant's inputs for students
  const totalCalculatedPenaltyFee = useMemo(() => {
    return classStudents.reduce((sum, st) => {
      const row = studentRows[st.id];
      return sum + parsePenaltyAmount(row?.penaltyFee);
    }, 0);
  }, [classStudents, studentRows]);

  const formattedTotalPenaltyFee = useMemo(() => {
    return totalCalculatedPenaltyFee > 0 ? `${totalCalculatedPenaltyFee / 1000}k` : '0k';
  }, [totalCalculatedPenaltyFee]);

  const countStudentsWithPenalty = useMemo(() => {
    return classStudents.filter((st) => parsePenaltyAmount(studentRows[st.id]?.penaltyFee) > 0).length;
  }, [classStudents, studentRows]);

  // Auto-calculated total previous debt of the students in the class
  const totalCalculatedPreviousDebt = useMemo(() => {
    return classStudents.reduce((sum, st) => {
      const row = studentRows[st.id];
      return sum + parsePenaltyAmount(row?.previousDebt);
    }, 0);
  }, [classStudents, studentRows]);

  const formattedTotalPreviousDebt = useMemo(() => {
    return totalCalculatedPreviousDebt > 0 ? `${totalCalculatedPreviousDebt / 1000}k` : '0k';
  }, [totalCalculatedPreviousDebt]);

  const countStudentsWithPreviousDebt = useMemo(() => {
    return classStudents.filter((st) => parsePenaltyAmount(studentRows[st.id]?.previousDebt) > 0).length;
  }, [classStudents, studentRows]);

  const grandTotalReceivable = totalCalculatedPenaltyFee + totalCalculatedPreviousDebt;
  const formattedGrandTotalReceivable = grandTotalReceivable > 0 ? `${grandTotalReceivable / 1000}k` : '0k';

  // Sync session rows when date, class or skills change
  useEffect(() => {
    const initial: Record<string, StudentRowState> = {};
    classStudents.forEach((st) => {
      const existing = attendanceRecords.find(
        (r) => r.classId === classGroup.id && r.studentId === st.id && r.date === currentDate
      );
      if (existing) {
        if (existing.teacherName) setTeacherName(existing.teacherName);
        if (existing.skillsTaught && existing.skillsTaught.length > 0) {
          setSelectedSkills(existing.skillsTaught);
        } else if (existing.skillTaught) {
          setSelectedSkills([existing.skillTaught]);
        }
      }

      // Initial skill scores map
      const initialSkillScores: Record<string, string> = {};
      selectedSkills.forEach((sk) => {
        if (existing?.skillScores && existing.skillScores[sk] !== undefined) {
          initialSkillScores[sk] = String(existing.skillScores[sk]);
        } else if (existing?.skillTaught === sk && existing?.score !== undefined) {
          initialSkillScores[sk] = String(existing.score);
        } else {
          initialSkillScores[sk] = '';
        }
      });

      const initialPenalty = existing?.penaltyCopies !== undefined ? String(existing.penaltyCopies) : '0';
      let initialPenaltyFee = '';
      if (existing?.penaltyFee !== undefined) {
        const pFeeStr = String(existing.penaltyFee);
        if (pFeeStr !== '0 đ' && pFeeStr !== '0' && pFeeStr !== '0k' && pFeeStr !== '') {
          initialPenaltyFee = pFeeStr;
        }
      }

      // Auto-detect previous debt: Check existing record, or prior attendance sessions, or student.balanceOwed
      let initialPreviousDebt = '';
      if (existing?.previousDebt !== undefined) {
        const pDebtStr = String(existing.previousDebt);
        if (pDebtStr !== '0 đ' && pDebtStr !== '0' && pDebtStr !== '0k' && pDebtStr !== '') {
          initialPreviousDebt = pDebtStr;
        }
      } else {
        const priorRecords = attendanceRecords
          .filter(
            (r) =>
              r.classId === classGroup.id &&
              r.studentId === st.id &&
              (r.date < currentDate || (r.sessionNumber && r.sessionNumber < sessionNumber))
          )
          .sort((a, b) => (b.sessionNumber || 0) - (a.sessionNumber || 0) || b.date.localeCompare(a.date));

        if (priorRecords.length > 0) {
          const lastRec = priorRecords[0];
          const priorPenalty = parsePenaltyAmount(lastRec.penaltyFee);
          const priorDebt = parsePenaltyAmount(lastRec.previousDebt);
          const sumDebt = priorPenalty + priorDebt;
          if (sumDebt > 0) {
            initialPreviousDebt = `${sumDebt / 1000}k`;
          }
        } else if (st.balanceOwed && st.balanceOwed > 0) {
          initialPreviousDebt = `${st.balanceOwed / 1000}k`;
        }
      }

      const initialHw = (existing?.homeworkStatus as 'Đã làm' | 'Thiếu' | 'Chưa làm') || 'Đã làm';
      const initialMissingHw = (existing?.missingHomeworkItems as string[]) || [];
      const initialQuizlet = (existing?.quizletStatus as 'Đã học' | 'Chưa học') || 'Đã học';

      initial[st.id] = {
        status: existing?.status || 'Có mặt',
        skillScores: initialSkillScores,
        penaltyCopies: initialPenalty,
        penaltyFee: initialPenaltyFee,
        previousDebt: initialPreviousDebt,
        penaltyBankAccount: existing?.penaltyBankAccount || '',
        feedback: existing?.teacherNote || '',
        homeworkStatus: initialHw,
        missingHomeworkItems: initialMissingHw,
        quizletStatus: initialQuizlet,
        note: existing?.note || '',
      };
    });
    setStudentRows(initial);
  }, [classGroup.id, currentDate, classStudents.length]);

  // When selectedSkills list changes, ensure every studentRow has keys for all skills
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      let nextSkills: string[];
      if (prev.includes(skill)) {
        if (prev.length === 1) {
          return prev; // keep at least one skill
        }
        nextSkills = prev.filter((s) => s !== skill);
      } else {
        nextSkills = [...prev, skill];
      }

      // Update studentRows keys
      setStudentRows((prevRows) => {
        const updated = { ...prevRows };
        Object.keys(updated).forEach((stId) => {
          const row = updated[stId];
          const newScores = { ...row.skillScores };
          nextSkills.forEach((sk) => {
            if (newScores[sk] === undefined) newScores[sk] = '';
          });
          updated[stId] = { ...row, skillScores: newScores };
        });
        return updated;
      });

      return nextSkills;
    });
  };

  const setPresetSkills = (skills: string[]) => {
    setSelectedSkills(skills);
    setStudentRows((prevRows) => {
      const updated = { ...prevRows };
      Object.keys(updated).forEach((stId) => {
        const row = updated[stId];
        const newScores = { ...row.skillScores };
        skills.forEach((sk) => {
          if (newScores[sk] === undefined) newScores[sk] = '';
        });
        updated[stId] = { ...row, skillScores: newScores };
      });
      return updated;
    });
  };

  const handleScoreChange = (studentId: string, skill: string, value: string) => {
    setStudentRows((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        skillScores: {
          ...(prev[studentId]?.skillScores || {}),
          [skill]: value,
        },
      },
    }));
  };

  const handleSetAllPenalties = (count: number) => {
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], penaltyCopies: String(count) };
        }
      });
      return next;
    });
  };

  const handleToggleMissingHwItem = (studentId: string, item: string) => {
    setStudentRows((prev) => {
      const currentRow = prev[studentId];
      if (!currentRow) return prev;
      let currentMissing = currentRow.missingHomeworkItems || [];
      if (currentRow.homeworkStatus === 'Chưa làm' && currentMissing.length === 0) {
        currentMissing = [...homeworkItems];
      }
      let updatedMissing: string[];
      if (currentMissing.includes(item)) {
        updatedMissing = currentMissing.filter((i) => i !== item);
      } else {
        updatedMissing = [...currentMissing, item];
      }

      let updatedStatus: 'Đã làm' | 'Thiếu' | 'Chưa làm' = 'Đã làm';
      if (updatedMissing.length === 0) {
        updatedStatus = 'Đã làm';
      } else if (updatedMissing.length >= homeworkItems.length && homeworkItems.length > 0) {
        updatedStatus = 'Chưa làm';
      } else {
        updatedStatus = 'Thiếu';
      }

      return {
        ...prev,
        [studentId]: {
          ...currentRow,
          missingHomeworkItems: updatedMissing,
          homeworkStatus: updatedStatus,
        },
      };
    });
  };

  const handleSetStudentHwStatus = (studentId: string, status: 'Đã làm' | 'Thiếu' | 'Chưa làm') => {
    setStudentRows((prev) => {
      const currentRow = prev[studentId];
      if (!currentRow) return prev;
      let missing: string[] = [];
      if (status === 'Đã làm') {
        missing = [];
      } else if (status === 'Chưa làm') {
        missing = [...homeworkItems];
      } else if (status === 'Thiếu') {
        missing =
          currentRow.missingHomeworkItems && currentRow.missingHomeworkItems.length > 0
            ? currentRow.missingHomeworkItems
            : [homeworkItems[0] || 'Chữa bài'];
      }
      return {
        ...prev,
        [studentId]: {
          ...currentRow,
          homeworkStatus: status,
          missingHomeworkItems: missing,
        },
      };
    });
  };

  const handleSetAllHomework = (status: 'Đã làm' | 'Thiếu' | 'Chưa làm') => {
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          let missing: string[] = [];
          if (status === 'Đã làm') {
            missing = [];
          } else if (status === 'Chưa làm') {
            missing = [...homeworkItems];
          } else if (status === 'Thiếu') {
            missing = [homeworkItems[0] || 'Chữa bài'];
          }
          next[st.id] = {
            ...next[st.id],
            homeworkStatus: status,
            missingHomeworkItems: missing,
          };
        }
      });
      return next;
    });
    setToastMessage(
      status === 'Đã làm'
        ? '✓ Đã đặt 100% học viên làm ĐỦ bài tập!'
        : `Đã đánh dấu BTVN "${status}" cho cả lớp!`
    );
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveHomeworkItems = (newItems: string[]) => {
    setHomeworkItems(newItems);
    localStorage.setItem('idv_homework_items', JSON.stringify(newItems));
    setToastMessage(`Đã cập nhật ${newItems.length} đề mục BTVN!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSetAllQuizlet = (status: 'Đã học' | 'Chưa học') => {
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], quizletStatus: status };
        }
      });
      return next;
    });
  };

  // Helper to calculate average score of a student
  const calculateStudentAverage = (row: StudentRowState | undefined): string => {
    if (!enableOverallScore) return '-';
    if (!row || !row.skillScores) return '-';
    
    if (overallScoreType === 'ielts_band') {
      // IELTS 4 core skills: Listening (Nghe), Reading (Đọc), Speaking (Nói), Writing (Viết/Task 1/Task 2)
      const listeningVal = row.skillScores['Nghe'];
      const readingVal = row.skillScores['Đọc'];
      const speakingVal = row.skillScores['Nói'];
      
      // Writing can be 'Viết' or average of 'Viết Task 1' and 'Viết Task 2'
      let writingVal = row.skillScores['Viết'];
      if (writingVal === undefined || writingVal === '') {
        const t1 = row.skillScores['Viết Task 1'];
        const t2 = row.skillScores['Viết Task 2'];
        if (t1 !== undefined && t1 !== '' && t2 !== undefined && t2 !== '') {
          writingVal = String((Number(t1) + Number(t2)) / 2);
        } else if (t1 !== undefined && t1 !== '') {
          writingVal = t1;
        } else if (t2 !== undefined && t2 !== '') {
          writingVal = t2;
        }
      }

      const skills = [listeningVal, readingVal, speakingVal, writingVal];
      const validScores: number[] = [];
      skills.forEach((val) => {
        if (val !== undefined && val !== '' && !isNaN(Number(val))) {
          validScores.push(Number(val));
        }
      });

      if (validScores.length === 0) return '-';
      const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
      // IELTS Band rounding: round to nearest 0.5 (e.g. 6.25 -> 6.5, 6.125 -> 6.0)
      const rounded = Math.round(avg * 2) / 2;
      return rounded.toFixed(1);
    } else {
      // Standard average of all selected skills
      const validScores: number[] = [];
      selectedSkills.forEach((sk) => {
        const val = row.skillScores[sk];
        if (val !== undefined && val !== '' && !isNaN(Number(val))) {
          validScores.push(Number(val));
        }
      });
      if (validScores.length === 0) return '-';
      const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
      return avg.toFixed(1);
    }
  };

  const handleEnrollExisting = (studentId: string) => {
    const studentObj = unassignedStudents.find((s) => s.id === studentId);
    if (studentObj) {
      setSelectedStudentForEnroll(studentObj);
      setEnrollCustomTuition(classGroup.tuitionFee || 14500000);
      setEnrollPaidAmount(0);
    }
  };

  const handleEnrollExistingWithCustomTuition = () => {
    if (!selectedStudentForEnroll) return;
    const owed = Math.max(0, enrollCustomTuition - enrollPaidAmount);
    const status = owed === 0 ? 'Đã đóng đủ' : enrollPaidAmount > 0 ? 'Còn nợ' : 'Chưa đóng';

    const updatedStudent: Student = {
      ...selectedStudentForEnroll,
      classId: classGroup.id,
      className: classGroup.name,
      courseName: classGroup.courseName,
      balanceOwed: owed,
      tuitionStatus: status,
    };

    onEnrollStudent(classGroup.id, updatedStudent);
    setIsAddModalOpen(false);
    setSelectedStudentForEnroll(null);
    setToastMessage(`Đã thêm học viên "${selectedStudentForEnroll.name}" với học phí phải đóng ${enrollCustomTuition.toLocaleString('vi-VN')} đ!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateAndEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) {
      alert('Vui lòng nhập họ và tên học viên!');
      return;
    }

    const owed = Math.max(0, newStudentForm.customTuitionFee - newStudentForm.paidAmount);
    const status = owed === 0 ? 'Đã đóng đủ' : newStudentForm.paidAmount > 0 ? 'Còn nợ' : 'Chưa đóng';

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      code: `IDV-HV${Math.floor(100 + Math.random() * 900)}`,
      name: newStudentForm.name.trim(),
      dob: newStudentForm.dob,
      gender: newStudentForm.gender,
      phone: newStudentForm.phone.trim() || `09${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `${newStudentForm.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      parentName: newStudentForm.parentName.trim() || `Phụ huynh ${newStudentForm.name}`,
      parentPhone: newStudentForm.parentPhone.trim() || newStudentForm.phone || `09${Math.floor(10000000 + Math.random() * 89999999)}`,
      address: 'Hải Phòng',
      classId: classGroup.id,
      className: classGroup.name,
      courseName: classGroup.courseName,
      status: 'Đang học',
      joinDate: new Date().toISOString().split('T')[0],
      tuitionStatus: status,
      balanceOwed: owed,
    };

    onEnrollStudent(classGroup.id, newStudent);
    setIsAddModalOpen(false);
    setNewStudentForm({
      name: '',
      phone: '',
      dob: '2008-01-15',
      gender: 'Nữ',
      parentName: '',
      parentPhone: '',
      tuitionStatus: 'Đã đóng đủ',
      balanceOwed: 0,
      customTuitionFee: classGroup.tuitionFee || 14500000,
      paidAmount: 0,
    });
    setToastMessage(`Đã tạo mới và thêm học viên "${newStudent.name}" với học phí phải đóng ${newStudentForm.customTuitionFee.toLocaleString('vi-VN')} đ!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmRemove = () => {
    if (studentToRemove) {
      onRemoveStudent(classGroup.id, studentToRemove.id);
      setToastMessage(`Đã bỏ học viên "${studentToRemove.name}" khỏi lớp thành công!`);
      setTimeout(() => setToastMessage(null), 3000);
      setStudentToRemove(null);
    }
  };

  const handleSaveDailySession = () => {
    if (classStudents.length === 0) {
      alert('Lớp học chưa có học viên.');
      return;
    }

    const newRecords: AttendanceRecord[] = classStudents.map((st) => {
      const row = studentRows[st.id];
      const parsedScores: Record<string, number | string> = {};
      let total = 0;
      let count = 0;

      selectedSkills.forEach((sk) => {
        const val = row?.skillScores?.[sk];
        if (val !== undefined && val !== '' && !isNaN(Number(val))) {
          parsedScores[sk] = Number(val);
          total += Number(val);
          count++;
        }
      });

      const avgScore = count > 0 ? Number((total / count).toFixed(1)) : undefined;
      const parsedPenalty = row?.penaltyCopies !== '' && !isNaN(Number(row?.penaltyCopies)) ? Number(row.penaltyCopies) : undefined;

      return {
        id: `att-${Date.now()}-${st.id}`,
        classId: classGroup.id,
        date: currentDate,
        sessionNumber: sessionNumber,
        studentId: st.id,
        studentName: st.name,
        status: row?.status || 'Có mặt',
        note: lessonTopic,
        teacherNote: row?.feedback || '',
        teacherName: teacherName || classGroup.teacherName || 'Giáo viên IDV',
        skillTaught: selectedSkills.join(', '),
        skillsTaught: selectedSkills,
        skillScores: parsedScores,
        score: avgScore,
        penaltyCopies: hasWritingSkill ? parsedPenalty : undefined,
        penaltyFee: row?.penaltyFee || '0 đ',
        previousDebt: row?.previousDebt || '0 đ',
        penaltyBankAccount: row?.penaltyBankAccount || '',
        homeworkItems: homeworkItems,
        missingHomeworkItems: row?.missingHomeworkItems || [],
        homeworkStatus: row?.homeworkStatus || 'Đã làm',
        quizletStatus: row?.quizletStatus || 'Đã học',
      };
    });

    if (onSaveAttendance) {
      onSaveAttendance(newRecords);
    }

    // Exam score record syncing
    if (onAddExamScore) {
      classStudents.forEach((st) => {
        const row = studentRows[st.id];
        const avg = calculateStudentAverage(row);
        if (avg !== '-') {
          const parsed = Number(avg);
          const rank = parsed >= 8.0 ? 'Xuất sắc' : parsed >= 7.0 ? 'Giỏi' : parsed >= 6.0 ? 'Khá' : 'Trung bình';

          // Resolve Writing score dynamically from 'Viết', 'Viết Task 1', or 'Viết Task 2'
          let writingScore = 6.5;
          if (row?.skillScores?.['Viết']) {
            writingScore = Number(row.skillScores['Viết']);
          } else {
            const t1 = row?.skillScores?.['Viết Task 1'];
            const t2 = row?.skillScores?.['Viết Task 2'];
            if (t1 && t2) {
              writingScore = (Number(t1) + Number(t2)) / 2;
            } else if (t1) {
              writingScore = Number(t1);
            } else if (t2) {
              writingScore = Number(t2);
            }
          }

          const newExam: ExamScore = {
            id: `ex-${Date.now()}-${st.id}`,
            studentId: st.id,
            studentName: st.name,
            studentCode: st.code,
            classId: classGroup.id,
            className: classGroup.name,
            examName: `Điểm buổi ${sessionNumber} (${selectedSkills.join(', ')})`,
            examDate: currentDate,
            listening: row?.skillScores?.['Nghe'] ? Number(row.skillScores['Nghe']) : 6.5,
            reading: row?.skillScores?.['Đọc'] ? Number(row.skillScores['Đọc']) : 6.5,
            writing: writingScore,
            speaking: row?.skillScores?.['Nói'] ? Number(row.skillScores['Nói']) : 6.5,
            totalScore: parsed,
            rank,
            certificateGranted: parsed >= 6.5,
          };
          onAddExamScore(newExam);
        }
      });
    }

    setToastMessage(`Đã lưu bảng điểm đa kỹ năng (${selectedSkills.join(', ')}) cho lớp "${classGroup.name}" ngày ${currentDate}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Generate formatted Zalo report for a single student
  const generateZaloMessageForStudent = (student: Student): string => {
    const row = studentRows[student.id];
    const avg = calculateStudentAverage(row);
    
    let skillsReport = '';
    selectedSkills.forEach((sk) => {
      const totalQ = skillTotalQuestions[sk];
      const score = row?.skillScores?.[sk] 
        ? totalQ ? `${row.skillScores[sk]}/${totalQ} câu` : `${row.skillScores[sk]}/10` 
        : 'Chưa nhập điểm';
      skillsReport += `   • ${sk}: ${score}\n`;
    });

    let writingPenaltyNote = '';
    if (hasWritingSkill && row?.penaltyCopies && Number(row.penaltyCopies) > 0) {
      writingPenaltyNote = `✍️ Số lần chép phạt (Kỹ năng Viết): ${row.penaltyCopies} lần\n`;
    }

    const quizletText = row?.quizletStatus === 'Đã học' ? '✓ Đã học đầy đủ' : '✗ Chưa học';
    let homeworkText = '';
    if (row?.homeworkStatus === 'Chưa làm') {
      homeworkText = '✗ Chưa làm bài tập';
    } else if (row?.missingHomeworkItems && row.missingHomeworkItems.length > 0) {
      homeworkText = `⚠️ Làm thiếu: ${row.missingHomeworkItems.join(', ')}`;
    } else {
      homeworkText = `✓ Đã làm đủ (${homeworkItems.join(', ')})`;
    }
    const feedbackText = row?.feedback && row.feedback.trim() !== '' ? `💬 Nhận xét của giáo viên: ${row.feedback.trim()}\n` : '';

    const penaltyFeeVal = row?.penaltyFee && row.penaltyFee !== '0 đ' && row.penaltyFee !== '0' && row.penaltyFee !== '0k' && row.penaltyFee !== '' ? row.penaltyFee : null;
    const previousDebtVal = row?.previousDebt && row.previousDebt !== '0 đ' && row.previousDebt !== '0' && row.previousDebt !== '0k' && row.previousDebt !== '' ? row.previousDebt : null;

    let penaltyInfo = '';
    const studentPenaltyAmt = parsePenaltyAmount(penaltyFeeVal);
    const studentDebtAmt = parsePenaltyAmount(previousDebtVal);
    const studentTotalReceivable = studentPenaltyAmt + studentDebtAmt;

    if (studentTotalReceivable > 0) {
      penaltyInfo += `💰 THÔNG BÁO THU TIỀN:\n`;
      if (studentPenaltyAmt > 0) {
        penaltyInfo += `   • Tiền phạt buổi này: ${penaltyFeeVal}\n`;
      }
      if (studentDebtAmt > 0) {
        penaltyInfo += `   • Nợ chưa nộp các buổi trước: ${previousDebtVal}\n`;
      }
      if (studentPenaltyAmt > 0 && studentDebtAmt > 0) {
        penaltyInfo += `   ➔ TỔNG CỘNG PHẢI NỘP: ${studentTotalReceivable / 1000}k\n`;
      }
      penaltyInfo += `⚠️ LƯU Ý QUAN TRỌNG: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.\n`;
    }

    return `🌟 IELTS DƯƠNG VŨ - BẢNG ĐIỂM BUỔI HỌC SỐ ${sessionNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 Lớp: ${classGroup.name}
📅 Ngày học: ${currentDate}

👤 Học viên: ${student.name} (Mã: ${student.code})
✅ Tình trạng điểm danh: ${row?.status || 'Có mặt'}

🎯 BẢNG ĐIỂM KIỂM TRA TRONG BUỔI:
${skillsReport}${enableOverallScore ? `   ➔ ${overallScoreType === 'ielts_band' ? 'Overall Band IELTS' : 'Điểm trung bình buổi'}: ${avg !== '-' ? `${avg}/10` : 'Đang cập nhật'}\n` : ''}
📖 Học từ vựng Quizlet: ${quizletText}
✍️ Bài tập về nhà (BTVN): ${homeworkText}
${writingPenaltyNote}${penaltyInfo}${feedbackText}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Hotline trung tâm: 0798934698
❤️ Cảm ơn Quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`;
  };

  // Generate formatted Class Summary for Zalo Group
  const generateClassZaloSummary = (): string => {
    let summary = `📢 IELTS DƯƠNG VŨ
🏆 BẢNG ĐIỂM BUỔI HỌC SỐ ${sessionNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 Lớp: ${classGroup.name} | Ngày: ${currentDate}
📚 Kỹ năng kiểm tra: ${selectedSkills.join(', ')}
📝 Đề mục BTVN: ${homeworkItems.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    classStudents.forEach((st, idx) => {
      const row = studentRows[st.id];
      const scoresArr: string[] = [];
      selectedSkills.forEach((sk) => {
        if (row?.skillScores?.[sk]) {
          const totalQ = skillTotalQuestions[sk];
          scoresArr.push(`${sk}: ${row.skillScores[sk]}${totalQ ? `/${totalQ}c` : ''}`);
        }
      });
      const scoresStr = scoresArr.length > 0 ? scoresArr.join(' | ') : 'Chưa nhập điểm';
      const avg = calculateStudentAverage(row);
      const avgStr = avg !== '-' ? ` | ${overallScoreType === 'ielts_band' ? 'Band' : 'TB'}: ${avg}` : '';
      const penaltyStr = (hasWritingSkill && row?.penaltyCopies && Number(row.penaltyCopies) > 0) ? ` | Chép phạt: ${row.penaltyCopies} lần` : '';
      const penaltyFeeStr = (row?.penaltyFee && row.penaltyFee !== '0 đ' && row.penaltyFee !== '0' && row.penaltyFee !== '0k' && row.penaltyFee !== '') ? ` | Phạt buổi này: ${row.penaltyFee}` : '';
      const debtStr = (row?.previousDebt && row.previousDebt !== '0 đ' && row.previousDebt !== '0' && row.previousDebt !== '0k' && row.previousDebt !== '') ? ` | Nợ cũ: ${row.previousDebt}` : '';
      let hwStr = 'Đủ';
      if (row?.homeworkStatus === 'Chưa làm') {
        hwStr = 'Chưa làm';
      } else if (row?.missingHomeworkItems && row.missingHomeworkItems.length > 0) {
        hwStr = `Thiếu (${row.missingHomeworkItems.join(', ')})`;
      }
      const qzStr = row?.quizletStatus || 'Đã học';
      const fbStr = (row?.feedback && row.feedback.trim() !== '') ? ` | Nhận xét: ${row.feedback.trim()}` : '';

      summary += `${idx + 1}. ${st.name} (${row?.status || 'Có mặt'}): ${scoresStr}${avgStr}${penaltyStr}${penaltyFeeStr}${debtStr} | BTVN: ${hwStr} | Quizlet: ${qzStr}${fbStr}\n`;
    });

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (grandTotalReceivable > 0) {
      summary += `💰 TỔNG TIỀN PHẢI THU CỦA LỚP: ${formattedGrandTotalReceivable}\n`;
      if (totalCalculatedPenaltyFee > 0) {
        summary += `   • Phạt buổi này: ${formattedTotalPenaltyFee}\n`;
      }
      if (totalCalculatedPreviousDebt > 0) {
        summary += `   • Nợ các buổi trước: ${formattedTotalPreviousDebt}\n`;
      }
      summary += `⚠️ LƯU Ý QUAN TRỌNG: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.\n`;
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }
    summary += `📞 Hotline trung tâm: 0798934698\n`;
    summary += `❤️ Cảm ơn Quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`;
    return summary;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedZaloId(id);
    setToastMessage('Đã sao chép nội dung bảng điểm gửi Zalo thành công!');
    setTimeout(() => {
      setCopiedZaloId(null);
      setToastMessage(null);
    }, 3000);
  };

  // Past sessions of this class
  const classHistoryMap = new Map<string, { date: string; sessionNumber: number; teacherName: string; skillsTaught: string[]; records: AttendanceRecord[] }>();
  attendanceRecords.filter((r) => r.classId === classGroup.id).forEach((r) => {
    const key = `${r.date}-${r.sessionNumber}`;
    if (!classHistoryMap.has(key)) {
      classHistoryMap.set(key, {
        date: r.date,
        sessionNumber: r.sessionNumber,
        teacherName: r.teacherName || classGroup.teacherName || 'Giáo viên IDV',
        skillsTaught: r.skillsTaught && r.skillsTaught.length > 0 ? r.skillsTaught : [r.skillTaught || 'IELTS'],
        records: [],
      });
    }
    classHistoryMap.get(key)!.records.push(r);
  });
  const pastSessions = Array.from(classHistoryMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3.5 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh sách lớp học</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{classGroup.branch}</span>
          <span>/</span>
          <span className="font-bold text-purple-700">{classGroup.name}</span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Class Overview Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {classGroup.name}
              </h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold rounded-full text-xs">
                {classGroup.courseName}
              </span>
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-full text-xs flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{classGroup.currentTermName || `Khóa ${classGroup.currentTerm || 1}`}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-md text-[11px]">
                {classGroup.code}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-md text-[11px]">
                {classGroup.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Cơ sở: <strong className="text-slate-900">{classGroup.branch}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Giáo viên:</span>
                <div className="inline-flex flex-wrap items-center gap-1">
                  {(classGroup.teacherNames && classGroup.teacherNames.length > 0
                    ? classGroup.teacherNames
                    : classGroup.teacherName.split(/[,;&+]/).map((t) => t.trim()).filter((t) => t.length > 0)
                  ).map((tName, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200/80 rounded-md font-bold text-[11px]"
                    >
                      {tName}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Lịch học: <strong className="text-slate-900">{classGroup.schedule}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Tiến độ: <strong className="text-purple-700">{classGroup.completedSessions}/{classGroup.totalSessions || 48} buổi</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Học phí: <strong className="text-emerald-700">{(classGroup.tuitionFee || 14500000).toLocaleString('vi-VN')} đ</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {onUpdateClass && canAccessCourseTuition && (
              <button
                type="button"
                onClick={() => {
                  setActiveTermModalTab('tuition_students');
                  setIsTermHistoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Quản lý Khóa học & Học phí học sinh (Chỉ Quản lý trung tâm & Trợ lý)"
              >
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Quản lý Khóa & Học phí</span>
                {overdueClassStudentsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    ⚠️ {overdueClassStudentsCount} quá hẹn
                  </span>
                )}
              </button>
            )}
            {onUpdateClass && !canAccessCourseTuition && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-100/80 border border-slate-200/80 rounded-xl cursor-not-allowed select-none"
                title="Quản lý Khóa học & Học phí chỉ dành riêng cho Quản lý trung tâm và Trợ lý"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Khóa & Học phí (Quản lý & Trợ lý)</span>
              </div>
            )}
            {onUpdateClass && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shadow-xs"
              >
                <Edit3 className="w-4 h-4 text-purple-700" />
                <span>Sửa lớp</span>
              </button>
            )}
            {isManager && onDeleteClass && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Xóa lớp học này khỏi hệ thống (Quyền Quản lý)"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa lớp</span>
              </button>
            )}
            <button
              onClick={() => setIsClassZaloModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs"
              title="Xuất bảng điểm, sắp xếp thứ tự điểm cao xuống thấp và lưu ảnh gửi Phụ huynh"
            >
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>Xuất điểm gửi Phụ huynh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Thêm học sinh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Course Schedule & Projected End Date strip */}
      <div className="bg-white rounded-3xl border border-purple-100/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Lộ Trình Khóa Học & Ngày Dự Kiến Kết Thúc
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-700 text-white">
                  {classCourseSchedule.levelKey} ({classCourseSchedule.totalSessions} buổi)
                </span>
                {classGroup.offDates && classGroup.offDates.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Đã dời {classGroup.offDates.length} buổi nghỉ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Lịch: <strong>{classGroup.schedule}</strong> • Khai giảng: <strong>{formatDateVN(classGroup.startDate)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-semibold block">
                Kết thúc khóa (Lịch tuần 2 buổi):
              </span>
              <span className="text-sm sm:text-base font-black text-purple-800">
                {classCourseSchedule.formattedEstimatedEndDate}
              </span>
              <div className="text-[10px] text-slate-500 font-medium">
                Tổng <strong className="text-purple-900 font-bold">{classCourseSchedule.totalDays} ngày</strong> (~{classCourseSchedule.totalWeeks} tuần)
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                {classCourseSchedule.remainingDaysText}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullScheduleModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                title="Xem chi tiết toàn bộ 32-33 buổi học, mốc kiểm tra & tin nhắn Zalo"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Xem Toàn Bộ Lịch Trình</span>
              </button>
              {onUpdateClass && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 rounded-xl border border-purple-200 transition-colors"
                  title="Cập nhật buổi nghỉ hoặc thay đổi lịch học"
                >
                  + Cập nhật ngày nghỉ
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>Buổi 29: Nhắc xếp Trợ giảng (TA)</span>
              </span>
              <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                {classCourseSchedule.formattedSession29Date ? `Dự kiến: ${classCourseSchedule.formattedSession29Date}` : 'Buổi thứ 29 của khóa'}
              </p>
              <span className="text-[10px] text-amber-700 block mt-0.5">
                Giáo viên nhắn Quản lý sắp xếp TA hỗ trợ
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyTaReminder}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] shrink-0 shadow-2xs transition-colors"
            >
              {isTaReminderCopied ? 'Đã chép!' : 'Chép tin nhắn'}
            </button>
          </div>

          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3">
            <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kiểm tra cuối khóa: Buổi {classCourseSchedule.examSessions.join(' & ')}</span>
            </span>
            <p className="text-[11px] text-indigo-800 font-semibold mt-0.5">
              {classCourseSchedule.config.examRule}
            </p>
            <span className="text-[10px] text-indigo-600 block mt-0.5">
              Đánh giá chuẩn đầu ra trước khi lên khóa
            </span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3">
            <span className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kế hoạch lên khóa tiếp theo</span>
            </span>
            <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
              {classCourseSchedule.config.breakRule}
            </p>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              Dự kiến lên {classCourseSchedule.config.nextCourseName}: <strong>{classCourseSchedule.formattedNextCourseStartDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Active TA Reminder Banner for Session 29 */}
      {(sessionNumber === 29 || classGroup.completedSessions === 28 || classGroup.completedSessions === 29) && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white text-amber-950 font-black text-[11px] uppercase tracking-wide">
                  Nhắc Nhở Giáo Viên • Buổi 29
                </span>
                <span className="text-xs font-semibold text-amber-100">
                  {classCourseSchedule.formattedSession29Date ? `Dự kiến: ${classCourseSchedule.formattedSession29Date}` : ''}
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white mt-1">
                Giáo viên vui lòng nhắn tin cho Quản lý trung tâm để sắp xếp Trợ giảng (TA)!
              </h3>
              <p className="text-xs text-amber-100 mt-0.5 max-w-2xl leading-relaxed">
                Theo quy định trung tâm IELTS DƯƠNG VŨ, lớp học ở <strong>Buổi 29</strong> cần có Trợ giảng (TA) hỗ trợ để đồng hành cùng học viên và chuẩn bị cho đợt kiểm tra cuối khóa (Buổi {classCourseSchedule.examSessions.join(' & ')}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopyTaReminder}
              className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {isTaReminderCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đã chép tin nhắn!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>Sao chép tin nhắn gửi Quản lý</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Primary Tab Navigation Bar & Quick Student Action (Only Managers & Assistants) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('daily_log')}
            className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'daily_log'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📝 Nhật Ký & Chấm Điểm Buổi Học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'students'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>📋 Xem Tổng Danh Sách Lớp ({classStudents.length} HV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet_view')}
            className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sheet_view'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📊 Sổ Bảng Điểm & Học Phí</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocab_tests')}
            className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'vocab_tests'
                ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>📚 Test Từ Vựng Khóa 1, 2, 3, 4</span>
          </button>
        </div>

        {/* MỤC HỌC VIÊN TRONG LỚP (Chỉ Quản lý và Trợ lý được phân quyền thấy) */}
        {canAccessCourseTuition && (
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 p-1.5 bg-purple-50/80 border border-purple-200/90 rounded-xl shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-purple-950">
              <Users className="w-4 h-4 text-purple-700" />
              <span className="hidden sm:inline">Học Viên Trong Lớp</span>
              <span className="text-[11px] font-black text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 shadow-2xs font-mono">
                {classStudents.length} / {classGroup.maxStudents || 21} HV
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullRosterModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-800 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg shadow-2xs transition-all active:scale-95"
              title="Xem toàn bộ danh sách học viên trong lớp"
            >
              <Eye className="w-3.5 h-3.5 text-purple-700" />
              <span>👁️ Xem toàn bộ danh sách ({classStudents.length} HV)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-all active:scale-95"
              title="Thêm học sinh vào lớp học này"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm học sinh vào lớp</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'daily_log' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Section: Session Date, Teacher & Multi-Skill Config */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <span>Bảng Chấm Điểm & Nhật Ký Buổi Học (Hỗ trợ nhiều kĩ năng trong 1 buổi)</span>
              </div>
              {onAddTeacher && (
                <button
                  onClick={() => setIsTeacherModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Tạo Giáo Viên</span>
                </button>
              )}
            </div>

            {/* Session Metadata Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Ngày tháng dạy: <span className="text-purple-700">*</span>
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Buổi học số:
                </label>
                <input
                  type="number"
                  min={1}
                  max={classGroup.totalSessions || 60}
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none"
                />
                {sessionNumber === 29 && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-[11px] flex items-center justify-between gap-1">
                    <span className="font-bold flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Buổi 29: Nhắc xếp Trợ giảng (TA)!</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyTaReminder}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-[10px] shrink-0"
                    >
                      {isTaReminderCopied ? 'Đã chép!' : 'Chép tin'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Giáo viên đứng lớp: <span className="text-purple-700">*</span>
                </label>
                <input
                  type="text"
                  list="teacher-names-class"
                  placeholder="Nhập hoặc chọn tên giáo viên..."
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <datalist id="teacher-names-class">
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name} />
                  ))}
                  {classGroup.teacherNames?.map((tn, idx) => (
                    <option key={`cls-t-${idx}`} value={tn} />
                  ))}
                  <option value={classGroup.teacherName} />
                </datalist>

                {/* Quick select buttons for assigned class teachers */}
                {((classGroup.teacherNames && classGroup.teacherNames.length > 0)
                  ? classGroup.teacherNames
                  : classGroup.teacherName.split(/[,;&+]/).map((t) => t.trim()).filter((t) => t.length > 0)
                ).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Chọn nhanh:</span>
                    {(classGroup.teacherNames && classGroup.teacherNames.length > 0
                      ? classGroup.teacherNames
                      : classGroup.teacherName.split(/[,;&+]/).map((t) => t.trim()).filter((t) => t.length > 0)
                    ).map((tName, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTeacherName(tName)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                          teacherName === tName
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-purple-100 border-slate-200'
                        }`}
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Penalty Setting & Auto-calculated Total Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Box 1: Điền & gán nhanh mức phạt và nợ cũ */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/90 shadow-xs space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>3. Mức phạt nộp bài & nợ cũ (Trợ lý điền số tiền):</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                    Tự động cộng dồn
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-600">Phạt buổi này:</span>
                  {(['10k', '20k', '50k', ''] as const).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSetAllPenaltyFees(amt)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/80 shadow-2xs transition-all active:scale-95"
                    >
                      {amt === '' ? 'Xoá sạch' : `Gán ${amt}`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setStudentRows((prev) => {
                        const next = { ...prev };
                        classStudents.forEach((st) => {
                          if (next[st.id]) {
                            let missingCount = 0;
                            if (next[st.id].homeworkStatus === 'Chưa làm' || next[st.id].homeworkStatus === 'Thiếu') {
                              missingCount++;
                            }
                            if (next[st.id].quizletStatus === 'Chưa học') {
                              missingCount++;
                            }
                            const fee = missingCount * 10000;
                            next[st.id] = {
                              ...next[st.id],
                              penaltyFee: fee > 0 ? `${fee / 1000}k` : '',
                            };
                          }
                        });
                        return next;
                      });
                      setToastMessage('Đã gán phạt 10k cho mỗi mục thiếu (BTVN, Quizlet)!');
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-2xs transition-all"
                  >
                    + Phạt 10k/mỗi mục thiếu (BTVN, Quizlet)
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-200/50">
                  <span className="text-[11px] font-bold text-rose-700">Nợ cũ:</span>
                  <button
                    type="button"
                    onClick={() => handleSetAllPreviousDebts('')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    Xoá trống cả lớp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentRows((prev) => {
                        const next = { ...prev };
                        classStudents.forEach((st) => {
                          if (next[st.id] && st.balanceOwed && st.balanceOwed > 0) {
                            next[st.id] = { ...next[st.id], previousDebt: `${st.balanceOwed / 1000}k` };
                          }
                        });
                        return next;
                      });
                      setToastMessage('Đã đồng bộ số nợ học phí từ hồ sơ học viên!');
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all"
                  >
                    Đồng bộ nợ từ hồ sơ HV
                  </button>
                </div>
                <p className="text-[10px] text-amber-800 italic">
                  💡 Trợ lý có thể điền số tiền phạt và số tiền nợ chưa nộp các buổi trước trực tiếp cho từng học sinh ở bảng bên dưới.
                </p>
              </div>

              {/* Box 2: TỔNG SỐ TIỀN NỘP PHẠT & NỢ CỦA LỚP TỰ ĐỘNG CỘNG & GHI CHÚ TO */}
              <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 p-3.5 rounded-2xl border-2 border-amber-400 shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Tổng tiền phạt & nợ cũ của lớp:</span>
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-mono">
                    {countStudentsWithPenalty} phạt • {countStudentsWithPreviousDebt} nợ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-white/80 p-2 rounded-xl border border-amber-300/80">
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Phạt buổi này:</span>
                    <span className="text-lg sm:text-xl font-black text-amber-900 font-mono">
                      {formattedTotalPenaltyFee}
                    </span>
                  </div>
                  <div className="border-l border-amber-200 pl-2">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Nợ các buổi trước:</span>
                    <span className="text-lg sm:text-xl font-black text-rose-700 font-mono">
                      {formattedTotalPreviousDebt}
                    </span>
                  </div>
                </div>

                {grandTotalReceivable > 0 && (
                  <div className="flex items-center justify-between bg-amber-200/60 px-2.5 py-1 rounded-lg border border-amber-400">
                    <span className="text-xs font-black text-amber-950">👉 TỔNG TIỀN PHẢI THU CẢ LỚP:</span>
                    <span className="text-sm font-black text-amber-950 font-mono">{formattedGrandTotalReceivable}</span>
                  </div>
                )}

                {/* Ghi chú to ở phiếu gửi phụ huynh ngay cạnh ô nộp phạt */}
                <div className="p-2.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 text-xs font-black flex items-start gap-2 shadow-2xs leading-snug">
                  <span className="text-base shrink-0">⚠️</span>
                  <span>
                    Lưu ý: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.
                  </span>
                </div>
              </div>
            </div>

            {/* Topic input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Nội dung bài học / Chủ đề trọng tâm:
              </label>
              <input
                type="text"
                placeholder="VD: Kiểm tra Từ vựng Unit 5 + Luyện nghe Part 2 + Đọc hiểu..."
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* MULTI-SKILL SELECTION BAR */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>5. Chọn các kỹ năng kiểm tra trong buổi ({selectedSkills.length} kỹ năng đã chọn):</span>
                </span>
                
                {/* Preset combo buttons */}
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <span className="text-slate-400 font-medium">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => setPresetSkills(['Ôn tập'])}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold transition-colors flex items-center gap-1"
                  >
                    <span>🔄 Ôn tập</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetSkills(['Từ vựng', 'Nghe', 'Đọc'])}
                    className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold transition-colors"
                  >
                    Từ vựng + Nghe + Đọc
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetSkills(['Nghe', 'Đọc'])}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                  >
                    Nghe + Đọc
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetSkills(['Nói', 'Phát âm'])}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                  >
                    Nói + Phát âm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetSkills(['Nghe', 'Nói', 'Đọc', 'Viết'])}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                  >
                    4 Kỹ năng
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetSkills(COMMON_SKILLS.filter(s => s !== 'Ôn tập'))}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold transition-colors"
                  >
                    Tất cả kỹ năng ({COMMON_SKILLS.length})
                  </button>
                </div>
              </div>

              {/* Toggle Badges for 7 Skills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {COMMON_SKILLS.map((sk) => {
                  const isSelected = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-700 text-white shadow-xs ring-2 ring-purple-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{SKILL_ICONS[sk] || '📝'}</span>
                      <span>{sk}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 ml-0.5 text-purple-200" />
                      ) : (
                        <Plus className="w-3 h-3 ml-0.5 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Setting to customize overall score type */}
              <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs mt-1">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableOverallScore}
                      onChange={(e) => setEnableOverallScore(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer"
                    />
                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-indigo-700" />
                      <span>Tính Điểm Tổng Kết</span>
                    </span>
                  </label>
                  {!enableOverallScore && (
                    <span className="text-[11px] font-semibold text-slate-400 italic">
                      (Đã tắt - ẩn cột Điểm TB / Band trong bảng điểm)
                    </span>
                  )}
                </div>

                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs gap-1">
                  <button
                    type="button"
                    onClick={() => setEnableOverallScore(false)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
                      !enableOverallScore
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Tắt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnableOverallScore(true);
                      setOverallScoreType('average');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                      enableOverallScore && overallScoreType === 'average'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Điểm TB các mục đã chọn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEnableOverallScore(true);
                      setOverallScoreType('ielts_band');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                      enableOverallScore && overallScoreType === 'ielts_band'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Làm tròn Overall Band IELTS (4 kỹ năng)
                  </button>
                </div>
              </div>
            </div>

            {/* Special penalty alert when skill Viết is active */}
            {hasWritingSkill && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <PenTool className="w-4 h-4 text-amber-600" />
                  <span>Kỹ năng Viết đang bật: Cho phép nhập & theo dõi số lần chép phạt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-800 font-medium text-[11px]">Gán nhanh chép phạt cả lớp:</span>
                  {[0, 1, 2, 3, 5, 10].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSetAllPenalties(cnt)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
                    >
                      {cnt} lần
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Grading Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Bảng Nhập Điểm Học Viên</span>
                <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                  {classStudents.length} học viên
                </span>
                <span className="text-xs text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md font-bold">
                  {selectedSkills.join(' + ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassZaloModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs"
                  title="Xuất bảng điểm, sắp xếp điểm từ cao xuống thấp và lưu ảnh gửi Phụ huynh"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Xuất ảnh / Gửi Zalo</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailySession}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu buổi học</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 w-12 min-w-[48px] max-w-[48px] text-center bg-slate-100 font-bold sticky left-0 z-20">STT</th>
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-3 min-w-[170px] max-w-[200px] bg-slate-100 font-bold sticky left-12 z-20 border-r-2 border-slate-300 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.08)]">Học viên</th>
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-48">Điểm danh</th>

                    {/* DYNAMIC SCORE COLUMNS FOR EACH SELECTED SKILL */}
                    {selectedSkills.map((sk) => (
                      <th key={sk} rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-2.5 px-2 text-center min-w-[105px]">
                        <div className="flex flex-col items-center gap-1 py-0.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <span>{SKILL_ICONS[sk] || '📝'}</span>
                            <span>{sk}</span>
                            {sk === 'Ôn tập' && (
                              <span className="text-[10px] text-emerald-700 font-normal">(Tùy chọn)</span>
                            )}
                          </span>
                          {/* Ô trống bên dưới để điền tổng số câu */}
                          <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-purple-200 shadow-2xs" title={`Điền tổng số câu của kỹ năng ${sk}`}>
                            <span className="text-[10px] text-purple-700 font-semibold">Tổng:</span>
                            <input
                              type="text"
                              placeholder="Số câu..."
                              value={skillTotalQuestions[sk] || ''}
                              onChange={(e) => handleSkillTotalQuestionsChange(sk, e.target.value)}
                              className="w-12 text-[10px] text-center font-extrabold text-purple-900 bg-transparent border-none focus:outline-none placeholder:text-slate-300"
                            />
                          </div>
                        </div>
                      </th>
                    ))}

                    {/* Calculated Average score or IELTS Band if enabled */}
                    {enableOverallScore && (
                      <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-20 bg-purple-50/50">
                        <div className="flex flex-col items-center text-purple-900 font-bold">
                          <span>{overallScoreType === 'ielts_band' ? 'Overall Band' : 'Điểm TB'}</span>
                          <span className="text-[9px] text-purple-600 font-normal">Tự tính</span>
                        </div>
                      </th>
                    )}

                    {/* Penalty Copies column if Viết is selected */}
                    {hasWritingSkill && (
                      <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-28 bg-amber-50/50">
                        <div className="flex flex-col items-center text-amber-900">
                          <span>Chép phạt</span>
                          <span className="text-[10px] text-amber-700 font-normal">(Số lần)</span>
                        </div>
                      </th>
                    )}

                    {/* Quizlet Column */}
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-36">
                      <div className="flex flex-col items-center gap-1">
                        <span>Quizlet</span>
                        <div className="inline-flex items-center gap-1 font-normal text-[10px] bg-purple-50/80 px-1.5 py-0.5 rounded border border-purple-200/60">
                          <button
                            type="button"
                            onClick={() => handleSetAllQuizlet('Đã học')}
                            className="text-emerald-700 hover:underline font-bold"
                          >
                            Đã học
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleSetAllQuizlet('Chưa học')}
                            className="text-rose-700 hover:underline font-bold"
                          >
                            Chưa
                          </button>
                        </div>
                      </div>
                    </th>

                    {/* Homework Column (Two-tier with colSpan) */}
                    {homeworkItems.length > 0 ? (
                      <th
                        colSpan={homeworkItems.length}
                        className="py-2 px-2 text-center bg-amber-100/90 text-amber-950 font-black text-xs border-l border-b border-amber-300/80 tracking-wide"
                      >
                        <div className="flex items-center justify-center gap-1.5 py-1">
                          <span>BTVN (Đề mục {homeworkItems.length})</span>
                          <button
                            type="button"
                            onClick={() => setIsHwConfigModalOpen(true)}
                            className="p-1 rounded bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center shadow-2xs transition-all"
                            title="Tùy chỉnh danh sách các đề mục BTVN"
                          >
                            <Sliders className="w-2.5 h-2.5 text-amber-600" />
                          </button>
                        </div>
                      </th>
                    ) : (
                      <th className="py-3 px-2 text-center w-24">BTVN</th>
                    )}

                    {/* CỘT TỔNG TIỀN PHẠT BUỔI NÀY (Sau cột BTVN) */}
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center min-w-[120px] bg-amber-50/80 text-amber-950 font-bold border-l border-amber-200/60">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                          <span>Phạt buổi này</span>
                        </div>
                        <span className="text-[10px] text-amber-900 font-mono font-black bg-white px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                          {formattedTotalPenaltyFee}
                        </span>
                        <div className="inline-flex items-center gap-1 font-normal text-[10px] bg-white px-1 py-0.5 rounded border border-amber-300">
                          <button
                            type="button"
                            onClick={() => handleSetAllPenaltyFees('')}
                            className="text-slate-500 hover:underline font-bold"
                          >
                            Xóa
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleSetAllPenaltyFees('20k')}
                            className="text-amber-700 hover:underline font-bold"
                          >
                            20k
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleSetAllPenaltyFees('50k')}
                            className="text-amber-800 hover:underline font-bold"
                          >
                            50k
                          </button>
                        </div>
                      </div>
                    </th>

                    {/* CỘT NỢ CHƯA NỘP CÁC BUỔI TRƯỚC */}
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center min-w-[130px] bg-rose-50/80 text-rose-950 font-bold border-l border-rose-200/70">
                      <div className="flex flex-col items-center gap-1">
                        <span>Nợ các buổi trước</span>
                        <span className="text-[10px] text-rose-900 font-mono font-black bg-white px-2 py-0.5 rounded-full border border-rose-300 shadow-2xs">
                          {formattedTotalPreviousDebt}
                        </span>
                        <div className="inline-flex items-center gap-1 font-normal text-[10px] bg-white px-1 py-0.5 rounded border border-rose-300">
                          <button
                            type="button"
                            onClick={() => handleSetAllPreviousDebts('')}
                            className="text-slate-500 hover:underline font-bold"
                          >
                            Xóa
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleSetAllPreviousDebts('20k')}
                            className="text-rose-700 hover:underline font-bold"
                          >
                            20k
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => handleSetAllPreviousDebts('50k')}
                            className="text-rose-800 hover:underline font-bold"
                          >
                            50k
                          </button>
                        </div>
                      </div>
                    </th>

                    {/* Feedback Column */}
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-3 min-w-[150px]">Nhận xét giáo viên</th>

                    {/* Zalo Single Send Column */}
                    <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-24">Báo Zalo</th>
                  </tr>

                  {/* SECOND HEADER ROW FOR BTVN SUB-ITEMS */}
                  {homeworkItems.length > 0 && (
                    <tr className="bg-amber-50/80 border-b border-amber-200 text-[10px] font-extrabold text-amber-950">
                      {homeworkItems.map((item) => (
                        <th key={item} className="py-1 px-1 text-center min-w-[55px] border-l border-amber-200/60 font-black">
                          {item}
                        </th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((st, idx) => {
                    const row = studentRows[st.id] || {
                      status: 'Có mặt',
                      skillScores: {},
                      penaltyCopies: '0',
                      penaltyFee: '0 đ',
                      penaltyBankAccount: '',
                      feedback: '',
                      homeworkStatus: 'Đã làm',
                      quizletStatus: 'Đã học',
                      note: '',
                    };
                    const studentAvg = calculateStudentAverage(row);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3 px-2 text-center font-bold text-slate-500 bg-slate-50 w-12 min-w-[48px] max-w-[48px] sticky left-0 z-10">{idx + 1}</td>
                        <td className="py-3 px-3 bg-white group-hover:bg-slate-50 min-w-[170px] max-w-[200px] sticky left-12 z-10 border-r-2 border-slate-300 shadow-[3px_0_5px_-2px_rgba(0,0,0,0.08)]">
                          <div className="font-bold text-slate-900 truncate">{st.name}</div>
                          <div className="text-[11px] text-purple-700 font-mono">{st.code}</div>
                        </td>

                        {/* Status buttons */}
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center gap-0.5">
                            {(['Có mặt', 'Đi muộn', 'Nghỉ có phép', 'Nghỉ không phép'] as const).map((stt) => (
                              <button
                                key={stt}
                                type="button"
                                onClick={() => {
                                  setStudentRows((prev) => ({
                                    ...prev,
                                    [st.id]: { ...prev[st.id], status: stt },
                                  }));
                                }}
                                className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                                  row.status === stt || (stt === 'Đi muộn' && row.status === 'Đi trễ')
                                    ? stt === 'Có mặt'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : stt === 'Đi muộn'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : stt === 'Nghỉ có phép'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {stt === 'Có mặt' ? 'Có' : stt === 'Đi muộn' ? 'Muộn' : stt === 'Nghỉ có phép' ? 'Phép' : 'Vắng'}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* DYNAMIC SCORE INPUT CELLS WITH RATIO */}
                        {selectedSkills.map((sk) => (
                          <td key={sk} className="py-3 px-2 text-center">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <input
                                type="text"
                                placeholder={skillTotalQuestions[sk] ? `0` : ''}
                                value={row.skillScores?.[sk] || ''}
                                onChange={(e) => handleScoreChange(st.id, sk, e.target.value)}
                                className={`w-16 text-center font-bold rounded-xl py-1 px-1 text-xs focus:outline-none focus:ring-2 ${
                                  sk === 'Ôn tập'
                                    ? 'text-emerald-900 bg-emerald-50/70 border border-emerald-300 focus:ring-emerald-500/20'
                                    : 'text-purple-900 bg-purple-50/60 border border-purple-200 focus:ring-purple-500/20'
                                }`}
                              />
                              {skillTotalQuestions[sk] && (
                                <span className="text-[9px] text-purple-700/80 font-bold">
                                  /{skillTotalQuestions[sk]} câu
                                </span>
                              )}
                            </div>
                          </td>
                        ))}

                        {/* Average / Overall IELTS Band display */}
                        {enableOverallScore && (
                          <td className="py-3 px-2 text-center bg-purple-50/30 font-bold">
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                              studentAvg !== '-' 
                                ? overallScoreType === 'ielts_band'
                                  ? 'text-indigo-900 bg-indigo-100/80 border border-indigo-200'
                                  : 'text-purple-900 bg-purple-100/80 border border-purple-200' 
                                : 'text-slate-400'
                            }`}>
                              {studentAvg}
                            </span>
                          </td>
                        )}

                        {/* Penalty Copies input for Writing */}
                        {hasWritingSkill && (
                          <td className="py-3 px-2 text-center bg-amber-50/30">
                            <div className="inline-flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={50}
                                placeholder="0"
                                value={row.penaltyCopies}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStudentRows((prev) => ({
                                    ...prev,
                                    [st.id]: { ...prev[st.id], penaltyCopies: val },
                                  }));
                                }}
                                className="w-12 text-center font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg py-1 px-0.5 text-xs focus:outline-none"
                              />
                              <span className="text-[10px] text-amber-700">lần</span>
                            </div>
                          </td>
                        )}

                        {/* Quizlet Vocabulary Status */}
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setStudentRows((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], quizletStatus: 'Đã học' },
                                }));
                              }}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                                row.quizletStatus === 'Đã học'
                                  ? 'bg-purple-700 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              ✓ Học
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStudentRows((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], quizletStatus: 'Chưa học' },
                                }));
                              }}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                                row.quizletStatus === 'Chưa học'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              ✗ Chưa
                            </button>
                          </div>
                        </td>

                        {/* Homework status: Granular Item Tracking (Nghe, Nói, Đọc, Viết, Chép phạt, Chữa bài...) */}
                        {homeworkItems.length > 0 ? (
                          homeworkItems.map((item) => {
                            const isMissing = row.homeworkStatus === 'Chưa làm' || row.missingHomeworkItems?.includes(item);
                            return (
                              <td
                                key={item}
                                className="py-2.5 px-2 text-center border-l border-slate-100 bg-amber-50/10"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleMissingHwItem(st.id, item)}
                                  title={
                                    isMissing
                                      ? `Đang thiếu: ${item} (Bấm để chuyển sang ĐỦ)`
                                      : `Đã làm: ${item} (Bấm để đánh dấu THIẾU)`
                                  }
                                  className="inline-flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                >
                                  {isMissing ? (
                                    <span className="inline-flex items-center justify-center text-rose-600 font-bold font-mono tracking-tighter text-sm">
                                      (✘)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-600 text-white font-black text-[11px] shadow-2xs border border-emerald-500">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              </td>
                            );
                          })
                        ) : (
                          <td className="py-2.5 px-2 text-center bg-slate-50/40 text-slate-400 font-semibold">-</td>
                        )}

                        {/* CỘT TỔNG TIỀN PHẠT CHO TỪNG HỌC VIÊN */}
                        <td className="py-3 px-2 text-center bg-amber-50/30 border-l border-amber-100">
                          <input
                            type="text"
                            placeholder="0k"
                            value={row.penaltyFee || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentRows((prev) => ({
                                ...prev,
                                [st.id]: { ...prev[st.id], penaltyFee: val },
                              }));
                            }}
                            className="w-20 text-center font-bold text-amber-950 bg-white border border-amber-300 rounded-xl py-1 px-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs"
                          />
                        </td>

                        {/* CỘT NỢ CHƯA NỘP CÁC BUỔI TRƯỚC */}
                        <td className="py-3 px-2 text-center bg-rose-50/30 border-l border-rose-100">
                          <div className="flex flex-col items-center gap-0.5">
                            <input
                              type="text"
                              placeholder="0k"
                              value={row.previousDebt || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStudentRows((prev) => ({
                                  ...prev,
                                  [st.id]: { ...prev[st.id], previousDebt: val },
                                }));
                              }}
                              className={`w-20 text-center font-bold bg-white border rounded-xl py-1 px-1 text-xs focus:outline-none focus:ring-2 shadow-2xs ${
                                parsePenaltyAmount(row.previousDebt) > 0
                                  ? 'text-rose-950 border-rose-400 focus:ring-rose-500/30 bg-rose-50/30'
                                  : 'text-slate-700 border-slate-300 focus:ring-slate-400/30'
                              }`}
                            />
                            {parsePenaltyAmount(row.previousDebt) > 0 && (
                              <span className="text-[9px] font-bold text-rose-600">Còn nợ</span>
                            )}
                          </div>
                        </td>

                        {/* Feedback */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="Để trống nếu không có nhận xét..."
                            value={row.feedback}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentRows((prev) => ({
                                ...prev,
                                [st.id]: { ...prev[st.id], feedback: val },
                              }));
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </td>

                        {/* Zalo Single Action */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForZalo(st)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                            title="Xem và gửi bảng điểm qua Zalo cho phụ huynh"
                          >
                            <MessageCircle className="w-3 h-3 text-indigo-600" />
                            <span>Zalo</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={9 + selectedSkills.length + (enableOverallScore ? 1 : 0) + (hasWritingSkill ? 1 : 0)} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600 mb-1">Chưa có học sinh nào trong lớp học này</p>
                        <p className="text-[11px] text-slate-400 mb-3">
                          Bấm nút "+ Thêm học sinh" ở góc phải để xếp học sinh vào lớp
                        </p>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-all"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Thêm học sinh ngay</span>
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>

                {classStudents.length > 0 && (
                  <tfoot className="bg-amber-50/60 border-t-2 border-amber-300 font-bold">
                    <tr>
                      <td
                        colSpan={4 + selectedSkills.length + (enableOverallScore ? 1 : 0) + (hasWritingSkill ? 1 : 0) + 2}
                        className="py-3 px-4 text-right text-xs font-black text-amber-950 uppercase tracking-wide"
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Coins className="w-4 h-4 text-amber-600" />
                          <span>Tổng cộng của lớp (Tự động cộng):</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center bg-amber-100/90 border-l border-amber-300">
                        <div className="text-xs font-black text-amber-950 font-mono">
                          {formattedTotalPenaltyFee}
                        </div>
                        <div className="text-[9px] text-amber-800 font-semibold">
                          ({countStudentsWithPenalty} bạn phạt)
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center bg-rose-100/90 border-l border-rose-300">
                        <div className="text-xs font-black text-rose-950 font-mono">
                          {formattedTotalPreviousDebt}
                        </div>
                        <div className="text-[9px] text-rose-800 font-semibold">
                          ({countStudentsWithPreviousDebt} bạn nợ)
                        </div>
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-left">
                        <div className="space-y-1">
                          {grandTotalReceivable > 0 && (
                            <div className="text-[11px] font-black text-amber-950">
                              👉 Tổng thu (Phạt + Nợ cũ): <span className="text-rose-700 font-mono text-xs">{formattedGrandTotalReceivable}</span>
                            </div>
                          )}
                          <div className="text-[11px] font-black text-rose-800 leading-tight">
                            ⚠️ Lưu ý: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span>Đã chọn <strong className="text-purple-700 font-bold">{selectedSkills.length} kỹ năng</strong> ({selectedSkills.join(', ')})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassZaloModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-xs transition-colors"
                  title="Xuất bảng điểm, sắp xếp điểm từ cao xuống thấp và lưu ảnh gửi Phụ huynh"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Xuất Báo Cáo Điểm Cả Lớp (Ảnh/Zalo)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveDailySession}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Toàn Bộ Buổi Dạy & Bảng Điểm</span>
                </button>
              </div>
            </div>
          </div>

          {/* Past Sessions History Section */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-700" />
                <span>Lịch sử các buổi học đã ghi nhận của {classGroup.name}</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">{pastSessions.length} buổi đã lưu</span>
            </div>

            {pastSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Chưa có buổi học nào được lưu trước đó.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pastSessions.map((ps) => {
                  const attended = ps.records.filter((r) => r.status === 'Có mặt').length;
                  return (
                    <div
                      key={`${ps.date}-${ps.sessionNumber}`}
                      onClick={() => {
                        setCurrentDate(ps.date);
                        setSessionNumber(ps.sessionNumber);
                        setTeacherName(ps.teacherName);
                        if (ps.skillsTaught && ps.skillsTaught.length > 0) {
                          setSelectedSkills(ps.skillsTaught);
                        }
                        setToastMessage(`Đã nạp lại dữ liệu buổi ${ps.sessionNumber} ngày ${formatDateVN(ps.date)}`);
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 cursor-pointer transition-colors space-y-1 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-700 group-hover:text-purple-900">Buổi {ps.sessionNumber}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{formatDateVN(ps.date)}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {ps.skillsTaught.join(', ')}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <span>GV: {ps.teacherName}</span>
                        <span>{attended}/{ps.records.length} HV</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: BẢNG ĐIỂM & HỌC PHÍ CHUẨN GOOGLE SHEETS */}
      {activeTab === 'sheet_view' && (
        <div className="animate-in fade-in space-y-4">
          <ClassSpreadsheetGradebookModule
            classes={[classGroup]}
            students={allStudents}
          />
        </div>
      )}

      {/* VIEW: BÀI TEST TỪ VỰNG KHÓA 1, 2, 3, 4 CHỐNG GIAN LẬN */}
      {activeTab === 'vocab_tests' && (
        <div className="animate-in fade-in space-y-4">
          <ClassVocabTestModule
            classGroup={classGroup}
            classes={[classGroup]}
            students={classStudents}
            onAddExamScore={onAddExamScore}
            onSaveAttendance={onSaveAttendance}
            showToast={(msg) => setToastMessage(msg)}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* VIEW: TỔNG DANH SÁCH LỚP HỌC & HỌC SINH CHỜ CHUẨN BỊ VÀO KHÓA SAU */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Summary Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Sĩ số lớp chính thức
              </span>
              <div className="text-xl font-black text-purple-900 flex items-baseline gap-1">
                <span>{classStudents.length}</span>
                <span className="text-xs text-slate-400 font-normal">/ {classGroup.maxStudents} tối đa</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">
                Tỷ lệ lấp đầy {Math.round((classStudents.length / (classGroup.maxStudents || 15)) * 100)}%
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tài khoản Gmail
              </span>
              <div className="text-xl font-black text-indigo-900">
                {classStudents.filter((s) => s.email).length} <span className="text-xs font-normal text-slate-400">/ {classStudents.length} HV</span>
              </div>
              <p className="text-[10px] text-indigo-600 font-semibold">100% Học viên đã gán Gmail</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Thông tin Ngày sinh (DOB)
              </span>
              <div className="text-xl font-black text-slate-900">
                {classStudents.filter((s) => s.dob).length} <span className="text-xs font-normal text-slate-400">/ {classStudents.length} HV</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Đã cập nhật ngày sinh</p>
            </div>

            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Học sinh chờ khóa sau
              </span>
              <div className="text-xl font-black text-amber-900">
                {waitingForNextCourseStudents.length} <span className="text-xs font-normal text-amber-700">học viên</span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold">Sẵn sàng nhập học đợt tới</p>
            </div>
          </div>

          {/* Section 1: Official Class Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Bảng Tổng Danh Sách Lớp Học Chính Thức ({classStudents.length} HV)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mã lớp: <strong className="font-mono text-purple-700">{classGroup.code}</strong> • Khóa: {classGroup.courseName} • Lịch học: {classGroup.schedule}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyFullRoster}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép bảng</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Thêm học sinh</span>
                </button>
              </div>
            </div>

            {/* Quick search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhanh học sinh theo Tên, Gmail, Ngày sinh (DOB), Họ tên Phụ huynh..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Full Table */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-purple-50/80 text-purple-950 font-extrabold text-[11px] border-b border-purple-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 min-w-[160px]">Họ và tên học viên</th>
                    <th className="py-3 px-3 min-w-[190px]">Gmail</th>
                    <th className="py-3 px-3 min-w-[110px]">Ngày sinh (DOB)</th>
                    <th className="py-3 px-3 min-w-[150px]">Phụ huynh</th>
                    <th className="py-3 px-3 w-28 text-center">Trạng thái</th>
                    <th className="py-3 px-3 w-28 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classStudents
                    .filter((st) => {
                      if (!rosterSearch.trim()) return true;
                      const q = rosterSearch.toLowerCase();
                      return (
                        st.name.toLowerCase().includes(q) ||
                        st.code.toLowerCase().includes(q) ||
                        (st.email && st.email.toLowerCase().includes(q)) ||
                        (st.dob && st.dob.includes(q)) ||
                        (st.parentName && st.parentName.toLowerCase().includes(q))
                      );
                    })
                    .map((st, idx) => {
                      const cleanEmail =
                        st.email ||
                        `${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

                      return (
                        <tr key={st.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {st.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{st.name}</span>
                                  {(st.isExternalStudent || st.studentCategory === 'Học sinh ngoài') && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                      🏷️ Học sinh ngoài
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-purple-700 font-mono font-bold flex items-center gap-1.5 flex-wrap">
                                  <span>{st.code}</span>
                                  {(st.customTuitionFee || (st.courseTuitionFee && st.courseTuitionFee !== classGroup.courseTuitionFee)) && (
                                    <span className="text-[9px] font-sans font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      HP riêng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(st.customTuitionFee || st.courseTuitionFee || 0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="inline-flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 font-mono text-purple-900 text-[11px] font-semibold">
                              <Mail className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>{cleanEmail}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700">
                            {formatDateVN(st.dob) || 'Chưa cập nhật'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-700">
                            <div className="font-semibold text-slate-800">{st.parentName || 'Chưa cập nhật'}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                st.tuitionStatus === 'Đã đóng đủ'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForZalo(st)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200"
                                title="Báo Zalo Phụ huynh"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setStudentToRemove(st)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                                title="Bỏ học sinh khỏi lớp"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        Lớp học hiện tại chưa có học viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Waiting List for Next Course */}
          <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white rounded-3xl border border-amber-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-extrabold text-amber-950">
                    Mục Học Sinh Chờ Chuẩn Bị Vào Khóa Sau ({waitingForNextCourseStudents.length} HV)
                  </h2>
                </div>
                <p className="text-xs text-amber-800/80">
                  Danh sách học sinh đang chờ xếp lớp, bảo lưu hoặc đăng ký ghi danh chuẩn bị vào đợt khai giảng tiếp theo của lớp này.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddWaitingStudentModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-300 rounded-xl transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Đăng ký học sinh chờ khóa sau</span>
              </button>
            </div>

            {/* Waiting List Table */}
            <div className="overflow-x-auto border border-amber-200/80 rounded-2xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-amber-100/70 text-amber-950 font-extrabold text-[11px] border-b border-amber-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 min-w-[150px]">Họ và tên học viên</th>
                    <th className="py-3 px-3 min-w-[180px]">Gmail</th>
                    <th className="py-3 px-3 min-w-[110px]">Ngày sinh (DOB)</th>
                    <th className="py-3 px-3 min-w-[120px]">Số điện thoại</th>
                    <th className="py-3 px-3 min-w-[140px]">Phụ huynh</th>
                    <th className="py-3 px-3 min-w-[160px]">Ghi chú / Khóa chờ</th>
                    <th className="py-3 px-3 w-36 text-center">Thao tác xếp lớp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60 font-medium">
                  {waitingForNextCourseStudents.map((st, idx) => {
                    const cleanEmail =
                      st.email ||
                      `${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

                    return (
                      <tr key={st.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="py-3.5 px-3 text-center font-bold text-amber-700/60">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-amber-800 font-mono font-bold">
                            {st.code}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-amber-950 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                            {cleanEmail}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700">
                          {formatDateVN(st.dob) || 'Chưa cập nhật'}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {st.phone}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          <div>{st.parentName || 'PH Học Viên'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {st.parentPhone || st.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-amber-900 text-[11px] font-medium">
                          {st.waitingNote || `Chờ khóa sau (${classGroup.courseName})`}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              onEnrollStudent(classGroup.id, st.id);
                              setToastMessage(`Đã xếp học viên "${st.name}" vào lớp chính thức thành công!`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-[11px] shadow-xs transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>⚡ Chuyển vào lớp</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {waitingForNextCourseStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-amber-800/60 text-xs">
                        Chưa có học sinh nào trong danh sách chờ khóa sau. Bấm nút "+ Đăng ký học sinh chờ khóa sau" để ghi danh!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Báo cáo Zalo cho từng học sinh */}
      {selectedStudentForZalo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Bảng Điểm Gửi Zalo Phụ Huynh</h3>
                  <p className="text-xs text-purple-200">
                    Học viên: {selectedStudentForZalo.name} (PH: {selectedStudentForZalo.parentName || 'Quý PH'} - {selectedStudentForZalo.parentPhone || selectedStudentForZalo.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForZalo(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {(parsePenaltyAmount(studentRows[selectedStudentForZalo.id]?.penaltyFee) > 0 ||
                parsePenaltyAmount(studentRows[selectedStudentForZalo.id]?.previousDebt) > 0) && (
                <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-950 text-xs font-black flex items-start gap-2.5 shadow-xs">
                  <span className="text-lg shrink-0">⚠️</span>
                  <div>
                    <span className="uppercase text-[11px] tracking-wide text-rose-700 block font-black">
                      Lưu ý quan trọng trên phiếu gửi phụ huynh:
                    </span>
                    <span className="text-rose-900">
                      PH/HS chuyển khoản nộp phạt/nợ vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 select-all">
                {generateZaloMessageForStudent(selectedStudentForZalo)}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bảng điểm đã được tự động định dạng chuẩn gồm đầy đủ các kỹ năng ({selectedSkills.join(', ')}), điểm trung bình, BTVN, Quizlet và nhận xét giáo viên.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                SĐT Phụ huynh: <strong className="text-slate-800">{selectedStudentForZalo.parentPhone || selectedStudentForZalo.phone}</strong>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://zalo.me/${(selectedStudentForZalo.parentPhone || selectedStudentForZalo.phone).replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Zalo</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generateZaloMessageForStudent(selectedStudentForZalo), selectedStudentForZalo.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
                >
                  {copiedZaloId === selectedStudentForZalo.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép nội dung Zalo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xuất Bảng Điểm & Nhật Ký Buổi Học Gửi Phụ Huynh (Hỗ trợ sắp xếp điểm từ cao xuống thấp & Lưu ảnh PNG) */}
      <ClassScoreExportModal
        isOpen={isClassZaloModalOpen}
        onClose={() => setIsClassZaloModalOpen(false)}
        classGroup={classGroup}
        classStudents={classStudents}
        studentRows={studentRows}
        sessionNumber={sessionNumber}
        currentDate={currentDate}
        teacherName={teacherName || classGroup.teacherName}
        lessonTopic={lessonTopic}
        selectedSkills={selectedSkills}
        overallScoreType={overallScoreType}
        enableOverallScore={enableOverallScore}
        hasWritingSkill={hasWritingSkill}
        calculateStudentAverage={calculateStudentAverage}
        skillTotalQuestions={skillTotalQuestions}
        totalPenaltyAmount={totalPenaltyAmount}
        penaltyBankAccount={penaltyBankAccount}
      />

      {/* Modal: Thêm học sinh vào lớp (Chọn từ danh sách có sẵn HOẶC Tạo mới) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-200" />
                  <span>Thêm học viên vào {classGroup.name}</span>
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Chọn học viên từ hệ thống hoặc tạo mới hồ sơ học sinh
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-4 text-xs font-bold">
              <button
                onClick={() => setModalTab('existing')}
                className={`pb-3 border-b-2 transition-all ${
                  modalTab === 'existing'
                    ? 'border-purple-700 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Chọn học viên có sẵn trong hệ thống ({unassignedStudents.length})
              </button>
              <button
                onClick={() => setModalTab('new')}
                className={`pb-3 border-b-2 transition-all ${
                  modalTab === 'new'
                    ? 'border-purple-700 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                + Tạo học viên mới trực tiếp
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalTab === 'existing' ? (
                selectedStudentForEnroll ? (
                  /* Custom tuition form for existing student joining later */
                  <div className="space-y-5 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                      <Calculator className="w-5 h-5 text-purple-700" />
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Thiết Lập Học Phí Cho Học Viên Vào Sau</h4>
                        <p className="text-[10px] text-purple-700 font-semibold">Đang xếp lớp cho học viên: <strong className="text-purple-900">{selectedStudentForEnroll.name}</strong></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Học phí chuẩn của lớp:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${(classGroup.tuitionFee || 14500000).toLocaleString('vi-VN')} đ`}
                          className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Học phí cần đóng của học viên này: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={enrollCustomTuition}
                            onChange={(e) => setEnrollCustomTuition(Number(e.target.value) || 0)}
                            className="w-full text-xs bg-white border border-purple-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Nhập học phí tùy chỉnh"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            {enrollCustomTuition.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Sửa trực tiếp số tiền học viên này cần nộp.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số tiền học viên đã đóng (nếu có):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={enrollPaidAmount}
                            onChange={(e) => setEnrollPaidAmount(Number(e.target.value) || 0)}
                            className="w-full text-xs bg-white border border-purple-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Nhập số tiền đã nộp"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            {enrollPaidAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số tiền còn nợ (Tự động tính):
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${Math.max(0, enrollCustomTuition - enrollPaidAmount).toLocaleString('vi-VN')} đ`}
                          className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-purple-700 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForEnroll(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Quay lại danh sách
                      </button>
                      <button
                        type="button"
                        onClick={handleEnrollExistingWithCustomTuition}
                        className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Xác nhận xếp lớp</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm học viên theo tên, mã hoặc số điện thoại..."
                        value={existingSearch}
                        onChange={(e) => setExistingSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-2xl">
                      {unassignedStudents.map((st) => (
                        <div
                          key={st.id}
                          className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{st.name}</div>
                            <div className="text-[11px] text-slate-500">
                              Mã: <span className="font-mono text-purple-700">{st.code}</span> • SĐT: {st.phone} •{' '}
                              <span className="text-slate-400">
                                {st.className ? `Hiện ở lớp ${st.className}` : 'Chưa xếp lớp'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleEnrollExisting(st.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Xếp lớp & Học phí</span>
                          </button>
                        </div>
                      ))}

                      {unassignedStudents.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          Không tìm thấy học viên nào phù hợp để thêm.
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* Form tạo học viên mới */
                <form onSubmit={handleCreateAndEnroll} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Họ và tên học viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn An"
                        value={newStudentForm.name}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, name: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Số điện thoại học viên
                      </label>
                      <input
                        type="tel"
                        placeholder="09xx xxx xxx"
                        value={newStudentForm.phone}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, phone: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        value={newStudentForm.dob}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, dob: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Giới tính</label>
                      <select
                        value={newStudentForm.gender}
                        onChange={(e) =>
                          setNewStudentForm({
                            ...newStudentForm,
                            gender: e.target.value as 'Nam' | 'Nữ' | 'Khác',
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none"
                      >
                        <option value="Nữ">Nữ</option>
                        <option value="Nam">Nam</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Họ tên Phụ huynh</label>
                      <input
                        type="text"
                        placeholder="VD: Nguyễn Văn Ba"
                        value={newStudentForm.parentName}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, parentName: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Số điện thoại Phụ huynh</label>
                      <input
                        type="tel"
                        placeholder="09xx xxx xxx"
                        value={newStudentForm.parentPhone}
                        onChange={(e) =>
                          setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Pricing and Late-Joiner Customization Panel */}
                  <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                    <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-purple-700" />
                      <span>Thông tin Học phí (Hỗ trợ học viên vào sau)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Định mức học phí lớp chuẩn:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${(classGroup.tuitionFee || 14500000).toLocaleString('vi-VN')} đ`}
                          className="w-full bg-slate-200/50 text-slate-500 border border-slate-200 rounded-xl p-2.5 font-bold cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Học phí thực đóng của học viên này: <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={newStudentForm.customTuitionFee}
                            onChange={(e) =>
                              setNewStudentForm({
                                ...newStudentForm,
                                customTuitionFee: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Nhập mức học phí tùy chỉnh"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                            {newStudentForm.customTuitionFee.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Số tiền học viên đã đóng trước (VNĐ):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={newStudentForm.paidAmount}
                            onChange={(e) =>
                              setNewStudentForm({
                                ...newStudentForm,
                                paidAmount: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Nhập số tiền đã nộp"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                            {newStudentForm.paidAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Số tiền còn nợ (Tự động tính):
                        </label>
                        <input
                          type="text"
                          disabled
                          value={`${Math.max(0, newStudentForm.customTuitionFee - newStudentForm.paidAmount).toLocaleString('vi-VN')} đ`}
                          className="w-full bg-slate-200/50 text-purple-700 border border-slate-200 rounded-xl p-2.5 font-bold cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Tạo & Thêm vào lớp</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận bỏ học viên khỏi lớp */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Bỏ học sinh khỏi lớp học?
              </h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn bỏ học viên{' '}
                <strong className="text-slate-900">{studentToRemove.name}</strong> (Mã:{' '}
                <span className="font-mono text-purple-700 font-bold">{studentToRemove.code}</span>) khỏi{' '}
                <span className="font-bold text-slate-800">{classGroup.name}</span>?
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-[11px] text-amber-800 mt-3">
                💡 Học viên này sẽ chuyển về trạng thái <strong>Chưa xếp lớp</strong> và sĩ số lớp học sẽ tự động giảm đi 1.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setStudentToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRemove}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Xác nhận bỏ khỏi lớp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Teacher */}
      {isTeacherModalOpen && (
        <CreateTeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          onAddTeacher={(newTch) => {
            if (onAddTeacher) onAddTeacher(newTch);
            setTeacherName(newTch.name);
            setToastMessage(`Đã tạo giáo viên "${newTch.name}" thành công!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {/* Modal: Edit Class Details */}
      {isEditModalOpen && onUpdateClass && (
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          classGroup={classGroup}
          teachers={teachers}
          courses={courses}
          students={allStudents}
          onUpdateClass={(updated, modifiedSts, newPasted) => {
            onUpdateClass(updated, modifiedSts, newPasted);
            setToastMessage(`Đã cập nhật tên lớp "${updated.name}" & danh sách học viên thành công!`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {/* Modal: Course Term & Tuition Management */}
      {isTermHistoryModalOpen && onUpdateClass && (
        !canAccessCourseTuition ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Giới Hạn Quyền Truy Cập</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Phân hệ <strong>Quản Lý Khóa Học & Học Phí Học Sinh</strong> chỉ dành cho <strong>Quản lý trung tâm</strong> và <strong>Trợ lý</strong>. Tài khoản Giáo viên không có quyền truy cập hoặc chỉnh sửa học phí.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTermHistoryModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in duration-200 max-h-[92vh] flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Quản Lý Khóa Học & Học Phí Học Sinh
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                        🔒 Phân quyền: Quản lý & Trợ lý
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lớp: <span className="font-bold text-slate-700">{classGroup.name}</span> ({classGroup.code}) • Khóa: <span className="font-extrabold text-indigo-700">{classGroup.currentTermName || `Khóa ${classGroup.currentTerm || 1}`}</span> • Học phí khóa: <span className="font-bold text-emerald-700">{(classGroup.tuitionFee || 14500000).toLocaleString('vi-VN')} đ</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsTermHistoryModalOpen(false);
                    setIsUpgradingFormOpen(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTermModalTab('tuition_students')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTermModalTab === 'tuition_students'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Danh Sách Học Sinh & Quản Lý Học Phí</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTermModalTab === 'tuition_students' ? 'bg-purple-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {classStudents.length}
                </span>
                {overdueClassStudentsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    ⚠️ {overdueClassStudentsCount} quá hẹn
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTermModalTab('term_settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTermModalTab === 'term_settings'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Thiết Lập Khóa & Lên Khóa Mới</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTermModalTab('term_history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTermModalTab === 'term_history'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Lịch Sử Các Khóa Đã Học ({classGroup.termHistory?.length || 0})</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto space-y-6 pr-1 flex-1">
              
              {/* Tab 1: Danh Sách Học Sinh & Quản Lý Học Phí */}
              {activeTermModalTab === 'tuition_students' && (
                <CourseTuitionTable
                  courseName={classGroup.courseName || classGroup.name}
                  courseTuitionFee={classGroup.tuitionFee || 14500000}
                  students={allStudents}
                  classId={classGroup.id}
                  className={classGroup.name}
                  classes={classGroup ? [classGroup] : []}
                  onUpdateStudent={onUpdateStudent || (() => {})}
                  currentUser={currentUser}
                />
              )}

              {/* Tab 2: Thiết Lập Khóa & Lên Khóa Mới */}
              {activeTermModalTab === 'term_settings' && (
                <div className="space-y-6">
                  {/* Form 1: Edit Current Term */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-black text-slate-900">Thiết Lập Khóa Hiện Tại</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold italic">Thay đổi trực tiếp thông số khóa đang chạy</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số khóa (Phân loại):
                    </label>
                    <select
                      value={currentTermInput}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurrentTermInput(val);
                        if (currentTermNameInput === `Khóa ${currentTermInput}`) {
                          setCurrentTermNameInput(`Khóa ${val}`);
                        }
                      }}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <option key={num} value={num}>Khóa {num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tên hiển thị khóa (Có thể sửa):
                    </label>
                    <input
                      type="text"
                      value={currentTermNameInput}
                      onChange={(e) => setCurrentTermNameInput(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      placeholder="VD: Khóa 1 - IELTS Starter"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Học phí khóa này (VNĐ):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tuitionFeeInput}
                        onChange={(e) => setTuitionFeeInput(Number(e.target.value) || 0)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        placeholder="Ví dụ: 14500000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {tuitionFeeInput.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...classGroup,
                        currentTerm: currentTermInput,
                        currentTermName: currentTermNameInput,
                        tuitionFee: tuitionFeeInput,
                      };
                      onUpdateClass(updated);
                      setToastMessage(`Đã cập nhật ${currentTermNameInput} và học phí ${tuitionFeeInput.toLocaleString('vi-VN')} đ thành công!`);
                      setTimeout(() => setToastMessage(null), 3500);
                      setIsTermHistoryModalOpen(false);
                      setIsUpgradingFormOpen(false);
                    }}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi khóa hiện tại</span>
                  </button>
                </div>
              </div>

              {/* Form 2: Upgrade to New Term with old term archiving */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-black text-slate-900">Lên Khóa Học Mới cho Lớp</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUpgradingFormOpen(!isUpgradingFormOpen)}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    {isUpgradingFormOpen ? 'Ẩn biểu mẫu' : 'Mở biểu mẫu lên khóa'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tính năng này cho phép lớp học chuyển tiếp lên khóa học tiếp theo (ví dụ: <strong className="text-emerald-700">Khóa {classGroup.currentTerm || 1} → Khóa {(classGroup.currentTerm || 1) + 1}</strong>). Hệ thống sẽ tự động đóng gói toàn bộ thống kê của khóa cũ để lưu trữ vĩnh viễn trong cơ sở dữ liệu lịch sử và làm sạch tiến độ (reset về buổi 0) cho khóa mới.
                </p>

                {isUpgradingFormOpen && (
                  <div className="space-y-4 pt-2 border-t border-emerald-100 animate-in fade-in duration-200">
                    
                    {/* Archiving preview card */}
                    <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-850 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Dữ liệu sẽ được lưu trữ tự động vào Lịch sử:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-amber-800 mt-1 pl-4 font-medium">
                        <div>• Số khóa cũ: <strong>{classGroup.currentTermName || `Khóa ${classGroup.currentTerm || 1}`}</strong></div>
                        <div>• Sĩ số khi bế giảng: <strong>{classStudents.length} học viên</strong></div>
                        <div>• Học phí khóa cũ: <strong>{(classGroup.tuitionFee || 14500000).toLocaleString('vi-VN')} đ</strong></div>
                        <div>• Tiến độ kết thúc: <strong>{classGroup.completedSessions}/{classGroup.totalSessions || 36} buổi học</strong></div>
                        <div>• Thời gian: <strong>{formatDateVN(classGroup.startDate) || 'N/A'} ~ {formatDateVN(classGroup.endDate) || 'Hiện tại'}</strong></div>
                        <div>• Giáo viên phụ trách: <strong>{classGroup.teacherName}</strong></div>
                      </div>
                    </div>

                    {/* Inputs for next term */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tên khóa mới tiếp theo:
                        </label>
                        <input
                          type="text"
                          value={newTermName}
                          onChange={(e) => setNewTermName(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="VD: Khóa 2 - IELTS 4.5"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tinh chỉnh học phí Khóa mới (VNĐ): <span className="text-emerald-700">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={newTermTuition}
                            onChange={(e) => setNewTermTuition(Number(e.target.value) || 0)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Nhập học phí khóa mới"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            {newTermTuition.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tổng số buổi Khóa mới:
                        </label>
                        <input
                          type="number"
                          value={newTermTotalSessions}
                          onChange={(e) => setNewTermTotalSessions(Number(e.target.value) || 36)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày khai giảng khóa mới:
                        </label>
                        <input
                          type="date"
                          value={newTermStartDate}
                          onChange={(e) => setNewTermStartDate(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày dự kiến bế giảng:
                        </label>
                        <input
                          type="date"
                          value={newTermEndDate}
                          onChange={(e) => setNewTermEndDate(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* Action execution */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = `Xác nhận chuyển lớp sang khóa mới?\n\n- Khóa cũ (${classGroup.currentTermName || `Khóa ${classGroup.currentTerm || 1}`}) sẽ được đưa vào lịch sử.\n- Khóa mới (${newTermName}) sẽ bắt đầu với 0 buổi hoàn thành, học phí là ${newTermTuition.toLocaleString('vi-VN')}đ.`;
                          if (!window.confirm(confirmMsg)) return;

                          const prevTermEntry = {
                            term: classGroup.currentTerm || 1,
                            termName: classGroup.currentTermName || `Khóa ${classGroup.currentTerm || 1}`,
                            startDate: classGroup.startDate,
                            endDate: classGroup.endDate,
                            tuitionFee: classGroup.tuitionFee || 14500000,
                            completedSessions: classGroup.completedSessions,
                            totalSessions: classGroup.totalSessions,
                            teacherId: classGroup.teacherId,
                            teacherName: classGroup.teacherName,
                            studentCount: classStudents.length
                          };

                          const updated = {
                            ...classGroup,
                            currentTerm: (classGroup.currentTerm || 1) + 1,
                            currentTermName: newTermName,
                            tuitionFee: newTermTuition,
                            totalSessions: newTermTotalSessions,
                            completedSessions: 0, // Reset completed sessions for the new term
                            startDate: newTermStartDate,
                            endDate: newTermEndDate,
                            termHistory: [...(classGroup.termHistory || []), prevTermEntry]
                          };

                          onUpdateClass(updated);
                          setToastMessage(`🚀 Lớp ${classGroup.name} đã thăng lên ${newTermName} thành công! Khóa cũ đã được lưu trữ vĩnh viễn.`);
                          setTimeout(() => setToastMessage(null), 3500);
                          setIsTermHistoryModalOpen(false);
                          setIsUpgradingFormOpen(false);
                        }}
                        className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        <span>Xác nhận Nâng Khóa Mới & Lưu Lịch sử</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: History Archives List */}
          {activeTermModalTab === 'term_history' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-black text-slate-900">
                    Lịch Sử Các Khóa Đã Học ({classGroup.termHistory?.length || 0})
                  </h4>
                </div>

                {classGroup.termHistory && classGroup.termHistory.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Khóa</th>
                          <th className="py-2.5 px-3">Thời gian</th>
                          <th className="py-2.5 px-3">Học phí</th>
                          <th className="py-2.5 px-3">Buổi học</th>
                          <th className="py-2.5 px-3">Sĩ số</th>
                          <th className="py-2.5 px-3">Giáo viên</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {classGroup.termHistory.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-indigo-700">{item.termName || `Khóa ${item.term}`}</td>
                            <td className="py-2.5 px-3 text-slate-500">{formatDateVN(item.startDate)} → {formatDateVN(item.endDate) || 'N/A'}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{item.tuitionFee.toLocaleString('vi-VN')} đ</td>
                            <td className="py-2.5 px-3 text-slate-600 font-semibold">{item.completedSessions}/{item.totalSessions} buổi</td>
                            <td className="py-2.5 px-3 text-slate-800 font-bold">{item.studentCount} HV</td>
                            <td className="py-2.5 px-3 text-slate-600 font-semibold">{item.teacherName || 'Chưa phân công'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2 bg-slate-50/30">
                    <History className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Chưa có lịch sử khóa cũ</p>
                    <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Lớp này chưa bế giảng khóa nào. Khi bạn nhấp vào <strong className="text-emerald-700">Lên khóa học mới</strong>, hệ thống sẽ tự động lưu lại toàn bộ kết quả khóa cũ vào đây.
                    </p>
                  </div>
                )}
              </div>
            )}

            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsTermHistoryModalOpen(false);
                  setIsUpgradingFormOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      ))}

      {/* MODAL: XEM TOÀN BỘ DANH SÁCH HỌC VIÊN LỚP (NGẮN GỌN: STT, TÊN, NGÀY SINH, GMAIL, SĐT) */}
      {isFullRosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Danh Sách Toàn Bộ Học Viên - {classGroup.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      {classGroup.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khóa học: <strong className="text-slate-700">{classGroup.courseName}</strong> • Sĩ số: <strong className="text-purple-700">{classStudents.length} học viên</strong> • Lịch học: {classGroup.schedule}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFullRosterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Bar & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, ngày sinh, gmail, SĐT..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyFullRoster}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs"
                  title="Sao chép toàn bộ bảng danh sách để dán vào Excel / Zalo"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép bảng</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                  title="Tải file Excel / CSV về máy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In danh sách</span>
                </button>
              </div>
            </div>

            {/* Full Roster Concise Table */}
            <div className="overflow-auto border border-slate-200 rounded-2xl flex-1 max-h-[550px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-purple-50/90 backdrop-blur-xs text-purple-950 font-extrabold border-b border-purple-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 min-w-[160px]">Họ và tên</th>
                    <th className="py-3 px-3 min-w-[110px]">Ngày sinh</th>
                    <th className="py-3 px-3 min-w-[200px]">Gmail</th>
                    <th className="py-3 px-3 min-w-[140px]">Phụ huynh</th>
                    <th className="py-3 px-3 w-28 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classStudents
                    .filter((st) => {
                      const q = rosterSearch.toLowerCase();
                      return (
                        st.name.toLowerCase().includes(q) ||
                        st.code.toLowerCase().includes(q) ||
                        (st.email && st.email.toLowerCase().includes(q)) ||
                        (st.dob && st.dob.includes(q)) ||
                        (st.parentName && st.parentName.toLowerCase().includes(q))
                      );
                    })
                    .map((st, idx) => {
                      const cleanEmail =
                        st.email ||
                        `${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

                      return (
                        <tr key={st.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{st.name}</div>
                            <div className="text-[10px] text-purple-700 font-mono font-semibold">
                              {st.code}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {formatDateVN(st.dob) || 'Chưa cập nhật'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-purple-900 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-purple-100">
                              {cleanEmail}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            <div className="font-semibold text-slate-800">{st.parentName || 'Chưa cập nhật'}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                st.tuitionStatus === 'Đã đóng đủ'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                  {classStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Lớp học hiện tại chưa có học viên nào. Hãy thêm học sinh vào lớp!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs shrink-0">
              <span className="text-slate-500 font-medium">
                Tổng cộng: <strong className="text-slate-900">{classStudents.length} học viên</strong> trong danh sách chính thức
              </span>

              <button
                type="button"
                onClick={() => setIsFullRosterModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG KÝ HỌC SINH CHỜ CHUẨN BỊ VÀO KHÓA SAU */}
      {isAddWaitingStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-amber-200 p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Đăng Ký Học Sinh Chờ Khóa Sau
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lớp: {classGroup.name} ({classGroup.courseName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWaitingStudentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWaitingStudent} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Họ và tên học viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn Hoàng"
                  value={newWaitingForm.name}
                  onChange={(e) => setNewWaitingForm({ ...newWaitingForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gmail / Email</label>
                  <input
                    type="email"
                    placeholder="VD: hoang@gmail.com"
                    value={newWaitingForm.email}
                    onChange={(e) => setNewWaitingForm({ ...newWaitingForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày sinh (DOB)</label>
                  <input
                    type="date"
                    value={newWaitingForm.dob}
                    onChange={(e) => setNewWaitingForm({ ...newWaitingForm, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại HV</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={newWaitingForm.phone}
                    onChange={(e) => setNewWaitingForm({ ...newWaitingForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên Phụ huynh</label>
                  <input
                    type="text"
                    placeholder="VD: Anh Tuấn (Bố)"
                    value={newWaitingForm.parentName}
                    onChange={(e) => setNewWaitingForm({ ...newWaitingForm, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú / Nguyện vọng chờ khóa sau</label>
                <input
                  type="text"
                  placeholder="VD: Đăng ký giữ chỗ khóa mới tháng sau, học sinh đang bận thi ở trường..."
                  value={newWaitingForm.waitingNote}
                  onChange={(e) => setNewWaitingForm({ ...newWaitingForm, waitingNote: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddWaitingStudentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lưu Vào Danh Sách Chờ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH ĐỀ MỤC BTVN */}
      <HomeworkConfigModal
        isOpen={isHwConfigModalOpen}
        onClose={() => setIsHwConfigModalOpen(false)}
        currentItems={homeworkItems}
        onSave={handleSaveHomeworkItems}
      />

      {/* MODAL TOÀN BỘ LỊCH TRÌNH 32-33 BUỔI */}
      <ClassFullScheduleModal
        isOpen={isFullScheduleModalOpen}
        onClose={() => setIsFullScheduleModalOpen(false)}
        classGroup={classGroup}
      />

      {/* MODAL: Xác nhận xóa lớp học (Dành riêng cho Quản lý) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa lớp học</h3>
                <p className="text-xs text-rose-600 font-semibold">Quyền hạn: Quản lý trung tâm (Admin)</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa lớp <strong className="text-slate-900">{classGroup.name}</strong> không? Toàn bộ dữ liệu lớp học này sẽ bị xóa khỏi hệ thống và không thể hoàn tác.
            </p>

            <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5 mb-5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã lớp:</span>
                <span className="font-semibold text-slate-800">{classGroup.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khóa học:</span>
                <span className="font-semibold text-purple-700">{classGroup.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cơ sở:</span>
                <span className="font-semibold text-slate-800">{classGroup.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giáo viên:</span>
                <span className="font-semibold text-slate-800">{classGroup.teacherName || 'Chưa gán'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số học viên hiện tại:</span>
                <span className="font-bold text-slate-900">{classGroup.currentStudents || 0} học viên</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingClass}
                onClick={async () => {
                  if (!onDeleteClass) return;
                  setIsDeletingClass(true);
                  try {
                    await onDeleteClass(classGroup.id);
                    onBack();
                  } finally {
                    setIsDeletingClass(false);
                    setIsDeleteModalOpen(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingClass ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
