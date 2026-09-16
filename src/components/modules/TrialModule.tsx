import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { TrialStudent, ClassGroup } from '../../types';

interface TrialModuleProps {
  trialStudents: TrialStudent[];
  classes: ClassGroup[];
  onAddTrialStudent: (trial: TrialStudent) => void;
  onConvertToStudent: (trial: TrialStudent) => void;
}

export const TrialModule: React.FC<TrialModuleProps> = ({
  trialStudents,
  classes,
  onAddTrialStudent,
  onConvertToStudent,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    phone: '',
    parentName: '',
    targetCourse: 'Tiếng Anh Thiếu Nhi Cambridge',
    classId: classes[0]?.id || '',
    trialDate: new Date().toISOString().split('T')[0],
    trialTime: '08:30 - 10:30',
    teacherName: 'Nguyễn Hoàng Yến',
    notes: '',
  });

  const filteredTrials = trialStudents.filter(
    (t) =>
      t.studentName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search) ||
      t.className.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cls = classes.find((c) => c.id === formData.classId);

    const newTrial: TrialStudent = {
      id: `trl-${Date.now()}`,
      studentName: formData.studentName,
      phone: formData.phone,
      parentName: formData.parentName,
      targetCourse: formData.targetCourse,
      classId: formData.classId,
      className: cls?.name || 'Lớp trải nghiệm',
      trialDate: formData.trialDate,
      trialTime: formData.trialTime,
      teacherName: cls?.teacherName || formData.teacherName,
      attendanceStatus: 'Chờ học thử',
      feedbackStatus: 'Đang cân nhắc',
      notes: formData.notes,
    };

    onAddTrialStudent(newTrial);
    setShowModal(false);
    setFormData({
      studentName: '',
      phone: '',
      parentName: '',
      targetCourse: 'Tiếng Anh Thiếu Nhi Cambridge',
      classId: classes[0]?.id || '',
      trialDate: new Date().toISOString().split('T')[0],
      trialTime: '08:30 - 10:30',
      teacherName: 'Nguyễn Hoàng Yến',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Học Thử & Trải Nghiệm</h2>
            <p className="text-xs text-slate-500">Lịch học thử 0 đồng, theo dõi trải nghiệm thực tế và tỷ lệ chốt khóa học</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng ký học thử</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm học viên học thử, số điện thoại, lớp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="text-xs text-slate-500">
          Tổng số lịch hẹn: <strong className="text-slate-800">{trialStudents.length}</strong>
        </div>
      </div>

      {/* Trial Students Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTrials.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{t.studentName}</h3>
                  <div className="text-xs text-purple-700 font-semibold">{t.targetCourse}</div>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    t.attendanceStatus === 'Đã tham gia'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {t.attendanceStatus}
                </span>
              </div>

              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Lớp học thử:</span>
                  <strong className="text-slate-900">{t.className}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Thời gian:</span>
                  <span className="font-medium text-slate-900">{t.trialDate} ({t.trialTime})</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Giáo viên:</span>
                  <span className="font-medium text-purple-700">{t.teacherName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Liên hệ:</span>
                  <span>{t.phone} {t.parentName ? `(PH: ${t.parentName})` : ''}</span>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/80 text-xs">
                <div className="flex items-center gap-1.5 text-purple-900 font-semibold mb-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-purple-600" />
                  <span>Phản hồi sau buổi học:</span>
                  <span className="font-bold text-purple-700 ml-auto">{t.feedbackStatus}</span>
                </div>
                {t.notes && <p className="text-[11px] text-slate-600 italic">"{t.notes}"</p>}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Trạng thái chốt: {t.feedbackStatus}</span>
              <button
                onClick={() => onConvertToStudent(t)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Chốt nhập học</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Trial Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Đăng ký xếp lớp học thử</h3>
            <p className="text-xs text-slate-500 mb-4">Ghi nhận thông tin học viên trải nghiệm buổi học đầu tiên</p>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Họ tên học viên:</label>
                  <input
                    type="text"
                    required
                    placeholder="Họ tên học viên / bé"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    required
                    placeholder="09xx xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Họ tên phụ huynh (nếu có):</label>
                  <input
                    type="text"
                    placeholder="Chị Nguyễn Thị..."
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lớp xếp học thử:</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày học thử:</label>
                  <input
                    type="date"
                    value={formData.trialDate}
                    onChange={(e) => setFormData({ ...formData, trialDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Giờ học:</label>
                  <input
                    type="text"
                    value={formData.trialTime}
                    onChange={(e) => setFormData({ ...formData, trialTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú yêu cầu của phụ huynh:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ví dụ: Bé còn nhút nhát, phụ huynh muốn dự thính 15 phút đầu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg shadow-xs"
                >
                  Xác nhận xếp lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
