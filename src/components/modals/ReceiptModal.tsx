import React from 'react';
import { X, Printer, CheckCircle2, GraduationCap } from 'lucide-react';
import { TuitionTransaction } from '../../types';
import { formatDateVN } from '../../utils/courseSchedule';

interface ReceiptModalProps {
  transaction: TuitionTransaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in-95 my-6 text-slate-800 border border-slate-200">
        
        {/* Receipt Header */}
        <div className="flex items-start justify-between border-b pb-4 border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-tight text-slate-900">
                TRUNG TÂM NGOẠI NGỮ QUỐC TẾ IDV
              </h4>
              <p className="text-[11px] text-slate-500">Cơ sở 1: Tô Hiệu • Cơ sở 2: Kiến An, Hải Phòng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">PHIẾU THU HỌC PHÍ</h3>
          <div className="text-xs font-mono font-bold text-purple-700 mt-1">
            Số: {transaction.receiptCode}
          </div>
          <span className="text-[11px] text-slate-400">Ngày lập phiếu: {formatDateVN(transaction.date)}</span>
        </div>

        {/* Details Table */}
        <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-500">Họ và tên học viên:</span>
            <strong className="text-slate-900">{transaction.studentName}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mã học viên:</span>
            <span className="font-mono font-bold text-purple-700">{transaction.studentCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Lớp học:</span>
            <span className="text-slate-800">{transaction.className}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Nội dung thu:</span>
            <span className="text-slate-800">{transaction.transactionType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Phương thức:</span>
            <span className="font-semibold text-slate-700">{transaction.paymentMethod}</span>
          </div>
          {transaction.notes && (
            <div className="flex justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Ghi chú:</span>
              <span className="text-slate-600 italic text-right max-w-[240px]">{transaction.notes}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
            <span className="font-bold text-slate-900">Tổng tiền thanh toán:</span>
            <span className="font-black text-emerald-700 text-base">{formatVND(transaction.amount)}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 text-center text-xs text-slate-600 pt-2 mb-6">
          <div>
            <span className="font-semibold block">Người nộp tiền</span>
            <span className="text-[10px] text-slate-400 block">(Ký & ghi rõ họ tên)</span>
            <div className="h-14"></div>
            <span className="font-medium text-slate-800">{transaction.studentName}</span>
          </div>
          <div>
            <span className="font-semibold block">Người lập phiếu</span>
            <span className="text-[10px] text-slate-400 block">(Ký & ghi rõ họ tên)</span>
            <div className="h-14"></div>
            <span className="font-medium text-purple-700 font-semibold">{transaction.collectorName}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              alert('Đã gửi lệnh in biên lai tới máy in trung tâm!');
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>In biên lai (A5/A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
