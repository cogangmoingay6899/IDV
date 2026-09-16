import React, { useState } from 'react';
import { X, UserPlus, GraduationCap, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Student, ClassGroup } from '../../types';

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

  const [formData, setFormData] = useState({
    name: '',
    dob: '2008-01-01',
    gender: 'Nam' as Student['gender'],
    phone: '',
    email: '',
    parentName: '',
    parentPhone: '',
    address: '',
    classId: classes[0]?.id || '',
    tuitionFee: 14500000,
    paidAmount: 14500000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classes.find((c) => c.id === formData.classId);
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
      joinDate: new Date().toISOString().split('T')[0],
      tuitionStatus: balance === 0 ? 'Đã đóng đủ' : 'Còn nợ',
      balanceOwed: balance,
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
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
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

          <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
            <div>
              <label className="font-semibold text-purple-900 block mb-1">Học phí khóa học (VNĐ)</label>
              <input
                type="number"
                step="100000"
                value={formData.tuitionFee}
                onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold"
              />
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
            </div>
          </div>

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
