import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Plus,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  Users,
  AlertCircle,
  GraduationCap,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { CurriculumCourse, Student, ClassGroup, AuthUser } from '../../types';
import { CourseTuitionTable } from './CourseTuitionTable';

interface CurriculumModuleProps {
  courses: CurriculumCourse[];
  students?: Student[];
  classes?: ClassGroup[];
  onUpdateStudent?: (updatedStudent: Student) => void;
  onUpdateStudentBatch?: (updatedStudents: Student[]) => void;
  onAddCourse?: (course: CurriculumCourse) => void;
  onUpdateClass?: (updatedClass: ClassGroup) => void;
  onUpdateCourse?: (course: CurriculumCourse) => void;
  currentUser?: AuthUser;
}

export const CurriculumModule: React.FC<CurriculumModuleProps> = ({
  courses,
  students = [],
  classes = [],
  onUpdateStudent,
  onUpdateStudentBatch,
  onUpdateClass,
  onUpdateCourse,
  currentUser,
}) => {
  const canAccess = !currentUser || currentUser.role === 'admin' || currentUser.role === 'assistant';

  const [selectedCourse, setSelectedCourse] = useState<CurriculumCourse>(courses[0]);
  const [activeSubTab, setActiveSubTab] = useState<'tuition' | 'syllabus'>('tuition');
  const [search, setSearch] = useState('');

  const [editingTuitionFee, setEditingTuitionFee] = useState<number>(courses[0]?.tuitionFee || 0);
  const [isApplyingTuition, setIsApplyingTuition] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when selected course changes
  React.useEffect(() => {
    if (selectedCourse) {
      setEditingTuitionFee(selectedCourse.tuitionFee);
    }
  }, [selectedCourse]);

  const handleUpdateCourseAndApplyStudents = async () => {
    if (!selectedCourse) return;
    setIsApplyingTuition(true);
    setToastMessage(null);

    try {
      // 1. Update the course standard tuition fee
      const updatedCourse = {
        ...selectedCourse,
        tuitionFee: editingTuitionFee,
        description: selectedCourse.description.replace(/Học phí: [\d\.,\sđ]+/, `Học phí: ${new Intl.NumberFormat('vi-VN').format(editingTuitionFee)} đ`),
      };

      if (onUpdateCourse) {
        onUpdateCourse(updatedCourse);
      }
      setSelectedCourse(updatedCourse);

      // 2. Filter students matching this course name
      const targetStudents = students.filter(
        (st) =>
          st.courseName === selectedCourse.name ||
          (st.className && st.className.toLowerCase().includes(selectedCourse.name.toLowerCase()))
      );

      if (targetStudents.length > 0) {
        const updatedStudents = targetStudents.map((st) => {
          const customFee = editingTuitionFee;
          const payable = customFee; 
          const balance = Math.max(0, payable - (st.amountPaid || 0));

          return {
            ...st,
            courseTuitionFee: editingTuitionFee,
            customTuitionFee: customFee,
            tuitionPayable: payable,
            balanceOwed: balance,
            tuitionStatus: balance === 0 ? 'Đã đóng đủ' as const : (st.amountPaid && st.amountPaid > 0 ? 'Đã đóng một phần' as const : 'Chưa đóng' as const),
          };
        });

        if (onUpdateStudentBatch) {
          onUpdateStudentBatch(updatedStudents);
        } else if (onUpdateStudent) {
          updatedStudents.forEach((st) => onUpdateStudent(st));
        }
      }

      setToastMessage(`🎉 Đã cập nhật học phí chuẩn của khóa lên ${new Intl.NumberFormat('vi-VN').format(editingTuitionFee)} đ và áp dụng đồng bộ cho ${targetStudents.length} học sinh!`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setToastMessage('⚠️ Lỗi khi đồng bộ học phí, vui lòng thử lại.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsApplyingTuition(false);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  if (!canAccess) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Giới Hạn Quyền Truy Cập</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Phân hệ <strong>Quản Lý Khóa Học & Học Phí Học Sinh</strong> được phân quyền nghiêm ngặt. Chỉ <strong>Quản Lý Trung Tâm</strong> và <strong>Trợ Lý</strong> mới được phép truy cập và thực hiện các tác vụ học phí.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
          <span>Tài khoản: {currentUser?.name} ({currentUser?.role === 'teacher' ? 'Giáo viên' : currentUser?.role})</span>
        </div>
      </div>
    );
  }

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.mainTextbook.toLowerCase().includes(search.toLowerCase())
  );

  // Count students enrolled in selected course
  const courseStudents = students.filter(
    (st) =>
      st.courseName === selectedCourse?.name ||
      (st.className && st.className.toLowerCase().includes(selectedCourse?.name.toLowerCase()))
  );

  // Count overdue students
  const overdueCount = courseStudents.filter((st) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Khóa Học & Học Phí Học Sinh</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                🔒 Phân quyền: Quản lý & Trợ lý
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dành riêng cho Quản lý trung tâm & Trợ lý học vụ • Quản lý danh sách học viên theo khóa, mức học phí cần đóng, hạn nộp và tự động nhắc nợ Zalo
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Chức năng thêm khóa học mới vào khung đào tạo')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khóa học mới</span>
        </button>
      </div>

      {/* Horizontal Course Selection Tabs Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5 animate-in fade-in">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
          Chọn Chương Trình Đào Tạo ({courses.length})
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {courses.map((c) => {
            const isSelected = selectedCourse?.id === c.id;
            const stdCount = students.filter(
              (st) =>
                st.courseName === c.name ||
                (st.className && st.className.toLowerCase().includes(c.name.toLowerCase()))
            ).length;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCourse(c)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-purple-700 text-white border-purple-800 shadow-md scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{c.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-purple-900 text-amber-300' : 'bg-slate-200 text-slate-500'
                }`}>
                  {stdCount} học sinh
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-width Details Syllabus & Student Tuition Management */}
      <div className="space-y-4 animate-in fade-in duration-300">
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Course Overview Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {selectedCourse.code}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedCourse.name}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedCourse.description}</p>
            </div>
            <div className="text-left sm:text-right shrink-0 bg-purple-50/70 p-4 rounded-2xl border border-purple-100 flex flex-col items-stretch sm:items-end gap-1.5 min-w-[240px]">
              <span className="text-[11px] font-bold text-slate-500 block">Học phí chuẩn của khóa (VND):</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={editingTuitionFee}
                  onChange={(e) => setEditingTuitionFee(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-black bg-white border border-slate-300 rounded-xl max-w-[130px] text-right font-mono text-purple-950 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500">đ</span>
              </div>
              <button
                type="button"
                onClick={handleUpdateCourseAndApplyStudents}
                disabled={isApplyingTuition}
                className="w-full sm:w-auto px-3 py-1.5 text-[10px] font-black bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-all cursor-pointer shadow-xs uppercase tracking-tight flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                title="Cập nhật học phí chuẩn của khóa này và áp dụng đồng bộ học phí phải nộp cho toàn bộ học sinh đang theo học"
              >
                {isApplyingTuition ? 'Đang cập nhật...' : '💾 Cập nhật & Áp dụng'}
              </button>
            </div>
          </div>

          {/* Sub-Tabs: Tuition & Syllabus */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveSubTab('tuition')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'tuition'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Danh Sách Học Sinh & Quản Lý Học Phí</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === 'tuition' ? 'bg-purple-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {courseStudents.length}
              </span>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                  ⚠️ {overdueCount} quá hẹn
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('syllabus')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'syllabus'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Khung Đào Tạo & Syllabus ({selectedCourse.syllabus?.length || 0} buổi)</span>
            </button>
          </div>
        </div>

        {/* Tab Content: Student Tuition Table */}
        {activeSubTab === 'tuition' && (
          <CourseTuitionTable
            courseName={selectedCourse.name}
            courseTuitionFee={selectedCourse.tuitionFee}
            students={students}
            classes={classes}
            onUpdateStudent={onUpdateStudent || (() => {})}
            onUpdateClass={onUpdateClass}
            currentUser={currentUser}
          />
        )}

          {/* Tab Content: Syllabus Breakdown */}
          {activeSubTab === 'syllabus' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              {/* Quick Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block">Thời lượng:</span>
                  <strong className="text-slate-800">{selectedCourse.durationHours} Giờ học</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block">Tổng số buổi:</span>
                  <strong className="text-slate-800">{selectedCourse.totalSessions} Buổi</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block">Khung trình độ:</span>
                  <strong className="text-purple-700">{selectedCourse.level}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block">Số Module:</span>
                  <strong className="text-slate-800">{selectedCourse.modulesCount} Phân đoạn</strong>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Giáo trình & Tài liệu chính:</span>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs font-semibold text-purple-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>{selectedCourse.mainTextbook}</span>
                </div>
              </div>

              {/* Syllabus Sessions list */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3">Phân phối chương trình (Syllabus theo buổi)</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {selectedCourse.syllabus.map((s) => (
                    <div key={s.session} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                          #{s.session}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{s.topic}</div>
                          <div className="text-[11px] text-slate-400">Trọng tâm: {s.skill}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {s.skill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
