import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  BookOpen,
  Calendar,
  Clock,
  User,
  MapPin,
  Building,
  GraduationCap,
  Sparkles,
  Check,
  Edit3,
  Layers,
  Plus,
  Trash2,
  Users,
  Bell,
  AlertCircle,
  CalendarCheck2,
  ArrowUpDown,
  UserPlus,
  DollarSign,
  Phone,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  UserCheck,
  Award,
  CalendarDays,
  Lock,
} from 'lucide-react';
import { ClassGroup, Teacher, CurriculumCourse, Student, AuthUser, AttendanceRecord } from '../../types';
import {
  COURSE_LEVEL_CONFIGS,
  SCHEDULE_PRESETS,
  calculateCourseSchedule,
  CourseLevelKey,
  detectCourseLevel,
  formatDateVN,
  calculateProRatedTuition,
  countSessionsBetweenDates,
} from '../../utils/courseSchedule';
import { StandardScheduleSelector } from '../common/StandardScheduleSelector';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classGroup: ClassGroup | null;
  teachers: Teacher[];
  courses: CurriculumCourse[];
  students?: Student[];
  attendanceRecords?: AttendanceRecord[];
  onUpdateClass: (
    updatedClass: ClassGroup,
    modifiedStudents?: Student[],
    newPastedStudents?: { name: string; phone?: string; note?: string; customTuitionFee?: number }[]
  ) => void;
  currentUser?: AuthUser;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  classGroup,
  teachers,
  courses,
  students = [],
  attendanceRecords = [],
  onUpdateClass,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'students'>('info');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<CourseLevelKey>('Khóa 1');
  const [selectedSchedulePreset, setSelectedSchedulePreset] = useState<string>('t2_t5_ca1');
  const [offDates, setOffDates] = useState<string[]>([]);
  const [newOffDateInput, setNewOffDateInput] = useState<string>('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    courseName: '',
    courseId: '',
    courseLevel: 'Khóa 1' as CourseLevelKey,
    branch: '',
    teacherName: '',
    assistantTeacherName: '',
    room: '',
    schedule: '',
    startDate: '',
    endDate: '',
    totalSessions: 32,
    completedSessions: 0,
    maxStudents: 25,
    tuitionFee: 5000000,
    status: 'Đang diễn ra' as ClassGroup['status'],
  });

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [customTeacherInput, setCustomTeacherInput] = useState('');

  const isVuNgoc = currentUser?.email?.toLowerCase() === 'vungoc23122002@gmail.com';
  const isTeacher = (currentUser?.role === 'teacher') && !isVuNgoc;
  const [originalStudentIds, setOriginalStudentIds] = useState<Set<string>>(new Set());

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
      (formData.name?.toLowerCase().includes('khóa 4') ||
       formData.name?.toLowerCase().includes('drill') ||
       formData.courseName?.toLowerCase().includes('khóa 4') ||
       formData.courseName?.toLowerCase().includes('drill') ||
       detectCourseLevel(formData.name || formData.courseName || '', 32) === 'Khóa 4');

    if (!isStudentK4) {
      return { isK4: false };
    }

    // Filter attendance records specifically for this student in their active class
    const studentAttendance = attendanceRecords.filter(
      (r) => r.studentId === st.id && r.classId === st.classId
    );
    const attendedCount = studentAttendance.length;

    // Find class schedule details
    const scheduleStr = formData.schedule || 'Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)';
    const startDate = st.startDate || st.joinDate || formData.startDate || new Date().toISOString().split('T')[0];

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

    // Pro-rated tuition calculation: (Total Fee / 32) * Actual Sessions
    // If sessionsThisCycle < 32, calculate tuition for the remaining sessions
    const sessionRate = (st.customTuitionFee || formData.tuitionFee || 5000000) / 32;
    const proRatedTuition = Math.round(sessionsThisCycle * sessionRate);
    
    // Debt Carry-over: If previous cycle unpaid, carry over debt
    // Assuming debt = full cycle fee if not paid
    const cycleFee = (st.customTuitionFee || formData.tuitionFee || 5000000);
    const carriedOverDebt = isUnpaidForCurrentCycle ? cycleFee : 0;
    const totalBalanceOwed = (isUnpaidForCurrentCycle ? cycleFee : 0) + (sessionsThisCycle < 32 ? proRatedTuition : 0);

    let reminderMessage = '';
    let needsReminder = false;

    if (isUnpaidForCurrentCycle) {
      needsReminder = true;
      reminderMessage = `⚠️ NỢ PHÍ CHU KỲ ${currentCycle - 1}: Đã học sang chu kỳ ${currentCycle}. Nợ: ${cycleFee.toLocaleString('vi-VN')} đ.`;
    } else if (isApproachingCycleEnd) {
      needsReminder = true;
      reminderMessage = `🔔 SẮP HẾT KHÓA: Đã học ${sessionsThisCycle}/32 buổi. Học phí dự kiến: ${proRatedTuition.toLocaleString('vi-VN')} đ.`;
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
      totalBalanceOwed,
    };
  };

  // Generic helper for ALL courses to calculate end date based on class settings
  const calculatePersonalEndDate = (st: Student) => {
    const scheduleStr = formData.schedule || 'Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)';
    const offDates = formData.offDates || []; // Use modal's offDates
    const startDate = st.startDate || st.joinDate || formData.startDate || new Date().toISOString().split('T')[0];
    const totalSessions = formData.totalSessions || 32;

    const schedule = calculateCourseSchedule(
      startDate,
      scheduleStr,
      totalSessions,
      offDates,
      selectedCourseLevel
    );
    return schedule.sessions[schedule.sessions.length - 1]?.date || '';
  };

  // Local state for existing class students being edited
  const [editableStudents, setEditableStudents] = useState<Student[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Batch paste state
  const [pastedStudentsRawText, setPastedStudentsRawText] = useState<string>('');
  const [excludedPastedIndices, setExcludedPastedIndices] = useState<number[]>([]);
  const [pastedDefaultCustomTuition, setPastedDefaultCustomTuition] = useState<string>('');

  // Calculate schedule and estimated end date automatically in real-time
  const calculatedSchedule = useMemo(() => {
    return calculateCourseSchedule(
      formData.startDate,
      formData.schedule,
      formData.totalSessions,
      offDates,
      selectedCourseLevel
    );
  }, [formData.startDate, formData.schedule, formData.totalSessions, offDates, selectedCourseLevel]);

  // Populate form and students when classGroup changes or modal opens
  useEffect(() => {
    if (classGroup && isOpen) {
      // Parse existing teachers list
      let initialTeachers: string[] = [];
      if (classGroup.teacherNames && classGroup.teacherNames.length > 0) {
        initialTeachers = [...classGroup.teacherNames];
      } else if (classGroup.teacherName) {
        initialTeachers = classGroup.teacherName
          .split(/[,;&+]/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      setSelectedTeachers(initialTeachers);

      const detected = detectCourseLevel(classGroup.courseLevel || classGroup.courseName, classGroup.totalSessions);
      setSelectedCourseLevel(detected);
      setOffDates(classGroup.offDates || []);

      // Find matching schedule preset if possible
      const matchPreset = SCHEDULE_PRESETS.find((p) => classGroup.schedule?.includes(p.dayLabels));
      if (matchPreset) {
        setSelectedSchedulePreset(matchPreset.id);
      }

      const defaultTuition = classGroup.tuitionFee || COURSE_LEVEL_CONFIGS[detected]?.standardTuitionFee || 5000000;

      setFormData({
        code: classGroup.code || '',
        name: classGroup.name || '',
        courseName: classGroup.courseName || '',
        courseId: classGroup.courseId || '',
        courseLevel: detected,
        branch: classGroup.branch || 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
        teacherName: classGroup.teacherName || '',
        assistantTeacherName: classGroup.assistantTeacherName || '',
        room: classGroup.room || '',
        schedule: classGroup.schedule || SCHEDULE_PRESETS[0].name,
        startDate: classGroup.startDate || new Date().toISOString().split('T')[0],
        endDate: classGroup.endDate || '',
        totalSessions: classGroup.totalSessions || COURSE_LEVEL_CONFIGS[detected].totalSessions,
        completedSessions: classGroup.completedSessions || 0,
        maxStudents: classGroup.maxStudents || 25,
        tuitionFee: defaultTuition,
        status: classGroup.status || 'Đang diễn ra',
      });

      // Filter and clone students belonging to this class for editable local state
      const classStudents = students.filter(
        (s) => s.classId === classGroup.id || s.className === classGroup.name
      );
      setEditableStudents(JSON.parse(JSON.stringify(classStudents)));
      setOriginalStudentIds(new Set(classStudents.map((s) => s.id)));
      setPastedStudentsRawText('');
      setExcludedPastedIndices([]);
      setExpandedStudentId(classStudents.length > 0 ? classStudents[0].id : null);
      setActiveTab('info');
    }
  }, [classGroup, isOpen]);

  // Parse batch pasted students text
  const parsedPastedStudents = useMemo(() => {
    if (!pastedStudentsRawText.trim()) return [];
    const lines = pastedStudentsRawText.split(/[\n;]/).map((l) => l.trim()).filter(Boolean);
    const result: { name: string; phone?: string; note?: string; customTuitionFee?: number; originalIndex: number }[] = [];

    const defaultFee = pastedDefaultCustomTuition ? Number(pastedDefaultCustomTuition) : formData.tuitionFee;

    lines.forEach((line, idx) => {
      // Clean leading bullet points, numbers e.g. "1.", "1/", "1 -", "-", "+"
      let clean = line.replace(/^[\d]+[\.\)\/\-\:\s]+/, '').replace(/^[\-\+\*•]\s*/, '').trim();
      if (!clean) return;

      // Skip common table headers if user copied them
      const lower = clean.toLowerCase();
      if (
        lower.startsWith('họ và tên') ||
        lower.startsWith('họ tên') ||
        lower.startsWith('tên học sinh') ||
        lower.startsWith('stt') ||
        lower.startsWith('danh sách')
      ) {
        return;
      }

      // Detect phone number if included in line (e.g. "0912345678", "(0988776655)", "+84912345678")
      let phone = '';
      const phoneMatch = clean.match(/(?:(?:\+84|0)[1-9][0-9]{8,9})/);
      if (phoneMatch) {
        phone = phoneMatch[0];
        clean = clean.replace(phone, '').replace(/[\(\)\-\:\,]/g, ' ').trim();
      }

      // Remove extra multiple spaces
      clean = clean.replace(/\s+/g, ' ').trim();

      if (clean.length >= 2) {
        result.push({
          name: clean,
          phone: phone || undefined,
          note: 'Dán nhanh khi cập nhật lớp học',
          customTuitionFee: defaultFee,
          originalIndex: idx,
        });
      }
    });

    return result.filter((_, i) => !excludedPastedIndices.includes(i));
  }, [pastedStudentsRawText, excludedPastedIndices, pastedDefaultCustomTuition, formData.tuitionFee]);

  if (!isOpen || !classGroup) return null;

  const handleSelectCourseLevel = (levelKey: CourseLevelKey) => {
    setSelectedCourseLevel(levelKey);
    const config = COURSE_LEVEL_CONFIGS[levelKey];
    setFormData((prev) => ({
      ...prev,
      courseLevel: levelKey,
      courseName: config.name,
      totalSessions: config.totalSessions,
      tuitionFee: config.standardTuitionFee || 5000000,
    }));
  };

  const handleAddOffDate = () => {
    if (!newOffDateInput) return;
    if (!offDates.includes(newOffDateInput)) {
      setOffDates([...offDates, newOffDateInput]);
    }
    setNewOffDateInput('');
  };

  const handleRemoveOffDate = (dateToRemove: string) => {
    setOffDates(offDates.filter((d) => d !== dateToRemove));
  };

  const handleCourseSelect = (selectedName: string) => {
    const found = courses.find((c) => c.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      courseName: selectedName,
      courseId: found?.id || 'crs-custom',
      totalSessions: found?.totalSessions || prev.totalSessions,
      tuitionFee: found?.tuitionFee || prev.tuitionFee,
    }));
  };

  // Toggle or add teacher to list
  const handleToggleTeacher = (tName: string) => {
    if (!tName.trim()) return;
    const cleanName = tName.trim();
    if (selectedTeachers.includes(cleanName)) {
      const updated = selectedTeachers.filter((t) => t !== cleanName);
      setSelectedTeachers(updated);
      setFormData((prev) => ({ ...prev, teacherName: updated.join(', ') }));
    } else {
      const updated = [...selectedTeachers, cleanName];
      setSelectedTeachers(updated);
      setFormData((prev) => ({ ...prev, teacherName: updated.join(', ') }));
    }
  };

  // Add custom teacher name from input
  const handleAddCustomTeacher = () => {
    if (!customTeacherInput.trim()) return;
    const names = customTeacherInput
      .split(/[,;]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const updated = Array.from(new Set([...selectedTeachers, ...names]));
    setSelectedTeachers(updated);
    setFormData((prev) => ({ ...prev, teacherName: updated.join(', ') }));
    setCustomTeacherInput('');
  };

  // Remove teacher from list
  const handleRemoveTeacher = (tName: string) => {
    const updated = selectedTeachers.filter((t) => t !== tName);
    setSelectedTeachers(updated);
    setFormData((prev) => ({ ...prev, teacherName: updated.join(', ') }));
  };

  // Update a single student's field
  const handleUpdateStudentField = (studentId: string, field: keyof Student, value: any) => {
    setEditableStudents((prev) =>
      prev.map((st) => {
        if (st.id !== studentId) return st;

        const updated = { ...st, [field]: value };

        // When endDate, startDate, or joinDate is modified: automatically calculate sessions & apply pro-rated tuition
        if (field === 'endDate' || field === 'startDate' || field === 'joinDate') {
          const finalStart = field === 'startDate' || field === 'joinDate' ? String(value || '') : (updated.startDate || updated.joinDate || formData.startDate || '');
          const finalEnd = field === 'endDate' ? String(value || '') : (updated.endDate || '');

          if (finalStart && finalEnd) {
            const counted = countSessionsBetweenDates(finalStart, finalEnd, formData.schedule, offDates);
            const actualSessions = Math.max(1, Math.min(32, counted));
            const baseFee = formData.tuitionFee || 14500000;
            const calc = calculateProRatedTuition(baseFee, actualSessions, updated.previousDebt || updated.carriedOverDebt || 0, 32);

            updated.registeredSessions = actualSessions;
            updated.earlyEndSessions = actualSessions;
            updated.customTuitionFee = calc.proRatedTuition;
            updated.courseTuitionFee = calc.proRatedTuition;
            updated.proRatedTuitionFee = calc.proRatedTuition;
            updated.tuitionPayable = calc.totalDue;
            if (updated.tuitionStatus !== 'Đã đóng đủ' && !updated.tuitionPaidDate) {
              updated.balanceOwed = calc.totalDue;
            }
          }
        }

        // When registeredSessions or earlyEndSessions is updated directly
        if (field === 'registeredSessions' || field === 'earlyEndSessions') {
          const sessions = Math.max(1, Math.min(32, Number(value) || 32));
          const baseFee = formData.tuitionFee || 14500000;
          const calc = calculateProRatedTuition(baseFee, sessions, updated.previousDebt || updated.carriedOverDebt || 0, 32);

          updated.registeredSessions = sessions;
          updated.earlyEndSessions = sessions;
          updated.customTuitionFee = calc.proRatedTuition;
          updated.courseTuitionFee = calc.proRatedTuition;
          updated.proRatedTuitionFee = calc.proRatedTuition;
          updated.tuitionPayable = calc.totalDue;
          if (updated.tuitionStatus !== 'Đã đóng đủ' && !updated.tuitionPaidDate) {
            updated.balanceOwed = calc.totalDue;
          }
        }

        // When previous debt is updated
        if (field === 'previousDebt' || field === 'carriedOverDebt') {
          const debt = Math.max(0, Number(value) || 0);
          updated.previousDebt = debt;
          updated.carriedOverDebt = debt;
          const feeNow = updated.customTuitionFee ?? formData.tuitionFee ?? 14500000;
          const currentSessions = updated.registeredSessions ?? updated.earlyEndSessions ?? 32;
          const calc = calculateProRatedTuition(feeNow, currentSessions, debt, 32);
          updated.tuitionPayable = calc.totalDue;
          if (updated.tuitionStatus !== 'Đã đóng đủ' && !updated.tuitionPaidDate) {
            updated.balanceOwed = calc.totalDue;
          }
        }

        // If customTuitionFee is updated manually
        if (field === 'customTuitionFee') {
          const newFee = Number(value) || 0;
          updated.customTuitionFee = newFee;
          updated.courseTuitionFee = newFee;
          const totalWithDebt = newFee + (updated.previousDebt || 0);
          updated.tuitionPayable = totalWithDebt;
          if (updated.tuitionStatus === 'Chưa đóng') {
            updated.balanceOwed = totalWithDebt;
          } else if (updated.tuitionStatus === 'Đã đóng đủ') {
            updated.balanceOwed = 0;
          }
        }

        if (field === 'tuitionStatus') {
          const fee = (updated.customTuitionFee ?? formData.tuitionFee ?? 14500000) + (updated.previousDebt || 0);
          if (value === 'Đã đóng đủ') {
            updated.balanceOwed = 0;
          } else if (value === 'Chưa đóng') {
            updated.balanceOwed = fee;
          }
        }

        if (field === 'tuitionPaidDate') {
          updated.tuitionPaidDate = value;
          if (value && (updated.balanceOwed === 0 || updated.tuitionStatus === 'Chưa đóng')) {
            updated.tuitionStatus = 'Đã đóng đủ';
            updated.balanceOwed = 0;
          }
        }

        return updated;
      })
    );
  };

  // Add one manual new student to class list immediately
  const handleAddManualStudent = () => {
    const randId = `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const codeNum = (students.length + editableStudents.length + 1).toString().padStart(3, '0');
    const newSt: Student = {
      id: randId,
      code: `IDV-HV${codeNum}`,
      name: 'Học viên mới',
      dob: '2008-01-01',
      gender: 'Nam',
      phone: '',
      email: `hocvien${codeNum}@gmail.com`,
      parentName: '',
      parentPhone: '',
      address: formData.branch || 'Hải Phòng',
      classId: classGroup.id,
      className: formData.name,
      courseName: formData.courseName,
      status: 'Đang học',
      joinDate: formData.startDate || new Date().toISOString().split('T')[0],
      tuitionStatus: 'Chưa đóng',
      customTuitionFee: formData.tuitionFee,
      courseTuitionFee: formData.tuitionFee,
      tuitionPayable: formData.tuitionFee,
      balanceOwed: formData.tuitionFee,
      note: 'Thêm thủ công khi chỉnh sửa lớp',
    };

    setEditableStudents((prev) => [newSt, ...prev]);
    setExpandedStudentId(newSt.id);
  };

  // Remove a student from this class (changes status to 'Chờ xếp lớp' and unlinks classId)
  const handleRemoveStudentFromClass = (studentId: string) => {
    setEditableStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              classId: '',
              className: 'Chưa xếp lớp',
              status: 'Chờ xếp lớp',
              waitingForClassId: classGroup.id,
            }
          : st
      )
    );
  };

  // Convert pasted students directly into editable students list
  const handleTransferPastedToEditableList = () => {
    if (parsedPastedStudents.length === 0) return;

    const newStudents: Student[] = parsedPastedStudents.map((item, idx) => {
      const codeNum = (students.length + editableStudents.length + idx + 1).toString().padStart(3, '0');
      const fee = item.customTuitionFee || formData.tuitionFee || 14500000;
      return {
        id: `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        code: `IDV-HV${codeNum}`,
        name: item.name,
        dob: '2008-01-01',
        gender: 'Nam',
        phone: item.phone || '',
        email: `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'hocvien'}${codeNum}@gmail.com`,
        parentName: '',
        parentPhone: item.phone || '',
        address: formData.branch || 'Hải Phòng',
        classId: classGroup.id,
        className: formData.name,
        courseName: formData.courseName,
        status: 'Đang học',
        joinDate: formData.startDate || new Date().toISOString().split('T')[0],
        tuitionStatus: 'Chưa đóng',
        customTuitionFee: fee,
        courseTuitionFee: fee,
        tuitionPayable: fee,
        balanceOwed: fee,
        note: item.note || 'Dán nhanh từ danh sách',
      };
    });

    setEditableStudents((prev) => [...newStudents, ...prev]);
    setPastedStudentsRawText('');
    setExcludedPastedIndices([]);
    if (newStudents.length > 0) {
      setExpandedStudentId(newStudents[0].id);
    }
  };

  // Filtered active students in this class for display
  const activeEnrolledStudents = editableStudents.filter(
    (s) => s.classId === classGroup.id || s.className === formData.name
  );

  const displayedStudents = activeEnrolledStudents.filter((st) => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.code.toLowerCase().includes(q) ||
      st.phone.toLowerCase().includes(q) ||
      st.parentPhone.toLowerCase().includes(q) ||
      (st.parentName && st.parentName.toLowerCase().includes(q))
    );
  });

  // Calculate statistics for students in class
  const studentStats = useMemo(() => {
    const total = activeEnrolledStudents.length + parsedPastedStudents.length;
    const paidCount = activeEnrolledStudents.filter((s) => s.tuitionStatus === 'Đã đóng đủ').length;
    const unpaidCount = activeEnrolledStudents.filter((s) => s.tuitionStatus === 'Chưa đóng' || s.tuitionStatus === 'Còn nợ').length + parsedPastedStudents.length;
    const customFeeCount = activeEnrolledStudents.filter((s) => s.customTuitionFee && s.customTuitionFee !== formData.tuitionFee).length;
    const hasExamDateCount = activeEnrolledStudents.filter((s) => s.examDate || s.examRegisterDate).length;
    return { total, paidCount, unpaidCount, customFeeCount, hasExamDateCount };
  }, [activeEnrolledStudents, parsedPastedStudents, formData.tuitionFee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên lớp học!');
      return;
    }
    if (!formData.courseName.trim()) {
      alert('Vui lòng nhập hoặc chọn khóa học đang học!');
      return;
    }

    // Determine final teacher string and array
    let finalTeachers = [...selectedTeachers];
    if (formData.teacherName.trim() && finalTeachers.length === 0) {
      finalTeachers = formData.teacherName
        .split(/[,;&+]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    const finalTeacherName =
      finalTeachers.length > 0 ? finalTeachers.join(', ') : formData.teacherName.trim() || 'Chưa phân công';

    const finalStudentCount = activeEnrolledStudents.length + parsedPastedStudents.length;

    const updated: ClassGroup = {
      ...classGroup,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      courseId: formData.courseId || 'crs-custom',
      courseName: formData.courseName.trim(),
      courseLevel: selectedCourseLevel,
      currentTermName: selectedCourseLevel,
      branch: formData.branch,
      teacherId: teachers.find((t) => t.name === finalTeachers[0])?.id || 't-multi',
      teacherName: finalTeacherName,
      teacherNames: finalTeachers,
      assistantTeacherName: formData.assistantTeacherName.trim() || undefined,
      room: formData.room,
      schedule: formData.schedule,
      startDate: formData.startDate,
      endDate: calculatedSchedule.estimatedEndDate || formData.endDate,
      totalSessions: Number(formData.totalSessions) || 32,
      completedSessions: Number(formData.completedSessions) || 0,
      maxStudents: Math.max(Number(formData.maxStudents) || 25, finalStudentCount),
      currentStudents: finalStudentCount,
      tuitionFee: Number(formData.tuitionFee) || 0,
      status: formData.status,
      offDates: offDates,
    };

    onUpdateClass(updated, editableStudents, parsedPastedStudents);
    onClose();
  };

  // Quick course suggestions
  const commonCourses = ['PRE', 'INSPIRE', 'DESIRE', 'LUYỆN ĐỀ DRILL'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl w-full max-w-4xl my-2 sm:my-4 md:my-6 flex flex-col min-h-0 max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="shrink-0 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 px-5 py-4 sm:px-6 sm:py-5 text-white flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Edit3 className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Chỉnh Sửa Lớp Học & Học Viên</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-white/15 px-2.5 py-0.5 rounded-full text-purple-100 font-bold border border-white/10">
                  {classGroup.code}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200">
                Sửa thông tin lớp, dán thêm học sinh hàng loạt, cập nhật học phí riêng & lịch thi từng bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="shrink-0 bg-purple-50/80 border-b border-purple-100 px-4 sm:px-6 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>1. Thông tin lớp & Lịch học</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Quản lý học viên & Học phí riêng</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'students' ? 'bg-white text-purple-800' : 'bg-purple-200 text-purple-900'
                }`}
              >
                {studentStats.total} HV
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-purple-900 font-semibold">
            <span>Học phí chuẩn lớp: <strong className="text-emerald-700">{formatVND(formData.tuitionFee)}</strong></span>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 text-xs">
            {/* ================= TAB 1: THÔNG TIN LỚP & LỊCH HỌC ================= */}
            {activeTab === 'info' && (
              <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                {/* Row 1: Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Mã lớp học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-purple-700 uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Tên lớp học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Lớp 76 - IELTS Intensive 6.5+"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Course Level Selection (Khóa 1 - 4) */}
                <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-purple-950 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-700" />
                      <span>Cấp độ Khóa học chuẩn IELTS DƯƠNG VŨ:</span> <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      {COURSE_LEVEL_CONFIGS[selectedCourseLevel].totalSessions} buổi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(COURSE_LEVEL_CONFIGS) as CourseLevelKey[]).map((lvlKey) => {
                      const cfg = COURSE_LEVEL_CONFIGS[lvlKey];
                      const isSelected = selectedCourseLevel === lvlKey;
                      return (
                        <button
                          key={lvlKey}
                          type="button"
                          onClick={() => handleSelectCourseLevel(lvlKey)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                              : 'bg-white text-slate-700 hover:bg-purple-50 border-slate-200'
                          }`}
                        >
                          <div className="font-black text-xs flex items-center justify-between">
                            <span>{lvlKey}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected ? 'bg-white/20 text-purple-100' : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {cfg.totalSessions}b
                            </span>
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 font-semibold truncate ${
                              isSelected ? 'text-purple-100' : 'text-slate-500'
                            }`}
                          >
                            {cfg.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Chọn khóa học mẫu:
                      </label>
                      <select
                        value={formData.courseName}
                        onChange={(e) => handleCourseSelect(e.target.value)}
                        className="w-full bg-white border border-purple-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      >
                        <option value="">-- Chọn khóa học tiêu chuẩn --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.level})
                          </option>
                        ))}
                        {commonCourses.map((cName) => (
                          <option key={cName} value={cName}>
                            {cName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Tên khóa hiển thị (Tùy chỉnh):
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tên khóa học..."
                        value={formData.courseName}
                        onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                        className="w-full bg-white border border-purple-200 rounded-xl p-2.5 font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Teacher Multi-Selection & Custom Teacher Input */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-purple-700" />
                      <span>Giáo viên phụ trách lớp (Có thể chọn nhiều GV cùng dạy):</span>
                    </label>
                    <span className="text-[11px] text-purple-700 font-semibold">
                      Đã chọn: <strong>{selectedTeachers.length}</strong> giáo viên
                    </span>
                  </div>

                  {/* Selected Teachers Badge List */}
                  {selectedTeachers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-purple-50/80 rounded-xl border border-purple-200">
                      {selectedTeachers.map((tName) => (
                        <span
                          key={tName}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{tName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTeacher(tName)}
                            className="hover:text-rose-300 ml-1 p-0.5 rounded cursor-pointer"
                            title="Xóa giáo viên này khỏi lớp"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Available Teachers Chips from System */}
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                      Bấm vào giáo viên để thêm / bỏ phân công:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {teachers.map((t) => {
                        const isSelected = selectedTeachers.includes(t.name);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleToggleTeacher(t.name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                                : 'bg-white text-slate-700 hover:bg-purple-50 border-slate-200'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <span>{t.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Teacher Text Input */}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tự nhập tên giáo viên mới (VD: Thầy John, Cô Mai...)..."
                      value={customTeacherInput}
                      onChange={(e) => setCustomTeacherInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTeacher();
                        }
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTeacher}
                      className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      + Thêm GV
                    </button>
                  </div>
                </div>

                {/* Row 4: Branch, Room, Assistant & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cơ sở học</label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
                    >
                      <option value="Cơ sở 1 - Tô Hiệu (Hải Phòng)">Cơ sở 1 - Tô Hiệu (HP)</option>
                      <option value="Cơ sở 2 - Lạch Tray (Hải Phòng)">Cơ sở 2 - Lạch Tray (HP)</option>
                      <option value="Online Zoom VIP">Online Zoom VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phòng học</label>
                    <input
                      type="text"
                      placeholder="VD: Phòng 201 - IELTS Lab"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Trợ giảng (TA)</label>
                    <input
                      type="text"
                      placeholder="VD: Trần Thùy Linh (TA)"
                      value={formData.assistantTeacherName}
                      onChange={(e) => setFormData({ ...formData, assistantTeacherName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Trạng thái lớp</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ClassGroup['status'] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none text-xs"
                    >
                      <option value="Đang diễn ra">Đang diễn ra</option>
                      <option value="Sắp khai giảng">Sắp khai giảng</option>
                      <option value="Đã kết thúc">Đã kết thúc</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Standard Schedule Selection */}
                <StandardScheduleSelector
                  value={formData.schedule}
                  onChange={(newSchedule) => {
                    setFormData((prev) => ({ ...prev, schedule: newSchedule }));
                  }}
                />

                {/* Row 6: Dates, Sessions & Tuition */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Ngày khai giảng</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Tổng số buổi</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={formData.totalSessions}
                      onChange={(e) => setFormData({ ...formData, totalSessions: Number(e.target.value) || 32 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Đã hoàn thành</label>
                    <input
                      type="number"
                      min={0}
                      max={formData.totalSessions}
                      value={formData.completedSessions}
                      onChange={(e) => setFormData({ ...formData, completedSessions: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-purple-700 font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Học phí lớp chuẩn (VNĐ)</label>
                    <input
                      type="number"
                      step={500000}
                      value={formData.tuitionFee}
                      onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-emerald-700 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Off Dates List */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-purple-700" />
                      <span>Danh sách ngày nghỉ của lớp ({offDates.length} ngày đã dời):</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={newOffDateInput}
                        onChange={(e) => setNewOffDateInput(e.target.value)}
                        className="bg-white text-slate-800 text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddOffDate}
                        className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        + Thêm ngày nghỉ
                      </button>
                    </div>
                  </div>

                  {offDates.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {offDates.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-semibold"
                        >
                          <span>Nghỉ: {formatDateVN(d)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOffDate(d)}
                            className="hover:text-rose-900 ml-0.5 text-rose-400 cursor-pointer"
                            title="Xóa ngày nghỉ này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 2: QUẢN LÝ HỌC VIÊN & HỌC PHÍ RIÊNG ================= */}
            {activeTab === 'students' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Summary Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Tổng học viên
                    </span>
                    <div className="text-lg font-black text-purple-950 mt-0.5">
                      {studentStats.total} <span className="text-xs font-medium text-slate-500">bạn</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Đã đóng đủ
                    </span>
                    <div className="text-lg font-black text-emerald-900 mt-0.5">
                      {studentStats.paidCount} <span className="text-xs font-medium text-slate-500">bạn</span>
                    </div>
                  </div>

                  <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                      Còn nợ học phí
                    </span>
                    <div className="text-lg font-black text-rose-900 mt-0.5">
                      {studentStats.unpaidCount} <span className="text-xs font-medium text-slate-500">bạn</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Học phí riêng / Ưu đãi
                    </span>
                    <div className="text-lg font-black text-amber-900 mt-0.5">
                      {studentStats.customFeeCount} <span className="text-xs font-medium text-slate-500">bạn</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Đã có lịch thi
                    </span>
                    <div className="text-lg font-black text-indigo-900 mt-0.5">
                      {studentStats.hasExamDateCount} <span className="text-xs font-medium text-slate-500">bạn</span>
                    </div>
                  </div>
                </div>

                {/* Section A: Dán nhanh học viên mới (Paste hàng loạt) */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-slate-50 p-4 rounded-2xl border border-indigo-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <label className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                          <span>📋 Dán thêm học sinh vào lớp (Paste hàng loạt từ Excel / Zalo)</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            Tự động trích xuất
                          </span>
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Paste danh sách tên học viên kèm SĐT để nạp nhanh vào lớp này
                        </span>
                      </div>
                    </div>

                    {parsedPastedStudents.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Nhận diện: <strong>{parsedPastedStudents.length}</strong> học viên</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleTransferPastedToEditableList}
                          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          + Nạp vào danh sách ngay
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      value={pastedStudentsRawText}
                      onChange={(e) => {
                        setPastedStudentsRawText(e.target.value);
                        setExcludedPastedIndices([]);
                      }}
                      placeholder="Dán danh sách tên học sinh vào đây (mỗi bạn 1 dòng hoặc cách nhau bởi dấu phẩy, có thể kèm SĐT)...&#10;Ví dụ:&#10;1. Nguyễn Minh Anh - 0987654321&#10;2. Trần Quốc Bảo&#10;3. Lê Thu Hà - 0912345678"
                      className="w-full text-xs font-medium bg-white border border-indigo-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed placeholder:text-slate-400"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-indigo-700 mt-1 gap-1">
                      <span>💡 Tự động lọc bỏ STT (1, 2, 3..), dấu gạch đầu dòng và trích xuất SĐT.</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">Học phí gán cho nhóm dán:</span>
                        <input
                          type="number"
                          placeholder={`Mặc định: ${formatVND(formData.tuitionFee)}`}
                          value={pastedDefaultCustomTuition}
                          onChange={(e) => setPastedDefaultCustomTuition(e.target.value)}
                          className="w-36 bg-white border border-indigo-200 rounded-lg px-2 py-0.5 text-xs text-indigo-900 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview of Parsed Students */}
                  {parsedPastedStudents.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-indigo-200/60 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Học viên mới sẽ được thêm ({parsedPastedStudents.length}):
                        </span>
                        <span className="text-[10px] text-slate-400 italic">Bấm dấu × để bỏ bớt nếu dán nhầm</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white/80 rounded-xl border border-indigo-100">
                        {parsedPastedStudents.map((st, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-900 rounded-lg text-xs font-semibold"
                          >
                            <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-black flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span>{st.name}</span>
                            {st.phone && (
                              <span className="text-[10px] font-mono text-indigo-600 bg-white px-1 rounded">
                                {st.phone}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setExcludedPastedIndices([...excludedPastedIndices, i])}
                              className="text-indigo-400 hover:text-rose-600 ml-0.5 p-0.5 rounded cursor-pointer transition-colors"
                              title="Bỏ học sinh này"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section B: Sửa chi tiết từng học sinh trong lớp */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-700" />
                        <span>Danh sách & Sửa thông tin từng bạn trong lớp ({activeEnrolledStudents.length} học viên)</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Search Student Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Tìm theo tên, SĐT, mã..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>

                      {/* Add Single Manual Student Button */}
                      <button
                        type="button"
                        onClick={handleAddManualStudent}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Thêm 1 bạn</span>
                      </button>
                    </div>
                  </div>

                  {/* Student Cards List */}
                  <div className="space-y-3">
                    {displayedStudents.map((st, idx) => {
                      const isExpanded = expandedStudentId === st.id;
                      const hasCustomFee = st.customTuitionFee && st.customTuitionFee !== formData.tuitionFee;
                      const effectiveTuition = st.customTuitionFee ?? (formData.tuitionFee || 14500000);
                      const isStudentDisabled = isTeacher && originalStudentIds.has(st.id);
                      const k4Info = getStudentK4ProgressInfo(st);

                      const countedSessionsFromDates = (st.startDate || st.joinDate) && st.endDate
                        ? countSessionsBetweenDates(st.startDate || st.joinDate || '', st.endDate, formData.schedule, offDates)
                        : 32;
                      const effectiveActualSessions = typeof st.registeredSessions === 'number'
                        ? st.registeredSessions
                        : (typeof st.earlyEndSessions === 'number'
                            ? st.earlyEndSessions
                            : (countedSessionsFromDates < 32 ? countedSessionsFromDates : 32));

                      // Base tuition for 32 standard sessions must be the class tuition fee
                      const standardFullCourseFee = formData.tuitionFee || 14500000;
                      const proRatedCalc = calculateProRatedTuition(
                        standardFullCourseFee,
                        effectiveActualSessions,
                        st.previousDebt || st.carriedOverDebt || (k4Info.isUnpaidForCurrentCycle ? standardFullCourseFee : 0),
                        32
                      );

                      return (
                        <div
                          key={st.id}
                          className={`rounded-2xl border transition-all ${
                            isExpanded
                              ? 'bg-white border-purple-400 shadow-md ring-1 ring-purple-200'
                              : 'bg-slate-50/80 hover:bg-white border-slate-200'
                          }`}
                        >
                          {/* Student Header Bar */}
                          <div
                            className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none"
                            onClick={() => setExpandedStudentId(isExpanded ? null : st.id)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                    {st.name}
                                  </span>
                                  <span className="font-mono text-[11px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    {st.code}
                                  </span>
                                  {st.gender && (
                                    <span className="text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                                      {st.gender}
                                    </span>
                                  )}
                                  {st.phone && (
                                    <span className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {st.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                              {/* Custom Fee Badge */}
                              {hasCustomFee && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                                  <Award className="w-3 h-3 text-amber-600" />
                                  <span>Học phí riêng: {formatVND(effectiveTuition)}</span>
                                </span>
                              )}

                              {/* Exam Date Badge */}
                              {(st.examDate || st.examRegisterDate) && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-0.5">
                                  <CalendarDays className="w-3 h-3 text-indigo-600" />
                                  <span>Thi: {st.examDate ? formatDateVN(st.examDate) : 'Đã ĐK'}</span>
                                </span>
                              )}

                              {/* Tuition Status Badge */}
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  st.tuitionStatus === 'Đã đóng đủ'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : st.tuitionStatus === 'Còn nợ'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {st.tuitionStatus} {st.balanceOwed > 0 ? `(Nợ ${formatVND(st.balanceOwed)})` : ''}
                              </span>

                              {/* Expand / Collapse Button */}
                              <button
                                type="button"
                                className="p-1 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Full Student Editor Details */}
                          {isExpanded && (
                            <div className="p-4 pt-2 border-t border-purple-100 bg-white rounded-b-2xl space-y-4 animate-in fade-in">
                              {isStudentDisabled && (
                                <div className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold p-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Tài khoản Giáo viên chỉ xem thông tin, không có quyền chỉnh sửa học viên đã có.</span>
                                </div>
                              )}
                              {/* Row 1: Personal Info & Contact */}
                              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-purple-700" />
                                  <span>1. Thông tin cá nhân & Liên hệ</span>
                                </span>

                                 <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Họ và tên học viên <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={st.name}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'name', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      required
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Giới tính
                                    </label>
                                    <select
                                      value={st.gender}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'gender', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    >
                                      <option value="Nam">Nam</option>
                                      <option value="Nữ">Nữ</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Ngày sinh
                                    </label>
                                    <input
                                      type="date"
                                      value={st.dob || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'dob', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Số điện thoại học sinh
                                    </label>
                                    <input
                                      type="tel"
                                      placeholder="0912..."
                                      value={st.phone || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'phone', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Họ tên phụ huynh
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="VD: Nguyễn Văn Nam (Bố)"
                                      value={st.parentName || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'parentName', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Số điện thoại phụ huynh
                                    </label>
                                    <input
                                      type="tel"
                                      placeholder="VD: 0987..."
                                      value={st.parentPhone || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'parentPhone', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Địa chỉ / Khu vực
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="VD: Lê Chân, Hải Phòng"
                                      value={st.address || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'address', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: Custom Tuition & Payment Status */}
                              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                  <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                                    <span>2. Học phí riêng & Tình trạng nộp học phí</span>
                                  </span>
                                  <span className="text-[10px] text-amber-800 font-semibold">
                                    Học phí lớp chuẩn: <strong>{formatVND(formData.tuitionFee)}</strong>
                                  </span>
                                </div>

                                {/* Khóa 4 progress and auto-calculate info inside editor modal */}
                                {k4Info.isK4 && (
                                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="bg-blue-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">
                                          🎯 CHU KỲ {k4Info.currentCycle}
                                        </span>
                                        <span className="font-extrabold text-blue-900">
                                          Tiến độ học viên: {k4Info.attendedCount}/32b (Buổi {k4Info.sessionsThisCycle} của CK này)
                                        </span>
                                      </div>
                                      {k4Info.needsReminder && (
                                        <p className="text-[11px] font-black text-rose-700 animate-pulse">
                                          {k4Info.reminderMessage}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-[11px] bg-white px-2 py-1 rounded border border-blue-200">
                                      <span className="font-bold text-slate-500">KT CK {k4Info.currentCycle}:</span>{' '}
                                      <strong className="text-blue-700 font-mono">{formatDateVN(k4Info.personalEndDate)}</strong>
                                    </div>
                                    <div className="text-[11px] bg-white px-2 py-1 rounded border border-amber-200">
                                      <span className="font-bold text-slate-500">Học phí dự tính:</span>{' '}
                                      <strong className="text-amber-700 font-mono">{(k4Info.totalBalanceOwed || 0).toLocaleString('vi-VN')} đ</strong>
                                    </div>
                                  </div>
                                )}

                                {/* Auto Pro-rated Tuition & Previous Debt Carry-over Box */}
                                <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-purple-50/90 p-3.5 rounded-xl border border-emerald-200/90 space-y-3 shadow-2xs">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-emerald-200/60">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">
                                        ⚡
                                      </span>
                                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                                        Tự động tính học phí theo buổi & Cộng nợ khóa trước
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-800 font-bold bg-white/90 px-2 py-0.5 rounded-md border border-emerald-200">
                                      Đơn giá TB: <strong className="text-emerald-900 font-black">{formatVND(proRatedCalc.perSessionRate)}/buổi</strong> (32 buổi chuẩn)
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Ô 1: Số buổi học đăng ký / kết thúc sớm */}
                                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 space-y-1.5">
                                      <label className="text-[11px] font-bold text-slate-700 block">
                                        Số buổi học (nếu &lt; 32 buổi):
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min={1}
                                          max={32}
                                          value={st.registeredSessions ?? (st.earlyEndSessions ?? (countedSessionsFromDates < 32 ? countedSessionsFromDates : 32))}
                                          onChange={(e) => {
                                            const sessions = Math.max(1, Math.min(32, parseInt(e.target.value, 10) || 32));
                                            handleUpdateStudentField(st.id, 'registeredSessions', sessions);
                                            handleUpdateStudentField(st.id, 'earlyEndSessions', sessions);
                                            const newCalc = calculateProRatedTuition(standardFullCourseFee, sessions, st.previousDebt || 0, 32);
                                            handleUpdateStudentField(st.id, 'proRatedTuitionFee', newCalc.proRatedTuition);
                                          }}
                                          className="w-20 bg-emerald-50/60 border border-emerald-300 rounded-lg px-2 py-1 text-xs font-black text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                                          disabled={isStudentDisabled}
                                        />
                                        <span className="text-[11px] font-bold text-slate-500">/ 32 buổi</span>
                                      </div>
                                      <div className="flex items-center gap-1 flex-wrap text-[9px]">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateStudentField(st.id, 'registeredSessions', 32);
                                            handleUpdateStudentField(st.id, 'earlyEndSessions', 32);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                                          disabled={isStudentDisabled}
                                        >
                                          32b (Đủ)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateStudentField(st.id, 'registeredSessions', 24);
                                            handleUpdateStudentField(st.id, 'earlyEndSessions', 24);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold cursor-pointer"
                                          disabled={isStudentDisabled}
                                        >
                                          24b
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateStudentField(st.id, 'registeredSessions', 16);
                                            handleUpdateStudentField(st.id, 'earlyEndSessions', 16);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold cursor-pointer"
                                          disabled={isStudentDisabled}
                                        >
                                          16b
                                        </button>
                                        {countedSessionsFromDates < 32 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleUpdateStudentField(st.id, 'registeredSessions', countedSessionsFromDates);
                                              handleUpdateStudentField(st.id, 'earlyEndSessions', countedSessionsFromDates);
                                            }}
                                            className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold cursor-pointer"
                                            disabled={isStudentDisabled}
                                          >
                                            Theo ngày ({countedSessionsFromDates}b)
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Ô 2: Nợ học phí khóa trước cộng dồn sang chu kỳ mới */}
                                    <div className="bg-white p-2.5 rounded-lg border border-purple-200/80 space-y-1.5">
                                      <label className="text-[11px] font-bold text-slate-700 block">
                                        Nợ học phí khóa trước (nếu có):
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          step={100000}
                                          value={st.previousDebt ?? 0}
                                          onChange={(e) => {
                                            const debt = Math.max(0, parseInt(e.target.value, 10) || 0);
                                            handleUpdateStudentField(st.id, 'previousDebt', debt);
                                            handleUpdateStudentField(st.id, 'carriedOverDebt', debt);
                                          }}
                                          className="w-full bg-purple-50/60 border border-purple-300 rounded-lg px-2 py-1 text-xs font-black text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                          placeholder="0 đ"
                                          disabled={isStudentDisabled}
                                        />
                                      </div>
                                      <div className="flex items-center gap-1 text-[9px]">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateStudentField(st.id, 'previousDebt', formData.tuitionFee);
                                            handleUpdateStudentField(st.id, 'carriedOverDebt', formData.tuitionFee);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 font-semibold cursor-pointer"
                                          disabled={isStudentDisabled}
                                        >
                                          +1 Khóa ({formatVND(formData.tuitionFee)})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateStudentField(st.id, 'previousDebt', 0);
                                            handleUpdateStudentField(st.id, 'carriedOverDebt', 0);
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                          disabled={isStudentDisabled}
                                        >
                                          Xóa nợ cũ
                                        </button>
                                      </div>
                                    </div>

                                    {/* Ô 3: Số tiền tự động nhảy ra & nút Áp dụng */}
                                    <div className="bg-white p-2.5 rounded-lg border border-emerald-300 space-y-1.5 flex flex-col justify-between">
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-500 block">
                                          {proRatedCalc.isEarlyEnd ? `Số tiền tự tính (${proRatedCalc.actualSessions} buổi):` : 'Học phí chuẩn khóa:'}
                                        </span>
                                        <div className="text-sm font-black text-emerald-700">
                                          {formatVND(proRatedCalc.proRatedTuition)}
                                        </div>
                                        {proRatedCalc.previousDebt > 0 && (
                                          <div className="text-[10px] font-bold text-purple-700 mt-0.5">
                                            + Nợ khóa trước: {formatVND(proRatedCalc.previousDebt)}
                                            <div className="text-[11px] font-black text-rose-700">
                                              = Tổng nộp: {formatVND(proRatedCalc.totalDue)}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {!isStudentDisabled && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateStudentField(st.id, 'customTuitionFee', proRatedCalc.proRatedTuition);
                                            handleUpdateStudentField(st.id, 'registeredSessions', proRatedCalc.actualSessions);
                                            handleUpdateStudentField(st.id, 'proRatedTuitionFee', proRatedCalc.proRatedTuition);
                                            if (proRatedCalc.previousDebt > 0) {
                                              handleUpdateStudentField(st.id, 'balanceOwed', proRatedCalc.totalDue);
                                              handleUpdateStudentField(st.id, 'tuitionStatus', 'Chưa đóng');
                                            } else {
                                              handleUpdateStudentField(st.id, 'balanceOwed', proRatedCalc.proRatedTuition);
                                            }
                                          }}
                                          className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg transition-all shadow-xs cursor-pointer text-center flex items-center justify-center gap-1"
                                        >
                                          <span>⚡ Áp dụng số tiền này</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Breakdown description */}
                                  <div className="text-[10px] text-slate-600 flex items-center gap-2 flex-wrap bg-white/70 p-2 rounded-lg border border-emerald-100">
                                    <span className="font-bold text-emerald-900">Chi tiết tính:</span>
                                    <span>
                                      {proRatedCalc.actualSessions} buổi × {formatVND(proRatedCalc.perSessionRate)} = <strong>{formatVND(proRatedCalc.proRatedTuition)}</strong>
                                    </span>
                                    {proRatedCalc.previousDebt > 0 && (
                                      <span className="text-purple-800 font-bold">
                                        + {formatVND(proRatedCalc.previousDebt)} (nợ khóa trước) = <strong className="text-rose-700">{formatVND(proRatedCalc.totalDue)}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Học phí riêng của học viên (VNĐ):
                                    </label>
                                    <input
                                      type="number"
                                      step={100000}
                                      placeholder={String(formData.tuitionFee)}
                                      value={st.customTuitionFee ?? formData.tuitionFee}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'customTuitionFee', Number(e.target.value))}
                                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                    {/* Quick Preset Buttons for Custom Fee */}
                                    {!isStudentDisabled && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStudentField(st.id, 'customTuitionFee', formData.tuitionFee)}
                                          className="text-[9px] bg-white text-slate-600 hover:text-purple-700 px-1.5 py-0.5 rounded border border-slate-200 cursor-pointer"
                                        >
                                          Chuẩn ({formatVND(formData.tuitionFee)})
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStudentField(st.id, 'customTuitionFee', Math.round(formData.tuitionFee * 0.9))}
                                          className="text-[9px] bg-white text-amber-700 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 cursor-pointer"
                                        >
                                          -10%
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStudentField(st.id, 'customTuitionFee', Math.round(formData.tuitionFee * 0.8))}
                                          className="text-[9px] bg-white text-amber-700 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 cursor-pointer"
                                        >
                                          -20%
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Trạng thái học phí
                                    </label>
                                    <select
                                      value={st.tuitionStatus}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'tuitionStatus', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    >
                                      <option value="Đã đóng đủ">Đã đóng đủ (0đ nợ)</option>
                                      <option value="Còn nợ">Còn nợ (Đóng 1 phần)</option>
                                      <option value="Chưa đóng">Chưa đóng</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Số tiền còn nợ (VNĐ)
                                    </label>
                                    <input
                                      type="number"
                                      step={100000}
                                      value={st.balanceOwed || 0}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'balanceOwed', Number(e.target.value))}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-rose-700 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                                      <span>💳 Ngày nộp học phí:</span>
                                      {st.tuitionPaidDate && (
                                        <span className="text-[9px] text-emerald-600 font-bold">✓ Đã nộp</span>
                                      )}
                                    </label>
                                    <input
                                      type="date"
                                      value={st.tuitionPaidDate || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateStudentField(st.id, 'tuitionPaidDate', val);
                                        if (val) {
                                          handleUpdateStudentField(st.id, 'tuitionStatus', 'Đã đóng đủ');
                                          handleUpdateStudentField(st.id, 'balanceOwed', 0);
                                        }
                                      }}
                                      className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-xs font-semibold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                      title="Chọn ngày nộp học phí"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Hạn nộp / Ngày hẹn nộp
                                    </label>
                                    <input
                                      type="date"
                                      value={st.tuitionPromiseDate || st.tuitionDeadlineDate || ''}
                                      onChange={(e) => {
                                        handleUpdateStudentField(st.id, 'tuitionPromiseDate', e.target.value);
                                        handleUpdateStudentField(st.id, 'tuitionDeadlineDate', e.target.value);
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>
                                </div>

                                {/* Student-specific Dates Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/50">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      📅 Ngày bắt đầu học riêng:
                                    </label>
                                    <input
                                      type="date"
                                      value={st.startDate || st.joinDate || ''}
                                      onChange={(e) => {
                                        handleUpdateStudentField(st.id, 'startDate', e.target.value);
                                        handleUpdateStudentField(st.id, 'joinDate', e.target.value);
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center justify-between">
                                      <span>📅 Ngày kết thúc khóa riêng:</span>
                                      {st.endDate !== calculatePersonalEndDate(st) && (
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStudentField(st.id, 'endDate', calculatePersonalEndDate(st))}
                                          className="text-[9px] text-blue-700 font-extrabold hover:underline"
                                        >
                                          🤖 Lấy ngày tự tính
                                        </button>
                                      )}
                                    </label>
                                    <input
                                      type="date"
                                      value={st.endDate || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'endDate', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>
                                </div>

                                {/* Tuition Reminder Note & Promise Note */}
                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    Ghi chú nhắc nhở học phí / Lịch hẹn phụ huynh nộp phí:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="VD: Phụ huynh hẹn chuyển khoản trước buổi 3; Đã gửi tin nhắn Zalo nhắc lần 1..."
                                    value={st.tuitionReminderNote || st.tuitionPromiseNote || ''}
                                    onChange={(e) => {
                                      handleUpdateStudentField(st.id, 'tuitionReminderNote', e.target.value);
                                      handleUpdateStudentField(st.id, 'tuitionPromiseNote', e.target.value);
                                    }}
                                    className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none placeholder:text-slate-400 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    disabled={isStudentDisabled}
                                  />
                                </div>
                              </div>

                              {/* Row 3: Exam Registration Date, Official Exam Date & Learning Note */}
                              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80 space-y-3">
                                <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                  <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                                  <span>3. Lịch thi chứng chỉ & Ghi chú học tập</span>
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Ngày đăng ký thi
                                    </label>
                                    <input
                                      type="date"
                                      value={st.examRegisterDate || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'examRegisterDate', e.target.value)}
                                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Ngày thi (IELTS / Cambridge / Cuối khóa)
                                    </label>
                                    <input
                                      type="date"
                                      value={st.examDate || ''}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'examDate', e.target.value)}
                                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs font-bold text-indigo-900 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Trạng thái trong lớp
                                    </label>
                                    <select
                                      value={st.status}
                                      onChange={(e) => handleUpdateStudentField(st.id, 'status', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                      disabled={isStudentDisabled}
                                    >
                                      <option value="Đang học">Đang học</option>
                                      <option value="Bảo lưu">Bảo lưu</option>
                                      <option value="Chờ xếp lớp">Chờ lớp sau</option>
                                      <option value="Đã nghỉ học">Đã nghỉ học</option>
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                    Ghi chú cá nhân / mục tiêu điểm số:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="VD: Mục tiêu IELTS 6.5 Speaking; Cần chú ý phần phát âm và từ vựng B2..."
                                    value={st.note || ''}
                                    onChange={(e) => handleUpdateStudentField(st.id, 'note', e.target.value)}
                                    className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none placeholder:text-slate-400 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    disabled={isStudentDisabled}
                                  />
                                </div>
                              </div>

                              {/* Student Row Actions */}
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-slate-400">
                                  Mã hệ thống: <span className="font-mono">{st.id}</span>
                                </span>
                                {!isStudentDisabled && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStudentFromClass(st.id)}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1 rounded-lg border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Rút học viên này khỏi lớp</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {displayedStudents.length === 0 && (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">Không tìm thấy học viên nào phù hợp</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Dán danh sách ở trên hoặc bấm "+ Thêm 1 bạn" để thêm học sinh vào lớp
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons Fixed Footer */}
          <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
            <div className="text-[11px] text-slate-600 font-medium hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Sĩ số lớp sau khi lưu: <strong>{studentStats.total} học viên</strong>{' '}
                {parsedPastedStudents.length > 0 && `(${parsedPastedStudents.length} bạn dán mới)`}
              </span>
            </div>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi lớp & học viên</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
