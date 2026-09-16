import React, { useState } from 'react';
import { X, UserPlus, GraduationCap, Award, Phone, Mail, Globe, DollarSign } from 'lucide-react';
import { Teacher } from '../../types';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTeacher: (teacher: Teacher) => void;
  defaultBranch?: string;
}

export const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({
  isOpen,
  onClose,
  onAddTeacher,
  defaultBranch = 'Cơ sở 1 - Tô Hiệu',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Việt Nam' as Teacher['type'],
    nationality: 'Việt Nam 🇻🇳',
    email: '',
    phone: '',
    specialty: 'IELTS Chuyên Sâu 4 Kỹ Năng',
    degrees: 'IELTS 8.0+, TESOL Quốc Tế',
    hourlyRate: 450000,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập họ và tên giáo viên!');
      return;
    }

    const newTeacher: Teacher = {
      id: `tch-${Date.now()}`,
      code: `GV-IDV${Math.floor(10 + Math.random() * 90)}`,
      name: formData.name.trim(),
      type: formData.type,
      nationality: formData.nationality,
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '')}@idv.edu.vn`,
      phone: formData.phone.trim() || `09${Math.floor(10000000 + Math.random() * 89999999)}`,
      specialty: formData.specialty.trim(),
      degrees: formData.degrees.trim(),
      activeClassesCount: 1,
      hourlyRate: Number(formData.hourlyRate),
      rating: 5.0,
      status: 'Đang giảng dạy',
    };

    onAddTeacher(newTeacher);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Thêm Giáo Viên Mới</h3>
              <p className="text-xs text-purple-200 mt-0.5">Tạo hồ sơ giảng viên IDV Language Academy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Họ và tên giáo viên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Thầy Đặng Quang Anh / Cô Mai Phương"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phân loại giáo viên</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const val = e.target.value as Teacher['type'];
                  setFormData({
                    ...formData,
                    type: val,
                    nationality: val === 'Bản ngữ (Native)' ? 'Vương Quốc Anh 🇬🇧' : 'Việt Nam 🇻🇳',
                  });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              >
                <option value="Việt Nam">Giáo viên Việt Nam</option>
                <option value="Bản ngữ (Native)">Bản ngữ (Native)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Quốc tịch</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
              <input
                type="tel"
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                placeholder="teacher@idv.edu.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Chuyên môn giảng dạy IELTS</label>
            <input
              type="text"
              placeholder="VD: IELTS Writing & Speaking 8.0+, Phát âm chuẩn"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bằng cấp & Chứng chỉ</label>
              <input
                type="text"
                placeholder="VD: IELTS 8.5, TESOL, CELTA"
                value={formData.degrees}
                onChange={(e) => setFormData({ ...formData, degrees: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Thù lao / giờ dạy (VNĐ)</label>
              <input
                type="number"
                step={50000}
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Giáo Viên Mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
