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
} from 'lucide-react';
import { ClassGroup, Teacher, CurriculumCourse } from '../../types';
import {
  COURSE_LEVEL_CONFIGS,
  SCHEDULE_PRESETS,
  calculateCourseSchedule,
  CourseLevelKey,
  detectCourseLevel,
  formatDateVN,
} from '../../utils/courseSchedule';
import { StandardScheduleSelector } from '../common/StandardScheduleSelector';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classGroup: ClassGroup | null;
  teachers: Teacher[];
  courses: CurriculumCourse[];
  onUpdateClass: (updatedClass: ClassGroup) => void;
}

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  classGroup,
  teachers,
  courses,
  onUpdateClass,
}) => {
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
    tuitionFee: 14500000,
    status: 'Đang diễn ra' as ClassGroup['status'],
  });

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [customTeacherInput, setCustomTeacherInput] = useState('');

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

  // Populate form when classGroup changes
  useEffect(() => {
    if (classGroup) {
      // Parse existing teachers list
      let initialTeachers: string[] = [];
      if (classGroup.teacherNames && classGroup.teacherNames.length > 0) {
        initialTeachers = [...classGroup.teacherNames];
      } else if (classGroup.teacherName) {
        // Split by comma or semicolon if multiple
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
        tuitionFee: classGroup.tuitionFee || 14500000,
        status: classGroup.status || 'Đang diễn ra',
      });
    }
  }, [classGroup, isOpen]);

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

  if (!isOpen || !classGroup) return null;

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
      maxStudents: Number(formData.maxStudents) || 25,
      tuitionFee: Number(formData.tuitionFee) || 0,
      status: formData.status,
      offDates: offDates,
    };

    onUpdateClass(updated);
    onClose();
  };

  // Quick course suggestions
  const commonCourses = [
    'PRE',
    'INSPIRE',
    'DESIRE',
    'LUYỆN ĐỀ DRILL',
  ];

  // Quick teacher suggestions
  const suggestedTeachers = [
    'Tâm Vương (IELTS 8.0+ Speaking & Writing)',
    'Minh Tâm (IELTS 8.0 Listening & Reading 9.0)',
    'Trang Nguyễn (IELTS Foundation & Phản Xạ B2)',
    'Thơm Nguyễn (IELTS 8.0 Ngữ Pháp & Đọc Hiểu)',
    'Diệp Đặng (IELTS 8.0+ Intensive Writing)',
    'Vũ Ngọc (IELTS Foundation & Từ Vựng)',
    'Dương Vũ (Founder & Academic Director - IELTS 8.5)',
    'Huyền Chi (IELTS Speaking & Phát Âm)',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl w-full max-w-3xl my-2 sm:my-4 md:my-6 flex flex-col min-h-0 max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="shrink-0 bg-gradient-to-r from-purple-800 to-indigo-700 px-5 py-4 sm:px-6 sm:py-5 text-white flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Chỉnh Sửa Thông Tin Lớp Học</h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-purple-100 font-medium">
                  <ArrowUpDown className="w-2.5 h-2.5" /> Có thể cuộn lên/xuống
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200">
                Tự nhập tên giáo viên, phân công nhiều giáo viên cùng dạy & cập nhật khóa học cho {classGroup.code}
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
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
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
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                        : 'bg-white text-slate-700 hover:bg-purple-50 border-slate-200'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center justify-between">
                      <span>{lvlKey}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-purple-100' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cfg.totalSessions}b
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 font-semibold truncate ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
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

            {/* Quick tag suggestions for Course */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-500 mr-1.5">Gợi ý nhanh:</span>
              <div className="inline-flex flex-wrap gap-1 mt-1">
                {['IELTS 4.5 - 5.5', 'IELTS Intensive 6.5+', 'IELTS Master 7.5+', 'Giao Tiếp B2', 'Luyện Đề Bứt Phá'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormData({ ...formData, courseName: item })}
                    className="px-2 py-0.5 text-[10px] font-bold bg-white text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                  >
                    + {item}
                  </button>
                ))}
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
                Chuỗi tên giáo viên đầy đủ (Hiển thị trên toàn hệ thống):
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

          {/* Row 4: Branch, Room, Assistant & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cơ sở đào tạo</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none text-xs"
              >
                <option value="Cơ sở 1 - Tô Hiệu (Hải Phòng)">Cơ sở 1 - Tô Hiệu (Hải Phòng)</option>
                <option value="Cơ sở 2 - Kiến An (Hải Phòng)">Cơ sở 2 - Kiến An (Hải Phòng)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phòng học</label>
              <input
                type="text"
                placeholder="VD: Phòng 201"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Trợ giảng (TA) / Quản nhiệm</label>
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

          {/* Row 5: Standard Schedule Selection (Tuần 2 buổi: Thứ 2+Thứ 5, Thứ 3+Thứ 6, hoặc Thứ 4+Thứ 7) */}
          <StandardScheduleSelector
            value={formData.schedule}
            onChange={(newSchedule) => {
              setFormData((prev) => ({ ...prev, schedule: newSchedule }));
            }}
          />

          {/* Row 6: Dates & Sessions */}
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
              <label className="font-bold text-slate-700 block mb-1 text-xs">Sĩ số tối đa</label>
              <input
                type="number"
                min={5}
                max={50}
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) || 25 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none"
              />
            </div>
          </div>

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
                <span className="text-[9px] text-emerald-300 block mt-0.5 font-semibold">
                  {calculatedSchedule.remainingDaysText}
                </span>
                <span className="text-[9px] text-purple-300/80 block">
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Học phí toàn khóa (VNĐ)</label>
              <input
                type="number"
                step={500000}
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-emerald-700 font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action buttons Fixed Footer */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-5 py-3.5 sm:px-6 flex items-center justify-between gap-3 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cuộn chuột hoặc lướt chạm để xem & sửa đầy đủ thông tin</span>
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
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-colors cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
  );
};
