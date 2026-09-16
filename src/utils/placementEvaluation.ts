// Utilities for Grading & Placement Test Evaluation according to Center Rules

export const VOCAB_KEY: Record<string, string> = {
  q1: 'went out',
  q2: 'spill',
  q3: 'especially',
  q4: 'feel like',
  q5: 'take it easy',
  q6: 'unlikely',
  q7: 'made',
  q8: 'get on very well',
  q9: 'put out',
  q10: 'resign',
};

export const LISTENING_KEY_INFO: Record<string, { expected: string; label: string }> = {
  q1: { expected: 'Browne / Brown', label: "Student's name: Emily Browne" },
  q2: { expected: '28 Green / Green', label: "Address: 28 Green Street" },
  q3: { expected: '75', label: "Course fee: £75" },
  q4: { expected: 'Saturday', label: "First lesson: Saturday morning" },
  q5: { expected: 'notebook', label: "Bring a notebook to the first class" },
};

export const READING_KEY_INFO: Record<string, { expected: string; label: string }> = {
  q1: { expected: 'product / products', label: "Cities are like products which people can buy" },
  q2: { expected: 'year', label: "Surveys take place every year" },
  q3: { expected: '50', label: "A maximum of 50 cities are included" },
  q4: { expected: 'live', label: "Decide where to live or get a job" },
  q5: { expected: 'governments / government', label: "Helpful for local governments" },
};

export const WRITING_STANDARD_SENTENCES: Record<string, string> = {
  q1: 'Using mobile phones too much can do more harm than good.',
  q2: 'There are a number of benefits of using mobile phones.',
  q3: 'The government needs to find a solution to the problem.',
};

export const PRESET_COMMENTS = {
  COURSE_1: 'Bạn còn chưa chắc nền tảng về phát âm (sai một số từ, chưa có ngữ điệu) và ngữ pháp viết còn sai nên học từ lớp 1 bên em chị nhé.',
  FAILED: 'Kết quả kiểm tra cho thấy bạn còn hổng nhiều về cơ bản, nên bạn cần tìm một lớp cơ bản hơn thì mới hợp, bên em hiện không mở lớp cơ bản từ đầu này ạ.',
  COURSE_2: 'Bạn có nền tảng từ vựng và phản xạ nghe đọc tốt, viết câu chuẩn xác ít lỗi ngữ pháp, đủ điều kiện theo học Khóa 2.',
};

export function checkListeningAnswer(questionId: string, answer: string): boolean {
  const norm = (answer || '').trim().toLowerCase();
  if (!norm) return false;
  switch (questionId) {
    case 'q1':
      return norm.includes('brown');
    case 'q2':
      return norm.includes('green');
    case 'q3':
      return norm.includes('75');
    case 'q4':
      return norm.includes('saturday') || norm === 'sat';
    case 'q5':
      return norm.includes('notebook');
    default:
      return false;
  }
}

export function checkReadingAnswer(questionId: string, answer: string): boolean {
  const norm = (answer || '').trim().toLowerCase();
  if (!norm) return false;
  switch (questionId) {
    case 'q1':
      return norm.includes('product');
    case 'q2':
      return norm.includes('year');
    case 'q3':
      return norm.includes('50') || norm.includes('fifty');
    case 'q4':
      return norm.includes('live');
    case 'q5':
      return norm.includes('government');
    default:
      return false;
  }
}

export function evaluateWritingErrorLevel(writingSentences?: Record<string, string>): 'ít lỗi' | 'lỗi nhiều' {
  if (!writingSentences) return 'lỗi nhiều';
  const q1 = (writingSentences.q1 || '').trim().toLowerCase();
  const q2 = (writingSentences.q2 || '').trim().toLowerCase();
  const q3 = (writingSentences.q3 || '').trim().toLowerCase();

  // If any sentence is empty or shorter than 12 characters -> lỗi nhiều
  if (q1.length < 12 || q2.length < 12 || q3.length < 12) {
    return 'lỗi nhiều';
  }

  let errorCount = 0;

  // Q1: check for 'using' or 'the use of', and 'than' or 'more harm'
  if (!q1.includes('using') && !q1.includes('use of') && !q1.includes('mobile phones')) errorCount++;
  if (!q1.includes('than') && !q1.includes('more harm')) errorCount++;

  // Q2: check for 'there are' or 'benefits' or 'of using'
  if (!q2.includes('there are') && !q2.includes('there is')) errorCount++;
  if (!q2.includes('benefit') && !q2.includes('using') && !q2.includes('use')) errorCount++;

  // Q3: check for 'government', 'needs to' or 'need to', 'solution'
  if (!q3.includes('government')) errorCount++;
  if (!q3.includes('need') || !q3.includes('solution')) errorCount++;

  return errorCount >= 2 ? 'lỗi nhiều' : 'ít lỗi';
}

export interface DetailedEvaluationResult {
  vocabCorrect: number;
  vocabTotal: number;
  listeningCorrect: number;
  listeningWrong: number;
  listeningTotal: number;
  readingCorrect: number;
  readingWrong: number;
  readingTotal: number;
  writingErrorLevel: 'ít lỗi' | 'lỗi nhiều';
  isFailed: boolean;
  status: 'Đã có kết quả' | 'Không đạt';
  recommendedCourse: 'Khóa 1' | 'Khóa 2' | 'Không Đạt';
  comment: string;
  ruleExplanation: string;
}

export function evaluatePlacementResult(
  vocabAnswers: Record<string, string> = {},
  listeningAnswers: Record<string, string> = {},
  readingAnswers: Record<string, string> = {},
  writingSentences: Record<string, string> = {},
  manualWritingErrorLevel?: 'ít lỗi' | 'lỗi nhiều'
): DetailedEvaluationResult {
  // 1. Vocabulary (10 items)
  let vocabCorrect = 0;
  Object.keys(VOCAB_KEY).forEach((k) => {
    if (vocabAnswers[k] === VOCAB_KEY[k]) {
      vocabCorrect++;
    }
  });

  // 2. Listening (5 items)
  let listeningCorrect = 0;
  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((k) => {
    if (checkListeningAnswer(k, listeningAnswers[k] || '')) {
      listeningCorrect++;
    }
  });
  const listeningWrong = 5 - listeningCorrect;

  // 3. Reading (5 items)
  let readingCorrect = 0;
  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach((k) => {
    if (checkReadingAnswer(k, readingAnswers[k] || '')) {
      readingCorrect++;
    }
  });
  const readingWrong = 5 - readingCorrect;

  // 4. Writing error level
  const writingErrorLevel: 'ít lỗi' | 'lỗi nhiều' =
    manualWritingErrorLevel || evaluateWritingErrorLevel(writingSentences);

  // 5. Apply user rules in exact order:
  // Rule A: Nếu nghe sai 3 hoặc đọc sai 3 -> Báo Không Đạt
  if (listeningWrong >= 3 || readingWrong >= 3) {
    return {
      vocabCorrect,
      vocabTotal: 10,
      listeningCorrect,
      listeningWrong,
      listeningTotal: 5,
      readingCorrect,
      readingWrong,
      readingTotal: 5,
      writingErrorLevel,
      isFailed: true,
      status: 'Không đạt',
      recommendedCourse: 'Không Đạt',
      comment: PRESET_COMMENTS.FAILED,
      ruleExplanation: `Nghe sai ${listeningWrong}/5 câu, Đọc sai ${readingWrong}/5 câu (quy định: nghe sai ≥ 3 hoặc đọc sai ≥ 3 báo Không Đạt).`,
    };
  }

  // Rule B: Nếu từ vựng dưới 5 -> Xếp Khóa 1
  if (vocabCorrect < 5) {
    return {
      vocabCorrect,
      vocabTotal: 10,
      listeningCorrect,
      listeningWrong,
      listeningTotal: 5,
      readingCorrect,
      readingWrong,
      readingTotal: 5,
      writingErrorLevel,
      isFailed: false,
      status: 'Đã có kết quả',
      recommendedCourse: 'Khóa 1',
      comment: PRESET_COMMENTS.COURSE_1,
      ruleExplanation: `Từ vựng đạt ${vocabCorrect}/10 câu (dưới 5 câu: xếp Khóa 1).`,
    };
  }

  // Rule C: Nghe đọc tốt/đúng hết, nhưng viết câu lỗi nhiều -> Xếp Khóa 1
  if (writingErrorLevel === 'lỗi nhiều') {
    return {
      vocabCorrect,
      vocabTotal: 10,
      listeningCorrect,
      listeningWrong,
      listeningTotal: 5,
      readingCorrect,
      readingWrong,
      readingTotal: 5,
      writingErrorLevel,
      isFailed: false,
      status: 'Đã có kết quả',
      recommendedCourse: 'Khóa 1',
      comment: PRESET_COMMENTS.COURSE_1,
      ruleExplanation: `Nghe đọc tốt (Nghe đúng ${listeningCorrect}/5, Đọc đúng ${readingCorrect}/5), nhưng phần Viết câu lỗi nhiều (xếp Khóa 1).`,
    };
  }

  // Rule D: Viết câu ít lỗi -> Xếp Khóa 2
  return {
    vocabCorrect,
    vocabTotal: 10,
    listeningCorrect,
    listeningWrong,
    listeningTotal: 5,
    readingCorrect,
    readingWrong,
    readingTotal: 5,
    writingErrorLevel: 'ít lỗi',
    isFailed: false,
    status: 'Đã có kết quả',
    recommendedCourse: 'Khóa 2',
    comment: PRESET_COMMENTS.COURSE_2,
    ruleExplanation: `Nghe đọc tốt (Nghe đúng ${listeningCorrect}/5, Đọc đúng ${readingCorrect}/5), Từ vựng ${vocabCorrect}/10, Viết câu chuẩn xác ít lỗi (xếp Khóa 2).`,
  };
}

export function generateParentReportText(
  test: {
    candidateName: string;
    phone: string;
    parentPhone?: string;
    testDate?: string;
    preferredCampus?: string;
    preferredSchedule?: string;
    recommendedCourse?: string;
    status?: string;
    comment?: string;
    overallScore?: number;
    speakingAudioDuration?: number;
    timeSpentFormatted?: string;
    isOverdue?: boolean;
    overdueText?: string;
    testAnswers?: {
      vocab?: Record<string, string>;
      listening?: Record<string, string>;
      reading?: Record<string, string>;
      writingSentences?: Record<string, string>;
      writingParagraph?: string;
    };
  },
  evalResult?: DetailedEvaluationResult
): string {
  const res =
    evalResult ||
    evaluatePlacementResult(
      test.testAnswers?.vocab,
      test.testAnswers?.listening,
      test.testAnswers?.reading,
      test.testAnswers?.writingSentences
    );

  const course = test.recommendedCourse || res.recommendedCourse;
  const comment = test.comment || res.comment;
  const isFailed = test.status === 'Không đạt' || course === 'Không Đạt' || res.isFailed;

  const paragraphWordCount = test.testAnswers?.writingParagraph
    ? test.testAnswers.writingParagraph.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return `📋 BÁO CÁO KẾT QUẢ BÀI KIỂM TRA ĐẦU VÀO - IELTS DƯƠNG VŨ
--------------------------------------------------
Kính gửi Quý Phụ huynh và em: ${test.candidateName}
• SĐT thí sinh: ${test.phone}
• SĐT phụ huynh: ${test.parentPhone || 'Chưa cung cấp'}
• Ngày làm bài: ${test.testDate || new Date().toLocaleDateString('vi-VN')}
• Cơ sở đăng ký: ${test.preferredCampus || 'CS1: 51 Tô Hiệu'}
• Lịch học dự kiến: ${test.preferredSchedule || 'Thứ 4 & Thứ 7'}
• Thời gian làm bài: ${test.timeSpentFormatted || '55 phút'}${test.isOverdue ? ` (⚠️ Vượt mốc: +${test.overdueText})` : ' (Đúng quy định 55 phút)'}

📊 CHI TIẾT ĐIỂM CÁC PHẦN THI:
1. Từ vựng (Vocabulary): ${res.vocabCorrect}/10 câu ${res.vocabCorrect < 5 ? '(Cần bồi dưỡng thêm)' : '(Nắm tốt)'}
2. Kỹ năng Nghe (Listening): Đúng ${res.listeningCorrect}/5 câu (Sai ${res.listeningWrong} câu)
3. Kỹ năng Đọc (Reading): Đúng ${res.readingCorrect}/5 câu (Sai ${res.readingWrong} câu)
4. Kỹ năng Viết (Writing):
   - Phần A (Viết câu hoàn chỉnh): ${res.writingErrorLevel === 'ít lỗi' ? 'Ít lỗi ngữ pháp, cấu trúc câu tốt' : 'Còn nhiều lỗi ngữ pháp, chia thì & từ loại'}
   - Phần B (Viết đoạn văn ngắn): ${paragraphWordCount > 0 ? `Đã hoàn thành đoạn văn (${paragraphWordCount} từ)` : 'Chưa viết'}
5. Kỹ năng Nói & Phát âm (Speaking): ${test.speakingAudioDuration ? `Đã nộp bài ghi âm phát âm (${test.speakingAudioDuration} giây)` : 'Đã nộp bài phần phát âm'}

🎯 KẾT QUẢ ĐÁNH GIÁ & XẾP LỚP:
• Đánh giá: ${isFailed ? '🔴 KHÔNG ĐẠT' : '🟢 ĐẠT YÊU CẦU ĐẦU VÀO'}
• Khóa học đề xuất: ${course}

💬 NHẬN XÉT CỦA GIÁO VIÊN:
"${comment}"
--------------------------------------------------
Mọi thắc mắc về kết quả kiểm tra hoặc đăng ký lớp, Quý Phụ huynh vui lòng liên hệ trung tâm để được tư vấn lộ trình phù hợp nhất ạ!`;
}
