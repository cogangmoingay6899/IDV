import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  Plus,
  Filter,
  School,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  BookOpen,
  UserX,
  Sparkles,
  Building2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  LogIn,
  Edit3,
  Shield,
  Lock,
  MessageSquare,
  ExternalLink,
  Heart,
  CalendarDays,
  Copy,
  Check,
} from 'lucide-react';
import { Student, ClassGroup, Teacher, AttendanceRecord, ExamScore, CurriculumCourse, AuthUser, TuitionTransaction } from '../../types';
import { ClassDetailView } from './ClassDetailView';
import { EditClassModal } from '../modals/EditClassModal';
import { ClassSpreadsheetGradebookModule } from './ClassSpreadsheetGradebookModule';
import { ClassVocabTestModule } from './ClassVocabTestModule';
import { formatDateVN, calculateClassEndInfo } from '../../utils/courseSchedule';

interface StudentsModuleProps {
  students: Student[];
  classes: ClassGroup[];
  teachers?: Teacher[];
  courses?: CurriculumCourse[];
  attendanceRecords?: AttendanceRecord[];
  transactions?: TuitionTransaction[];
  onSaveAttendance?: (records: AttendanceRecord[]) => void;
  onAddTeacher?: (teacher: Teacher) => void;
  onAddExamScore?: (exam: ExamScore) => void;
  onAddStudent: () => void;
  onOpenCreateClass?: () => void;
  onUpdateClass?: (updatedClass: ClassGroup) => void;
  onOpenImportSheet?: () => void;
  onSelectStudentDetail?: (student: Student) => void;
  onEnrollStudentToClass?: (classId: string, studentIdOrData: string | Student) => void;
  onRemoveStudentFromClass?: (classId: string, studentId: string) => void;
  onRestoreStudentFromClass?: (classId: string, studentId: string) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
  onOpenQuickTuition?: () => void;
  currentUser?: AuthUser;
}

export const StudentsModule: React.FC<StudentsModuleProps> = ({
  students,
  classes,
  teachers = [],
  courses = [],
  attendanceRecords = [],
  transactions = [],
  onSaveAttendance,
  onAddTeacher,
  onAddExamScore,
  onAddStudent,
  onOpenCreateClass,
  onUpdateClass,
  onOpenImportSheet,
  onSelectStudentDetail,
  onEnrollStudentToClass,
  onRemoveStudentFromClass,
  onRestoreStudentFromClass,
  onUpdateStudent,
  onOpenQuickTuition,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'sheet_gradebook' | 'students' | 'vocab_tests'>('classes');
  const [selectedClassIdForSheet, setSelectedClassIdForSheet] = useState<string | undefined>(undefined);
  const [selectedClassDetail, setSelectedClassDetail] = useState<ClassGroup | null>(null);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [search, setSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState('all');
  const [quickStudentSearch, setQuickStudentSearch] = useState('');
  const [droppedStudentSearch, setDroppedStudentSearch] = useState('');
  const [zaloToast, setZaloToast] = useState<string | null>(null);

  const formatVND = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  const handleOpenZaloDirect = (student: Student, target: 'parent' | 'student') => {
    const rawPhone = target === 'parent' ? (student.parentPhone || student.phone) : (student.phone || student.parentPhone);
    const cleanPhone = (rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      setZaloToast('Chưa có số điện thoại hợp lệ để mở Zalo');
      setTimeout(() => setZaloToast(null), 3000);
      return;
    }

    const recipientLabel = target === 'parent'
      ? `Phụ huynh ${student.parentName || `em ${student.name}`}`
      : `em ${student.name}`;

    const deadlineStr = student.tuitionDeadlineDate
      ? new Date(student.tuitionDeadlineDate).toLocaleDateString('vi-VN')
      : 'thời hạn quy định';

    const message = `Dạ em chào ${recipientLabel} ạ, em liên hệ từ IELTS DƯƠNG VŨ. Dạ em xin phép gửi thông tin học phí của ${
      target === 'parent' ? `em ${student.name} (Mã HV: ${student.code})` : `bạn`
    } tại lớp ${student.className || 'IELTS'}. Hiện tại số học phí cần hoàn tất là ${formatVND(student.balanceOwed || 0)}, hạn nộp là ${deadlineStr}. ${
      target === 'parent' ? 'Gia đình' : 'Bạn'
    } vui lòng sắp xếp hoàn tất học phí sớm giúp trung tâm để đảm bảo quyền lợi học tập tốt nhất cho học viên nhé ạ. Em cảm ơn ${
      target === 'parent' ? 'Quý phụ huynh' : 'bạn'
    } rất nhiều ạ! ❤️`;

    navigator.clipboard.writeText(message).catch(() => {});
    setZaloToast(`Đã sao chép tin nhắn nhắc học phí & mở Zalo ${target === 'parent' ? 'Phụ huynh' : 'Học viên'}!`);
    setTimeout(() => setZaloToast(null), 3500);

    window.open(`https://zalo.me/${cleanPhone}`, '_blank');
  };

  const isCanViewSystemStudents = !currentUser || currentUser.role === 'admin' || currentUser.role === 'assistant';

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.parentName.toLowerCase().includes(search.toLowerCase());

    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    const matchesStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const rightPanelStudents = students.filter((s) => {
    if (!quickStudentSearch.trim()) return true;
    const q = quickStudentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  });

  const filteredClasses = classes.filter((c) => {
    const matchesBranch = selectedBranchFilter === 'all' || c.branch === selectedBranchFilter;
    const matchesSchedule =
      selectedScheduleFilter === 'all' ||
      (c.schedule && c.schedule.toLowerCase().includes(selectedScheduleFilter.toLowerCase()));
    const matchesClassSearch =
      classSearch.trim() === '' ||
      c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(classSearch.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(classSearch.toLowerCase());
    return matchesBranch && matchesSchedule && matchesClassSearch;
  });

  // If a class is clicked, render the full Class Detail View
  if (selectedClassDetail) {
    const liveClass = classes.find((c) => c.id === selectedClassDetail.id) || selectedClassDetail;
    return (
      <ClassDetailView
        classGroup={liveClass}
        allStudents={students}
        teachers={teachers}
        courses={courses}
        attendanceRecords={attendanceRecords}
        onSaveAttendance={onSaveAttendance}
        onAddTeacher={onAddTeacher}
        onAddExamScore={onAddExamScore}
        onUpdateClass={onUpdateClass}
        onBack={() => setSelectedClassDetail(null)}
        onEnrollStudent={(clsId, data) => onEnrollStudentToClass && onEnrollStudentToClass(clsId, data)}
        onRemoveStudent={(clsId, stdId) => onRemoveStudentFromClass && onRemoveStudentFromClass(clsId, stdId)}
        onRestoreStudent={(clsId, stdId) => onRestoreStudentFromClass && onRestoreStudentFromClass(clsId, stdId)}
        onUpdateStudent={onUpdateStudent}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Danh Sách Lớp Học & Học Viên</h2>
            <p className="text-xs text-slate-500">
              Quản lý danh sách các lớp học IDV từ 64 đến 94 & tra cứu danh sách học viên trực tiếp
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenImportSheet && (
            <button
              onClick={onOpenImportSheet}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nhập Sheet / Excel</span>
            </button>
          )}

          {onOpenCreateClass && (
            <button
              onClick={onOpenCreateClass}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Lớp Mới</span>
            </button>
          )}

          <button
            onClick={onAddStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học viên mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs: Classes on Left, Sổ Lớp Sheet in Middle, Students on Right */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'classes'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School className="w-3.5 h-3.5" />
          <span>Danh sách lớp học ({classes.length})</span>
        </button>

        <button
          onClick={() => {
            setSelectedClassIdForSheet(undefined);
            setActiveTab('sheet_gradebook');
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'sheet_gradebook'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Sổ Lớp &amp; Bảng Điểm (Google Sheet)</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab_tests')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
            activeTab === 'vocab_tests'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Bài Test Từ Vựng Khóa 1, 2, 3, 4</span>
        </button>

        {isCanViewSystemStudents && (
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Danh sách học viên toàn hệ thống ({students.length})</span>
          </button>
        )}
      </div>

      {activeTab === 'classes' ? (
        /* Main Classes Layout with Student List on Right Side for Admin & Assistant; Full Width for Teachers */
        <div className={isCanViewSystemStudents ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "w-full space-y-4"}>
          {/* Classes List: 8 cols on lg if admin/assistant, full width for teachers */}
          <div className={isCanViewSystemStudents ? "lg:col-span-8 space-y-4" : "w-full space-y-4"}>
            {/* Branch Filter, Search & Quick Add Class */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-700">Cơ sở:</span>
                  <select
                    value={selectedBranchFilter}
                    onChange={(e) => setSelectedBranchFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="all">Tất cả cơ sở (Tô Hiệu & Kiến An)</option>
                    <option value="Cơ sở 1 - Tô Hiệu (Hải Phòng)">Cơ sở 1 - Tô Hiệu</option>
                    <option value="Cơ sở 2 - Kiến An (Hải Phòng)">Cơ sở 2 - Kiến An</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-slate-700">Lịch học:</span>
                  <select
                    value={selectedScheduleFilter}
                    onChange={(e) => setSelectedScheduleFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="all">Tất cả lịch (Tuần 2 buổi)</option>
                    <option value="Thứ 2 + Thứ 5">Thứ 2 + Thứ 5</option>
                    <option value="Thứ 3 + Thứ 6">Thứ 3 + Thứ 6</option>
                    <option value="Thứ 4 + Thứ 7">Thứ 4 + Thứ 7</option>
                  </select>
                </div>

                <div className="relative w-48 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm số lớp: 64, 73, 76, 94..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              {onOpenCreateClass && (
                <button
                  onClick={onOpenCreateClass}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tạo lớp</span>
                </button>
              )}
            </div>

            {/* Quick jump pills for classes 64 - 94 */}
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none shadow-xs">
              <span className="font-bold text-slate-500 shrink-0 text-[11px]">Chọn nhanh:</span>
              <button
                onClick={() => setClassSearch('')}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] shrink-0 transition-colors ${
                  classSearch === '' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({classes.length})
              </button>
              {['64', '67', '70', '71', '73', '74', '76', '77', '78', '79', '81', '82', '83', '84', '85', '90', '94'].map((cNum) => (
                <button
                  key={cNum}
                  onClick={() => setClassSearch(cNum)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] shrink-0 transition-colors ${
                    classSearch === cNum ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Lớp {cNum}
                </button>
              ))}
            </div>

            {/* Quick schedule filter tabs: T2+T5, T3+T6, T4+T7 */}
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto text-xs scrollbar-none shadow-xs">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-slate-500 text-[11px]">Lịch học 2 buổi/tuần:</span>
                <button
                  onClick={() => setSelectedScheduleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    selectedScheduleFilter === 'all'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({classes.length})
                </button>
                <button
                  onClick={() => setSelectedScheduleFilter('Thứ 2 + Thứ 5')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    selectedScheduleFilter === 'Thứ 2 + Thứ 5'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  Thứ 2 + Thứ 5 ({classes.filter((c) => c.schedule?.includes('Thứ 2 + Thứ 5')).length})
                </button>
                <button
                  onClick={() => setSelectedScheduleFilter('Thứ 3 + Thứ 6')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    selectedScheduleFilter === 'Thứ 3 + Thứ 6'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  Thứ 3 + Thứ 6 ({classes.filter((c) => c.schedule?.includes('Thứ 3 + Thứ 6')).length})
                </button>
                <button
                  onClick={() => setSelectedScheduleFilter('Thứ 4 + Thứ 7')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    selectedScheduleFilter === 'Thứ 4 + Thứ 7'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  Thứ 4 + Thứ 7 ({classes.filter((c) => c.schedule?.includes('Thứ 4 + Thứ 7')).length})
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline shrink-0">
                Ca 1: 18h-19h45 • Ca 2: 19h45-21h30 (Không có 2-4-6 hay 3-5-7)
              </span>
            </div>

            {/* Classes Cards Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${!isCanViewSystemStudents ? 'xl:grid-cols-3' : ''} gap-4`}>
              {filteredClasses.map((cls) => {
                const progress = Math.round((cls.completedSessions / (cls.totalSessions || 48)) * 100);
                const classStudentCount = students.filter((st) => st.classId === cls.id).length;
                const endInfo = calculateClassEndInfo(cls);
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassDetail(cls)}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md group-hover:bg-purple-100 transition-colors">
                            {cls.code}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              cls.status === 'Đang diễn ra'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {cls.status}
                          </span>
                        </div>

                        {onUpdateClass && (
                          <button
                            type="button"
                            title="Sửa tên lớp và khóa đang học"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClass(cls);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-700 border border-purple-200 hover:border-purple-700 rounded-lg transition-all shadow-2xs z-10"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa lớp</span>
                          </button>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-purple-900 transition-colors">
                        {cls.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3 text-purple-600 shrink-0" />
                        <p className="text-xs text-purple-800 font-semibold">{cls.courseName}</p>
                      </div>

                      {cls.branch && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          <Building2 className="w-3 h-3" />
                          <span>{cls.branch}</span>
                        </div>
                      )}

                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-slate-400 w-20 shrink-0 pt-0.5">Giáo viên:</span>
                          <div className="flex flex-wrap items-center gap-1 font-bold text-slate-800">
                            {(cls.teacherNames && cls.teacherNames.length > 0
                              ? cls.teacherNames
                              : cls.teacherName.split(/[,;&+]/).map((t) => t.trim()).filter((t) => t.length > 0)
                            ).map((tName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-md text-[11px] font-bold"
                              >
                                <GraduationCap className="w-3 h-3 text-indigo-600" />
                                <span>{tName}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        {cls.assistantTeacherName && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-400 w-20">Trợ giảng:</span>
                            <span className="text-slate-700">{cls.assistantTeacherName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-400 w-20">Lịch học:</span>
                          <span className="text-slate-800 font-medium">{cls.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-400 w-20">Phòng học:</span>
                          <span className="text-slate-800">{cls.room}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {/* Schedule end date analysis card */}
                      <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 border border-slate-200/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            Khai giảng: <strong className="text-slate-800 font-semibold">{endInfo.formattedStartDate}</strong>
                          </span>
                          <span className="text-purple-700 font-bold">
                            Bế giảng: {endInfo.formattedEndDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-600 font-medium">
                            {endInfo.totalDays} ngày (~{endInfo.totalWeeks} tuần)
                          </span>
                          <span className={`font-bold ${endInfo.isFinished ? 'text-slate-500' : 'text-emerald-700'}`}>
                            {endInfo.remainingDaysText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">
                          Sĩ số: <strong className="text-purple-900 font-bold">{classStudentCount}</strong>/{cls.maxStudents} học viên
                        </span>
                        <span className="text-purple-700 font-bold">
                          {cls.completedSessions}/{cls.totalSessions || 48} buổi ({progress}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-3">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClassIdForSheet(cls.id);
                            setActiveTab('sheet_gradebook');
                          }}
                          className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                          title="Mở Sổ lớp & Bảng điểm dạng Google Sheet của lớp này"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sổ lớp Sheet</span>
                        </button>
                        <span className="inline-flex items-center gap-1 font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform text-xs">
                          <span>Vào lớp</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredClasses.length === 0 && (
                <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200/80">
                  <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <School className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Chưa tìm thấy lớp học nào</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
                    Thử tìm với từ khóa khác hoặc bấm nút bên dưới để tạo lớp học mới.
                  </p>
                  {onOpenCreateClass && (
                    <button
                      onClick={onOpenCreateClass}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Mở Lớp Học Mới Ngay</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Student Directory Panel (4 cols on lg, only for Admin & Assistant) */}
          {isCanViewSystemStudents && (
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Active students */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-700" />
                    <h3 className="font-bold text-xs text-slate-900">Danh Sách Học Viên Toàn Hệ Thống</h3>
                  </div>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {students.length} học viên
                  </span>
                </div>

                {/* Quick Search inside Right Panel */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm học viên nhanh..."
                    value={quickStudentSearch}
                    onChange={(e) => setQuickStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Học sinh mới nhất:</span>
                  <button
                    onClick={onAddStudent}
                    className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm học viên</span>
                  </button>
                </div>

                {/* Student list scrollable */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100">
                  {rightPanelStudents.map((st) => (
                    <div
                      key={st.id}
                      className="pt-2 pb-1 hover:bg-purple-50/50 rounded-xl px-2 transition-colors flex items-center justify-between gap-2 text-xs group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {st.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 truncate block text-xs">{st.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="font-mono text-purple-700 font-semibold">{st.code}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium truncate">{st.className || 'Chưa xếp lớp'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>SĐT: {st.phone}</span>
                          {st.tuitionStatus === 'Đã đóng đủ' ? (
                            <span className="text-emerald-700 font-semibold">✓ Đủ phí</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">Nợ phí</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Zalo Phụ huynh */}
                        <button
                          type="button"
                          onClick={() => handleOpenZaloDirect(st, 'parent')}
                          className="px-1.5 py-1 text-[10px] font-bold text-white bg-[#0068FF] hover:bg-[#0052cc] rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          title={`Mở Zalo Phụ Huynh: ${st.parentPhone || st.phone} (kèm mẫu nhắc học phí)`}
                        >
                          <span className="w-3 h-3 rounded bg-white text-[#0068FF] font-black text-[7px] flex items-center justify-center">Z</span>
                          <span>PH</span>
                        </button>

                        {/* Zalo Học viên */}
                        <button
                          type="button"
                          onClick={() => handleOpenZaloDirect(st, 'student')}
                          className="px-1.5 py-1 text-[10px] font-bold text-cyan-800 bg-cyan-100 hover:bg-cyan-200 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                          title={`Mở Zalo Học Viên: ${st.phone}`}
                        >
                          <span className="w-3 h-3 rounded bg-cyan-800 text-white font-black text-[7px] flex items-center justify-center">Z</span>
                          <span>HV</span>
                        </button>

                        {st.classId && (
                          <button
                            onClick={() => {
                              const target = classes.find((c) => c.id === st.classId || c.name === st.className);
                              if (target) setSelectedClassDetail(target);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-700 group-hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                            title="Vào lớp của học viên này"
                          >
                            Lớp
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {rightPanelStudents.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy học viên phù hợp.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab('students')}
                    className="w-full py-2 text-center text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Xem bảng chi tiết tất cả học viên ({students.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Dropped students */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4 border-rose-100 bg-rose-50/10">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-600 animate-pulse" />
                    <h3 className="font-bold text-xs text-slate-900">Học Viên Đã Bị Loại Khỏi Lớp</h3>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {students.filter(s => s.status === 'Đã nghỉ học' || s.droppedClassId).length} học viên
                  </span>
                </div>

                {/* Quick Search inside Dropped Panel */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm học viên đã nghỉ..."
                    value={droppedStudentSearch}
                    onChange={(e) => setDroppedStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {/* Dropped list scrollable */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100">
                  {students
                    .filter((s) => s.status === 'Đã nghỉ học' || s.droppedClassId)
                    .filter((s) => {
                      if (!droppedStudentSearch.trim()) return true;
                      const q = droppedStudentSearch.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.code.toLowerCase().includes(q)
                      );
                    })
                    .map((st) => (
                      <div
                        key={st.id}
                        className="pt-2 pb-1 hover:bg-rose-50/40 rounded-xl px-2 transition-colors flex items-center justify-between gap-2 text-xs group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {st.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 line-through truncate block text-xs">{st.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-rose-700 font-semibold">{st.code}</span>
                              <span>•</span>
                              <span className="text-rose-800 font-medium truncate" title={st.droppedClassName}>
                                Lớp cũ: {st.droppedClassName || 'Không rõ lớp'}
                              </span>
                            </div>
                            {st.droppedReason && (
                              <span className="text-[10px] text-slate-500 italic">Lý do: {st.droppedReason}</span>
                            )}
                            {st.droppedDate && (
                              <span className="text-[9px] text-slate-400">Ngày nghỉ: {st.droppedDate}</span>
                            )}
                          </div>
                        </div>

                        {st.droppedClassId && onRestoreStudentFromClass && (
                          <button
                            onClick={() => {
                              onRestoreStudentFromClass(st.droppedClassId!, st.id);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white rounded-lg transition-colors shrink-0 border border-rose-200"
                            title="Khôi phục học viên về lại lớp này"
                          >
                            Khôi phục
                          </button>
                        )}
                      </div>
                    ))}

                  {students.filter(s => s.status === 'Đã nghỉ học' || s.droppedClassId).length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Chưa có học viên nào bị loại khỏi lớp.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'sheet_gradebook' ? (
        /* Google Sheet Style Gradebook & Tuition Record */
        <div className="space-y-4">
          <ClassSpreadsheetGradebookModule
            classes={classes}
            students={students}
            attendanceRecords={attendanceRecords}
            transactions={transactions}
            onOpenQuickTuition={onOpenQuickTuition}
            initialClassId={selectedClassIdForSheet}
          />
        </div>
      ) : activeTab === 'vocab_tests' ? (
        /* Vocab Tests for Course 1, 2, 3, 4 */
        <div className="space-y-4">
          <ClassVocabTestModule
            classes={classes}
            students={students}
            onAddExamScore={onAddExamScore}
            onSaveAttendance={onSaveAttendance}
            showToast={(msg) => setZaloToast(msg)}
            currentUser={currentUser}
          />
        </div>
      ) : isCanViewSystemStudents ? (
        /* Full Students Table View for Admin & Assistant */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, mã HV, SĐT, phụ huynh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả lớp học</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Đang học">Đang học</option>
                <option value="Bảo lưu">Bảo lưu</option>
                <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Học viên</th>
                  <th className="py-3 px-4">Khóa học / Lớp</th>
                  <th className="py-3 px-4">Phụ huynh & Học viên (Zalo)</th>
                  <th className="py-3 px-4">Học phí & Hạn nộp</th>
                  <th className="py-3 px-4 text-center">Đòi Phí Qua Zalo</th>
                  <th className="py-3 px-4">Ngày tham gia</th>
                  <th className="py-3 px-4">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isUnpaid = s.tuitionStatus !== 'Đã đóng đủ' && (s.balanceOwed || 0) > 0;
                  const isOverdue = isUnpaid && s.tuitionDeadlineDate && new Date(s.tuitionDeadlineDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                              <span>{s.code}</span>
                              <span>•</span>
                              <span>{s.gender}</span>
                              <span>•</span>
                              <span>{formatDateVN(s.dob)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            const target = classes.find((c) => c.id === s.classId || c.name === s.className);
                            if (target) setSelectedClassDetail(target);
                          }}
                          className="text-left group/cls block"
                          title="Bấm để vào xem lớp học này"
                        >
                          <div className="font-semibold text-slate-800 group-hover/cls:text-purple-700 transition-colors underline-offset-2 hover:underline">
                            {s.className}
                          </div>
                          <div className="text-[11px] text-purple-600 font-medium">{s.courseName}</div>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">PH:</span>
                            <span className="text-slate-900 font-semibold">{s.parentName || 'Chưa cập nhật'}</span>
                            <span className="text-slate-500 text-[11px]">({s.parentPhone || s.phone})</span>
                            <button
                              type="button"
                              onClick={() => handleOpenZaloDirect(s, 'parent')}
                              className="px-1.5 py-0.5 text-[10px] font-black text-white bg-[#0068FF] hover:bg-[#0052cc] rounded shadow-2xs inline-flex items-center gap-0.5 cursor-pointer ml-1"
                              title={`Mở Zalo Phụ huynh: ${s.parentPhone || s.phone}`}
                            >
                              <span className="text-[8px]">Z</span>
                              <span>PH</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500">HV:</span>
                            <span className="text-slate-700">{s.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleOpenZaloDirect(s, 'student')}
                              className="px-1.5 py-0.5 text-[10px] font-black text-cyan-800 bg-cyan-100 hover:bg-cyan-200 rounded inline-flex items-center gap-0.5 cursor-pointer ml-1"
                              title={`Mở Zalo Học viên: ${s.phone}`}
                            >
                              <span className="text-[8px]">Z</span>
                              <span>HV</span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {s.tuitionStatus === 'Đã đóng đủ' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã đóng đủ</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span>Nợ: {new Intl.NumberFormat('vi-VN').format(s.balanceOwed)}đ</span>
                              </span>
                              {isOverdue && (
                                <div className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Quá hạn nộp!</span>
                                </div>
                              )}
                            </div>
                          )}
                          {s.tuitionDeadlineDate && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Hạn: {formatDateVN(s.tuitionDeadlineDate)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isUnpaid ? (
                          <div className="inline-flex flex-col gap-1 items-center">
                            <button
                              type="button"
                              onClick={() => handleOpenZaloDirect(s, 'parent')}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-[#0068FF] hover:bg-[#0054cc] rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                              title="Tự động mở Zalo Phụ huynh kèm tin nhắn đòi học phí nhẹ nhàng"
                            >
                              <span className="w-3.5 h-3.5 rounded bg-white text-[#0068FF] font-black text-[8px] flex items-center justify-center">Z</span>
                              <span>Nhắc Phụ Huynh</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <span className="text-[9px] text-slate-400 italic">Mở app Zalo & sao chép mẫu</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">Hoàn tất</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDateVN(s.joinDate)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            s.status === 'Đang học'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : s.status === 'Bảo lưu'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 mb-1">Chưa có học viên nào</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                        Dữ liệu học viên hiện tại đang trống. Hãy bấm "Thêm học viên mới" để ghi danh học viên đầu tiên vào hệ thống IDV.
                      </p>
                      <button
                        onClick={onAddStudent}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm học viên mới ngay</span>
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Restricted Access View for Teachers */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Quyền Truy Cập Hạn Chế</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Danh sách toàn bộ học viên trên toàn hệ thống chỉ hiển thị cho tài khoản <strong>Quản lý (Admin)</strong> và <strong>Trợ lý</strong>.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Thầy/cô Giáo viên vui lòng quay về danh sách lớp học và chọn nút <strong>"Vào lớp"</strong> để quản lý học viên theo từng lớp học.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Quay Về Danh Sách Lớp Học
          </button>
        </div>
      )}
      {/* Modal: Edit Class Details */}
      {editingClass && onUpdateClass && (
        <EditClassModal
          isOpen={editingClass !== null}
          onClose={() => setEditingClass(null)}
          classGroup={editingClass}
          teachers={teachers}
          courses={courses}
          onUpdateClass={(updated) => {
            onUpdateClass(updated);
            setEditingClass(null);
          }}
        />
      )}
      {/* Toast Notification */}
      {zaloToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-xs text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{zaloToast}</span>
        </div>
      )}
    </div>
  );
};
