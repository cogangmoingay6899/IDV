import React, { useState } from 'react';
import { X, UserPlus, GraduationCap, Phone, Mail, MapPin, Calendar, DollarSign, Sparkles, UserCheck } from 'lucide-react';
import { Student, ClassGroup } from '../../types';
import { detectCourseLevel } from '../../utils/courseSchedule';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassGroup[];
  onAddStudent: (student: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  classes,
  onAddStudent,
}) => {
  if (!isOpen) return null;

  const initialClass = classes[0];
  const initialIsK4 = initialClass
    ? detectCourseLevel(initialClass.name || initialClass.courseName || '', initialClass.totalSessions || 32) === 'Khóa 4'
    : false;

  const [formData, setFormData] = useState({
    name: '',
    dob: '2008-01-01',
    gender: 'Nam' as Student['gender'],
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    address: '',
    classId: initialClass?.id || '',
    tuitionFee: initialClass?.tuitionFee || 14500000,
    paidAmount: initialClass?.tuitionFee || 14500000,
    startDate: initialClass?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialClass?.endDate || '',
    tuitionPaidDate: new Date().toISOString().split('T')[0],
    isExternalStudent: initialIsK4,
  });

  const selectedClass = classes.find((c) => c.id === formData.classId);
  const isSelectedK4 = selectedClass
    ? detectCourseLevel(selectedClass.name || selectedClass.courseName || '', selectedClass.totalSessions || 32) === 'Khóa 4'
    : false;

  const handleClassChange = (newClassId: string) => {
    const targetClass = classes.find((c) => c.id === newClassId);
    const targetIsK4 = targetClass
      ? detectCourseLevel(targetClass.name || targetClass.courseName || '', targetClass.totalSessions || 32) === 'Khóa 4'
      : false;

    setFormData((prev) => ({
      ...prev,
      classId: newClassId,
      tuitionFee: targetClass?.tuitionFee || prev.tuitionFee,
      paidAmount: targetClass?.tuitionFee || prev.paidAmount,
      startDate: targetClass?.startDate || prev.startDate,
      endDate: targetClass?.endDate || prev.endDate,
      isExternalStudent: targetIsK4 ? true : prev.isExternalStudent,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Math.max(0, formData.tuitionFee - formData.paidAmount);

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      code: `IDV-HV${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      dob: formData.dob,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      address: formData.address || 'Kiến An, Hải Phòng',
      classId: formData.classId,
      className: selectedClass?.name || 'Lớp học',
      courseName: selectedClass?.courseName || 'Khóa học tiếng Anh',
      status: 'Đang học',
      joinDate: formData.startDate || new Date().toISOString().split('T')[0],
      startDate: formData.startDate || selectedClass?.startDate,
      endDate: formData.endDate || selectedClass?.endDate,
      tuitionStatus: balance === 0 ? 'Đã đóng đủ' : formData.paidAmount > 0 ? 'Còn nợ' : 'Chưa đóng',
      tuitionPaidDate: formData.paidAmount > 0 ? formData.tuitionPaidDate : undefined,
      tuitionAmountPaid: formData.paidAmount,
      balanceOwed: balance,
      isExternalStudent: formData.isExternalStudent,
      studentCategory: formData.isExternalStudent ? 'Học sinh ngoài' : 'Thường',
      customTuitionFee: formData.tuitionFee,
      courseTuitionFee: formData.tuitionFee,
      tuitionPayable: formData.tuitionFee,
    };

    onAddStudent(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Thêm hồ sơ học viên mới</h3>
              <p className="text-xs text-slate-500">Đăng ký nhập học & phân bổ lớp học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Họ và tên học viên *</label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số điện thoại học viên *</label>
              <input
                type="text"
                required
                placeholder="0912 xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Họ tên phụ huynh</label>
              <input
                type="text"
                placeholder="Phụ huynh học viên..."
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SĐT phụ huynh</label>
              <input
                type="text"
                placeholder="SĐT liên hệ phụ huynh..."
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              placeholder="Số nhà, đường, Kiến An / Tô Hiệu, Hải Phòng..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Xếp vào lớp học *</label>
            <select
              value={formData.classId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
            >
              {classes.length === 0 ? (
                <option value="">-- Chưa có lớp học (Xếp lớp sau) --</option>
              ) : (
                classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.schedule} ({c.teacherName})
                  </option>
                ))
              )}
            </select>
            {classes.length === 0 && (
              <p className="text-[11px] text-purple-700 mt-1">
                * Chưa có lớp học nào. Bạn có thể thêm học viên trước rồi tạo lớp sau.
              </p>
            )}
          </div>

          {/* Đánh dấu Học sinh ngoài & Cho phép nhập học phí khác mặc định ở Khóa 4 */}
          <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isExternalStudent}
                onChange={(e) => setFormData({ ...formData, isExternalStudent: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Đánh dấu "Học sinh ngoài" {isSelectedK4 ? '(Đăng ký thẳng Khóa 4)' : ''}</span>
              </span>
            </label>
            <p className="text-[10px] text-amber-800 ml-6 leading-relaxed">
              Học viên ngoài đăng ký thẳng Khóa 4 (hoặc nguồn ngoài, không học từ Khóa 1-3). Hệ thống cho phép nhập mức học phí thỏa thuận riêng biệt khác với mức mặc định của lớp.
            </p>
          </div>

          {/* Ngày bắt đầu học riêng & Ngày kết thúc khóa riêng từng học viên */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div>
              <label className="font-semibold text-blue-900 block mb-1">
                📅 Ngày bắt đầu học riêng
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-white border border-blue-200 rounded-lg p-2 font-medium text-slate-800"
              />
              <p className="text-[10px] text-blue-600 mt-1">
                Mặc định theo lịch khai giảng của lớp
              </p>
            </div>
            <div>
              <label className="font-semibold text-blue-900 block mb-1">
                🏁 Ngày kết thúc khóa riêng
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-white border border-blue-200 rounded-lg p-2 font-medium text-slate-800"
              />
              <p className="text-[10px] text-blue-600 mt-1">
                Ngày bế giảng dự kiến của bạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
            <div>
              <label className="font-semibold text-purple-900 block mb-1">
                Học phí khóa học (VNĐ) {isSelectedK4 ? '(Khóa 4: Nhập khác mặc định)' : ''}
              </label>
              <input
                type="number"
                step="100000"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-purple-900"
              />
              {isSelectedK4 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  <span className="text-[9px] text-slate-500 font-bold">Gợi ý:</span>
                  {[14500000, 15500000, 16500000, 18000000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setFormData({ ...formData, tuitionFee: fee })}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                        formData.tuitionFee === fee
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      {(fee / 1000000).toFixed(1)} tr
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="font-semibold text-purple-900 block mb-1">Số tiền đóng đợt này</label>
              <input
                type="number"
                step="100000"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-emerald-700"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Còn nợ: {Math.max(0, formData.tuitionFee - formData.paidAmount).toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          {/* Ngày nộp học phí riêng */}
          {formData.paidAmount > 0 && (
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <label className="font-semibold text-emerald-950 block mb-1">
                💳 Ngày nộp học phí riêng
              </label>
              <input
                type="date"
                value={formData.tuitionPaidDate}
                onChange={(e) => setFormData({ ...formData, tuitionPaidDate: e.target.value })}
                className="w-full bg-white border border-emerald-300 rounded-lg p-2 font-bold text-emerald-900"
              />
              <p className="text-[10px] text-emerald-700 mt-1">
                Ghi nhận ngày học viên thực tế hoàn tất hoặc đóng học phí đợt này
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-xs"
            >
              Tạo học viên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
