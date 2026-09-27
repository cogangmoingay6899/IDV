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
  FileSpreadsheet,
  SlidersHorizontal,
  X,
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
  onExportExcel?: () => void;
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
  onExportExcel,
  currentUser,
  searchQuery,
  onSearchChange,
  selectedBranch,
  onBranchChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

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
        <div className="flex items-center justify-between h-16 gap-3 md:gap-4">
          
          {/* Logo & IELTS DƯƠNG VŨ Branding */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => onSelectModule(isTeacher || isAssistant ? 'students' : 'dashboard')}
              className="flex items-center gap-1.5 md:gap-2.5 text-left group transition-transform active:scale-95 min-w-0"
              title="Về màn hình chính IELTS DƯƠNG VŨ"
            >
              <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-600/20 ring-2 ring-purple-100 group-hover:shadow-md transition-all shrink-0">
                <GraduationCap className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base md:text-xl tracking-tight text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                    IELTS <span className="text-purple-600">DƯƠNG VŨ</span>
                  </span>
                  <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0">
                    HP
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-1.5 mt-0.5">
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
                className="ml-1 md:ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">Chính</span>
              </button>
            )}
          </div>

          {/* Center: Branch Selector & Search (Desktop Only) */}
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
          <div className="flex items-center gap-1.5 md:gap-2">
            
            {/* Mobile-Only Toggles for Search & Branch Selection */}
            <button
              onClick={() => {
                setShowMobileSearch(!showMobileSearch);
                setShowMobileActions(false);
                setShowBranchMenu(false);
              }}
              className={`md:hidden p-2 text-slate-600 hover:text-purple-700 hover:bg-slate-50 rounded-xl transition-colors ${showMobileSearch ? 'bg-purple-50 text-purple-700' : ''}`}
              title="Tìm kiếm nhanh"
            >
              <Search className="w-4 h-4" />
            </button>

            <div className="relative md:hidden">
              <button
                onClick={() => {
                  setShowBranchMenu(!showBranchMenu);
                  setShowMobileSearch(false);
                  setShowMobileActions(false);
                }}
                className={`p-2 text-slate-600 hover:text-purple-700 hover:bg-slate-50 rounded-xl transition-colors ${showBranchMenu ? 'bg-purple-50 text-purple-700' : ''}`}
                title="Chọn cơ sở"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {showBranchMenu && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Chọn cơ sở hoạt động
                  </div>
                  {branches.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        onBranchChange(b);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center justify-between ${
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

            {/* Mobile-Only Action Sheet Button */}
            {(isAdmin || isAssistant) && (
              <button
                onClick={() => {
                  setShowMobileActions(!showMobileActions);
                  setShowMobileSearch(false);
                  setShowBranchMenu(false);
                }}
                className={`md:hidden p-1.5 px-2 bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${showMobileActions ? 'ring-2 ring-purple-300' : ''}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thao tác</span>
              </button>
            )}

            {/* Desktop-Only Action Buttons */}
            {isAdmin && (
              <>
                <button
                  onClick={onOpenCreateClass}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-colors whitespace-nowrap"
                  title="Mở lớp học mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo lớp mới</span>
                </button>

                <button
                  onClick={onOpenQuickTuition}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors whitespace-nowrap"
                  title="Lập phiếu thu học phí"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Thu học phí</span>
                </button>

                <button
                  onClick={onOpenQuickStudent}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs shadow-purple-600/30 transition-all active:scale-95 whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Thêm học viên</span>
                </button>

                {onExportExcel && (
                  <button
                    onClick={onExportExcel}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                    title="Tải toàn bộ dữ liệu trung tâm (Các lớp, học sinh, giáo viên, học phí) về file Excel chia thành nhiều Sheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tải Excel</span>
                  </button>
                )}
              </>
            )}

            {/* If Assistant (standard - Desktop Only): Quick actions */}
            {isAssistant && !isNhungPhan && (
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  onClick={onOpenQuickStudent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Học viên</span>
                </button>
                <button
                  onClick={() => onSelectModule('admissions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  <span>Tuyển sinh</span>
                </button>
              </div>
            )}

            {/* If Teacher (Desktop Only): Quick Nav */}
            {isTeacher && (
              <div className="hidden md:flex items-center gap-1.5">
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

            {/* Admin Quick Action for Staff Email Management (Desktop Only) */}
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
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMobileActions(false);
                  setShowMobileSearch(false);
                  setShowBranchMenu(false);
                }}
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

                  {isAdmin && onExportExcel && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onExportExcel();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-2 border border-emerald-200/80 my-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>Tải Excel Toàn Trung Tâm (Mỗi lớp 1 sheet)</span>
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

      {/* Mobile Search Bar Expansion */}
      {showMobileSearch && (
        <div className="md:hidden px-4 py-2 border-t border-b border-slate-100 bg-slate-50 flex items-center gap-2 animate-in slide-in-from-top-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isTeacher ? "Tìm học viên trong lớp..." : "Tìm học viên, SĐT, lớp học..."}
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              autoFocus
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
      )}

      {/* Mobile Actions Drawer Backdrop & Bottom Sheet */}
      {showMobileActions && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center animate-in fade-in" 
          onClick={() => setShowMobileActions(false)}
        >
          {/* Drawer Panel */}
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" onClick={() => setShowMobileActions(false)}></div>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-black text-slate-900 tracking-tight">🎒 BẢNG THAO TÁC NHANH</span>
              <button 
                onClick={() => setShowMobileActions(false)} 
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      onOpenCreateClass();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 hover:bg-indigo-100 active:scale-95 transition-all text-center gap-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-indigo-950">Tạo lớp mới</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      onOpenQuickTuition();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all text-center gap-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-emerald-950">Thu học phí</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      onOpenQuickStudent();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50/80 border border-purple-100 hover:bg-purple-100 active:scale-95 transition-all text-center gap-2 col-span-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-sm shadow-purple-600/20">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-purple-950">Thêm học viên mới</span>
                  </button>

                  {onExportExcel && (
                    <button
                      onClick={() => {
                        setShowMobileActions(false);
                        onExportExcel();
                      }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all w-full col-span-2 text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800">Tải Excel Toàn Trung Tâm</div>
                        <div className="text-[10px] text-slate-500 font-medium">Xuất dữ liệu học sinh, lớp, điểm thi, thù lao</div>
                      </div>
                    </button>
                  )}

                  {onOpenStaffManagement && (
                    <button
                      onClick={() => {
                        setShowMobileActions(false);
                        onOpenStaffManagement();
                      }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all w-full col-span-2 text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 text-purple-700" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800">Cấp quyền Gmail & PIN</div>
                        <div className="text-[10px] text-slate-500 font-medium">Quản lý bảo mật phân quyền nhân sự</div>
                      </div>
                    </button>
                  )}
                </>
              )}

              {isAssistant && !isNhungPhan && (
                <>
                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      onOpenQuickStudent();
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 hover:bg-indigo-100 active:scale-95 transition-all text-center gap-2 col-span-2 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-indigo-950">Thêm học viên mới</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActions(false);
                      onSelectModule('admissions');
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all w-full col-span-2 text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                      <Users2 className="w-4 h-4 text-indigo-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">Phòng Tuyển sinh</div>
                      <div className="text-[10px] text-slate-500">Xem và quản lý hồ sơ tuyển sinh</div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
