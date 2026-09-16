import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { LeadAdmission } from '../../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: LeadAdmission) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onAddLead }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Facebook Ads' as LeadAdmission['source'],
    targetCourse: 'IELTS Chuyên Sâu 6.5+',
    consultantName: 'Mai Tuyết Trinh',
    notes: '',
    expectedRevenue: 12500000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: LeadAdmission = {
      id: `lead-${Date.now()}`,
      code: `TS-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      source: formData.source,
      targetCourse: formData.targetCourse,
      consultantName: formData.consultantName,
      stage: 'Tiếp cận mới',
      notes: formData.notes,
      createdAt: new Date().toISOString().split('T')[0],
      expectedRevenue: formData.expectedRevenue,
    };

    onAddLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Thêm khách tiềm năng (Lead)</h3>
              <p className="text-xs text-slate-500">Phễu tư vấn tuyển sinh PSE One</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs mt-4">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Họ tên khách hàng *</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số điện thoại *</label>
              <input
                type="text"
                required
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nguồn tiếp cận</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              >
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Google">Google</option>
                <option value="Giới thiệu">Giới thiệu</option>
                <option value="TikTok">TikTok</option>
                <option value="Trực tiếp tại cơ sở">Trực tiếp tại cơ sở</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Khóa học quan tâm *</label>
            <select
              value={formData.targetCourse}
              onChange={(e) => setFormData({ ...formData, targetCourse: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
            >
              <option value="IELTS Chuyên Sâu 6.5+">IELTS Chuyên Sâu 6.5+</option>
              <option value="Tiếng Anh Thiếu Nhi Cambridge">Tiếng Anh Thiếu Nhi Cambridge</option>
              <option value="Tiếng Anh Giao Tiếp Doanh Nghiệp">Tiếng Anh Giao Tiếp Doanh Nghiệp</option>
              <option value="Luyện Thi TOEIC Quốc Tế">Luyện Thi TOEIC Quốc Tế</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Chuyên viên tư vấn phụ trách</label>
            <input
              type="text"
              value={formData.consultantName}
              onChange={(e) => setFormData({ ...formData, consultantName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ghi chú nhu cầu khách hàng</label>
            <textarea
              rows={2}
              placeholder="Mục tiêu điểm số, thời gian muốn học, lịch rảnh..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl shadow-xs"
            >
              Tạo Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
