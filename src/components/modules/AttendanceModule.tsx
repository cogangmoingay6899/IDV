import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck2,
  Users,
  Check,
  Clock,
  UserX,
  AlertCircle,
  Save,
  Send,
  Sparkles,
  Plus,
  GraduationCap,
  Building2,
  ShieldAlert,
  UserCheck,
  UserPlus,
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  History,
  FileSpreadsheet,
  FileEdit,
  PenTool,
  MessageCircle,
  Share2,
  Copy,
  ExternalLink,
  X,
  CreditCard,
  Coins,
  Layers,
  Sliders,
  ListChecks,
} from 'lucide-react';
import { AttendanceRecord, ClassGroup, Student, AuthUser, Teacher, ExamScore } from '../../types';
import { CreateTeacherModal } from '../modals/CreateTeacherModal';
import { ClassScoreExportModal } from '../modals/ClassScoreExportModal';
import { HomeworkConfigModal } from '../modals/HomeworkConfigModal';
import { formatDateVN } from '../../utils/courseSchedule';

interface AttendanceModuleProps {
  classes: ClassGroup[];
  students: Student[];
  teachers?: Teacher[];
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  onAddExamScore?: (exam: ExamScore) => void;
  onOpenCreateClass?: () => void;
  currentUser?: AuthUser;
}

const COMMON_SKILLS = [
  'Từ vựng',
  'Nghe',
  'Đọc',
  'Nói',
  'Viết',
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
  'Phát âm': '🎙️',
  'Ngữ pháp': '✏️',
  'Ôn tập': '🔄',
};

export interface StudentRowState {
  status: AttendanceRecord['status'];
  skillScores: Record<string, string>;
  penaltyCopies: string;
  penaltyFee: string;
  previousDebt: string; // Nợ chưa nộp các buổi trước
  penaltyBankAccount: string;
  feedback: string;
  homeworkStatus: 'Đã làm' | 'Thiếu' | 'Chưa làm';
  missingHomeworkItems?: string[]; // Danh sách các đề mục BTVN bị thiếu (VD: Chép phạt, Chữa bài...)
  quizletStatus: 'Đã học' | 'Chưa học';
  note: string;
}

const DEFAULT_HOMEWORK_ITEMS = ['Nghe', 'Nói', 'Đọc', 'Viết', 'Chép phạt', 'Chữa bài'];

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  classes,
  students,
  teachers = [],
  attendanceRecords,
  onSaveAttendance,
  onAddTeacher,
  onAddExamScore,
  onOpenCreateClass,
  currentUser,
}) => {
  // If teacher, filter classes if any match teacherId, otherwise show all classes
  const isTeacher = currentUser?.role === 'teacher';
  const availableClasses = isTeacher && currentUser?.teacherId
    ? (classes.some((c) => c.teacherId === currentUser.teacherId)
        ? classes.filter((c) => c.teacherId === currentUser.teacherId)
        : classes)
    : classes;

  const [selectedClassId, setSelectedClassId] = useState<string>(availableClasses[0]?.id || '');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [teacherName, setTeacherName] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Từ vựng', 'Nghe', 'Đọc']);
  const [lessonTopic, setLessonTopic] = useState<string>('');
  const [totalPenaltyAmount, setTotalPenaltyAmount] = useState<string>('0');
  const [penaltyBankAccount, setPenaltyBankAccount] = useState<string>(() => {
    return localStorage.getItem('ielts_penalty_bank_account') || '0798934698 - MB Bank (IELTS DƯƠNG VŨ)';
  });

  const [skillTotalQuestions, setSkillTotalQuestions] = useState<Record<string, string>>({
    'Từ vựng': '30',
    'Nghe': '40',
    'Đọc': '40',
    'Viết': '10',
    'Nói': '10',
    'Phát âm': '20',
    'Ngữ pháp': '30',
    'Ôn tập': '50',
  });

  const handleSkillTotalQuestionsChange = (skill: string, total: string) => {
    setSkillTotalQuestions((prev) => ({
      ...prev,
      [skill]: total,
    }));
  };

  const handlePenaltyBankChange = (newAccount: string) => {
    setPenaltyBankAccount(newAccount);
    localStorage.setItem('ielts_penalty_bank_account', newAccount);
  };
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState(false);

  // Homework items state (default: Nghe, Nói, Đọc, Viết, Chép phạt, Chữa bài)
  const [homeworkItems, setHomeworkItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('idv_homework_items');
      return saved ? JSON.parse(saved) : DEFAULT_HOMEWORK_ITEMS;
    } catch {
      return DEFAULT_HOMEWORK_ITEMS;
    }
  });
  const [isHwConfigModalOpen, setIsHwConfigModalOpen] = useState(false);

  // Zalo Message Modals
  const [selectedStudentForZalo, setSelectedStudentForZalo] = useState<Student | null>(null);
  const [isClassZaloModalOpen, setIsClassZaloModalOpen] = useState(false);
  const [copiedZaloId, setCopiedZaloId] = useState<string | null>(null);

  // Sync selectedClassId if list changes
  useEffect(() => {
    if (!availableClasses.some((c) => c.id === selectedClassId) && availableClasses.length > 0) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [availableClasses, selectedClassId]);

  const selectedClass = availableClasses.find((c) => c.id === selectedClassId) || classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((s) => s.classId === selectedClassId && s.status !== 'Đã nghỉ học');

  // Auto set teacher name when class changes or user is teacher
  useEffect(() => {
    if (isTeacher && currentUser?.name) {
      setTeacherName(currentUser.name);
    } else if (selectedClass?.teacherName) {
      setTeacherName(selectedClass.teacherName);
    } else if (teachers.length > 0) {
      setTeacherName(teachers[0].name);
    }
  }, [selectedClassId, isTeacher, currentUser]);

  const hasWritingSkill = selectedSkills.includes('Viết');

  const [studentRows, setStudentRows] = useState<Record<string, StudentRowState>>({});

  // Parse penalty amount helper
  const parsePenaltyAmount = (val?: string | number): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().trim().toLowerCase();
    if (str === '0' || str === '0 đ' || str === '0đ' || str === '' || str === '-') return 0;
    if (str.endsWith('k') || str.includes('k')) {
      const n = parseFloat(str.replace('k', '').replace(/,/g, '.'));
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
    return totalCalculatedPenaltyFee > 0 ? `${totalCalculatedPenaltyFee.toLocaleString('vi-VN')} đ` : '0 đ';
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
    return totalCalculatedPreviousDebt > 0 ? `${totalCalculatedPreviousDebt.toLocaleString('vi-VN')} đ` : '0 đ';
  }, [totalCalculatedPreviousDebt]);

  const countStudentsWithPreviousDebt = useMemo(() => {
    return classStudents.filter((st) => parsePenaltyAmount(studentRows[st.id]?.previousDebt) > 0).length;
  }, [classStudents, studentRows]);

  const grandTotalReceivable = totalCalculatedPenaltyFee + totalCalculatedPreviousDebt;
  const formattedGrandTotalReceivable = grandTotalReceivable > 0 ? `${grandTotalReceivable.toLocaleString('vi-VN')} đ` : '0 đ';

  // Populate data when class or date changes
  useEffect(() => {
    const initial: Record<string, StudentRowState> = {};
    classStudents.forEach((st) => {
      const existing = attendanceRecords.find(
        (r) => r.classId === selectedClassId && r.studentId === st.id && r.date === currentDate
      );

      if (existing) {
        if (existing.teacherName) setTeacherName(existing.teacherName);
        if (existing.skillsTaught && existing.skillsTaught.length > 0) {
          setSelectedSkills(existing.skillsTaught);
        } else if (existing.skillTaught) {
          setSelectedSkills([existing.skillTaught]);
        }
      }

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
      const initialPenaltyFee = existing?.penaltyFee !== undefined ? String(existing.penaltyFee) : '0 đ';
      
      // Auto-populate previous debt from record, prior attendance records, or balanceOwed
      let initialPreviousDebt = '0 đ';
      if (existing?.previousDebt !== undefined) {
        initialPreviousDebt = String(existing.previousDebt);
      } else {
        const priorRecords = attendanceRecords
          .filter(
            (r) =>
              r.classId === selectedClassId &&
              r.studentId === st.id &&
              (r.date < currentDate || r.sessionNumber < sessionNumber)
          )
          .sort((a, b) => b.sessionNumber - a.sessionNumber || b.date.localeCompare(a.date));

        if (priorRecords.length > 0) {
          const lastRec = priorRecords[0];
          const priorPenalty = parsePenaltyAmount(lastRec.penaltyFee);
          const priorDebt = parsePenaltyAmount(lastRec.previousDebt);
          const sumDebt = priorPenalty + priorDebt;
          if (sumDebt > 0) {
            initialPreviousDebt = `${sumDebt.toLocaleString('vi-VN')} đ`;
          }
        } else if (st.balanceOwed && st.balanceOwed > 0) {
          initialPreviousDebt = `${st.balanceOwed.toLocaleString('vi-VN')} đ`;
        }
      }

      const initialPenaltyStk = existing?.penaltyBankAccount || '';
      const initialHw = (existing?.homeworkStatus as 'Đã làm' | 'Thiếu' | 'Chưa làm') || 'Đã làm';
      const initialMissingHw = (existing?.missingHomeworkItems as string[]) || [];
      const initialQuizlet = (existing?.quizletStatus as 'Đã học' | 'Chưa học') || 'Đã học';

      if (existing?.skillTotalQuestions) {
        setSkillTotalQuestions((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(existing.skillTotalQuestions || {}).map(([k, v]) => [k, String(v)])
          ),
        }));
      }

      initial[st.id] = {
        status: existing?.status || 'Có mặt',
        skillScores: initialSkillScores,
        penaltyCopies: initialPenalty,
        penaltyFee: initialPenaltyFee,
        previousDebt: initialPreviousDebt,
        penaltyBankAccount: initialPenaltyStk,
        feedback: existing?.teacherNote || '',
        homeworkStatus: initialHw,
        missingHomeworkItems: initialMissingHw,
        quizletStatus: initialQuizlet,
        note: existing?.note || '',
      };
    });
    setStudentRows(initial);
  }, [selectedClassId, currentDate, classStudents.length]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      let nextSkills: string[];
      if (prev.includes(skill)) {
        if (prev.length === 1) return prev;
        nextSkills = prev.filter((s) => s !== skill);
      } else {
        nextSkills = [...prev, skill];
      }

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

  const handleSetAllPenaltyFees = (fee: string) => {
    setTotalPenaltyAmount(fee);
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], penaltyFee: fee };
        }
      });
      return next;
    });
    setToastMessage(`Đã gán tiền phạt ${fee} cho cả lớp!`);
    setTimeout(() => setToastMessage(null), 2000);
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
    handlePenaltyBankChange(stk);
    setStudentRows((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        if (next[st.id]) {
          next[st.id] = { ...next[st.id], penaltyBankAccount: stk };
        }
      });
      return next;
    });
    setToastMessage(`Đã đồng bộ STK nộp phạt cho cả lớp!`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleToggleMissingHwItem = (studentId: string, item: string) => {
    setStudentRows((prev) => {
      const currentRow = prev[studentId];
      if (!currentRow) return prev;
      const currentMissing = currentRow.missingHomeworkItems || [];
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

  const calculateStudentAverage = (row: StudentRowState | undefined): string => {
    if (!row || !row.skillScores) return '-';
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
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, StudentRowState> = {};
    classStudents.forEach((st) => {
      updated[st.id] = {
        status: 'Có mặt',
        skillScores: studentRows[st.id]?.skillScores || {},
        penaltyCopies: studentRows[st.id]?.penaltyCopies || '0',
        penaltyFee: studentRows[st.id]?.penaltyFee || totalPenaltyAmount || '0 đ',
        previousDebt: studentRows[st.id]?.previousDebt || '0 đ',
        penaltyBankAccount: studentRows[st.id]?.penaltyBankAccount || penaltyBankAccount || '',
        feedback: studentRows[st.id]?.feedback || '',
        homeworkStatus: studentRows[st.id]?.homeworkStatus || 'Đã làm',
        quizletStatus: studentRows[st.id]?.quizletStatus || 'Đã học',
        note: studentRows[st.id]?.note || '',
      };
    });
    setStudentRows(updated);
  };

  const handleSave = () => {
    if (!selectedClassId) {
      alert('Vui lòng chọn lớp học trước khi lưu!');
      return;
    }

    if (classStudents.length === 0) {
      alert('Lớp học này chưa có học viên để nhập điểm & điểm danh.');
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
      const parsedPenalty = row?.penaltyCopies !== '' && !isNaN(Number(row?.penaltyCopies)) ? Number(row.penaltyCopies) : 0;

      return {
        id: `att-${Date.now()}-${st.id}`,
        classId: selectedClassId,
        date: currentDate,
        sessionNumber: sessionNumber,
        studentId: st.id,
        studentName: st.name,
        status: row?.status || 'Có mặt',
        note: lessonTopic,
        teacherNote: row?.feedback ? row.feedback.trim() : '',
        teacherName: teacherName || selectedClass?.teacherName || 'IELTS DƯƠNG VŨ',
        skillTaught: selectedSkills.join(', '),
        skillsTaught: selectedSkills,
        skillScores: parsedScores,
        score: avgScore,
        penaltyCopies: hasWritingSkill ? parsedPenalty : 0,
        penaltyFee: row?.penaltyFee || totalPenaltyAmount || '0',
        previousDebt: row?.previousDebt || '0 đ',
        penaltyBankAccount: row?.penaltyBankAccount || penaltyBankAccount || '',
        skillTotalQuestions: skillTotalQuestions,
        homeworkItems: homeworkItems,
        missingHomeworkItems: row?.missingHomeworkItems || [],
        homeworkStatus: row?.homeworkStatus || 'Đã làm',
        quizletStatus: row?.quizletStatus || 'Đã học',
      };
    });

    onSaveAttendance(newRecords);

    // If onAddExamScore is available and scores were entered, record exam scores too!
    if (onAddExamScore) {
      classStudents.forEach((st) => {
        const row = studentRows[st.id];
        const avg = calculateStudentAverage(row);
        if (avg !== '-') {
          const parsed = Number(avg);
          const rank = parsed >= 8.0 ? 'Xuất sắc' : parsed >= 7.0 ? 'Giỏi' : parsed >= 6.0 ? 'Khá' : 'Trung bình';
          const newExam: ExamScore = {
            id: `ex-${Date.now()}-${st.id}`,
            studentId: st.id,
            studentName: st.name,
            studentCode: st.code,
            classId: selectedClassId,
            className: selectedClass?.name || 'Lớp học',
            examName: `Điểm buổi ${sessionNumber} (${selectedSkills.join(', ')})`,
            examDate: currentDate,
            listening: row?.skillScores?.['Nghe'] ? Number(row.skillScores['Nghe']) : 0,
            reading: row?.skillScores?.['Đọc'] ? Number(row.skillScores['Đọc']) : 0,
            speaking: row?.skillScores?.['Nói'] ? Number(row.skillScores['Nói']) : 0,
            writing: row?.skillScores?.['Viết'] ? Number(row.skillScores['Viết']) : 0,
            totalScore: parsed,
            rank: rank,
            certificateGranted: parsed >= 6.5,
          };
          onAddExamScore(newExam);
        }
      });
    }

    setToastMessage(`Đã lưu nhật ký buổi học (${selectedSkills.join(', ')}) cho ${classStudents.length} học viên thành công!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Generate formatted Zalo report for a single student
  const generateZaloMessageForStudent = (student: Student): string => {
    const row = studentRows[student.id];
    const avg = calculateStudentAverage(row);
    
    let skillsReport = '';
    selectedSkills.forEach((sk) => {
      const totalQ = skillTotalQuestions[sk];
      const maxDenominator = totalQ ? `/${totalQ} câu` : '/10';
      const score = row?.skillScores?.[sk] ? `${row.skillScores[sk]}${maxDenominator}` : 'Chưa nhập điểm';
      skillsReport += `   • ${sk}: ${score}\n`;
    });

    let penaltyNotes = '';
    if (hasWritingSkill && row?.penaltyCopies && Number(row.penaltyCopies) > 0) {
      penaltyNotes += `✍️ Số lần chép phạt (Kỹ năng Viết): ${row.penaltyCopies} lần\n`;
    }
    
    // Check penalty fee and previous debt for this student
    const studentPenaltyNum = parsePenaltyAmount(row?.penaltyFee);
    const studentPrevDebtNum = parsePenaltyAmount(row?.previousDebt);

    if (studentPenaltyNum > 0 || studentPrevDebtNum > 0) {
      if (studentPenaltyNum > 0) {
        penaltyNotes += `💰 Tiền nộp phạt buổi học: ${studentPenaltyNum.toLocaleString('vi-VN')} đ\n`;
      }
      if (studentPrevDebtNum > 0) {
        penaltyNotes += `💸 Nợ chưa nộp các buổi trước: ${studentPrevDebtNum.toLocaleString('vi-VN')} đ\n`;
      }
      if (studentPenaltyNum > 0 && studentPrevDebtNum > 0) {
        penaltyNotes += `👉 TỔNG TIỀN PHẢI NỘP: ${(studentPenaltyNum + studentPrevDebtNum).toLocaleString('vi-VN')} đ\n`;
      }
      penaltyNotes += `⚠️ LƯU Ý QUAN TRỌNG: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.\n`;
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

    // Teacher feedback: leave completely blank if not provided
    let teacherFeedbackSection = '';
    if (row?.feedback && row.feedback.trim() !== '') {
      teacherFeedbackSection = `💬 Nhận xét của giáo viên: ${row.feedback.trim()}\n`;
    }

    return `🌟 IELTS DƯƠNG VŨ - BẢNG ĐIỂM BUỔI HỌC SỐ ${sessionNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 Lớp: ${selectedClass?.name}
📅 Ngày học: ${currentDate}
📞 Hotline: 0798934698

👤 Học viên: ${student.name} (Mã: ${student.code})
✅ Tình trạng điểm danh: ${row?.status || 'Có mặt'}

🎯 BẢNG ĐIỂM KIỂM TRA TRONG BUỔI:
${skillsReport}   ➔ Điểm trung bình buổi: ${avg !== '-' ? `${avg}/10` : 'Đang cập nhật'}

📖 Học từ vựng Quizlet: ${quizletText}
✍️ Bài tập về nhà (BTVN): ${homeworkText}
${penaltyNotes}${teacherFeedbackSection}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❤️ Cảm ơn Quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`;
  };

  // Generate formatted Class Summary for Zalo Group
  const generateClassZaloSummary = (): string => {
    let summary = `📢 IELTS DƯƠNG VŨ
🏆 BẢNG ĐIỂM BUỔI HỌC SỐ ${sessionNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 Lớp: ${selectedClass?.name} | Ngày: ${currentDate}
📚 Kỹ năng kiểm tra: ${selectedSkills.map(sk => skillTotalQuestions[sk] ? `${sk} (Tổng ${skillTotalQuestions[sk]} câu)` : sk).join(', ')}
📝 Đề mục BTVN: ${homeworkItems.join(', ')}
📞 Hotline: 0798934698
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    classStudents.forEach((st, idx) => {
      const row = studentRows[st.id];
      const scoresArr: string[] = [];
      selectedSkills.forEach((sk) => {
        if (row?.skillScores?.[sk]) {
          const totalQ = skillTotalQuestions[sk];
          scoresArr.push(`${sk}: ${row.skillScores[sk]}${totalQ ? `/${totalQ}` : ''}`);
        }
      });
      const scoresStr = scoresArr.length > 0 ? scoresArr.join(' | ') : 'Chưa nhập điểm';
      const penaltyStr = (hasWritingSkill && row?.penaltyCopies && Number(row.penaltyCopies) > 0) ? ` | Chép phạt: ${row.penaltyCopies} lần` : '';
      let hwStr = 'Đủ';
      if (row?.homeworkStatus === 'Chưa làm') {
        hwStr = 'Chưa làm';
      } else if (row?.missingHomeworkItems && row.missingHomeworkItems.length > 0) {
        hwStr = `Thiếu (${row.missingHomeworkItems.join(', ')})`;
      }
      const qzStr = row?.quizletStatus || 'Đã học';
      const parsedPenalty = parsePenaltyAmount(row?.penaltyFee);
      const parsedPrevDebt = parsePenaltyAmount(row?.previousDebt);
      const feeStr = parsedPenalty > 0 ? ` | Phạt: ${parsedPenalty.toLocaleString('vi-VN')} đ` : '';
      const prevDebtStr = parsedPrevDebt > 0 ? ` | Nợ buổi trước: ${parsedPrevDebt.toLocaleString('vi-VN')} đ` : '';
      const fbStr = (row?.feedback && row.feedback.trim() !== '') ? ` | Nhận xét: ${row.feedback.trim()}` : '';

      summary += `${idx + 1}. ${st.name} (${row?.status || 'Có mặt'}): ${scoresStr}${penaltyStr} | BTVN: ${hwStr} | Quizlet: ${qzStr}${feeStr}${prevDebtStr}${fbStr}\n`;
    });

    if (totalCalculatedPenaltyFee > 0 || totalCalculatedPreviousDebt > 0) {
      if (totalCalculatedPenaltyFee > 0) {
        summary += `\n💰 TỔNG SỐ TIỀN NỘP PHẠT BUỔI HỌC: ${formattedTotalPenaltyFee}\n`;
      }
      if (totalCalculatedPreviousDebt > 0) {
        summary += `💸 TỔNG NỢ CHƯA NỘP CÁC BUỔI TRƯỚC: ${formattedTotalPreviousDebt}\n`;
      }
      if (totalCalculatedPenaltyFee > 0 && totalCalculatedPreviousDebt > 0) {
        summary += `👉 TỔNG TIỀN CẦN THU CẢ LỚP: ${formattedGrandTotalReceivable}\n`;
      }
      summary += `⚠️ LƯU Ý QUAN TRỌNG: PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.\n`;
    }

    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❤️ Cảm ơn Quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`;
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

  // Compute summary stats
  const total = classStudents.length;
  const rowList = Object.values(studentRows) as StudentRowState[];
  const presentCount = rowList.filter((r) => r.status === 'Có mặt').length;
  const lateCount = rowList.filter((r) => r.status === 'Đi muộn' || r.status === 'Đi trễ').length;
  const excusedCount = rowList.filter((r) => r.status === 'Nghỉ có phép').length;
  const unexcusedCount = rowList.filter((r) => r.status === 'Nghỉ không phép').length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  // Filter existing records for selected class to view past session history
  const classRecords = attendanceRecords.filter((r) => r.classId === selectedClassId);
  const pastSessionsMap = new Map<string, { date: string; sessionNumber: number; teacherName: string; skillTaught: string; records: AttendanceRecord[] }>();
  classRecords.forEach((r) => {
    const key = `${r.date}-${r.sessionNumber}`;
    if (!pastSessionsMap.has(key)) {
      pastSessionsMap.set(key, {
        date: r.date,
        sessionNumber: r.sessionNumber,
        teacherName: r.teacherName || 'Giáo viên',
        skillTaught: r.skillsTaught ? r.skillsTaught.join(', ') : (r.skillTaught || 'Bài học'),
        records: [],
      });
    }
    pastSessionsMap.get(key)!.records.push(r);
  });
  const pastSessions = Array.from(pastSessionsMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sổ Điểm Danh & Bảng Điểm Buổi Học</h2>
            <p className="text-xs text-slate-500">
              Kiểm tra đa kỹ năng (Nghe, Đọc, Từ vựng, Viết...), BTVN, Quizlet và xuất báo cáo Zalo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsClassZaloModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Xuất ảnh Bảng điểm & Gửi Zalo</span>
          </button>

          <button
            type="button"
            onClick={() => setViewHistory(!viewHistory)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
          >
            <History className="w-4 h-4" />
            <span>{viewHistory ? 'Ẩn lịch sử' : 'Lịch sử buổi học'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lưu sổ buổi học</span>
          </button>
        </div>
      </div>

      {/* Session Settings Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                1. Lớp học: <span className="text-purple-700">*</span>
              </label>
              {onOpenCreateClass && (
                <button
                  type="button"
                  onClick={onOpenCreateClass}
                  className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tạo lớp</span>
                </button>
              )}
            </div>
            {availableClasses.length > 0 ? (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.schedule}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Chưa có lớp nào!</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Ngày học: <span className="text-purple-700">*</span>
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
              3. Buổi số: <span className="text-purple-700">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={selectedClass?.totalSessions || 60}
                value={sessionNumber}
                onChange={(e) => setSessionNumber(Number(e.target.value) || 1)}
                className="w-24 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="text-xs text-slate-400 font-medium">
                / {selectedClass?.totalSessions || 48} buổi
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                4. Giáo viên: <span className="text-purple-700">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(true)}
                className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5 hover:underline"
              >
                <UserPlus className="w-3 h-3" />
                <span>Thêm GV</span>
              </button>
            </div>
            <input
              type="text"
              list="teachers-list"
              placeholder="Tự nhập hoặc chọn giáo viên..."
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <datalist id="teachers-list">
              {teachers.map((t) => (
                <option key={t.id} value={t.name} />
              ))}
              {selectedClass?.teacherNames?.map((tn, idx) => (
                <option key={`cls-tch-${idx}`} value={tn} />
              ))}
              {selectedClass?.teacherName && <option value={selectedClass.teacherName} />}
            </datalist>

            {/* Quick chips if the class has assigned teachers */}
            {selectedClass && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                <span className="text-[10px] text-slate-500 font-semibold">GV lớp:</span>
                {(selectedClass.teacherNames && selectedClass.teacherNames.length > 0
                  ? selectedClass.teacherNames
                  : selectedClass.teacherName.split(/[,;&+]/).map((t) => t.trim()).filter((t) => t.length > 0)
                ).map((tName, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTeacherName(tName)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                      teacherName === tName
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200'
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
          {/* Box 1: Điền & gán nhanh mức phạt */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/90 shadow-xs space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>5. Mức phạt nộp bài (Trợ lý điền số tiền):</span>
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200">
                Tự động cộng dồn
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600">Phạt buổi này:</span>
              {(['10.000 đ', '20.000 đ', '50.000 đ', '0 đ'] as const).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSetAllPenaltyFees(amt)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white text-amber-900 border border-amber-300 hover:bg-amber-100/80 shadow-2xs transition-all active:scale-95"
                >
                  {amt === '0 đ' ? 'Đặt lại 0đ' : `Gán ${amt}`}
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
                          penaltyFee: fee > 0 ? `${fee.toLocaleString('vi-VN')} đ` : '0 đ',
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
                onClick={() => handleSetAllPreviousDebts('0 đ')}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Xoá nợ cả lớp (0đ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStudentRows((prev) => {
                    const next = { ...prev };
                    classStudents.forEach((st) => {
                      if (next[st.id] && st.balanceOwed && st.balanceOwed > 0) {
                        next[st.id] = { ...next[st.id], previousDebt: `${st.balanceOwed.toLocaleString('vi-VN')} đ` };
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

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            6. Chủ đề bài học:
          </label>
          <input
            type="text"
            placeholder="VD: Kiểm tra Từ vựng Unit 5 + Luyện nghe Part 2 + Đọc hiểu..."
            value={lessonTopic}
            onChange={(e) => setLessonTopic(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
          />
        </div>

        {/* Multi-Skill Selection Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>7. Chọn kỹ năng kiểm tra trong buổi ({selectedSkills.length} kỹ năng):</span>
            </span>
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-slate-400 font-medium">Gợi ý:</span>
              <button
                type="button"
                onClick={() => setPresetSkills(['Ôn tập'])}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold flex items-center gap-1"
              >
                <span>🔄 Ôn tập</span>
              </button>
              <button
                type="button"
                onClick={() => setPresetSkills(['Từ vựng', 'Nghe', 'Đọc'])}
                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold"
              >
                Từ vựng + Nghe + Đọc
              </button>
              <button
                type="button"
                onClick={() => setPresetSkills(['Nghe', 'Đọc'])}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                Nghe + Đọc
              </button>
              <button
                type="button"
                onClick={() => setPresetSkills(['Nghe', 'Nói', 'Đọc', 'Viết'])}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
              >
                4 Kỹ năng
              </button>
              <button
                type="button"
                onClick={() => setPresetSkills(COMMON_SKILLS.filter(s => s !== 'Ôn tập'))}
                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold"
              >
                Tất cả (7)
              </button>
            </div>
          </div>

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
        </div>

        {/* Multi-Homework Selection Bar (Like Skills Selection) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-amber-600" />
              <span>8. Chọn bài tập (BTVN) cần kiểm tra buổi này ({homeworkItems.length} mục):</span>
            </span>
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-slate-400 font-medium">Gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => {
                  const items = ['Nghe', 'Viết'];
                  setHomeworkItems(items);
                  localStorage.setItem('idv_homework_items', JSON.stringify(items));
                }}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold"
              >
                Nghe + Viết
              </button>
              <button
                type="button"
                onClick={() => {
                  const items = ['Nghe', 'Nói', 'Đọc', 'Viết'];
                  setHomeworkItems(items);
                  localStorage.setItem('idv_homework_items', JSON.stringify(items));
                }}
                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold"
              >
                4 Kỹ năng
              </button>
              <button
                type="button"
                onClick={() => {
                  const items = DEFAULT_HOMEWORK_ITEMS;
                  setHomeworkItems(items);
                  localStorage.setItem('idv_homework_items', JSON.stringify(items));
                }}
                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold"
              >
                Tất cả (6)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {['Nghe', 'Nói', 'Đọc', 'Viết', 'Từ vựng', 'Chép phạt', 'Chữa bài'].map((item) => {
              const isSelected = homeworkItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    let next: string[];
                    if (isSelected) {
                      next = homeworkItems.filter((h) => h !== item);
                    } else {
                      next = [...homeworkItems, item];
                    }
                    setHomeworkItems(next);
                    localStorage.setItem('idv_homework_items', JSON.stringify(next));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-300 font-extrabold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-xs">{isSelected ? '☑' : '☐'}</span>
                  <span>{item}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5 text-amber-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice for Writing Skill with Penalty Repetitions */}
        {hasWritingSkill && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <PenTool className="w-4 h-4 text-amber-700" />
              <span>Kỹ năng Viết: Đang kích hoạt chế độ ghi nhận số lần chép phạt cho học viên</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-800 font-medium">Gán nhanh chép phạt cả lớp:</span>
              {[0, 2, 5, 10, 20].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleSetAllPenalties(cnt)}
                  className="px-2 py-0.5 bg-white hover:bg-amber-100 text-slate-700 border border-amber-300 rounded-lg text-[11px] font-bold"
                >
                  {cnt} lần
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Modal / Drawer view */}
      {viewHistory && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-700" />
              <span>Lịch sử các buổi học đã ghi nhận của {selectedClass?.name}</span>
            </h3>
            <button
              onClick={() => setViewHistory(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Đóng lại ✕
            </button>
          </div>

          {pastSessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Chưa có buổi học nào được lưu trước đó.</p>
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
                      setViewHistory(false);
                    }}
                    className="p-3 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-200 cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-700">Buổi {ps.sessionNumber}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{formatDateVN(ps.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{ps.skillTaught}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Giảng viên: <strong className="text-slate-800">{ps.teacherName}</strong></p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                      <span>Đi học: {attended}/{ps.records.length} HV</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Student Attendance & Score Entry Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-slate-900">{selectedClass?.name || 'Chưa chọn lớp'}</span>
            <span className="text-xs text-purple-800 font-semibold">• GV: <strong>{teacherName || 'Chưa ghi nhận'}</strong></span>
            <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md font-bold border border-purple-200/60">
              Kỹ năng: {selectedSkills.join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
              Chuyên cần: {attendanceRate}%
            </div>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors border border-emerald-200"
            >
              ✓ Tất cả có mặt
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80 text-[11px]">
              <tr>
                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-3 w-10 text-center">STT</th>
                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-3 w-36">Học viên</th>
                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-48">Điểm danh</th>

                {/* DYNAMIC SCORE COLUMNS */}
                {selectedSkills.map((sk) => (
                  <th key={sk} rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-2.5 px-2 text-center min-w-[105px]">
                    <div className="flex flex-col items-center gap-1 py-0.5">
                      <span className="font-bold flex items-center gap-1">
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

                {selectedSkills.length > 1 && (
                  <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-20 bg-purple-50/50">
                    <span className="text-purple-900">Điểm TB</span>
                  </th>
                )}

                {hasWritingSkill && (
                  <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-28 bg-amber-50/50">
                    <span className="text-amber-900">Chép phạt (Lần)</span>
                  </th>
                )}

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

                {/* DYNAMIC BTVN ITEM GROUP HEADER */}
                {homeworkItems.length > 0 ? (
                  <th
                    colSpan={homeworkItems.length}
                    className="py-2.5 px-2 text-center bg-amber-100/90 text-amber-950 font-black text-xs border-l border-b border-amber-300/80 tracking-wide"
                  >
                    BTVN (Đề mục {homeworkItems.length})
                  </th>
                ) : (
                  <th className="py-3 px-2 text-center w-24">BTVN</th>
                )}

                {/* CỘT TỔNG TIỀN PHẠT BUỔI NÀY (Sau cột BTVN) */}
                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center min-w-[115px] bg-amber-50/80 text-amber-950 font-bold border-l border-amber-200/60">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      <span>Phạt buổi này</span>
                    </div>
                    <div className="inline-flex items-center gap-1 font-normal text-[10px] bg-white px-1 py-0.5 rounded border border-amber-300">
                      <button
                        type="button"
                        onClick={() => handleSetAllPenaltyFees('0 đ')}
                        className="text-slate-500 hover:underline font-bold"
                      >
                        0đ
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllPenaltyFees('20.000 đ')}
                        className="text-amber-700 hover:underline font-bold"
                      >
                        20k
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllPenaltyFees('50.000 đ')}
                        className="text-amber-800 hover:underline font-bold"
                      >
                        50k
                      </button>
                    </div>
                  </div>
                </th>

                {/* CỘT NỢ CHƯA NỘP CÁC BUỔI TRƯỚC */}
                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center min-w-[125px] bg-rose-50/80 text-rose-950 font-bold border-l border-rose-200/70">
                  <div className="flex flex-col items-center gap-1">
                    <span>Nợ các buổi trước</span>
                    <span className="text-[10px] text-rose-800 font-mono font-black bg-white px-1.5 py-0.5 rounded-full border border-rose-300">
                      {formattedTotalPreviousDebt}
                    </span>
                    <div className="inline-flex items-center gap-1 font-normal text-[10px] bg-white px-1 py-0.5 rounded border border-rose-300">
                      <button
                        type="button"
                        onClick={() => handleSetAllPreviousDebts('0 đ')}
                        className="text-slate-500 hover:underline font-bold"
                      >
                        0đ
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllPreviousDebts('20.000 đ')}
                        className="text-rose-700 hover:underline font-bold"
                      >
                        20k
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllPreviousDebts('50.000 đ')}
                        className="text-rose-800 hover:underline font-bold"
                      >
                        50k
                      </button>
                    </div>
                  </div>
                </th>

                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-3 min-w-[140px]">Nhận xét GV</th>
                <th rowSpan={homeworkItems.length > 0 ? 2 : 1} className="py-3 px-2 text-center w-16">Zalo</th>
              </tr>

              {/* SECOND HEADER ROW FOR BTVN SUB-ITEMS */}
              {homeworkItems.length > 0 && (
                <tr className="bg-amber-50/80 border-b border-amber-200 text-[11px] font-extrabold text-amber-950">
                  {homeworkItems.map((item) => (
                    <th key={item} className="py-2 px-2 text-center min-w-[65px] border-l border-amber-200/60">
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
                  previousDebt: '0 đ',
                  penaltyBankAccount: '',
                  feedback: '',
                  homeworkStatus: 'Đã làm',
                  quizletStatus: 'Đã học',
                  note: '',
                };
                const studentAvg = calculateStudentAverage(row);

                return (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 truncate">{st.name}</div>
                      <div className="text-[11px] text-purple-700 font-mono">{st.code}</div>
                    </td>

                    {/* Attendance Status Buttons */}
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

                    {/* Dynamic Skill Score Inputs with Total Questions below */}
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

                    {selectedSkills.length > 1 && (
                      <td className="py-3 px-2 text-center bg-purple-50/30 font-black text-purple-900">
                        {studentAvg}
                      </td>
                    )}

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
                        </div>
                      </td>
                    )}

                    {/* Quizlet */}
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
                          className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                            row.quizletStatus === 'Đã học'
                              ? 'bg-purple-700 text-white'
                              : 'bg-slate-100 text-slate-500'
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
                          className={`px-1.5 py-1 rounded text-[10px] font-bold ${
                            row.quizletStatus === 'Chưa học'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          ✗ Chưa
                        </button>
                      </div>
                    </td>

                    {/* DYNAMIC BTVN CELLS PER SELECTED ITEM */}
                    {homeworkItems.length > 0 ? (
                      homeworkItems.map((item) => {
                        const isMissing = row.missingHomeworkItems?.includes(item);
                        return (
                          <td key={item} className="py-2 px-2 text-center border-l border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleToggleMissingHwItem(st.id, item)}
                              className="p-1 rounded transition-transform active:scale-95 inline-flex items-center justify-center focus:outline-none"
                              title={isMissing ? `Đang thiếu "${item}" - Click để đánh dấu Đã làm` : `Đã làm "${item}" - Click để đánh dấu Thiếu`}
                            >
                              {isMissing ? (
                                <span className="text-rose-600 font-extrabold text-sm font-mono tracking-tighter hover:scale-110 transition-transform select-none">
                                  (✘)
                                </span>
                              ) : (
                                <div className="w-6 h-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center font-black text-xs shadow-xs border border-emerald-500 transition-transform">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })
                    ) : (
                      <td className="py-2 px-2 text-center text-slate-400 text-xs font-semibold">-</td>
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

                    {/* Feedback (Để trống nếu không ghi gì) */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Để trống nếu không có nhận xét..."
                        value={row.feedback || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentRows((prev) => ({
                            ...prev,
                            [st.id]: { ...prev[st.id], feedback: val },
                          }));
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:italic"
                      />
                    </td>

                    {/* Zalo Single */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForZalo(st)}
                        className="p-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold"
                        title="Xem tin Zalo"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {classStudents.length === 0 && (
                <tr>
                  <td colSpan={8 + selectedSkills.length + (selectedSkills.length > 1 ? 1 : 0) + (hasWritingSkill ? 1 : 0)} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Lớp này hiện chưa có học viên nào được xếp lớp.</p>
                  </td>
                </tr>
              )}
            </tbody>

            {classStudents.length > 0 && (
              <tfoot className="bg-amber-50/60 border-t-2 border-amber-300 font-bold">
                <tr>
                  <td
                    colSpan={5 + selectedSkills.length + (selectedSkills.length > 1 ? 1 : 0) + (hasWritingSkill ? 1 : 0)}
                    className="py-3 px-3 text-right text-xs font-black text-amber-950 uppercase tracking-wide"
                  >
                    TỔNG CỘNG CỦA LỚP (TỰ ĐỘNG CỘNG):
                  </td>
                  <td className="py-3 px-2 text-center bg-amber-100/90 border-l border-amber-300">
                    <span className="text-xs font-black text-amber-950 font-mono block">
                      {formattedTotalPenaltyFee}
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      ({countStudentsWithPenalty} bạn phạt)
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center bg-rose-100/90 border-l border-rose-300">
                    <span className="text-xs font-black text-rose-950 font-mono block">
                      {formattedTotalPreviousDebt}
                    </span>
                    <span className="text-[10px] text-rose-800 font-medium">
                      ({countStudentsWithPreviousDebt} bạn nợ)
                    </span>
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 bg-amber-50/80 border-l border-amber-200">
                    <div className="space-y-1">
                      {grandTotalReceivable > 0 && (
                        <div className="text-[11px] font-black text-amber-950">
                          👉 Tổng thu (Phạt + Nợ cũ): <span className="text-rose-700 font-mono text-xs">{formattedGrandTotalReceivable}</span>
                        </div>
                      )}
                      <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1 leading-tight">
                        <span className="shrink-0 text-sm">⚠️</span>
                        <span>PH/HS chuyển khoản nộp phạt vào STK cá nhân trợ lý, không chuyển khoản vào STK công ty.</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Zalo Cho Từng Học Sinh */}
      {selectedStudentForZalo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Báo Cáo Điểm Gửi Zalo</h3>
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
              {parsePenaltyAmount(studentRows[selectedStudentForZalo.id]?.penaltyFee || '') > 0 && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center gap-3 text-rose-900 shadow-xs">
                  <span className="text-2xl shrink-0">⚠️</span>
                  <div className="text-xs">
                    <strong className="block text-rose-950 font-black text-[13px] mb-0.5">
                      Lưu ý:
                    </strong>
                    <span className="font-bold text-rose-900 leading-snug">
                      PH/HS chuyển khoản nộp phạt vào STK cá nhân của trợ lý, không chuyển khoản tiền nộp phạt vào STK công ty.
                    </span>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 select-all">
                {generateZaloMessageForStudent(selectedStudentForZalo)}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                SĐT: <strong className="text-slate-800">{selectedStudentForZalo.parentPhone || selectedStudentForZalo.phone}</strong>
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
                      <span>Sao chép Zalo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấu hình Đề mục BTVN */}
      {isHwConfigModalOpen && (
        <HomeworkConfigModal
          isOpen={isHwConfigModalOpen}
          onClose={() => setIsHwConfigModalOpen(false)}
          homeworkItems={homeworkItems}
          onSaveHomeworkItems={handleSaveHomeworkItems}
          onApplyAndSetAllDone={() => handleSetAllHomework('Đã làm')}
        />
      )}

      {/* Modal Xuất ảnh Bảng điểm & Gửi Zalo Cả Lớp */}
      {isClassZaloModalOpen && selectedClass && (
        <ClassScoreExportModal
          isOpen={isClassZaloModalOpen}
          onClose={() => setIsClassZaloModalOpen(false)}
          classGroup={selectedClass}
          classStudents={classStudents}
          studentRows={studentRows}
          sessionNumber={sessionNumber}
          currentDate={currentDate}
          teacherName={teacherName || selectedClass.teacherName || 'Giáo viên IDV'}
          lessonTopic={lessonTopic}
          selectedSkills={selectedSkills}
          overallScoreType="average"
          enableOverallScore={true}
          hasWritingSkill={hasWritingSkill}
          calculateStudentAverage={calculateStudentAverage}
          skillTotalQuestions={skillTotalQuestions}
          totalPenaltyAmount={totalPenaltyAmount}
          penaltyBankAccount={penaltyBankAccount}
          selectedHomeworkItems={homeworkItems}
        />
      )}

      {/* Teacher Creation Modal */}
      {isTeacherModalOpen && onAddTeacher && (
        <CreateTeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          onAddTeacher={(teacher) => {
            onAddTeacher(teacher);
            setTeacherName(teacher.name);
            setIsTeacherModalOpen(false);
            setToastMessage(`Đã thêm giáo viên ${teacher.name} thành công!`);
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
};
