import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  Volume2,
  Clock,
  Square,
  Check,
  Share2,
  UserCheck,
  Headphones,
  BookOpen,
  Eye,
  EyeOff,
  Languages,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Sliders,
  Radio,
  FileAudio,
  VolumeX,
} from 'lucide-react';
import {
  ClassGroup,
  Student,
  PronunciationSession,
  AuthUser,
} from '../../types';

interface ClassPronunciationModuleProps {
  classGroup: ClassGroup;
  students: Student[];
  currentUser?: AuthUser;
  showToast?: (message: string) => void;
  standalonePortalMode?: boolean;
}

// 44 IPA Chart Data Structure
const IPA_VOWELS = [
  { symbol: 'i:', example: 'sheep' },
  { symbol: 'ɪ', example: 'ship' },
  { symbol: 'ʊ', example: 'good' },
  { symbol: 'u:', example: 'shoot' },
  { symbol: 'e', example: 'bed' },
  { symbol: 'ə', example: 'teacher' },
  { symbol: 'ɜ:', example: 'bird' },
  { symbol: 'ɔ:', example: 'door' },
  { symbol: 'æ', example: 'cat' },
  { symbol: 'ʌ', example: 'up' },
  { symbol: 'ɑ:', example: 'far' },
  { symbol: 'ɒ', example: 'on' },
  { symbol: 'ɪə', example: 'here' },
  { symbol: 'eɪ', example: 'wait' },
  { symbol: 'ʊə', example: 'tour' },
  { symbol: 'ɔɪ', example: 'boy' },
  { symbol: 'əʊ', example: 'show' },
  { symbol: 'eə', example: 'hair' },
  { symbol: 'aɪ', example: 'my' },
  { symbol: 'aʊ', example: 'cow' },
];

const IPA_CONSONANTS = [
  { symbol: 'p', example: 'pea' },
  { symbol: 'b', example: 'boat' },
  { symbol: 't', example: 'tea' },
  { symbol: 'd', example: 'dog' },
  { symbol: 'tʃ', example: 'cheese' },
  { symbol: 'dʒ', example: 'june' },
  { symbol: 'k', example: 'car' },
  { symbol: 'ɡ', example: 'go' },
  { symbol: 'f', example: 'fly' },
  { symbol: 'v', example: 'video' },
  { symbol: 'θ', example: 'think' },
  { symbol: 'ð', example: 'this' },
  { symbol: 's', example: 'see' },
  { symbol: 'z', example: 'zoo' },
  { symbol: 'ʃ', example: 'shall' },
  { symbol: 'ʒ', example: 'television' },
  { symbol: 'm', example: 'man' },
  { symbol: 'n', example: 'now' },
  { symbol: 'ŋ', example: 'sing' },
  { symbol: 'h', example: 'hat' },
  { symbol: 'l', example: 'love' },
  { symbol: 'r', example: 'red' },
  { symbol: 'w', example: 'wet' },
  { symbol: 'j', example: 'yes' },
];

import { ALL_SPEAKING_LESSONS, RichSpeechLesson } from "../../data/speakingLessonsData";
import { DIFFICULT_SOUNDS_DATA } from "../../data/difficultSoundsData";

const PRE_IELTS_LESSONS: RichSpeechLesson[] = ALL_SPEAKING_LESSONS;

// Tongue Twisters
const TONGUE_TWISTERS = [
  {
    id: 'tw-1',
    title: 'Âm /θ/ và /ð/ (Think vs This)',
    text: 'Thirty-three thousand feathers on a thrush’s throat.',
    ipa: '/ˈθɜː.ti.θriː ˈθaʊ.zənd ˈfeð.əz ɒn ə θrʌʃəz θroʊt/',
  },
  {
    id: 'tw-2',
    title: 'Âm /s/ và /ʃ/ (Sea vs She)',
    text: 'She sells seashells by the seashore.',
    ipa: '/ʃiː selz ˈsiː.ʃelz baɪ ðə ˈsiː.ʃɔːr/',
  },
  {
    id: 'tw-3',
    title: 'Âm /p/ và /b/ (Peter Piper)',
    text: 'Peter Piper picked a peck of pickled peppers.',
    ipa: '/ˈpiː.tər ˈpaɪ.pər pɪkt ə pek əv ˈpɪk.əld ˈpep.əz/',
  },
];

// Helper to render responsive visual mouth diagrams for difficult sounds
const SpeechDiagramRenderer: React.FC<{ type: string; labels: string[] }> = ({ type, labels }) => {
  switch (type) {
    case 'lips_tongue':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          {/* Mouth silhouette */}
          <path d="M20,80 Q40,40 100,40 T180,80 Q140,120 100,120 T20,80" fill="#fef2f2" stroke="#fecaca" strokeWidth="2" />
          {/* Lips rounded */}
          <path d="M110,50 Q130,50 140,65 Q150,80 140,95 Q130,110 110,110" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />
          <text x="142" y="45" className="text-[9px] font-bold fill-red-600">Môi tròn chu về trước</text>
          {/* Tongue lifted */}
          <path d="M50,110 Q80,105 100,85 Q110,75 105,70 Q100,70 90,85 T50,100" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" />
          <text x="40" y="132" className="text-[9px] font-bold fill-slate-700">Thân lưỡi nâng sát vòm cứng</text>
          {/* Air flow lines */}
          <path d="M100,78 Q115,75 135,75" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="3,3" />
          <path d="M98,85 Q115,85 138,85" fill="none" stroke="#8b5cf6" strokeWidth="3" />
          <path d="M100,92 Q115,95 135,95" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="3,3" />
          <text x="110" y="112" className="text-[9px] font-bold fill-violet-600">Phải rít mạnh vô thanh</text>
          {/* Teeth */}
          <rect x="110" y="58" width="8" height="12" rx="2" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="110" y="90" width="8" height="12" rx="2" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      );
    case 'teeth_tongue':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <path d="M20,80 Q40,40 100,40 T180,80 Q140,120 100,120 T20,80" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
          {/* Teeth upper & lower */}
          <rect x="115" y="48" width="10" height="18" rx="2" fill="#fff" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="115" y="94" width="10" height="18" rx="2" fill="#fff" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Tongue between teeth */}
          <path d="M50,105 Q85,100 115,80 Q122,76 118,72 Q112,72 100,88 T50,95" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" />
          <text x="120" y="42" className="text-[9px] font-bold fill-emerald-700">Răng cửa trên chạm lưỡi</text>
          <text x="40" y="132" className="text-[9px] font-bold fill-slate-700">Lưỡi đặt giữa hai răng</text>
          {/* Airflow arrows */}
          <path d="M116,76 Q135,74 150,74" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
          <path d="M116,84 Q135,84 152,84" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
          <polygon points="152,84 146,80 146,88" fill="#0ea5e9" />
          <text x="125" y="112" className="text-[9px] font-bold fill-sky-600">Thổi luồng hơi</text>
        </svg>
      );
    case 'vocal_cords':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <circle cx="100" cy="80" r="50" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
          {/* Vocal cords (vibrating) */}
          <path d="M75,80 C85,70 100,70 125,80" fill="none" stroke="#3b82f6" strokeWidth="4" />
          <path d="M75,80 C85,90 100,90 125,80" fill="none" stroke="#3b82f6" strokeWidth="4" />
          {/* Sound waves */}
          <path d="M135,70 Q145,80 135,90" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <path d="M142,65 Q156,80 142,95" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M149,60 Q167,80 149,100" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
          <text x="30" y="145" className="text-[9px] font-bold fill-blue-700">Rung mạnh dây thanh quản hữu thanh</text>
        </svg>
      );
    case 'ed_rules':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <rect x="10" y="10" width="180" height="140" rx="12" fill="#fafafa" stroke="#e2e8f0" strokeWidth="1.5" />
          <text x="100" y="30" textAnchor="middle" className="text-[10px] font-black fill-slate-800">CÁCH PHÁT ÂM ĐUÔI -ED</text>
          
          <line x1="100" y1="36" x2="40" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="36" x2="100" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="36" x2="160" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Branch 1 */}
          <circle cx="40" cy="75" r="16" fill="#fee2e2" />
          <text x="40" y="79" textAnchor="middle" className="text-xs font-black fill-red-700">/t/</text>
          <text x="40" y="105" textAnchor="middle" className="text-[8px] font-bold fill-slate-600">Vô thanh</text>
          <text x="40" y="117" textAnchor="middle" className="text-[7px] fill-slate-400">p, k, f, s, sh, ch</text>

          {/* Branch 2 */}
          <circle cx="100" cy="75" r="16" fill="#e0f2fe" />
          <text x="100" y="79" textAnchor="middle" className="text-xs font-black fill-sky-700">/d/</text>
          <text x="100" y="105" textAnchor="middle" className="text-[8px] font-bold fill-slate-600">Hữu thanh</text>
          <text x="100" y="117" textAnchor="middle" className="text-[7px] fill-slate-400">còn lại, nguyên âm</text>

          {/* Branch 3 */}
          <circle cx="160" cy="75" r="16" fill="#dcfce7" />
          <text x="160" y="79" textAnchor="middle" className="text-xs font-black fill-emerald-700">/ɪd/</text>
          <text x="160" y="105" textAnchor="middle" className="text-[8px] font-bold fill-slate-600">Đuôi t & d</text>
          <text x="160" y="117" textAnchor="middle" className="text-[7px] fill-slate-400">wanted, needed</text>
        </svg>
      );
    case 's_rules':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <rect x="10" y="10" width="180" height="140" rx="12" fill="#fafafa" stroke="#e2e8f0" strokeWidth="1.5" />
          <text x="100" y="30" textAnchor="middle" className="text-[10px] font-black fill-slate-800">CÁCH PHÁT ÂM ĐUÔI -S / -ES</text>
          
          <line x1="100" y1="36" x2="40" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="36" x2="100" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="100" y1="36" x2="160" y2="65" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Branch 1 */}
          <circle cx="40" cy="75" r="16" fill="#fee2e2" />
          <text x="40" y="79" textAnchor="middle" className="text-xs font-black fill-red-700">/s/</text>
          <text x="40" y="105" textAnchor="middle" className="text-[8px] font-bold fill-slate-600">Vô thanh</text>
          <text x="40" y="117" textAnchor="middle" className="text-[7px] fill-slate-400">p, t, k, f, θ</text>

          {/* Branch 2 */}
          <circle cx="100" cy="75" r="16" fill="#e0f2fe" />
          <text x="100" y="79" textAnchor="middle" className="text-xs font-black fill-sky-700">/z/</text>
          <text x="100" y="105" textAnchor="middle" className="text-[8px] font-bold fill-slate-600">Hữu thanh</text>
          <text x="100" y="117" textAnchor="middle" className="text-[7px] fill-slate-400">còn lại, nguyên âm</text>

          {/* Branch 3 */}
          <circle cx="160" cy="75" r="16" fill="#dcfce7" />
          <text x="160" y="79" textAnchor="middle" className="text-xs font-black fill-emerald-700">/ɪz/</text>
          <text x="160" y="105" textAnchor="middle" className="text-[8px] font-bold fill-slate-600">Âm gió / rít</text>
          <text x="160" y="117" textAnchor="middle" className="text-[7px] fill-slate-400">s, z, sh, ch, ge, x</text>
        </svg>
      );
    case 'common_errors':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <circle cx="100" cy="80" r="45" fill="#fffbeb" stroke="#fef3c7" strokeWidth="6" />
          <circle cx="100" cy="80" r="30" fill="none" stroke="#fde68a" strokeWidth="2" strokeDasharray="3,3" />
          <path d="M100,55 L100,105 M75,80 L125,80" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="100" cy="80" r="6" fill="#f59e0b" />
          <text x="100" y="24" textAnchor="middle" className="text-[9px] font-bold fill-amber-800">Ending Sounds</text>
          <text x="35" y="84" textAnchor="middle" className="text-[9px] font-bold fill-amber-800">Âm câm</text>
          <text x="165" y="84" textAnchor="middle" className="text-[9px] font-bold fill-amber-800">Trọng âm</text>
          <text x="100" y="145" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">Các lỗi phổ biến cần tránh</text>
        </svg>
      );
    case 'word_pairs':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <line x1="20" y1="110" x2="180" y2="110" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <polygon points="100,110 92,125 108,125" fill="#64748b" />
          
          <circle cx="55" cy="75" r="20" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="55" y="79" textAnchor="middle" className="text-[9px] font-black fill-blue-700">Quite</text>
          <text x="55" y="128" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">1 âm tiết</text>

          <circle cx="145" cy="65" r="20" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="145" y="69" textAnchor="middle" className="text-[9px] font-black fill-violet-700">Quiet</text>
          <text x="145" y="128" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">2 âm tiết</text>
          <text x="100" y="32" textAnchor="middle" className="text-[9px] font-bold fill-slate-800">Cân nhắc cặp từ tương đồng</text>
        </svg>
      );
    case 'diphthongs_chart':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <circle cx="50" cy="80" r="22" fill="#fdf2f8" stroke="#db2777" strokeWidth="1.5" />
          <text x="50" y="84" textAnchor="middle" className="text-[9px] font-black fill-pink-700">Âm đầu</text>
          
          <path d="M80,80 L115,80" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="3,2" />
          <polygon points="125,80 115,75 115,85" fill="#ec4899" />
          
          <circle cx="150" cy="80" r="22" fill="#f3e8ff" stroke="#7c3aed" strokeWidth="1.5" />
          <text x="150" y="84" textAnchor="middle" className="text-[9px] font-black fill-purple-700">Âm cuối</text>
          <text x="100" y="132" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">Lướt mượt mà liên tục</text>
        </svg>
      );
    case 'triphthongs_chart':
      return (
        <svg viewBox="0 0 200 160" className="w-full h-auto rounded-lg">
          <path d="M20,100 Q60,30 100,80 T180,110" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          
          <circle cx="45" cy="72" r="14" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" />
          <text x="45" y="75" textAnchor="middle" className="text-[8px] font-bold fill-amber-800">Âm 1</text>

          <circle cx="100" cy="78" r="14" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" />
          <text x="100" y="81" textAnchor="middle" className="text-[8px] font-bold fill-amber-800">Âm 2</text>

          <circle cx="155" cy="98" r="14" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.2" />
          <text x="155" y="101" textAnchor="middle" className="text-[8px] font-bold fill-red-800">/ə/</text>
          <text x="100" y="132" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">Uốn luồng hơi 3 nhịp liên tục</text>
        </svg>
      );
    default:
      return null;
  }
};

export const ClassPronunciationModule: React.FC<ClassPronunciationModuleProps> = ({
  classGroup,
  students,
  currentUser,
  showToast,
  standalonePortalMode = false,
}) => {
  // Top Level Navigation Tabs
  const [topTab, setTopTab] = useState<'ipa_chart' | 'idv_lessons' | 'tongue_twisters'>('idv_lessons');
  const [selectedDifficultSoundId, setSelectedDifficultSoundId] = useState<string>('vn-common-errors');

  // Sub Mode Switcher: Mode 1 (English Reading) vs Mode 2 (Vietnamese Reflex Translation)
  const [subPracticeMode, setSubPracticeMode] = useState<'english_reading' | 'vietnamese_reflex'>('english_reading');

  // Audio Playback Speed (0.75x | 0.85x | 1.0x)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.85);

  // Toggle Show IPA Phonetics (Default false: user clicks "Hiện IPA" to reveal)
  const [showIPAOverlay, setShowIPAOverlay] = useState<boolean>(false);

  // State to track revealed English answers in Mode 2 (Reflex Translation)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Real-time audio playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSpeakingChunkId, setActiveSpeakingChunkId] = useState<string | null>(null);

  // Audio element reference for playing high-quality Kore voice
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Available high quality voices on client
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('kore_ai');

  // Mode: Teacher Dashboard vs Student Practice View
  const [activeViewMode, setActiveViewMode] = useState<'teacher' | 'student'>(
    standalonePortalMode ? 'student' : 'teacher'
  );

  // Student Login State
  const [studentLoginName, setStudentLoginName] = useState('');
  const [studentLoginClassCode, setStudentLoginClassCode] = useState(classGroup?.code || classGroup?.name || '');
  const [activeStudent, setActiveStudent] = useState<{ name: string; classCode: string; studentId?: string } | null>(null);

  // Practice timer for active student (in seconds)
  const [practiceTimeSeconds, setPracticeTimeSeconds] = useState(0);
  const practiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lessons
  const [lessons] = useState<RichSpeechLesson[]>(PRE_IELTS_LESSONS);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(PRE_IELTS_LESSONS[0].id);
  const [sessions, setSessions] = useState<PronunciationSession[]>([]);

  // MediaRecorder states for audio recording and listening back
  const [isRecording, setIsRecording] = useState(false);
  const [isSimulatedRecording, setIsSimulatedRecording] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{ blobUrl: string; durationSeconds: number; recordedAt: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentRecordingDuration, setCurrentRecordingDuration] = useState(0);

  // Safe notification helper avoiding window.alert
  const notify = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (showToast) {
      showToast(msg, type);
    }
  };

  // Copy link toast status
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Teacher View States
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<{
    studentName: string;
    totalMinutes: number;
    sessions: PronunciationSession[];
  } | null>(null);

  // Active Lesson Object
  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === selectedLessonId) || lessons[0];
  }, [lessons, selectedLessonId]);

  const currentIndex = useMemo(() => {
    const idx = lessons.findIndex((l) => l.id === selectedLessonId);
    return idx >= 0 ? idx : 0;
  }, [lessons, selectedLessonId]);

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Keep-alive timer ref for speechSynthesis to prevent Chrome cutting off after 15s
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load available system voices locally on client
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const englishVoices = all.filter((v) => v.lang.startsWith('en'));

      if (englishVoices.length > 0) {
        setAvailableVoices(englishVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };
  }, []);

  // Fetch persistent sessions from storage API
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/storage/pronunciationSessions`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setSessions(json.data);
          }
        }
      } catch (e) {
        console.warn('Could not fetch pronunciation sessions from storage:', e);
      }
    };
    fetchSessions();
  }, [classGroup?.id]);

  // Keep class code updated in student login input
  useEffect(() => {
    if (classGroup) {
      setStudentLoginClassCode(classGroup.code || classGroup.name);
    }
  }, [classGroup]);

  // Background prefetch all audio for the current lesson for instant 0s playback
  useEffect(() => {
    if (!currentLesson) return;
    const textsToPrefetch: string[] = [
      currentLesson.fullText,
    ];
    currentLesson.chunkRows.forEach((row) => {
      row.pills.forEach((pill) => {
        const pillText = pill.words.map((w) => w.text).join(' ');
        if (pillText) textsToPrefetch.push(pillText);
      });
    });

    const prefetchAudio = async () => {
      for (const text of textsToPrefetch) {
        const cleanText = text.trim();
        if (!cleanText || audioBlobCacheRef.current.has(cleanText)) continue;
        try {
          const res = await fetch('/api/ai/tts-kore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleanText, voice: 'Kore' }),
          });
          if (res.ok) {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            audioBlobCacheRef.current.set(cleanText, audioUrl);
          }
        } catch {
          // background prefetch failure ignored
        }
      }
    };

    const timer = setTimeout(() => {
      prefetchAudio();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentLesson?.id]);

  // Timer logic for logged-in practicing student
  useEffect(() => {
    if (activeStudent && activeViewMode === 'student') {
      practiceTimerRef.current = setInterval(() => {
        setPracticeTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (practiceTimerRef.current) clearInterval(practiceTimerRef.current);
    }

    return () => {
      if (practiceTimerRef.current) clearInterval(practiceTimerRef.current);
    };
  }, [activeStudent, activeViewMode]);

  // Pause timer when student leaves tab / switches tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (practiceTimerRef.current) {
          clearInterval(practiceTimerRef.current);
          practiceTimerRef.current = null;
        }
      } else {
        if (activeStudent && activeViewMode === 'student' && !practiceTimerRef.current) {
          practiceTimerRef.current = setInterval(() => {
            setPracticeTimeSeconds((prev) => prev + 1);
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeStudent, activeViewMode]);

  // Periodic sync practice time to server every 30s
  useEffect(() => {
    if (!activeStudent || practiceTimeSeconds === 0) return;

    const interval = setInterval(() => {
      syncStudentSessionToServer();
    }, 30000);

    return () => clearInterval(interval);
  }, [activeStudent, practiceTimeSeconds, recordedAudio]);

  const syncStudentSessionToServer = async () => {
    if (!activeStudent || practiceTimeSeconds === 0) return;

    const roundedMinutes = Math.max(1, Math.round(practiceTimeSeconds / 60));
    const sessionId = `ps-${activeStudent.name.toLowerCase().replace(/\s+/g, '_')}-${activeStudent.classCode}`;

    const newSession: PronunciationSession = {
      id: sessionId,
      studentId: activeStudent.studentId,
      studentName: activeStudent.name,
      classCode: activeStudent.classCode,
      className: classGroup?.name || activeStudent.classCode,
      durationSeconds: practiceTimeSeconds,
      durationMinutes: roundedMinutes,
      sentencesPracticed: recordedAudio ? 1 : 0,
      averageScore: 100,
      attempts: recordedAudio
        ? [
            {
              id: `rec-${Date.now()}`,
              sentenceId: currentLesson.id,
              sentenceText: currentLesson.title,
              recognizedText: 'Đã thu âm bài đọc',
              accuracyScore: 100,
              createdAt: recordedAudio.recordedAt,
            },
          ]
        : [],
      lastPracticedAt: new Date().toISOString(),
    };

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSession;
        return copy;
      }
      return [newSession, ...prev];
    });

    try {
      await fetch(`/api/storage/pronunciationSessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });
    } catch (err) {
      console.warn('Failed to sync pronunciation session:', err);
    }
  };

  // Dedicated Student Practice Portal URL Helper
  const getShareableStudentLink = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const path = window.location.pathname;
    const code = classGroup?.code || classGroup?.name || '';
    return `${origin}${path}?mode=pronunciation&classCode=${encodeURIComponent(code)}`;
  };

  const handleCopyShareableLink = () => {
    const link = getShareableStudentLink();
    navigator.clipboard.writeText(link);
    setIsLinkCopied(true);
    if (showToast) showToast('Đã sao chép link Cổng luyện phát âm riêng cho Học sinh!');
    setTimeout(() => setIsLinkCopied(false), 3000);
  };

  // Student Login Form Submit
  const handleStudentLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentLoginName.trim()) {
      notify('Vui lòng nhập Họ và Tên học sinh!', 'error');
      return;
    }
    if (!studentLoginClassCode.trim()) {
      notify('Vui lòng nhập Mã Lớp!', 'error');
      return;
    }

    const found = students.find(
      (s) => s.name.trim().toLowerCase() === studentLoginName.trim().toLowerCase()
    );

    const loggedIn = {
      name: studentLoginName.trim(),
      classCode: studentLoginClassCode.trim(),
      studentId: found?.id,
    };

    setActiveStudent(loggedIn);
    setActiveViewMode('student');

    const existing = sessions.find(
      (s) => s.studentName.toLowerCase() === loggedIn.name.toLowerCase()
    );
    if (existing) {
      setPracticeTimeSeconds(existing.durationSeconds || 0);
    } else {
      setPracticeTimeSeconds(0);
    }
  };

  // In-memory audio Blob URL cache for instant repeat playback
  const audioBlobCacheRef = useRef<Map<string, string>>(new Map());

  // STOP AUDIO PLAYBACK
  const handleStopAudio = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setActiveSpeakingChunkId(null);
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
  };

  // HIGH QUALITY KORE VOICE & SYSTEM TTS ENGINE
  const handlePlayTTS = async (text: string, chunkId?: string, customRate?: number) => {
    // Cancel current playback
    handleStopAudio();

    if (chunkId) {
      setActiveSpeakingChunkId(chunkId);
    }
    setIsPlayingAudio(true);

    const cleanText = text.trim();
    const effectiveSpeed = customRate || playbackSpeed;

    // IF KORE VOICE IS SELECTED (DEFAULT & RECOMMENDED)
    if (selectedVoiceName === 'kore_ai') {
      try {
        let audioUrl = audioBlobCacheRef.current.get(cleanText);

        if (!audioUrl) {
          const res = await fetch('/api/ai/tts-kore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleanText, voice: 'Kore' }),
          });

          if (res.ok) {
            const blob = await res.blob();
            audioUrl = URL.createObjectURL(blob);
            audioBlobCacheRef.current.set(cleanText, audioUrl);
          }
        }

        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.playbackRate = effectiveSpeed;
          activeAudioRef.current = audio;

          audio.onended = () => {
            setIsPlayingAudio(false);
            setActiveSpeakingChunkId(null);
            activeAudioRef.current = null;
          };

          audio.onerror = () => {
            // Fallback to local speech synthesis if audio playback failed
            playWithBrowserSpeech(cleanText, effectiveSpeed);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('[Audio Playback] Kore audio load error, fallback to browser speech:', err);
      }
    }

    // FALLBACK TO BROWSER SYSTEM VOICE (OR IF USER SELECTED A LOCAL SYSTEM VOICE)
    playWithBrowserSpeech(cleanText, effectiveSpeed);
  };

  const playWithBrowserSpeech = (cleanText: string, effectiveSpeed: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(false);
      setActiveSpeakingChunkId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = effectiveSpeed;
    utterance.pitch = 1.0;

    if (selectedVoiceName && selectedVoiceName !== 'kore_ai' && availableVoices.length > 0) {
      const match = availableVoices.find((v) => v.name === selectedVoiceName);
      if (match) utterance.voice = match;
    } else if (availableVoices.length > 0) {
      const preferred =
        availableVoices.find((v) => v.name.includes('Natural') || v.name.includes('Google US English')) ||
        availableVoices.find((v) => v.name.includes('Samantha') || v.name.includes('Aria')) ||
        availableVoices.find((v) => v.lang === 'en-US') ||
        availableVoices[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setActiveSpeakingChunkId(null);
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setActiveSpeakingChunkId(null);
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    };

    keepAliveIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    window.speechSynthesis.speak(utterance);
  };

  // Audio Recording (MediaRecorder API with fallback practice timer if microphone is restricted in iframe)
  const handleStartRecording = async () => {
    setMicPermissionError(null);

    // If browser doesn't support getUserMedia or running in an insecure context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSimulatedRecording(true);
      setIsRecording(true);
      setCurrentRecordingDuration(0);
      setMicPermissionError(
        'Trình duyệt hoặc khung xem trước (iframe) đang hạn chế truy cập Micro. Hệ thống đã chuyển sang chế độ bấm giờ luyện đọc thực hành!'
      );
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setCurrentRecordingDuration((prev) => prev + 1);
      }, 1000);
      notify('Đang bấm giờ bài luyện nói thực hành...', 'info');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);

        setRecordedAudio({
          blobUrl,
          durationSeconds: currentRecordingDuration,
          recordedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });

        stream.getTracks().forEach((track) => track.stop());
        setTimeout(() => syncStudentSessionToServer(), 500);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(200);

      setIsRecording(true);
      setIsSimulatedRecording(false);
      setCurrentRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setCurrentRecordingDuration((prev) => prev + 1);
      }, 1000);

      notify('Đang thu âm qua Micro... Hãy đọc to và rõ ràng từng cụm từ!', 'info');
    } catch (err: any) {
      console.warn('Microphone permission or context limitation:', err?.message || err);

      // Fallback: Activate simulated practice timer so user can still practice without error
      setIsSimulatedRecording(true);
      setIsRecording(true);
      setCurrentRecordingDuration(0);
      setMicPermissionError(
        'Quyền Micro bị hạn chế trong khung xem trước (iFrame) hoặc chưa được cấp phép. Hệ thống đã tự động chuyển sang chế độ bấm giờ luyện đọc thực hành!'
      );

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setCurrentRecordingDuration((prev) => prev + 1);
      }, 1000);

      notify('Đang bấm giờ luyện đọc thực hành...', 'info');
    }
  };

  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording && !isSimulatedRecording) {
      try {
        mediaRecorderRef.current.stop();
        notify('Đã dừng và lưu bản ghi âm bài đọc!', 'success');
      } catch (e) {
        console.warn('MediaRecorder stop warning:', e);
      }
    } else if (isSimulatedRecording) {
      // Record simulated practice completion
      setRecordedAudio({
        blobUrl: '',
        durationSeconds: currentRecordingDuration,
        recordedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      });
      notify(`Đã hoàn thành phiên luyện đọc ${currentRecordingDuration}s!`, 'success');
      setTimeout(() => syncStudentSessionToServer(), 500);
    }

    setIsRecording(false);
    setIsSimulatedRecording(false);
  };

  // Toggle reveal answer in Reflex Translation mode
  const toggleAnswerReveal = (id: string) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Teacher student stats
  const studentStats = useMemo(() => {
    return students.map((st) => {
      const matches = sessions.filter(
        (s) => s.studentName.trim().toLowerCase() === st.name.trim().toLowerCase()
      );

      const totalSeconds = matches.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
      const totalMinutes = Math.round(totalSeconds / 60);
      const totalRecorded = matches.reduce((acc, curr) => acc + (curr.sentencesPracticed || 0), 0);

      return {
        student: st,
        totalSeconds,
        totalMinutes,
        totalRecorded,
        sessions: matches,
      };
    });
  }, [students, sessions]);

  const filteredTeacherStudents = useMemo(() => {
    if (!teacherSearchQuery.trim()) return studentStats;
    const q = teacherSearchQuery.toLowerCase();
    return studentStats.filter(
      (item) =>
        item.student.name.toLowerCase().includes(q) ||
        (item.student.code || '').toLowerCase().includes(q)
    );
  }, [studentStats, teacherSearchQuery]);

  return (
    <div className="space-y-6 font-sans">
      {activeViewMode === 'student' && !activeStudent && (
        <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-3xl font-black shadow-inner border border-indigo-200">
            🎓
          </div>
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200 uppercase tracking-widest">
              Xác Thực Học Viên Lớp {classGroup?.name || classGroup?.code || 'IDV'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Vào Lớp Luyện Phát Âm
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Học sinh vui lòng nhập đúng <strong>Họ và Tên</strong> và <strong>Mã Lớp</strong> của mình (ví dụ: <span className="text-indigo-600 font-bold">73</span>, <span className="text-indigo-600 font-bold">74</span>) để tham gia lớp và hiển thị giao diện luyện tập.
            </p>
          </div>

          <form onSubmit={handleStudentLogin} className="space-y-4 text-left pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Họ và Tên học sinh:</label>
              <input
                type="text"
                placeholder="Nhập họ và tên đầy đủ..."
                value={studentLoginName}
                onChange={(e) => setStudentLoginName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Mã Lớp (hoặc Số Lớp):</label>
              <input
                type="text"
                placeholder="Ví dụ: 73, 74..."
                value={studentLoginClassCode}
                onChange={(e) => setStudentLoginClassCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀 Vào Lớp Luyện Phát Âm</span>
            </button>
          </form>
        </div>
      )}

      {(activeViewMode === 'teacher' || (activeViewMode === 'student' && activeStudent)) && (
        <>
      {/* TOP HEADER & TOP NAVIGATION TABS */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-2 sm:p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setTopTab('ipa_chart')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              topTab === 'ipa_chart'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 font-extrabold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📖 Bảng 44 Âm IPA</span>
          </button>

          <button
            onClick={() => setTopTab('idv_lessons')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              topTab === 'idv_lessons'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-extrabold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📄 Luyện bài nói IDV ({lessons.length} bài)</span>
          </button>

          <button
            onClick={() => setTopTab('tongue_twisters')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              topTab === 'tongue_twisters'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600 font-extrabold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📘 Cẩm Nang Âm Khó (Mẹo & 30 Từ)</span>
          </button>
        </div>

        {/* Share Link & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {!standalonePortalMode && activeViewMode === 'teacher' && (
            <button
              onClick={handleCopyShareableLink}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isLinkCopied ? 'Đã chép link!' : '🔗 Copy Link Cho Học Sinh'}</span>
            </button>
          )}

          {!standalonePortalMode && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveViewMode('teacher')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'teacher'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giáo viên
              </button>
              <button
                onClick={() => {
                  setActiveViewMode('student');
                  if (!activeStudent && students.length > 0) {
                    setStudentLoginName(students[0].name);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'student'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học sinh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STUDENT LOGIN PANEL (NAME & CLASS CODE) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-400/30 shrink-0">
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Đăng nhập học sinh luyện tập:
              </div>
              {activeStudent ? (
                <div className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400">● Đang luyện:</span>
                  <span className="text-amber-300">{activeStudent.name}</span>
                  <span className="text-xs font-normal text-slate-300">(Lớp: {activeStudent.classCode})</span>
                </div>
              ) : (
                <div className="text-xs text-slate-300 mt-0.5">
                  Nhập Họ Tên & Mã Lớp bên dưới để bắt đầu luyện đọc và bấm thu âm.
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleStudentLogin} className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Họ và Tên học sinh..."
              value={studentLoginName}
              onChange={(e) => setStudentLoginName(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            />
            <input
              type="text"
              placeholder="Mã Lớp..."
              value={studentLoginClassCode}
              onChange={(e) => setStudentLoginClassCode(e.target.value)}
              className="w-full sm:w-28 px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/40 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              Vào Lớp Luyện Phát Âm
            </button>
            {activeStudent && (
              <button
                type="button"
                onClick={() => {
                  setActiveStudent(null);
                  setPracticeTimeSeconds(0);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
              >
                Thoát
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 2: LUYỆN BÀI NÓI IDV - WITH DUAL MODE SWITCHER (ENGLISH vs REFLEX)    */}
      {/* ========================================================================= */}
      {topTab === 'idv_lessons' && activeViewMode === 'student' && (
        <div className="space-y-6">
          {/* DUAL MODE SWITCHER PILLS */}
          <div className="p-2 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-2 shadow-2xs">
            <button
              onClick={() => setSubPracticeMode('english_reading')}
              className={`w-full sm:w-auto flex-1 py-3 px-5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                subPracticeMode === 'english_reading'
                  ? 'bg-white text-blue-700 shadow-md border border-blue-200 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>📖 Chế độ 1: Đọc & Luyện phát âm (English)</span>
            </button>

            <button
              onClick={() => setSubPracticeMode('vietnamese_reflex')}
              className={`w-full sm:w-auto flex-1 py-3 px-5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                subPracticeMode === 'vietnamese_reflex'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Languages className="w-4 h-4 text-amber-300" />
              <span>💬 Chế độ 2: Dịch nói phản xạ (Vietnamese)</span>
            </button>
          </div>

          {/* Lesson Selector Dropdown, Practice Timer, & Audio Voice Engine Info */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thời gian luyện tập bài đọc:
                </div>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {Math.floor(practiceTimeSeconds / 60)} phút {practiceTimeSeconds % 60} giây
                </div>
              </div>
            </div>

            {/* Lesson Selector with Stepper Buttons */}
            <div className="flex-1 max-w-lg">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Chọn bài luyện nói ({lessons.length} bài PRE IELTS):
                </label>
                <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Bài {currentIndex + 1} / {lessons.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!prevLesson}
                  onClick={() => {
                    if (prevLesson) {
                      handleStopAudio();
                      setSelectedLessonId(prevLesson.id);
                    }
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    prevLesson
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-2xs'
                      : 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                  title="Bài trước"
                >
                  ◀
                </button>
                <select
                  value={selectedLessonId}
                  onChange={(e) => {
                    handleStopAudio();
                    setSelectedLessonId(e.target.value);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      [{l.topicGroup}] {l.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!nextLesson}
                  onClick={() => {
                    if (nextLesson) {
                      handleStopAudio();
                      setSelectedLessonId(nextLesson.id);
                    }
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    nextLesson
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-2xs'
                      : 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                  title="Bài tiếp theo"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Voice Engine Picker */}
            <div className="w-full lg:w-auto">
              <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>Giọng đọc bản ngữ:</span>
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  handleStopAudio();
                  setSelectedVoiceName(e.target.value);
                }}
                className="w-full lg:w-64 px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-300 text-xs font-black text-blue-950 focus:outline-none"
              >
                <option value="kore_ai">✨ Giọng Kore Chuẩn Xịn (Bản ngữ US)</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    🎙️ {v.name.replace(/Microsoft|Google|Apple|Desktop|Online/gi, '').trim()} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* MODE 1: ENGLISH READING & PRONUNCIATION                               */}
          {/* ===================================================================== */}
          {subPracticeMode === 'english_reading' && (
            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              {/* TOP AUDIO CONTROLS & SPEED RATE SELECTOR */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-black text-white">
                      SƠ ĐỒ NGẮT CỤM & NHỊP (CHUNKING GUIDE)
                    </span>
                    <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      Giọng Kore Chuẩn Bản Ngữ
                    </span>
                  </div>

                  {/* Playback Speed Controls */}
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-xl border border-white/10 text-xs font-bold">
                    <span className="text-slate-400">TỐC ĐỘ:</span>
                    <button
                      onClick={() => setPlaybackSpeed(0.75)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${playbackSpeed === 0.75 ? 'bg-blue-600 text-white font-black' : 'text-slate-300 hover:text-white'}`}
                    >
                      0.75x
                    </button>
                    <button
                      onClick={() => setPlaybackSpeed(0.85)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${playbackSpeed === 0.85 ? 'bg-blue-600 text-white font-black' : 'text-slate-300 hover:text-white'}`}
                    >
                      0.85x
                    </button>
                    <button
                      onClick={() => setPlaybackSpeed(1.0)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${playbackSpeed === 1.0 ? 'bg-blue-600 text-white font-black' : 'text-slate-300 hover:text-white'}`}
                    >
                      1.0x
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  {/* Nghe toàn bài / Dừng nghe */}
                  {!isPlayingAudio ? (
                    <button
                      onClick={() => handlePlayTTS(currentLesson.fullText)}
                      className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>▶ Nghe Toàn Bài</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopAudio}
                      className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>⏹ Dừng Nghe</span>
                    </button>
                  )}

                  {/* Thu âm / Dừng thu âm */}
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>🎙️ Bấm Để Thu Âm</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 animate-pulse cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>⏹️ Dừng Thu Âm ({currentRecordingDuration}s)</span>
                    </button>
                  )}

                  {/* Toggle IPA Overlay */}
                  <button
                    onClick={() => setShowIPAOverlay(!showIPAOverlay)}
                    className={`px-4 sm:px-5 py-3 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer border ${
                      showIPAOverlay
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                    }`}
                    title={showIPAOverlay ? 'Bấm để ẩn phiên âm IPA' : 'Bấm để hiện phiên âm IPA cho từng cụm và toàn bài'}
                  >
                    <span className="font-mono text-sm font-black">/aɪ.piː.eɪ/</span>
                    <span>{showIPAOverlay ? 'Ẩn Phiên Âm IPA' : 'Hiện Phiên Âm IPA'}</span>
                  </button>
                </div>

                {/* Microphone Permission Notice Banner */}
                {micPermissionError && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 text-sm leading-none shrink-0 mt-0.5">⚠️</span>
                      <div className="space-y-1">
                        <p className="font-bold text-amber-100">{micPermissionError}</p>
                        <p className="text-[11px] text-amber-300/85 leading-relaxed">
                          👉 <strong>Cách bật Micro:</strong> Nhấp vào biểu tượng 🔒 hoặc ⚙️ trên thanh địa chỉ URL của trình duyệt ➔ Chọn <strong>Cho phép Micro (Allow)</strong> và tải lại trang.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMicPermissionError(null)}
                      className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      ✕ Đóng
                    </button>
                  </div>
                )}

                {/* Recorded Audio Player / Session Tracker */}
                {recordedAudio && (
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-emerald-500/40">
                    <span className="text-xs font-bold text-emerald-300 shrink-0 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{recordedAudio.blobUrl ? 'Bản ghi âm của bạn:' : 'Kết quả thực hành:'}</span>
                    </span>
                    {recordedAudio.blobUrl ? (
                      <audio controls src={recordedAudio.blobUrl} className="w-full rounded-lg" />
                    ) : (
                      <div className="text-xs text-emerald-300 font-semibold flex items-center gap-2">
                        <span>⏱️ Đã ghi nhận phiên đọc <strong>{recordedAudio.durationSeconds}s</strong> lúc {recordedAudio.recordedAt}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 1. GHI CHÚ TRỌNG ÂM CÂU BANNER */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-slate-800 text-xs space-y-2">
                <div className="font-extrabold text-amber-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[11px]">
                    📌
                  </span>
                  <span>GHI CHÚ TRỌNG ÂM CÂU & NGẮT NHỊP (SENTENCE STRESS & CHUNKING):</span>
                </div>
                <ul className="space-y-1.5 pl-2 text-[12px] leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold shrink-0">•</span>
                    <span>
                      <strong className="font-black text-slate-950 bg-white px-2 py-0.5 rounded border border-amber-300 text-sm">
                        CHỮ IN ĐẬM
                      </strong>{' '}
                      là Từ nội dung ({currentLesson.stressNote.contentWordsNote}) ➔{' '}
                      <span className="text-amber-900 font-bold">
                        Nói TO, RÕ và NHẤN TRỌNG ÂM.
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold shrink-0">•</span>
                    <span>
                      <span className="font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-amber-300 text-xs">
                        chữ nhỏ không nhấn
                      </span>{' '}
                      là Từ chức năng ({currentLesson.stressNote.functionWordsNote}) ➔{' '}
                      <span className="text-amber-900 font-bold">
                        Đọc LƯỚT NHANH, nhẹ nhàng và tự nhiên.
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold shrink-0">•</span>
                    <span>
                      <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        //
                      </span>{' '}
                      là Dấu dừng nghỉ hơi ngắn khi kết thúc câu.
                    </span>
                  </li>
                </ul>
              </div>

              {/* 2. SENTENCE CHUNK CARDS WITH REAL-TIME AUDIO PLAYBACK ON CLICK */}
              <div className="space-y-4 py-3 font-['Plus_Jakarta_Sans',sans-serif]">
                {currentLesson.chunkRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                    {row.pills.map((pill) => {
                      const isChunkActive = activeSpeakingChunkId === pill.id;
                      const phrase = pill.words.map((w) => w.text).join(' ');

                      return (
                        <div key={pill.id} className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => handlePlayTTS(phrase, pill.id)}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border transition-all active:scale-98 cursor-pointer text-left flex flex-col items-start gap-0.5 ${
                              isChunkActive
                                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/50 shadow-md scale-102'
                                : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-sm'
                            }`}
                            title="Bấm để nghe phát âm riêng cụm từ này"
                          >
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              {pill.words.map((w, wIdx) => (
                                <span
                                  key={wIdx}
                                  className={
                                    w.bold
                                      ? 'font-black text-slate-950 text-sm sm:text-base md:text-[17px] leading-snug tracking-tight'
                                      : 'font-semibold text-slate-800 text-xs sm:text-[13px] md:text-sm leading-snug tracking-normal'
                                  }
                                >
                                  {w.text}
                                </span>
                              ))}
                            </div>

                            {/* Subtitle IPA Transcription on Chunk Card */}
                            {showIPAOverlay && pill.ipa && (
                              <div className="text-[11px] sm:text-xs font-mono font-bold text-emerald-800 tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300/80 shadow-2xs mt-0.5 select-all">
                                {pill.ipa}
                              </div>
                            )}
                          </button>

                          {pill.isEndSentencePause && (
                            <span className="text-blue-500 font-extrabold text-base sm:text-lg ml-2 mr-0.5 select-none tracking-wider self-center leading-none">
                              //
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Hint Note */}
              <div className="text-[11px] text-blue-600 font-bold flex items-center justify-between gap-1.5 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                <span>💡 Mẹo: Nhấp trực tiếp vào từng ô cụm từ để nghe phát âm mẫu chuẩn xác không độ trễ.</span>
                <span className="text-slate-500 font-normal">Nghe lại nhiều lần không giới hạn</span>
              </div>

              {/* 3. NGỮ ĐIỆU LÊN/XUỐNG (INTONATION GUIDE) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span className="text-blue-600 font-bold">↗↘</span>
                  <span>Ngữ điệu lên/xuống (Intonation Guide)</span>
                </div>

                <p className="text-xs sm:text-sm font-medium italic text-slate-700 leading-relaxed font-sans pt-1">
                  {currentLesson.intonationText}
                </p>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex flex-wrap gap-3">
                  <span>↗: Lên giọng ở cuối trạng ngữ, câu hỏi hoặc khi thông tin chưa kết thúc.</span>
                  <span>↘: Xuống giọng dứt khoát khi hết câu.</span>
                </div>
              </div>

              {/* 4. HƯỚNG DẪN NỐI ÂM (LINKING GUIDE) */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-950 space-y-2.5">
                <div className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                  <span>🔗 Hướng dẫn nối âm (Linking Guide - chỉ nối với nguyên âm)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentLesson.linkingRules.map((rule, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePlayTTS(rule.phrase.replace('_', ' '))}
                      className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 shadow-2xs hover:border-purple-400 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-purple-900">{rule.phrase}</span>{' '}
                      <span className="text-purple-600">({rule.ipa})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. PHIÊN ÂM IPA QUỐC TẾ (IPA PHONETICS & CONNECTED SPEECH) */}
              {showIPAOverlay && (
                <div className="space-y-4">
                  {currentLesson.fullIpaText && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-emerald-950 flex items-center gap-2 uppercase tracking-wide">
                          <span className="font-mono text-base font-black text-emerald-700">/IPA/</span>
                          <span>Bản Phiên Âm Quốc Tế Toàn Bài (Connected Speech IPA):</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          Chuẩn Oxford / Cambridge
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-emerald-200 font-mono text-xs sm:text-sm text-emerald-950 leading-loose tracking-wide whitespace-pre-line select-all shadow-inner">
                        {currentLesson.fullIpaText}
                      </div>
                      <div className="text-[11px] text-emerald-800 italic">
                        * Ghi chú: Dấu <strong className="font-black">ˈ</strong> đặt trước trọng âm chính, dấu <strong className="font-black">//</strong> dừng nghỉ hơi giữa các câu.
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2.5">
                    <div className="text-xs font-black text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>🌱 Phiên âm các từ khóa trọng tâm (Key Phonetics):</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-normal">Nhấp vào từ để nghe phát âm</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      {currentLesson.keyPhonetics.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePlayTTS(item.word)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-xs text-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Bấm để nghe phát âm từ này"
                        >
                          <span className="font-bold text-emerald-950">{item.word}</span>
                          <span className="text-emerald-700 font-semibold">{item.ipa}</span>
                          <Volume2 className="w-3 h-3 text-emerald-500 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* MODE 2: VIETNAMESE REFLEX TRANSLATION (DỊCH NÓI PHẢN XẠ)              */}
          {/* ===================================================================== */}
          {subPracticeMode === 'vietnamese_reflex' && (
            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white space-y-2 shadow-md">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
                  <Languages className="w-5 h-5" />
                  <span>HƯỚNG DẪN LUYỆN DỊCH NÓI PHẢN XẠ NGUYÊN BẢN (REFLEX TRANSLATION):</span>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  Nhìn vào cụm câu Tiếng Việt dưới đây, suy nghĩ và <strong>NÓI TO THÀNH TIẾNG</strong> bằng Tiếng Anh lập tức. Sau đó bấm nút <strong>"👁️ Hiện đáp án Tiếng Anh"</strong> để kiểm tra phản xạ và phát âm của mình!
                </p>
              </div>

              {/* Full Paragraph Translation Card */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-semibold leading-relaxed">
                <div className="font-bold text-amber-900 mb-1">Dịch toàn bài (Đọc & phản xạ toàn bài):</div>
                <p>{currentLesson.fullVietnameseText}</p>
              </div>

              {/* Vietnamese Chunk Reflex Cards Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Luyện phản xạ từng cụm câu:
                </h4>

                {currentLesson.chunkRows.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {row.pills.map((pill) => {
                      const isRevealed = revealedAnswers[pill.id];
                      const engSentence = pill.words.map((w) => w.text).join(' ');

                      return (
                        <div
                          key={pill.id}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-black text-slate-900 leading-snug">
                              🇻🇳 "{pill.vietnameseText}"
                            </div>

                            <button
                              onClick={() => toggleAnswerReveal(pill.id)}
                              className="px-2.5 py-1 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{isRevealed ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                            </button>
                          </div>

                          {/* Revealed English Answer */}
                          {isRevealed ? (
                            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2.5">
                              <div className="flex flex-wrap items-baseline gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                                <span className="text-sm font-bold text-indigo-500 mr-1">🇬🇧</span>
                                {pill.words.map((w, wIdx) => (
                                  <span
                                    key={wIdx}
                                    className={
                                      w.bold
                                        ? 'font-black text-indigo-950 text-xs sm:text-sm tracking-tight'
                                        : 'font-semibold text-indigo-900/85 text-[11px] sm:text-xs tracking-normal'
                                    }
                                  >
                                    {w.text}
                                  </span>
                                ))}
                              </div>
                              {pill.ipa && (
                                <div className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block shadow-2xs">
                                  {pill.ipa}
                                </div>
                              )}
                              <div>
                                <button
                                  onClick={() => handlePlayTTS(engSentence)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Nghe phát âm chuẩn</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-200/60 border border-dashed border-slate-300 text-center text-slate-500 text-xs italic">
                              Bấm "Hiện đáp án" sau khi bạn đã nói câu tiếng Anh thành tiếng!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1 & TAB 3 RENDERINGS                                                 */}
      {/* ========================================================================= */}
      {topTab === 'ipa_chart' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-lg font-black text-slate-900">📖 Bảng 44 Âm IPA Chuẩn Quốc Tế</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {[...IPA_VOWELS, ...IPA_CONSONANTS].map((item, idx) => (
              <button
                key={idx}
                onClick={() => handlePlayTTS(item.example)}
                className="p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-200 text-center cursor-pointer"
              >
                <div className="text-lg font-black text-indigo-900">/{item.symbol}/</div>
                <div className="text-xs text-slate-600 mt-1">{item.example}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {topTab === 'tongue_twisters' && (() => {
        const activeSound = DIFFICULT_SOUNDS_DATA.find(s => s.id === selectedDifficultSoundId) || DIFFICULT_SOUNDS_DATA[0];
        return (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md">
              <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-400/20">
                  Cẩm Nang Phát Âm
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  🗣️ Chuyên Đề Luyện Âm Khó Chuẩn Bản Xứ
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Tổng hợp 9 nhóm âm, từ vựng và quy tắc phát âm gây trở ngại lớn nhất cho người học Việt Nam. 
                  Hãy chọn một chuyên đề bên dưới để xem hướng dẫn khẩu hình chuẩn và luyện nói 30 từ mẫu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Menu list (Image 1 style) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">CẨM NANG ÂM KHÓ</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CHỌN CHUYÊN ĐỀ RÈN LUYỆN</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {DIFFICULT_SOUNDS_DATA.map((item) => {
                      const isActive = item.id === selectedDifficultSoundId;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedDifficultSoundId(item.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-400/30 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className={`text-xs font-black leading-tight ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                              {item.title}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium leading-normal">
                              {item.subtitle}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 border uppercase font-mono ${
                            isActive
                              ? 'bg-indigo-200/50 text-indigo-800 border-indigo-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {item.symbol === 'Common Errors' ? 'Errors' : item.symbol}
                          </span>
                        </button>
                      );
                    })}

                    {/* Tongue Twisters inside the menu for extra fun */}
                    <div className="pt-3 border-t border-slate-100 mt-3 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                        🎁 Thử thách thêm (Tongue Twisters)
                      </span>
                      {TONGUE_TWISTERS.map((item, idx) => (
                        <div key={item.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-amber-800">
                              {item.title}
                            </span>
                            <span className="text-[9px] font-mono text-amber-700 font-bold bg-amber-100 px-1 py-0.5 rounded">
                              Líu lưỡi #{idx+1}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 italic leading-snug">
                            "{item.text}"
                          </p>
                          <button
                            onClick={() => handlePlayTTS(item.text)}
                            className="w-full py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] transition-colors cursor-pointer"
                          >
                            ▶ Nghe Thử Thách
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>

              {/* Right Column: Guidelines and Word Practicing Grid (Image 2 style) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Guidelines Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Left diagram */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">
                        SƠ ĐỒ CẮT DỌC KHẨU HÌNH CHUẨN
                      </span>
                      <div className="w-full max-w-[150px] sm:max-w-[170px] bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                        <SpeechDiagramRenderer type={activeSound.diagram.type} labels={activeSound.diagram.labels} />
                      </div>
                      <span className="text-[9px] text-slate-400 italic text-center mt-2 leading-relaxed">
                        {activeSound.diagram.desc}
                      </span>
                    </div>

                    {/* Right instructions */}
                    <div className="md:col-span-7 space-y-3.5">
                      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        ⚡ MẸO CHUẨN NGỮ ÂM BẢN XỨ
                      </span>
                      <h4 className="text-lg font-black text-slate-900 leading-tight">
                        {activeSound.guideTitle}
                      </h4>
                      <div className="space-y-2.5">
                        {activeSound.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Word practice grid */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">NỘI DUNG THỰC HÀNH MẪU</h4>
                      <p className="text-[10px] text-slate-500 font-medium">BẤM CHỌN MỘT TỪ ĐỂ NGHE PHÁT ÂM CHUẨN VÀ PHẢN XẠ ĐỌC THEO</p>
                    </div>
                    <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 self-start sm:self-center">
                      30 bài mẫu
                    </span>
                  </div>

                  {activeSound.id === 'image-vs-imagine' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: Math.ceil(activeSound.words.length / 2) }).map((_, pairIdx) => {
                        const w1 = activeSound.words[pairIdx * 2];
                        const w2 = activeSound.words[pairIdx * 2 + 1];
                        if (!w1) return null;
                        return (
                          <div key={pairIdx} className="p-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 flex items-center justify-between gap-2 shadow-2xs">
                            {/* Word 1 */}
                            <button
                              onClick={() => handlePlayTTS(w1.text)}
                              className="group flex-1 p-2 rounded-lg hover:bg-indigo-100/60 text-left transition-all flex items-center gap-2 cursor-pointer"
                              title={`Bấm để nghe ${w1.text}`}
                            >
                              <span className="w-6 h-6 rounded-md bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                                <Volume2 className="w-3 h-3" />
                              </span>
                              <div className="overflow-hidden">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-black text-slate-900 text-xs group-hover:text-indigo-950">{w1.text}</span>
                                  <span className="text-[9px] font-mono font-bold text-emerald-800">/{w1.ipa}/</span>
                                </div>
                                <p className="text-[9px] text-slate-500 truncate">{w1.meaning}</p>
                              </div>
                            </button>

                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md shrink-0">VS</span>

                            {/* Word 2 */}
                            {w2 ? (
                              <button
                                onClick={() => handlePlayTTS(w2.text)}
                                className="group flex-1 p-2 rounded-lg hover:bg-indigo-100/60 text-left transition-all flex items-center gap-2 cursor-pointer"
                                title={`Bấm để nghe ${w2.text}`}
                              >
                                <span className="w-6 h-6 rounded-md bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                                  <Volume2 className="w-3 h-3" />
                                </span>
                                <div className="overflow-hidden">
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-black text-slate-900 text-xs group-hover:text-indigo-950">{w2.text}</span>
                                    <span className="text-[9px] font-mono font-bold text-emerald-800">/{w2.ipa}/</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 truncate">{w2.meaning}</p>
                                </div>
                              </button>
                            ) : <div className="flex-1" />}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {activeSound.words.map((word, wIdx) => (
                        <button
                          key={wIdx}
                          onClick={() => handlePlayTTS(word.text)}
                          className="group p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all flex items-start gap-2.5 cursor-pointer hover:shadow-2xs"
                          title={`Bấm để nghe phát âm từ "${word.text}"`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                            <Volume2 className="w-3.5 h-3.5" />
                          </span>
                          <div className="space-y-1 overflow-hidden">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-black text-slate-900 text-sm leading-none group-hover:text-indigo-950">
                                {word.text}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-800 tracking-wide">
                                /{word.ipa}/
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-none truncate group-hover:text-slate-700">
                              {word.meaning}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* TEACHER DASHBOARD */}
      {activeViewMode === 'teacher' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900">
            Thống Kê Số Phút Luyện Phát Âm Của Lớp {classGroup?.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Họ và Tên Học Viên</th>
                  <th className="py-3 px-4 text-center">Thời Gian Luyện (Phút)</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeacherStudents.map((item, idx) => (
                  <tr key={item.student.id}>
                    <td className="py-3 px-4 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.student.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-black border border-amber-200">
                        {item.totalMinutes} Phút
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          setSelectedStudentForDetail({
                            studentName: item.student.name,
                            totalMinutes: item.totalMinutes,
                            sessions: item.sessions,
                          })
                        }
                        className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold cursor-pointer"
                      >
                        Xem nhật ký
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR TEACHER */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Nhật ký: {selectedStudentForDetail.studentName}
              </h3>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                <strong>Tổng số phút luyện tập:</strong> {selectedStudentForDetail.totalMinutes} phút
              </div>
              <div>
                <strong>Số lượt ghi nhận:</strong> {selectedStudentForDetail.sessions.length} lần
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentForDetail(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
