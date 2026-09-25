
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import {
  Users, BookOpen, GraduationCap, School, Shield, Clock,
  CalendarDays, CalendarCheck2, PenLine, CheckCircle2,
  FileSpreadsheet, ArrowRight, ExternalLink, Building2,
  AlertCircle, Bell, Sparkles, Trash2, Search, Check, UserX,
  Plus
} from "lucide-react";
import { Student, ClassGroup, Teacher, CurriculumCourse, AttendanceRecord, TuitionTransaction, ExamScore, AuthUser } from "../../types";
import { EditClassModal } from "../modals/EditClassModal";
import { ClassDetailView } from "./ClassDetailView";
import { ClassVocabTestModule } from "./ClassVocabTestModule";
import { CourseTuitionTable } from "./CourseTuitionTable";
import { ClassFullScheduleModal } from "../modals/ClassFullScheduleModal";
import { CourseScheduleRemindersModal } from "../modals/CourseScheduleRemindersModal";
import { calculateCourseSchedule, detectCourseLevel, calculateClassEndInfo, formatDateVN } from "../../utils/courseSchedule";

import { ClassSpreadsheetGradebookModule } from "./ClassSpreadsheetGradebookModule";
import { ErrorBoundary } from "../ErrorBoundary";

const y = React;
const e = { jsx: _jsx, jsxs: _jsxs, Fragment: _Fragment };
const CP = ClassDetailView;
const HB = ClassVocabTestModule;
const EB = ErrorBoundary;
const K5 = CourseTuitionTable;
const X5 = EditClassModal;
const lT = ClassFullScheduleModal;
const yP = CourseScheduleRemindersModal;
const SG = ClassSpreadsheetGradebookModule;

const Es = Check;
const Gc = CalendarDays;
const Hi = PenLine;
const Hs = CheckCircle2;
const Ji = CalendarCheck2;
const Kr = FileSpreadsheet;
const Su = ArrowRight;
const Ta = BookOpen;
const VI = UserX;
const Va = ExternalLink;
const Wi = Building2;
const fi = AlertCircle;
const gi = Bell;
const ja = GraduationCap;
const jn = Sparkles;
const na = Clock;
const of = School;
const qc = Shield;
const qn = Search;
const wa = Users;
const wn = Trash2;
const $s = Plus;

const kr = calculateCourseSchedule;
const lr = detectCourseLevel;
const hf = calculateClassEndInfo;
const tn = formatDateVN;

export interface StudentsModuleProps {
  students: Student[];
  classes: ClassGroup[];
  teachers?: Teacher[];
  courses?: CurriculumCourse[];
  attendanceRecords?: AttendanceRecord[];
  transactions?: TuitionTransaction[];
  onSaveAttendance?: any;
  onAddTeacher?: any;
  onAddExamScore?: any;
  onAddStudent?: any;
  onOpenCreateClass?: any;
  onUpdateClass?: any;
  onOpenImportSheet?: any;
  onSelectStudentDetail?: any;
  onEnrollStudentToClass?: any;
  onRemoveStudentFromClass?: any;
  onRestoreStudentFromClass?: any;
  onUpdateStudent?: any;
  onOpenQuickTuition?: any;
  currentUser?: AuthUser;
  onDeleteClass?: any;
  onClearAllClasses?: any;
  onDeleteStudent?: any;
}

const StudentsModule: React.FC<StudentsModuleProps> = ({
  students: n,
  classes: t,
  teachers: s = [],
  courses: a = [],
  attendanceRecords: l = [],
  transactions: o = [],
  onSaveAttendance: d,
  onAddTeacher: u,
  onAddExamScore: m,
  onAddStudent: g,
  onOpenCreateClass: b,
  onUpdateClass: C,
  onOpenImportSheet: w,
  onSelectStudentDetail: D,
  onEnrollStudentToClass: _,
  onRemoveStudentFromClass: O,
  onRestoreStudentFromClass: G,
  onUpdateStudent: M,
  onOpenQuickTuition: le,
  currentUser: Q,
  onDeleteClass: ue,
  onClearAllClasses: me,
  onDeleteStudent: V,
}) => {
  var Nt, Mt;
  const [j, k] = y.useState("classes"),
    [R, F] = y.useState(void 0),
    [Y, P] = y.useState(null),
    [A, je] = y.useState(null),
    [W, K] = y.useState(""),
    [ne, we] = y.useState(""),
    [Ee, Re] = y.useState("all"),
    [X, he] = y.useState("all"),
    [z, ve] = y.useState("all"),
    [J, be] = y.useState("all"),
    [Ye, Te] = y.useState(""),
    [Et, Wt] = y.useState(""),
    [Fe, Qe] = y.useState(null),
    [Ue, St] = y.useState(!1),
    [Tt, de] = y.useState(null),
    [ze, dt] = y.useState(null),
    We = (B) => {
      var As, nn, dn, $n, ls, Ds;
      if (!(
        ((As = B.className) == null
          ? void 0
          : As.toLowerCase().includes("khóa 4")) ||
        ((nn = B.className) == null
          ? void 0
          : nn.toLowerCase().includes("drill")) ||
        ((dn = B.courseName) == null
          ? void 0
          : dn.toLowerCase().includes("khóa 4")) ||
        (($n = B.courseName) == null
          ? void 0
          : $n.toLowerCase().includes("drill")) ||
        lr(B.className || B.courseName || "", 32) === "Khóa 4" ||
        B.isExternalStudent ||
        B.studentCategory === "Học sinh ngoài"
      ))
        return { isK4: !1 };
      const Ze = l.filter(
          (ms) => ms.studentId === B.id && ms.classId === B.classId,
        ).length,
        ct = t.find((ms) => ms.id === B.classId),
        Vt =
          (ct == null ? void 0 : ct.schedule) ||
          "Thứ 2 + Thứ 5 (Ca 1: 18:00 - 19:45)",
        Z = (ct == null ? void 0 : ct.offDates) || [],
        _e =
          B.startDate ||
          B.joinDate ||
          (ct == null ? void 0 : ct.startDate) ||
          new Date().toISOString().split("T")[0],
        pe = Math.floor(Ze / 32) + 1,
        Me = Ze % 32,
        yt = pe * 32,
        It = kr(_e, Vt, yt, Z, "Khóa 4"),
        Ke =
          ((ls = It.sessions[It.sessions.length - 1]) == null
            ? void 0
            : ls.date) || "";
      let Ft = "";
      if (pe > 1) {
        const ms = kr(_e, Vt, (pe - 1) * 32, Z, "Khóa 4");
        Ft =
          ((Ds = ms.sessions[ms.sessions.length - 1]) == null
            ? void 0
            : Ds.date) || "";
      }
      const Cs =
          pe > 1 && (!B.tuitionPaidDate || (Ft && B.tuitionPaidDate < Ft)),
        is = Me >= 28;
      let Ls = "",
        Ns = !1;
      return (
        Cs
          ? ((Ns = !0),
            (Ls = `⚠️ NỢ PHÍ CHU KỲ ${pe}: Đã học sang buổi ${Me + 32 * (pe - 1)} nhưng chưa nộp tiền đợt mới!`))
          : is &&
            ((Ns = !0),
            (Ls = `🔔 SẮP HẾT KHÓA: Đã học ${Me}/32 buổi của Chu kỳ ${pe}. Nhắc đóng học phí cho chu kỳ tiếp theo!`)),
        {
          isK4: !0,
          attendedCount: Ze,
          currentCycle: pe,
          sessionsThisCycle: Me,
          totalSessionsForCycle: yt,
          personalEndDate: Ke,
          previousCycleEndDate: Ft,
          isUnpaidForCurrentCycle: Cs,
          isApproachingCycleEnd: is,
          needsReminder: Ns,
          reminderMessage: Ls,
        totalBalanceOwed: (function() {
          const sessionRate = (B.customTuitionFee || (ct ? ct.tuitionFee : 14500000) || 14500000) / 32;
          const proRatedTuition = Math.round(Me * sessionRate);
          const cycleFee = (B.customTuitionFee || (ct ? ct.tuitionFee : 14500000) || 14500000);
          return (Cs ? cycleFee : 0) + (Me < 32 ? proRatedTuition : 0);
        })(),
      }
      );
    },
    [Ct, ye] = y.useState(!1),
    rt = t.filter((B) => hf(B).taAlertStatus === "needed").length,
    bt = t.filter((B) => hf(B).examStatus === "in_exam").length,
    ce = (B) =>
      B === void 0 || isNaN(B)
        ? "0đ"
        : new Intl.NumberFormat("vi-VN").format(B) + "đ",
    L = (B, fe) => {
      const Ze = (
        (fe === "parent"
          ? B.parentPhone || B.phone
          : B.phone || B.parentPhone) || ""
      ).replace(/\D/g, "");
      if (!Ze) {
        (Qe("Chưa có số điện thoại hợp lệ để mở Zalo"),
          setTimeout(() => Qe(null), 3e3));
        return;
      }
      const ct =
          fe === "parent"
            ? `Phụ huynh ${B.parentName || `em ${B.name}`}`
            : `em ${B.name}`,
        Vt = B.tuitionDeadlineDate
          ? new Date(B.tuitionDeadlineDate).toLocaleDateString("vi-VN")
          : "thời hạn quy định",
        Z = `Dạ em chào ${ct} ạ, em liên hệ từ IELTS DƯƠNG VŨ. Dạ em xin phép gửi thông tin học phí của ${fe === "parent" ? `em ${B.name} (Mã HV: ${B.code})` : "bạn"} tại lớp ${B.className || "IELTS"}. Hiện tại số học phí cần hoàn tất là ${ce(B.balanceOwed || 0)}, hạn nộp là ${Vt}. ${fe === "parent" ? "Gia đình" : "Bạn"} vui lòng sắp xếp hoàn tất học phí sớm giúp trung tâm để đảm bảo quyền lợi học tập tốt nhất cho học viên nhé ạ. Em cảm ơn ${fe === "parent" ? "Quý phụ huynh" : "bạn"} rất nhiều ạ! ❤️`;
      (navigator.clipboard.writeText(Z).catch(() => {}),
        Qe(
          `Đã sao chép tin nhắn nhắc học phí & mở Zalo ${fe === "parent" ? "Phụ huynh" : "Học viên"}!`,
        ),
        setTimeout(() => Qe(null), 3500),
        window.open(`https://zalo.me/${Ze}`, "_blank"));
    };
  (Nt = Q == null ? void 0 : Q.email) == null || Nt.toLowerCase();
  const isNhungPhan =
      (Q == null ? void 0 : Q.email) != null &&
      Q.email.trim().toLowerCase() === "nhungphan.mkt@gmail.com",
    E =
      (Q == null ? void 0 : Q.email) === "ieltsduongvu@gmail.com" ||
      (Q == null ? void 0 : Q.email) === "ieltsduongvu5@gmail.com" ||
      ((Mt = Q == null ? void 0 : Q.name) == null
        ? void 0
        : Mt.includes("Dương Vũ")),
    oe = (Q == null ? void 0 : Q.role) === "admin" || E,
    [re, nt] = y.useState(null),
    [ke, Pe] = y.useState(!1),
    [st, Le] = y.useState(!1),
    [Dt, Zt] = y.useState(!1),
    Ot = !isNhungPhan && (!Q || Q.role === "admin" || Q.role === "assistant" || E),
    qt = n.filter((B) => {
      const fe =
          B.name.toLowerCase().includes(W.toLowerCase()) ||
          B.code.toLowerCase().includes(W.toLowerCase()) ||
          B.phone.includes(W) ||
          B.parentName.toLowerCase().includes(W.toLowerCase()),
        xe = Ee === "all" || B.classId === Ee,
        Ze = X === "all" || B.status === X;
      return fe && xe && Ze;
    }),
    Bs = n.filter((B) => {
      if (!Ye.trim()) return !0;
      const fe = Ye.toLowerCase();
      return (
        B.name.toLowerCase().includes(fe) ||
        B.code.toLowerCase().includes(fe) ||
        B.phone.includes(fe) ||
        B.className.toLowerCase().includes(fe)
      );
    }),
    gs = t.filter((B) => {
      const fe = z === "all" || B.branch === z,
        xe =
          J === "all" ||
          (B.schedule && B.schedule.toLowerCase().includes(J.toLowerCase())),
        Ze =
          ne.trim() === "" ||
          B.name.toLowerCase().includes(ne.toLowerCase()) ||
          B.code.toLowerCase().includes(ne.toLowerCase()) ||
          B.teacherName.toLowerCase().includes(ne.toLowerCase());
      return fe && xe && Ze;
    });
  y.useEffect(() => {
    if (isNhungPhan && j !== "classes") {
      k("classes");
    }
  }, [isNhungPhan, j]);
  if (Y) {
    const B = t.find((fe) => fe.id === Y.id) || Y;
    return e.jsx(CP, {
      classGroup: B,
      allStudents: n,
      teachers: s,
      courses: a,
      attendanceRecords: l,
      onSaveAttendance: d,
      onAddTeacher: u,
      onAddExamScore: m,
      onUpdateClass: C,
      onDeleteClass: (fe) => {
        ue && (ue(fe), P(null));
      },
      onBack: () => P(null),
      onOpenSheetGradebook: (fe: string) => {
        P(null);
        F(fe);
        k("sheet_gradebook");
      },
      onEnrollStudent: (fe, xe) => _ && _(fe, xe),
      onRemoveStudent: (fe, xe) => O && O(fe, xe),
      onRestoreStudent: (fe, xe) => G && G(fe, xe),
      onUpdateStudent: M,
      currentUser: Q,
    });
  }
  return e.jsxs("div", {
    className: "space-y-6",
    children: [
      e.jsxs("div", {
        className:
          "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        children: [
          e.jsxs("div", {
            className: "flex items-center gap-3",
            children: [
              e.jsx("div", {
                className:
                  "w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center",
                children: e.jsx(of, { className: "w-5 h-5" }),
              }),
              e.jsxs("div", {
                children: [
                  e.jsx("h2", {
                    className:
                      "text-xl font-extrabold text-slate-900 tracking-tight",
                    children: "Danh Sách Lớp Học & Học Viên",
                  }),
                  e.jsx("p", {
                    className: "text-xs text-slate-500",
                    children:
                      "Quản lý danh sách các lớp học IDV từ 64 đến 94 & tra cứu danh sách học viên trực tiếp",
                  }),
                ],
              }),
            ],
          }),
          e.jsxs("div", {
            className: "flex flex-wrap items-center gap-2",
            children: isNhungPhan
              ? [
                  e.jsx("div", {
                    className:
                      "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 rounded-xl shadow-2xs",
                    children: "📝 Quyền Trợ lý Nhung Phan: Chọn lớp học để vào Nhật ký & Chấm điểm buổi học",
                  }),
                ]
              : [
                  w &&
                    e.jsxs("button", {
                      onClick: w,
                      className:
                        "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-xs",
                      children: [
                        e.jsx(Kr, { className: "w-3.5 h-3.5 text-emerald-600" }),
                        e.jsx("span", { children: "Nhập Sheet / Excel" }),
                      ],
                    }),
                  b &&
                    e.jsxs("button", {
                      onClick: b,
                      className:
                        "inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors",
                      children: [
                        e.jsx($s, { className: "w-3.5 h-3.5" }),
                        e.jsx("span", { children: "Tạo Lớp Mới" }),
                      ],
                    }),
                  e.jsxs("button", {
                    onClick: g,
                    className:
                      "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-600/20 transition-colors",
                    children: [
                      e.jsx($s, { className: "w-4 h-4" }),
                      e.jsx("span", { children: "Thêm học viên mới" }),
                    ],
                  }),
                ],
          }),
        ],
      }),
      e.jsxs("div", {
        className:
          "flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2",
        children: [
          e.jsxs("button", {
            onClick: () => k("classes"),
            className: `px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${j === "classes" ? "bg-purple-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`,
            children: [
              e.jsx(of, { className: "w-3.5 h-3.5" }),
              e.jsxs("span", {
                children: [isNhungPhan ? "Chọn lớp vào Nhật ký & Chấm điểm (" : "Danh sách lớp học (", t.length, ")"],
              }),
            ],
          }),

          !isNhungPhan &&
            e.jsxs("button", {
              onClick: () => k("sheet_gradebook"),
              className: `px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${j === "sheet_gradebook" ? "bg-emerald-700 text-white shadow-xs" : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"}`,
              children: [
                e.jsx(Kr, { className: "w-3.5 h-3.5 text-emerald-600" }),
                e.jsx("span", { children: "Sổ lớp Sheet" }),
              ],
            }),

          !isNhungPhan &&
            e.jsxs("button", {
              onClick: () => k("vocab_tests"),
              className: `px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${j === "vocab_tests" ? "bg-purple-700 text-white shadow-xs" : "text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"}`,
              children: [
                e.jsx(jn, { className: "w-3.5 h-3.5 text-amber-600" }),
                e.jsx("span", { children: "Bài test" }),
              ],
            }),
          !isNhungPhan &&
            e.jsxs("button", {
              onClick: () => St(!0),
              className:
                "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white shadow-xs hover:shadow-md",
              children: [
                e.jsx(Ji, { className: "w-3.5 h-3.5 text-amber-300" }),
                e.jsx("span", { children: "Lịch Nhắc Nhở & Bế Giảng" }),
                rt > 0
                  ? e.jsxs("span", {
                      className:
                        "px-1.5 py-0.2 text-[10px] font-black bg-amber-400 text-amber-950 rounded-full animate-pulse",
                      children: [rt, " cần TA"],
                    })
                  : bt > 0
                    ? e.jsxs("span", {
                        className:
                          "px-1.5 py-0.2 text-[10px] font-black bg-indigo-300 text-indigo-950 rounded-full",
                        children: [bt, " đợt thi"],
                      })
                    : e.jsx("span", {
                        className:
                          "px-1.5 py-0.2 text-[10px] font-semibold bg-white/20 text-purple-100 rounded-full",
                        children: "Chuẩn 4 Khóa",
                      }),
              ],
            }),
          !isNhungPhan &&
            Ot &&
            e.jsxs("button", {
              onClick: () => k("students"),
              className: `px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${j === "students" ? "bg-purple-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`,
              children: [
                e.jsx(wa, { className: "w-3.5 h-3.5" }),
                e.jsxs("span", {
                  children: [
                    "Danh sách học viên toàn hệ thống (",
                    n.length,
                    ")",
                  ],
                }),
              ],
            }),
        ],
      }),
      j === "classes"
        ? e.jsxs("div", {
            className: Ot
              ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              : "w-full space-y-4",
            children: [
              e.jsxs("div", {
                className: Ot ? "lg:col-span-8 space-y-4" : "w-full space-y-4",
                children: [
                  e.jsxs("div", {
                    className:
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs",
                    children: [
                      e.jsxs("div", {
                        className: "flex flex-wrap items-center gap-3",
                        children: [
                          e.jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [
                              e.jsx(Wi, {
                                className: "w-4 h-4 text-purple-600",
                              }),
                              e.jsx("span", {
                                className: "text-xs font-bold text-slate-700",
                                children: "Cơ sở:",
                              }),
                              e.jsxs("select", {
                                value: z,
                                onChange: (B) => ve(B.target.value),
                                className:
                                  "text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none",
                                children: [
                                  e.jsx("option", {
                                    value: "all",
                                    children:
                                      "Tất cả cơ sở (Tô Hiệu & Kiến An)",
                                  }),
                                  e.jsx("option", {
                                    value: "Cơ sở 1 - Tô Hiệu (Hải Phòng)",
                                    children: "Cơ sở 1 - Tô Hiệu",
                                  }),
                                  e.jsx("option", {
                                    value: "Cơ sở 2 - Kiến An (Hải Phòng)",
                                    children: "Cơ sở 2 - Kiến An",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs("div", {
                            className: "flex items-center gap-1.5",
                            children: [
                              e.jsx(na, {
                                className: "w-3.5 h-3.5 text-purple-600",
                              }),
                              e.jsx("span", {
                                className: "text-xs font-bold text-slate-700",
                                children: "Lịch học:",
                              }),
                              e.jsxs("select", {
                                value: J,
                                onChange: (B) => be(B.target.value),
                                className:
                                  "text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none",
                                children: [
                                  e.jsx("option", {
                                    value: "all",
                                    children: "Tất cả lịch (Tuần 2 buổi)",
                                  }),
                                  e.jsx("option", {
                                    value: "Thứ 2 + Thứ 5",
                                    children: "Thứ 2 + Thứ 5",
                                  }),
                                  e.jsx("option", {
                                    value: "Thứ 3 + Thứ 6",
                                    children: "Thứ 3 + Thứ 6",
                                  }),
                                  e.jsx("option", {
                                    value: "Thứ 4 + Thứ 7",
                                    children: "Thứ 4 + Thứ 7",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          e.jsxs("div", {
                            className: "relative w-48 sm:w-56",
                            children: [
                              e.jsx(qn, {
                                className:
                                  "w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400",
                              }),
                              e.jsx("input", {
                                type: "text",
                                placeholder: "Tìm số lớp: 64, 73, 76, 94...",
                                value: ne,
                                onChange: (B) => we(B.target.value),
                                className:
                                  "w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                              }),
                            ],
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "flex items-center gap-2 shrink-0",
                        children: [
                          oe &&
                            t.length > 0 &&
                            me &&
                            e.jsxs("button", {
                              onClick: () => Le(!0),
                              className:
                                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition-colors cursor-pointer",
                              title: "Xóa sạch toàn bộ lớp học trên hệ thống",
                              children: [
                                e.jsx(wn, { className: "w-3.5 h-3.5" }),
                                e.jsxs("span", {
                                  children: ["Xóa tất cả (", t.length, ")"],
                                }),
                              ],
                            }),
                          b &&
                            e.jsxs("button", {
                              onClick: b,
                              className:
                                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer",
                              children: [
                                e.jsx($s, { className: "w-3.5 h-3.5" }),
                                e.jsx("span", { children: "+ Tạo lớp" }),
                              ],
                            }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className:
                      "bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none shadow-xs",
                    children: [
                      e.jsx("span", {
                        className:
                          "font-bold text-slate-500 shrink-0 text-[11px]",
                        children: "Chọn nhanh:",
                      }),
                      e.jsxs("button", {
                        onClick: () => we(""),
                        className: `px-2 py-0.5 rounded-md font-bold text-[11px] shrink-0 transition-colors ${ne === "" ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`,
                        children: ["Tất cả (", t.length, ")"],
                      }),
                      [
                        "64",
                        "67",
                        "70",
                        "71",
                        "73",
                        "74",
                        "76",
                        "77",
                        "78",
                        "79",
                        "81",
                        "82",
                        "83",
                        "84",
                        "85",
                        "90",
                        "94",
                      ].map((B) =>
                        e.jsxs(
                          "button",
                          {
                            onClick: () => we(B),
                            className: `px-2 py-0.5 rounded-md font-semibold text-[11px] shrink-0 transition-colors ${ne === B ? "bg-purple-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`,
                            children: ["Lớp ", B],
                          },
                          B,
                        ),
                      ),
                    ],
                  }),
                  e.jsxs("div", {
                    className:
                      "bg-white px-4 py-2 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto text-xs scrollbar-none shadow-xs",
                    children: [
                      e.jsxs("div", {
                        className: "flex items-center gap-1.5 shrink-0",
                        children: [
                          e.jsx("span", {
                            className: "font-bold text-slate-500 text-[11px]",
                            children: "Lịch học 2 buổi/tuần:",
                          }),
                          e.jsxs("button", {
                            onClick: () => be("all"),
                            className: `px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${J === "all" ? "bg-purple-700 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`,
                            children: ["Tất cả (", t.length, ")"],
                          }),
                          e.jsxs("button", {
                            onClick: () => be("Thứ 2 + Thứ 5"),
                            className: `px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${J === "Thứ 2 + Thứ 5" ? "bg-purple-700 text-white shadow-xs" : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200"}`,
                            children: [
                              "Thứ 2 + Thứ 5 (",
                              t.filter((B) => {
                                var fe;
                                return (fe = B.schedule) == null
                                  ? void 0
                                  : fe.includes("Thứ 2 + Thứ 5");
                              }).length,
                              ")",
                            ],
                          }),
                          e.jsxs("button", {
                            onClick: () => be("Thứ 3 + Thứ 6"),
                            className: `px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${J === "Thứ 3 + Thứ 6" ? "bg-indigo-700 text-white shadow-xs" : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200"}`,
                            children: [
                              "Thứ 3 + Thứ 6 (",
                              t.filter((B) => {
                                var fe;
                                return (fe = B.schedule) == null
                                  ? void 0
                                  : fe.includes("Thứ 3 + Thứ 6");
                              }).length,
                              ")",
                            ],
                          }),
                          e.jsxs("button", {
                            onClick: () => be("Thứ 4 + Thứ 7"),
                            className: `px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${J === "Thứ 4 + Thứ 7" ? "bg-teal-700 text-white shadow-xs" : "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200"}`,
                            children: [
                              "Thứ 4 + Thứ 7 (",
                              t.filter((B) => {
                                var fe;
                                return (fe = B.schedule) == null
                                  ? void 0
                                  : fe.includes("Thứ 4 + Thứ 7");
                              }).length,
                              ")",
                            ],
                          }),
                        ],
                      }),
                      e.jsx("span", {
                        className:
                          "text-[10px] text-slate-400 font-medium hidden sm:inline shrink-0",
                        children:
                          "Ca 1: 18h-19h45 • Ca 2: 19h45-21h30 (Không có 2-4-6 hay 3-5-7)",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: `grid grid-cols-1 md:grid-cols-2 ${Ot ? "" : "xl:grid-cols-3"} gap-4`,
                    children: [
                      gs.map((B) => {
                        const fe = Math.round(
                            (B.completedSessions / (B.totalSessions || 48)) *
                              100,
                          ),
                          xe = n.filter((ct) => ct.classId === B.id).length,
                          Ze = hf(B);
                        return e.jsxs(
                          "div",
                          {
                            onClick: () => P(B),
                            className:
                              "bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group",
                            children: [
                              e.jsxs("div", {
                                children: [
                                  e.jsxs("div", {
                                    className:
                                      "flex items-center justify-between gap-2 mb-2",
                                    children: [
                                      e.jsxs("div", {
                                        className:
                                          "flex items-center gap-1.5 flex-wrap",
                                        children: [
                                          e.jsx("span", {
                                            className:
                                              "text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md group-hover:bg-purple-100 transition-colors",
                                            children: B.code,
                                          }),
                                          e.jsxs("span", {
                                            className:
                                              "text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200",
                                            children: [
                                              Ze.courseLevel,
                                              " (",
                                              Ze.totalSessions,
                                              "b)",
                                            ],
                                          }),
                                          e.jsx("span", {
                                            className: `text-[11px] font-semibold px-2 py-0.5 rounded-full ${B.status === "Đang diễn ra" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`,
                                            children: B.status,
                                          }),
                                          Ze.taAlertStatus === "needed" &&
                                            e.jsxs("span", {
                                              className:
                                                "text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 animate-pulse shadow-xs",
                                              children: [
                                                e.jsx(gi, {
                                                  className: "w-3 h-3",
                                                }),
                                                e.jsx("span", {
                                                  children: "Nhắc TA (B.29)",
                                                }),
                                              ],
                                            }),
                                          Ze.examStatus === "in_exam" &&
                                            e.jsxs("span", {
                                              className:
                                                "text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1 shadow-xs",
                                              children: [
                                                e.jsx(Ji, {
                                                  className: "w-3 h-3",
                                                }),
                                                e.jsx("span", {
                                                  children: Ze.examRuleBadge,
                                                }),
                                              ],
                                            }),
                                        ],
                                      }),
                                      e.jsxs("div", {
                                        className:
                                          "flex items-center gap-1.5 shrink-0",
                                        children: [
                                          C &&
                                            !isNhungPhan && e.jsxs("button", {
                                              type: "button",
                                              title:
                                                "Sửa tên lớp và khóa đang học",
                                              onClick: (ct) => {
                                                (ct.stopPropagation(), je(B));
                                              },
                                              className:
                                                "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-700 border border-purple-200 hover:border-purple-700 rounded-lg transition-all shadow-2xs z-10 cursor-pointer",
                                              children: [
                                                e.jsx(Hi, {
                                                  className: "w-3 h-3",
                                                }),
                                                e.jsx("span", {
                                                  children: "Sửa",
                                                }),
                                              ],
                                            }),
                                          oe &&
                                            ue &&
                                            !isNhungPhan && e.jsxs("button", {
                                              type: "button",
                                              title: `Xóa lớp ${B.name} (Quyền Quản lý)`,
                                              onClick: (ct) => {
                                                (ct.stopPropagation(), nt(B));
                                              },
                                              className:
                                                "inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-2xs z-10 cursor-pointer",
                                              children: [
                                                e.jsx(wn, {
                                                  className: "w-3 h-3",
                                                }),
                                                e.jsx("span", {
                                                  children: "Xóa",
                                                }),
                                              ],
                                            }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx("h3", {
                                    className:
                                      "text-base font-bold text-slate-900 leading-snug group-hover:text-purple-900 transition-colors",
                                    children: B.name,
                                  }),
                                  e.jsxs("div", {
                                    className: "flex items-center gap-1 mt-0.5",
                                    children: [
                                      e.jsx(Ta, {
                                        className:
                                          "w-3 h-3 text-purple-600 shrink-0",
                                      }),
                                      e.jsx("p", {
                                        className:
                                          "text-xs text-purple-800 font-semibold",
                                        children: B.courseName,
                                      }),
                                    ],
                                  }),
                                  B.branch &&
                                    e.jsxs("div", {
                                      className:
                                        "mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60",
                                      children: [
                                        e.jsx(Wi, { className: "w-3 h-3" }),
                                        e.jsx("span", { children: B.branch }),
                                      ],
                                    }),
                                  e.jsxs("div", {
                                    className:
                                      "mt-4 space-y-2 text-xs text-slate-600",
                                    children: [
                                      e.jsxs("div", {
                                        className: "flex items-start gap-2",
                                        children: [
                                          e.jsx("span", {
                                            className:
                                              "font-semibold text-slate-400 w-20 shrink-0 pt-0.5",
                                            children: "Giáo viên:",
                                          }),
                                          e.jsx("div", {
                                            className:
                                              "flex flex-wrap items-center gap-1 font-bold text-slate-800",
                                            children: (B.teacherNames &&
                                            B.teacherNames.length > 0
                                              ? B.teacherNames
                                              : B.teacherName
                                                  .split(/[,;&+]/)
                                                  .map((ct) => ct.trim())
                                                  .filter((ct) => ct.length > 0)
                                            ).map((ct, Vt) =>
                                              e.jsxs(
                                                "span",
                                                {
                                                  className:
                                                    "inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200/80 rounded-md text-[11px] font-bold",
                                                  children: [
                                                    e.jsx(ja, {
                                                      className:
                                                        "w-3 h-3 text-indigo-600",
                                                    }),
                                                    e.jsx("span", {
                                                      children: ct,
                                                    }),
                                                  ],
                                                },
                                                Vt,
                                              ),
                                            ),
                                          }),
                                        ],
                                      }),
                                      B.assistantTeacherName &&
                                        e.jsxs("div", {
                                          className: "flex items-center gap-2",
                                          children: [
                                            e.jsx("span", {
                                              className:
                                                "font-semibold text-slate-400 w-20",
                                              children: "Trợ giảng:",
                                            }),
                                            e.jsx("span", {
                                              className: "text-slate-700",
                                              children: B.assistantTeacherName,
                                            }),
                                          ],
                                        }),
                                      e.jsxs("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                          e.jsx("span", {
                                            className:
                                              "font-semibold text-slate-400 w-20",
                                            children: "Lịch học:",
                                          }),
                                          e.jsx("span", {
                                            className:
                                              "text-slate-800 font-medium",
                                            children: B.schedule,
                                          }),
                                        ],
                                      }),
                                      e.jsxs("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                          e.jsx("span", {
                                            className:
                                              "font-semibold text-slate-400 w-20",
                                            children: "Phòng học:",
                                          }),
                                          e.jsx("span", {
                                            className: "text-slate-800",
                                            children: B.room,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              e.jsxs("div", {
                                className:
                                  "mt-4 pt-3 border-t border-slate-100",
                                children: [
                                  e.jsxs("div", {
                                    className:
                                      "bg-purple-50/50 rounded-2xl p-2.5 mb-3 border border-purple-200/60 space-y-1.5",
                                    children: [
                                      e.jsxs("div", {
                                        className:
                                          "flex items-center justify-between text-[11px]",
                                        children: [
                                          e.jsxs("span", {
                                            className: "text-slate-600",
                                            children: [
                                              "Khai giảng: ",
                                              e.jsx("strong", {
                                                className:
                                                  "text-slate-800 font-semibold",
                                                children: Ze.formattedStartDate,
                                              }),
                                            ],
                                          }),
                                          e.jsxs("span", {
                                            className:
                                              "text-purple-900 font-bold",
                                            children: [
                                              "Bế giảng: ",
                                              Ze.formattedEndDate,
                                              " (Buổi ",
                                              Ze.totalSessions,
                                              ")",
                                            ],
                                          }),
                                        ],
                                      }),
                                      e.jsxs("div", {
                                        className:
                                          "flex items-center justify-between text-[10px] pt-1 border-t border-purple-100 flex-wrap gap-1",
                                        children: [
                                          e.jsxs("span", {
                                            className:
                                              "font-bold text-indigo-700 flex items-center gap-1",
                                            children: [
                                              e.jsx(Ji, {
                                                className:
                                                  "w-3 h-3 text-indigo-600",
                                              }),
                                              e.jsxs("span", {
                                                children: [
                                                  "Kiểm tra: Buổi ",
                                                  Ze.examSessions.join(" & "),
                                                ],
                                              }),
                                            ],
                                          }),
                                          e.jsx("span", {
                                            className:
                                              "text-purple-700 font-semibold",
                                            children:
                                              Ze.levelConfig
                                                .breakAfterCourseSessions > 0
                                                ? `Nghỉ 1 buổi lên ${Ze.levelConfig.nextCourseName}`
                                                : "Tốt nghiệp lộ trình",
                                          }),
                                        ],
                                      }),
                                      e.jsxs("div", {
                                        className:
                                          "flex items-center justify-between text-[10px] text-slate-500",
                                        children: [
                                          e.jsxs("span", {
                                            children: [
                                              Ze.totalDays,
                                              " ngày (~",
                                              Ze.totalWeeks,
                                              " tuần)",
                                            ],
                                          }),
                                          e.jsx("span", {
                                            className: `font-bold ${Ze.isFinished ? "text-slate-500" : "text-emerald-700"}`,
                                            children: Ze.remainingDaysText,
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsxs("div", {
                                    className:
                                      "flex items-center justify-between text-xs mb-1.5",
                                    children: [
                                      e.jsxs("span", {
                                        className: "text-slate-500",
                                        children: [
                                          "Sĩ số: ",
                                          e.jsx("strong", {
                                            className:
                                              "text-purple-900 font-bold",
                                            children: xe,
                                          }),
                                          "/",
                                          B.maxStudents,
                                          " học viên",
                                        ],
                                      }),
                                      e.jsxs("span", {
                                        className: "text-purple-700 font-bold",
                                        children: [
                                          B.completedSessions,
                                          "/",
                                          B.totalSessions || 48,
                                          " buổi (",
                                          fe,
                                          "%)",
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx("div", {
                                    className:
                                      "w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-3",
                                    children: e.jsx("div", {
                                      className:
                                        "bg-purple-600 h-1.5 rounded-full",
                                      style: { width: `${fe}%` },
                                    }),
                                  }),
                                  e.jsxs("div", {
                                    className:
                                      "flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs gap-1.5 flex-wrap",
                                    children: [
                                      e.jsxs("div", {
                                        className: "flex items-center gap-1.5",
                                        children: [
                                          !isNhungPhan && e.jsxs("button", {
                                            type: "button",
                                            onClick: (ct) => {
                                              (ct.stopPropagation(),
                                                F(B.id),
                                                k("sheet_gradebook"));
                                            },
                                            className:
                                              "text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors",
                                            title:
                                              "Mở Sổ lớp & Bảng điểm dạng Google Sheet của lớp này",
                                            children: [
                                              e.jsx(Kr, {
                                                className:
                                                  "w-3.5 h-3.5 text-emerald-600",
                                              }),
                                              e.jsx("span", {
                                                children: "Sổ lớp Sheet",
                                              }),
                                            ],
                                          }),
                                          e.jsxs("button", {
                                            type: "button",
                                            onClick: (ct) => {
                                              (ct.stopPropagation(), de(B));
                                            },
                                            className:
                                              "text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors",
                                            title:
                                              "Xem chi tiết 32-33 buổi học, mốc kiểm tra & mẫu tin Zalo",
                                            children: [
                                              e.jsx(Ji, {
                                                className:
                                                  "w-3.5 h-3.5 text-purple-600",
                                              }),
                                              e.jsx("span", {
                                                children: "Lịch thi",
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      e.jsxs("span", {
                                        className:
                                          "inline-flex items-center gap-1 font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform text-xs",
                                        children: [
                                          e.jsx("span", {
                                            children: isNhungPhan ? "Vào Nhật Ký & Chấm Điểm" : "Vào lớp",
                                          }),
                                          e.jsx(Su, {
                                            className: "w-3.5 h-3.5",
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          },
                          B.id,
                        );
                      }),
                      gs.length === 0 &&
                        e.jsxs("div", {
                          className:
                            "col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200/80",
                          children: [
                            e.jsx("div", {
                              className:
                                "w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-3",
                              children: e.jsx(of, { className: "w-7 h-7" }),
                            }),
                            e.jsx("h4", {
                              className:
                                "font-bold text-slate-800 text-sm mb-1",
                              children: "Chưa tìm thấy lớp học nào",
                            }),
                            e.jsx("p", {
                              className:
                                "text-xs text-slate-400 max-w-sm mx-auto mb-5",
                              children:
                                "Thử tìm với từ khóa khác hoặc bấm nút bên dưới để tạo lớp học mới.",
                            }),
                            b &&
                              e.jsxs("button", {
                                onClick: b,
                                className:
                                  "inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all",
                                children: [
                                  e.jsx($s, { className: "w-4 h-4" }),
                                  e.jsx("span", {
                                    children: "+ Mở Lớp Học Mới Ngay",
                                  }),
                                ],
                              }),
                          ],
                        }),
                    ],
                  }),
                ],
              }),
              Ot &&
                e.jsxs("div", {
                  className: "lg:col-span-4 space-y-6",
                  children: [
                    e.jsxs("div", {
                      className:
                        "bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4",
                      children: [
                        e.jsxs("div", {
                          className:
                            "flex items-center justify-between pb-3 border-b border-slate-100",
                          children: [
                            e.jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                e.jsx(wa, {
                                  className: "w-4 h-4 text-purple-700",
                                }),
                                e.jsx("h3", {
                                  className: "font-bold text-xs text-slate-900",
                                  children: "Danh Sách Học Viên Toàn Hệ Thống",
                                }),
                              ],
                            }),
                            e.jsxs("span", {
                              className:
                                "text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200",
                              children: [n.length, " học viên"],
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className: "relative",
                          children: [
                            e.jsx(qn, {
                              className:
                                "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
                            }),
                            e.jsx("input", {
                              type: "text",
                              placeholder: "Tìm học viên nhanh...",
                              value: Ye,
                              onChange: (B) => Te(B.target.value),
                              className:
                                "w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20",
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className:
                            "flex items-center justify-between text-[11px]",
                          children: [
                            e.jsx("span", {
                              className: "text-slate-400 font-medium",
                              children: "Học sinh mới nhất:",
                            }),
                            e.jsxs("button", {
                              onClick: g,
                              className:
                                "font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline",
                              children: [
                                e.jsx($s, { className: "w-3 h-3" }),
                                e.jsx("span", { children: "Thêm học viên" }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className:
                            "space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100",
                          children: [
                            Bs.map((B) =>
                              e.jsxs(
                                "div",
                                {
                                  className:
                                    "pt-2 pb-1 hover:bg-purple-50/50 rounded-xl px-2 transition-colors flex items-center justify-between gap-2 text-xs group",
                                  children: [
                                    e.jsxs("div", {
                                      className: "min-w-0",
                                      children: [
                                        e.jsxs("div", {
                                          className:
                                            "flex items-center gap-1.5",
                                          children: [
                                            e.jsx("div", {
                                              className:
                                                "w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px] shrink-0",
                                              children: B.name.charAt(0),
                                            }),
                                            e.jsx("span", {
                                              className:
                                                "font-bold text-slate-900 truncate block text-xs",
                                              children: B.name,
                                            }),
                                          ],
                                        }),
                                        e.jsxs("div", {
                                          className:
                                            "text-[10px] text-slate-400 mt-0.5 flex items-center gap-1",
                                          children: [
                                            e.jsx("span", {
                                              className:
                                                "font-mono text-purple-700 font-semibold",
                                              children: B.code,
                                            }),
                                            e.jsx("span", { children: "•" }),
                                            e.jsx("span", {
                                              className:
                                                "text-slate-600 font-medium truncate",
                                              children:
                                                B.className || "Chưa xếp lớp",
                                            }),
                                          ],
                                        }),
                                        e.jsxs("div", {
                                          className:
                                            "text-[10px] text-slate-400 flex items-center gap-2 mt-0.5",
                                          children: [
                                            e.jsxs("span", {
                                              children: ["SĐT: ", B.phone],
                                            }),
                                            B.tuitionStatus === "Đã đóng đủ"
                                              ? e.jsx("span", {
                                                  className:
                                                    "text-emerald-700 font-semibold",
                                                  children: "✓ Đủ phí",
                                                })
                                              : e.jsx("span", {
                                                  className:
                                                    "text-rose-600 font-semibold",
                                                  children: "Nợ phí",
                                                }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    e.jsxs("div", {
                                      className:
                                        "flex items-center gap-1 shrink-0",
                                      children: [
                                        e.jsxs("button", {
                                          type: "button",
                                          onClick: () => L(B, "parent"),
                                          className:
                                            "px-1.5 py-1 text-[10px] font-bold text-white bg-[#0068FF] hover:bg-[#0052cc] rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer",
                                          title: `Mở Zalo Phụ Huynh: ${B.parentPhone || B.phone} (kèm mẫu nhắc học phí)`,
                                          children: [
                                            e.jsx("span", {
                                              className:
                                                "w-3 h-3 rounded bg-white text-[#0068FF] font-black text-[7px] flex items-center justify-center",
                                              children: "Z",
                                            }),
                                            e.jsx("span", { children: "PH" }),
                                          ],
                                        }),
                                        e.jsxs("button", {
                                          type: "button",
                                          onClick: () => L(B, "student"),
                                          className:
                                            "px-1.5 py-1 text-[10px] font-bold text-cyan-800 bg-cyan-100 hover:bg-cyan-200 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                                          title: `Mở Zalo Học Viên: ${B.phone}`,
                                          children: [
                                            e.jsx("span", {
                                              className:
                                                "w-3 h-3 rounded bg-cyan-800 text-white font-black text-[7px] flex items-center justify-center",
                                              children: "Z",
                                            }),
                                            e.jsx("span", { children: "HV" }),
                                          ],
                                        }),
                                        B.classId &&
                                          e.jsx("button", {
                                            onClick: () => {
                                              const fe = t.find(
                                                (xe) =>
                                                  xe.id === B.classId ||
                                                  xe.name === B.className,
                                              );
                                              fe && P(fe);
                                            },
                                            className:
                                              "px-2 py-1 text-[10px] font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-700 group-hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer",
                                            title: "Vào lớp của học viên này",
                                            children: "Lớp",
                                          }),
                                        oe &&
                                          e.jsx("button", {
                                            type: "button",
                                            onClick: () => dt(B),
                                            className:
                                              "p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0",
                                            title:
                                              "Xóa học viên khỏi hệ thống (Chỉ Quản lý)",
                                            children: e.jsx(wn, {
                                              className:
                                                "w-3.5 h-3.5 text-rose-500",
                                            }),
                                          }),
                                      ],
                                    }),
                                  ],
                                },
                                B.id,
                              ),
                            ),
                            Bs.length === 0 &&
                              e.jsx("div", {
                                className:
                                  "py-8 text-center text-slate-400 text-xs",
                                children: "Không tìm thấy học viên phù hợp.",
                              }),
                          ],
                        }),
                        e.jsx("div", {
                          className: "pt-3 border-t border-slate-100",
                          children: e.jsxs("button", {
                            onClick: () => k("students"),
                            className:
                              "w-full py-2 text-center text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex items-center justify-center gap-1",
                            children: [
                              e.jsxs("span", {
                                children: [
                                  "Xem bảng chi tiết tất cả học viên (",
                                  n.length,
                                  ")",
                                ],
                              }),
                              e.jsx(Su, { className: "w-3.5 h-3.5" }),
                            ],
                          }),
                        }),
                      ],
                    }),
                    e.jsxs("div", {
                      className:
                        "bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4 border-rose-100 bg-rose-50/10",
                      children: [
                        e.jsxs("div", {
                          className:
                            "flex items-center justify-between pb-3 border-b border-slate-100",
                          children: [
                            e.jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                e.jsx(VI, {
                                  className:
                                    "w-4 h-4 text-rose-600 animate-pulse",
                                }),
                                e.jsx("h3", {
                                  className: "font-bold text-xs text-slate-900",
                                  children: "Học Viên Đã Bị Loại Khỏi Lớp",
                                }),
                              ],
                            }),
                            e.jsxs("span", {
                              className:
                                "text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200",
                              children: [
                                n.filter(
                                  (B) =>
                                    B.status === "Đã nghỉ học" ||
                                    B.droppedClassId,
                                ).length,
                                " học viên",
                              ],
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className: "relative",
                          children: [
                            e.jsx(qn, {
                              className:
                                "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
                            }),
                            e.jsx("input", {
                              type: "text",
                              placeholder: "Tìm học viên đã nghỉ...",
                              value: Et,
                              onChange: (B) => Wt(B.target.value),
                              className:
                                "w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20",
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className:
                            "space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100",
                          children: [
                            n
                              .filter(
                                (B) =>
                                  B.status === "Đã nghỉ học" ||
                                  B.droppedClassId,
                              )
                              .filter((B) => {
                                if (!Et.trim()) return !0;
                                const fe = Et.toLowerCase();
                                return (
                                  B.name.toLowerCase().includes(fe) ||
                                  B.code.toLowerCase().includes(fe)
                                );
                              })
                              .map((B) =>
                                e.jsxs(
                                  "div",
                                  {
                                    className:
                                      "pt-2 pb-1 hover:bg-rose-50/40 rounded-xl px-2 transition-colors flex items-center justify-between gap-2 text-xs group",
                                    children: [
                                      e.jsxs("div", {
                                        className: "min-w-0",
                                        children: [
                                          e.jsxs("div", {
                                            className:
                                              "flex items-center gap-1.5",
                                            children: [
                                              e.jsx("div", {
                                                className:
                                                  "w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0",
                                                children: B.name.charAt(0),
                                              }),
                                              e.jsx("span", {
                                                className:
                                                  "font-bold text-slate-900 line-through truncate block text-xs",
                                                children: B.name,
                                              }),
                                            ],
                                          }),
                                          e.jsxs("div", {
                                            className:
                                              "text-[10px] text-slate-400 mt-0.5 flex flex-col gap-0.5",
                                            children: [
                                              e.jsxs("div", {
                                                className:
                                                  "flex items-center gap-1",
                                                children: [
                                                  e.jsx("span", {
                                                    className:
                                                      "font-mono text-rose-700 font-semibold",
                                                    children: B.code,
                                                  }),
                                                  e.jsx("span", {
                                                    children: "•",
                                                  }),
                                                  e.jsxs("span", {
                                                    className:
                                                      "text-rose-800 font-medium truncate",
                                                    title: B.droppedClassName,
                                                    children: [
                                                      "Lớp cũ: ",
                                                      B.droppedClassName ||
                                                        "Không rõ lớp",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              B.droppedReason &&
                                                e.jsxs("span", {
                                                  className:
                                                    "text-[10px] text-slate-500 italic",
                                                  children: [
                                                    "Lý do: ",
                                                    B.droppedReason,
                                                  ],
                                                }),
                                              B.droppedDate &&
                                                e.jsxs("span", {
                                                  className:
                                                    "text-[9px] text-slate-400",
                                                  children: [
                                                    "Ngày nghỉ: ",
                                                    B.droppedDate,
                                                  ],
                                                }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      B.droppedClassId &&
                                        G &&
                                        e.jsx("button", {
                                          onClick: () => {
                                            G(B.droppedClassId, B.id);
                                          },
                                          className:
                                            "px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-700 hover:text-white rounded-lg transition-colors shrink-0 border border-rose-200",
                                          title:
                                            "Khôi phục học viên về lại lớp này",
                                          children: "Khôi phục",
                                        }),
                                    ],
                                  },
                                  B.id,
                                ),
                              ),
                            n.filter(
                              (B) =>
                                B.status === "Đã nghỉ học" || B.droppedClassId,
                            ).length === 0 &&
                              e.jsx("div", {
                                className:
                                  "py-8 text-center text-slate-400 text-xs",
                                children:
                                  "Chưa có học viên nào bị loại khỏi lớp.",
                              }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
            ],
          })
        : j === "sheet_gradebook"
          ? e.jsx("div", {
              className: "space-y-4",
              children: e.jsx(SG, {
                classes: t,
                students: n,
                attendanceRecords: l,
                transactions: o,
                initialClassId: R || (t.length > 0 ? t[0].id : undefined),
                onOpenQuickTuition: le,
                onBackToClasses: () => k("classes"),
              }),
            })
          : j === "vocab_tests"
            ? e.jsx("div", {
                className: "space-y-4",
                children: e.jsx(EB, {
                  fallbackTitle: "Không thể tải Bài test từ vựng",
                  children: e.jsx(HB, {
                    classes: t,
                    students: n,
                    onAddExamScore: m,
                    onSaveAttendance: d,
                    showToast: (B) => Qe(B),
                    currentUser: Q,
                  }),
                }),
              })
            : Ot
              ? e.jsxs("div", {
                  className:
                    "bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden",
                  children: [
                    e.jsxs("div", {
                      className:
                        "p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3",
                      children: [
                        e.jsxs("div", {
                          className: "relative w-full md:w-80",
                          children: [
                            e.jsx(qn, {
                              className:
                                "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
                            }),
                            e.jsx("input", {
                              type: "text",
                              placeholder: "Tìm tên, mã HV, SĐT, phụ huynh...",
                              value: W,
                              onChange: (B) => K(B.target.value),
                              className:
                                "w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                            }),
                          ],
                        }),
                        e.jsxs("div", {
                          className:
                            "flex flex-wrap items-center gap-2 w-full md:w-auto justify-end",
                          children: [
                            e.jsxs("select", {
                              value: Ee,
                              onChange: (B) => Re(B.target.value),
                              className:
                                "text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none",
                              children: [
                                e.jsx("option", {
                                  value: "all",
                                  children: "Tất cả lớp học",
                                }),
                                t.map((B) =>
                                  e.jsx(
                                    "option",
                                    { value: B.id, children: B.name },
                                    B.id,
                                  ),
                                ),
                              ],
                            }),
                            e.jsxs("select", {
                              value: X,
                              onChange: (B) => he(B.target.value),
                              className:
                                "text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none",
                              children: [
                                e.jsx("option", {
                                  value: "all",
                                  children: "Tất cả trạng thái",
                                }),
                                e.jsx("option", {
                                  value: "Đang học",
                                  children: "Đang học",
                                }),
                                e.jsx("option", {
                                  value: "Bảo lưu",
                                  children: "Bảo lưu",
                                }),
                                e.jsx("option", {
                                  value: "Đã tốt nghiệp",
                                  children: "Đã tốt nghiệp",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    e.jsx("div", {
                      className: "overflow-x-auto",
                      children: e.jsxs("table", {
                        className: "w-full text-left text-xs",
                        children: [
                          e.jsx("thead", {
                            className:
                              "bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80",
                            children: e.jsxs("tr", {
                              children: [
                                e.jsx("th", {
                                  className: "py-3 px-4",
                                  children: "Học viên",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4",
                                  children: "Khóa học / Lớp",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4",
                                  children: "Phụ huynh & Học viên (Zalo)",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4",
                                  children: "Học phí & Hạn nộp",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4 min-w-[160px]",
                                  children: "💳 Ngày Nộp HP Riêng",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4 min-w-[180px]",
                                  children:
                                    "📅 Ngày Học Riêng (Bắt đầu - Kết thúc)",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4 text-center",
                                  children: "Đòi Phí Qua Zalo",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4",
                                  children: "Tình trạng",
                                }),
                                e.jsx("th", {
                                  className: "py-3 px-4 text-center",
                                  children: "Xóa (Quản lý)",
                                }),
                              ],
                            }),
                          }),
                          e.jsxs("tbody", {
                            className: "divide-y divide-slate-100",
                            children: [
                              qt.map((B) => {
                                const fe =
                                    B.tuitionStatus !== "Đã đóng đủ" &&
                                    (B.balanceOwed || 0) > 0,
                                  xe =
                                    fe &&
                                    B.tuitionDeadlineDate &&
                                    new Date(B.tuitionDeadlineDate).setHours(
                                      0,
                                      0,
                                      0,
                                      0,
                                    ) < new Date().setHours(0, 0, 0, 0),
                                  Ze = We(B);
                                return e.jsxs(
                                  "tr",
                                  {
                                    className:
                                      "hover:bg-slate-50/70 transition-colors",
                                    children: [
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsxs("div", {
                                          className:
                                            "flex items-center gap-2.5",
                                          children: [
                                            e.jsx("div", {
                                              className:
                                                "w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs",
                                              children: B.name.charAt(0),
                                            }),
                                            e.jsxs("div", {
                                              children: [
                                                e.jsx("div", {
                                                  className:
                                                    "font-bold text-slate-900",
                                                  children: B.name,
                                                }),
                                                e.jsxs("div", {
                                                  className:
                                                    "text-[11px] text-slate-400 font-mono flex items-center gap-1.5",
                                                  children: [
                                                    e.jsx("span", {
                                                      children: B.code,
                                                    }),
                                                    e.jsx("span", {
                                                      children: "•",
                                                    }),
                                                    e.jsx("span", {
                                                      children: B.gender,
                                                    }),
                                                    e.jsx("span", {
                                                      children: "•",
                                                    }),
                                                    e.jsx("span", {
                                                      children: tn(B.dob),
                                                    }),
                                                  ],
                                                }),
                                                Ze.isK4 &&
                                                  e.jsxs("div", {
                                                    className:
                                                      "mt-1 flex items-center gap-1.5 flex-wrap",
                                                    children: [
                                                      e.jsxs("span", {
                                                        className:
                                                          "inline-flex items-center text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded",
                                                        title: `Chu kỳ ${Ze.currentCycle}`,
                                                        children: [
                                                          "🎯 K4 CK ",
                                                          Ze.currentCycle,
                                                        ],
                                                      }),
                                                      e.jsxs("span", {
                                                        className:
                                                          "text-[9px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-100 font-bold",
                                                        children: [
                                                          "Đã học: ",
                                                          Ze.attendedCount,
                                                          "b (Buổi ",
                                                          Ze.sessionsThisCycle,
                                                          "/32)",
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsxs("button", {
                                          onClick: () => {
                                            const ct = t.find(
                                              (Vt) =>
                                                Vt.id === B.classId ||
                                                Vt.name === B.className,
                                            );
                                            ct && P(ct);
                                          },
                                          className:
                                            "text-left group/cls block",
                                          title: "Bấm để vào xem lớp học này",
                                          children: [
                                            e.jsx("div", {
                                              className:
                                                "font-semibold text-slate-800 group-hover/cls:text-purple-700 transition-colors underline-offset-2 hover:underline",
                                              children: B.className,
                                            }),
                                            e.jsx("div", {
                                              className:
                                                "text-[11px] text-purple-600 font-medium",
                                              children: B.courseName,
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsxs("div", {
                                          className: "space-y-1",
                                          children: [
                                            e.jsxs("div", {
                                              className:
                                                "flex items-center gap-1.5",
                                              children: [
                                                e.jsx("span", {
                                                  className:
                                                    "text-[11px] font-bold text-slate-600",
                                                  children: "PH:",
                                                }),
                                                e.jsx("span", {
                                                  className:
                                                    "text-slate-900 font-semibold",
                                                  children:
                                                    B.parentName ||
                                                    "Chưa cập nhật",
                                                }),
                                                e.jsxs("span", {
                                                  className:
                                                    "text-slate-500 text-[11px]",
                                                  children: [
                                                    "(",
                                                    B.parentPhone || B.phone,
                                                    ")",
                                                  ],
                                                }),
                                                e.jsxs("button", {
                                                  type: "button",
                                                  onClick: () => L(B, "parent"),
                                                  className:
                                                    "px-1.5 py-0.5 text-[10px] font-black text-white bg-[#0068FF] hover:bg-[#0052cc] rounded shadow-2xs inline-flex items-center gap-0.5 cursor-pointer ml-1",
                                                  title: `Mở Zalo Phụ huynh: ${B.parentPhone || B.phone}`,
                                                  children: [
                                                    e.jsx("span", {
                                                      className: "text-[8px]",
                                                      children: "Z",
                                                    }),
                                                    e.jsx("span", {
                                                      children: "PH",
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            e.jsxs("div", {
                                              className:
                                                "flex items-center gap-1.5 text-[11px]",
                                              children: [
                                                e.jsx("span", {
                                                  className: "text-slate-500",
                                                  children: "HV:",
                                                }),
                                                e.jsx("span", {
                                                  className: "text-slate-700",
                                                  children: B.phone,
                                                }),
                                                e.jsxs("button", {
                                                  type: "button",
                                                  onClick: () =>
                                                    L(B, "student"),
                                                  className:
                                                    "px-1.5 py-0.5 text-[10px] font-black text-cyan-800 bg-cyan-100 hover:bg-cyan-200 rounded inline-flex items-center gap-0.5 cursor-pointer ml-1",
                                                  title: `Mở Zalo Học viên: ${B.phone}`,
                                                  children: [
                                                    e.jsx("span", {
                                                      className: "text-[8px]",
                                                      children: "Z",
                                                    }),
                                                    e.jsx("span", {
                                                      children: "HV",
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsxs("div", {
                                          className: "space-y-1",
                                          children: [
                                            B.tuitionStatus === "Đã đóng đủ"
                                              ? e.jsxs("span", {
                                                  className:
                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200",
                                                  children: [
                                                    e.jsx(Hs, {
                                                      className: "w-3 h-3",
                                                    }),
                                                    e.jsx("span", {
                                                      children: "Đã đóng đủ",
                                                    }),
                                                  ],
                                                })
                                              : e.jsxs("div", {
                                                  className: "space-y-0.5",
                                                  children: [
                                                    e.jsx("span", {
                                                      className:
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200",
                                                      children: e.jsxs("span", {
                                                        children: [
                                                          "Nợ: ",
                                                          new Intl.NumberFormat(
                                                            "vi-VN",
                                                          ).format(
                                                            B.balanceOwed,
                                                          ),
                                                          "đ",
                                                        ],
                                                      }),
                                                    }),
                                                    xe &&
                                                      e.jsxs("div", {
                                                        className:
                                                          "text-[10px] text-rose-600 font-bold flex items-center gap-1",
                                                        children: [
                                                          e.jsx(fi, {
                                                            className:
                                                              "w-3 h-3 text-rose-600 shrink-0",
                                                          }),
                                                          e.jsx("span", {
                                                            children:
                                                              "Quá hạn nộp!",
                                                          }),
                                                        ],
                                                      }),
                                                  ],
                                                }),
                                            B.tuitionPaidDate &&
                                              e.jsxs("div", {
                                                className:
                                                  "text-[10px] font-bold text-emerald-800 flex items-center gap-1 mt-1 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200",
                                                children: [
                                                  e.jsx(Es, {
                                                    className:
                                                      "w-3 h-3 text-emerald-600 shrink-0",
                                                  }),
                                                  e.jsxs("span", {
                                                    children: [
                                                      "Đã nộp: ",
                                                      tn(B.tuitionPaidDate),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            B.tuitionDeadlineDate &&
                                              e.jsxs("div", {
                                                className:
                                                  "text-[10px] text-slate-500 flex items-center gap-1",
                                                children: [
                                                  e.jsx(Gc, {
                                                    className:
                                                      "w-3 h-3 text-slate-400 shrink-0",
                                                  }),
                                                  e.jsxs("span", {
                                                    children: [
                                                      "Hạn: ",
                                                      tn(B.tuitionDeadlineDate),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                          ],
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsxs("div", {
                                          className:
                                            "space-y-1 bg-emerald-50/50 p-2 rounded-xl border border-emerald-200/70",
                                          children: [
                                            B.tuitionPaidDate
                                              ? e.jsxs("div", {
                                                  className:
                                                    "text-[11px] font-bold text-emerald-800 flex items-center gap-1",
                                                  children: [
                                                    e.jsx(Es, {
                                                      className:
                                                        "w-3 h-3 text-emerald-600",
                                                    }),
                                                    e.jsx("span", {
                                                      children: tn(
                                                        B.tuitionPaidDate,
                                                      ),
                                                    }),
                                                  ],
                                                })
                                              : e.jsx("span", {
                                                  className:
                                                    "text-[10px] text-slate-400 italic block",
                                                  children: "Chưa nộp",
                                                }),
                                            e.jsx("input", {
                                              type: "date",
                                              value: B.tuitionPaidDate || "",
                                              onChange: (ct) => {
                                                M &&
                                                  M({
                                                    ...B,
                                                    tuitionPaidDate:
                                                      ct.target.value,
                                                    tuitionStatus: ct.target
                                                      .value
                                                      ? "Đã đóng đủ"
                                                      : B.tuitionStatus,
                                                  });
                                              },
                                              className:
                                                "w-full text-[11px] p-1 bg-white border border-emerald-200 rounded focus:outline-none",
                                              title:
                                                "Chỉnh sửa ngày nộp học phí riêng",
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsxs("div", {
                                          className:
                                            "space-y-1.5 bg-blue-50/50 p-2 rounded-xl border border-blue-200/70",
                                          children: [
                                            e.jsxs("div", {
                                              className:
                                                "flex items-center justify-between gap-1 text-[10px]",
                                              children: [
                                                e.jsx("span", {
                                                  className:
                                                    "text-blue-900 font-bold",
                                                  children: "Bắt đầu:",
                                                }),
                                                e.jsx("input", {
                                                  type: "date",
                                                  value:
                                                    B.startDate ||
                                                    B.joinDate ||
                                                    "",
                                                  onChange: (ct) => {
                                                    M &&
                                                      M({
                                                        ...B,
                                                        startDate:
                                                          ct.target.value,
                                                        joinDate:
                                                          ct.target.value,
                                                      });
                                                  },
                                                  className:
                                                    "text-[10px] p-0.5 bg-white border border-blue-200 rounded focus:outline-none",
                                                }),
                                              ],
                                            }),
                                            e.jsxs("div", {
                                              className:
                                                "flex items-center justify-between gap-1 text-[10px]",
                                              children: [
                                                e.jsx("span", {
                                                  className:
                                                    "text-blue-900 font-bold",
                                                  children: "Kết thúc:",
                                                }),
                                                e.jsx("input", {
                                                  type: "date",
                                                  value: B.endDate || "",
                                                  onChange: (ct) => {
                                                    M &&
                                                      M({
                                                        ...B,
                                                        endDate:
                                                          ct.target.value,
                                                      });
                                                  },
                                                  className:
                                                    "text-[10px] p-0.5 bg-white border border-blue-200 rounded focus:outline-none",
                                                }),
                                              ],
                                            }),
                                            Ze.isK4 &&
                                              e.jsxs("div", {
                                                className:
                                                  "mt-1 p-1 bg-white border border-blue-200 rounded-lg text-[9px] space-y-0.5",
                                                children: [
                                                  e.jsx("div", {
                                                    className:
                                                      "text-blue-900 font-bold",
                                                    children: "🤖 Tự tính:",
                                                  }),
                                                  e.jsx("div", {
                                                    className:
                                                      "font-mono text-blue-800 text-center bg-blue-50/50 py-0.5 rounded border border-blue-100 font-bold",
                                                    children: tn(
                                                      Ze.personalEndDate,
                                                    ),
                                                  }),
                                                  B.endDate !==
                                                    Ze.personalEndDate &&
                                                    e.jsx("button", {
                                                      type: "button",
                                                      onClick: () => {
                                                        M &&
                                                          M({
                                                            ...B,
                                                            endDate:
                                                              Ze.personalEndDate,
                                                          });
                                                      },
                                                      className:
                                                        "w-full text-center text-[8.5px] font-black text-white bg-blue-600 hover:bg-blue-700 py-0.5 rounded transition-all active:scale-95 cursor-pointer mt-1",
                                                      children:
                                                        "💾 Lưu ngày tự tính",
                                                    }),
                                                ],
                                              }),
                                          ],
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4 text-center",
                                        children: fe
                                          ? e.jsxs("div", {
                                              className:
                                                "inline-flex flex-col gap-1 items-center",
                                              children: [
                                                e.jsxs("button", {
                                                  type: "button",
                                                  onClick: () => L(B, "parent"),
                                                  className:
                                                    "px-2.5 py-1.5 text-[11px] font-bold text-white bg-[#0068FF] hover:bg-[#0054cc] rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer",
                                                  title:
                                                    "Tự động mở Zalo Phụ huynh kèm tin nhắn đòi học phí nhẹ nhàng",
                                                  children: [
                                                    e.jsx("span", {
                                                      className:
                                                        "w-3.5 h-3.5 rounded bg-white text-[#0068FF] font-black text-[8px] flex items-center justify-center",
                                                      children: "Z",
                                                    }),
                                                    e.jsx("span", {
                                                      children:
                                                        "Nhắc Phụ Huynh",
                                                    }),
                                                    e.jsx(Va, {
                                                      className: "w-3 h-3",
                                                    }),
                                                  ],
                                                }),
                                                e.jsx("span", {
                                                  className:
                                                    "text-[9px] text-slate-400 italic",
                                                  children:
                                                    "Mở app Zalo & sao chép mẫu",
                                                }),
                                              ],
                                            })
                                          : e.jsx("span", {
                                              className:
                                                "text-[11px] text-emerald-600 font-medium",
                                              children: "Hoàn tất",
                                            }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4",
                                        children: e.jsx("span", {
                                          className: `px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${B.status === "Đang học" ? "bg-purple-50 text-purple-700 border border-purple-200" : B.status === "Bảo lưu" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`,
                                          children: B.status,
                                        }),
                                      }),
                                      e.jsx("td", {
                                        className: "py-3.5 px-4 text-center",
                                        children: oe
                                          ? e.jsxs("button", {
                                              type: "button",
                                              onClick: () => dt(B),
                                              className:
                                                "p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition-all inline-flex items-center gap-1 font-bold text-[11px] cursor-pointer shadow-2xs",
                                              title:
                                                "Xóa học viên khỏi toàn bộ hệ thống (Chỉ Quản lý)",
                                              children: [
                                                e.jsx(wn, {
                                                  className: "w-3.5 h-3.5",
                                                }),
                                                e.jsx("span", {
                                                  children: "Xóa",
                                                }),
                                              ],
                                            })
                                          : e.jsx("span", {
                                              className:
                                                "text-[10px] text-slate-300 font-medium italic",
                                              children: "Chỉ Quản lý",
                                            }),
                                      }),
                                    ],
                                  },
                                  B.id,
                                );
                              }),
                              qt.length === 0 &&
                                e.jsx("tr", {
                                  children: e.jsxs("td", {
                                    colSpan: 8,
                                    className:
                                      "py-12 text-center text-slate-400",
                                    children: [
                                      e.jsx("div", {
                                        className:
                                          "w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3",
                                        children: e.jsx(wa, {
                                          className: "w-6 h-6",
                                        }),
                                      }),
                                      e.jsx("p", {
                                        className:
                                          "font-semibold text-slate-700 mb-1",
                                        children: "Chưa có học viên nào",
                                      }),
                                      e.jsx("p", {
                                        className:
                                          "text-xs text-slate-400 max-w-sm mx-auto mb-4",
                                        children:
                                          'Dữ liệu học viên hiện tại đang trống. Hãy bấm "Thêm học viên mới" để ghi danh học viên đầu tiên vào hệ thống IDV.',
                                      }),
                                      e.jsxs("button", {
                                        onClick: g,
                                        className:
                                          "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all",
                                        children: [
                                          e.jsx($s, { className: "w-4 h-4" }),
                                          e.jsx("span", {
                                            children: "Thêm học viên mới ngay",
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                }),
                            ],
                          }),
                        ],
                      }),
                    }),
                  ],
                })
              : e.jsxs("div", {
                  className:
                    "bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs",
                  children: [
                    e.jsx("div", {
                      className:
                        "w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs",
                      children: e.jsx(qc, { className: "w-8 h-8" }),
                    }),
                    e.jsx("h3", {
                      className: "text-base font-bold text-slate-900",
                      children: "Quyền Truy Cập Hạn Chế",
                    }),
                    e.jsxs("p", {
                      className: "text-xs text-slate-600 leading-relaxed",
                      children: [
                        "Danh sách toàn bộ học viên trên toàn hệ thống chỉ hiển thị cho tài khoản ",
                        e.jsx("strong", { children: "Quản lý (Admin)" }),
                        " và ",
                        e.jsx("strong", { children: "Trợ lý" }),
                        ".",
                      ],
                    }),
                    e.jsxs("p", {
                      className: "text-xs text-slate-500 leading-relaxed",
                      children: [
                        "Thầy/cô Giáo viên vui lòng quay về danh sách lớp học và chọn nút ",
                        e.jsx("strong", { children: '"Vào lớp"' }),
                        " để quản lý học viên theo từng lớp học.",
                      ],
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: () => k("classes"),
                      className:
                        "px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95",
                      children: "Quay Về Danh Sách Lớp Học",
                    }),
                  ],
                }),
      A &&
        C &&
        e.jsx(X5, {
          isOpen: A !== null,
          onClose: () => je(null),
          classGroup: A,
          teachers: s,
          courses: a,
          students: n,
          attendanceRecords: l,
          onUpdateClass: (B, fe, xe) => {
            (C(B, fe, xe), je(null));
          },
        }),
      e.jsx(yP, {
        isOpen: Ue,
        onClose: () => St(!1),
        classes: t,
        onSelectClassDetail: (B) => {
          (St(!1), P(B));
        },
      }),
      Tt &&
        e.jsx(lT, {
          isOpen: Tt !== null,
          onClose: () => de(null),
          classGroup: Tt,
        }),
      Fe &&
        e.jsxs("div", {
          className:
            "fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-xs text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3",
          children: [
            e.jsx("div", {
              className:
                "w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0",
              children: e.jsx(Es, { className: "w-3.5 h-3.5" }),
            }),
            e.jsx("span", { children: Fe }),
          ],
        }),
      re &&
        e.jsx("div", {
          className:
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in",
          children: e.jsxs("div", {
            className:
              "bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in zoom-in-95",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [
                  e.jsx("div", {
                    className:
                      "w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0",
                    children: e.jsx(wn, { className: "w-6 h-6" }),
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("h3", {
                        className: "text-base font-bold text-slate-900",
                        children: "Xác nhận xóa lớp học",
                      }),
                      e.jsx("p", {
                        className: "text-xs text-rose-600 font-semibold",
                        children: "Quyền hạn: Quản lý trung tâm (Admin)",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("p", {
                className: "text-sm text-slate-600 mb-4 leading-relaxed",
                children: [
                  "Bạn có chắc chắn muốn xóa lớp ",
                  e.jsx("strong", {
                    className: "text-slate-900",
                    children: re.name,
                  }),
                  " không? Toàn bộ dữ liệu lớp học này sẽ bị xóa khỏi hệ thống và không thể hoàn tác.",
                ],
              }),
              e.jsxs("div", {
                className:
                  "bg-slate-50 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5 mb-5 border border-slate-200",
                children: [
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Mã lớp:",
                      }),
                      e.jsx("span", {
                        className: "font-semibold text-slate-800",
                        children: re.code,
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Khóa học:",
                      }),
                      e.jsx("span", {
                        className: "font-semibold text-purple-700",
                        children: re.courseName,
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Cơ sở:",
                      }),
                      e.jsx("span", {
                        className: "font-semibold text-slate-800",
                        children: re.branch,
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Giáo viên:",
                      }),
                      e.jsx("span", {
                        className: "font-semibold text-slate-800",
                        children: re.teacherName || "Chưa gán",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Số học viên hiện tại:",
                      }),
                      e.jsxs("span", {
                        className: "font-bold text-slate-900",
                        children: [re.currentStudents || 0, " học viên"],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "flex items-center justify-end gap-2.5",
                children: [
                  e.jsx("button", {
                    type: "button",
                    disabled: ke,
                    onClick: () => nt(null),
                    className:
                      "px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer",
                    children: "Hủy bỏ",
                  }),
                  e.jsxs("button", {
                    type: "button",
                    disabled: ke,
                    onClick: async () => {
                      if (!(!ue || !re)) {
                        Pe(!0);
                        try {
                          await ue(re.id);
                        } finally {
                          (Pe(!1), nt(null));
                        }
                      }
                    },
                    className:
                      "px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer",
                    children: [
                      e.jsx(wn, { className: "w-3.5 h-3.5" }),
                      e.jsx("span", {
                        children: ke ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      st &&
        e.jsx("div", {
          className:
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in",
          children: e.jsxs("div", {
            className:
              "bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [
                  e.jsx("div", {
                    className:
                      "w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0",
                    children: e.jsx(wn, { className: "w-6 h-6" }),
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsxs("h3", {
                        className: "text-base font-bold text-slate-900",
                        children: ["Xóa sạch toàn bộ ", t.length, " lớp học?"],
                      }),
                      e.jsx("p", {
                        className: "text-xs text-rose-600 font-semibold",
                        children: "Quyền hạn: Quản lý trung tâm (Admin)",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("p", {
                className: "text-sm text-slate-600 mb-4 leading-relaxed",
                children: [
                  "Thao tác này sẽ xóa ",
                  e.jsxs("strong", {
                    className: "text-slate-900",
                    children: ["toàn bộ ", t.length, " lớp học"],
                  }),
                  " khỏi cơ sở dữ liệu đám mây (Firestore), bộ nhớ máy chủ (VPS) và trình duyệt. Thao tác này không thể hoàn tác.",
                ],
              }),
              e.jsxs("div", {
                className:
                  "bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 mb-5 flex items-start gap-2",
                children: [
                  e.jsx(fi, {
                    className: "w-4 h-4 text-rose-600 shrink-0 mt-0.5",
                  }),
                  e.jsx("span", {
                    children:
                      "Sau khi xóa, danh sách lớp học sẽ hoàn toàn trống (0 lớp) trên toàn bộ tài khoản đăng nhập ở các máy khác.",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "flex items-center justify-end gap-2.5",
                children: [
                  e.jsx("button", {
                    type: "button",
                    disabled: Dt,
                    onClick: () => Le(!1),
                    className:
                      "px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer",
                    children: "Hủy bỏ",
                  }),
                  e.jsxs("button", {
                    type: "button",
                    disabled: Dt,
                    onClick: async () => {
                      if (me) {
                        Zt(!0);
                        try {
                          await me();
                        } finally {
                          (Zt(!1), Le(!1));
                        }
                      }
                    },
                    className:
                      "px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer",
                    children: [
                      e.jsx(wn, { className: "w-3.5 h-3.5" }),
                      e.jsx("span", {
                        children: Dt
                          ? "Đang xóa sạch..."
                          : `Xác nhận xóa hết ${t.length} lớp`,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ze &&
        e.jsx("div", {
          className:
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in",
          children: e.jsxs("div", {
            className:
              "bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-3 mb-4",
                children: [
                  e.jsx("div", {
                    className:
                      "w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0",
                    children: e.jsx(wn, { className: "w-6 h-6" }),
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("h3", {
                        className: "text-base font-bold text-slate-900",
                        children: "Xác nhận xóa học viên?",
                      }),
                      e.jsx("p", {
                        className: "text-xs text-rose-600 font-semibold",
                        children: "Quyền hạn: Quản lý trung tâm (Admin)",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("p", {
                className: "text-sm text-slate-600 mb-3 leading-relaxed",
                children: [
                  "Bạn có chắc chắn muốn xóa học viên ",
                  e.jsx("strong", {
                    className: "text-slate-900",
                    children: ze.name,
                  }),
                  " (",
                  e.jsx("span", {
                    className: "font-mono text-purple-700",
                    children: ze.code,
                  }),
                  ") khỏi toàn bộ hệ thống?",
                ],
              }),
              e.jsxs("div", {
                className:
                  "bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 mb-4",
                children: [
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Lớp hiện tại:",
                      }),
                      e.jsx("strong", {
                        className: "text-slate-800",
                        children: ze.className || "Chưa xếp lớp",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Số điện thoại:",
                      }),
                      e.jsx("strong", {
                        className: "text-slate-800",
                        children: ze.phone || "Chưa cập nhật",
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "flex justify-between",
                    children: [
                      e.jsx("span", {
                        className: "text-slate-500",
                        children: "Trạng thái học phí:",
                      }),
                      e.jsxs("span", {
                        className:
                          ze.tuitionStatus === "Đã đóng đủ"
                            ? "text-emerald-700 font-bold"
                            : "text-rose-600 font-bold",
                        children: [
                          ze.tuitionStatus,
                          " ",
                          ze.balanceOwed > 0
                            ? `(Nợ ${ce(ze.balanceOwed)})`
                            : "",
                        ],
                      }),
                    ],
                  }),
                  ze.tuitionPaidDate &&
                    e.jsxs("div", {
                      className: "flex justify-between mt-1 text-xs",
                      children: [
                        e.jsx("span", {
                          className: "text-slate-500",
                          children: "Ngày nộp học phí:",
                        }),
                        e.jsxs("span", {
                          className:
                            "text-emerald-700 font-bold flex items-center gap-1",
                          children: [
                            e.jsx(Es, {
                              className: "w-3.5 h-3.5 text-emerald-600",
                            }),
                            tn(ze.tuitionPaidDate),
                          ],
                        }),
                      ],
                    }),
                ],
              }),
              e.jsxs("div", {
                className:
                  "bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 mb-5 flex items-start gap-2",
                children: [
                  e.jsx(fi, {
                    className: "w-4 h-4 text-rose-600 shrink-0 mt-0.5",
                  }),
                  e.jsx("span", {
                    children:
                      "Học viên sẽ bị xóa vĩnh viễn khỏi danh sách toàn hệ thống và cơ sở dữ liệu. Thao tác này không thể hoàn tác.",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "flex items-center justify-end gap-2.5",
                children: [
                  e.jsx("button", {
                    type: "button",
                    disabled: Ct,
                    onClick: () => dt(null),
                    className:
                      "px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer",
                    children: "Hủy bỏ",
                  }),
                  e.jsxs("button", {
                    type: "button",
                    disabled: Ct,
                    onClick: async () => {
                      if (!(!V || !ze)) {
                        ye(!0);
                        try {
                          await V(ze.id);
                        } finally {
                          (ye(!1), dt(null));
                        }
                      }
                    },
                    className:
                      "px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer",
                    children: [
                      e.jsx(wn, { className: "w-3.5 h-3.5" }),
                      e.jsx("span", {
                        children: Ct
                          ? "Đang xóa học viên..."
                          : "Xác nhận xóa vĩnh viễn",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
    ],
  });
};


export { StudentsModule };
