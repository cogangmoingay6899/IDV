import { UserRole } from '../types';

export interface DepartmentEmails {
  teachersToHieu: string[];
  teachersKienAn: string[];
  assistants: string[];
  admins: string[];
}

export const DEFAULT_DEPARTMENT_EMAILS: DepartmentEmails = {
  teachersToHieu: [
    'tamvuong710@gmail.com',
    'dangdiep725@gmail.com',
    'thomthom1294@gmail.com',
    't.nguyen8790@gmail.com',
    'vungoc23122002@gmail.com',
    'hoangminhtam51203@gmail.com',
    'ieltsduongvu5@gmail.com',
  ],
  teachersKienAn: [
    'work.huyenchi@gmail.com',
    'Nguyenhailong0507@gmail.com',
    'vuthingan19990365161299@gmail.com',
  ],
  assistants: [
    'kim.anh.19091712@gmail.com',
    'nhungphan.mkt@gmail.com',
  ],
  admins: [
    'ieltsduongvu@gmail.com',
  ],
};

export interface StaffProfile {
  name: string;
  title: string;
  specialty?: string;
  branch?: string;
}

export const KNOWN_STAFF_PROFILES: Record<string, StaffProfile> = {
  'ieltsduongvu@gmail.com': {
    name: 'Thầy Dương Vũ (Admin)',
    title: 'Ban Giám Đốc & Quản lý IDV',
  },
  'kim.anh.19091712@gmail.com': {
    name: 'Cô Kim Anh',
    title: 'Trợ lý học vụ & Tuyển sinh',
  },
  'nhungphan.mkt@gmail.com': {
    name: 'Cô Nhung Phan',
    title: 'Trợ lý học vụ & Tuyển sinh',
  },
  // Tô Hiệu Teachers
  'tamvuong710@gmail.com': {
    name: 'Cô Tâm Vương',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS 8.0+ (Speaking & Writing)',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  'dangdiep725@gmail.com': {
    name: 'Cô Diệp Đặng',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS Intensive Writing',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  'thomthom1294@gmail.com': {
    name: 'Cô Thơm Nguyễn',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS Reading & Grammar',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  't.nguyen8790@gmail.com': {
    name: 'Cô Trang Nguyễn',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS Foundation & Pre',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  'vungoc23122002@gmail.com': {
    name: 'Cô Vũ Ngọc',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS Junior & Vocab',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  'hoangminhtam51203@gmail.com': {
    name: 'Thầy Hoàng Minh Tâm',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS Listening & Reading',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  'ieltsduongvu5@gmail.com': {
    name: 'Thầy Dương Vũ (GV)',
    title: 'Giáo viên IELTS (CS1 Tô Hiệu)',
    specialty: 'IELTS Masterclass 8.5',
    branch: 'Cơ sở 1 - Tô Hiệu (Hải Phòng)',
  },
  // Kiến An Teachers
  'work.huyenchi@gmail.com': {
    name: 'Cô Huyền Chi',
    title: 'Giáo viên IELTS (CS2 Kiến An)',
    specialty: 'IELTS Speaking & Pronunciation',
    branch: 'Cơ sở 2 - Kiến An (Hải Phòng)',
  },
  'nguyenhailong0507@gmail.com': {
    name: 'Thầy Nguyễn Hải Long',
    title: 'Giáo viên IELTS (CS2 Kiến An)',
    specialty: 'IELTS Writing & Listening',
    branch: 'Cơ sở 2 - Kiến An (Hải Phòng)',
  },
  'vuthingan19990365161299@gmail.com': {
    name: 'Cô Vũ Thị Ngân',
    title: 'Giáo viên IELTS (CS2 Kiến An)',
    specialty: 'IELTS Foundation & Junior',
    branch: 'Cơ sở 2 - Kiến An (Hải Phòng)',
  },
};

export const loadDepartmentEmails = (): DepartmentEmails => {
  try {
    const saved = localStorage.getItem('idv_department_emails');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        admins: parsed.admins && Array.isArray(parsed.admins) && parsed.admins.length ? parsed.admins : DEFAULT_DEPARTMENT_EMAILS.admins,
        assistants: parsed.assistants && Array.isArray(parsed.assistants) && parsed.assistants.length ? parsed.assistants : DEFAULT_DEPARTMENT_EMAILS.assistants,
        teachersToHieu: parsed.teachersToHieu && Array.isArray(parsed.teachersToHieu) && parsed.teachersToHieu.length ? parsed.teachersToHieu : DEFAULT_DEPARTMENT_EMAILS.teachersToHieu,
        teachersKienAn: parsed.teachersKienAn && Array.isArray(parsed.teachersKienAn) && parsed.teachersKienAn.length ? parsed.teachersKienAn : DEFAULT_DEPARTMENT_EMAILS.teachersKienAn,
      };
    }
  } catch (e) {
    console.error('Error loading department emails:', e);
  }
  return DEFAULT_DEPARTMENT_EMAILS;
};

export const saveDepartmentEmails = (emails: DepartmentEmails): void => {
  try {
    localStorage.setItem('idv_department_emails', JSON.stringify(emails));
  } catch (e) {
    console.error('Error saving department emails:', e);
  }
};

export const getDisplayNameForEmail = (
  email: string,
  role: UserRole,
  branch?: string
): { name: string; title: string; specialty?: string } => {
  const normalized = email.trim().toLowerCase();
  const known = KNOWN_STAFF_PROFILES[normalized];
  if (known) {
    return {
      name: known.name,
      title: known.title,
      specialty: known.specialty,
    };
  }

  // Generate name from username part
  const username = normalized.split('@')[0] || 'nhansu';
  const cleanUsername = username
    .replace(/[._\d]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Nhân sự IDV';

  if (role === 'admin') {
    return {
      name: cleanUsername.length > 2 ? cleanUsername : 'Quản trị viên IDV',
      title: 'Quản trị viên & Giám đốc trung tâm',
    };
  }
  if (role === 'assistant') {
    return {
      name: cleanUsername.length > 2 ? cleanUsername : 'Trợ lý IDV',
      title: 'Trợ lý học vụ & Tuyển sinh',
    };
  }
  return {
    name: cleanUsername.length > 2 ? cleanUsername : 'Giáo viên IDV',
    title: `Giáo viên IELTS (${branch?.includes('Tô Hiệu') ? 'CS1 Tô Hiệu' : 'CS2 Kiến An'})`,
    specialty: 'Giảng viên IELTS Chuyên sâu',
  };
};
