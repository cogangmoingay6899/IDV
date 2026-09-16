// Helper for converting raw scores (number of correct questions) to IELTS Band scores

export function getSkillCategory(skill: string): 'listening' | 'reading' | 'writing' | 'speaking' | 'vocab' | 'grammar' | 'other' {
  const lower = (skill || '').toLowerCase();
  if (lower.includes('nghe') || lower.includes('listening')) return 'listening';
  if (lower.includes('đọc') || lower.includes('reading')) return 'reading';
  if (lower.includes('viết') || lower.includes('writing')) return 'writing';
  if (lower.includes('nói') || lower.includes('speaking')) return 'speaking';
  if (lower.includes('từ vựng') || lower.includes('vocab') || lower.includes('quizlet')) return 'vocab';
  if (lower.includes('ngữ pháp') || lower.includes('grammar')) return 'grammar';
  return 'other';
}

export function isQuestionCountSkill(skill: string): boolean {
  const cat = getSkillCategory(skill);
  return cat === 'listening' || cat === 'reading' || cat === 'vocab' || cat === 'grammar';
}

export function convertRawToIeltsBand(
  correctCount: number,
  totalQuestions: number = 40,
  skill: string = 'listening'
): number {
  if (isNaN(correctCount) || correctCount < 0) return 0;
  const total = totalQuestions > 0 ? totalQuestions : 40;
  
  // Normalize to standard 40-question scale if total differs
  let normalizedCorrect = correctCount;
  if (total !== 40) {
    normalizedCorrect = Math.round((correctCount / total) * 40);
  }
  normalizedCorrect = Math.max(0, Math.min(40, normalizedCorrect));

  const cat = getSkillCategory(skill);

  if (cat === 'reading') {
    if (normalizedCorrect >= 39) return 9.0;
    if (normalizedCorrect >= 37) return 8.5;
    if (normalizedCorrect >= 35) return 8.0;
    if (normalizedCorrect >= 33) return 7.5;
    if (normalizedCorrect >= 30) return 7.0;
    if (normalizedCorrect >= 27) return 6.5;
    if (normalizedCorrect >= 23) return 6.0;
    if (normalizedCorrect >= 19) return 5.5;
    if (normalizedCorrect >= 15) return 5.0;
    if (normalizedCorrect >= 13) return 4.5;
    if (normalizedCorrect >= 10) return 4.0;
    if (normalizedCorrect >= 8) return 3.5;
    if (normalizedCorrect >= 6) return 3.0;
    if (normalizedCorrect >= 4) return 2.5;
    return 2.0;
  } else {
    // Listening / Vocab / Grammar standard scale
    if (normalizedCorrect >= 39) return 9.0;
    if (normalizedCorrect >= 37) return 8.5;
    if (normalizedCorrect >= 35) return 8.0;
    if (normalizedCorrect >= 32) return 7.5;
    if (normalizedCorrect >= 30) return 7.0;
    if (normalizedCorrect >= 26) return 6.5;
    if (normalizedCorrect >= 23) return 6.0;
    if (normalizedCorrect >= 18) return 5.5;
    if (normalizedCorrect >= 16) return 5.0;
    if (normalizedCorrect >= 13) return 4.5;
    if (normalizedCorrect >= 10) return 4.0;
    if (normalizedCorrect >= 8) return 3.5;
    if (normalizedCorrect >= 6) return 3.0;
    if (normalizedCorrect >= 4) return 2.5;
    return 2.0;
  }
}
