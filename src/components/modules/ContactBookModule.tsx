import React, { useState } from 'react';
import {
  MessageSquareText,
  Award,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Filter,
  Sparkles,
  Smartphone,
  Share2,
  Calendar,
  Eye,
  BookOpen,
  Phone,
  UserCheck,
  Copy,
  ExternalLink,
  Printer,
  Edit3,
  FileText,
  Star,
  ShieldCheck,
  Check,
  X,
  Zap,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Users,
  Layers,
  Table,
  CheckCheck,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  ContactBookNote,
  Student,
  ClassGroup,
  MilestoneEvaluationReport,
  AttendanceRecord,
  ExamScore
} from '../../types';
import { formatDateVN } from '../../utils/courseSchedule';

interface ContactBookModuleProps {
  notes: ContactBookNote[];
  students: Student[];
  classes: ClassGroup[];
  attendanceRecords?: AttendanceRecord[];
  exams?: ExamScore[];
  milestoneEvaluations: MilestoneEvaluationReport[];
  onAddNote: (note: ContactBookNote) => void;
  onAddMilestoneEvaluation: (report: MilestoneEvaluationReport) => void;
  onUpdateMilestoneEvaluation: (report: MilestoneEvaluationReport) => void;
}

export const ContactBookModule: React.FC<ContactBookModuleProps> = ({
  notes,
  students,
  classes,
  attendanceRecords = [],
  exams = [],
  milestoneEvaluations,
  onAddNote,
  onAddMilestoneEvaluation,
  onUpdateMilestoneEvaluation,
}) => {
  // Main Subtab: 'daily' (Nhận xét buổi học) vs 'milestone' (Bảng tổng hợp đánh giá 10 buổi)
  const [activeTab, setActiveTab] = useState<'daily' | 'milestone'>('milestone');

  // Common Search & Filters
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('Buổi 1 - 10');

  // Display mode for Milestone tab: 'table' (Bảng tổng hợp theo lớp) vs 'cards' (Dạng thẻ)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [showAddDailyModal, setShowAddDailyModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneEvaluationReport | null>(null);
  const [viewingPrintReport, setViewingPrintReport] = useState<MilestoneEvaluationReport | null>(null);
  const [viewingClassPrintReport, setViewingClassPrintReport] = useState<string | null>(null); // classId
  const [zaloModalReport, setZaloModalReport] = useState<MilestoneEvaluationReport | null>(null);
  const [showClassZaloModal, setShowClassZaloModal] = useState<string | null>(null); // classId for bulk Zalo send

  // Notifications Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyPhone = (phone: string, name: string) => {
    navigator.clipboard.writeText(phone);
    showToast(`Đã sao chép SĐT phụ huynh em ${name}: ${phone}`);
  };

  // Form State for Daily Note
  const [dailyForm, setDailyForm] = useState({
    studentId: students[0]?.id || '',
    classId: classes[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    lessonTopic: '',
    attitude: 'Hăng hái, tập trung' as ContactBookNote['attitude'],
    homeworkStatus: 'Hoàn thành 100%' as ContactBookNote['homeworkStatus'],
    quizletStatus: 'Đã học' as NonNullable<ContactBookNote['quizletStatus']>,
    teacherFeedback: '',
  });

  // Form State for Individual Milestone Evaluation (100-point scale)
  const [milestoneForm, setMilestoneForm] = useState<{
    id?: string;
    studentId: string;
    classId: string;
    milestonePeriod: string;
    teacherName: string;
    attendanceScore: number;
    attendanceDetails: string;
    homeworkScore: number;
    homeworkDetails: string;
    examScore: number;
    examDetails: string;
    teacherComments: string;
    parentAdvice: string;
  }>({
    studentId: students[0]?.id || '',
    classId: classes[0]?.id || '',
    milestonePeriod: 'Buổi 1 - 10',
    teacherName: 'Tâm Vương',
    attendanceScore: 30,
    attendanceDetails: '10/10 buổi (100% đúng giờ)',
    homeworkScore: 28,
    homeworkDetails: '10/10 bài tập đầy đủ, Quizlet 95%',
    examScore: 34,
    examDetails: 'Điểm TB bài thi: 8.5/10',
    teacherComments: 'Em có thái độ học tập rất nghiêm túc, phát âm lưu loát. Cần bổ sung thêm từ vựng Topic Writing Task 2.',
    parentAdvice: 'Phụ huynh nhắc nhở con duy trì học từ vựng Quizlet 15 phút mỗi ngày.',
  });

  // Helper for grade rank on 100-pt scale
  const computeGradeRank = (total: number): MilestoneEvaluationReport['gradeRank'] => {
    if (total >= 90) return 'Xuất sắc';
    if (total >= 80) return 'Giỏi';
    if (total >= 70) return 'Khá';
    if (total >= 50) return 'Trung bình';
    return 'Cần rèn luyện';
  };

  // Auto-calculate scores for a single student based on actual attendance and exam records
  const autoCalculateStudentScore = (studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return { attScore: 30, attDet: '10/10 buổi', hwScore: 28, hwDet: 'Đủ bài tập', exScore: 34, exDet: 'Điểm TB 8.5/10' };

    const stAtt = attendanceRecords.filter((a) => a.studentId === studentId);
    const totalAtt = stAtt.length;
    const presentCount = stAtt.filter((a) => a.status === 'Có mặt' || a.status === 'Đi muộn').length;

    let attScore = 30;
    let attDet = '10/10 buổi (100% chuyên cần)';
    if (totalAtt > 0) {
      const ratio = presentCount / totalAtt;
      attScore = Math.round(ratio * 30);
      attDet = `${presentCount}/${totalAtt} buổi (${Math.round(ratio * 100)}% tham gia)`;
    }

    const stExams = exams.filter((e) => e.studentId === studentId);
    let exScore = 35;
    let exDet = 'Điểm TB bài kiểm tra: 8.8/10';
    if (stExams.length > 0) {
      const sum = stExams.reduce((acc, curr) => acc + (curr.overallScore || curr.score || 8.5), 0);
      const avg = sum / stExams.length;
      exScore = Math.min(40, Math.round((avg / 10) * 40));
      exDet = `Điểm TB ${stExams.length} bài thi: ${avg.toFixed(1)}/10`;
    }

    const hwScore = Math.min(30, Math.round(attScore * 0.95));
    const hwDet = 'Đã hoàn thành các bài tập giao về nhà & Quizlet';

    return { attScore, attDet, hwScore, hwDet, exScore, exDet };
  };

  // Single Student Auto-Calculate Handler
  const handleAutoCalculateScores = (studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;
    const calc = autoCalculateStudentScore(studentId);

    setMilestoneForm((prev) => ({
      ...prev,
      studentId,
      classId: st.classId || prev.classId,
      attendanceScore: calc.attScore,
      attendanceDetails: calc.attDet,
      homeworkScore: calc.hwScore,
      homeworkDetails: calc.hwDet,
      examScore: calc.exScore,
      examDetails: calc.exDet,
    }));

    showToast(`⚡ Đã tự động tính toán điểm 10 buổi cho em ${st.name}!`);
  };

  // BULK GENERATE MILSTONE EVALUATIONS FOR ENTIRE CLASS
  const handleGenerateClassEvaluations = (classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const classStudents = students.filter((s) => s.classId === classId || s.className === targetClass.name);
    if (classStudents.length === 0) {
      showToast(`⚠️ Không có học viên nào thuộc lớp ${targetClass.name}`);
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    classStudents.forEach((st) => {
      const existing = milestoneEvaluations.find(
        (m) => m.studentId === st.id && m.milestonePeriod === selectedPeriodFilter
      );

      const calc = autoCalculateStudentScore(st.id);
      const totalPts = Math.min(100, Math.max(0, calc.attScore + calc.hwScore + calc.exScore));
      const rank = computeGradeRank(totalPts);

      if (existing) {
        onUpdateMilestoneEvaluation({
          ...existing,
          attendanceScore: calc.attScore,
          attendanceDetails: calc.attDet,
          homeworkScore: calc.hwScore,
          homeworkDetails: calc.hwDet,
          examScore: calc.exScore,
          examDetails: calc.exDet,
          totalScore: totalPts,
          gradeRank: rank,
        });
        updatedCount++;
      } else {
        const newReport: MilestoneEvaluationReport = {
          id: `ms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          studentId: st.id,
          studentName: st.name,
          studentCode: st.code,
          classId: targetClass.id,
          className: targetClass.name,
          milestonePeriod: selectedPeriodFilter,
          createdDate: new Date().toISOString().split('T')[0],
          teacherName: targetClass.teacherName || 'Tâm Vương',
          parentName: st.parentName || 'Gia đình',
          parentPhone: st.parentPhone || '',
          attendanceScore: calc.attScore,
          attendanceDetails: calc.attDet,
          homeworkScore: calc.hwScore,
          homeworkDetails: calc.hwDet,
          examScore: calc.exScore,
          examDetails: calc.exDet,
          totalScore: totalPts,
          gradeRank: rank,
          teacherComments: `Em ${st.name} đi học đầy đủ, tích cực phát biểu và có sự tiến bộ rõ rệt trong đợt ${selectedPeriodFilter}.`,
          parentAdvice: 'Gia đình tiếp tục khuyến khích con hoàn thành bài tập từ vựng Quizlet đúng hạn.',
          sentToParent: false,
        };
        onAddMilestoneEvaluation(newReport);
        createdCount++;
      }
    });

    showToast(`⚡ Đã khởi tạo / tính điểm đợt ${selectedPeriodFilter} cho toàn bộ ${classStudents.length} học sinh lớp ${targetClass.name}!`);
  };

  // BULK MARK CLASS AS SENT TO PARENTS
  const handleMarkClassAsSent = (classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    const reportsToUpdate = milestoneEvaluations.filter(
      (m) => (m.classId === classId || (targetClass && m.className === targetClass.name)) &&
             (selectedPeriodFilter === 'all' || m.milestonePeriod === selectedPeriodFilter)
    );

    if (reportsToUpdate.length === 0) {
      showToast('⚠️ Chưa có phiếu đánh giá nào trong lớp này để gửi.');
      return;
    }

    reportsToUpdate.forEach((m) => {
      onUpdateMilestoneEvaluation({
        ...m,
        sentToParent: true,
        sentDate: new Date().toISOString().split('T')[0],
      });
    });

    setShowClassZaloModal(null);
    showToast(`✓ Đã xác nhận "Đã gửi Phụ huynh" cho toàn bộ ${reportsToUpdate.length} học viên lớp ${targetClass?.name || ''}!`);
  };

  // Handle Milestone Form Submission
  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === milestoneForm.studentId);
    const cls = classes.find((c) => c.id === milestoneForm.classId || c.id === st?.classId);

    const totalPts = Math.min(100, Math.max(0, milestoneForm.attendanceScore + milestoneForm.homeworkScore + milestoneForm.examScore));
    const rank = computeGradeRank(totalPts);

    if (editingMilestone) {
      const updated: MilestoneEvaluationReport = {
        ...editingMilestone,
        studentId: milestoneForm.studentId,
        studentName: st?.name || editingMilestone.studentName,
        studentCode: st?.code || editingMilestone.studentCode,
        classId: cls?.id || editingMilestone.classId,
        className: cls?.name || editingMilestone.className,
        milestonePeriod: milestoneForm.milestonePeriod,
        teacherName: milestoneForm.teacherName,
        parentName: st?.parentName || editingMilestone.parentName,
        parentPhone: st?.parentPhone || editingMilestone.parentPhone,
        attendanceScore: milestoneForm.attendanceScore,
        attendanceDetails: milestoneForm.attendanceDetails,
        homeworkScore: milestoneForm.homeworkScore,
        homeworkDetails: milestoneForm.homeworkDetails,
        examScore: milestoneForm.examScore,
        examDetails: milestoneForm.examDetails,
        totalScore: totalPts,
        gradeRank: rank,
        teacherComments: milestoneForm.teacherComments,
        parentAdvice: milestoneForm.parentAdvice,
      };
      onUpdateMilestoneEvaluation(updated);
      showToast(`Đã cập nhật Bảng đánh giá 10 buổi cho học sinh ${st?.name}`);
      setEditingMilestone(null);
    } else {
      const newReport: MilestoneEvaluationReport = {
        id: `ms-${Date.now()}`,
        studentId: milestoneForm.studentId,
        studentName: st?.name || 'Học viên',
        studentCode: st?.code || 'IDV-HV',
        classId: cls?.id || 'cls-1',
        className: cls?.name || 'Lớp IELTS',
        milestonePeriod: milestoneForm.milestonePeriod,
        createdDate: new Date().toISOString().split('T')[0],
        teacherName: milestoneForm.teacherName,
        parentName: st?.parentName || 'Gia đình',
        parentPhone: st?.parentPhone || '',
        attendanceScore: milestoneForm.attendanceScore,
        attendanceDetails: milestoneForm.attendanceDetails,
        homeworkScore: milestoneForm.homeworkScore,
        homeworkDetails: milestoneForm.homeworkDetails,
        examScore: milestoneForm.examScore,
        examDetails: milestoneForm.examDetails,
        totalScore: totalPts,
        gradeRank: rank,
        teacherComments: milestoneForm.teacherComments,
        parentAdvice: milestoneForm.parentAdvice,
        sentToParent: false,
      };
      onAddMilestoneEvaluation(newReport);
      showToast(`Đã tạo Bảng đánh giá 10 buổi (${totalPts}/100 đ - ${rank}) cho em ${st?.name}`);
    }

    setShowAddMilestoneModal(false);
  };

  const openEditMilestoneModal = (report: MilestoneEvaluationReport) => {
    setEditingMilestone(report);
    setMilestoneForm({
      id: report.id,
      studentId: report.studentId,
      classId: report.classId,
      milestonePeriod: report.milestonePeriod,
      teacherName: report.teacherName,
      attendanceScore: report.attendanceScore,
      attendanceDetails: report.attendanceDetails,
      homeworkScore: report.homeworkScore,
      homeworkDetails: report.homeworkDetails,
      examScore: report.examScore,
      examDetails: report.examDetails,
      teacherComments: report.teacherComments,
      parentAdvice: report.parentAdvice,
    });
    setShowAddMilestoneModal(true);
  };

  // Handle Daily Note Submission
  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === dailyForm.studentId);
    const cls = classes.find((c) => c.id === dailyForm.classId);

    const newNote: ContactBookNote = {
      id: `cbn-${Date.now()}`,
      studentId: dailyForm.studentId,
      studentName: student?.name || 'Học viên',
      classId: dailyForm.classId,
      className: cls?.name || 'Lớp học',
      date: dailyForm.date,
      lessonTopic: dailyForm.lessonTopic,
      attitude: dailyForm.attitude,
      homeworkStatus: dailyForm.homeworkStatus,
      quizletStatus: dailyForm.quizletStatus,
      teacherFeedback: dailyForm.teacherFeedback,
      sentVia: 'Zalo & App Phụ Huynh',
      parentAcknowledged: false,
    };

    onAddNote(newNote);
    setShowAddDailyModal(false);
    showToast(`Đã gửi nhận xét buổi học cho phụ huynh em ${student?.name || ''}`);
  };

  // Filtered lists
  const filteredDailyNotes = notes.filter((n) => {
    const matchesSearch =
      n.studentName.toLowerCase().includes(search.toLowerCase()) ||
      n.lessonTopic.toLowerCase().includes(search.toLowerCase()) ||
      n.teacherFeedback.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || n.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  const filteredMilestones = milestoneEvaluations.filter((m) => {
    const matchesSearch =
      m.studentName.toLowerCase().includes(search.toLowerCase()) ||
      m.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      (m.parentName && m.parentName.toLowerCase().includes(search.toLowerCase())) ||
      (m.parentPhone && m.parentPhone.includes(search));
    const matchesClass = selectedClassFilter === 'all' || m.classId === selectedClassFilter;
    const matchesPeriod = selectedPeriodFilter === 'all' || m.milestonePeriod === selectedPeriodFilter;
    return matchesSearch && matchesClass && matchesPeriod;
  });

  // Calculate stats for 10-session milestones
  const totalReportsCount = milestoneEvaluations.length;
  const avgScoreVal =
    totalReportsCount > 0
      ? (milestoneEvaluations.reduce((acc, curr) => acc + curr.totalScore, 0) / totalReportsCount).toFixed(1)
      : '0.0';
  const excellentCount = milestoneEvaluations.filter((m) => m.gradeRank === 'Xuất sắc' || m.gradeRank === 'Giỏi').length;
  const sentCount = milestoneEvaluations.filter((m) => m.sentToParent).length;

  // Search Results preview for Quick Phone lookup
  const matchedStudents = search.trim().length > 0
    ? students.filter((s) => {
        const query = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.parentPhone.includes(query) ||
          s.parentName.toLowerCase().includes(query)
        );
      })
    : [];

  // Group classes for the Class Matrix view
  const activeClassesToDisplay = selectedClassFilter === 'all'
    ? classes
    : classes.filter((c) => c.id === selectedClassFilter);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Module Banner Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-purple-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-purple-800/60 border border-purple-700/60 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <Award className="w-3.5 h-3.5" />
            <span>Sổ Liên Lạc Điện Tử & Báo Cáo Đánh Giá 10 Buổi Theo Lớp</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Quản Lý Đánh Giá Theo Lớp & Gửi Phụ Huynh Hàng Loạt</h2>
          <p className="text-xs text-purple-200/90 max-w-2xl leading-relaxed">
            Tổng hợp chuyên cần (30đ), làm bài tập & Quizlet (30đ), điểm thi (40đ) trên thang điểm 100 theo từng lớp. Hỗ trợ tự động tính điểm cả lớp & gửi tin nhắn Zalo hàng loạt tới toàn bộ Phụ huynh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingMilestone(null);
              setShowAddMilestoneModal(true);
            }}
            className="px-4 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-purple-950 rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Đánh Giá 1 Cá Nhân</span>
          </button>
          <button
            onClick={() => setShowAddDailyModal(true)}
            className="px-4 py-2.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl backdrop-blur-xs transition-all flex items-center gap-2"
          >
            <MessageSquareText className="w-4 h-4" />
            <span>Thêm Nhận Xét Buổi Học</span>
          </button>
        </div>
      </div>

      {/* SUBTABS TOGGLE SWITCH */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('milestone')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'milestone'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>🏆 Bảng Tổng Hợp Đánh Giá 10 Buổi Theo Lớp (Thang 100)</span>
            <span className="ml-1 bg-amber-300 text-purple-950 px-2 py-0.5 rounded-full text-[10px] font-black">
              {totalReportsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquareText className="w-4 h-4" />
            <span>📝 Nhận Xét Từng Buổi Học</span>
            <span className="ml-1 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {notes.length}
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Đồng bộ Zalo Phụ Huynh Toàn Lớp</span>
        </div>
      </div>

      {/* CLASS SELECTION TABS & FILTER BAR */}
      <div className="space-y-3">
        {/* Class Selector Tabs Pills */}
        {activeTab === 'milestone' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedClassFilter === 'all'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Tất Cả Lớp Học ({classes.length})</span>
            </button>

            {classes.map((c) => {
              const classStCount = students.filter((s) => s.classId === c.id || s.className === c.name).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassFilter(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    selectedClassFilter === c.id
                      ? 'bg-purple-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>{c.name}</span>
                  <span className="ml-1 bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {classStCount} HV
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên học sinh, mã HV, SĐT phụ huynh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs">
            {activeTab === 'milestone' && (
              <>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] ${
                      viewMode === 'table' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 text-purple-700" />
                    <span>Bảng Tổng Hợp Lớp</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px] ${
                      viewMode === 'cards' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                    <span>Dạng Thẻ Đánh Giá</span>
                  </button>
                </div>

                <select
                  value={selectedPeriodFilter}
                  onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                  className="bg-purple-50 border border-purple-200 text-purple-950 rounded-xl px-3 py-2 font-black"
                >
                  <option value="Buổi 1 - 10">Cột mốc Đợt 1: Buổi 1 - 10</option>
                  <option value="Buổi 11 - 20">Cột mốc Đợt 2: Buổi 11 - 20</option>
                  <option value="Buổi 21 - 30">Cột mốc Đợt 3: Buổi 21 - 30</option>
                  <option value="Buổi 31 - 40">Cột mốc Đợt 4: Buổi 31 - 40</option>
                  <option value="all">Tất cả cột mốc</option>
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* QUICK PARENT PHONE LOOKUP RESULTS */}
      {search.trim().length > 0 && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md border border-purple-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Kết quả tra cứu học viên & SĐT phụ huynh ({matchedStudents.length})</span>
            </span>
            <span className="text-purple-200">Bấm để viết nhận xét hoặc gửi Zalo</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-900 text-xs">
            {matchedStudents.map((st) => (
              <div key={st.id} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900">{st.name} ({st.code})</div>
                  <div className="text-[11px] text-purple-700 font-semibold">{st.className}</div>
                  <div className="mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] font-mono flex items-center justify-between">
                    <span>👨‍👩‍👧 {st.parentName}: <strong>{st.parentPhone}</strong></span>
                    <button
                      onClick={() => handleCopyPhone(st.parentPhone, st.name)}
                      className="p-1 hover:bg-white rounded text-slate-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => {
                      handleAutoCalculateScores(st.id);
                      setShowAddMilestoneModal(true);
                    }}
                    className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold rounded-lg text-[11px] text-center"
                  >
                    + Đánh giá 10 buổi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: 🏆 BẢNG TỔNG HỢP ĐÁNH GIÁ 10 BUỔI THEO LỚP */}
      {activeTab === 'milestone' && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Phiếu đánh giá 10 buổi</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalReportsCount}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Thang điểm 100 chuẩn IDV</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Điểm TB toàn bộ học viên</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{avgScoreVal} <span className="text-sm font-normal text-slate-400">/ 100</span></div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Xếp loại theo từng lớp</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Tỷ lệ Xuất Sắc & Giỏi (≥ 80đ)</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {totalReportsCount > 0 ? Math.round((excellentCount / totalReportsCount) * 100) : 0}%
              </div>
              <div className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>{excellentCount} / {totalReportsCount} học viên đạt Top</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Đã gửi Phụ Huynh Zalo</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{sentCount} / {totalReportsCount}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>Đồng bộ theo lớp</span>
              </div>
            </div>
          </div>

          {/* TABLE MATRIX VIEW (BẢNG TỔNG HỢP THEO LỚP) */}
          {viewMode === 'table' && (
            <div className="space-y-8">
              {activeClassesToDisplay.map((cls) => {
                const classStudents = students.filter((s) => s.classId === cls.id || s.className === cls.name);
                const classReports = milestoneEvaluations.filter(
                  (m) => (m.classId === cls.id || m.className === cls.name) &&
                         (selectedPeriodFilter === 'all' || m.milestonePeriod === selectedPeriodFilter)
                );

                const classAvg = classReports.length > 0
                  ? (classReports.reduce((acc, curr) => acc + curr.totalScore, 0) / classReports.length).toFixed(1)
                  : '0.0';

                const classSentCount = classReports.filter((m) => m.sentToParent).length;

                return (
                  <div key={cls.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden space-y-0">
                    {/* CLASS HEADER BANNER WITH BULK ACTIONS */}
                    <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-400 text-purple-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            LỚP HỌC
                          </span>
                          <h3 className="font-black text-lg text-white">{cls.name}</h3>
                          <span className="text-xs bg-white/10 text-purple-200 px-2.5 py-0.5 rounded-md font-mono">
                            {classStudents.length} Học Viên
                          </span>
                        </div>
                        <div className="text-xs text-purple-200/80 flex items-center gap-4">
                          <span>GVCN: <strong>{cls.teacherName || 'Tâm Vương'}</strong></span>
                          <span>Cột mốc: <strong className="text-amber-300">{selectedPeriodFilter === 'all' ? 'Tất cả đợt' : selectedPeriodFilter}</strong></span>
                          <span>Điểm TB Lớp: <strong className="text-amber-300 font-mono text-sm">{classAvg} / 100đ</strong></span>
                        </div>
                      </div>

                      {/* CLASS BULK ACTION BUTTONS */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Calculate for entire class */}
                        <button
                          onClick={() => handleGenerateClassEvaluations(cls.id)}
                          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-purple-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                          title="Tự động tính toán điểm 10 buổi cho toàn bộ học sinh lớp này"
                        >
                          <Zap className="w-3.5 h-3.5 fill-purple-950" />
                          <span>⚡ Tính Điểm Cả Lớp</span>
                        </button>

                        {/* Send Zalo to entire class */}
                        <button
                          onClick={() => setShowClassZaloModal(cls.id)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>🚀 Gửi Zalo Phụ Huynh Cả Lớp ({classSentCount}/{classReports.length})</span>
                        </button>

                        {/* Print Class Report */}
                        <button
                          onClick={() => setViewingClassPrintReport(cls.id)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-xs transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In Bảng Đánh Giá Lớp</span>
                        </button>
                      </div>
                    </div>

                    {/* CLASS EVALUATION MATRIX TABLE */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                            <th className="py-3 px-4 w-12 text-center">STT</th>
                            <th className="py-3 px-4">Mã & Họ Tên Học Sinh</th>
                            <th className="py-3 px-4">Phụ Huynh & SĐT</th>
                            <th className="py-3 px-3 text-center">Chuyên Cần (30đ)</th>
                            <th className="py-3 px-3 text-center">Bài Tập (30đ)</th>
                            <th className="py-3 px-3 text-center">Điểm Thi (40đ)</th>
                            <th className="py-3 px-4 text-center">TỔNG ĐIỂM / 100</th>
                            <th className="py-3 px-4 text-center">XẾP LOẠI</th>
                            <th className="py-3 px-4 text-center">Trạng Thái PH</th>
                            <th className="py-3 px-4 text-right pr-6">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {classStudents.map((st, idx) => {
                            const rep = classReports.find((m) => m.studentId === st.id);
                            const pPhone = st.parentPhone || rep?.parentPhone || 'Chưa cập nhật';
                            const pName = st.parentName || rep?.parentName || 'Gia đình';
                            const cleanPhone = pPhone.replace(/[^0-9]/g, '');

                            return (
                              <tr key={st.id} className="hover:bg-purple-50/40 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="font-extrabold text-slate-900">{st.name}</div>
                                  <div className="text-[10px] font-mono text-purple-700 font-bold">{st.code}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-800">{pName}</div>
                                  <div className="text-[11px] font-mono font-bold text-purple-900 flex items-center gap-1">
                                    <span>{pPhone}</span>
                                    {pPhone !== 'Chưa cập nhật' && (
                                      <button
                                        onClick={() => handleCopyPhone(pPhone, st.name)}
                                        className="text-slate-400 hover:text-slate-700 p-0.5"
                                        title="Sao chép SĐT"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {rep ? (
                                  <>
                                    <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                                      {rep.attendanceScore} / 30đ
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-indigo-700 bg-indigo-50/30">
                                      {rep.homeworkScore} / 30đ
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-purple-700 bg-purple-50/30">
                                      {rep.examScore} / 40đ
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="text-sm font-black text-purple-950 bg-purple-100 border border-purple-200 px-3 py-1 rounded-xl">
                                        {rep.totalScore} đ
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span
                                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                                          rep.gradeRank === 'Xuất sắc'
                                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                                            : rep.gradeRank === 'Giỏi'
                                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                                            : rep.gradeRank === 'Khá'
                                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                                            : 'bg-slate-100 text-slate-800 border-slate-300'
                                        }`}
                                      >
                                        {rep.gradeRank === 'Xuất sắc' && '🌟 '}
                                        {rep.gradeRank === 'Giỏi' && '👏 '}
                                        {rep.gradeRank === 'Khá' && '👍 '}
                                        {rep.gradeRank}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      {rep.sentToParent ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px]">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Đã gửi Zalo</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px]">
                                          <Clock className="w-3 h-3" />
                                          <span>Chưa gửi</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-right pr-6">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => setZaloModalReport(rep)}
                                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] flex items-center gap-1"
                                          title="Gửi Zalo riêng cho Phụ huynh em này"
                                        >
                                          <Send className="w-3 h-3" />
                                          <span>Zalo</span>
                                        </button>
                                        <button
                                          onClick={() => setViewingPrintReport(rep)}
                                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px]"
                                          title="In phiếu cá nhân"
                                        >
                                          <Printer className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => openEditMilestoneModal(rep)}
                                          className="p-1.5 text-slate-400 hover:text-purple-700 rounded-lg"
                                          title="Sửa đánh giá"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <td colSpan={6} className="py-3 px-4 text-center italic text-slate-400">
                                    Chưa khởi tạo đợt đánh giá {selectedPeriodFilter}.
                                    <button
                                      onClick={() => {
                                        handleAutoCalculateScores(st.id);
                                        setShowAddMilestoneModal(true);
                                      }}
                                      className="ml-2 text-purple-700 font-bold underline hover:text-purple-900 text-[11px]"
                                    >
                                      + Tạo ngay
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CARD GRID VIEW (DẠNG THẺ THUẦN TÚY) */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              {filteredMilestones.map((m) => {
                const matchedSt = students.find((s) => s.id === m.studentId || s.name === m.studentName);
                const pPhone = m.parentPhone || matchedSt?.parentPhone || 'Chưa cập nhật';
                const pName = m.parentName || matchedSt?.parentName || 'Gia đình';

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:border-purple-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                          {m.totalScore}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900">{m.studentName}</h3>
                            <span className="text-xs bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-md">
                              {m.studentCode}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-900 font-black px-2.5 py-0.5 rounded-full border border-purple-200">
                              {m.milestonePeriod}
                            </span>
                          </div>
                          <div className="text-xs text-purple-800 font-semibold mt-0.5">{m.className}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400 font-medium">Xếp loại đợt đánh giá</div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${
                              m.gradeRank === 'Xuất sắc'
                                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                                : m.gradeRank === 'Giỏi'
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : m.gradeRank === 'Khá'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {m.gradeRank === 'Xuất sắc' && '🌟 '}
                            {m.gradeRank === 'Giỏi' && '👏 '}
                            {m.gradeRank === 'Khá' && '👍 '}
                            {m.gradeRank} ({m.totalScore}/100 đ)
                          </span>
                        </div>

                        <button
                          onClick={() => openEditMilestoneModal(m)}
                          className="p-2 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                          title="Chỉnh sửa bảng đánh giá"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>1. Đi học đủ & Chuyên cần</span>
                          </span>
                          <span className="font-black text-emerald-700">{m.attendanceScore} / 30 đ</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${(m.attendanceScore / 30) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">{m.attendanceDetails}</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span>2. Đủ bài tập & Quizlet</span>
                          </span>
                          <span className="font-black text-indigo-700">{m.homeworkScore} / 30 đ</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${(m.homeworkScore / 30) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">{m.homeworkDetails}</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            <span>3. Điểm số & Tương tác</span>
                          </span>
                          <span className="font-black text-purple-700">{m.examScore} / 40 đ</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all"
                            style={{ width: `${(m.examScore / 40) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">{m.examDetails}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                        <strong className="text-purple-950 font-bold block mb-1">💬 Nhận xét chi tiết của Giáo viên:</strong>
                        <p className="text-slate-700 italic leading-relaxed">"{m.teacherComments}"</p>
                      </div>
                      <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
                        <strong className="text-amber-950 font-bold block mb-1">💡 Lời khuyên & Đề xuất cho Phụ huynh:</strong>
                        <p className="text-slate-700 leading-relaxed">{m.parentAdvice}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200/60">
                        <span className="font-bold text-slate-800">👨‍👩‍👧 Phụ huynh: {pName}</span>
                        <span className="font-mono font-extrabold text-purple-900">({pPhone})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingPrintReport(m)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In Phiếu Cá Nhân</span>
                        </button>

                        <button
                          onClick={() => setZaloModalReport(m)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi Zalo Phụ Huynh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 📝 NHẬN XÉT TỪNG BUỔI HỌC (DAILY NOTES) */}
      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDailyNotes.map((note) => {
            const matchedSt = students.find((s) => s.id === note.studentId || s.name === note.studentName);
            const pPhone = matchedSt?.parentPhone || 'Chưa cập nhật';
            const pName = matchedSt?.parentName || 'Phụ huynh';
            const cleanPPhone = pPhone.replace(/[^0-9]/g, '');

            return (
              <div
                key={note.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{note.studentName}</h3>
                      <div className="text-xs text-purple-700 font-medium">{note.className}</div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDateVN(note.date)}</span>
                    </span>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1.5 mb-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-700 font-medium truncate">
                      <span className="text-slate-500">PH:</span>
                      <strong className="text-slate-900 truncate">{pName}</strong>
                      <span className="text-amber-800 font-mono font-bold ml-1">({pPhone})</span>
                    </div>

                    {pPhone !== 'Chưa cập nhật' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`tel:${pPhone}`}
                          title="Gọi cho phụ huynh"
                          className="p-1 bg-white text-emerald-700 hover:bg-emerald-50 rounded border border-slate-200 text-[10px]"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://zalo.me/${cleanPPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Mở Zalo phụ huynh"
                          className="p-1 bg-white text-blue-600 hover:bg-blue-50 rounded border border-slate-200 text-[10px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(pPhone, note.studentName)}
                          title="Sao chép SĐT phụ huynh"
                          className="p-1 bg-white text-slate-600 hover:bg-slate-100 rounded border border-slate-200 text-[10px]"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 space-y-1.5 text-xs">
                    <div className="text-slate-700">
                      <strong className="text-slate-900">Bài học:</strong> {note.lessonTopic}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Thái độ: {note.attitude}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        BTVN: {note.homeworkStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                          note.quizletStatus === 'Chưa học'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        <span>Quizlet: {note.quizletStatus || 'Đã học'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed bg-purple-50/40 p-3 rounded-xl border border-purple-100/60">
                    <strong className="text-purple-900 block mb-1">Nhận xét của Giáo viên:</strong>
                    <p className="italic">"{note.teacherFeedback}"</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    <span>Kênh gửi: {note.sentVia}</span>
                  </div>

                  {note.parentAcknowledged ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phụ huynh đã đọc</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Chờ PH xem</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredDailyNotes.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
              Chưa có ghi chép sổ liên lạc từng buổi nào phù hợp.
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT INDIVIDUAL 10-SESSION MILESTONE EVALUATION */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingMilestone ? 'Chỉnh Sửa Bảng Đánh Giá 10 Buổi' : 'Tạo Bảng Tổng Hợp Đánh Giá 10 Buổi (Thang điểm 100)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Đánh giá toàn diện chuyên cần, làm bài tập & điểm kiểm tra sau mỗi 10 buổi học
                </p>
              </div>
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMilestoneSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chọn Học Viên:</label>
                  <select
                    value={milestoneForm.studentId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      const st = students.find((s) => s.id === sid);
                      setMilestoneForm((prev) => ({
                        ...prev,
                        studentId: sid,
                        classId: st?.classId || prev.classId,
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code}) - {st.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cột Mốc Đánh Giá:</label>
                  <select
                    value={milestoneForm.milestonePeriod}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, milestonePeriod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-purple-900"
                  >
                    <option value="Buổi 1 - 10">Cột mốc Đợt 1: Buổi 1 - 10</option>
                    <option value="Buổi 11 - 20">Cột mốc Đợt 2: Buổi 11 - 20</option>
                    <option value="Buổi 21 - 30">Cột mốc Đợt 3: Buổi 21 - 30</option>
                    <option value="Buổi 31 - 40">Cột mốc Đợt 4: Buổi 31 - 40</option>
                    <option value="Tổng kết cuối khóa">Cột mốc Tổng kết cuối khóa</option>
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-amber-300" />
                    <span>Tự động tính toán dựa trên dữ liệu hệ thống</span>
                  </div>
                  <p className="text-[11px] text-purple-200">
                    Hệ thống tự động quét lượt điểm danh & điểm kiểm tra gần nhất để gợi ý điểm 100 chính xác.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoCalculateScores(milestoneForm.studentId)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-purple-950 font-extrabold rounded-xl text-xs shrink-0 shadow-xs"
                >
                  ⚡ Tính Điểm Tự Động
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                  Thang Điểm Đánh Giá (Tổng 100 Điểm)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-700 block">1. Đi học đủ (Tối đa 30đ):</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={milestoneForm.attendanceScore}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, attendanceScore: Number(e.target.value) })}
                      className="w-full bg-emerald-50 text-emerald-950 font-black text-base border border-emerald-300 rounded-lg p-1.5 text-center"
                    />
                    <input
                      type="text"
                      placeholder="Ghi chú (Ví dụ: 10/10 buổi)"
                      value={milestoneForm.attendanceDetails}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, attendanceDetails: e.target.value })}
                      className="w-full bg-slate-50 text-[11px] border border-slate-200 rounded-lg p-1 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-700 block">2. Đủ bài tập (Tối đa 30đ):</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={milestoneForm.homeworkScore}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, homeworkScore: Number(e.target.value) })}
                      className="w-full bg-indigo-50 text-indigo-950 font-black text-base border border-indigo-300 rounded-lg p-1.5 text-center"
                    />
                    <input
                      type="text"
                      placeholder="Ghi chú bài tập & Quizlet"
                      value={milestoneForm.homeworkDetails}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, homeworkDetails: e.target.value })}
                      className="w-full bg-slate-50 text-[11px] border border-slate-200 rounded-lg p-1 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="font-bold text-slate-700 block">3. Điểm thi (Tối đa 40đ):</label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={milestoneForm.examScore}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, examScore: Number(e.target.value) })}
                      className="w-full bg-purple-50 text-purple-950 font-black text-base border border-purple-300 rounded-lg p-1.5 text-center"
                    />
                    <input
                      type="text"
                      placeholder="Ghi chú điểm kiểm tra"
                      value={milestoneForm.examDetails}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, examDetails: e.target.value })}
                      className="w-full bg-slate-50 text-[11px] border border-slate-200 rounded-lg p-1 mt-1"
                    />
                  </div>
                </div>

                <div className="bg-purple-100/70 p-3 rounded-xl border border-purple-200 flex items-center justify-between text-purple-950 font-bold">
                  <span>TỔNG ĐIỂM DỰ KIẾN:</span>
                  <span className="text-lg font-black text-purple-900">
                    {milestoneForm.attendanceScore + milestoneForm.homeworkScore + milestoneForm.examScore} / 100 ĐIỂM
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">💬 Nhận xét của Giáo viên chuyên môn:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nhận xét tinh thần học tập, kỹ năng nói, viết và sự tiến bộ..."
                  value={milestoneForm.teacherComments}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, teacherComments: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">💡 Lời khuyên & Định hướng cho Phụ huynh:</label>
                <textarea
                  rows={2}
                  placeholder="Đề xuất giờ tự học, ôn từ vựng Quizlet, đọc báo tiếng Anh ở nhà..."
                  value={milestoneForm.parentAdvice}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, parentAdvice: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>{editingMilestone ? 'Cập Nhật Đánh Giá' : 'Lưu Đánh Giá 10 Buổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLASS MASS ZALO SENDER (GỬI ZALO CHO TOÀN BỘ PHỤ HUYNH TRONG LỚP) */}
      {showClassZaloModal && (() => {
        const targetClass = classes.find((c) => c.id === showClassZaloModal);
        const classStudents = students.filter((s) => s.classId === showClassZaloModal || s.className === targetClass?.name);
        const classReports = milestoneEvaluations.filter(
          (m) => (m.classId === showClassZaloModal || m.className === targetClass?.name) &&
                 (selectedPeriodFilter === 'all' || m.milestonePeriod === selectedPeriodFilter)
        );

        const classBulkMsgText = `[IELTS DƯƠNG VŨ - BẢNG TỔNG HỢP ĐÁNH GIÁ 10 BUỔI]
Lớp: ${targetClass?.name || 'Lớp IELTS'}
Cột mốc đánh giá: ${selectedPeriodFilter}
GVCN: ${targetClass?.teacherName || 'Tâm Vương'}

Kính gửi quý Phụ huynh kết quả học tập tổng hợp đợt ${selectedPeriodFilter} của các con:

${classStudents.map((st, i) => {
  const rep = classReports.find((m) => m.studentId === st.id);
  if (!rep) return `${i + 1}. ${st.name}: Chưa có kết quả đợt này`;
  return `${i + 1}. ${st.name} (${st.code}): ${rep.totalScore}/100đ - Xếp loại: ${rep.gradeRank.toUpperCase()} (Chuyên cần: ${rep.attendanceScore}đ, Bài tập: ${rep.homeworkScore}đ, Điểm thi: ${rep.examScore}đ)`;
}).join('\n')}

Trân trọng cảm ơn quý Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Gửi Báo Cáo 10 Buổi Cho TOÀN BỘ PH Lớp {targetClass?.name}</h3>
                    <p className="text-xs text-slate-500">
                      Gửi tin nhắn Zalo riêng cho từng phụ huynh hoặc đăng bản tin tổng hợp lên Nhóm Zalo Lớp
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowClassZaloModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* List of parents in class with quick Zalo send links */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Danh sách Phụ Huynh Lớp ({classStudents.length} học viên):</span>
                    <button
                      onClick={() => handleMarkClassAsSent(showClassZaloModal)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Đánh Dấu "Đã Gửi Tất Cả Phụ Huynh"</span>
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50">
                    {classStudents.map((st) => {
                      const rep = classReports.find((m) => m.studentId === st.id);
                      const pPhone = st.parentPhone || rep?.parentPhone || '';
                      const cleanPhone = pPhone.replace(/[^0-9]/g, '');

                      return (
                        <div key={st.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">
                              {st.name} <span className="text-purple-700 font-mono">({st.code})</span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              PH: {st.parentName || 'Gia đình'} - <strong className="font-mono text-purple-900">{pPhone || 'Chưa có SĐT'}</strong>
                            </div>
                            {rep ? (
                              <div className="text-[10px] font-bold text-amber-900 mt-0.5">
                                Điểm: {rep.totalScore}/100đ - {rep.gradeRank}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">Chưa tạo đợt {selectedPeriodFilter}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {cleanPhone ? (
                              <a
                                href={`https://zalo.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                  if (rep) {
                                    onUpdateMilestoneEvaluation({
                                      ...rep,
                                      sentToParent: true,
                                      sentDate: new Date().toISOString().split('T')[0],
                                    });
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Mở Chat Zalo</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-rose-500 font-bold">Thiếu SĐT</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mass Zalo Group Message Summary */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800">
                      📲 Mẫu Bản Tin Tổng Hợp Lớp (Gửi Vào Nhóm Zalo Của Lớp):
                    </label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(classBulkMsgText);
                        showToast('📋 Đã sao chép bản tin Zalo tổng hợp lớp!');
                      }}
                      className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-950 font-bold rounded-lg text-[11px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Sao Chép Bản Tin Lớp</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] leading-relaxed select-all whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-800">
                    {classBulkMsgText}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowClassZaloModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: INDIVIDUAL PRINTABLE REPORT SHEET */}
      {viewingPrintReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl my-8 relative">
            <button
              onClick={() => setViewingPrintReport(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Header */}
            <div className="border-b-2 border-purple-900 pb-4 mb-6 flex items-center justify-between">
              <div>
                <div className="font-black text-lg text-purple-950 tracking-wider">
                  IELTS DƯƠNG VŨ
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Chuyên Đào Tạo & Luyện Thi IELTS Cam Kết Đầu Ra High-Band
                </div>
                <div className="text-[11px] text-slate-400">
                  Hotline: 0798934698 | Website: ieltsduongvu.vn
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-purple-900 text-amber-300 font-black text-xs px-3 py-1 rounded-xl">
                  PHIẾU ĐÁNH GIÁ 10 BUỔI
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Ngày lập: {viewingPrintReport.createdDate}
                </div>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 mb-6 grid grid-cols-2 gap-3 text-xs">
              <div>Họ tên học viên: <strong className="text-purple-950 font-extrabold text-sm">{viewingPrintReport.studentName}</strong></div>
              <div>Mã học viên: <strong className="font-mono font-bold text-slate-900">{viewingPrintReport.studentCode}</strong></div>
              <div>Lớp học: <strong className="text-purple-900 font-bold">{viewingPrintReport.className}</strong></div>
              <div>Cột mốc đánh giá: <strong className="text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded">{viewingPrintReport.milestonePeriod}</strong></div>
              <div>Giáo viên chủ nhiệm: <strong className="text-slate-800">{viewingPrintReport.teacherName}</strong></div>
              <div>Phụ huynh học sinh: <strong className="text-slate-800">{viewingPrintReport.parentName || 'Gia đình'} ({viewingPrintReport.parentPhone})</strong></div>
            </div>

            {/* Score Table */}
            <div className="mb-6 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                BẢNG TỔNG HỢP KẾT QUẢ RÈN LUYỆN (THANG ĐIỂM 100)
              </h4>
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-purple-900 text-white font-bold">
                    <th className="p-2.5 border border-purple-800">Tiêu chí đánh giá</th>
                    <th className="p-2.5 border border-purple-800 text-center w-28">Thang điểm tối đa</th>
                    <th className="p-2.5 border border-purple-800 text-center w-28">Điểm đạt được</th>
                    <th className="p-2.5 border border-purple-800">Chi tiết thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  <tr>
                    <td className="p-2.5 border border-slate-200 font-bold">1. Chuyên cần & Đi học đủ</td>
                    <td className="p-2.5 border border-slate-200 text-center">30 điểm</td>
                    <td className="p-2.5 border border-slate-200 text-center font-bold text-emerald-700">{viewingPrintReport.attendanceScore} điểm</td>
                    <td className="p-2.5 border border-slate-200 text-slate-600">{viewingPrintReport.attendanceDetails}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-slate-200 font-bold">2. Đủ bài tập về nhà & Quizlet</td>
                    <td className="p-2.5 border border-slate-200 text-center">30 điểm</td>
                    <td className="p-2.5 border border-slate-200 text-center font-bold text-indigo-700">{viewingPrintReport.homeworkScore} điểm</td>
                    <td className="p-2.5 border border-slate-200 text-slate-600">{viewingPrintReport.homeworkDetails}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-slate-200 font-bold">3. Điểm số kiểm tra & Tương tác</td>
                    <td className="p-2.5 border border-slate-200 text-center">40 điểm</td>
                    <td className="p-2.5 border border-slate-200 text-center font-bold text-purple-700">{viewingPrintReport.examScore} điểm</td>
                    <td className="p-2.5 border border-slate-200 text-slate-600">{viewingPrintReport.examDetails}</td>
                  </tr>
                  <tr className="bg-purple-50 font-black text-purple-950">
                    <td className="p-3 border border-purple-200 font-black text-sm">TỔNG ĐIỂM / XẾP LOẠI</td>
                    <td className="p-3 border border-purple-200 text-center font-black">100 điểm</td>
                    <td className="p-3 border border-purple-200 text-center text-base font-black text-purple-900">
                      {viewingPrintReport.totalScore} điểm
                    </td>
                    <td className="p-3 border border-purple-200 font-black text-amber-900">
                      Xếp loại: {viewingPrintReport.gradeRank.toUpperCase()} 🌟
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Teacher Comments & Parent Advice */}
            <div className="space-y-3 text-xs mb-8">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-purple-950 block mb-1">💬 Nhận xét của Giáo viên chuyên môn:</strong>
                <p className="text-slate-700 italic">{viewingPrintReport.teacherComments}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-purple-950 block mb-1">💡 Định hướng phối hợp cùng Phụ huynh:</strong>
                <p className="text-slate-700">{viewingPrintReport.parentAdvice}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 text-center text-xs pt-4 border-t border-slate-200">
              <div>
                <div className="font-bold text-slate-700">Đại diện Phụ Huynh</div>
                <div className="text-[11px] text-slate-400 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-800">{viewingPrintReport.parentName || 'Phụ huynh học sinh'}</div>
              </div>
              <div>
                <div className="font-bold text-slate-900">Giáo Viên Chủ Nhiệm</div>
                <div className="text-[11px] text-slate-400 italic mt-0.5">(Đã xác thực chữ ký số IDV)</div>
                <div className="h-16 flex items-center justify-center">
                  <div className="text-[10px] bg-purple-100 text-purple-900 px-3 py-1 rounded-full font-bold border border-purple-300">
                    ✓ Đã duyệt bởi IDV Academic Team
                  </div>
                </div>
                <div className="font-bold text-purple-900">{viewingPrintReport.teacherName}</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 mt-8 pt-4 border-t border-slate-100 no-print">
              <button
                onClick={() => setViewingPrintReport(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu Báo Cáo / Xuất PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL CLASS PRINTABLE EVALUATION SHEET */}
      {viewingClassPrintReport && (() => {
        const cls = classes.find((c) => c.id === viewingClassPrintReport);
        const classStudents = students.filter((s) => s.classId === viewingClassPrintReport || s.className === cls?.name);
        const classReports = milestoneEvaluations.filter(
          (m) => (m.classId === viewingClassPrintReport || m.className === cls?.name) &&
                 (selectedPeriodFilter === 'all' || m.milestonePeriod === selectedPeriodFilter)
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl my-8 relative">
              <button
                onClick={() => setViewingClassPrintReport(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 no-print"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Print Header */}
              <div className="border-b-2 border-purple-900 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="font-black text-xl text-purple-950 tracking-wider">
                    IELTS DƯƠNG VŨ
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    BẢNG TỔNG HỢP ĐÁNH GIÁ HỌC TẬP 10 BUỔI THEO LỚP
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-purple-900 text-amber-300 font-black text-xs px-3 py-1 rounded-xl inline-block">
                    {cls?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Đợt: {selectedPeriodFilter}
                  </div>
                </div>
              </div>

              {/* Class Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 grid grid-cols-3 gap-3 text-xs">
                <div>Lớp học: <strong className="text-purple-900 font-bold">{cls?.name}</strong></div>
                <div>GVCN: <strong className="text-slate-800">{cls?.teacherName || 'Tâm Vương'}</strong></div>
                <div>Sĩ số: <strong className="font-mono font-bold text-slate-900">{classStudents.length} Học Viên</strong></div>
              </div>

              {/* Full Class Table */}
              <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-6">
                <thead>
                  <tr className="bg-purple-900 text-white font-bold">
                    <th className="p-2 border border-purple-800 text-center w-10">STT</th>
                    <th className="p-2 border border-purple-800">Mã & Họ Tên Học Sinh</th>
                    <th className="p-2 border border-purple-800 text-center">Đi học (30đ)</th>
                    <th className="p-2 border border-purple-800 text-center">Bài tập (30đ)</th>
                    <th className="p-2 border border-purple-800 text-center">Điểm thi (40đ)</th>
                    <th className="p-2 border border-purple-800 text-center font-black">Tổng (100đ)</th>
                    <th className="p-2 border border-purple-800 text-center">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {classStudents.map((st, i) => {
                    const rep = classReports.find((m) => m.studentId === st.id);
                    return (
                      <tr key={st.id} className="font-medium">
                        <td className="p-2 border border-slate-200 text-center">{i + 1}</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {st.name} <span className="text-purple-700 font-mono text-[10px]">({st.code})</span>
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700">
                          {rep ? `${rep.attendanceScore}đ` : '-'}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold text-indigo-700">
                          {rep ? `${rep.homeworkScore}đ` : '-'}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold text-purple-700">
                          {rep ? `${rep.examScore}đ` : '-'}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-black text-purple-950 bg-purple-50">
                          {rep ? `${rep.totalScore}đ` : '-'}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold">
                          {rep ? rep.gradeRank : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <div className="font-bold text-slate-700">Cố Vấn Học Thuật IDV</div>
                  <div className="h-12"></div>
                  <div className="font-semibold text-slate-800">IDV Academic Management</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Giáo Viên Chủ Nhiệm</div>
                  <div className="h-12"></div>
                  <div className="font-bold text-purple-900">{cls?.teacherName || 'Tâm Vương'}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 no-print">
                <button
                  onClick={() => setViewingClassPrintReport(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
                >
                  Đóng
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Bảng Đánh Giá Lớp</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 5: ZALO INDIVIDUAL MESSAGE GENERATOR */}
      {zaloModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">Gửi Bảng Đánh Giá 10 Buổi Qua Zalo</h3>
              </div>
              <button onClick={() => setZaloModalReport(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-950">👨‍👩‍👧 Phụ huynh: {zaloModalReport.parentName || 'Gia đình'}</div>
                  <div className="text-blue-700 font-mono font-extrabold mt-0.5">SĐT Zalo: {zaloModalReport.parentPhone || 'Chưa có'}</div>
                </div>
                {zaloModalReport.parentPhone && (
                  <a
                    href={`https://zalo.me/${zaloModalReport.parentPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Chat Zalo</span>
                  </a>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mẫu nội dung tin nhắn Zalo gửi Phụ huynh:</label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] leading-relaxed select-all whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-800">
                  {`[IELTS DƯƠNG VŨ - BÁO CÁO ĐÁNH GIÁ 10 BUỔI]

Kính gửi Phụ huynh em: ${zaloModalReport.studentName} (${zaloModalReport.studentCode})
Lớp: ${zaloModalReport.className}
Cột mốc đánh giá: ${zaloModalReport.milestonePeriod}

IELTS DƯƠNG VŨ xin gửi bảng tổng hợp kết quả học tập đợt 10 buổi của con:

🎯 TỔNG ĐIỂM TÍCH LŨY: ${zaloModalReport.totalScore}/100 ĐIỂM
⭐ XẾP LOẠI: ${zaloModalReport.gradeRank.toUpperCase()}

1. Đi học đủ & Chuyên cần: ${zaloModalReport.attendanceScore}/30đ (${zaloModalReport.attendanceDetails})
2. Hoàn thành bài tập & Quizlet: ${zaloModalReport.homeworkScore}/30đ (${zaloModalReport.homeworkDetails})
3. Điểm thi & Tương tác lớp: ${zaloModalReport.examScore}/40đ (${zaloModalReport.examDetails})

💬 Nhận xét GV (${zaloModalReport.teacherName}): "${zaloModalReport.teacherComments}"
💡 Lời khuyên cho gia đình: ${zaloModalReport.parentAdvice}

Trân trọng cảm ơn Phụ huynh đã luôn đồng hành cùng IELTS DƯƠNG VŨ!`}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    const text = `[IELTS DƯƠNG VŨ - BÁO CÁO ĐÁNH GIÁ 10 BUỔI]
Kính gửi Phụ huynh em: ${zaloModalReport.studentName} (${zaloModalReport.studentCode})
Lớp: ${zaloModalReport.className}
Cột mốc: ${zaloModalReport.milestonePeriod}
TỔNG ĐIỂM: ${zaloModalReport.totalScore}/100 điểm (${zaloModalReport.gradeRank})
1. Chuyên cần: ${zaloModalReport.attendanceScore}/30đ
2. Bài tập: ${zaloModalReport.homeworkScore}/30đ
3. Điểm số: ${zaloModalReport.examScore}/40đ
Nhận xét: ${zaloModalReport.teacherComments}
Lời khuyên: ${zaloModalReport.parentAdvice}`;
                    navigator.clipboard.writeText(text);
                    showToast('📋 Đã sao chép nội dung tin nhắn Zalo!');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Mẫu Tin</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateMilestoneEvaluation({
                      ...zaloModalReport,
                      sentToParent: true,
                      sentDate: new Date().toISOString().split('T')[0],
                    });
                    setZaloModalReport(null);
                    showToast(`✓ Đã đánh dấu "Đã gửi Zalo" cho phụ huynh em ${zaloModalReport.studentName}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Đã Gửi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE DAILY NOTE */}
      {showAddDailyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tạo phiếu nhận xét buổi học hàng ngày</h3>
            <p className="text-xs text-slate-500 mb-4">Nhận xét sẽ đồng bộ ngay lên App Phụ huynh và gửi Zalo</p>

            <form onSubmit={handleDailySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Học viên:</label>
                  <select
                    value={dailyForm.studentId}
                    onChange={(e) => setDailyForm({ ...dailyForm, studentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lớp học:</label>
                  <select
                    value={dailyForm.classId}
                    onChange={(e) => setDailyForm({ ...dailyForm, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chủ đề bài học:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Unit 8 - Technology & Society (Speaking Part 3)"
                  value={dailyForm.lessonTopic}
                  onChange={(e) => setDailyForm({ ...dailyForm, lessonTopic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Thái độ học tập:</label>
                  <select
                    value={dailyForm.attitude}
                    onChange={(e) => setDailyForm({ ...dailyForm, attitude: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Hăng hái, tập trung">Hăng hái, tập trung ⭐</option>
                    <option value="Khá tốt">Khá tốt</option>
                    <option value="Cần tập trung hơn">Cần tập trung hơn</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bài tập về nhà:</label>
                  <select
                    value={dailyForm.homeworkStatus}
                    onChange={(e) => setDailyForm({ ...dailyForm, homeworkStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <option value="Hoàn thành 100%">Hoàn thành 100%</option>
                    <option value="Hoàn thành một phần">Hoàn thành một phần</option>
                    <option value="Chưa làm bài">Chưa làm bài</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Từ vựng Quizlet:</label>
                  <select
                    value={dailyForm.quizletStatus}
                    onChange={(e) => setDailyForm({ ...dailyForm, quizletStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-purple-900"
                  >
                    <option value="Đã học">✓ Đã học</option>
                    <option value="Chưa học">✗ Chưa học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lời nhận xét chi tiết:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhận xét sự tiến bộ về phát âm, từ vựng và điểm cần khắc phục..."
                  value={dailyForm.teacherFeedback}
                  onChange={(e) => setDailyForm({ ...dailyForm, teacherFeedback: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDailyModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Phụ Huynh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
