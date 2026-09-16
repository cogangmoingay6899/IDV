import React, { useState } from 'react';
import {
  Award,
  Search,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  FileCheck,
  X,
  GraduationCap,
  Users,
  AlertCircle
} from 'lucide-react';
import { ExamScore, ClassGroup, Student, AuthUser } from '../../types';

interface ExamsModuleProps {
  exams: ExamScore[];
  classes: ClassGroup[];
  students: Student[];
  onAddExamScore: (exam: ExamScore) => void;
  currentUser?: AuthUser;
  onOpenCreateClass?: () => void;
}

export const ExamsModule: React.FC<ExamsModuleProps> = ({
  exams,
  classes,
  students,
  onAddExamScore,
  currentUser,
  onOpenCreateClass,
}) => {
  const isTeacher = currentUser?.role === 'teacher';
  const availableClasses = isTeacher && currentUser?.teacherId
    ? (classes.some((c) => c.teacherId === currentUser.teacherId)
        ? classes.filter((c) => c.teacherId === currentUser.teacherId)
        : classes)
    : classes;

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedExamDetail, setSelectedExamDetail] = useState<ExamScore | null>(null);

  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    classId: availableClasses[0]?.id || classes[0]?.id || '',
    examName: 'Kỳ Thi Định Kỳ / Cuối Khóa',
    examDate: new Date().toISOString().split('T')[0],
    listening: 7.0,
    speaking: 6.5,
    reading: 7.0,
    writing: 6.5,
  });

  const handleOpenModal = () => {
    if (classes.length === 0) {
      alert('Chưa có lớp học nào trong hệ thống! Vui lòng tạo lớp học trước.');
      if (onOpenCreateClass) onOpenCreateClass();
      return;
    }
    if (students.length === 0) {
      alert('Chưa có học viên nào trong hệ thống! Vui lòng thêm học viên trước.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      studentId: students[0]?.id || '',
      classId: availableClasses[0]?.id || classes[0]?.id || '',
    }));
    setShowModal(true);
  };

  const filteredExams = exams.filter(
    (ex) =>
      ex.studentName.toLowerCase().includes(search.toLowerCase()) ||
      ex.examName.toLowerCase().includes(search.toLowerCase()) ||
      ex.className.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formData.studentId);
    const cls = classes.find((c) => c.id === formData.classId);

    const total =
      Math.round(((formData.listening + formData.speaking + formData.reading + formData.writing) / 4) * 2) / 2;

    let rank: ExamScore['rank'] = 'Khá';
    if (total >= 7.5) rank = 'Xuất sắc';
    else if (total >= 6.5) rank = 'Giỏi';
    else if (total >= 5.0) rank = 'Khá';
    else rank = 'Trung bình';

    const newScore: ExamScore = {
      id: `ex-${Date.now()}`,
      studentId: formData.studentId,
      studentName: st?.name || 'Học viên',
      studentCode: st?.code || 'IDV-HV000',
      classId: formData.classId,
      className: cls?.name || 'Lớp học',
      examName: formData.examName,
      examDate: formData.examDate,
      listening: formData.listening,
      speaking: formData.speaking,
      reading: formData.reading,
      writing: formData.writing,
      totalScore: total,
      rank: rank,
      certificateGranted: total >= 6.0,
    };

    onAddExamScore(newScore);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Điểm Thi & Đánh Giá</h2>
              {isTeacher && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  👨‍🏫 Quyền Giáo Viên: {currentUser?.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Bảng điểm thi 4 kỹ năng, xếp loại học lực và cấp chứng chỉ chuẩn Cambridge/IELTS</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateClass && !isTeacher && classes.length === 0 && (
            <button
              onClick={onOpenCreateClass}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Lớp Mới</span>
            </button>
          )}

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nhập điểm thi mới</span>
          </button>
        </div>
      </div>

      {/* Teacher banner */}
      {isTeacher && (
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Phân quyền Giáo viên:</strong> Thầy/Cô có quyền nhập điểm thi 4 kỹ năng (Listening, Speaking, Reading, Writing) và xem kết quả xếp loại học viên.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
            {currentUser?.email}
          </span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên học viên, bài thi, lớp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="text-xs text-slate-500 self-start sm:self-auto">
          Tổng số bảng điểm: <strong className="text-slate-800">{exams.length}</strong>
        </div>
      </div>

      {/* Exams Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Học viên</th>
                <th className="py-3 px-4">Lớp học / Kỳ thi</th>
                <th className="py-3 px-4 text-center">Nghe</th>
                <th className="py-3 px-4 text-center">Nói</th>
                <th className="py-3 px-4 text-center">Đọc</th>
                <th className="py-3 px-4 text-center">Viết</th>
                <th className="py-3 px-4 text-center">Tổng điểm</th>
                <th className="py-3 px-4 text-center">Xếp loại</th>
                <th className="py-3 px-4 text-right">Chứng chỉ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{ex.studentName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{ex.studentCode}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{ex.className}</div>
                    <div className="text-[11px] text-purple-700">{ex.examName}</div>
                    <div className="text-[10px] text-slate-400">{ex.examDate}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{ex.listening}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{ex.speaking}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{ex.reading}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700">{ex.writing}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-extrabold text-sm text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg">
                      {ex.totalScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ex.rank === 'Xuất sắc'
                          ? 'bg-amber-100 text-amber-800'
                          : ex.rank === 'Giỏi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ex.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {ex.certificateGranted ? (
                      <button
                        onClick={() => setSelectedExamDetail(ex)}
                        className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold hover:underline"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>In chứng chỉ</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Chưa đủ điều kiện</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-700 mb-1">Chưa có kết quả thi nào</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      Dữ liệu điểm thi sạch. Hãy nhấn vào nút "Nhập điểm thi mới" bên trên để ghi nhận điểm 4 kỹ năng của học viên.
                    </p>
                    <button
                      onClick={handleOpenModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nhập điểm thi ngay</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border-4 border-purple-100 animate-in zoom-in-95 text-center relative">
            <button
              onClick={() => setSelectedExamDetail(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-md">
              <Award className="w-8 h-8 text-yellow-300" />
            </div>

            <span className="text-[11px] uppercase tracking-widest text-purple-700 font-bold block">
              IELTS DƯƠNG VŨ
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC</h3>
            <p className="text-xs text-slate-500 mt-1">Certificate of Course Completion</p>

            <div className="my-6 py-4 border-y border-dashed border-slate-200">
              <p className="text-xs text-slate-500">Chứng nhận học viên:</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">{selectedExamDetail.studentName}</h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Mã số: {selectedExamDetail.studentCode}</p>

              <div className="mt-4 text-xs text-slate-700">
                Đã hoàn thành xuất sắc kỳ thi: <strong>{selectedExamDetail.examName}</strong>
              </div>
              <div className="mt-2 inline-flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                <span className="text-xs text-purple-900">Điểm tổng kết: <strong className="text-base text-purple-700">{selectedExamDetail.totalScore}</strong></span>
                <span className="text-xs text-purple-900">• Xếp loại: <strong>{selectedExamDetail.rank}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Listening</div>
                <div className="text-sm font-bold text-slate-800">{selectedExamDetail.listening}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Speaking</div>
                <div className="text-sm font-bold text-slate-800">{selectedExamDetail.speaking}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Reading</div>
                <div className="text-sm font-bold text-slate-800">{selectedExamDetail.reading}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400">Writing</div>
                <div className="text-sm font-bold text-slate-800">{selectedExamDetail.writing}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>In Văn Bằng Chứng Nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-700" />
                <h3 className="font-extrabold text-base text-slate-900">Nhập Điểm Thi Học Viên - IDV</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chọn học viên:</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chọn lớp học:</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên kỳ thi:</label>
                  <input
                    type="text"
                    required
                    value={formData.examName}
                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                    placeholder="VD: Mid-Term Test, Final Exam IELTS"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày thi:</label>
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
                <span className="font-bold text-purple-900 block mb-2">Điểm 4 kỹ năng (Thang điểm 0 - 9.0 hoặc 0 - 10):</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 text-center">Listening</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formData.listening}
                      onChange={(e) => setFormData({ ...formData, listening: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center font-bold text-purple-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 text-center">Speaking</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formData.speaking}
                      onChange={(e) => setFormData({ ...formData, speaking: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center font-bold text-purple-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 text-center">Reading</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formData.reading}
                      onChange={(e) => setFormData({ ...formData, reading: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center font-bold text-purple-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 text-center">Writing</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={formData.writing}
                      onChange={(e) => setFormData({ ...formData, writing: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center font-bold text-purple-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-md shadow-purple-600/20"
                >
                  Lưu kết quả điểm thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
