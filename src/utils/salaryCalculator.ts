import { Teacher } from '../types';

/**
 * Returns default salary/payroll calculation configurations based on the teacher's name
 * as requested in the specific school business logic rules.
 */
export function getTeacherDefaultSalaryConfig(name: string): Partial<Teacher> {
  const norm = (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Diệp Đặng (30% of 4.8M for all courses)
  if (norm.includes('diep dang') || norm.includes('diep')) {
    return {
      salaryCalcType: 'percent_of_amount',
      baseAmount: 4800000,
      percentageK1: 30,
      percentageK2: 30,
      percentageK3: 30,
      percentageK4: 30,
    };
  }

  // 2. Trang Nguyễn (35% of 4.8M for all courses)
  if (norm.includes('trang nguyen') || norm.includes('trang')) {
    return {
      salaryCalcType: 'percent_of_amount',
      baseAmount: 4800000,
      percentageK1: 35,
      percentageK2: 35,
      percentageK3: 35,
      percentageK4: 35,
    };
  }

  // 3. Tâm Vương và Thơm Nguyễn (26% of 4.8M for courses 1, 2 and 28% for course 3)
  if (
    norm.includes('tam vuong') ||
    norm.includes('thom nguyen') ||
    norm.includes('thom') ||
    norm.includes('vuong')
  ) {
    return {
      salaryCalcType: 'percent_of_amount',
      baseAmount: 4800000,
      percentageK1: 26,
      percentageK2: 26,
      percentageK3: 28,
      percentageK4: 28,
    };
  }

  // 4. Minh Tâm (24% of 4.8M for course 1, 26% for course 2, 28% for course 3)
  if (norm.includes('minh tam') || norm.includes('hoang minh tam')) {
    return {
      salaryCalcType: 'percent_of_amount',
      baseAmount: 4800000,
      percentageK1: 24,
      percentageK2: 26,
      percentageK3: 28,
      percentageK4: 28,
    };
  }

  // 5. Huyền Chi (fixed salary 600,000/session)
  if (norm.includes('huyen chi') || norm.includes('chi')) {
    return {
      salaryCalcType: 'fixed_per_session',
      fixedRate: 600000,
    };
  }

  // 6. Ngọc Vũ (fixed salary 700,000/session if size < 23, otherwise 800,000/session)
  if (
    norm.includes('ngoc vu') ||
    norm.includes('vu ngoc') ||
    norm.includes('vungoc') ||
    norm.includes('ngoc')
  ) {
    return {
      salaryCalcType: 'fixed_with_size_condition',
      fixedRateUnder23: 700000,
      fixedRateOver23: 800000,
    };
  }

  // 7. Hải Long, Đàm Hiếu, Vũ Ngần (fixed salary 500,000/session)
  if (
    norm.includes('hai long') ||
    norm.includes('long') ||
    norm.includes('dam hieu') ||
    norm.includes('hieu') ||
    norm.includes('vu ngan') ||
    norm.includes('ngan') ||
    norm.includes('trunghieu') ||
    norm.includes('dam trung hieu')
  ) {
    return {
      salaryCalcType: 'fixed_per_session',
      fixedRate: 500000,
    };
  }

  // Default fallback for other teachers: rate_per_student
  return {
    salaryCalcType: 'rate_per_student',
  };
}

/**
 * Calculates a single session/class salary for a teacher based on course level and student size.
 */
export function calculateTeacherSessionSalary(
  teacher: Teacher,
  courseLevel: string = 'Khóa 1',
  studentCount: number = 20
): number {
  if (!teacher) return 500000;

  const calcType = teacher.salaryCalcType || getTeacherDefaultSalaryConfig(teacher.name).salaryCalcType || 'rate_per_student';
  const base = teacher.baseAmount || getTeacherDefaultSalaryConfig(teacher.name).baseAmount || 4800000;

  if (calcType === 'percent_of_amount') {
    const lvl = (courseLevel || '').toLowerCase();
    let pct = 30; // default fallback percentage
    
    const defaults = getTeacherDefaultSalaryConfig(teacher.name);

    if (lvl.includes('4') || lvl.includes('k4')) {
      pct = teacher.percentageK4 ?? defaults.percentageK4 ?? 30;
    } else if (lvl.includes('3') || lvl.includes('k3')) {
      pct = teacher.percentageK3 ?? defaults.percentageK3 ?? 28;
    } else if (lvl.includes('2') || lvl.includes('k2')) {
      pct = teacher.percentageK2 ?? defaults.percentageK2 ?? 26;
    } else {
      pct = teacher.percentageK1 ?? defaults.percentageK1 ?? 24;
    }

    return Math.round((pct / 100) * base);
  }

  if (calcType === 'fixed_per_session') {
    return teacher.fixedRate ?? getTeacherDefaultSalaryConfig(teacher.name).fixedRate ?? 500000;
  }

  if (calcType === 'fixed_with_size_condition') {
    const rateUnder = teacher.fixedRateUnder23 ?? getTeacherDefaultSalaryConfig(teacher.name).fixedRateUnder23 ?? 700000;
    const rateOver = teacher.fixedRateOver23 ?? getTeacherDefaultSalaryConfig(teacher.name).fixedRateOver23 ?? 800000;
    return studentCount >= 23 ? rateOver : rateUnder;
  }

  // Standard: rate_per_student
  const studentRate = teacher.rateRegularStudent || (teacher.type === 'Bản ngữ (Native)' ? 39000 : 36000);
  return studentCount * studentRate;
}
