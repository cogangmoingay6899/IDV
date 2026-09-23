import React, { useState } from 'react';
import {
  Search,
  Bell,
  Building2,
  Calendar,
  PlusCircle,
  Receipt,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Plus,
  Shield,
  KeyRound,
  LogOut,
  Layers,
  Users2,
  BookOpen,
} from 'lucide-react';
import { ModuleId, AuthUser } from '../types';

interface HeaderProps {
  currentModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  onOpenQuickTuition: () => void;
  onOpenQuickStudent: () => void;
  onOpenCreateClass: () => void;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onOpenStaffManagement?: () => void;
  currentUser: AuthUser | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  studentCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onSelectModule,
  onOpenQuickTuition,
  onOpenQuickStudent,
  onOpenCreateClass,
  onOpenLogin,
  onLogout,
  onOpenStaffManagement,
  currentUser,
  searchQuery,
  onSearchChange,
  selectedBranch,
  onBranchChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isTeacher = currentUser?.role === 'teacher';
  const isAssistant = currentUser?.role === 'assistant';
  const isAdmin = currentUser?.role === 'admin';
  const isNhungPhan = currentUser?.email?.trim().toLowerCase() === 'nhungphan.mkt@gmail.com';

  const branches = [
    'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
    'Cơ sở 2 - Kiến An (Hải Phòng)',
  ];

  const notifications = [
    { id: 1, text: 'Đã cập nhật hệ thống bảo mật phân quyền tài khoản Giáo viên & Trợ lý', time: 'Vừa xong', type: 'info' },
    { id: 2, text: 'Hệ thống IELTS DƯƠNG VŨ sẵn sàng quản lý Lớp học, Tuyển sinh và Điểm thi', time: 'Hôm nay', type: 'success' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & IELTS DƯƠNG VŨ Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectModule(isTeacher || isAssistant ? 'students' : 'dashboard')}
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
              title="Về màn hình chính IELTS DƯƠNG VŨ"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-600/20 ring-2 ring-purple-100 group-hover:shadow-md transition-all">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors">
                    IELTS <span className="text-purple-600">DƯƠNG VŨ</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                    Hải Phòng
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Firebase Cloud DB Synced</span>
                  </span>
                </div>
              </div>
            </button>

            {isAdmin && currentModule !== 'dashboard' && (
              <button
                onClick={() => onSelectModule('dashboard')}
                className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Màn hình chính</span>
              </button>
            )}
          </div>

          {/* Center: Branch Selector & Search */}
          <div className="flex-1 max-w-xl hidden md:flex items-center gap-2.5">
            {/* Branch Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors whitespace-nowrap"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span className="max-w-[130px] truncate">{selectedBranch}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showBranchMenu && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Chọn cơ sở hoạt động
                  </div>
                  {branches.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        onBranchChange(b);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                        selectedBranch === b
                          ? 'bg-purple-50 text-purple-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{b}</span>
                      {selectedBranch === b && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isTeacher ? "Tìm học viên trong lớp..." : "Tìm học viên, SĐT, lớp học..."}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            
            {/* If Admin: Full Action buttons */}
            {isAdmin && (
              <>
                <button
                  onClick={onOpenCreateClass}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors whitespace-nowrap"
                  title="Mở lớp học mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tạo lớp mới</span>
                </button>

                <button
                  onClick={onOpenQuickTuition}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors whitespace-nowrap"
                  title="Lập phiếu thu học phí"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thu học phí</span>
                </button>

                <button
                  onClick={onOpenQuickStudent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs shadow-purple-600/30 transition-all active:scale-95 whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thêm học viên</span>
                </button>
              </>
            )}

            {/* If Nhung Phan: Specialized quick badge */}
            {isNhungPhan && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectModule('students')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-all whitespace-nowrap"
                  title="Nhật ký & Chấm điểm buổi học"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nhật ký & Chấm điểm</span>
                </button>
              </div>
            )}

            {/* If Assistant (standard): Quick actions */}
            {isAssistant && !isNhungPhan && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenQuickStudent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+ Học viên</span>
                </button>
                <button
                  onClick={() => onSelectModule('admissions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  <span>Tuyển sinh</span>
                </button>
              </div>
            )}

            {/* If Teacher: Quick Nav */}
            {isTeacher && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectModule('students')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                    currentModule === 'students'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Học viên & Lớp
                </button>
                <button
                  onClick={() => onSelectModule('trial')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                    currentModule === 'trial'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Học thử
                </button>
              </div>
            )}

            {/* Admin Quick Action for Staff Email Management */}
            {isAdmin && onOpenStaffManagement && (
              <button
                onClick={onOpenStaffManagement}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                title="Quản lý danh sách Gmail nhân sự được cấp quyền & Mã PIN"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Email Nhân Sự & PIN</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-purple-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Thông báo hệ thống"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Thông báo hệ thống</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                      Hoạt động
                    </span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <p className="text-xs text-slate-700 leading-snug">{n.text}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border transition-all text-left ${
                  isTeacher
                    ? 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70'
                    : isAssistant
                    ? 'border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100/70'
                    : 'border-purple-200 bg-purple-50/70 hover:bg-purple-100/70'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                    isTeacher
                      ? 'bg-emerald-600'
                      : isAssistant
                      ? 'bg-indigo-600'
                      : 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                  }`}
                >
                  {isTeacher ? 'GV' : isAssistant ? 'TL' : 'AD'}
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-extrabold text-slate-800 leading-tight flex items-center gap-1">
                    <span>{currentUser?.name || 'Tài khoản IDV'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] font-semibold flex items-center gap-1">
                    {isTeacher ? (
                      <span className="text-emerald-700">Quyền Giáo viên (Lớp dạy)</span>
                    ) : isAssistant ? (
                      <span className="text-indigo-700">Quyền Trợ lý (Học phí, Khóa học, Tuyển sinh...)</span>
                    ) : (
                      <span className="text-purple-700">Quản lý trung tâm (Toàn quyền)</span>
                    )}
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="font-bold text-xs text-slate-900">{currentUser?.name || 'Tài khoản IDV'}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{currentUser?.email || ''}</div>
                    <div className="mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isTeacher
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAssistant
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {isTeacher
                          ? 'Phân quyền: Học viên & Lớp dạy, Học thử (Không xem học phí)'
                          : isAssistant
                          ? 'Phân quyền: Khóa học & Học phí, Học viên, Tuyển sinh, Điểm, Sổ liên lạc, Test, Học thử'
                          : 'Phân quyền: Quản lý trung tâm (Toàn quyền)'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && onOpenStaffManagement && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenStaffManagement();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-purple-950 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4 text-purple-700" />
                      <span>Quản lý Gmail nhân sự & Mã PIN</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenLogin();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <span>Đổi vai trò / Đăng nhập tài khoản khác</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất khỏi hệ thống</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
