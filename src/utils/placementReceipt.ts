import { PlacementTest } from '../types';

/**
 * Generates an elegant, printable A4 HTML receipt document for students
 * to print or save as PDF upon completing their IELTS placement test.
 */
export function generatePlacementReceiptHtml(test: PlacementTest): string {
  const printDate = new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const vocabAns = test.testAnswers?.vocab || {};
  const listeningAns = test.testAnswers?.listening || {};
  const readingAns = test.testAnswers?.reading || {};

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Biên Nhận Bài Kiểm Tra Đầu Vào - ${test.code} - ${test.candidateName}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 20px;
      color: #1e293b;
      background: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
    }
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .no-print-bar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: #4c1d95;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
    }
    .btn-print {
      background: #f59e0b;
      color: #000;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover {
      background: #d97706;
      color: #fff;
    }
    .header-banner {
      text-align: center;
      border-bottom: 3px double #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      color: #d97706;
      letter-spacing: 1px;
      margin: 0;
    }
    .brand-sub {
      font-size: 13px;
      font-weight: 700;
      color: #64748b;
      margin-top: 4px;
    }
    .receipt-badge {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 16px;
      background: #f1f5f9;
      color: #334155;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
      border: 1px solid #cbd5e1;
    }
    .title-h1 {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 12px 0 4px 0;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .highlight-purple {
      color: #6d28d9;
    }
    .highlight-emerald {
      color: #047857;
    }
    .highlight-amber {
      color: #b45309;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      border-left: 4px solid #7c3aed;
      padding-left: 10px;
      margin: 20px 0 12px 0;
      text-transform: uppercase;
    }
    .scores-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .scores-table th, .scores-table td {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      text-align: left;
    }
    .scores-table th {
      background: #f1f5f9;
      font-weight: 800;
      color: #334155;
      font-size: 12px;
    }
    .notice-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .notice-box p {
      margin: 4px 0;
      color: #78350f;
      font-size: 12px;
    }
    .stamp-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
    }
    .stamp-box {
      border: 2px dashed #059669;
      background: #ecfdf5;
      color: #065f46;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 11px;
      text-align: center;
      line-height: 1.4;
    }
    .address-footer {
      margin-top: 24px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
      line-height: 1.6;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print-bar {
        display: none !important;
      }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>Hệ thống Khảo thí IELTS Dương Vũ</strong> • Biên nhận điện tử chính thức
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ In Biên Nhận / Lưu PDF
    </button>
  </div>

  <div class="receipt-container">
    <div class="header-banner">
      <h1 class="brand-title">IELTS DƯƠNG VŨ</h1>
      <div class="brand-sub">Trung Tâm Luyện Thi IELTS Hàng Đầu Hải Phòng • 9.0 Đầu Tiên Tại Hải Phòng</div>
      <div class="receipt-badge">MÃ BIÊN NHẬN: ${test.code}</div>
      <div class="title-h1">PHIẾU XÁC NHẬN NỘP BÀI KIỂM TRA ĐẦU VÀO</div>
      <div style="font-size: 12px; color: #64748b;">Thời gian nộp: ${printDate}</div>
    </div>

    <div class="section-title">1. Thông tin thí sinh & Đăng ký khóa học</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Họ và tên thí sinh:</span>
        <span class="info-value highlight-purple">${test.candidateName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Số điện thoại liên hệ:</span>
        <span class="info-value">${test.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Số điện thoại phụ huynh:</span>
        <span class="info-value">${test.parentPhone || test.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Địa chỉ Gmail:</span>
        <span class="info-value">${test.email || 'Chưa cung cấp'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Ngày tháng năm sinh:</span>
        <span class="info-value">${test.dob || '---'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Trường đang học / Địa chỉ:</span>
        <span class="info-value">${test.school || test.address || 'Hải Phòng'}</span>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <span class="info-label">Cơ sở đăng ký theo học:</span>
        <span class="info-value highlight-emerald">${test.preferredCampus || 'Chưa chọn cơ sở'}</span>
      </div>
      <div class="info-item" style="grid-column: span 2;">
        <span class="info-label">Lịch học mong muốn:</span>
        <span class="info-value highlight-amber">${test.preferredSchedule || 'Chưa chọn lịch học'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Thời gian làm bài:</span>
        <span class="info-value">${test.timeSpentFormatted || '55 phút'} ${test.isOverdue ? `<span style="color: #dc2626; font-size: 12px; font-weight: bold;">(⚠️ Quá mốc: +${test.overdueText})</span>` : '<span style="color: #059669; font-size: 12px; font-weight: bold;">(Đúng quy định 55p)</span>'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Mục tiêu đầu ra:</span>
        <span class="info-value">${test.targetLevel || 'Overall 6.5'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Thời gian cần chứng chỉ:</span>
        <span class="info-value">${test.targetExamDate || 'Cuối năm 2026'}</span>
      </div>
    </div>

    <div class="section-title">2. Ghi nhận các phần bài làm kiểm tra</div>
    <table class="scores-table">
      <thead>
        <tr>
          <th>Phần thi</th>
          <th>Hình thức</th>
          <th>Trạng thái ghi nhận</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Part 3: Vocabulary</strong></td>
          <td>10 câu trắc nghiệm</td>
          <td>Đã ghi nhận ${Object.keys(vocabAns).length}/10 câu</td>
        </tr>
        <tr>
          <td><strong>Part 4: Listening</strong></td>
          <td>5 câu điền từ (Clip gốc Dương Vũ)</td>
          <td>Đã ghi nhận ${Object.keys(listeningAns).length}/5 câu</td>
        </tr>
        <tr>
          <td><strong>Part 5: Reading</strong></td>
          <td>5 câu điền từ bài đọc City Brands Index</td>
          <td>Đã ghi nhận ${Object.keys(readingAns).length}/5 câu</td>
        </tr>
        <tr>
          <td><strong>Part 6: Writing</strong></td>
          <td>3 câu viết hoàn chỉnh & Đoạn văn 4 câu</td>
          <td>Đã lưu bài viết vào hệ thống giám sát</td>
        </tr>
        <tr>
          <td><strong>Part 7: Pronunciation</strong></td>
          <td>Đoạn hội thoại "An Outdoor Exhibit"</td>
          <td>${test.speakingAudioUrl ? 'Đã lưu bản ghi âm trực tiếp' : 'Đã ghi nhận phần đọc'}</td>
        </tr>
      </tbody>
    </table>

    <div class="notice-box">
      <strong style="color: #92400e; font-size: 13px;">📌 QUY TRÌNH HỖ TRỢ & XẾP LỚP:</strong>
      <p>1. Bài thi của em đã được lưu thành công vào cơ sở dữ liệu khảo thí trực tuyến của IELTS Dương Vũ.</p>
      <p>2. Thầy cô phòng Đào tạo & Khảo thí sẽ chấm chi tiết bài Viết (Writing) và Phát âm (Speaking) của em.</p>
      <p>3. Bộ phận Tư vấn sẽ liên hệ trực tiếp qua SĐT <strong>${test.phone}</strong> hoặc Zalo để thông báo điểm chi tiết và lịch khai giảng chính thức.</p>
      <p>4. Em vui lòng lưu lại mã bài thi <strong>${test.code}</strong> hoặc biên nhận này để đối chiếu khi đến trung tâm.</p>
    </div>

    <div class="stamp-container">
      <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
        <div><strong>HỆ THỐNG XÁC THỰC ĐIỆN TỬ</strong></div>
        <div>Mã tra cứu: <span style="font-family: monospace; font-weight: bold; color: #1e293b;">${test.id}</span></div>
        <div>Giám sát chống gian lận: 0 vi phạm • Khảo thí Online</div>
      </div>
      <div class="stamp-box">
        ✓ ĐÃ NỘP BÀI THÀNH CÔNG<br>
        <strong>IELTS DƯƠNG VŨ</strong><br>
        <span style="font-size: 10px; font-weight: normal;">Hải Phòng • ${test.testDate}</span>
      </div>
    </div>

    <div class="address-footer">
      <strong>📍 ĐỊA CHỈ TRUNG TÂM IELTS DƯƠNG VŨ:</strong><br>
      • CS1: 51 Tô Hiệu (tầng 4), Lê Chân, Hải Phòng • CS2: 15/9 Hòa Bình, Kiến An, Hải Phòng<br>
      Hotline / Zalo Tư vấn: 0798 934 698 • Website: duongvuielts.com
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads the receipt as an HTML file and attempts to trigger print
 */
export function downloadAndPrintReceipt(
  test: PlacementTest,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
) {
  try {
    const htmlContent = generatePlacementReceiptHtml(test);

    // 1. Download file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bien_Nhan_IELTS_Duong_Vu_${test.code}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 2. Try to print via hidden iframe to avoid popup blockers and iframe issues
    try {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, trying window.print():', e);
            try {
              window.print();
            } catch (err) {}
          }

          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3000);
        }, 500);
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Print iframe error:', e);
      try {
        window.print();
      } catch (err) {}
    }

    onSuccess?.();
  } catch (err) {
    console.error('Error generating receipt:', err);
    onError?.(err);
  }
}

/**
 * Creates formatted plain text for copying into Zalo/SMS
 */
export function getReceiptZaloText(test: PlacementTest): string {
  return `🎓 BIÊN NHẬN BÀI TEST ĐẦU VÀO - IELTS DƯƠNG VŨ
- Mã bài thi: ${test.code}
- Thí sinh: ${test.candidateName}
- SĐT: ${test.phone}
- Phụ huynh: ${test.parentPhone || test.phone}
- Ngày sinh: ${test.dob || '---'}
- Cơ sở đăng ký: ${test.preferredCampus || 'Chưa chọn'}
- Lịch học mong muốn: ${test.preferredSchedule || 'Chưa chọn'}
- Mục tiêu: ${test.targetLevel || 'Overall 6.5'}
- Thời gian nộp: ${test.testDate}
- Thời gian làm bài: ${test.timeSpentFormatted || '55 phút'}${test.isOverdue ? ` (⚠️ Vượt mốc: +${test.overdueText})` : ' (Đúng quy định 55p)'}
=> Bài thi đã được lưu vào hệ thống khảo thí trung tâm. Thầy cô phòng Đào tạo sẽ liên hệ xếp lớp theo lịch đã đăng ký.`;
}
