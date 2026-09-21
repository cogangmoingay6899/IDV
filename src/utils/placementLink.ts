/**
 * Utility helpers for Online Test Link Generation & Student Sharing
 * Enables sending students direct test links that automatically persist results to Firestore.
 */

const STORAGE_KEY = 'ielts_public_base_url';

export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }
  let origin = window.location.origin;
  // If in internal AI Studio dev environment, automatically point to the shared public domain
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin;
}

export function setPublicBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  if (!clean) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, clean);
  }
  // Dispatch a custom event so all open components can re-render immediately
  window.dispatchEvent(new CustomEvent('ielts-base-url-changed', { detail: clean }));
}

export function getPlacementTestUrl(customBase?: string): string {
  const base = customBase || getPublicBaseUrl();
  return `${base}/?test=online`;
}

export function getPlacementTestHashUrl(customBase?: string): string {
  const base = customBase || getPublicBaseUrl();
  return `${base}/#test-online`;
}

export function getVocabTestShareUrl(testId: string, customBase?: string): string {
  const base = customBase || getPublicBaseUrl();
  return `${base}/?vocabTestId=${encodeURIComponent(testId)}`;
}

export function getZaloShareMessage(testUrl: string): string {
  return `📝 [IELTS DƯƠNG VŨ] KÍNH GỬI QUÝ PHỤ HUYNH & HỌC SINH:
📌 TÊN BÀI TEST: Bài Kiểm Tra Năng Lực Đầu Vào IELTS Dương Vũ
🔗 LINK LÀM BÀI CHÍNH THỨC: ${testUrl}

📌 Hướng dẫn & Quy định làm bài:
1. Thí sinh điền chính xác Họ tên, Ngày sinh, Số điện thoại và Lịch học mong muốn.
2. Bài kiểm tra bao gồm 4 kỹ năng: Nghe (Listening), Đọc (Reading), Từ vựng & Ngữ pháp (Vocab), Viết & Phát âm (Writing & Speaking) trong 55 phút.
3. Không sử dụng từ điển, Google hay công cụ AI trong quá trình làm bài.
4. Ngay khi bấm "Nộp bài", toàn bộ kết quả bài làm sẽ được LƯU TỰ ĐỘNG VÀO HỆ THỐNG QUẢN LÝ của trung tâm IELTS Dương Vũ. Thầy cô phòng Đào tạo sẽ liên hệ xếp lớp phù hợp nhất cho em.

✨ Link chính thức xác thực từ Trung tâm IELTS Dương Vũ. Chúc các em làm bài thật tốt!`;
}

export function getVocabZaloShareMessage(testTitle: string, courseLevel: string, unitName: string, testUrl: string, timePerQ = 20): string {
  const displayTitle = testTitle.includes(courseLevel) ? testTitle : `${testTitle} (${courseLevel})`;
  return `📝 [IELTS DƯƠNG VŨ] KÍNH GỬI QUÝ PHỤ HUYNH & HỌC SINH:
📌 TÊN BÀI TEST TỪ VỰNG: ${displayTitle}
🔗 LINK LÀM BÀI CHÍNH THỨC: ${testUrl}

📌 Hướng dẫn & Quy định làm bài:
1. Thí sinh chuẩn bị kết nối mạng ổn định trước khi mở làm bài.
2. Bài test có đếm ngược thời gian (${timePerQ}s/câu).
3. Hệ thống tự động phát hiện và ghi nhận khi thí sinh thoát màn hình / chuyển tab.
4. Điểm số bài làm sẽ được LƯU TỰ ĐỘNG VÀO BẢNG XẾP HẠNG của lớp.

✨ Link chính thức xác thực từ Trung tâm IELTS Dương Vũ. Chúc các em làm bài thật tốt!`;
}

export function getReviewTestShareUrl(testId: string, customBase?: string): string {
  const base = customBase || getPublicBaseUrl();
  return `${base}/?reviewTestId=${encodeURIComponent(testId)}`;
}

export function getReviewZaloShareMessage(testTitle: string, courseLevel: string, unitName: string, testUrl: string, timePerQ = 20): string {
  const displayTitle = testTitle.includes(courseLevel) ? testTitle : `${testTitle} (${courseLevel})`;
  return `📝 [IELTS DƯƠNG VŨ] KÍNH GỬI HỌC SINH - BÀI ÔN TẬP KIẾN THỨC:
📌 TÊN BÀI TEST: ${displayTitle}
🔗 LINK LÀM BÀI CHÍNH THỨC: ${testUrl}

📌 Hướng dẫn & Quy định làm bài:
1. Thí sinh chuẩn bị kết nối mạng ổn định trước khi mở làm bài.
2. Bài test ôn tập có giới hạn thời gian (${timePerQ}s/câu).
3. Hệ thống chống gian lận tự động ghi nhận khi thoát tab / chuyển màn hình.
4. Điểm số bài kiểm tra sẽ được LƯU TỰ ĐỘNG VÀO HỆ THỐNG của trung tâm.

✨ Link chính thức từ Trung tâm IELTS Dương Vũ. Chúc các em ôn tập và làm bài thật tốt!`;
}

export function getReviewTestIdParam(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('reviewTestId');
}

export function getPlacementRawCopyWithTitle(testUrl: string): string {
  return `📝 [IELTS DƯƠNG VŨ] Bài Kiểm Tra Năng Lực Đầu Vào IELTS Dương Vũ\n🔗 Link làm bài chính thức: ${testUrl}`;
}

export function getQrCodeImageUrl(url: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(
    url
  )}`;
}
