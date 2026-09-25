import React, { useState } from 'react';
import {
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bell,
  MessageSquare,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Send,
  HelpCircle,
  ExternalLink,
  Phone,
  User,
  X,
  FileText,
  Heart,
  Smile,
  CalendarDays,
  Layers,
  Settings2,
  Zap,
  Play,
  ListOrdered,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { Student, ClassGroup, AuthUser, AttendanceRecord } from '../../types';
import {
  detectCourseLevel,
  calculateCourseSchedule,
  calculateProRatedTuition,
  countSessionsBetweenDates,
} from '../../utils/courseSchedule';

export interface CourseTuitionTableProps {
  courseName: string;
  courseTuitionFee: number; // Học phí gốc theo thiết lập của khóa
  students: Student[];
  onUpdateStudent: (updatedStudent: Student) => void;
  onUpdateStudentBatch?: (updatedStudents: Student[]) => void;
  className?: string; // Tên lớp lọc (nếu xem trong chi tiết lớp)
  classId?: string;
  classes?: ClassGroup[];
  currentUser?: AuthUser;
  attendanceRecords?: AttendanceRecord[];
}

export const CourseTuitionTable: React.FC<CourseTuitionTableProps> = ({
  courseName,
  courseTuitionFee = 5000000,
  students,
  onUpdateStudent,
  onUpdateStudentBatch,
  className,
  classId,
  classes = [],
  currentUser,
  attendanceRecords = [],
}) => {
  const isVuNgoc = currentUser?.email?.toLowerCase() === 'vungoc23122002@gmail.com';
  const canAccessTuition = !currentUser || currentUser.role === 'admin' || currentUser.role === 'assistant' || isVuNgoc;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [filterTuitionStatus, setFilterTuitionStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'external' | 'internal'>('all');
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Zalo Tuition Modal State
  const [selectedStudentForZaloModal, setSelectedStudentForZaloModal] = useState<Student | null>(null);
  const [zaloTargetRecipient, setZaloTargetRecipient] = useState<'parent' | 'student'>('parent');
  const [zaloToneMode, setZaloToneMode] = useState<'gentle' | 'formal'>('gentle');
  const [customZaloMessage, setCustomZaloMessage] = useState<string>('');
  const [editParentPhoneInput, setEditParentPhoneInput] = useState<string>('');
  const [editParentNameInput, setEditParentNameInput] = useState<string>('');
  const [editStudentPhoneInput, setEditStudentPhoneInput] = useState<string>('');
  const [autoRecordReminderOnZalo, setAutoRecordReminderOnZalo] = useState<boolean>(true);

  // Batch Deadline Setup Modal
  const [isBatchDeadlineModalOpen, setIsBatchDeadlineModalOpen] = useState(false);
  const [batchDeadlineDate, setBatchDeadlineDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [batchDeadlineScope, setBatchDeadlineScope] = useState<'unpaid' | 'all'>('unpaid');

  // Automated Gentle Overdue Reminder Modal
  const [isAutoOverdueModalOpen, setIsAutoOverdueModalOpen] = useState(false);
  const [autoOverdueQueueIndex, setAutoOverdueQueueIndex] = useState(0);
  const [autoOverdueSentMap, setAutoOverdueSentMap] = useState<Record<string, boolean>>({});
  const [autoOverdueTarget, setAutoOverdueTarget] = useState<'parent' | 'student'>('parent');

  // Format currency VNĐ
  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Format date display
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper: check overdue status
  // Hỗ trợ cả Hẹn nộp muộn (tuitionPromiseDate) và Hạn nộp quy định (tuitionDeadlineDate)
  // "qua ngày hẹn / hạn 1 ngày sẽ hiện thông báo nhắc đóng"
  const checkOverdueStatus = (
    promiseDateStr?: string,
    deadlineDateStr?: string,
    paidDateStr?: string,
    tuitionStatus?: string
  ) => {
    // Nếu đã đóng đủ hoặc có ngày đóng thì không coi là quá hạn
    if (tuitionStatus === 'Đã đóng đủ' || (paidDateStr && paidDateStr.trim().length > 0)) {
      return { isOverdue: false, daysOverdue: 0, statusText: 'Đã hoàn tất', sourceLabel: 'hạn nộp', isPromise: false };
    }

    // Ưu tiên ngày hẹn xin nộp muộn (nếu có), nếu không thì tính theo hạn nộp quy định
    const targetDateStr = promiseDateStr || deadlineDateStr;
    const isPromise = Boolean(promiseDateStr);
    const sourceLabel = isPromise ? 'ngày hẹn' : 'hạn nộp';

    if (!targetDateStr) {
      return { isOverdue: false, daysOverdue: 0, statusText: 'Chưa có hạn', sourceLabel, isPromise: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = targetDateStr.split('-');
    if (parts.length !== 3) {
      return { isOverdue: false, daysOverdue: 0, statusText: '', sourceLabel, isPromise };
    }

    const targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Qua ngày hẹn/hạn 1 ngày trở lên (diffDays >= 1)
    if (diffDays >= 1) {
      return {
        isOverdue: true,
        daysOverdue: diffDays,
        targetDateStr,
        sourceLabel,
        isPromise,
        statusText: `Quá ${sourceLabel} ${diffDays} ngày`,
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        daysOverdue: 0,
        targetDateStr,
        sourceLabel,
        isPromise,
        isDueToday: true,
        statusText: `Hôm nay đến ${sourceLabel}`,
      };
    } else {
      return {
        isOverdue: false,
        daysOverdue: 0,
        targetDateStr,
        sourceLabel,
        isPromise,
        daysLeft: Math.abs(diffDays),
        statusText: `Còn ${Math.abs(diffDays)} ngày đến ${sourceLabel}`,
      };
    }
  };

  // Detect Course 4
  const isCourse4 =
    detectCourseLevel(courseName || className || '', 32) === 'Khóa 4' ||
    courseName?.toLowerCase().includes('khóa 4') ||
    courseName?.toLowerCase().includes('drill') ||
    Boolean(className?.toLowerCase().includes('khóa 4')) ||
    Boolean(className?.toLowerCase().includes('drill')) ||
    classes.some(
      (c) =>
        (c.id === classId || c.name === className) &&
        detectCourseLevel(c.name || c.courseName || '', c.totalSessions) === 'Khóa 4'
    );

  // Helper: compute tuition for a student
  // Học phí với học viên vào sau 4 buổi trở lên thì sẽ tự động trừ 100,000 mỗi buổi (Khóa 1-3)
  // Hỗ trợ logic Khóa 4 (Drill) & Học sinh ngoài: Cho phép nhập học phí tùy chỉnh khác mặc định
  const calculateStudentTuition = (
    baseFee: number,
    lateSessions: number = 0,
    student?: Student,
    classesList: ClassGroup[] = []
  ) => {
    // Check if this student belongs to Course 4 or is an external student
    const isStudentK4 = (student && (
      student.className?.toLowerCase().includes('khóa 4') ||
      student.className?.toLowerCase().includes('drill') ||
      student.courseName?.toLowerCase().includes('khóa 4') ||
      student.courseName?.toLowerCase().includes('drill') ||
      detectCourseLevel(student.className || student.courseName || '', 32) === 'Khóa 4'
    )) || isCourse4;

    // Logic cho Khóa 4 & Học sinh ngoài: học phí theo mức nhập thực tế, không tự động trừ lũy kế như K1-3
    if (isStudentK4 || student?.isExternalStudent || student?.studentCategory === 'Học sinh ngoài') {
      return {
        baseFee,
        lateSessions,
        isDeductible: false,
        discountAmount: 0,
        finalFee: baseFee, 
      };
    }

    // Logic cho Khóa 1, 2, 3: vào sau buổi 3 (lateSessions >= 3) thì được trừ 100k/buổi
    const isDeductible = lateSessions >= 3;
    const discountAmount = isDeductible ? lateSessions * 100000 : 0;
    const finalFee = Math.max(0, baseFee - discountAmount);
    return {
      baseFee,
      lateSessions,
      isDeductible,
      discountAmount,
      finalFee,
    };
  };

  // Helper: compute Khóa 4 progress and auto-calculate end date & tuition reminders
  const getStudentK4ProgressInfo = (st: Student) => {
    const isStudentK4 =
      st.className?.toLowerCase().includes('khóa 4') ||
      st.className?.toLowerCase().includes('drill') ||
      st.courseName?.toLowerCase().includes('khóa 4') ||
      st.courseName?.toLowerCase().includes('drill') ||
      detectCourseLevel(st.className || st.courseName || '', 32) === 'Khóa 4' ||
      st.isExternalStudent ||
      st.studentCategory === 'Học sinh ngoài' ||
      isCourse4;

    if (!isStudentK4) {
      return { isK4: false };
    }

    // Filter attendance records specifically for this student in their active class
    const studentAttendance = attendanceRecords.filter(
      (r) => r.studentId === st.id && r.classId === st.classId
    );
    const attendedCount = studentAttendance.length;

    // Find class schedule details
    const studentClass = classes.find((c) => c.id === st.classId);
    const scheduleStr = studentClass?.schedule || 'Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)';
    const offDates = studentClass?.offDates || [];
    const startDate = st.startDate || st.joinDate || studentClass?.startDate || new Date().toISOString().split('T')[0];

    // Determine current cycle (each cycle of K4 is 32 sessions)
    const currentCycle = Math.floor(attendedCount / 32) + 1;
    const sessionsThisCycle = attendedCount % 32;
    const nextCycleSessions = currentCycle * 32;

    // Calculate personal end date for the CURRENT cycle
    const currentCycleSchedule = calculateCourseSchedule(
      startDate,
      scheduleStr,
      nextCycleSessions,
      offDates,
      'Khóa 4'
    );
    const personalEndDate =
      currentCycleSchedule.sessions[currentCycleSchedule.sessions.length - 1]?.date || '';

    // Calculate previous cycle end date (if any)
    let previousCycleEndDate = '';
    if (currentCycle > 1) {
      const prevCycleSchedule = calculateCourseSchedule(
        startDate,
        scheduleStr,
        (currentCycle - 1) * 32,
        offDates,
        'Khóa 4'
      );
      previousCycleEndDate =
        prevCycleSchedule.sessions[prevCycleSchedule.sessions.length - 1]?.date || '';
    }

    // Determine if student has paid for the current cycle
    const isUnpaidForCurrentCycle =
      currentCycle > 1 &&
      (!st.tuitionPaidDate || (previousCycleEndDate && st.tuitionPaidDate < previousCycleEndDate));

    const isApproachingCycleEnd = sessionsThisCycle >= 28;

    let reminderMessage = '';
    let needsReminder = false;

    if (isUnpaidForCurrentCycle) {
      needsReminder = true;
      reminderMessage = `⚠️ NỢ PHÍ CHU KỲ ${currentCycle}: Đã học sang buổi ${sessionsThisCycle + 32 * (currentCycle - 1)} nhưng chưa nộp tiền đợt mới!`;
    } else if (isApproachingCycleEnd) {
      needsReminder = true;
      reminderMessage = `🔔 SẮP HẾT KHÓA: Đã học ${sessionsThisCycle}/32 buổi của Chu kỳ ${currentCycle}. Nhắc đóng học phí cho chu kỳ tiếp theo!`;
    }

    return {
      isK4: true,
      attendedCount,
      currentCycle,
      sessionsThisCycle,
      totalSessionsForCycle: nextCycleSessions,
      personalEndDate,
      previousCycleEndDate,
      isUnpaidForCurrentCycle,
      isApproachingCycleEnd,
      needsReminder,
      reminderMessage,
    };
  };

  // Filter students based on class / course and search query
  const relevantStudents = students.filter((st) => {
    // If a classId was passed, match classId
    if (classId && st.classId !== classId) return false;
    // Otherwise, match course name
    if (!classId && courseName && st.courseName !== courseName && st.className && !st.className.includes(courseName)) {
      // If courseName is specific, filter by courseName or className
      const matchCourse = st.courseName?.toLowerCase().includes(courseName.toLowerCase()) ||
                          st.className?.toLowerCase().includes(courseName.toLowerCase());
      if (!matchCourse) return false;
    }
    return true;
  });

  // Count external students
  const totalExternalCount = relevantStudents.filter(
    (s) => s.isExternalStudent || s.studentCategory === 'Học sinh ngoài'
  ).length;

  // Calculate overdue count (supports both promiseDate and deadlineDate)
  const overdueStudents = relevantStudents.filter((st) => {
    const overdue = checkOverdueStatus(st.tuitionPromiseDate, st.tuitionDeadlineDate, st.tuitionPaidDate, st.tuitionStatus);
    return overdue.isOverdue;
  });

  // Filter with search & controls
  const displayedStudents = relevantStudents.filter((st) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.phone.includes(searchTerm) ||
      (st.parentPhone && st.parentPhone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filterOverdueOnly) {
      const overdue = checkOverdueStatus(st.tuitionPromiseDate, st.tuitionDeadlineDate, st.tuitionPaidDate, st.tuitionStatus);
      if (!overdue.isOverdue) return false;
    }

    if (filterTuitionStatus !== 'all') {
      if (filterTuitionStatus === 'paid' && st.tuitionStatus !== 'Đã đóng đủ') return false;
      if (filterTuitionStatus === 'debt' && st.tuitionStatus !== 'Còn nợ') return false;
      if (filterTuitionStatus === 'unpaid' && st.tuitionStatus !== 'Chưa đóng') return false;
    }

    if (filterCategory === 'external') {
      if (!st.isExternalStudent && st.studentCategory !== 'Học sinh ngoài') return false;
    } else if (filterCategory === 'internal') {
      if (st.isExternalStudent || st.studentCategory === 'Học sinh ngoài') return false;
    }

    return true;
  });

  // Handler for student tuition updates
  const handleStudentFieldChange = (
    student: Student,
    updates: Partial<Student>
  ) => {
    let effectiveBaseFee =
      updates.customTuitionFee ??
      updates.courseTuitionFee ??
      student.customTuitionFee ??
      student.courseTuitionFee ??
      courseTuitionFee;
    const effectiveLateSessions = updates.joinedLateSessions ?? student.joinedLateSessions ?? 0;
    const { discountAmount, finalFee } = calculateStudentTuition(effectiveBaseFee, effectiveLateSessions, student, classes);

    const updated: Student = {
      ...student,
      ...updates,
      customTuitionFee: effectiveBaseFee,
      courseTuitionFee: effectiveBaseFee,
      joinedLateSessions: effectiveLateSessions,
      tuitionDiscountLate: discountAmount,
      tuitionPayable: finalFee,
    };

    // When endDate, startDate, or joinDate is modified: automatically calculate sessions & apply pro-rated tuition
    if (updates.endDate !== undefined || updates.startDate !== undefined || updates.joinDate !== undefined) {
      const finalStart = updates.startDate ?? updates.joinDate ?? student.startDate ?? student.joinDate ?? '';
      const finalEnd = updates.endDate ?? student.endDate ?? '';

      if (finalStart && finalEnd) {
        const studentClass = classes.find((c) => c.id === student.classId);
        const scheduleStr = studentClass?.schedule || '';
        const offDays = studentClass?.offDates || [];
        const counted = countSessionsBetweenDates(finalStart, finalEnd, scheduleStr, offDays);
        const actualSessions = Math.max(1, Math.min(32, counted));
        const standardFee = (studentClass?.tuitionFee && studentClass.tuitionFee > 0) ? studentClass.tuitionFee : (courseTuitionFee || 14500000);
        const feeBasis = (student.customTuitionFee && student.customTuitionFee !== standardFee && !student.registeredSessions)
          ? student.customTuitionFee
          : standardFee;

        const debt = updates.previousDebt ?? updates.carriedOverDebt ?? student.previousDebt ?? student.carriedOverDebt ?? 0;
        const calc = calculateProRatedTuition(feeBasis, actualSessions, debt, 32);

        updated.registeredSessions = actualSessions;
        updated.earlyEndSessions = actualSessions;
        updated.customTuitionFee = calc.proRatedTuition;
        updated.courseTuitionFee = calc.proRatedTuition;
        updated.proRatedTuitionFee = calc.proRatedTuition;
        updated.tuitionPayable = calc.totalDue;
        if (student.tuitionStatus !== 'Đã đóng đủ' && !updates.tuitionPaidDate && !student.tuitionPaidDate) {
          updated.balanceOwed = calc.totalDue;
        }
      }
    }

    // When registeredSessions or earlyEndSessions is updated directly
    if (updates.registeredSessions !== undefined || updates.earlyEndSessions !== undefined) {
      const sessions = Math.max(1, Math.min(32, (updates.registeredSessions ?? updates.earlyEndSessions) || 32));
      const studentClass = classes.find((c) => c.id === student.classId);
      const standardFee = (studentClass?.tuitionFee && studentClass.tuitionFee > 0) ? studentClass.tuitionFee : (courseTuitionFee || 14500000);
      const debt = updates.previousDebt ?? updates.carriedOverDebt ?? student.previousDebt ?? student.carriedOverDebt ?? 0;
      const calc = calculateProRatedTuition(standardFee, sessions, debt, 32);

      updated.registeredSessions = sessions;
      updated.earlyEndSessions = sessions;
      updated.customTuitionFee = calc.proRatedTuition;
      updated.courseTuitionFee = calc.proRatedTuition;
      updated.proRatedTuitionFee = calc.proRatedTuition;
      updated.tuitionPayable = calc.totalDue;
      if (student.tuitionStatus !== 'Đã đóng đủ' && !updates.tuitionPaidDate && !student.tuitionPaidDate) {
        updated.balanceOwed = calc.totalDue;
      }
    }

    // When previousDebt is updated
    if (updates.previousDebt !== undefined || updates.carriedOverDebt !== undefined) {
      const debt = Math.max(0, (updates.previousDebt ?? updates.carriedOverDebt) || 0);
      const sessions = updated.registeredSessions ?? updated.earlyEndSessions ?? 32;
      const currentFee = updated.customTuitionFee ?? courseTuitionFee;
      const calc = calculateProRatedTuition(currentFee, sessions, debt, 32);
      updated.previousDebt = debt;
      updated.carriedOverDebt = debt;
      updated.tuitionPayable = calc.totalDue;
      if (student.tuitionStatus !== 'Đã đóng đủ' && !updates.tuitionPaidDate && !student.tuitionPaidDate) {
        updated.balanceOwed = calc.totalDue;
      }
    }

    if (updates.isExternalStudent !== undefined) {
      updated.isExternalStudent = updates.isExternalStudent;
      updated.studentCategory = updates.isExternalStudent ? 'Học sinh ngoài' : 'Thường';
    }

    // If paid date is set, automatically update tuition status if not already paid
    if (updates.tuitionPaidDate && updates.tuitionPaidDate.trim().length > 0) {
      if (!updates.tuitionStatus) {
        updated.tuitionStatus = 'Đã đóng đủ';
        updated.balanceOwed = 0;
      }
    }

    onUpdateStudent(updated);
    setSaveToast(`Đã cập nhật học phí học viên ${student.name}!`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Quick preset for reminder
  const handleAddReminder = (student: Student, count: number) => {
    const todayStr = formatDateDisplay(new Date().toISOString().split('T')[0]);
    const prevNote = student.tuitionReminderNote || '';
    const newCount = count;
    const reminderPrefix = `Đã nhắc lần ${newCount} (${todayStr})`;
    const updatedNote = prevNote ? `${prevNote} • ${reminderPrefix}` : reminderPrefix;

    handleStudentFieldChange(student, {
      tuitionReminderCount: newCount,
      tuitionReminderNote: updatedNote,
    });
  };

  // Clean phone number for Zalo
  const getCleanPhone = (phoneStr?: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/\D/g, '');
  };

  // Generate full professional or gentle Zalo message for tuition collection / reminder
  const generateZaloTuitionMessage = (
    student: Student,
    mode: 'gentle' | 'formal' = 'gentle',
    targetRecipient: 'parent' | 'student' = 'parent'
  ) => {
    const effectiveBaseFee = student.customTuitionFee || student.courseTuitionFee || courseTuitionFee;
    const effectiveLateSessions = student.joinedLateSessions || 0;
    const { discountAmount, finalFee, isDeductible } = calculateStudentTuition(effectiveBaseFee, effectiveLateSessions, student, classes);
    const overdue = checkOverdueStatus(student.tuitionPromiseDate, student.tuitionDeadlineDate, student.tuitionPaidDate, student.tuitionStatus);

    const studentClass = classes.find((c) => c.id === student.classId);
    const countedSessions = (student.startDate || student.joinDate) && student.endDate
      ? countSessionsBetweenDates(student.startDate || student.joinDate || '', student.endDate, studentClass?.schedule || '', studentClass?.offDates || [])
      : 32;
    const effectiveSessions = typeof student.registeredSessions === 'number'
      ? student.registeredSessions
      : (typeof student.earlyEndSessions === 'number'
          ? student.earlyEndSessions
          : (countedSessions < 32 ? countedSessions : 32));

    const standardClassFee = studentClass?.tuitionFee && studentClass.tuitionFee > 0 ? studentClass.tuitionFee : (courseTuitionFee || 14500000);
    const proRatedCalc = calculateProRatedTuition(
      standardClassFee,
      effectiveSessions,
      student.previousDebt || student.carriedOverDebt || 0,
      32
    );

    const isGentle = mode === 'gentle';
    const isParent = targetRecipient === 'parent';

    if (isGentle) {
      // Tin nhắn nhắc nhở phụ huynh nộp nhẹ nhàng, lịch sự, ân cần
      const parentSalutation = isParent
        ? (student.parentName ? `Dạ em kính chào Quý Phụ huynh em ${student.name} (PH: ${student.parentName}) ạ,` : `Dạ em kính chào Quý Phụ huynh em ${student.name} ạ,`)
        : `Dạ em chào học viên ${student.name} (${student.code}) thân mến,`;

      let msg = `[IELTS DƯƠNG VŨ - NHẮC HỌC PHÍ NHẸ NHÀNG 🌸]\n\n`;
      msg += `${parentSalutation}\n\n`;
      msg += `Lời đầu tiên, IELTS DƯƠNG VŨ xin gửi lời chúc sức khỏe, an khang và niềm vui đến Quý gia đình.\n`;
      msg += `Em xin phép gửi thông báo nhẹ nhàng về khoản học phí khóa học của em ${student.name} để ${isParent ? 'ba mẹ' : 'em'} tiện theo dõi và sắp xếp ạ:\n\n`;
      msg += `📚 THÔNG TIN KHÓA HỌC:\n`;
      msg += `• Họ và tên học viên: ${student.name} (Mã: ${student.code})\n`;
      msg += `• Lớp học: ${student.className || className || 'Lớp học'}\n`;
      msg += `• Khóa học: ${courseName || student.courseName || 'Khóa học IELTS'}\n\n`;
      msg += `💰 CHI TIẾT HỌC PHÍ CẦN HOÀN TẤT:\n`;
      msg += `• Học phí chuẩn của khóa (32 buổi): ${effectiveBaseFee.toLocaleString('vi-VN')} đ\n`;

      if (proRatedCalc.isEarlyEnd) {
        msg += `• Học phí theo số buổi (${proRatedCalc.actualSessions} buổi < 32 buổi): ${proRatedCalc.proRatedTuition.toLocaleString('vi-VN')} đ (Đơn giá TB ${proRatedCalc.perSessionRate.toLocaleString('vi-VN')} đ/buổi)\n`;
      }

      if (isDeductible && effectiveLateSessions >= 4) {
        msg += `• Học viên vào sau ${effectiveLateSessions} buổi: đã áp dụng hỗ trợ giảm trừ -${discountAmount.toLocaleString('vi-VN')} đ (-100.000 đ/buổi)\n`;
      }

      if (proRatedCalc.previousDebt > 0) {
        msg += `• Nợ học phí khóa trước cộng dồn: +${proRatedCalc.previousDebt.toLocaleString('vi-VN')} đ\n`;
      }

      const displayFinalFee = proRatedCalc.isEarlyEnd
        ? (proRatedCalc.proRatedTuition + proRatedCalc.previousDebt)
        : (finalFee + proRatedCalc.previousDebt);

      msg += `👉 TỔNG HỌC PHÍ CẦN ĐÓNG: ${displayFinalFee.toLocaleString('vi-VN')} đ\n`;

      const targetDeadlineStr = student.tuitionPromiseDate || student.tuitionDeadlineDate;
      if (targetDeadlineStr) {
        msg += `• Hạn nộp theo ${overdue.sourceLabel}: ${formatDateDisplay(targetDeadlineStr)}`;
        if (overdue.isOverdue) {
          msg += ` (Dạ hiện đã qua ${overdue.sourceLabel} ${overdue.daysOverdue} ngày ạ)`;
        }
        msg += `\n`;
      }

      msg += `\nDạ vì công việc hàng ngày của Quý Phụ huynh rất bận rộn nên có thể chưa kịp sắp xếp hoàn tất học phí. Trung tâm xin phép nhắn gửi nhẹ nhàng để ${isParent ? 'ba mẹ' : 'em'} nhớ và thuận tiện chuyển khoản trong 1 - 2 ngày tới, giúp em ${student.name} tiếp tục học tập xuyên suốt và đảm bảo đầy đủ giáo trình, quyền lợi tại trung tâm ạ.\n\n`;

      msg += `💳 THÔNG TIN CHUYỂN KHOẢN HỌC PHÍ (STK CÔNG TY):\n`;
      msg += `• Ngân hàng: MB Bank (Ngân hàng Quân Đội)\n`;
      msg += `• Số tài khoản: 0988889999\n`;
      msg += `• Chủ tài khoản: IELTS DUONG VU\n`;
      msg += `• Cú pháp: HP ${student.code} ${student.name.toUpperCase()}\n\n`;
      msg += `⚠️ LƯU Ý: Học phí vui lòng gửi vào STK Công ty bên trên. Nếu có các khoản nộp phạt buổi học, Quý Phụ huynh vui lòng chuyển khoản riêng vào STK cá nhân của trợ lý Đặng Kim Anh (Techcombank: 174293666666) theo thông báo điểm buổi học ạ.\n\n`;

      msg += `Nếu Quý Phụ huynh đã chuyển khoản rồi, xin hoan hỉ bỏ qua tin nhắn này và chụp gửi lại biên lai qua Zalo để bên em cập nhật hệ thống ngay ạ.\n\n`;
      msg += `Em xin chân thành cảm ơn sự đồng hành và thấu hiểu của Quý Phụ huynh! Chúc Quý gia đình một ngày làm việc thật vui vẻ và an lành! 🌿`;

      return msg;
    }

    // Formal Standard Mode
    const parentSalutation = isParent
      ? (student.parentName ? `Kính gửi Quý Phụ huynh em ${student.name} (PH: ${student.parentName})` : `Kính gửi Quý Phụ huynh em ${student.name}`)
      : `Thông báo học phí tới học viên ${student.name} (${student.code})`;

    let msg = `[IELTS DƯƠNG VŨ - THÔNG BÁO HỌC PHÍ]\n\n`;
    msg += `${parentSalutation}\n`;
    msg += `• Mã học viên: ${student.code}\n`;
    msg += `• Lớp học: ${student.className || className || 'Lớp học'}\n`;
    msg += `• Khóa học: ${courseName || student.courseName || 'Khóa học IELTS'}\n\n`;
    msg += `THÔNG TIN HỌC PHÍ CẦN NỘP:\n`;
    msg += `• Học phí gốc khóa học (32 buổi): ${effectiveBaseFee.toLocaleString('vi-VN')} đ\n`;

    if (proRatedCalc.isEarlyEnd) {
      msg += `• Học phí theo số buổi thực tế (${proRatedCalc.actualSessions} buổi < 32 buổi): ${proRatedCalc.proRatedTuition.toLocaleString('vi-VN')} đ (Đơn giá TB ${proRatedCalc.perSessionRate.toLocaleString('vi-VN')} đ/buổi)\n`;
    }

    if (isDeductible && effectiveLateSessions >= 4) {
      msg += `• Học viên vào sau: ${effectiveLateSessions} buổi\n`;
      msg += `• Mức hỗ trợ giảm trừ: -${discountAmount.toLocaleString('vi-VN')} đ (-100.000 đ/buổi)\n`;
    }

    if (proRatedCalc.previousDebt > 0) {
      msg += `• Nợ học phí khóa trước / chu kỳ trước cộng dồn: +${proRatedCalc.previousDebt.toLocaleString('vi-VN')} đ\n`;
    }

    const displayFinalFeeFormal = proRatedCalc.isEarlyEnd
      ? (proRatedCalc.proRatedTuition + proRatedCalc.previousDebt)
      : (finalFee + proRatedCalc.previousDebt);

    msg += `👉 TỔNG HỌC PHÍ PHẢI ĐÓNG: ${displayFinalFeeFormal.toLocaleString('vi-VN')} đ\n`;
    msg += `• Trạng thái: ${student.tuitionStatus || 'Chưa hoàn tất'}\n`;

    const dDate = student.tuitionPromiseDate || student.tuitionDeadlineDate;
    if (dDate) {
      msg += `• Hạn nộp theo ${overdue.sourceLabel}: ${formatDateDisplay(dDate)}\n`;
      if (overdue.isOverdue) {
        msg += `⚠️ LƯU Ý: Đã quá hạn ${overdue.daysOverdue} ngày. Kính mong Quý Phụ huynh sớm hoàn tất học phí để không gián đoạn việc học của em ạ.\n`;
      }
    }

    msg += `\nTHÔNG TIN TÀI KHOẢN HỌC PHÍ (STK CÔNG TY):\n`;
    msg += `• Ngân hàng: MB Bank (Ngân hàng Quân Đội)\n`;
    msg += `• Số tài khoản: 0988889999\n`;
    msg += `• Chủ tài khoản: IELTS DUONG VU\n`;
    msg += `• Cú pháp: HP ${student.code} ${student.name.toUpperCase()} ${student.className || ''}\n`;
    msg += `• Ghi chú: Học phí chuyển khoản vào STK Công ty bên trên. Tiền nộp phạt buổi học (nếu có) chuyển khoản vào STK cá nhân trợ lý Đặng Kim Anh (Techcombank: 174293666666).\n\n`;
    msg += `Kính mong Quý Phụ huynh sắp xếp thanh toán sớm. Sau khi chuyển khoản, Quý Phụ huynh vui lòng gửi lại hình ảnh biên lai qua Zalo này để trung tâm đối soát và xuất biên nhận điện tử ạ.\n\n`;
    msg += `Trân trọng cảm ơn Quý Phụ huynh!`;

    return msg;
  };

  // Copy Zalo reminder message
  const handleCopyZaloMessage = (student: Student, mode: 'gentle' | 'formal' = 'gentle', target: 'parent' | 'student' = 'parent') => {
    const msg = generateZaloTuitionMessage(student, mode, target);
    try {
      navigator.clipboard.writeText(msg);
    } catch {
      // Fallback
    }
    setCopiedStudentId(student.id);
    setTimeout(() => setCopiedStudentId(null), 3000);
    const label = mode === 'gentle' ? 'nhắc học phí nhẹ nhàng' : 'thông báo học phí';
    setSaveToast(`Đã sao chép tin nhắn ${label} của học viên ${student.name}!`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Open Zalo Modal for reviewing / editing message or phone
  const handleOpenZaloModal = (
    student: Student,
    target: 'parent' | 'student' = 'parent',
    mode: 'gentle' | 'formal' = 'gentle'
  ) => {
    setSelectedStudentForZaloModal(student);
    setZaloTargetRecipient(target);
    setZaloToneMode(mode);
    setEditParentPhoneInput(student.parentPhone || '');
    setEditParentNameInput(student.parentName || '');
    setEditStudentPhoneInput(student.phone || '');
    setCustomZaloMessage(generateZaloTuitionMessage(student, mode, target));
  };

  // One-click redirect to Zalo app for parent or student
  const handleOpenZaloForTuition = (
    student: Student,
    target: 'parent' | 'student' = 'parent',
    mode: 'gentle' | 'formal' = 'gentle'
  ) => {
    const rawPhone = target === 'parent'
      ? (student.parentPhone || student.phone || '')
      : (student.phone || student.parentPhone || '');
    const cleanPhone = getCleanPhone(rawPhone);

    if (!cleanPhone) {
      handleOpenZaloModal(student, target, mode);
      setSaveToast(`Chưa có SĐT ${target === 'parent' ? 'Phụ huynh' : 'Học viên'}, vui lòng nhập số để mở Zalo!`);
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    // Generate & copy message to clipboard
    const msg = generateZaloTuitionMessage(student, mode, target);
    try {
      navigator.clipboard.writeText(msg);
    } catch {
      // Fallback
    }

    // Open Zalo app or web with phone
    const zaloUrl = `https://zalo.me/${cleanPhone}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');

    // Auto record reminder count & note
    const todayStr = formatDateDisplay(new Date().toISOString().split('T')[0]);
    const newCount = (student.tuitionReminderCount || 0) + 1;
    const prevNote = student.tuitionReminderNote || '';
    const actionLabel = mode === 'gentle' ? 'nhắc nhẹ nhàng' : 'đòi nợ';
    const recipientLabel = target === 'parent' ? 'Zalo PH' : 'Zalo HV';
    const newNote = prevNote
      ? `${prevNote} • Đã mở ${recipientLabel} (${actionLabel} L${newCount} - ${todayStr})`
      : `Đã mở ${recipientLabel} (${actionLabel} L${newCount} - ${todayStr})`;

    handleStudentFieldChange(student, {
      tuitionReminderCount: newCount,
      tuitionReminderNote: newNote,
    });

    const targetName = target === 'parent' ? 'Phụ huynh' : 'Học viên';
    const msgName = mode === 'gentle' ? 'thư nhắc nhẹ nhàng' : 'tin nhắn đòi học phí';
    setSaveToast(`Đã copy ${msgName} & mở Zalo ${targetName} (${rawPhone})!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Confirm sending from modal
  const handleConfirmSendFromModal = () => {
    if (!selectedStudentForZaloModal) return;

    const chosenPhone = zaloTargetRecipient === 'parent' ? editParentPhoneInput : editStudentPhoneInput;
    const cleanPhone = getCleanPhone(chosenPhone);
    if (!cleanPhone) {
      setSaveToast(`Vui lòng nhập số điện thoại ${zaloTargetRecipient === 'parent' ? 'phụ huynh' : 'học viên'} để mở Zalo!`);
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    // Update student's phone/name if changed
    const updatedStudent: Student = {
      ...selectedStudentForZaloModal,
      parentPhone: editParentPhoneInput.trim(),
      phone: editStudentPhoneInput.trim() || selectedStudentForZaloModal.phone,
      parentName: editParentNameInput.trim() || selectedStudentForZaloModal.parentName,
    };

    const msgToSend = customZaloMessage || generateZaloTuitionMessage(updatedStudent, zaloToneMode, zaloTargetRecipient);

    try {
      navigator.clipboard.writeText(msgToSend);
    } catch {
      // Fallback
    }

    // Open Zalo
    const zaloUrl = `https://zalo.me/${cleanPhone}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');

    // Record reminder if checked
    if (autoRecordReminderOnZalo) {
      const todayStr = formatDateDisplay(new Date().toISOString().split('T')[0]);
      const newCount = (updatedStudent.tuitionReminderCount || 0) + 1;
      const prevNote = updatedStudent.tuitionReminderNote || '';
      const actionLabel = zaloToneMode === 'gentle' ? 'nhắc nhẹ nhàng' : 'đòi nợ';
      const targetLabel = zaloTargetRecipient === 'parent' ? 'Zalo PH' : 'Zalo HV';
      updatedStudent.tuitionReminderCount = newCount;
      updatedStudent.tuitionReminderNote = prevNote
        ? `${prevNote} • Đã mở ${targetLabel} (${actionLabel} L${newCount} - ${todayStr})`
        : `Đã mở ${targetLabel} (${actionLabel} L${newCount} - ${todayStr})`;
    }

    onUpdateStudent(updatedStudent);
    setSelectedStudentForZaloModal(null);
    setSaveToast(`Đã sao chép nội dung & chuyển sang app Zalo: ${chosenPhone}!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Batch Deadline Apply Handler
  const handleApplyBatchDeadline = () => {
    if (!batchDeadlineDate) {
      setSaveToast('Vui lòng chọn hạn nộp học phí!');
      setTimeout(() => setSaveToast(null), 2500);
      return;
    }

    const studentsToUpdate = relevantStudents.filter((st) => {
      if (batchDeadlineScope === 'unpaid') {
        return st.tuitionStatus !== 'Đã đóng đủ' && !st.tuitionPaidDate;
      }
      return true;
    });

    if (studentsToUpdate.length === 0) {
      setSaveToast('Không có học viên nào phù hợp để áp dụng!');
      setTimeout(() => setSaveToast(null), 2500);
      setIsBatchDeadlineModalOpen(false);
      return;
    }

    const updatedList = studentsToUpdate.map((st) => ({
      ...st,
      tuitionDeadlineDate: batchDeadlineDate,
    }));

    if (onUpdateStudentBatch) {
      onUpdateStudentBatch(updatedList);
    } else {
      updatedList.forEach((st) => onUpdateStudent(st));
    }

    setIsBatchDeadlineModalOpen(false);
    setSaveToast(`Đã thiết lập hạn nộp (${formatDateDisplay(batchDeadlineDate)}) cho ${updatedList.length} học viên!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Automated Overdue Gentle Reminder single step in modal
  const handleSendAutoOverdueGentleZalo = (student: Student) => {
    const rawPhone = autoOverdueTarget === 'parent'
      ? (student.parentPhone || student.phone || '')
      : (student.phone || student.parentPhone || '');
    const cleanPhone = getCleanPhone(rawPhone);

    if (!cleanPhone) {
      setSaveToast(`Học viên ${student.name} chưa có số điện thoại Zalo để mở!`);
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    const msg = generateZaloTuitionMessage(student, 'gentle', autoOverdueTarget);
    try {
      navigator.clipboard.writeText(msg);
    } catch {
      // Fallback
    }

    const zaloUrl = `https://zalo.me/${cleanPhone}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');

    // Mark sent in map
    setAutoOverdueSentMap((prev) => ({ ...prev, [student.id]: true }));

    // Record reminder
    const todayStr = formatDateDisplay(new Date().toISOString().split('T')[0]);
    const newCount = (student.tuitionReminderCount || 0) + 1;
    const prevNote = student.tuitionReminderNote || '';
    const newNote = prevNote
      ? `${prevNote} • Đã gửi nhắc nhẹ nhàng tự động Zalo (${todayStr})`
      : `Đã gửi nhắc nhẹ nhàng tự động Zalo (${todayStr})`;

    handleStudentFieldChange(student, {
      tuitionReminderCount: newCount,
      tuitionReminderNote: newNote,
    });

    setSaveToast(`Đã copy thư nhắc nhẹ & mở app Zalo cho PH em ${student.name}!`);
    setTimeout(() => setSaveToast(null), 3500);

    // If active queue index matches, move to next
    if (autoOverdueQueueIndex < overdueStudents.length - 1) {
      setAutoOverdueQueueIndex((prev) => prev + 1);
    }
  };

  // Stats
  const totalStudentsCount = relevantStudents.length;
  const totalPaidCount = relevantStudents.filter((s) => s.tuitionStatus === 'Đã đóng đủ').length;
  const totalLateStudentsCount = relevantStudents.filter((s) => (s.joinedLateSessions || 0) >= 4).length;

  if (!canAccessTuition) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-6 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Giới Hạn Quyền Truy Cập Học Phí</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Phân hệ <strong>Quản Lý Khóa Học & Học Phí Học Sinh</strong> chỉ dành riêng cho <strong>Quản lý trung tâm</strong> và <strong>Trợ lý</strong>. Tài khoản Giáo viên không có thẩm quyền truy cập hoặc chỉnh sửa dữ liệu học phí.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          <span>Tài khoản: {currentUser?.name || 'Giáo viên'} ({currentUser?.role === 'teacher' ? 'Giáo viên' : currentUser?.role})</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* OVERDUE ALERT BANNER (If any student is overdue by 1+ days) */}
      {overdueStudents.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm text-rose-950 uppercase tracking-tight">
                  Cảnh Báo: Quá Hạn Nộp Học Phí
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black">
                  {overdueStudents.length} học viên quá hạn ≥ 1 ngày
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Hệ thống phát hiện có <strong>{overdueStudents.length} học viên</strong> đã quá hạn nộp học phí hoặc quá ngày hẹn xin nộp muộn từ 1 ngày trở lên. Bạn có thể kích hoạt tính năng tự động nhắc nhở nhẹ nhàng để gửi Zalo cho phụ huynh ngay!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Nút kích hoạt tự động gửi nhắc nhở nhẹ nhàng */}
            <button
              type="button"
              onClick={() => {
                setIsAutoOverdueModalOpen(true);
                setAutoOverdueQueueIndex(0);
              }}
              className="px-3.5 py-2 text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 cursor-pointer active:scale-95 animate-pulse"
            >
              <Heart className="w-4 h-4 fill-current text-white" />
              <span>🤖 Tự Động Nhắc Nhở Nhẹ Nhàng ({overdueStudents.length} HV)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                filterOverdueOnly
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{filterOverdueOnly ? 'Hiển thị tất cả' : 'Lọc danh sách quá hạn'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Course Summary Metric Cards */}
      <div className={`grid grid-cols-2 ${isCourse4 || totalExternalCount > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3`}>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Học phí chuẩn của khóa</div>
          <div className="text-base font-black text-purple-900 mt-1">
            {formatVND(courseTuitionFee)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isCourse4 ? 'Khóa 4: Nhập khác mặc định' : 'Theo thiết lập chuẩn'}
          </div>
        </div>

        {(isCourse4 || totalExternalCount > 0) && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 shadow-xs">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Học sinh ngoài</span>
            </div>
            <div className="text-base font-black text-amber-950 mt-1">
              {totalExternalCount} học viên
            </div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
              Học phí thỏa thuận riêng
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng học viên</div>
          <div className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>{totalStudentsCount} học viên</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            Đã nộp đủ: {totalPaidCount}/{totalStudentsCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">HV vào sau (≥4 buổi)</div>
          <div className="text-base font-black text-blue-700 mt-1 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{totalLateStudentsCount} học viên</span>
          </div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">
            Tự động trừ 100k/buổi
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Học viên nợ / Quá hạn</div>
          <div className="text-base font-black text-rose-700 mt-1 flex items-center gap-1.5">
            <span>{overdueStudents.length} quá hạn</span>
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
            Cần nhắc nhẹ nhàng qua Zalo
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên học viên, mã HV, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Nút thiết lập hạn nộp học phí hàng loạt cho cả lớp / khóa */}
          <button
            type="button"
            onClick={() => setIsBatchDeadlineModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer shadow-xs"
            title="Bấm để thiết lập hạn nộp học phí chung cho các học viên"
          >
            <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
            <span>Thiết Lập Hạn Nộp Cả Lớp</span>
          </button>

          {/* Nút tự động gửi nhắc nhở nhẹ nhàng nếu có học viên quá hạn */}
          {overdueStudents.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsAutoOverdueModalOpen(true);
                setAutoOverdueQueueIndex(0);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              title="Mở trình tự động gửi tin nhắn nhắc nhở phụ huynh nộp nhẹ nhàng qua Zalo"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Tự Động Nhắc Nhẹ ({overdueStudents.length})</span>
            </button>
          )}

          {/* Category Filter: Học sinh ngoài vs Nội bộ */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">Tất cả đối tượng HV ({relevantStudents.length})</option>
            <option value="external">🏷️ Học sinh ngoài ({totalExternalCount})</option>
            <option value="internal">Học sinh nội bộ ({relevantStudents.length - totalExternalCount})</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterTuitionStatus}
            onChange={(e) => setFilterTuitionStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">Tất cả tình trạng phí</option>
            <option value="paid">Đã đóng đủ</option>
            <option value="debt">Còn nợ</option>
            <option value="unpaid">Chưa đóng</option>
          </select>

          {/* Quick toggle overdue only */}
          <button
            type="button"
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border cursor-pointer ${
              filterOverdueOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Chỉ xem quá hạn ({overdueStudents.length})</span>
          </button>
        </div>
      </div>

      {/* Main Student Tuition Management Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">STT</th>
                <th className="py-3 px-3 min-w-[270px]">Học Viên, Zalo PH & Zalo HV</th>
                <th className="py-3 px-3 text-right min-w-[125px]">
                  <div className="flex flex-col items-end">
                    <span>Học Phí Khóa</span>
                    <span className="text-[9px] text-purple-600 font-normal">
                      {isCourse4 ? 'Khóa 4: Nhập tùy chỉnh' : 'Theo thiết lập'}
                    </span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[155px]">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1">
                      <span>Vào Sau (Buổi)</span>
                      <span className="text-[9px] text-blue-600 font-bold">(≥4 buổi: -100k/b)</span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-normal">Tự động trừ tiền</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right min-w-[130px]">
                  <div className="flex flex-col items-end">
                    <span className="text-purple-900 font-black">Phải Đóng</span>
                    <span className="text-[9px] text-slate-500 font-normal">Sau khi giảm</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[185px]">
                  <div className="flex flex-col">
                    <span className="text-blue-950 font-black">📅 Ngày Học Riêng Từng Bạn</span>
                    <span className="text-[9px] text-blue-700 font-normal">Bắt đầu & Kết thúc khóa</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[170px]">
                  <div className="flex flex-col">
                    <span className="text-purple-950 font-black">Hạn Nộp Học Phí</span>
                    <span className="text-[9px] text-purple-600 font-normal">Quy định hạn nộp</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[160px]">
                  <div className="flex flex-col">
                    <span className="text-emerald-950 font-black">💳 Ngày Nộp Học Phí Riêng</span>
                    <span className="text-[9px] text-emerald-700 font-semibold">Hiện ngày nộp từng bạn</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[170px]">
                  <div className="flex flex-col">
                    <span>Ghi Chú Đã Nhắc</span>
                    <span className="text-[9px] text-slate-500 font-normal">Nhắc lần 1, 2, 3...</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[185px]">
                  <div className="flex flex-col">
                    <span>Xin Nộp Muộn</span>
                    <span className="text-[9px] text-rose-600 font-bold">Báo động khi qua 1 ngày</span>
                  </div>
                </th>
                <th className="py-3 px-2 min-w-[175px] text-center">Đòi Nợ & Nhắc Zalo</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {displayedStudents.map((st, idx) => {
                const baseFee = st.customTuitionFee ?? st.courseTuitionFee ?? courseTuitionFee;
                const lateSessions = st.joinedLateSessions || 0;
                const { discountAmount, finalFee, isDeductible } = calculateStudentTuition(baseFee, lateSessions, st, classes);
                const overdue = checkOverdueStatus(st.tuitionPromiseDate, st.tuitionDeadlineDate, st.tuitionPaidDate, st.tuitionStatus);
                const k4Info = getStudentK4ProgressInfo(st);

                const studentClass = classes.find((c) => c.id === st.classId);
                const countedSessions = (st.startDate || st.joinDate) && st.endDate
                  ? countSessionsBetweenDates(st.startDate || st.joinDate || '', st.endDate, studentClass?.schedule || '', studentClass?.offDates || [])
                  : 32;
                const effectiveSessions = typeof st.registeredSessions === 'number'
                  ? st.registeredSessions
                  : (typeof st.earlyEndSessions === 'number'
                      ? st.earlyEndSessions
                      : (countedSessions < 32 ? countedSessions : 32));

                const standardClassFee = studentClass?.tuitionFee && studentClass.tuitionFee > 0 ? studentClass.tuitionFee : (courseTuitionFee || 14500000);
                const proRatedCalc = calculateProRatedTuition(
                  standardClassFee,
                  effectiveSessions,
                  st.previousDebt || st.carriedOverDebt || 0,
                  32
                );

                const isPaid = st.tuitionStatus === 'Đã đóng đủ' || (st.tuitionPaidDate && st.tuitionPaidDate.length > 0);
                const parentPhone = st.parentPhone;
                const studentPhone = st.phone;

                return (
                  <tr
                    key={st.id}
                    className={`transition-colors hover:bg-purple-50/20 ${
                      overdue.isOverdue
                        ? 'bg-rose-50/50 border-l-4 border-l-rose-500'
                        : isPaid
                        ? 'bg-emerald-50/20'
                        : 'bg-white'
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Học viên Info & Zalo PH & Zalo HV */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                          {st.name.charAt(0)}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="font-extrabold text-slate-900 hover:text-purple-700 transition-colors flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{st.name}</span>
                            {(st.isExternalStudent || st.studentCategory === 'Học sinh ngoài') && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <UserCheck className="w-3 h-3 text-amber-700" />
                                <span>Học sinh ngoài</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-purple-700 font-bold bg-purple-50 px-1 py-0.2 rounded border border-purple-100">
                              {st.code}
                            </span>
                            {st.className && <span className="text-slate-400">• {st.className}</span>}

                            {/* Nút bật/tắt đánh dấu Học sinh ngoài */}
                            <button
                              type="button"
                              onClick={() => {
                                const isExt = !(st.isExternalStudent || st.studentCategory === 'Học sinh ngoài');
                                handleStudentFieldChange(st, {
                                  isExternalStudent: isExt,
                                  studentCategory: isExt ? 'Học sinh ngoài' : 'Thường',
                                });
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                st.isExternalStudent || st.studentCategory === 'Học sinh ngoài'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-purple-100 hover:text-purple-800'
                              }`}
                              title="Bấm để chuyển đổi đánh dấu Học sinh ngoài"
                            >
                              {st.isExternalStudent || st.studentCategory === 'Học sinh ngoài' ? '✓ Đã đánh dấu HS ngoài' : '+ Đánh dấu HS ngoài'}
                            </button>
                          </div>

                          {/* Zalo PH (Phụ huynh) Button */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            {parentPhone ? (
                              <button
                                type="button"
                                onClick={() => handleOpenZaloForTuition(st, 'parent', 'gentle')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#0068FF] hover:bg-[#0054cc] text-white shadow-xs transition-all cursor-pointer group active:scale-95"
                                title={`Bấm vào để mở Zalo Phụ huynh (${parentPhone}) và copy thư nhắc nhẹ nhàng`}
                              >
                                <span className="w-3.5 h-3.5 rounded bg-white text-[#0068FF] font-black text-[9px] flex items-center justify-center leading-none">
                                  Z
                                </span>
                                <span>Zalo PH: {parentPhone}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenZaloModal(st, 'parent', 'gentle')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
                                title="Chưa có SĐT Phụ huynh - Bấm để thêm và kết nối Zalo"
                              >
                                <span>+ Thêm Zalo PH</span>
                              </button>
                            )}
                            {st.parentName && (
                              <span className="text-[10px] text-slate-500 font-medium" title="Họ tên phụ huynh">
                                ({st.parentName})
                              </span>
                            )}
                          </div>

                          {/* Zalo HV (Học viên) Button */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {studentPhone ? (
                              <button
                                type="button"
                                onClick={() => handleOpenZaloForTuition(st, 'student', 'gentle')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs transition-all cursor-pointer group active:scale-95"
                                title={`Bấm vào để mở Zalo Học viên (${studentPhone})`}
                              >
                                <span className="w-3.5 h-3.5 rounded bg-white text-cyan-700 font-black text-[9px] flex items-center justify-center leading-none">
                                  Z
                                </span>
                                <span>Zalo HV: {studentPhone}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenZaloModal(st, 'student', 'gentle')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                                title="Chưa có SĐT Học viên - Bấm để thêm"
                              >
                                <span>+ SĐT Zalo HV</span>
                              </button>
                            )}
                          </div>

                          {/* Khóa 4 automated progress & tuition reminder info */}
                          {k4Info.isK4 && (
                            <div className="mt-2.5 p-2 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 shadow-2xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                                  🎯 Khóa 4 - Chu kỳ {k4Info.currentCycle}
                                </span>
                                <span className="text-[10px] text-slate-700 font-bold">
                                  Đã học: <strong className="text-slate-900 font-black">{k4Info.attendedCount} buổi</strong>
                                </span>
                                <span className="text-[10px] text-blue-700 font-semibold bg-white px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                                  Buổi {k4Info.sessionsThisCycle}/32
                                </span>
                              </div>
                              
                              {k4Info.needsReminder && (
                                <div className="flex items-start gap-1 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-extrabold text-amber-905 leading-normal animate-pulse shadow-3xs">
                                  <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                  <span>{k4Info.reminderMessage}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Học phí cần đóng (theo thiết lập của khóa) - Cho phép nhập tùy chỉnh nếu là Khóa 4 hoặc Học sinh ngoài hoặc kết thúc sớm */}
                    <td className="py-3 px-3 text-right">
                      {isCourse4 || st.isExternalStudent || st.studentCategory === 'Học sinh ngoài' || proRatedCalc.isEarlyEnd ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="50000"
                              value={st.customTuitionFee ?? st.courseTuitionFee ?? baseFee}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                handleStudentFieldChange(st, {
                                  customTuitionFee: val,
                                  courseTuitionFee: val,
                                });
                              }}
                              className="w-28 px-2 py-1 text-right text-xs font-black text-purple-900 bg-purple-50/70 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                              title="Nhập học phí tùy chỉnh cho học viên này"
                            />
                            <span className="text-[11px] font-bold text-slate-500">đ</span>
                          </div>
                          
                          {/* Automatic Pro-rated tuition badge if early end < 32 sessions */}
                          {proRatedCalc.isEarlyEnd ? (
                            <div className="space-y-0.5">
                              <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block text-right">
                                ⚡ {proRatedCalc.actualSessions}b: {formatVND(proRatedCalc.proRatedTuition)}
                              </div>
                              {st.customTuitionFee !== proRatedCalc.proRatedTuition && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleStudentFieldChange(st, {
                                      customTuitionFee: proRatedCalc.proRatedTuition,
                                      courseTuitionFee: proRatedCalc.proRatedTuition,
                                      registeredSessions: proRatedCalc.actualSessions,
                                    });
                                  }}
                                  className="text-[9px] font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline block text-right cursor-pointer"
                                  title="Áp dụng số tiền tự động tính theo số buổi học"
                                >
                                  ⚡ Áp dụng {formatVND(proRatedCalc.proRatedTuition)}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-[9px] text-right">
                              {(st.customTuitionFee && st.customTuitionFee !== courseTuitionFee) ||
                              (st.courseTuitionFee && st.courseTuitionFee !== courseTuitionFee) ? (
                                <span className="inline-flex items-center gap-0.5 text-purple-700 font-bold bg-purple-100/70 px-1.5 py-0.2 rounded border border-purple-200">
                                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                  Tùy chỉnh
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">Mặc định</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-bold text-slate-700">{formatVND(baseFee)}</div>
                          <div className="text-[9px] text-slate-400 font-normal">Chuẩn khóa (32b)</div>
                        </div>
                      )}
                    </td>

                    {/* Học phí với học viên vào sau 4 buổi trở lên tự trừ 100,000đ/buổi */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={lateSessions === 0 ? '' : lateSessions}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              handleStudentFieldChange(st, { joinedLateSessions: val });
                            }}
                            placeholder="0 buổi"
                            className="w-16 px-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                          />
                          <span className="text-[11px] text-slate-500">buổi</span>
                        </div>

                        {/* Automatic calculation display */}
                        {lateSessions > 0 && (
                          <div className="text-[10px]">
                            {isDeductible ? (
                              <div className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <span>Trừ:</span>
                                <span>-{formatVND(discountAmount)}</span>
                                <span className="text-[9px] text-rose-500 font-normal">({lateSessions}b x 100k)</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">
                                Vào sau {lateSessions} buổi (&lt; 4b: không trừ)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Mức học phí học sinh phải đóng (có cộng dồn nợ khóa trước nếu có) */}
                    <td className="py-3 px-3 text-right">
                      <div className="text-xs font-black text-purple-900">
                        {formatVND(proRatedCalc.isEarlyEnd ? proRatedCalc.proRatedTuition : finalFee)}
                      </div>
                      
                      {/* Previous Debt Carry-over display */}
                      {proRatedCalc.previousDebt > 0 && (
                        <div className="text-[10px] text-purple-800 font-bold mt-0.5">
                          <span>+ Nợ cũ: {formatVND(proRatedCalc.previousDebt)}</span>
                          <div className="text-[11px] font-black text-rose-700">
                            = {formatVND(proRatedCalc.totalDue)}
                          </div>
                        </div>
                      )}

                      <div className="mt-0.5">
                        {k4Info.isK4 ? (
                          k4Info.isUnpaidForCurrentCycle ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 animate-pulse shadow-3xs" title="Học viên đã học sang chu kỳ mới nhưng chưa đóng học phí chu kỳ này">
                              ⚠️ Nợ CK {k4Info.currentCycle}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-3xs">
                              <Check className="w-3 h-3 text-emerald-600" /> Đủ CK {k4Info.currentCycle}
                            </span>
                          )
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3 h-3" /> Đã đóng đủ
                          </span>
                        ) : st.tuitionStatus === 'Còn nợ' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            Còn nợ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                            Chưa đóng
                          </span>
                        )}
                      </div>
                    </td>

                    {/* NGÀY BẮT ĐẦU VÀ NGÀY KẾT THÚC KHÓA RIÊNG TỪNG BẠN */}
                    <td className="py-3 px-3">
                      <div className="space-y-1.5 bg-blue-50/40 p-1.5 rounded-xl border border-blue-100">
                        {/* Start Date input */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-blue-950 font-bold mb-0.5">
                            <span>Bắt đầu học:</span>
                            {st.startDate && (
                              <span className="text-[9px] text-blue-600 font-mono font-normal">
                                {formatDateDisplay(st.startDate)}
                              </span>
                            )}
                          </div>
                          <input
                            type="date"
                            value={st.startDate || st.joinDate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleStudentFieldChange(st, {
                                startDate: val,
                                joinDate: val,
                              });
                            }}
                            className="w-full px-1.5 py-1 text-xs rounded-lg border border-blue-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            title="Chọn ngày bắt đầu học riêng cho học viên này"
                          />
                        </div>

                        {/* End Date input */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-blue-950 font-bold mb-0.5">
                            <span>Kết thúc khóa:</span>
                            {st.endDate && (
                              <span className="text-[9px] text-blue-600 font-mono font-normal">
                                {formatDateDisplay(st.endDate)}
                              </span>
                            )}
                          </div>
                          <input
                            type="date"
                            value={st.endDate || ''}
                            onChange={(e) => {
                              handleStudentFieldChange(st, {
                                endDate: e.target.value,
                              });
                            }}
                            className="w-full px-1.5 py-1 text-xs rounded-lg border border-blue-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Ngày kết thúc..."
                            title="Chọn ngày kết thúc khóa riêng cho học viên này"
                          />

                          {/* Early course end helper (< 32 sessions) */}
                          {countedSessions < 32 && (
                            <div className="mt-1 p-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[9px] space-y-0.5">
                              <div className="text-emerald-950 font-bold flex items-center justify-between">
                                <span>⚡ Kết thúc sớm:</span>
                                <span className="font-mono text-emerald-800 font-black">{countedSessions} buổi</span>
                              </div>
                              <div className="text-emerald-800 font-semibold">
                                Số tiền: {formatVND(Math.round((standardClassFee / 32) * countedSessions))}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const pFee = Math.round((standardClassFee / 32) * countedSessions);
                                  handleStudentFieldChange(st, {
                                    registeredSessions: countedSessions,
                                    earlyEndSessions: countedSessions,
                                    customTuitionFee: pFee,
                                    courseTuitionFee: pFee,
                                  });
                                }}
                                className="w-full text-center font-black text-white bg-emerald-600 hover:bg-emerald-700 py-0.5 rounded transition-all cursor-pointer"
                                title="Áp dụng số tiền tự động tính theo số buổi học thực tế"
                              >
                                ⚡ Áp dụng {countedSessions} buổi
                              </button>
                            </div>
                          )}

                          {/* Khóa 4 auto-calculate end date helper */}
                          {k4Info.isK4 && (
                            <div className="mt-1.5 p-1 bg-blue-100/50 border border-blue-200 rounded-lg text-[9.5px]">
                              <div className="text-blue-950 font-black mb-0.5">
                                🤖 Tự tính CK {k4Info.currentCycle} (32b):
                              </div>
                              <div className="font-mono text-blue-900 font-bold bg-white px-1 py-0.5 rounded border border-blue-200 text-center">
                                {formatDateDisplay(k4Info.personalEndDate)}
                              </div>
                              {st.endDate !== k4Info.personalEndDate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleStudentFieldChange(st, { endDate: k4Info.personalEndDate });
                                  }}
                                  className="w-full mt-1 text-center font-black text-white bg-blue-600 hover:bg-blue-700 py-0.5 rounded-md transition-all active:scale-95 cursor-pointer text-[9px]"
                                  title="Lưu ngày kết thúc dự kiến tự động tính 32 buổi cho chu kỳ này"
                                >
                                  💾 Lưu ngày tự tính
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* THIẾT LẬP HẠN NỘP HỌC PHÍ */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <input
                          type="date"
                          value={st.tuitionDeadlineDate || ''}
                          onChange={(e) => {
                            handleStudentFieldChange(st, {
                              tuitionDeadlineDate: e.target.value,
                            });
                          }}
                          className={`w-full px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-2 font-medium ${
                            st.tuitionDeadlineDate
                              ? 'bg-purple-50/60 border-purple-300 text-purple-900 font-bold focus:ring-purple-500/20'
                              : 'bg-white border-slate-200 text-slate-700 focus:ring-purple-500/20'
                          }`}
                        />

                        {/* Quick preset buttons */}
                        <div className="flex items-center gap-1 text-[9px] flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 7);
                              handleStudentFieldChange(st, { tuitionDeadlineDate: d.toISOString().split('T')[0] });
                            }}
                            className="text-purple-700 hover:underline hover:bg-purple-50 px-1 py-0.5 rounded font-semibold cursor-pointer"
                          >
                            +7 ngày
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 15);
                              handleStudentFieldChange(st, { tuitionDeadlineDate: d.toISOString().split('T')[0] });
                            }}
                            className="text-purple-700 hover:underline hover:bg-purple-50 px-1 py-0.5 rounded font-semibold cursor-pointer"
                          >
                            +15 ngày
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                              handleStudentFieldChange(st, { tuitionDeadlineDate: endOfMonth.toISOString().split('T')[0] });
                            }}
                            className="text-purple-700 hover:underline hover:bg-purple-50 px-1 py-0.5 rounded font-semibold cursor-pointer"
                          >
                            Cuối tháng
                          </button>
                          {st.tuitionDeadlineDate && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleStudentFieldChange(st, { tuitionDeadlineDate: '' })}
                                className="text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded cursor-pointer"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </div>

                        {/* Deadline status note if no promise date overrides */}
                        {st.tuitionDeadlineDate && !st.tuitionPromiseDate && !isPaid && (
                          <div className="text-[10px]">
                            {overdue.isOverdue && (
                              <span className="text-rose-600 font-black flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> Quá hạn {overdue.daysOverdue} ngày
                              </span>
                            )}
                            {overdue.isDueToday && (
                              <span className="text-amber-700 font-bold">
                                ⏰ Hạn nộp hôm nay
                              </span>
                            )}
                            {!overdue.isOverdue && overdue.daysLeft && overdue.daysLeft > 0 && (
                              <span className="text-slate-500">
                                Còn {overdue.daysLeft} ngày
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ô ĐIỀN VÀ HIỆN NGÀY NỘP HỌC PHÍ RIÊNG TỪNG BẠN */}
                    <td className="py-3 px-3">
                      <div className="space-y-1.5 bg-emerald-50/40 p-2 rounded-xl border border-emerald-100">
                        {/* Display badge if paid */}
                        {st.tuitionPaidDate ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>Đã nộp: <strong>{formatDateDisplay(st.tuitionPaidDate)}</strong></span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic">
                            Chưa ghi nhận ngày nộp
                          </div>
                        )}

                        <input
                          type="date"
                          value={st.tuitionPaidDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleStudentFieldChange(st, {
                              tuitionPaidDate: val,
                              tuitionStatus: val ? 'Đã đóng đủ' : st.tuitionStatus,
                            });
                          }}
                          className={`w-full px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-2 font-medium ${
                            st.tuitionPaidDate
                              ? 'bg-white border-emerald-400 text-emerald-950 focus:ring-emerald-500/20 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 focus:ring-purple-500/20'
                          }`}
                          title="Ngày học viên thực tế nộp học phí"
                        />
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              handleStudentFieldChange(st, {
                                tuitionPaidDate: todayStr,
                                tuitionStatus: 'Đã đóng đủ',
                              });
                            }}
                            className="text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors"
                          >
                            + Hôm nay
                          </button>
                          {st.tuitionPaidDate && (
                            <button
                              type="button"
                              onClick={() => {
                                handleStudentFieldChange(st, {
                                  tuitionPaidDate: '',
                                  tuitionStatus: 'Chưa đóng',
                                });
                              }}
                              className="text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded cursor-pointer"
                            >
                              Xóa ngày
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Ô ghi chú đã nhắc lần 1, 2, 3... */}
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        {/* Quick preset buttons for reminders */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[1, 2, 3].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleAddReminder(st, num)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                st.tuitionReminderCount === num
                                  ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                              }`}
                              title={`Ghi nhận nhắc lần ${num}`}
                            >
                              Nhắc L{num}
                            </button>
                          ))}
                        </div>

                        {/* Free text input for custom reminder note */}
                        <input
                          type="text"
                          value={st.tuitionReminderNote || ''}
                          onChange={(e) => {
                            handleStudentFieldChange(st, {
                              tuitionReminderNote: e.target.value,
                            });
                          }}
                          placeholder="Ghi chú nhắc lần 1, 2, 3..."
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
                        />
                      </div>
                    </td>

                    {/* Ô ghi chú xin nộp muộn ngày nào & thông báo nhắc khi qua 1 ngày */}
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        {/* Date input for promised late payment date */}
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={st.tuitionPromiseDate || ''}
                            onChange={(e) => {
                              handleStudentFieldChange(st, {
                                tuitionPromiseDate: e.target.value,
                              });
                            }}
                            className={`w-full px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                              overdue.isOverdue && st.tuitionPromiseDate
                                ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold focus:ring-rose-500/20'
                                : st.tuitionPromiseDate
                                ? 'bg-amber-50/70 border-amber-300 text-amber-900 font-medium focus:ring-amber-500/20'
                                : 'bg-white border-slate-200 text-slate-700 focus:ring-purple-500/20'
                            }`}
                          />
                          {st.tuitionPromiseDate && (
                            <button
                              type="button"
                              onClick={() => {
                                handleStudentFieldChange(st, {
                                  tuitionPromiseDate: '',
                                  tuitionPromiseNote: '',
                                });
                              }}
                              className="text-slate-400 hover:text-rose-600 text-[10px] cursor-pointer"
                              title="Xóa hẹn"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Note for promised late payment */}
                        <input
                          type="text"
                          value={st.tuitionPromiseNote || ''}
                          onChange={(e) => {
                            handleStudentFieldChange(st, {
                              tuitionPromiseNote: e.target.value,
                            });
                          }}
                          placeholder="Lý do / hẹn xin nộp muộn..."
                          className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-700"
                        />

                        {/* PROMINENT OVERDUE ALERT IF PROMISE DATE EXCEEDED BY 1+ DAYS */}
                        {overdue.isOverdue && st.tuitionPromiseDate && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black shadow-xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>⚠️ Quá hẹn {overdue.daysOverdue} ngày!</span>
                          </div>
                        )}

                        {!overdue.isOverdue && overdue.isDueToday && st.tuitionPromiseDate && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            ⏰ Đến hẹn nộp hôm nay!
                          </div>
                        )}

                        {!overdue.isOverdue && overdue.daysLeft && overdue.daysLeft > 0 && st.tuitionPromiseDate && (
                          <div className="text-[10px] text-slate-500 italic">
                            Còn {overdue.daysLeft} ngày đến hẹn
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Thao tác & Đòi Nợ Zalo */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="inline-flex items-center gap-1">
                          {/* Nút Đòi Zalo Tiêu chuẩn */}
                          <button
                            type="button"
                            onClick={() => handleOpenZaloForTuition(st, 'parent', 'formal')}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#0068FF] hover:bg-[#0054cc] text-white rounded-lg text-[10px] font-black shadow-xs transition-all cursor-pointer group active:scale-95"
                            title="Mở app Zalo Phụ huynh với thông báo học phí tiêu chuẩn"
                          >
                            <span className="w-3 h-3 rounded bg-white text-[#0068FF] font-black text-[8px] flex items-center justify-center leading-none">
                              Z
                            </span>
                            <span className="whitespace-nowrap">Đòi Zalo</span>
                            <Send className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                          </button>

                          {/* Nút Nhắc Nhẹ Nhàng (Gentle Reminder) */}
                          <button
                            type="button"
                            onClick={() => handleOpenZaloForTuition(st, 'parent', 'gentle')}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer group active:scale-95"
                            title="Tự động sao chép thư nhắc nộp học phí nhẹ nhàng, lịch sự & mở app Zalo cho Phụ huynh"
                          >
                            <Heart className="w-2.5 h-2.5 fill-current" />
                            <span className="whitespace-nowrap">Nhắc nhẹ</span>
                          </button>
                        </div>

                        <div className="inline-flex items-center gap-1">
                          {/* Nút xem & chỉnh sửa tin nhắn Zalo */}
                          <button
                            type="button"
                            onClick={() => handleOpenZaloModal(st, 'parent', 'gentle')}
                            className="px-1.5 py-0.5 text-slate-600 hover:text-[#0068FF] hover:bg-blue-50 rounded transition-colors cursor-pointer text-[10px] flex items-center gap-0.5"
                            title="Xem trước & tùy chỉnh tin nhắn Zalo (chọn phụ huynh hoặc học viên, đổi lời nhắc)"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Soạn</span>
                          </button>

                          {/* Nút sao chép tin nhắn nhanh */}
                          <button
                            type="button"
                            onClick={() => handleCopyZaloMessage(st, 'gentle', 'parent')}
                            className="px-1.5 py-0.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors cursor-pointer text-[10px] flex items-center gap-0.5"
                            title="Sao chép tin nhắn nhắc nhẹ nhàng vào clipboard"
                          >
                            {copiedStudentId === st.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {displayedStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <p className="text-sm font-bold text-slate-500">Không tìm thấy học viên nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>Quy tắc: Học viên vào sau <strong>≥ 4 buổi</strong> tự động trừ <strong>100.000 đ/buổi</strong>. Vào sau dưới 4 buổi giữ nguyên phí.</span>
          </div>
          <div className="flex items-center gap-2 text-rose-600 font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Quá hạn nộp học phí hoặc quá ngày hẹn 1 ngày sẽ kích hoạt cảnh báo đỏ nhắc đóng.</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: THIẾT LẬP HẠN NỘP HỌC PHÍ HÀNG LOẠT (BATCH DEADLINE) */}
      {isBatchDeadlineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shadow-xs">
                  <CalendarDays className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Thiết Lập Hạn Nộp Học Phí Hàng Loạt
                  </h3>
                  <p className="text-[11px] text-purple-200 mt-0.5">
                    Áp dụng nhanh cho các học viên trong khóa / lớp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchDeadlineModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đối tượng áp dụng:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchDeadlineScope('unpaid')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      batchDeadlineScope === 'unpaid'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div>Học viên chưa đóng đủ</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      (Đang còn nợ hoặc chưa đóng)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchDeadlineScope('all')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      batchDeadlineScope === 'all'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div>Tất cả học viên</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      (Toàn bộ danh sách hiện tại)
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn ngày hạn nộp học phí:
                </label>
                <input
                  type="date"
                  value={batchDeadlineDate}
                  onChange={(e) => setBatchDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold text-purple-900"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                  <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 5);
                      setBatchDeadlineDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg font-semibold text-[11px] cursor-pointer"
                  >
                    +5 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 10);
                      setBatchDeadlineDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg font-semibold text-[11px] cursor-pointer"
                  >
                    +10 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                      setBatchDeadlineDate(endOfMonth.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg font-semibold text-[11px] cursor-pointer"
                  >
                    Cuối tháng này
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const nextMonth10 = new Date(d.getFullYear(), d.getMonth() + 1, 10);
                      setBatchDeadlineDate(nextMonth10.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-lg font-semibold text-[11px] cursor-pointer"
                  >
                    Ngày 10 tháng sau
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  Khi đến hạn này, nếu học viên chưa đóng, hệ thống sẽ tự động chuyển sang trạng thái cảnh báo quá hạn và bật tính năng gửi nhắc nhở nhẹ nhàng qua Zalo phụ huynh.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsBatchDeadlineModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApplyBatchDeadline}
                className="px-4 py-2 text-xs font-black text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Áp Dụng Hạn Nộp ({formatDateDisplay(batchDeadlineDate)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TỰ ĐỘNG GỬI TIN NHẮN NHẮC NHỞ PHỤ HUYNH NỘP NHẸ NHÀNG (AUTO OVERDUE ASSISTANT) */}
      {isAutoOverdueModalOpen && overdueStudents.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center shadow-md">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                    <span>Trợ Lý Tự Động Nhắc Nhở Học Phí Nhẹ Nhàng Qua Zalo</span>
                  </h3>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    Hệ thống tự động đồng hành cùng {overdueStudents.length} học viên quá hạn nộp học phí
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoOverdueModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Settings bar */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-950">Gửi nhắc tới:</span>
                  <div className="inline-flex p-0.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setAutoOverdueTarget('parent')}
                      className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                        autoOverdueTarget === 'parent'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      Phụ Huynh (Ưu tiên)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoOverdueTarget('student')}
                      className={`px-2.5 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                        autoOverdueTarget === 'student'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      Học Viên
                    </button>
                  </div>
                </div>

                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-600" />
                  <span>Tone giọng: Tế nhị, tôn trọng, đồng hành cùng gia đình</span>
                </div>
              </div>

              {/* Active Student in Queue */}
              {(() => {
                const currentStudent = overdueStudents[autoOverdueQueueIndex] || overdueStudents[0];
                if (!currentStudent) return null;

                const baseFee = currentStudent.courseTuitionFee || courseTuitionFee;
                const lateSessions = currentStudent.joinedLateSessions || 0;
                const { discountAmount, finalFee, isDeductible } = calculateStudentTuition(baseFee, lateSessions);
                const overdue = checkOverdueStatus(
                  currentStudent.tuitionPromiseDate,
                  currentStudent.tuitionDeadlineDate,
                  currentStudent.tuitionPaidDate,
                  currentStudent.tuitionStatus
                );

                const rawPhone = autoOverdueTarget === 'parent'
                  ? (currentStudent.parentPhone || currentStudent.phone)
                  : (currentStudent.phone || currentStudent.parentPhone);
                const cleanPhone = getCleanPhone(rawPhone);
                const isSent = Boolean(autoOverdueSentMap[currentStudent.id]);

                return (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {autoOverdueQueueIndex + 1}
                        </span>
                        <div>
                          <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                            <span>{currentStudent.name}</span>
                            <span className="font-mono text-[11px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                              {currentStudent.code}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {currentStudent.parentName ? `Phụ huynh: ${currentStudent.parentName} • ` : ''}
                            SĐT Zalo: <strong className="text-emerald-700">{rawPhone || 'Chưa có'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-purple-900">
                          {formatVND(finalFee)}
                        </div>
                        <div className="text-[11px] text-rose-600 font-bold">
                          ⚠️ Quá {overdue.sourceLabel} {overdue.daysOverdue} ngày
                        </div>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>NỘI DUNG NHẮC NHỞ NHẸ NHÀNG ĐÃ ĐƯỢC TẠO SẴN:</span>
                        {isSent && (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuyển sang Zalo
                          </span>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {generateZaloTuitionMessage(currentStudent, 'gentle', autoOverdueTarget)}
                      </div>
                    </div>

                    {/* Action controls for this student */}
                    <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                      <div className="text-xs text-slate-400">
                        Học viên {autoOverdueQueueIndex + 1} / {overdueStudents.length}
                      </div>

                      <div className="flex items-center gap-2">
                        {autoOverdueQueueIndex < overdueStudents.length - 1 && (
                          <button
                            type="button"
                            onClick={() => setAutoOverdueQueueIndex((prev) => prev + 1)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Bỏ qua em này
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSendAutoOverdueGentleZalo(currentStudent)}
                          className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <span className="w-3.5 h-3.5 rounded bg-white text-emerald-700 font-black text-[9px] flex items-center justify-center leading-none">
                            Z
                          </span>
                          <span>Mở Zalo & Gửi Nhắc Nhẹ Cho Học Viên Này</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Full Overdue Queue Table for fast clicking */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Danh Sách Học Viên Quá Hạn ({overdueStudents.length} em):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Bấm "Gửi Zalo" ở bất kỳ em nào để mở ngay</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {overdueStudents.map((st, i) => {
                    const baseFee = st.courseTuitionFee || courseTuitionFee;
                    const lateSessions = st.joinedLateSessions || 0;
                    const { finalFee } = calculateStudentTuition(baseFee, lateSessions);
                    const overdue = checkOverdueStatus(
                      st.tuitionPromiseDate,
                      st.tuitionDeadlineDate,
                      st.tuitionPaidDate,
                      st.tuitionStatus
                    );
                    const phone = autoOverdueTarget === 'parent' ? (st.parentPhone || st.phone) : (st.phone || st.parentPhone);
                    const isSent = Boolean(autoOverdueSentMap[st.id]);
                    const isCurrent = i === autoOverdueQueueIndex;

                    return (
                      <div
                        key={st.id}
                        className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                          isCurrent ? 'bg-purple-50/70 font-semibold' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">
                              {st.name} <span className="font-normal text-slate-400 font-mono text-[10px]">({st.code})</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Zalo: {phone || <span className="text-rose-500 font-bold">Chưa có</span>} • Quá hạn: <strong className="text-rose-600">{overdue.daysOverdue} ngày</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-purple-900 text-xs">
                            {formatVND(finalFee)}
                          </span>

                          {isSent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              <Check className="w-3 h-3" /> Đã gửi Zalo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAutoOverdueQueueIndex(i);
                                handleSendAutoOverdueGentleZalo(st);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              <span>Gửi Zalo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Đã gửi: <strong>{Object.keys(autoOverdueSentMap).length}</strong> / {overdueStudents.length} học viên
              </span>
              <button
                type="button"
                onClick={() => setIsAutoOverdueModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM & CHUYỂN SANG APP ZALO TÙY CHỌN (INDIVIDUAL MODAL) */}
      {selectedStudentForZaloModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#0068FF] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white text-[#0068FF] font-black text-lg flex items-center justify-center shadow-xs">
                  Z
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
                    <span>Soạn & Gửi Tin Nhắn Zalo Học Phí</span>
                  </h3>
                  <p className="text-[11px] text-blue-100 mt-0.5">
                    Học viên: <strong className="text-white">{selectedStudentForZaloModal.name}</strong> ({selectedStudentForZaloModal.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForZaloModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Choose Recipient and Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Recipient Target */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Người nhận:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setZaloTargetRecipient('parent');
                        setCustomZaloMessage(generateZaloTuitionMessage(selectedStudentForZaloModal, zaloToneMode, 'parent'));
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        zaloTargetRecipient === 'parent'
                          ? 'bg-[#0068FF] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Phụ Huynh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZaloTargetRecipient('student');
                        setCustomZaloMessage(generateZaloTuitionMessage(selectedStudentForZaloModal, zaloToneMode, 'student'));
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        zaloTargetRecipient === 'student'
                          ? 'bg-cyan-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Học Viên
                    </button>
                  </div>
                </div>

                {/* Tone Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phong cách tin nhắn:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setZaloToneMode('gentle');
                        setCustomZaloMessage(generateZaloTuitionMessage(selectedStudentForZaloModal, 'gentle', zaloTargetRecipient));
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        zaloToneMode === 'gentle'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Heart className="w-3 h-3 fill-current" />
                      <span>Nhắc nhẹ nhàng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZaloToneMode('formal');
                        setCustomZaloMessage(generateZaloTuitionMessage(selectedStudentForZaloModal, 'formal', zaloTargetRecipient));
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        zaloToneMode === 'formal'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Thông báo chuẩn
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipient Contact Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Thông Tin Liên Hệ ({zaloTargetRecipient === 'parent' ? 'Phụ Huynh' : 'Học Viên'})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zaloTargetRecipient === 'parent' ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tên Phụ Huynh:
                        </label>
                        <input
                          type="text"
                          value={editParentNameInput}
                          onChange={(e) => setEditParentNameInput(e.target.value)}
                          placeholder="Ví dụ: Anh Tuấn / Chị Lan"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          SĐT Zalo Phụ Huynh <span className="text-rose-600">*</span>:
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={editParentPhoneInput}
                            onChange={(e) => setEditParentPhoneInput(e.target.value)}
                            placeholder="09... (SĐT Zalo phụ huynh)"
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-900"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tên Học Viên:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={selectedStudentForZaloModal.name}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          SĐT Zalo Học Viên <span className="text-rose-600">*</span>:
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={editStudentPhoneInput}
                            onChange={(e) => setEditStudentPhoneInput(e.target.value)}
                            placeholder="09... (SĐT Zalo học viên)"
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-bold text-cyan-900"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Amount Due summary */}
                {(() => {
                  const baseFee = selectedStudentForZaloModal.courseTuitionFee || courseTuitionFee;
                  const lateSessions = selectedStudentForZaloModal.joinedLateSessions || 0;
                  const { discountAmount, finalFee, isDeductible } = calculateStudentTuition(baseFee, lateSessions);
                  const overdue = checkOverdueStatus(
                    selectedStudentForZaloModal.tuitionPromiseDate,
                    selectedStudentForZaloModal.tuitionDeadlineDate,
                    selectedStudentForZaloModal.tuitionPaidDate,
                    selectedStudentForZaloModal.tuitionStatus
                  );

                  return (
                    <div className="bg-purple-50/70 border border-purple-100 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-purple-800 font-medium">Học phí cần hoàn tất:</span>
                        {isDeductible && lateSessions >= 4 && (
                          <span className="text-[10px] text-purple-600 block">
                            (Đã trừ {formatVND(discountAmount)} do vào sau {lateSessions} buổi)
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-purple-950">{formatVND(finalFee)}</span>
                        {overdue.isOverdue && (
                          <span className="block text-[10px] font-bold text-rose-600">
                            ⚠️ Quá {overdue.sourceLabel} {overdue.daysOverdue} ngày
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Message Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nội Dung Tin Nhắn Zalo</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStudentForZaloModal) {
                        setCustomZaloMessage(
                          generateZaloTuitionMessage(selectedStudentForZaloModal, zaloToneMode, zaloTargetRecipient)
                        );
                      }
                    }}
                    className="text-[11px] text-purple-700 hover:underline font-semibold cursor-pointer"
                  >
                    Đặt lại theo mẫu ({zaloToneMode === 'gentle' ? 'Nhắc nhẹ' : 'Chuẩn'})
                  </button>
                </div>

                <textarea
                  value={customZaloMessage}
                  onChange={(e) => setCustomZaloMessage(e.target.value)}
                  rows={9}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed resize-none text-slate-800"
                />

                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Khi bấm <strong>"Chuyển Sang App Zalo"</strong>, hệ thống sẽ tự động sao chép toàn bộ tin nhắn trên vào Clipboard và mở ứng dụng Zalo. Bạn chỉ cần bấm <strong>Dán (Ctrl+V)</strong> và gửi.
                  </p>
                </div>
              </div>

              {/* Checkbox auto record reminder */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRecordReminderOnZalo}
                  onChange={(e) => setAutoRecordReminderOnZalo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span>Tự động ghi nhận thêm 1 lần nhắc học phí vào nhật ký quản lý</span>
              </label>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedStudentForZaloModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (customZaloMessage) {
                      navigator.clipboard.writeText(customZaloMessage);
                      setSaveToast('Đã sao chép tin nhắn vào bộ nhớ tạm!');
                      setTimeout(() => setSaveToast(null), 3000);
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSendFromModal}
                  className="px-4 py-2 text-xs font-black text-white bg-[#0068FF] hover:bg-[#0054cc] rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="w-4 h-4 rounded bg-white text-[#0068FF] font-black text-[10px] flex items-center justify-center leading-none">
                    Z
                  </span>
                  <span>Chuyển Sang App Zalo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
