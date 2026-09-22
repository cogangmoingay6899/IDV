// Utility to parse Google Sheet / Google Forms CSV or TSV exports into PlacementTest objects
import { PlacementTest } from '../types';
import {
  VOCAB_KEY,
  checkListeningAnswer,
  checkReadingAnswer,
  PRESET_COMMENTS,
} from './placementEvaluation';

// Parse raw CSV string considering quoted values that contain commas and line breaks
export function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  // Detect if delimiter is Tab (\t) or Comma (,)
  const firstLine = csvText.split('\n')[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function convertRowsToPlacementTests(rows: string[][]): PlacementTest[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  
  // Find column indices
  const findIdx = (...keywords: string[]): number => {
    return headers.findIndex((h) => keywords.some((k) => h.includes(k.toLowerCase())));
  };

  const idxTimestamp = findIdx('timestamp', 'dấu thời gian');
  const idxName = findIdx('họ tên', 'tên của em', 'candidatename', 'họ và tên');
  const idxPhone = findIdx('số điện thoại của em', 'điện thoại của em', 'sđt', 'phone');
  const idxParentPhone = findIdx('phụ huynh', 'số điện thoại phụ huynh');
  const idxEmail = findIdx('email', 'gmail', 'thư điện tử');
  const idxDob = findIdx('ngày tháng năm sinh', 'năm sinh', 'dob', 'sinh nhật');
  const idxFacebook = findIdx('facebook', 'fb');
  const idxAddress = findIdx('địa chỉ nhà', 'địa chỉ', 'nơi ở');
  const idxCampus = findIdx('cơ sở');
  const idxSchedule = findIdx('lịch học', 'chọn lịch');
  const idxSchool = findIdx('trường', 'đang theo học');
  const idxTarget = findIdx('mục tiêu', 'target');
  const idxExamDate = findIdx('khi nào em cần', 'thời hạn');
  const idxExperience = findIdx('đã học ielts bao giờ chưa', 'kinh nghiệm');
  const idxReferral = findIdx('biết đến ielts dương vũ qua nguồn nào', 'người giới thiệu', 'nguồn');

  // Vocab questions
  const idxV1 = findIdx('1. at the weekend', 'at the weekend');
  const idxV2 = findIdx('2. every time', 'every time I wear');
  const idxV3 = findIdx('3.  i love all fruit', 'love all fruit');
  const idxV4 = findIdx('4. i don’t', 'i don\'t _________ going out');
  const idxV5 = findIdx('5. i’ve been so busy', 'busy all week');
  const idxV6 = findIdx('6. it’s a good idea', 'good idea');
  const idxV7 = findIdx('7. excuse me', 'mistake in our bill');
  const idxV8 = findIdx('8. they never argue', 'enjoy spending time together');
  const idxV9 = findIdx('9. you can’t smoke', 'smoke here');
  const idxV10 = findIdx('10. i don’t like my job', 'look for another one');

  // Listening questions
  const idxL1 = findIdx('guitar lesson', 'emily 1');
  const idxL2 = findIdx('address: 2', '28 green');
  const idxL3 = findIdx('course fee: 3', 'course fee');
  const idxL4 = findIdx('first lesson: 4', 'first lesson');
  const idxL5 = findIdx('bring a 5', 'first class');

  // Reading questions
  const idxR1 = findIdx('cities are like 1', 'which people can buy');
  const idxR2 = findIdx('surveys take place every 2', 'every 2');
  const idxR3 = findIdx('maximum of 3', '3……………. cities');
  const idxR4 = findIdx('where to 4', 'decide where to 4');
  const idxR5 = findIdx('local 5', 'helpful for: local 5');

  // Writing questions
  const idxW1 = findIdx('1. use/ mobile phone', 'more harm/ good');
  const idxW2 = findIdx('2. there/ a number of', 'number/ benefit');
  const idxW3 = findIdx('3. government/ need', 'find/ solution');
  const idxWPara = findIdx('write a short paragraph', 'benefits of studying abroad', 'short paragraph');

  const tests: PlacementTest[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const candidateName = (idxName !== -1 ? row[idxName] : row[2]) || `Thí sinh ${r}`;
    if (!candidateName.trim()) continue;

    const phone = (idxPhone !== -1 ? row[idxPhone] : row[3]) || '';
    const parentPhone = (idxParentPhone !== -1 ? row[idxParentPhone] : row[4]) || phone;
    const email = (idxEmail !== -1 ? row[idxEmail] : row[5]) || '';
    const dob = (idxDob !== -1 ? row[idxDob] : row[6]) || '2008-01-15';
    const facebookLink = (idxFacebook !== -1 ? row[idxFacebook] : row[7]) || '';
    const address = (idxAddress !== -1 ? row[idxAddress] : row[9]) || '';
    const preferredCampus = (idxCampus !== -1 ? row[idxCampus] : row[10]) || 'CS1: 51 Tô Hiệu (tầng 4), Lê Chân, Hải Phòng';
    const preferredSchedule = (idxSchedule !== -1 ? row[idxSchedule] : row[11]) || '';
    const school = (idxSchool !== -1 ? row[idxSchool] : row[12]) || '';
    const targetLevel = (idxTarget !== -1 ? row[idxTarget] : row[13]) || 'Overall 6.5';
    const targetExamDate = (idxExamDate !== -1 ? row[idxExamDate] : row[14]) || '';
    const previousIeltsExperience = (idxExperience !== -1 ? row[idxExperience] : row[15]) || '';
    const referralSource = (idxReferral !== -1 ? row[idxReferral] : row[16]) || '';
    const rawTimestamp = (idxTimestamp !== -1 ? row[idxTimestamp] : row[0]) || '';

    // Vocab Answers
    const vocab: Record<string, string> = {
      q1: (idxV1 !== -1 ? row[idxV1] : row[17]) || '',
      q2: (idxV2 !== -1 ? row[idxV2] : row[18]) || '',
      q3: (idxV3 !== -1 ? row[idxV3] : row[19]) || '',
      q4: (idxV4 !== -1 ? row[idxV4] : row[20]) || '',
      q5: (idxV5 !== -1 ? row[idxV5] : row[21]) || '',
      q6: (idxV6 !== -1 ? row[idxV6] : row[22]) || '',
      q7: (idxV7 !== -1 ? row[idxV7] : row[23]) || '',
      q8: (idxV8 !== -1 ? row[idxV8] : row[24]) || '',
      q9: (idxV9 !== -1 ? row[idxV9] : row[25]) || '',
      q10: (idxV10 !== -1 ? row[idxV10] : row[26]) || '',
    };

    // Listening Answers
    const listening: Record<string, string> = {
      q1: (idxL1 !== -1 ? row[idxL1] : row[27]) || '',
      q2: (idxL2 !== -1 ? row[idxL2] : row[28]) || '',
      q3: (idxL3 !== -1 ? row[idxL3] : row[29]) || '',
      q4: (idxL4 !== -1 ? row[idxL4] : row[30]) || '',
      q5: (idxL5 !== -1 ? row[idxL5] : row[31]) || '',
    };

    // Reading Answers
    const reading: Record<string, string> = {
      q1: (idxR1 !== -1 ? row[idxR1] : row[32]) || '',
      q2: (idxR2 !== -1 ? row[idxR2] : row[33]) || '',
      q3: (idxR3 !== -1 ? row[idxR3] : row[34]) || '',
      q4: (idxR4 !== -1 ? row[idxR4] : row[35]) || '',
      q5: (idxR5 !== -1 ? row[idxR5] : row[36]) || '',
    };

    // Writing Sentences
    const writingSentences: Record<string, string> = {
      q1: (idxW1 !== -1 ? row[idxW1] : row[37]) || '',
      q2: (idxW2 !== -1 ? row[idxW2] : row[38]) || '',
      q3: (idxW3 !== -1 ? row[idxW3] : row[39]) || '',
    };

    // Writing Paragraph
    const writingParagraph = (idxWPara !== -1 ? row[idxWPara] : row[40]) || '';

    // Calculate scores
    let vocabCorrect = 0;
    Object.keys(VOCAB_KEY).forEach((qKey) => {
      const ans = (vocab[qKey] || '').toLowerCase().trim();
      const expected = VOCAB_KEY[qKey].toLowerCase();
      if (ans && ans === expected) vocabCorrect++;
    });

    let listeningCorrect = 0;
    for (let i = 1; i <= 5; i++) {
      if (checkListeningAnswer(`q${i}`, listening[`q${i}`] || '')) {
        listeningCorrect++;
      }
    }

    let readingCorrect = 0;
    for (let i = 1; i <= 5; i++) {
      if (checkReadingAnswer(`q${i}`, reading[`q${i}`] || '')) {
        readingCorrect++;
      }
    }

    // Convert raw correct count to Band Score (out of 9.0)
    const listeningScore = listeningCorrect === 5 ? 8.0 : listeningCorrect === 4 ? 7.0 : listeningCorrect === 3 ? 6.0 : listeningCorrect === 2 ? 5.0 : listeningCorrect === 1 ? 4.0 : 3.0;
    const readingScore = readingCorrect === 5 ? 8.0 : readingCorrect === 4 ? 7.0 : readingCorrect === 3 ? 6.0 : readingCorrect === 2 ? 5.0 : readingCorrect === 1 ? 4.0 : 3.0;
    const writingScore = writingParagraph.trim().length > 60 ? (vocabCorrect >= 6 ? 6.5 : 5.5) : 5.0;
    const speakingScore = 6.0;

    const overallScore = Number(((listeningScore + readingScore + writingScore + speakingScore) / 4).toFixed(1));

    let recommendedCourse = 'Khóa 1';
    let comment = PRESET_COMMENTS.COURSE_1;
    let status: PlacementTest['status'] = 'Đã có kết quả';

    if (overallScore >= 6.5 && vocabCorrect >= 6) {
      recommendedCourse = 'Khóa 2';
      comment = PRESET_COMMENTS.COURSE_2;
    } else if (overallScore < 4.5 && vocabCorrect < 3) {
      status = 'Không đạt';
      comment = PRESET_COMMENTS.FAILED;
    }

    // Convert rawTimestamp to standard ISO testDate
    let testDate = new Date().toISOString().split('T')[0];
    try {
      if (rawTimestamp) {
        const d = new Date(rawTimestamp);
        if (!isNaN(d.getTime())) {
          testDate = d.toISOString().split('T')[0];
        }
      }
    } catch (e) {}

    const testId = `pt-sheet-${Date.now()}-${r}`;
    const code = `TEST-${100 + r}`;

    tests.push({
      id: testId,
      code,
      candidateName: candidateName.trim(),
      dob,
      gender: 'Nữ',
      phone,
      parentPhone,
      email,
      address,
      facebookLink,
      school,
      preferredCampus,
      preferredSchedule,
      targetExamDate,
      previousIeltsExperience,
      referralSource,
      testDate,
      submittedAt: rawTimestamp || new Date().toISOString(),
      evaluatorName: 'Google Sheets Importer',
      listeningScore,
      readingScore,
      writingScore,
      speakingScore,
      overallScore,
      targetLevel: targetLevel || 'Overall 6.5',
      recommendedCourse,
      status,
      comment,
      sourceType: 'google_form_link',
      testAnswers: {
        vocab,
        listening,
        reading,
        writingSentences,
        writingParagraph,
      },
    });
  }

  return tests;
}
