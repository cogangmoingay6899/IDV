import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  User,
  MapPin,
  Building,
  GraduationCap,
  Sparkles,
  Check,
  Users,
  Search,
  UserPlus,
  Bell,
  AlertCircle,
  CalendarCheck2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { ClassGroup, Teacher, CurriculumCourse, Student } from '../../types';
import {
  COURSE_LEVEL_CONFIGS,
  SCHEDULE_PRESETS,
  calculateCourseSchedule,
  CourseLevelKey,
  detectCourseLevel,
  formatDateVN,
} from '../../utils/courseSchedule';
import { StandardScheduleSelector } from '../common/StandardScheduleSelector';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  courses: CurriculumCourse[];
  students?: Student[];
  defaultBranch?: string;
  onAddClass: (newClass: ClassGroup, selectedStudentIds?: string[]) => void;
  onAddBatchClasses?: (classes: ClassGroup[]) => void;
  onSave?: (newClass: ClassGroup, selectedStudentIds?: string[]) => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  teachers,
  courses,
  students = [],
  defaultBranch = 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  onAddClass,
  onAddBatchClasses,
  onSave,
}) => {
  const [activeMode, setActiveMode] = useState<'manual' | 'excel'>('manual');
  const [excelRawText, setExcelRawText] = useState('');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState<CourseLevelKey>('Khóa 1');
  const [selectedSchedulePreset, setSelectedSchedulePreset] = useState<string>('t2_t5_ca1');
  const [offDates, setOffDates] = useState<string[]>([]);
  const [newOffDateInput, setNewOffDateInput] = useState<string>('');
  const [missedPastSessions, setMissedPastSessions] = useState<number>(0);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [formData, setFormData] = useState({
    code: `IDV-L74`,
    name: 'Lớp 74',
    courseName: 'PRE',
    courseId: 'crs-pre',
    courseLevel: 'Khóa 1' as CourseLevelKey,
    branch: defaultBranch,
    teacherName: teachers[0]?.name || 'Tâm Vương',
    assistantTeacherName: '',
    room: 'Phòng 201 - Tầng 2',
    schedule: SCHEDULE_PRESETS[0].name,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalSessions: 32,
    maxStudents: 15,
    tuitionFee: 14500000,
    status: 'Đang diễn ra' as ClassGroup['status'],
  });

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

  const pastScheduledSessions = useMemo(() => {
    return calculatedSchedule.sessions.filter((s) => s.date <= todayStr);
  }, [calculatedSchedule.sessions, todayStr]);

  const pastScheduledCount = pastScheduledSessions.length;
  const isPastStart = formData.startDate < todayStr;
  const studiedPastSessions = isPastStart ? Math.max(0, pastScheduledCount - Number(missedPastSessions || 0)) : 0;

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(
    teachers[0]?.name ? [teachers[0].name] : ['Tâm Vương']
  );
  const [customTeacherInput, setCustomTeacherInput] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [waitingStudentSearch, setWaitingStudentSearch] = useState('');
  const [showWaitingStudentsSection, setShowWaitingStudentsSection] = useState(false);

  const handleSelectCourseLevel = (levelKey: CourseLevelKey) => {
    setSelectedCourseLevel(levelKey);
    const config = COURSE_LEVEL_CONFIGS[levelKey];
    setFormData((prev) => ({
      ...prev,
      courseLevel: levelKey,
      courseName: config.name,
      totalSessions: config.totalSessions,
    }));
  };

  const handleSelectSchedulePreset = (presetId: string) => {
    setSelectedSchedulePreset(presetId);
    const preset = SCHEDULE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        schedule: preset.name,
      }));
    }
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

  // Filter students who are waiting for class placement or on reserve
  const waitingStudents = students.filter(
    (s) =>
      s.status === 'Chờ xếp lớp' ||
      s.status === 'Bảo lưu' ||
      !s.classId ||
      s.classId === 'waiting_list'
  );

  const filteredWaitingStudents = waitingStudents.filter((s) => {
    if (!waitingStudentSearch.trim()) return true;
    const q = waitingStudentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((stId) => stId !== id) : [...prev, id]
    );
  };

  const handleCourseChange = (courseName: string) => {
    const found = courses.find((c) => c.name === courseName);
    setFormData((prev) => ({
      ...prev,
      courseName,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên lớp học!');
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

    let finalOffDates = [...offDates];
    let finalCompletedSessions = 0;
    if (isPastStart) {
      finalCompletedSessions = studiedPastSessions;
      if (missedPastSessions > 0) {
        const pastDatesToOff = pastScheduledSessions.slice(0, Number(missedPastSessions)).map((s) => s.date);
        for (const d of pastDatesToOff) {
          if (!finalOffDates.includes(d)) {
            finalOffDates.push(d);
          }
        }
      }
    }

    const newClass: ClassGroup = {
      id: `cls-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      courseId: formData.courseId,
      courseName: formData.courseName,
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
      totalSessions: Number(formData.totalSessions),
      completedSessions: finalCompletedSessions,
      maxStudents: Number(formData.maxStudents),
      currentStudents: selectedStudentIds.length,
      tuitionFee: Number(formData.tuitionFee),
      status: formData.status,
      offDates: finalOffDates,
    };

    if (onAddClass) {
      onAddClass(newClass, selectedStudentIds);
    } else if (onSave) {
      onSave(newClass, selectedStudentIds);
    }
    onClose();
  };

  const handleBatchExcelImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelRawText.trim()) {
      alert('Vui lòng dán dữ liệu từ Excel hoặc Google Sheets!');
      return;
    }
    const lines = excelRawText.split('\n').filter((l) => l.trim().length > 0);
    const newClasses: ClassGroup[] = [];
    let startIdx = 0;
    if (lines[0].toLowerCase().includes('mã') || lines[0].toLowerCase().includes('tên')) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      if (cols.length >= 2) {
        const code = cols[0]?.trim() || `IDV-L${Math.floor(100 + Math.random() * 900)}`;
        const name = cols[1]?.trim() || `Lớp ${code}`;
        const courseName = cols[2]?.trim() || 'PRE';
        const branch = cols[3]?.trim() || defaultBranch;
        const teacherName = cols[4]?.trim() || teachers[0]?.name || 'Tâm Vương';
        const assistantTeacherName = cols[5]?.trim() || '';
        const room = cols[6]?.trim() || 'Phòng 201';
        const schedule = cols[7]?.trim() || SCHEDULE_PRESETS[0].name;
        const startDate = cols[8]?.trim() || new Date().toISOString().split('T')[0];
        const maxStudents = Number(cols[9]?.trim()) || 15;
        const tuitionFee = Number(cols[10]?.trim()) || 14500000;

        const teacherList = teacherName.split(/[,;&+]/).map((t) => t.trim()).filter((t) => t.length > 0);

        newClasses.push({
          id: `cls-${Date.now()}-${i}`,
          code: code.toUpperCase(),
          name,
          courseId: 'crs-custom',
          courseName,
          courseLevel: 'Khóa 1',
          currentTermName: 'Khóa 1',
          branch,
          teacherId: teachers.find((t) => t.name === teacherList[0])?.id || 't-multi',
          teacherName: teacherList.join(', '),
          teacherNames: teacherList,
          assistantTeacherName: assistantTeacherName || undefined,
          room,
          schedule,
          startDate,
          endDate: '',
          totalSessions: 32,
          completedSessions: 0,
          maxStudents,
          currentStudents: 0,
          tuitionFee,
          status: 'Đang diễn ra',
          offDates: [],
        });
      }
    }

    if (newClasses.length === 0) {
      alert('Không phân tích được dữ liệu. Kiểm tra lại định dạng cột.');
      return;
    }

    if (onAddBatchClasses) {
      onAddBatchClasses(newClasses);
    } else {
      newClasses.forEach((c) => onAddClass(c));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl w-full max-w-3xl my-2 sm:my-4 md:my-6 flex flex-col min-h-0 max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="shrink-0 bg-gradient-to-r from-purple-800 to-indigo-700 px-5 py-4 sm:px-6 sm:py-5 text-white flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Mở Lớp Học Mới - IDV</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-purple-100 font-medium">
                  <ArrowUpDown className="w-2.5 h-2.5" /> Có thể cuộn lên/xuống
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200">
                Thiết lập thông tin lớp học, tự nhập hoặc chọn nhiều giáo viên cùng giảng dạy
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

        {/* Modal Form */}
        <form onSubmit={activeMode === 'manual' ? handleSubmit : handleBatchExcelImport} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="bg-slate-100 p-2 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2 max-w-md mx-auto bg-white p-1 rounded-2xl shadow-xs border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMode('manual')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  activeMode === 'manual'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 Tạo thủ công 1 lớp
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('excel')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === 'excel'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>📊 Nhập từ Excel / Google Sheets</span>
              </button>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
          {activeMode === 'excel' ? (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 space-y-2">
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-emerald-800">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Hướng dẫn nhập danh sách lớp từ Google Sheets / Excel</span>
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Sao chép các cột từ bảng Google Sheets hoặc Excel của bạn (bao gồm tiêu đề hoặc dữ liệu trực tiếp) theo thứ tự:
                </p>
                <div className="bg-white/80 p-2 rounded-xl font-mono text-[11px] text-slate-700 border border-emerald-200 overflow-x-auto">
                  Mã lớp | Tên lớp | Khóa học | Cơ sở | Giảng viên | Trợ giảng | Phòng | Lịch học | Ngày bắt đầu | Sĩ số | Học phí
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  💡 Bạn có thể dán trực tiếp hàng chục lớp học cùng lúc vào ô bên dưới. Giáo viên có tên trong danh sách sẽ tự động được phân quyền xem lớp đó.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Dán dữ liệu Excel / Google Sheets vào đây <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={10}
                  value={excelRawText}
                  onChange={(e) => setExcelRawText(e.target.value)}
                  placeholder="Dán dữ liệu bảng từ Excel / Google Sheets (Tab-separated)..."
                  className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                ></textarea>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Mã lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="VD: IDV-K01"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Tên lớp học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="VD: IELTS Intensive 6.5 - K01"
              />
            </div>
          </div>

          {/* Row 2: Course Level Selection (Khóa 1 - 4) */}
          <div className="space-y-2 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 p-4 rounded-2xl border border-purple-200/80">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <span>Cấp độ Khóa học chuẩn IELTS DƯƠNG VŨ:</span>
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
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                        : 'bg-white text-slate-700 hover:bg-purple-50 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center justify-between">
                      <span>{lvlKey}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-purple-100' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cfg.totalSessions} buổi
                      </span>
                    </div>
                    <div className={`text-[10px] mt-1 font-semibold truncate ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                      {cfg.name}
                    </div>
                    <div className={`text-[9px] mt-1 line-clamp-2 ${isSelected ? 'text-amber-200' : 'text-slate-400'}`}>
                      {cfg.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-600 block mb-1 text-[11px]">Tên chương trình:</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1 text-[11px]">Cơ sở đào tạo:</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-none"
                >
                  <option value="Cơ sở 1 - Tô Hiệu (Hải Phòng)">Cơ sở 1 - Tô Hiệu (Hải Phòng)</option>
                  <option value="Cơ sở 2 - Kiến An (Hải Phòng)">Cơ sở 2 - Kiến An (Hải Phòng)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Multi-teacher management & Custom teacher entry */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-indigo-700" />
                <span>Giáo viên giảng dạy (Hỗ trợ tự nhập & 1 lớp có nhiều GV cùng dạy):</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                {selectedTeachers.length} Giáo viên
              </span>
            </div>

            {/* Selected Teachers Badges */}
            {selectedTeachers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-xl border border-indigo-200">
                {selectedTeachers.map((tName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-300 font-bold rounded-lg text-xs shadow-2xs"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{tName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeacher(tName)}
                      className="text-slate-400 hover:text-rose-600 ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom Teacher Name Entry & Quick Add */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  placeholder="Tự nhập tên giáo viên (VD: Thầy Alex Morgan, Cô Mai Phương)..."
                  value={customTeacherInput}
                  onChange={(e) => setCustomTeacherInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTeacher();
                    }
                  }}
                  className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="sm:col-span-4 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleAddCustomTeacher}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm GV này</span>
                </button>
              </div>
            </div>

            {/* Quick click to add from existing teacher database */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                Chọn nhanh từ danh sách giáo viên trung tâm:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {teachers.map((t) => {
                  const isSelected = selectedTeachers.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleTeacher(t.name)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{t.name}</span>
                      <span className="text-[9px] opacity-75">({t.type === 'Bản ngữ (Native)' ? 'Native' : 'VN'})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Free-Form Text Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Chuỗi tên giáo viên đầy đủ:
              </label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, teacherName: val });
                  const splitted = val
                    .split(/[,;&+]/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0);
                  setSelectedTeachers(splitted);
                }}
                placeholder="VD: Tâm Vương, Minh Tâm, Thơm Nguyễn"
                className="w-full bg-white border border-indigo-200 rounded-xl p-2 font-bold text-indigo-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Assistant & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Trợ giảng / Quản nhiệm (Tùy chọn)</label>
              <input
                type="text"
                value={formData.assistantTeacherName}
                onChange={(e) => setFormData({ ...formData, assistantTeacherName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                placeholder="VD: Nguyễn Thảo Trang (Trợ giảng)"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phòng học</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                placeholder="VD: Phòng 201 - Tầng 2"
              />
            </div>
          </div>

          {/* Row 5: Standard Schedule Selection (Tuần 2 buổi: Thứ 2+Thứ 5, Thứ 3+Thứ 6, hoặc Thứ 4+Thứ 7) */}
          <StandardScheduleSelector
            value={formData.schedule}
            onChange={(newSchedule) => {
              setFormData((prev) => ({ ...prev, schedule: newSchedule }));
            }}
          />

          {/* Row 6: Dates & Sessions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">
                Ngày khai giảng <span className="text-rose-500">*</span>
              </label>
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
                value={formData.totalSessions}
                onChange={(e) => setFormData({ ...formData, totalSessions: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-purple-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Sĩ số tối đa</label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Past Start Date & Missed Sessions Configuration */}
          {isPastStart && (
            <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Khai giảng trong quá khứ ({formData.startDate}): Đã qua {pastScheduledCount} buổi theo lịch</span>
                </span>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  Cập nhật tiến độ tự động
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Số buổi đã nghỉ trong quá khứ (lễ, nghỉ phép...)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={pastScheduledCount}
                    value={missedPastSessions}
                    onChange={(e) => setMissedPastSessions(Math.max(0, Math.min(pastScheduledCount, Number(e.target.value))))}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2 font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Số buổi đã học đến hiện tại:</span>
                    <span className="text-sm font-black text-purple-700">{studiedPastSessions} buổi / {pastScheduledCount} buổi đã lịch</span>
                  </div>
                  <span className="text-xs font-black bg-purple-100 text-purple-900 px-3 py-1 rounded-lg">
                    Tự gán
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Calculated Projected Schedule & Estimated End Date Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2.5">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h4 className="font-black text-sm tracking-wide text-white">
                    LỘ TRÌNH DỰ KIẾN & NGÀY KẾT THÚC KHÓA
                  </h4>
                  <p className="text-[11px] text-purple-200">
                    Tự động tính toán theo lịch 2 buổi/tuần và cập nhật ngay khi có buổi nghỉ
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-400 text-amber-950 font-black rounded-lg text-xs self-start sm:self-auto">
                {selectedCourseLevel} ({calculatedSchedule.totalSessions} buổi)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-purple-200 font-semibold block">Ngày kết thúc khóa (Lịch tuần 2 buổi):</span>
                <div className="text-base sm:text-lg font-black text-amber-300 mt-0.5">
                  {calculatedSchedule.formattedEstimatedEndDate || 'Đang tính...'}
                </div>
                <div className="text-[10px] text-purple-200 font-medium mt-0.5">
                  Tổng thời gian: <strong className="text-white font-bold">{calculatedSchedule.totalDays} ngày</strong> (~{calculatedSchedule.totalWeeks} tuần • {calculatedSchedule.totalSessions} buổi)
                </div>
                <span className="text-[9px] text-purple-300/80 block mt-0.5">
                  Buổi {calculatedSchedule.totalSessions} ({calculatedSchedule.sessions[calculatedSchedule.sessions.length - 1]?.dayOfWeekName || ''})
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-purple-200 font-semibold block">Lịch kiểm tra cuối khóa:</span>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  Buổi {calculatedSchedule.examSessions.join(' & ')}
                </div>
                <span className="text-[10px] text-emerald-300 block mt-0.5">
                  {selectedCourseLevel === 'Khóa 4' ? 'Buổi 31-32 (Không nghỉ)' : 'Thi xong nghỉ 1 buổi trước khóa sau'}
                </span>
                <span className="text-[9px] text-purple-200 block mt-0.5">
                  Lịch học: {calculatedSchedule.scheduleDaysLabel}
                </span>
              </div>

              <div className="bg-amber-500/20 backdrop-blur-xs p-3 rounded-xl border border-amber-400/30">
                <span className="text-[11px] text-amber-200 font-bold block flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buổi 29 - Nhắc xếp Trợ giảng (TA):</span>
                </span>
                <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
                  {calculatedSchedule.formattedSession29Date || 'Buổi 29'}
                </div>
                <span className="text-[10px] text-amber-100 block mt-0.5">
                  Giáo viên nhắn Quản lý chuẩn bị TA
                </span>
              </div>
            </div>

            {calculatedSchedule.breakSessionsCount > 0 && (
              <div className="text-[11px] bg-white/10 rounded-xl p-2.5 flex items-center justify-between text-purple-100">
                <span>
                  🎓 Nghỉ 1 buổi sau khi kết thúc khóa • Dự kiến khai giảng <strong>{calculatedSchedule.config.nextCourseName}</strong>:
                </span>
                <strong className="text-amber-300 ml-2">{calculatedSchedule.formattedNextCourseStartDate}</strong>
              </div>
            )}

            {/* Off Dates / Nghỉ buổi nào đó -> Tự động dời ngày kết thúc */}
            <div className="pt-2 border-t border-white/15 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Danh sách ngày nghỉ / nghỉ lễ của lớp ({offDates.length} ngày đã dời):</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={newOffDateInput}
                    onChange={(e) => setNewOffDateInput(e.target.value)}
                    className="bg-white text-slate-800 text-xs px-2.5 py-1 rounded-lg border-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddOffDate}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs transition-colors"
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
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/30 border border-rose-400/40 text-rose-100 rounded-lg text-[11px] font-semibold"
                    >
                      <span>Nghỉ: {formatDateVN(d)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOffDate(d)}
                        className="hover:text-white ml-0.5 text-rose-300"
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

          {/* Row 7: Tuition Fee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Học phí (VNĐ)</label>
              <input
                type="number"
                step={500000}
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Trạng thái ban đầu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ClassGroup['status'] })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none"
              >
                <option value="Đang diễn ra">Đang diễn ra</option>
                <option value="Sắp khai giảng">Sắp khai giảng</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
            </div>
          </div>

          {/* Row 8: Danh sách học sinh chờ xếp lớp / chờ khóa sau (Thu gọn / Mở rộng để dễ cuộn & không che khuất phía trên) */}
          <div className="bg-purple-50/70 p-3.5 sm:p-4 rounded-2xl border border-purple-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <label className="font-extrabold text-purple-950 text-xs block">
                    Danh Sách Học Sinh Chờ Xếp Lớp / Chờ Khóa Sau
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Hiện có <strong>{waitingStudents.length}</strong> học viên chờ xếp lớp
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedStudentIds.length > 0 && (
                  <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Đã chọn: <strong>{selectedStudentIds.length}</strong> HV
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowWaitingStudentsSection(!showWaitingStudentsSection)}
                  className="px-3 py-1 bg-white hover:bg-purple-50 border border-purple-200 text-purple-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {showWaitingStudentsSection ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Thu gọn bảng</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Xem & chọn học sinh ({waitingStudents.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showWaitingStudentsSection && (
              <div className="space-y-2 pt-2 border-t border-purple-200/70 animate-in fade-in">
                <p className="text-[11px] text-slate-500">
                  Dưới đây là các học sinh chưa có lớp, đang ở trạng thái chờ xếp hoặc bảo lưu. Bạn có thể chọn nhanh để xếp ngay vào lớp học mới tạo này:
                </p>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh theo tên, ngày sinh, gmail, SĐT học sinh chờ..."
                    value={waitingStudentSearch}
                    onChange={(e) => setWaitingStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto overflow-x-auto border border-purple-200/80 rounded-xl bg-white divide-y divide-purple-100">
                  {filteredWaitingStudents.length > 0 ? (
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-purple-100/70 text-purple-950 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-2 w-8 text-center">Chọn</th>
                          <th className="py-2 px-2 w-10 text-center">STT</th>
                          <th className="py-2 px-2 font-bold min-w-[130px]">Tên học viên</th>
                          <th className="py-2 px-2 min-w-[140px]">Gmail</th>
                          <th className="py-2 px-2 min-w-[90px]">Ngày sinh</th>
                          <th className="py-2 px-2 min-w-[100px]">Số điện thoại</th>
                          <th className="py-2 px-2 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredWaitingStudents.map((st, idx) => {
                          const isSelected = selectedStudentIds.includes(st.id);
                          const cleanEmail =
                            st.email ||
                            `${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

                          return (
                            <tr
                              key={st.id}
                              onClick={() => toggleSelectStudent(st.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-purple-100/60 font-semibold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 text-purple-700 rounded border-slate-300 focus:ring-purple-500"
                                />
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-2">
                                <div className="font-bold text-slate-900">{st.name}</div>
                                <div className="text-[10px] text-purple-700 font-mono">{st.code}</div>
                              </td>
                              <td className="py-2 px-2 text-purple-900 font-mono text-[10px]">
                                {cleanEmail}
                              </td>
                              <td className="py-2 px-2 text-slate-700 font-medium">
                                {formatDateVN(st.dob) || 'Chưa cập nhật'}
                              </td>
                              <td className="py-2 px-2 font-bold text-slate-800">{st.phone}</td>
                              <td className="py-2 px-2 text-center">
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {st.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Không có học sinh nào ở danh sách chờ phù hợp.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
          )}
          </div>

        {/* Action Buttons Fixed Footer (Luôn hiển thị ở dưới cùng, không bị trôi) */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cuộn chuột hoặc lướt chạm để xem đầy đủ các thông tin</span>
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
              className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Lớp Học</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
  );
};
