/**
 * Payment & Banking Configuration for IELTS DƯƠNG VŨ
 * 
 * Rules:
 * 1. Học phí: Gửi vào STK Công ty / Trung tâm (MB Bank - 0988889999 - IELTS DUONG VU)
 * 2. Tiền phạt & Nợ phạt: Chuyển khoản vào STK cá nhân trợ lý (Techcombank - 174293666666 - Đặng Kim Anh)
 */

export interface BankAccountInfo {
  bankName: string;
  bankCode: string; // TCB, MB, VCB...
  accountNumber: string;
  accountHolder: string;
  accountHolderRaw: string; // For VietQR
  role: string;
  notes: string;
}

// 1. TÀI KHOẢN CÔNG TY / TRUNG TÂM (THU HỌC PHÍ)
export const COMPANY_TUITION_BANK: BankAccountInfo = {
  bankName: 'MB Bank (Ngân hàng Quân Đội)',
  bankCode: 'MB',
  accountNumber: '0988889999',
  accountHolder: 'IELTS DUONG VU',
  accountHolderRaw: 'IELTS DUONG VU',
  role: 'Tài khoản Công ty / Trung tâm (Thu học phí)',
  notes: 'Dành riêng cho thanh toán học phí khóa học và các khoản thu chính thức của trung tâm.',
};

// 2. TÀI KHOẢN TRỢ LÝ (THU TIỀN PHẠT & NỢ PHẠT)
export const ASSISTANT_PENALTY_BANK: BankAccountInfo = {
  bankName: 'Techcombank (Ngân hàng Kỹ thương Việt Nam)',
  bankCode: 'TCB',
  accountNumber: '174293666666',
  accountHolder: 'Đặng Kim Anh',
  accountHolderRaw: 'DANG KIM ANH',
  role: 'Trợ lý lớp học (Thu tiền phạt & nợ)',
  notes: 'Dành riêng cho học viên / phụ huynh nộp phạt bài tập, đi muộn, nợ phạt các buổi học.',
};

export const DEFAULT_PENALTY_BANK_STR = '174293666666 - Techcombank (Đặng Kim Anh - Trợ lý)';
export const DEFAULT_TUITION_BANK_STR = '0988889999 - MB Bank (IELTS DUONG VU - Công ty)';

/**
 * Generate VietQR image URL for Assistant Penalty payment
 */
export function getPenaltyVietQrUrl(amount?: number, syntax?: string, template: 'compact2' | 'compact' | 'qr_only' = 'compact2'): string {
  const bank = ASSISTANT_PENALTY_BANK;
  let url = `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-${template}.png?accountName=${encodeURIComponent(bank.accountHolderRaw)}`;
  if (amount && amount > 0) {
    url += `&amount=${Math.round(amount)}`;
  }
  if (syntax) {
    url += `&addInfo=${encodeURIComponent(syntax)}`;
  }
  return url;
}

/**
 * Generate VietQR image URL for Company Tuition payment
 */
export function getTuitionVietQrUrl(amount?: number, syntax?: string, template: 'compact2' | 'compact' | 'qr_only' = 'compact2'): string {
  const bank = COMPANY_TUITION_BANK;
  let url = `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-${template}.png?accountName=${encodeURIComponent(bank.accountHolderRaw)}`;
  if (amount && amount > 0) {
    url += `&amount=${Math.round(amount)}`;
  }
  if (syntax) {
    url += `&addInfo=${encodeURIComponent(syntax)}`;
  }
  return url;
}

/**
 * Get formatted payment separation reminder text
 */
export function getPaymentSeparationNoticeText(isShort = false): string {
  if (isShort) {
    return '⚠️ Học phí gửi STK Cty (MB Bank: 0988889999), nộp phạt chuyển khoản STK cá nhân trợ lý Đặng Kim Anh (Techcombank: 174293666666).';
  }
  return `⚠️ LƯU Ý PHÂN BIỆT TÀI KHOẢN THANH TOÁN:
• HỌC PHÍ KHÓA HỌC: Chuyển khoản vào STK CÔNG TY (MB Bank - 0988889999 - IELTS DUONG VU).
• TIỀN NỘP PHẠT & NỢ: Chuyển khoản vào STK CÁ NHÂN TRỢ LÝ (Techcombank - 174293666666 - Đặng Kim Anh).
Xin Quý Phụ huynh / Học viên KHÔNG chuyển khoản tiền nộp phạt vào STK công ty.`;
}
