import React from 'react';
import {
  Wallet,
  Users2,
  UserPlus,
  BookOpenCheck,
  ClipboardList,
  GraduationCap,
  MessageSquareText,
  CalendarCheck2,
  BarChart3,
  Award,
  Target,
  BookMarked,
  PackageCheck,
  TrendingUp,
  School,
  Sparkles,
  ArrowRight,
  Plus,
  Shield,
  KeyRound,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { ModuleId, AuthUser } from '../types';

interface ModuleGridProps {
  onSelectModule: (module: ModuleId) => void;
  onOpenCreateClass: () => void;
  onOpenLogin: () => void;
  currentUser: AuthUser;
  stats: {
    totalStudents: number;
    activeClasses: number;
    monthlyRevenue: number;
    pendingLeads: number;
    unpaidCount: number;
    placementCount: number;
  };
}

interface ModuleCardItem {
  id: ModuleId;
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}

export const ModuleGrid: React.FC<ModuleGridProps> = ({
  onSelectModule,
  onOpenCreateClass,
  onOpenLogin,
  currentUser,
  stats,
}) => {
  const isTeacher = currentUser.role === 'teacher';
  const isAssistant = currentUser.role === 'assistant';
  const isAdmin = currentUser.role === 'admin';

  // The modules definition
  const allModules: ModuleCardItem[] = [
    {
      id: 'finance',
      title: 'Quản lý tài chính',
      icon: <Wallet className="w-6 h-6" />,
      subtitle: 'Thu/chi học phí, biên lai thu tiền, công nợ học viên tại 2 cơ sở',
      badge: `${stats.unpaidCount} nợ phí`,
      badgeColor: stats.unpaidCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600',
    },
    {
      id: 'hr',
      title: 'Quản lý nhân sự',
      icon: <Users2 className="w-6 h-6" />,
      subtitle: 'Hồ sơ giáo viên bản ngữ/Việt Nam, trợ giảng, phân công lịch dạy & bảng lương',
      badge: '4 giáo viên',
    },
    {
      id: 'admissions',
      title: 'Quản lý tuyển sinh',
      icon: <UserPlus className="w-6 h-6" />,
      subtitle: 'Pipeline khách tiềm năng, tư vấn, hẹn test & đăng ký ghi danh',
      badge: `${stats.pendingLeads} lead`,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'trial',
      title: 'Quản lý học thử',
      icon: <BookOpenCheck className="w-6 h-6" />,
      subtitle: 'Lịch học thử, đánh giá trải nghiệm, tỷ lệ chuyển đổi lớp mới',
      badge: 'Học thử',
    },
    {
      id: 'placement',
      title: 'Quản lý kiểm tra đầu vào',
      icon: <ClipboardList className="w-6 h-6" />,
      subtitle: 'Đánh giá 4 kỹ năng Nghe-Nói-Đọc-Viết, xếp level lộ trình IDV',
      badge: `${stats.placementCount} phiếu test`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'students',
      title: 'Quản lý học viên & Lớp',
      icon: <GraduationCap className="w-6 h-6" />,
      subtitle: 'Hồ sơ học viên, danh sách lớp học, Sổ lớp & Bảng điểm từng buổi (L1, L2...)',
      badge: `${stats.totalStudents} học viên`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'contact_book',
      title: 'Quản lý sổ liên lạc',
      icon: <MessageSquareText className="w-6 h-6" />,
      subtitle: 'Sổ liên lạc điện tử, nhận xét buổi học gửi phụ huynh Zalo/SMS',
      badge: 'Sổ điện tử',
    },
    {
      id: 'reports',
      title: 'Quản lý báo cáo',
      icon: <BarChart3 className="w-6 h-6" />,
      subtitle: 'Báo cáo doanh thu 2 cơ sở, tỷ lệ duy trì học viên, chất lượng',
      badge: 'Real-time',
    },
    {
      id: 'exams',
      title: 'Quản lý điểm thi',
      icon: <Award className="w-6 h-6" />,
      subtitle: 'Bảng điểm giữa kỳ/cuối kỳ 4 kỹ năng, xếp loại, cấp chứng chỉ IDV',
      badge: 'Đánh giá',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
    },
    {
      id: 'kpi',
      title: 'Quản lý chỉ tiêu',
      icon: <Target className="w-6 h-6" />,
      subtitle: 'Chỉ tiêu doanh thu tuyển sinh, KPI tư vấn viên theo tháng',
      badge: 'Chỉ tiêu',
    },
    {
      id: 'curriculum',
      title: 'Quản lý khóa học & Học phí',
      icon: <BookMarked className="w-6 h-6" />,
      subtitle: 'Khung chương trình chuẩn IELTS, Cambridge & bảng học phí học sinh theo khóa',
      badge: 'Quản lý & Trợ lý',
      badgeColor: 'bg-purple-100 text-purple-800 font-bold',
    },
  ];

  // RBAC Filtering according to exact prompt specifications:
  // - Teacher: 'students', 'trial', 'exams'
  // - Assistant: 'students', 'curriculum', 'admissions', 'exams', 'contact_book', 'placement', 'trial'
  // - Admin: All modules
  const visibleModules = isTeacher
    ? allModules.filter((m) => m.id === 'students' || m.id === 'trial' || m.id === 'exams')
    : isAssistant
    ? allModules.filter((m) =>
        ['students', 'curriculum', 'admissions', 'exams', 'contact_book', 'placement', 'trial'].includes(m.id)
      )
    : allModules;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Center Intro */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-purple-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Hệ Thống Đào Tạo & Quản Lý IELTS DƯƠNG VŨ
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            IELTS DƯƠNG VŨ
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            • <strong>Cơ sở 1:</strong> Tô Hiệu, Hải Phòng &nbsp;|&nbsp; • <strong>Cơ sở 2:</strong> Kiến An, Hải Phòng &nbsp;|&nbsp; • <strong>Hotline:</strong> 0798934698
          </p>
          <p className="text-slate-300 text-xs mt-1">
            {isTeacher
              ? `Tài khoản Giáo viên: ${currentUser.name}. Hệ thống đã khóa bảo mật: Bạn chỉ có quyền truy cập 2 phân hệ "Học viên & Lớp" và "Học thử".`
              : isAssistant
              ? `Tài khoản Trợ lý: ${currentUser.name}. Bạn có quyền xem 6 phân hệ nghiệp vụ: Học viên, Lớp, Tuyển sinh, Điểm thi, Sổ liên lạc, Test đầu vào & Học thử.`
              : 'Ban Giám Đốc / Quản lý trung tâm có toàn quyền truy cập 14 phân hệ nghiệp vụ, quản lý tài chính & báo cáo.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {isAdmin && (
              <button
                onClick={onOpenCreateClass}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Lớp Học Mới</span>
              </button>
            )}
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Chuyển vai trò / Đăng nhập tài khoản khác</span>
            </button>
          </div>
        </div>

        {/* Quick stats strip for Admin / Assistant */}
        {!isTeacher && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-xs text-slate-300 block">Tổng số lớp học</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{stats.activeClasses}</div>
              <span className="text-[10px] text-purple-300 font-medium">CS1 Tô Hiệu & CS2 Kiến An</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-xs text-slate-300 block">Tổng học viên</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{stats.totalStudents}</div>
              <span className="text-[10px] text-emerald-400 font-medium">Đang theo học</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-xs text-slate-300 block">Đội ngũ giáo viên</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">4</div>
              <span className="text-[10px] text-emerald-400 font-medium">Bản ngữ & Việt Nam</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
              <span className="text-xs text-slate-300 block">Khách tiềm năng</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{stats.pendingLeads}</div>
              <span className="text-[10px] text-amber-300 font-medium">Chờ tư vấn</span>
            </div>
          </div>
        )}
      </div>

      {/* Teacher notice box if logged in as teacher */}
      {isTeacher && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-emerald-900">
                Chế độ phân quyền: Giáo viên ({currentUser.name})
              </div>
              <div className="text-emerald-700 mt-0.5">
                Mã bảo mật PIN đã được xác thực thành công. Bạn chỉ được phép truy cập vào <strong>Học viên & Lớp học</strong> và <strong>Học thử</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Đổi sang quyền Quản lý
          </button>
        </div>
      )}

      {/* Assistant notice box if logged in as assistant */}
      {isAssistant && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-indigo-900">
                Chế độ phân quyền: Trợ lý trung tâm ({currentUser.name})
              </div>
              <div className="text-indigo-700 mt-0.5">
                Tài khoản Gmail trợ lý đã được xác thực. Bạn có quyền truy cập 6 phân hệ: Học viên & Lớp, Tuyển sinh, Điểm thi, Sổ liên lạc, Test đầu vào & Học thử.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Đổi tài khoản
          </button>
        </div>
      )}

      {/* Module Grid Header */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isTeacher ? 'Phân hệ được cấp quyền (Giáo viên)' : isAssistant ? 'Phân hệ nghiệp vụ (Trợ lý)' : 'Toàn bộ Phân hệ Nghiệp vụ Trung tâm'}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isTeacher ? 'bg-emerald-100 text-emerald-800' : isAssistant ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-700'
              }`}>
                {visibleModules.length} Modules
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTeacher
                ? 'Thầy/Cô chọn phân hệ bên dưới để xem danh sách lớp học, quản lý danh sách học viên hoặc quản lý học thử'
                : isAssistant
                ? 'Trợ lý chọn phân hệ để hỗ trợ công tác tuyển sinh, xếp lớp, nhập điểm thi, nhắn sổ liên lạc & test đầu vào'
                : 'Chọn phân hệ nghiệp vụ để quản lý học viên, giáo viên, lớp học, tài chính và báo cáo'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => onSelectModule('inventory')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200/80 transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Kho hàng & Đồng phục</span>
            </button>
          )}
        </div>

        {/* The Grid */}
        <div className={`grid gap-4 sm:gap-5 ${
          isTeacher
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
            : isAssistant
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {visibleModules.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectModule(m.id)}
              className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Subtle top indicator on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Top Badge */}
              {m.badge && (
                <span className={`absolute top-3.5 right-3.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.badgeColor || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {m.badge}
                </span>
              )}

              {/* Purple/Emerald Icon Container */}
              <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-200 ${
                isTeacher
                  ? 'bg-gradient-to-b from-emerald-600 to-teal-700 shadow-emerald-900/20'
                  : isAssistant
                  ? 'bg-gradient-to-b from-indigo-600 to-purple-700 shadow-indigo-900/20'
                  : 'bg-gradient-to-b from-[#6b21a8] to-[#4c1d95] shadow-purple-950/20'
              }`}>
                {m.icon}
              </div>

              {/* Module Title */}
              <h3 className="text-slate-900 font-bold text-base tracking-tight group-hover:text-purple-700 transition-colors">
                {m.title}
              </h3>

              {/* Short descriptive subtitle */}
              <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed font-normal">
                {m.subtitle}
              </p>

              {/* Interactive link arrow */}
              <div className="mt-4 pt-3 w-full border-t border-slate-100 flex items-center justify-center text-xs font-semibold text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <span>Vào phân hệ</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
