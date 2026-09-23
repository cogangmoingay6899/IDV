import { PlacementTest } from '../types';
import {
  checkListeningAnswer,
  checkReadingAnswer,
  VOCAB_KEY,
} from './placementEvaluation';

// 57 individual columns matching every single student input and evaluation metric
export const PLACEMENT_SHEET_COLUMNS = [
  'STT',
  'Thời gian nộp bài',
  'Mã bài test',
  'Họ và tên học sinh',
  'Số điện thoại của em',
  'Số điện thoại phụ huynh',
  'Địa chỉ email của em',
  'Ngày tháng năm sinh',
  'Địa chỉ nhà em',
  'Chọn cơ sở đăng ký',
  'Chọn lịch học có thể học',
  'Trường em đang theo học',
  'Link Facebook',
  'Mục tiêu của em',
  'Khi nào cần chứng chỉ IELTS',
  'Đã từng học IELTS ở đâu chưa',
  'Nguồn biết đến trung tâm',
  'Từ vựng Q1 (went out)',
  'Từ vựng Q2 (spill)',
  'Từ vựng Q3 (especially)',
  'Từ vựng Q4 (feel like)',
  'Từ vựng Q5 (take it easy)',
  'Từ vựng Q6 (unlikely)',
  'Từ vựng Q7 (made)',
  'Từ vựng Q8 (get on very well)',
  'Từ vựng Q9 (put out)',
  'Từ vựng Q10 (resign)',
  'Từ vựng - Tổng số câu đúng (/10)',
  'Nghe Q1 (Emily ...)',
  'Nghe Q2 (Address Street)',
  'Nghe Q3 (Course fee £)',
  'Nghe Q4 (First lesson morning)',
  'Nghe Q5 (Bring a ...)',
  'Nghe - Số câu đúng (/5)',
  'Nghe - Số câu sai (/5)',
  'Đọc Q1 (cities are like ...)',
  'Đọc Q2 (Surveys take place every ...)',
  'Đọc Q3 (A maximum of ... cities)',
  'Đọc Q4 (decide where to ...)',
  'Đọc Q5 (helpful for local ...)',
  'Đọc - Số câu đúng (/5)',
  'Đọc - Số câu sai (/5)',
  'Viết Câu 1 (Use mobile phone...)',
  'Viết Câu 2 (There a number of benefit...)',
  'Viết Câu 3 (government need find solution...)',
  'Viết Câu - Đánh giá lỗi',
  'Viết Đoạn văn Part B (Trình bày lý do)',
  'Speaking - Thời lượng ghi âm (giây)',
  'Speaking - Link file ghi âm',
  'Điểm Overall',
  'Khóa học đề xuất',
  'Trạng thái kết quả',
  'Lớp đã xếp / Đã nhập học',
  'Nhận xét của giáo viên',
  'Số lần rời tab vi phạm',
  'Giám sát Camera',
  'Thời gian làm bài',
  'Trạng thái quá giờ',
  'Vượt mốc thời gian',
  'Nhật ký Anti-Cheat',
] as const;

/**
 * Extracts a flat array of values for a single PlacementTest row,
 * exactly aligned with PLACEMENT_SHEET_COLUMNS.
 */
export function extractTestRowValues(test: PlacementTest, index: number): (string | number)[] {
  const vocabAns = test.testAnswers?.vocab || {};
  let vocabCorrect = 0;
  Object.keys(VOCAB_KEY).forEach((q) => {
    if (vocabAns[q] && vocabAns[q].trim().toLowerCase() === VOCAB_KEY[q].toLowerCase()) {
      vocabCorrect++;
    }
  });

  const listenAns = test.testAnswers?.listening || {};
  let listenCorrect = 0;
  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((q) => {
    if (checkListeningAnswer(q, listenAns[q])) listenCorrect++;
  });
  const listenWrong = 5 - listenCorrect;

  const readAns = test.testAnswers?.reading || {};
  let readCorrect = 0;
  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((q) => {
    if (checkReadingAnswer(q, readAns[q])) readCorrect++;
  });
  const readWrong = 5 - readCorrect;

  const writeSentences = test.testAnswers?.writingSentences || {};

  return [
    index + 1,
    test.testDate || '',
    test.code || '',
    test.candidateName || '',
    test.phone || '',
    test.parentPhone || '',
    test.email || '',
    test.dob || '',
    test.address || '',
    test.preferredCampus || 'CS1: 51 Tô Hiệu',
    test.preferredSchedule || 'Thứ 4 & Thứ 7',
    test.school || '',
    test.facebookLink || '',
    test.targetLevel || '',
    test.targetExamDate || '',
    test.previousIeltsExperience || '',
    test.referralSource || '',
    vocabAns.q1 || '',
    vocabAns.q2 || '',
    vocabAns.q3 || '',
    vocabAns.q4 || '',
    vocabAns.q5 || '',
    vocabAns.q6 || '',
    vocabAns.q7 || '',
    vocabAns.q8 || '',
    vocabAns.q9 || '',
    vocabAns.q10 || '',
    vocabCorrect,
    listenAns.q1 || '',
    listenAns.q2 || '',
    listenAns.q3 || '',
    listenAns.q4 || '',
    listenAns.q5 || '',
    listenCorrect,
    listenWrong,
    readAns.q1 || '',
    readAns.q2 || '',
    readAns.q3 || '',
    readAns.q4 || '',
    readAns.q5 || '',
    readCorrect,
    readWrong,
    writeSentences.q1 || '',
    writeSentences.q2 || '',
    writeSentences.q3 || '',
    test.recommendedCourse === 'Khóa 2' ? 'Ít lỗi (Đạt chuẩn)' : 'Nhiều lỗi ngữ pháp',
    test.testAnswers?.writingParagraph || '',
    test.speakingAudioDuration || test.testAnswers?.speakingAudioDuration || 0,
    test.speakingAudioUrl || test.testAnswers?.speakingAudioUrl || '',
    test.overallScore || 0,
    test.recommendedCourse || '',
    test.status === 'Không đạt' ? 'Không đạt' : (test.status === 'Đã nhập học' ? 'Đã nhập học' : 'Đã đạt'),
    test.assignedClassName || (test.assignedClassId ? 'Lớp chờ xếp' : 'Chưa xếp lớp'),
    test.comment || '',
    test.tabSwitchCount || 0,
    test.cameraEnabled ? 'Có bật' : 'Không bật',
    test.timeSpentFormatted || '55 phút',
    test.isOverdue ? 'Quá giờ' : 'Đúng giờ',
    test.isOverdue ? `+${test.overdueText || ''}` : 'Không',
    (test.antiCheatLogs || []).join(' | '),
  ];
}

/**
 * Generates clean Tab-Separated Values (TSV) format for instant paste (Ctrl+V) into Google Sheets.
 */
export function generatePlacementSheetTSV(tests: PlacementTest[]): string {
  const headerLine = PLACEMENT_SHEET_COLUMNS.join('\t');
  const rowLines = tests.map((test, idx) => {
    const values = extractTestRowValues(test, idx);
    return values
      .map((val) => {
        const str = String(val ?? '');
        // Escape newlines and tabs so they don't break Google Sheet rows
        return str.replace(/\t/g, ' ').replace(/\r?\n/g, ' - ');
      })
      .join('\t');
  });

  return [headerLine, ...rowLines].join('\n');
}

/**
 * Generates CSV string with UTF-8 BOM encoding for direct download and open in Google Sheets / Excel.
 */
export function generatePlacementSheetCSV(tests: PlacementTest[]): string {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    return `"${s.replace(/"/g, '""')}"`;
  };

  const headerLine = PLACEMENT_SHEET_COLUMNS.map(escapeCsv).join(',');
  const rowLines = tests.map((test, idx) => {
    const values = extractTestRowValues(test, idx);
    return values.map(escapeCsv).join(',');
  });

  return '\uFEFF' + [headerLine, ...rowLines].join('\n');
}

/**
 * Sample Google Apps Script code to paste into Google Sheet:
 * Extensions > Apps Script > Paste > Deploy as Web App (Execute as Me, Who has access: Anyone)
 */
export const SAMPLE_GOOGLE_APPS_SCRIPT = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // Tự động tìm hoặc tạo sheet "Sheet New"
    var sheet = ss.getSheetByName("Sheet New") || 
                ss.getSheetByName("sheet new") || 
                ss.getSheetByName("Sheet new") || 
                ss.getSheetByName("New") || 
                ss.getActiveSheet();
                
    if (!sheet) {
      sheet = ss.insertSheet("Sheet New");
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    // Nếu sheet chưa có tiêu đề cột (dòng 1 trống), tự động ghi 57 cột tiêu đề
    if (sheet.getLastRow() === 0 && data.headers && Array.isArray(data.headers)) {
      sheet.appendRow(data.headers);
      var headerRange = sheet.getRange(1, 1, 1, data.headers.length);
      headerRange.setBackground("#059669").setFontColor("#FFFFFF").setFontWeight("bold");
    }
    
    // Thêm dòng kết quả làm bài của học sinh
    if (data.row && Array.isArray(data.row)) {
      sheet.appendRow(data.row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      sheetName: sheet.getName(),
      totalRows: sheet.getLastRow() 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "online", 
    message: "✅ Webhook IELTS Dương Vũ đã sẵn sàng nhận dữ liệu làm bài của học sinh!" 
  })).setMimeType(ContentService.MimeType.JSON);
}`;
