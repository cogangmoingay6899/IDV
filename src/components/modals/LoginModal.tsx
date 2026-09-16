import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  GraduationCap,
  Lock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Users2,
  Building2,
  CheckCircle2,
  Mail,
  UserCheck,
  Settings
} from 'lucide-react';
import { AuthUser, Teacher, UserRole } from '../../types';
import {
  DepartmentEmails,
  DEFAULT_DEPARTMENT_EMAILS,
  getDisplayNameForEmail,
} from '../../data/authStaff';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  teachers: Teacher[];
  onSelectUser: (user: AuthUser) => void;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  departmentEmails: DepartmentEmails;
  onUpdateDepartmentEmails?: (emails: DepartmentEmails) => void;
  teacherPinKienAn?: string;
  teacherPinToHieu?: string;
  assistantPin?: string;
  adminPin?: string;
  pinLastUpdated?: string;
  onUpdateTeacherPin?: (branch: 'KienAn' | 'ToHieu', newPin: string) => void;
  onUpdateAssistantPin?: (newPin: string) => void;
  onUpdateAdminPin?: (newPin: string) => void;
  onOpenStaffManagement?: () => void;
  isForcedAuth?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teachers,
  onSelectUser,
  selectedBranch,
  onBranchChange,
  departmentEmails = DEFAULT_DEPARTMENT_EMAILS,
  onUpdateDepartmentEmails,
  teacherPinKienAn = '6898',
  teacherPinToHieu = '51159',
  assistantPin = '8888',
  adminPin = '0304062224',
  pinLastUpdated = '01/09/2026',
  onUpdateTeacherPin,
  onUpdateAssistantPin,
  onUpdateAdminPin,
  onOpenStaffManagement,
  isForcedAuth = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser?.role || 'teacher');
  const [loginBranch, setLoginBranch] = useState<string>(
    selectedBranch || 'Cơ sở 1 - Tô Hiệu (Hải Phòng)'
  );

  // Email input - start empty (or current user's email if already logged in), no pre-filled emails
  const [email, setEmail] = useState<string>(() => currentUser?.email || '');

  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  // Reset PIN code and errors when switching role or branch
  useEffect(() => {
    if (!currentUser) {
      setPinCode('');
      setPinError('');
    }
  }, [selectedRole, loginBranch, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setPinError('Vui lòng nhập địa chỉ Gmail!');
      return;
    }

    if (!password.trim()) {
      setPinError('Vui lòng nhập mật khẩu Gmail của bạn!');
      return;
    }

    if (!pinCode.trim()) {
      setPinError('Vui lòng nhập mã PIN bảo mật!');
      return;
    }

    // 1. Giáo viên (Teacher) Validation
    if (selectedRole === 'teacher') {
      const isToHieu = loginBranch.includes('Tô Hiệu');
      const branchName = isToHieu ? 'Cơ sở 1 - Tô Hiệu' : 'Cơ sở 2 - Kiến An';
      const allowedTeachers = isToHieu
        ? departmentEmails.teachersToHieu
        : departmentEmails.teachersKienAn;

      const isAuthorized = allowedTeachers.some(
        (tch) => tch.trim().toLowerCase() === normalizedEmail
      );

      if (!isAuthorized) {
        setPinError(
          `Email "${email}" không nằm trong danh sách Giáo viên tại ${branchName}! Dù có mã PIN cũng không thể vào hệ thống. Vui lòng liên hệ Quản lý trung tâm để được thêm email.`
        );
        return;
      }

      const expectedPin = isToHieu ? teacherPinToHieu : teacherPinKienAn;
      if (pinCode.trim() !== expectedPin) {
        setPinError(`Mã PIN bảo mật Giáo viên cho ${branchName} không chính xác!`);
        return;
      }

      // Switch active branch in the application
      onBranchChange(loginBranch);

      // Match teacher in mockData if available
      const matchedTeacher = teachers.find(
        (t) => t.email.trim().toLowerCase() === normalizedEmail
      );
      const profile = getDisplayNameForEmail(normalizedEmail, 'teacher', loginBranch);

      onSelectUser({
        id: `usr-${matchedTeacher?.id || normalizedEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: matchedTeacher ? matchedTeacher.name : profile.name,
        title: profile.title,
        role: 'teacher',
        teacherId: matchedTeacher?.id,
        email: normalizedEmail,
        pinCode: pinCode.trim(),
      });
      onClose();
      return;
    }

    // 2. Trợ lý (Assistant) Validation
    if (selectedRole === 'assistant') {
      const isAuthorized = departmentEmails.assistants.some(
        (ast) => ast.trim().toLowerCase() === normalizedEmail
      );
      if (!isAuthorized) {
        setPinError(
          `Email "${email}" không nằm trong danh sách Trợ lý học vụ được cấp quyền! Dù có mã PIN cũng không thể vào hệ thống. Vui lòng liên hệ Quản lý trung tâm để được thêm email.`
        );
        return;
      }

      if (pinCode.trim() !== assistantPin) {
        setPinError('Mã PIN bảo mật Trợ lý học vụ không chính xác!');
        return;
      }

      const profile = getDisplayNameForEmail(normalizedEmail, 'assistant');
      onSelectUser({
        id: `usr-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: profile.name,
        title: profile.title,
        role: 'assistant',
        email: normalizedEmail,
        pinCode: pinCode.trim(),
      });
      onClose();
      return;
    }

    // 3. Quản lý (Admin) Validation
    if (selectedRole === 'admin') {
      const isAuthorized = departmentEmails.admins.some(
        (adm) => adm.trim().toLowerCase() === normalizedEmail
      );
      if (!isAuthorized) {
        setPinError(
          `Email "${email}" không nằm trong danh sách Quản trị viên (Admin) đã được cấp quyền! Dù có mã PIN cũng không thể vào hệ thống. Vui lòng liên hệ Quản lý trung tâm.`
        );
        return;
      }

      if (pinCode.trim() !== adminPin) {
        setPinError('Mã PIN bảo mật Quản lý không chính xác!');
        return;
      }

      const profile = getDisplayNameForEmail(normalizedEmail, 'admin');
      onSelectUser({
        id: 'usr-admin',
        name: profile.name,
        title: profile.title,
        role: 'admin',
        email: normalizedEmail,
        pinCode: pinCode.trim(),
      });
      onClose();
      return;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
        isForcedAuth ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-slate-900/60 backdrop-blur-xs'
      }`}
    >
      <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">
                {isForcedAuth ? 'Xác Thực Danh Tính & Mã Bảo Mật' : 'Đăng Nhập & Phân Quyền IDV'}
              </h3>
              <p className="text-xs text-purple-200">
                {isForcedAuth
                  ? 'Đăng nhập bằng Gmail đã được cấp quyền, mật khẩu Gmail và mã PIN bảo mật'
                  : 'Chọn vai trò và đăng nhập bằng Gmail đã được cấp quyền'}
              </p>
            </div>
          </div>
          {!isForcedAuth && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Role selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-2">Chọn vai trò truy cập:</label>
            <div className="grid grid-cols-3 gap-2">
              
              {/* Teacher */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('teacher');
                  setPinError('');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'teacher'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedRole === 'teacher' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Giáo Viên</span>
                </div>
                <p className="text-[10px] text-emerald-700 line-clamp-1">Lớp dạy theo cơ sở</p>
              </button>

              {/* Assistant */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('assistant');
                  setPinError('');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'assistant'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedRole === 'assistant' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Users2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Trợ Lý</span>
                </div>
                <p className="text-[10px] text-indigo-700 line-clamp-1">Học vụ & Tuyển sinh</p>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setPinError('');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'admin'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedRole === 'admin' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Quản Lý</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">Ban Giám Đốc</p>
              </button>
            </div>
          </div>

          {/* Teacher Branch Selector (No hints, No teacher select) */}
          {selectedRole === 'teacher' && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl space-y-2.5 animate-in fade-in">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Chọn cơ sở công tác giảng dạy:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginBranch('Cơ sở 1 - Tô Hiệu (Hải Phòng)');
                    setPinError('');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    loginBranch.includes('Tô Hiệu')
                      ? 'border-emerald-600 bg-white text-emerald-900 ring-2 ring-emerald-500/30 font-bold shadow-xs'
                      : 'border-emerald-200 bg-emerald-100/40 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span>CS1: Tô Hiệu (Hải Phòng)</span>
                    {loginBranch.includes('Tô Hiệu') && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginBranch('Cơ sở 2 - Kiến An (Hải Phòng)');
                    setPinError('');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    loginBranch.includes('Kiến An')
                      ? 'border-emerald-600 bg-white text-emerald-900 ring-2 ring-emerald-500/30 font-bold shadow-xs'
                      : 'border-emerald-200 bg-emerald-100/40 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span>CS2: Kiến An (Hải Phòng)</span>
                    {loginBranch.includes('Kiến An') && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Form Login Inputs: Gmail, Password, PIN */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Gmail Input */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Địa chỉ Gmail được cấp quyền:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Chỉ Gmail trong danh sách mới vào được
                </span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setPinError('');
                }}
                placeholder="Nhập địa chỉ Gmail của bạn"
                autoComplete="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mật khẩu Gmail:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPinError('');
                }}
                placeholder="Nhập mật khẩu của bạn"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Security PIN Code Input (NO PIN hints) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  Mã PIN bảo mật ({selectedRole === 'teacher' ? (loginBranch.includes('Tô Hiệu') ? 'CS1 Tô Hiệu' : 'CS2 Kiến An') : selectedRole === 'assistant' ? 'Trợ lý' : 'Quản lý'}):
                </span>
              </label>
              <input
                type="password"
                required
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  setPinError('');
                }}
                placeholder="Nhập mã PIN bảo mật"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-center font-bold tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pinError}</span>
              </div>
            )}

            {/* Admin shortcut to manage emails if already logged in as Admin */}
            {currentUser?.role === 'admin' && onOpenStaffManagement && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStaffManagement();
                  }}
                  className="w-full p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span>Cấu hình & Thêm/Xóa Gmail nhân sự các bộ phận</span>
                </button>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {!isForcedAuth && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
              )}

              <button
                type="submit"
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all inline-flex items-center gap-2 ${
                  selectedRole === 'teacher'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : selectedRole === 'assistant'
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    : 'bg-purple-700 hover:bg-purple-800 shadow-purple-600/20'
                }`}
              >
                <span>Xác thực & Vào hệ thống ({selectedRole === 'teacher' ? 'Giáo viên' : selectedRole === 'assistant' ? 'Trợ lý' : 'Quản lý'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
