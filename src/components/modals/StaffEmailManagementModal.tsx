import React, { useState } from 'react';
import {
  X,
  Shield,
  Users2,
  GraduationCap,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  Edit3,
  Save,
  Mail,
  UserCheck
} from 'lucide-react';
import {
  DepartmentEmails,
  DEFAULT_DEPARTMENT_EMAILS,
  KNOWN_STAFF_PROFILES,
  saveDepartmentEmails,
} from '../../data/authStaff';

interface StaffEmailManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentEmails: DepartmentEmails;
  onUpdateDepartmentEmails: (emails: DepartmentEmails) => void;
  adminPin: string;
  assistantPin: string;
  teacherPinKienAn: string;
  teacherPinToHieu: string;
  onUpdateAdminPin: (pin: string) => void;
  onUpdateAssistantPin: (pin: string) => void;
  onUpdateTeacherPin: (branch: 'KienAn' | 'ToHieu', pin: string) => void;
}

export const StaffEmailManagementModal: React.FC<StaffEmailManagementModalProps> = ({
  isOpen,
  onClose,
  departmentEmails,
  onUpdateDepartmentEmails,
  adminPin,
  assistantPin,
  teacherPinKienAn,
  teacherPinToHieu,
  onUpdateAdminPin,
  onUpdateAssistantPin,
  onUpdateTeacherPin,
}) => {
  const [activeTab, setActiveTab] = useState<keyof DepartmentEmails>('teachersToHieu');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pin editing states
  const [editingPinDept, setEditingPinDept] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState('');

  if (!isOpen) return null;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAddEmail = (dept: keyof DepartmentEmails) => {
    setErrorMsg('');
    const email = newEmailInput.trim().toLowerCase();
    if (!email) {
      showNotification('Vui lòng nhập địa chỉ Gmail!', true);
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Địa chỉ email không hợp lệ (ví dụ: hoten@gmail.com)!', true);
      return;
    }

    // Check if already in this department
    if (departmentEmails[dept].some((e) => e.toLowerCase() === email)) {
      showNotification('Email này đã tồn tại trong danh sách bộ phận!', true);
      return;
    }

    const updated: DepartmentEmails = {
      ...departmentEmails,
      [dept]: [...departmentEmails[dept], email],
    };

    onUpdateDepartmentEmails(updated);
    saveDepartmentEmails(updated);
    setNewEmailInput('');
    showNotification(`Đã thêm email ${email} vào danh sách thành công!`);
  };

  const handleRemoveEmail = (dept: keyof DepartmentEmails, emailToRemove: string) => {
    setErrorMsg('');
    if (dept === 'admins' && departmentEmails.admins.length <= 1) {
      showNotification('Không thể xóa email Quản lý cuối cùng!', true);
      return;
    }

    const updated: DepartmentEmails = {
      ...departmentEmails,
      [dept]: departmentEmails[dept].filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()),
    };

    onUpdateDepartmentEmails(updated);
    saveDepartmentEmails(updated);
    showNotification(`Đã xóa email ${emailToRemove} khỏi danh sách.`);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục danh sách email các bộ phận về mặc định ban đầu?')) {
      onUpdateDepartmentEmails(DEFAULT_DEPARTMENT_EMAILS);
      saveDepartmentEmails(DEFAULT_DEPARTMENT_EMAILS);
      showNotification('Đã khôi phục toàn bộ danh sách email nhân sự về mặc định!');
    }
  };

  const handleStartEditPin = (dept: string, currentPin: string) => {
    setEditingPinDept(dept);
    setTempPin(currentPin);
  };

  const handleSavePin = (dept: string) => {
    if (!tempPin.trim()) return;
    if (dept === 'admins') {
      onUpdateAdminPin(tempPin.trim());
    } else if (dept === 'assistants') {
      onUpdateAssistantPin(tempPin.trim());
    } else if (dept === 'teachersKienAn') {
      onUpdateTeacherPin('KienAn', tempPin.trim());
    } else if (dept === 'teachersToHieu') {
      onUpdateTeacherPin('ToHieu', tempPin.trim());
    }
    setEditingPinDept(null);
    showNotification('Đã cập nhật mã PIN bảo mật thành công!');
  };

  const getDeptInfo = (key: keyof DepartmentEmails) => {
    switch (key) {
      case 'admins':
        return {
          title: 'Ban Quản Lý (Admin)',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          pin: adminPin,
          deptKey: 'admins',
          icon: <Shield className="w-4 h-4 text-purple-700" />,
          desc: 'Tài khoản có toàn quyền quản trị, cấu hình mã PIN, xem doanh thu học phí và phân quyền.',
        };
      case 'assistants':
        return {
          title: 'Trợ Lý Học Vụ & Tuyển Sinh',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          pin: assistantPin,
          deptKey: 'assistants',
          icon: <Users2 className="w-4 h-4 text-indigo-700" />,
          desc: 'Quản lý tuyển sinh, điểm thi, sổ liên lạc, học phí và lớp học.',
        };
      case 'teachersToHieu':
        return {
          title: 'Giáo Viên Cơ Sở 1 - Tô Hiệu',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          pin: teacherPinToHieu,
          deptKey: 'teachersToHieu',
          icon: <Building2 className="w-4 h-4 text-emerald-700" />,
          desc: 'Xem danh sách lớp học, điểm danh, nhập điểm và theo dõi học thử tại CS1 Tô Hiệu.',
        };
      case 'teachersKienAn':
        return {
          title: 'Giáo Viên Cơ Sở 2 - Kiến An',
          badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
          pin: teacherPinKienAn,
          deptKey: 'teachersKienAn',
          icon: <Building2 className="w-4 h-4 text-teal-700" />,
          desc: 'Xem danh sách lớp học, điểm danh, nhập điểm và theo dõi học thử tại CS2 Kiến An.',
        };
    }
  };

  const currentInfo = getDeptInfo(activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>Quản Lý Gmail Cấp Quyền & Mã PIN Các Bộ Phận</span>
                <span className="text-[10px] bg-purple-600/60 border border-purple-400/40 px-2 py-0.5 rounded-full font-mono">
                  Dành riêng Quản Lý
                </span>
              </h3>
              <p className="text-xs text-purple-200">
                Thêm/xóa Gmail nhân sự các bộ phận. Mail không có trong danh sách sẽ bị từ chối truy cập.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Department Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-1.5 overflow-x-auto">
          {(['teachersToHieu', 'teachersKienAn', 'assistants', 'admins'] as (keyof DepartmentEmails)[]).map((tabKey) => {
            const info = getDeptInfo(tabKey);
            const count = departmentEmails[tabKey].length;
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                  setErrorMsg('');
                  setEditingPinDept(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {info.icon}
                <span>{info.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-purple-900 text-purple-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Active Department Header & Security PIN Editor */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {currentInfo.icon}
                <span className="font-extrabold text-slate-900 text-sm">{currentInfo.title}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {departmentEmails[activeTab].length} email được cấp quyền
                </span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-md">{currentInfo.desc}</p>
            </div>

            {/* Department PIN Config */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shrink-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-600" />
                <span>Mã PIN bộ phận:</span>
              </div>

              {editingPinDept === currentInfo.deptKey ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempPin}
                    onChange={(e) => setTempPin(e.target.value)}
                    className="w-24 px-2 py-1 bg-slate-50 border border-purple-400 rounded-lg text-xs font-mono font-bold text-purple-900 focus:outline-none"
                    placeholder="Mã PIN mới"
                  />
                  <button
                    onClick={() => handleSavePin(currentInfo.deptKey)}
                    className="p-1 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
                    title="Lưu PIN"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingPinDept(null)}
                    className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-[10px]"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-sm text-purple-800 tracking-wider">
                    {currentInfo.pin}
                  </span>
                  <button
                    onClick={() => handleStartEditPin(currentInfo.deptKey, currentInfo.pin)}
                    className="p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Đổi mã PIN"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Add New Email Row */}
          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80 space-y-2">
            <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-700" />
              <span>Thêm Gmail mới vào {currentInfo.title}:</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail(activeTab);
                    }
                  }}
                  placeholder="Ví dụ: giaovien.idv@gmail.com"
                  className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <button
                onClick={() => handleAddEmail(activeTab)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Email</span>
              </button>
            </div>
            <p className="text-[10px] text-purple-700 font-medium">
              💡 Nhân sự dùng Gmail này và nhập mã PIN để vào đúng phân hệ công tác. Mail chưa được thêm sẽ không được cấp quyền.
            </p>
          </div>

          {/* Toast feedback */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Emails List */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Danh sách Gmail đang được cấp quyền ({departmentEmails[activeTab].length}):</span>
              <button
                onClick={handleResetToDefault}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Khôi phục mặc định</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {departmentEmails[activeTab].map((staffEmail) => {
                const normalized = staffEmail.toLowerCase();
                const profile = KNOWN_STAFF_PROFILES[normalized];
                return (
                  <div
                    key={staffEmail}
                    className="p-2.5 bg-white border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs group transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">{profile?.name || staffEmail.split('@')[0]}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{staffEmail}</div>
                      {profile?.specialty && (
                        <div className="text-[10px] text-purple-700 font-medium truncate">{profile.specialty}</div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveEmail(activeTab, staffEmail)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Xóa email khỏi danh sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu phân quyền được lưu tự động trên hệ thống.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Đóng bảng
          </button>
        </div>

      </div>
    </div>
  );
};
