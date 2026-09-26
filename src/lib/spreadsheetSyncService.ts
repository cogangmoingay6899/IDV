import { saveDocument, fetchDocument, fetchCollection } from './firestoreService';
import { AttendanceRecord, ClassSpreadsheetData, SpreadsheetStudentRow, SpreadsheetColumn } from '../types';

/**
 * Automatically syncs attendance & lesson scores directly into the class spreadsheet
 * (sổ sheet của lớp - collection 'class_spreadsheets') whenever a teacher saves daily scores.
 */
export async function syncAttendanceToClassSpreadsheet(records: AttendanceRecord[]): Promise<void> {
  if (!records || records.length === 0) return;

  const sample = records[0];
  if (!sample || !sample.classId) return;

  const classId = sample.classId;
  const classDigits = classId.replace(/\D/g, '');

  const candidateSheetIds: string[] = [
    `sheet-${classId}`,
  ];
  if (classDigits) {
    candidateSheetIds.push(`sheet-ielts-${classDigits}`);
    candidateSheetIds.push(`sheet-${classDigits}`);
  }

  let sheet: ClassSpreadsheetData | null = null;
  for (const candId of candidateSheetIds) {
    sheet = await fetchDocument<ClassSpreadsheetData>('class_spreadsheets', candId);
    if (sheet && sheet.rows && sheet.columns) {
      break;
    }
  }

  if (!sheet) {
    const allSheets = await fetchCollection<ClassSpreadsheetData>('class_spreadsheets');
    sheet = (allSheets.find((s: any) => {
      if (!s.rows || !s.columns) return false;
      const sId = (s.id || '').toLowerCase();
      if (s.classId === classId) return true;
      if (classDigits && sId.includes(classDigits)) return true;
      return false;
    }) as ClassSpreadsheetData) || null;
  }

  if (!sheet) {
    // Build a fresh sheet skeleton if not existing yet
    sheet = {
      id: `sheet-${classId}`,
      classId: classId,
      classBanner: `Bảng điểm Lớp ${sample.className || classId}`,
      tagText: 'INSPI',
      courseTuitionTag: '5tr2',
      branch: 'Cơ sở 1 - Tô Hiệu',
      updatedAt: new Date().toISOString(),
      columns: [],
      rows: [],
    };
  }

  const columns: SpreadsheetColumn[] = Array.isArray(sheet.columns) ? [...sheet.columns] : [];
  let rows: SpreadsheetStudentRow[] = Array.isArray(sheet.rows) ? [...sheet.rows] : [];

  const sessNum = sample.sessionNumber || 1;
  const dateStr = sample.date || new Date().toISOString().split('T')[0];
  const teacherInit = sample.teacherName ? sample.teacherName.split(' ').pop() || 'GV' : 'GV';
  const skillText = sample.skillsTaught?.join(', ') || sample.skillTaught || 'Điểm bài học';

  // Find or create matching column for this lesson session
  let col = columns.find(
    (c) =>
      c.sessionNumber === sessNum ||
      c.lessonLabel.toUpperCase() === `L${sessNum}` ||
      (c.date && c.date === dateStr)
  );

  if (!col) {
    col = {
      id: `col_sess_${sessNum}_${Date.now()}`,
      lessonLabel: `L${sessNum}`,
      teacherAndDate: `${dateStr ? dateStr.slice(5) + ' ' : ''}${teacherInit}`,
      subSkill: skillText,
      maxScore: 10,
      sessionNumber: sessNum,
      date: dateStr,
    };
    columns.push(col);
  } else {
    if (!col.subSkill || col.subSkill === 'Từ vựng & Viết') col.subSkill = skillText;
  }

  const normalize = (str: string) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Update or insert row for each student record
  records.forEach((rec) => {
    const studentName = rec.studentName || '';
    if (!studentName) return;

    const normRecName = normalize(studentName);
    let rowIdx = rows.findIndex((r) => r.studentId === rec.studentId || normalize(r.fullName) === normRecName);

    if (rowIdx === -1) {
      rowIdx = rows.findIndex((r) => {
        const normR = normalize(r.fullName);
        return normR.includes(normRecName) || normRecName.includes(normR);
      });
    }

    let valToSet = 'x';
    if (rec.score !== undefined && rec.score !== null && rec.score !== '') {
      valToSet = String(rec.score);
    } else if (rec.skillScores && Object.keys(rec.skillScores).length > 0) {
      const vals = Object.values(rec.skillScores).filter((v) => v !== '' && v !== undefined);
      if (vals.length > 0) valToSet = vals.join('/');
    } else if (rec.status === 'Có mặt') {
      valToSet = 'x';
    } else if (rec.status === 'Đi muộn' || rec.status === 'Đi trễ') {
      valToSet = 'trễ';
    } else if (rec.status?.includes('Nghỉ') || rec.status?.includes('vắng')) {
      valToSet = 'vắng';
    }

    let highlightColor: 'default' | 'yellow' | 'red' | 'green' = 'default';
    const numVal = parseFloat(valToSet);
    if (!isNaN(numVal) && numVal <= 5.5 && numVal > 0) {
      highlightColor = 'yellow';
    } else if (valToSet === 'vắng') {
      highlightColor = 'red';
    }

    if (rowIdx !== -1) {
      rows[rowIdx] = {
        ...rows[rowIdx],
        scores: {
          ...(rows[rowIdx].scores || {}),
          [col!.id]: valToSet,
        },
        scoresHighlight: {
          ...(rows[rowIdx].scoresHighlight || {}),
          [col!.id]: highlightColor,
        },
      };
    } else {
      // Append student row if missing
      rows.push({
        id: `row-${rec.studentId || Date.now()}`,
        studentId: rec.studentId,
        no: rows.length + 1,
        fullName: studentName,
        email: '',
        hpStatus: 'Đã học',
        hpHighlightColor: 'default',
        scores: {
          [col!.id]: valToSet,
        },
        scoresHighlight: {
          [col!.id]: highlightColor,
        },
      });
    }
  });

  const updatedSheet: ClassSpreadsheetData = {
    ...sheet,
    columns,
    rows,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`idv_class_sheet_${classId}`, JSON.stringify(updatedSheet));
  } catch (e) {}

  await saveDocument('class_spreadsheets', updatedSheet);
  console.log(`Successfully synced ${records.length} records into class_spreadsheets for class ${classId}.`);
}
