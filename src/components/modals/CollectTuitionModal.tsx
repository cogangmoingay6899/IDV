import React, { useState } from 'react';
import { X, Receipt, QrCode, Banknote, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import { Student, TuitionTransaction } from '../../types';

interface CollectTuitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onCollect: (transaction: TuitionTransaction) => void;
}

export const CollectTuitionModal: React.FC<CollectTuitionModalProps> = ({
  isOpen,
  onClose,
  students,
  onCollect,
}) => {
  if (!isOpen) return null;

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState(5000000);
  const [paymentMethod, setPaymentMethod] = useState<TuitionTransaction['paymentMethod']>('Chuyển khoản QR');
  const [transactionType, setTransactionType] = useState<TuitionTransaction['transactionType']>('Thu học phí');
  const [collectorName, setCollectorName] = useState('Mai Tuyết Trinh');
  const [notes, setNotes] = useState('Thu học phí kỳ 3 khóa học tiếng Anh');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newTx: TuitionTransaction = {
      id: `tx-${Date.now()}`,
      receiptCode: `PT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentCode: selectedStudent.code,
      className: selectedStudent.className,
      amount: amount,
      paymentMethod: paymentMethod,
      transactionType: transactionType,
      date: new Date().toISOString().split('T')[0],
      collectorName: collectorName,
      status: 'Thành công',
      notes: notes,
    };

    onCollect(newTx);
    onClose();
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Lập phiếu thu học phí</h3>
              <p className="text-xs text-slate-500">Ghi nhận biên lai thanh toán vào quỹ trung tâm</p>
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
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Chọn học viên nộp tiền *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const st = students.find((s) => s.id === e.target.value);
                if (st && st.balanceOwed > 0) {
                  setAmount(st.balanceOwed);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code}) - {st.className} {st.balanceOwed > 0 ? `(Nợ: ${formatVND(st.balanceOwed)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lớp học hiện tại:</span>
                <strong className="text-slate-800">{selectedStudent.className}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số tiền còn nợ:</span>
                <strong className={selectedStudent.balanceOwed > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatVND(selectedStudent.balanceOwed)}
                </strong>
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Số tiền thực thu (VNĐ) *</label>
            <input
              type="number"
              required
              step="50000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-black text-base text-emerald-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hình thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              >
                <option value="Chuyển khoản QR">Chuyển khoản VietQR</option>
                <option value="Tiền mặt">Tiền mặt tại quầy</option>
                <option value="Thẻ tín dụng (POS)">Quẹt thẻ POS</option>
                <option value="Trả góp 0%">Trả góp 0%</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nội dung thu</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              >
                <option value="Thu học phí">Thu học phí</option>
                <option value="Thu giáo trình/đồng phục">Thu giáo trình/đồng phục</option>
                <option value="Phí kiểm tra">Phí kiểm tra đầu vào</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nhân viên thu tiền</label>
            <input
              type="text"
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ghi chú phiếu thu</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú đợt thanh toán, ưu đãi giảm trừ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
            />
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
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-xs"
            >
              Xác nhận thu tiền
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
