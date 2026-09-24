// Data model and complete collection of 34+ Speaking Practice Lessons
// extracted from the user's PRE IELTS SPEAKING curriculum.

import { clauseToIPA, getWordIPA } from './ipaDictionary';

export interface PillWord {
  text: string;
  bold: boolean;
}

export interface ChunkPill {
  id: string;
  words: PillWord[];
  vietnameseText: string;
  isEndSentencePause?: boolean;
  ipa?: string;
}

export interface ChunkRow {
  pills: ChunkPill[];
}

export interface RichSpeechLesson {
  id: string;
  topicNumber: number;
  topicGroup: string;
  title: string;
  category: string;
  stressNote: {
    contentWordsNote: string;
    functionWordsNote: string;
  };
  chunkRows: ChunkRow[];
  fullText: string;
  fullVietnameseText: string;
  fullIpaText?: string;
  intonationText: string;
  linkingRules: { phrase: string; ipa: string }[];
  keyPhonetics: { word: string; ipa: string }[];
}

const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'about', 'into', 'over', 'after', 'is', 'am', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'and', 'but',
  'or', 'so', 'as', 'if', 'that', 'this', 'these', 'those', 'my', 'your',
  'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them', 'it', 'we',
  'i', 'you', 'he', 'she', 'they', 'can', 'could', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'than', 'up', 'out',
]);

// Helper to split a clause into words with bold/unstressed distinction
function splitWords(clause: string): PillWord[] {
  const tokens = clause.trim().split(/\s+/).filter(Boolean);
  return tokens.map((token) => {
    // Strip trailing punctuation to check against dictionary
    const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isFunction = FUNCTION_WORDS.has(clean);
    // If it's a number, contraction like I'm, or not a function word -> bold
    const bold = !isFunction || /\d/.test(token) || clean.length > 5;
    return { text: token, bold };
  });
}

interface RawClause {
  en: string;
  vi: string;
  isEnd?: boolean;
}

interface RawLessonDef {
  id: string;
  topicNumber: number;
  topicGroup: string;
  title: string;
  category: string;
  fullText: string;
  fullVietnameseText: string;
  clauses: RawClause[];
  intonationText?: string;
  linkingRules?: { phrase: string; ipa: string }[];
  keyPhonetics?: { word: string; ipa: string }[];
}

function buildLesson(raw: RawLessonDef): RichSpeechLesson {
  // Group clauses into chunk rows (sentences or max 4-5 clauses per row)
  const chunkRows: ChunkRow[] = [];
  let currentRow: ChunkPill[] = [];

  raw.clauses.forEach((c, idx) => {
    const isEnd = c.isEnd ?? /[.!?]$/.test(c.en.trim());
    const words = splitWords(c.en);
    const ipa = clauseToIPA(words);

    currentRow.push({
      id: `${raw.id}-p${idx + 1}`,
      words,
      vietnameseText: c.vi,
      isEndSentencePause: isEnd,
      ipa,
    });

    if (isEnd || currentRow.length >= 5) {
      chunkRows.push({ pills: currentRow });
      currentRow = [];
    }
  });

  if (currentRow.length > 0) {
    chunkRows.push({ pills: currentRow });
  }

  // Full IPA text with pausing slashes '//'
  const fullIpaText = chunkRows
    .map((r) => r.pills.map((p) => p.ipa).join('  ') + (r.pills[r.pills.length - 1]?.isEndSentencePause ? ' //' : ''))
    .join('\n');

  // Generate intonation markers if not manually provided
  const intonation =
    raw.intonationText ||
    raw.fullText
      .replace(/([,;])/g, ' ↗$1')
      .replace(/([.!?])/g, ' ↘$1')
      .replace(/\s+/g, ' ');

  // Generate lesson-specific key phonetics from significant bold words
  const keyPhonetics: { word: string; ipa: string }[] = [];
  if (raw.keyPhonetics && raw.keyPhonetics.length > 0) {
    keyPhonetics.push(...raw.keyPhonetics);
  } else {
    const seenWords = new Set<string>();
    chunkRows.forEach((r) => {
      r.pills.forEach((p) => {
        p.words.forEach((w) => {
          const clean = w.text.toLowerCase().replace(/[^a-z0-9']/g, '');
          if (w.bold && clean.length >= 5 && !seenWords.has(clean) && keyPhonetics.length < 8) {
            seenWords.add(clean);
            const ipa = getWordIPA(clean, true);
            if (ipa) {
              keyPhonetics.push({
                word: w.text.replace(/[^a-zA-Z']/g, ''),
                ipa: `/${ipa}/`,
              });
            }
          }
        });
      });
    });
  }

  return {
    id: raw.id,
    topicNumber: raw.topicNumber,
    topicGroup: raw.topicGroup,
    title: raw.title,
    category: raw.category,
    stressNote: {
      contentWordsNote: 'danh từ, động từ chính, tính từ, trạng từ...',
      functionWordsNote: 'a, the, in, on, to, is, are, of, my...',
    },
    chunkRows,
    fullText: raw.fullText,
    fullVietnameseText: raw.fullVietnameseText,
    fullIpaText,
    intonationText: intonation,
    linkingRules: raw.linkingRules || [
      { phrase: 'and_I', ipa: '/ænd.aɪ/' },
      { phrase: 'is_a', ipa: '/ɪz.ə/' },
      { phrase: 'at_a', ipa: '/æt.ə/' },
    ],
    keyPhonetics,
  };
}

export const ALL_SPEAKING_LESSONS: RichSpeechLesson[] = [
  // =========================================================================
  // LUYỆN ED
  // =========================================================================
  buildLesson({
    id: 'ed-practice-2',
    topicNumber: 0,
    topicGroup: 'LUYỆN PHÁT ÂM ĐUÔI -ED',
    title: 'LUYỆN ED - Practice 2: At the office & Meeting',
    category: 'LUYỆN ED',
    fullText:
      'Yesterday was so busy! At the office, I worked hard with my team. We developed a new advertising plan. Our meeting lasted about two hours. I remembered an advertising plan that worked five years ago, and I suggested we try that again. We needed to get the manager’s approval. We called him on the office phone. He admitted that the idea seemed good, but he believed we should lower the budget. We reported our numbers to him and talked about the budget for a long time. Finally, he decided to give us the money we wanted.',
    fullVietnameseText:
      'Hôm qua thật là bận rộn! Ở văn phòng, tôi đã làm việc chăm chỉ cùng nhóm của mình. Chúng tôi đã phát triển một kế hoạch quảng cáo mới. Cuộc họp của chúng tôi kéo dài khoảng hai giờ. Tôi đã nhớ lại một kế hoạch quảng cáo từng hiệu quả năm năm trước, và tôi đề xuất chúng tôi thử lại kế hoạch đó. Chúng tôi cần sự phê duyệt của quản lý. Chúng tôi đã gọi cho anh ấy qua điện thoại văn phòng. Anh ấy thừa nhận rằng ý tưởng có vẻ tốt, nhưng anh ấy tin rằng chúng tôi nên hạ ngân sách xuống. Chúng tôi đã báo cáo số liệu của mình với anh ấy và thảo luận về ngân sách trong một thời gian dài. Cuối cùng, anh ấy đã quyết định cấp cho chúng tôi số tiền chúng tôi muốn.',
    clauses: [
      { en: 'Yesterday was so busy!', vi: 'Hôm qua thật bận rộn!', isEnd: true },
      { en: 'At the office,', vi: 'Ở văn phòng,' },
      { en: 'I worked hard with my team.', vi: 'tôi làm việc chăm chỉ cùng nhóm.', isEnd: true },
      { en: 'We developed a new advertising plan.', vi: 'Chúng tôi phát triển kế hoạch quảng cáo mới.', isEnd: true },
      { en: 'Our meeting lasted about two hours.', vi: 'Cuộc họp kéo dài khoảng hai giờ.', isEnd: true },
      { en: 'I remembered an advertising plan', vi: 'Tôi nhớ lại kế hoạch quảng cáo' },
      { en: 'that worked five years ago,', vi: 'đã hiệu quả 5 năm trước,' },
      { en: 'and I suggested we try that again.', vi: 'và tôi đề xuất thử lại.', isEnd: true },
      { en: 'We needed to get the manager’s approval.', vi: 'Chúng tôi cần sếp duyệt.', isEnd: true },
      { en: 'We called him on the office phone.', vi: 'Chúng tôi gọi điện thoại văn phòng cho anh ấy.', isEnd: true },
      { en: 'He admitted that the idea seemed good,', vi: 'Anh ấy thừa nhận ý tưởng có vẻ hay,' },
      { en: 'but he believed we should lower the budget.', vi: 'nhưng tin rằng nên giảm ngân sách.', isEnd: true },
      { en: 'We reported our numbers to him', vi: 'Chúng tôi báo cáo số liệu cho anh ấy' },
      { en: 'and talked about the budget for a long time.', vi: 'và thảo luận ngân sách rất lâu.', isEnd: true },
      { en: 'Finally, he decided to give us', vi: 'Cuối cùng, anh ấy quyết định cấp' },
      { en: 'the money we wanted.', vi: 'số tiền chúng tôi muốn.', isEnd: true },
    ],
    linkingRules: [
      { phrase: 'worked_hard', ipa: '/wɜːkt.hɑːd/' },
      { phrase: 'lasted_about', ipa: '/ˈlɑː.stɪd.əˈbaʊt/' },
      { phrase: 'called_him', ipa: '/kɔːld.hɪm/' },
    ],
    keyPhonetics: [
      { word: 'worked', ipa: '/wɜːkt/' },
      { word: 'developed', ipa: '/dɪˈvel.əpt/' },
      { word: 'lasted', ipa: '/ˈlɑː.stɪd/' },
      { word: 'suggested', ipa: '/səˈdʒes.tɪd/' },
      { word: 'needed', ipa: '/ˈniː.dɪd/' },
    ],
  }),

  buildLesson({
    id: 'ed-practice-3',
    topicNumber: 0,
    topicGroup: 'LUYỆN PHÁT ÂM ĐUÔI -ED',
    title: 'LUYỆN ED - Practice 3: Shopping & Son',
    category: 'LUYỆN ED',
    fullText:
      'On the way home, I stopped at the mall. I had promised my daughter a new MP3 player for her birthday. At the electronics store, I played songs and listened for quality sound. I decided to buy one at a medium price. When I got home, the kitchen was a mess. At our house, we have agreed to clean up after ourselves, so I asked around to find out who had cooked last. That person turned out to be my son. While he washed the dishes, I sat at the kitchen table and talked to him about his school work. Last year, he tested into an advanced program, and I wanted to see how he was doing. He seemed happy with it. He started telling me about his classes and what he learned that day.',
    fullVietnameseText:
      'Trên đường về nhà, tôi ghé vào trung tâm thương mại. Tôi đã hứa tặng con gái một chiếc máy nghe nhạc MP3 mới cho ngày sinh nhật. Tại cửa hàng điện tử, tôi đã bật các bài hát và lắng nghe chất lượng âm thanh. Tôi đã quyết định mua một chiếc với giá vừa phải. Khi về đến nhà, căn bếp bừa bộn. Ở nhà chúng tôi, mọi người đã đồng ý tự dọn dẹp sau khi nấu nướng, nên tôi đã hỏi quanh để tìm xem ai đã nấu ăn cuối cùng. Người đó hóa ra là con trai tôi. Trong khi con rửa bát, tôi ngồi ở bàn bếp và trò chuyện với con về việc học ở trường. Năm ngoái, con đã thi đỗ vào một chương trình nâng cao, và tôi muốn xem con học tập ra sao. Con có vẻ rất vui. Con bắt đầu kể cho tôi nghe về các lớp học và những gì con đã học được ngày hôm đó.',
    clauses: [
      { en: 'On the way home,', vi: 'Trên đường về nhà,' },
      { en: 'I stopped at the mall.', vi: 'tôi ghé vào trung tâm thương mại.', isEnd: true },
      { en: 'I had promised my daughter', vi: 'Tôi đã hứa tặng con gái' },
      { en: 'a new MP3 player for her birthday.', vi: 'máy nghe nhạc MP3 dịp sinh nhật.', isEnd: true },
      { en: 'At the electronics store,', vi: 'Tại cửa hàng điện tử,' },
      { en: 'I played songs and listened for quality sound.', vi: 'tôi bật bài hát và nghe thử âm thanh.', isEnd: true },
      { en: 'I decided to buy one at a medium price.', vi: 'Tôi quyết định mua chiếc giá vừa phải.', isEnd: true },
      { en: 'When I got home, the kitchen was a mess.', vi: 'Khi về nhà, bếp bừa bộn.', isEnd: true },
      { en: 'At our house, we agreed to clean up,', vi: 'Ở nhà, chúng tôi quy ước tự dọn,' },
      { en: 'so I asked around to find out who cooked last.', vi: 'nên tôi hỏi xem ai nấu ăn cuối cùng.', isEnd: true },
      { en: 'That person turned out to be my son.', vi: 'Người đó hóa ra là con trai tôi.', isEnd: true },
      { en: 'While he washed the dishes,', vi: 'Khi con rửa bát,' },
      { en: 'I sat at the kitchen table and talked to him.', vi: 'tôi ngồi ở bàn bếp trò chuyện cùng con.', isEnd: true },
      { en: 'He seemed happy with his advanced program.', vi: 'Con có vẻ vui với chương trình nâng cao.', isEnd: true },
      { en: 'He started telling me about his classes.', vi: 'Con bắt đầu kể cho tôi về lớp học.', isEnd: true },
    ],
    linkingRules: [
      { phrase: 'stopped_at', ipa: '/stɒpt.æt/' },
      { phrase: 'turned_out', ipa: '/tɜːnd.aʊt/' },
      { phrase: 'talked_to', ipa: '/tɔːkt.tuː/' },
    ],
    keyPhonetics: [
      { word: 'stopped', ipa: '/stɒpt/' },
      { word: 'promised', ipa: '/ˈprɒm.ɪst/' },
      { word: 'played', ipa: '/pleɪd/' },
      { word: 'listened', ipa: '/ˈlɪs.ənd/' },
      { word: 'washed', ipa: '/wɒʃt/' },
    ],
  }),

  // =========================================================================
  // TOPIC 1: SELF INTRODUCTION (STUDYING & WORKING)
  // =========================================================================
  buildLesson({
    id: 'topic-1a-studying',
    topicNumber: 1,
    topicGroup: '1. Self Introduction',
    title: 'Bài 1 (Học sinh): Self Introduction - Studying',
    category: '1. Self Introduction',
    fullText:
      'I am a 10th-grade student at Tran Nguyen Han High School in Hai Phong. I enjoy studying Math, Literature, and English. Outside of school, I like playing soccer with my friends and reading books. Every day, I wake up at 6 a.m. to get ready for school. After school, I usually spend time doing homework and helping my parents with household chores. What I like most about my school is the friendly learning environment and how the teachers are always willing to help students. I love my school and always try my best to study well so that I can get into a university in the future. My goal is to become a successful and helpful person in society.',
    fullVietnameseText:
      'Tôi là học sinh lớp 10 trường THPT Trần Nguyên Hãn tại Hải Phòng. Tôi thích học Toán, Ngữ văn và Tiếng Anh. Ngoài giờ học, tôi thích đá bóng với bạn bè và đọc sách. Mỗi ngày, tôi thức dậy lúc 6 giờ sáng để chuẩn bị đi học. Sau giờ học, tôi thường dành thời gian làm bài tập về nhà và giúp cha mẹ việc nhà. Điều tôi thích nhất ở trường là môi trường học tập thân thiện và các thầy cô luôn sẵn sàng giúp đỡ học sinh. Tôi yêu trường của mình và luôn cố gắng hết sức học tốt để vào đại học trong tương lai. Mục tiêu của tôi là trở thành một người thành công và có ích cho xã hội.',
    clauses: [
      { en: 'I am a 10th-grade student', vi: 'Tôi là học sinh lớp 10' },
      { en: 'at Tran Nguyen Han High School', vi: 'trường THPT Trần Nguyên Hãn' },
      { en: 'in Hai Phong.', vi: 'ở Hải Phòng.', isEnd: true },
      { en: 'I enjoy studying Math, Literature,', vi: 'Tôi thích học Toán, Ngữ văn,' },
      { en: 'and English.', vi: 'và Tiếng Anh.', isEnd: true },
      { en: 'Outside of school,', vi: 'Ngoài giờ học,' },
      { en: 'I like playing soccer with my friends', vi: 'tôi thích đá bóng cùng bạn bè' },
      { en: 'and reading books.', vi: 'và đọc sách.', isEnd: true },
      { en: 'Every day, I wake up at 6 a.m.', vi: 'Mỗi ngày, tôi dậy lúc 6 giờ sáng' },
      { en: 'to get ready for school.', vi: 'để chuẩn bị đi học.', isEnd: true },
      { en: 'After school, I usually spend time', vi: 'Sau giờ học, tôi thường dành thời gian' },
      { en: 'doing homework and helping my parents.', vi: 'làm bài tập và giúp đỡ bố mẹ.', isEnd: true },
      { en: 'What I like most about my school', vi: 'Điều tôi thích nhất ở trường' },
      { en: 'is the friendly learning environment.', vi: 'là môi trường học tập thân thiện.', isEnd: true },
      { en: 'My goal is to become', vi: 'Mục tiêu của tôi là trở thành' },
      { en: 'a successful and helpful person in society.', vi: 'người thành công và có ích cho xã hội.', isEnd: true },
    ],
  }),

  buildLesson({
    id: 'topic-1b-working',
    topicNumber: 1,
    topicGroup: '1. Self Introduction',
    title: 'Bài 1 (Đi làm): Self Introduction - Working',
    category: '1. Self Introduction',
    fullText:
      'My name is Nam. I work at a logistics company in Hai Phong. My job is to manage shipments, organize deliveries, and make sure goods are transported smoothly. Outside of work, I like playing soccer with friends and reading books in my free time. Every day, I wake up at 6 a.m. to get ready for work. After work, I relax, read, or help my family with chores. What I like most about my job is the friendly environment and how my colleagues always help each other. I enjoy my work and try my best to improve my skills so that I can grow in my career. My goal is to be successful in the logistics field.',
    fullVietnameseText:
      'Tôi làm việc tại một công ty logistics ở Hải Phòng. Công việc của tôi là quản lý các lô hàng, tổ chức giao hàng và đảm bảo hàng hóa được vận chuyển suôn sẻ. Ngoài giờ làm việc, tôi thích đá bóng với bạn bè và đọc sách khi rảnh rỗi. Mỗi ngày, tôi thức dậy lúc 6 giờ sáng để chuẩn bị đi làm. Sau giờ làm, tôi thư giãn, đọc sách hoặc giúp gia đình việc nhà. Điều tôi thích nhất ở công việc là môi trường thân thiện và đồng nghiệp luôn giúp đỡ lẫn nhau. Tôi yêu thích công việc của mình và cố gắng trau dồi kỹ năng để phát triển sự nghiệp. Mục tiêu của tôi là thành công trong lĩnh vực logistics.',
    clauses: [
      { en: 'I work at a logistics company', vi: 'Tôi làm việc tại công ty logistics' },
      { en: 'in Hai Phong.', vi: 'ở Hải Phòng.', isEnd: true },
      { en: 'My job is to manage shipments,', vi: 'Công việc của tôi là quản lý lô hàng,' },
      { en: 'organize deliveries,', vi: 'tổ chức giao hàng,' },
      { en: 'and make sure goods are transported smoothly.', vi: 'đảm bảo hàng hóa vận chuyển suôn sẻ.', isEnd: true },
      { en: 'Every day, I wake up at 6 a.m.', vi: 'Mỗi ngày, tôi dậy lúc 6 giờ sáng' },
      { en: 'to get ready for work.', vi: 'để chuẩn bị đi làm.', isEnd: true },
      { en: 'What I like most about my job', vi: 'Điều tôi thích nhất ở công việc' },
      { en: 'is the friendly environment', vi: 'là môi trường thân thiện' },
      { en: 'and helpful colleagues.', vi: 'và đồng nghiệp hay giúp đỡ.', isEnd: true },
      { en: 'My goal is to be successful', vi: 'Mục tiêu của tôi là thành công' },
      { en: 'in the logistics field.', vi: 'trong lĩnh vực logistics.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 2: MY FAMILY
  // =========================================================================
  buildLesson({
    id: 'topic-2-family',
    topicNumber: 2,
    topicGroup: '2. My Family',
    title: 'Bài 2: My Family (Gia đình tôi)',
    category: '2. My Family',
    fullText:
      'There are four people in my family: my parents, my sister, and me. My dad is an engineer at a government office, my mom is a housewife, my sister teaches at a primary school, and I am a high school student. We all wake up at 6 a.m. every day. After breakfast, my dad and sister head to work, my mom does housework, and I go to school. We have lunch at noon and dinner at 7 p.m. In the evening, we usually spend about an hour in the living room, chatting or watching TV. After that, my sister and I go to our rooms to get ready for the next day. My family is really close, and we love each other a lot. We hope to stay together under the same roof forever.',
    fullVietnameseText:
      'Có 4 người trong gia đình tôi: bố mẹ tôi, chị gái tôi và tôi. Bố tôi là kỹ sư tại cơ quan nhà nước, mẹ tôi làm nội trợ, chị gái tôi dạy ở trường tiểu học và tôi là học sinh cấp 3. Tất cả chúng tôi thức dậy lúc 6 giờ sáng mỗi ngày. Sau bữa sáng, bố và chị tôi đi làm, mẹ làm việc nhà, còn tôi đi học. Chúng tôi ăn trưa lúc giữa trưa và ăn tối lúc 7 giờ tối. Buổi tối, chúng tôi thường dành khoảng một tiếng ở phòng khách, trò chuyện hoặc xem TV. Sau đó, chị tôi và tôi về phòng chuẩn bị cho ngày tiếp theo. Gia đình tôi rất gắn kết, và chúng tôi yêu thương nhau rất nhiều. Chúng tôi hy vọng sẽ luôn sống cùng nhau dưới một mái nhà mãi mãi.',
    clauses: [
      { en: 'There are four people', vi: 'Có bốn người' },
      { en: 'in my family:', vi: 'trong gia đình tôi:' },
      { en: 'my parents,', vi: 'bố mẹ tôi,' },
      { en: 'my sister,', vi: 'chị gái tôi,' },
      { en: 'and me.', vi: 'và tôi.', isEnd: true },
      { en: 'My dad is an engineer', vi: 'Bố tôi là kỹ sư' },
      { en: 'at a government office,', vi: 'tại một cơ quan nhà nước,' },
      { en: 'my mom is a housewife,', vi: 'mẹ tôi là người nội trợ,' },
      { en: 'my sister teaches', vi: 'chị gái tôi dạy học' },
      { en: 'at a primary school,', vi: 'ở một trường tiểu học,' },
      { en: "and I'm a high school student.", vi: 'và tôi là học sinh cấp 3.', isEnd: true },
      { en: 'We all wake up at 6 a.m. every day.', vi: 'Cả nhà thức dậy lúc 6h sáng mỗi ngày.', isEnd: true },
      { en: 'In the evening, we spend about an hour', vi: 'Buổi tối, chúng tôi dành khoảng 1 tiếng' },
      { en: 'in the living room, chatting or watching TV.', vi: 'ở phòng khách, trò chuyện hoặc xem TV.', isEnd: true },
      { en: 'My family is really close,', vi: 'Gia đình tôi rất gắn bó,' },
      { en: 'and we love each other a lot.', vi: 'và chúng tôi yêu thương nhau rất nhiều.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 3: MY MOM
  // =========================================================================
  buildLesson({
    id: 'topic-3-mom',
    topicNumber: 3,
    topicGroup: '3. My Mom',
    title: 'Bài 3: My Mom (Mẹ của tôi)',
    category: '3. My Mom',
    fullText:
      'My mom is a housewife. She takes care of the household, cooks meals, and manages everything at home. She wakes up early every day to prepare breakfast and make sure everyone is ready for the day. In her free time, she enjoys gardening and watching TV. What I admire most about my mom is her dedication to our family. She always makes sure we are happy and well taken care of. Even though she doesn’t have a job outside, she works hard every day to keep our home running smoothly. I love my mom very much and I really look up to her.',
    fullVietnameseText:
      'Mẹ tôi là một người nội trợ. Mẹ chăm sóc gia đình, nấu các bữa ăn và quản lý mọi việc ở nhà. Mẹ thức dậy sớm mỗi ngày để chuẩn bị bữa sáng và đảm bảo mọi người đã sẵn sàng cho ngày mới. Vào thời gian rảnh, mẹ thích làm vườn và xem TV. Điều tôi ngưỡng mộ nhất ở mẹ là sự tận tụy dành cho gia đình. Mẹ luôn đảm bảo chúng tôi hạnh phúc và được chăm sóc chu đáo. Dù không đi làm bên ngoài, mẹ vẫn làm việc chăm chỉ mỗi ngày để giữ cho tổ ấm luôn êm ấm. Tôi yêu mẹ rất nhiều và tôi luôn kính trọng mẹ.',
    clauses: [
      { en: 'My mom is a housewife.', vi: 'Mẹ tôi là người nội trợ.', isEnd: true },
      { en: 'She takes care of the household,', vi: 'Mẹ chăm sóc gia đình,' },
      { en: 'cooks meals,', vi: 'nấu các bữa ăn,' },
      { en: 'and manages everything at home.', vi: 'và quán xuyến mọi việc trong nhà.', isEnd: true },
      { en: 'She wakes up early every day', vi: 'Mẹ dậy sớm mỗi ngày' },
      { en: 'to prepare breakfast for the family.', vi: 'để chuẩn bị bữa sáng cho cả nhà.', isEnd: true },
      { en: 'What I admire most about my mom', vi: 'Điều tôi ngưỡng mộ nhất ở mẹ' },
      { en: 'is her dedication to our family.', vi: 'là sự tận tụy dành cho gia đình.', isEnd: true },
      { en: 'I love my mom very much', vi: 'Tôi yêu mẹ rất nhiều' },
      { en: 'and I really look up to her.', vi: 'và luôn kính trọng mẹ.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 4: MY HOBBIES (SUBTOPICS)
  // =========================================================================
  buildLesson({
    id: 'topic-4a-social-media',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4A: My Hobbies - Social Media (Mạng xã hội)',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is using social media. I enjoy connecting with friends, sharing photos, and staying updated on what’s happening in the world. I often spend time browsing through posts, watching videos, and discovering new content that interests me. What I like most about social media is how easy it is to communicate and learn new things. It helps me stay in touch with people and explore different topics that I wouldn’t normally come across in my daily life.',
    fullVietnameseText:
      'Một trong những sở thích của tôi là sử dụng mạng xã hội. Tôi thích kết nối với bạn bè, chia sẻ hình ảnh và cập nhật những gì đang diễn ra trên thế giới. Tôi thường dành thời gian lướt xem các bài đăng, xem video và khám phá những nội dung mới mà tôi quan tâm. Điều tôi thích nhất ở mạng xã hội là sự thuận tiện trong giao tiếp và học hỏi những điều mới lạ. Nó giúp tôi giữ liên lạc với mọi người và khám phá nhiều chủ đề thú vị.',
    clauses: [
      { en: 'One of my hobbies is using social media.', vi: 'Một sở thích của tôi là dùng mạng xã hội.', isEnd: true },
      { en: 'I enjoy connecting with friends,', vi: 'Tôi thích kết nối với bạn bè,' },
      { en: 'sharing photos, and staying updated.', vi: 'chia sẻ ảnh và cập nhật tin tức.', isEnd: true },
      { en: 'What I like most about social media', vi: 'Điều tôi thích nhất ở mạng xã hội' },
      { en: 'is how easy it is to communicate.', vi: 'là việc giao tiếp thật dễ dàng.', isEnd: true },
      { en: 'It helps me stay in touch with people', vi: 'Nó giúp tôi giữ liên lạc với mọi người' },
      { en: 'and learn new things every day.', vi: 'và học hỏi điều mới mỗi ngày.', isEnd: true },
    ],
  }),

  buildLesson({
    id: 'topic-4b-football',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4B: My Hobbies - Football (Bóng đá)',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is playing football. I enjoy running on the field, working with my teammates, and scoring goals. It’s a great way for me to stay active and have fun with my friends. We usually play after school or on weekends. What I like most about football is the teamwork and excitement of the game. It helps me stay fit and improve my skills while also building strong friendships. Playing football is always a fun and energizing experience for me.',
    fullVietnameseText:
      'Một trong những sở thích của tôi là chơi bóng đá. Tôi thích chạy trên sân cỏ, phối hợp cùng các đồng đội và ghi bàn. Đó là một cách tuyệt vời để tôi duy trì vận động và có những giờ phút vui vẻ với bạn bè. Chúng tôi thường chơi sau giờ học hoặc vào cuối tuần. Điều tôi thích nhất ở bóng đá là tinh thần đồng đội và sự hào hứng của trận đấu. Nó giúp tôi giữ gìn vóc dáng, nâng cao kỹ năng và xây dựng tình bạn bền chặt.',
    clauses: [
      { en: 'One of my hobbies is playing football.', vi: 'Một sở thích của tôi là chơi bóng đá.', isEnd: true },
      { en: 'I enjoy running on the field,', vi: 'Tôi thích chạy trên sân cỏ,' },
      { en: 'working with teammates, and scoring goals.', vi: 'phối hợp đồng đội và ghi bàn.', isEnd: true },
      { en: 'We usually play after school or on weekends.', vi: 'Chúng tôi thường chơi sau giờ học hoặc cuối tuần.', isEnd: true },
      { en: 'What I like most is the teamwork', vi: 'Điều tôi thích nhất là tinh thần đồng đội' },
      { en: 'and excitement of the game.', vi: 'và sự hào hứng của trận đấu.', isEnd: true },
      { en: 'It helps me stay fit and build friendships.', vi: 'Nó giúp tôi giữ dáng và xây dựng tình bạn.', isEnd: true },
    ],
  }),

  buildLesson({
    id: 'topic-4c-music',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4C: My Hobbies - Music (Âm nhạc)',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is listening to music. I enjoy discovering new songs and artists, as well as listening to my favorite genres like pop and rock. Music helps me relax and feel good after a busy day. I usually listen to music while studying or during my free time. What I like most about music is how it can change my mood and inspire me. It connects me with different cultures and emotions. Listening to music is always a wonderful experience for me.',
    fullVietnameseText:
      'Một trong những sở thích của tôi là nghe nhạc. Tôi thích khám phá những bài hát và nghệ sĩ mới, cũng như nghe các thể loại yêu thích như pop và rock. Âm nhạc giúp tôi thư giãn và cảm thấy sảng khoái sau một ngày bận rộn. Tôi thường nghe nhạc khi học bài hoặc lúc rảnh rỗi. Điều tôi thích nhất ở âm nhạc là khả năng thay đổi tâm trạng và truyền cảm hứng. Nghe nhạc luôn là một trải nghiệm tuyệt vời đối với tôi.',
    clauses: [
      { en: 'One of my hobbies is listening to music.', vi: 'Sở thích của tôi là nghe nhạc.', isEnd: true },
      { en: 'I enjoy discovering new songs and artists.', vi: 'Tôi thích khám phá bài hát và nghệ sĩ mới.', isEnd: true },
      { en: 'Music helps me relax after a busy day.', vi: 'Âm nhạc giúp tôi thư giãn sau ngày bận rộn.', isEnd: true },
      { en: 'What I like most about music', vi: 'Điều tôi thích nhất ở âm nhạc' },
      { en: 'is how it changes my mood and inspires me.', vi: 'là cách nó đổi tâm trạng và truyền cảm hứng.', isEnd: true },
    ],
  }),

  buildLesson({
    id: 'topic-4d-films',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4D: My Hobbies - Watching Films (Xem phim)',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is watching movies. I enjoy exploring different genres, such as action, comedy, and drama. Watching movies is a great way for me to relax and escape into different stories. I usually watch movies in the evenings or on weekends. What I like most about movies is how they can take me on exciting adventures and make me feel different emotions. They also help me understand various cultures and perspectives. Watching movies is always an enjoyable experience for me.',
    fullVietnameseText:
      'Một trong những sở thích của tôi là xem phim. Tôi thích khám phá các thể loại khác nhau như hành động, hài hước và chính kịch. Xem phim là cách tuyệt vời để thư giãn và đắm chìm vào những câu chuyện thú vị. Tôi thường xem phim vào buổi tối hoặc cuối tuần. Phim ảnh đưa tôi vào những cuộc phiêu lưu hấp dẫn và giúp tôi hiểu thêm về các nền văn hóa.',
    clauses: [
      { en: 'One of my hobbies is watching movies.', vi: 'Một sở thích của tôi là xem phim.', isEnd: true },
      { en: 'I enjoy action, comedy, and drama.', vi: 'Tôi thích phim hành động, hài và chính kịch.', isEnd: true },
      { en: 'Watching movies is a great way to relax.', vi: 'Xem phim là cách tuyệt vời để thư giãn.', isEnd: true },
      { en: 'They take me on exciting adventures', vi: 'Chúng đưa tôi vào những cuộc phiêu lưu kỳ thú' },
      { en: 'and help me understand different cultures.', vi: 'và giúp tôi hiểu các nền văn hóa khác nhau.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 5: MY SCHOOL (NGO QUYEN HIGH SCHOOL)
  // =========================================================================
  buildLesson({
    id: 'topic-5-school',
    topicNumber: 5,
    topicGroup: '5. My School',
    title: 'Bài 5: My School (Trường THPT Ngô Quyền)',
    category: '5. My School',
    fullText:
      'My school is called Ngo Quyen High School. It is a friendly place where students learn and grow together. The teachers are kind and always ready to help us with our studies. I enjoy studying subjects like Math, English, and Literature. After classes, I often play football with my friends on the school grounds. We have a nice library where I can read books and prepare for exams. There are also many clubs and activities that I can join, like the art club and the science club. Overall, I really love my school and appreciate all the opportunities it gives me to learn.',
    fullVietnameseText:
      'Trường của tôi tên là THPT Ngô Quyền. Đó là một ngôi trường thân thiện nơi học sinh cùng nhau học tập và trưởng thành. Thầy cô giáo rất tốt bụng và luôn sẵn lòng giúp đỡ chúng tôi. Tôi thích học các môn như Toán, Tiếng Anh và Ngữ văn. Sau giờ học, tôi thường đá bóng với bạn ở sân trường. Trường có thư viện đẹp nơi tôi có thể đọc sách và ôn thi. Tôi thực sự yêu ngôi trường của mình.',
    clauses: [
      { en: 'My school is called Ngo Quyen High School.', vi: 'Trường tôi tên là THPT Ngô Quyền.', isEnd: true },
      { en: 'It is a friendly place', vi: 'Đó là nơi thân thiện' },
      { en: 'where students learn and grow together.', vi: 'nơi học sinh học tập và lớn lên cùng nhau.', isEnd: true },
      { en: 'The teachers are kind and helpful.', vi: 'Thầy cô rất tốt bụng và tận tình.', isEnd: true },
      { en: 'We have a nice library to read books.', vi: 'Trường có thư viện đẹp để đọc sách.', isEnd: true },
      { en: 'Overall, I really love my school.', vi: 'Nhìn chung, tôi rất yêu trường của mình.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 6: MY CITY (HAI PHONG CITY)
  // =========================================================================
  buildLesson({
    id: 'topic-6-city',
    topicNumber: 6,
    topicGroup: '6. My City',
    title: 'Bài 6: My City - Hai Phong City (Thành phố Hải Phòng)',
    category: '6. My City',
    fullText:
      'Hai Phong is my city, and it is a beautiful place by the sea. The city has many parks, where people can relax and enjoy nature. There is also delicious seafood available at local restaurants, and I love trying new dishes. I enjoy walking along the waterfront and visiting the local markets to see the fresh produce. The people here are friendly and welcoming, making everyone feel at home. There are also many interesting places to explore, like museums and temples that show our culture. The city is always bustling with activities, especially during festivals. I love living in Hai Phong because it has a vibrant atmosphere and rich history.',
    fullVietnameseText:
      'Hải Phòng là thành phố của tôi, và đó là một nơi xinh đẹp bên bờ biển. Thành phố có nhiều công viên nơi mọi người có thể thư giãn và tận hưởng thiên nhiên. Nơi đây cũng có hải sản thơm ngon tại các nhà hàng địa phương. Người dân nơi đây rất thân thiện và nồng hậu, khiến ai cũng cảm thấy như ở nhà. Tôi yêu Hải Phòng vì bầu không khí tràn đầy sức sống và lịch sử phong phú.',
    clauses: [
      { en: 'Hai Phong is my city,', vi: 'Hải Phòng là thành phố của tôi,' },
      { en: 'and it is a beautiful place by the sea.', vi: 'và là nơi xinh đẹp bên bờ biển.', isEnd: true },
      { en: 'The city has many parks', vi: 'Thành phố có nhiều công viên' },
      { en: 'where people can relax and enjoy nature.', vi: 'nơi mọi người thư giãn và ngắm thiên nhiên.', isEnd: true },
      { en: 'There is delicious seafood at local restaurants.', vi: 'Có hải sản rất ngon ở các quán ăn địa phương.', isEnd: true },
      { en: 'The people here are friendly and welcoming.', vi: 'Con người nơi đây thân thiện và nồng hậu.', isEnd: true },
      { en: 'I love living in Hai Phong', vi: 'Tôi yêu cuộc sống ở Hải Phòng' },
      { en: 'because of its vibrant atmosphere.', vi: 'bởi bầu không khí sôi động nơi đây.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 7: MY CLOSE FRIEND
  // =========================================================================
  buildLesson({
    id: 'topic-7-close-friend',
    topicNumber: 7,
    topicGroup: '7. My Close Friend',
    title: 'Bài 7: My Close Friend (Bạn thân của tôi - Minh)',
    category: '7. My Close Friend',
    fullText:
      'My close friend is named Minh. We have been friends since childhood, and we share many great memories together. We enjoy playing games and watching movies during our free time. Minh is very funny, and he always makes me laugh, which brightens my day. We also help each other with our studies, especially when preparing for exams. Sometimes we go out to eat or explore new places in the city. I really appreciate having such a good friend in my life. Our friendship means a lot to me, and I hope it lasts forever.',
    fullVietnameseText:
      'Bạn thân của tôi tên là Minh. Chúng tôi là bạn từ thời thơ ấu và cùng chia sẻ nhiều kỷ niệm đẹp. Chúng tôi thích chơi game và xem phim khi rảnh rỗi. Minh rất hài hước và luôn làm tôi cười vui vẻ. Chúng tôi cũng giúp đỡ nhau trong học tập, đặc biệt là khi ôn thi. Tình bạn của chúng tôi có ý nghĩa rất lớn đối với tôi và tôi hy vọng nó sẽ kéo dài mãi mãi.',
    clauses: [
      { en: 'My close friend is named Minh.', vi: 'Bạn thân của tôi tên là Minh.', isEnd: true },
      { en: 'We have been friends since childhood.', vi: 'Chúng tôi chơi thân từ thuở nhỏ.', isEnd: true },
      { en: 'Minh is very funny, and makes me laugh.', vi: 'Minh rất hài hước và luôn làm tôi cười.', isEnd: true },
      { en: 'We help each other with our studies.', vi: 'Chúng tôi giúp đỡ nhau trong việc học.', isEnd: true },
      { en: 'Our friendship means a lot to me,', vi: 'Tình bạn của chúng tôi rất ý nghĩa,' },
      { en: 'and I hope it lasts forever.', vi: 'và tôi mong nó sẽ bền lâu mãi mãi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 8: MY FAVORITE TEACHER
  // =========================================================================
  buildLesson({
    id: 'topic-8-favorite-teacher',
    topicNumber: 8,
    topicGroup: '8. My Favorite Teacher',
    title: 'Bài 8: My Favorite Teacher (Cô giáo dạy tiếng Anh - Cô Hoa)',
    category: '8. My Favorite Teacher',
    fullText:
      'My favorite teacher is Ms. Hoa. She teaches us English, and her classes are always engaging and fun. Ms. Hoa is very caring and always encourages us to do our best. She shares interesting stories that make learning more enjoyable. I appreciate how she helps us improve our speaking skills by organizing group activities. After class, she is always available if we have questions or need help. I admire her teaching style and enjoy her classes a lot. She inspires me to work hard and love learning.',
    fullVietnameseText:
      'Giáo viên yêu thích của tôi là cô Hoa. Cô dạy chúng tôi môn Tiếng Anh và các tiết học của cô luôn lôi cuốn và thú vị. Cô Hoa rất chu đáo và luôn động viên chúng tôi cố gắng hết mình. Cô chia sẻ những câu chuyện bổ ích giúp việc học hào hứng hơn. Cô truyền cảm hứng để tôi học tập chăm chỉ và yêu thích việc học.',
    clauses: [
      { en: 'My favorite teacher is Ms. Hoa.', vi: 'Giáo viên yêu thích của tôi là cô Hoa.', isEnd: true },
      { en: 'She teaches us English with fun classes.', vi: 'Cô dạy tiếng Anh với các tiết học rất vui.', isEnd: true },
      { en: 'Ms. Hoa is very caring and encouraging.', vi: 'Cô Hoa rất chu đáo và luôn khích lệ học sinh.', isEnd: true },
      { en: 'She helps us improve our speaking skills.', vi: 'Cô giúp chúng tôi cải thiện kỹ năng nói.', isEnd: true },
      { en: 'She inspires me to work hard and learn.', vi: 'Cô truyền cảm hứng để tôi chăm chỉ học tập.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 9: MY NEIGHBOR
  // =========================================================================
  buildLesson({
    id: 'topic-9-neighbor',
    topicNumber: 9,
    topicGroup: '9. My Neighbor',
    title: 'Bài 9: My Neighbor (Hàng xóm - Bác Lan)',
    category: '9. My Neighbor',
    fullText:
      'My neighbor is a very friendly person. Her name is Mrs. Lan, and she lives next door with her family. She has two kids who play outside every day. We often wave at each other and say hello. Mrs. Lan likes to grow flowers in her garden, and they are beautiful. Sometimes, she shares her flowers with us, which makes us really happy. She also loves to bake, and we enjoy her tasty cookies. I feel lucky to have such a nice neighbor who always makes our neighborhood better!',
    fullVietnameseText:
      'Hàng xóm của tôi là một người rất thân thiện tên là bác Lan, sống cạnh nhà tôi cùng gia đình. Bác có hai người con chơi đùa ngoài sân mỗi ngày. Bác Lan thích trồng hoa trong vườn và hoa rất đẹp. Thỉnh thoảng bác tặng hoa cho chúng tôi và làm bánh quy ngon lành. Tôi cảm thấy may mắn khi có người hàng xóm tuyệt vời như vậy.',
    clauses: [
      { en: 'My neighbor is named Mrs. Lan.', vi: 'Hàng xóm của tôi tên là bác Lan.', isEnd: true },
      { en: 'She lives next door with her family.', vi: 'Bác sống cạnh nhà cùng gia đình.', isEnd: true },
      { en: 'Mrs. Lan likes to grow flowers in her garden.', vi: 'Bác Lan thích trồng hoa trong vườn.', isEnd: true },
      { en: 'She also loves to bake tasty cookies.', vi: 'Bác cũng rất thích nướng bánh quy ngon.', isEnd: true },
      { en: 'I feel lucky to have such a nice neighbor.', vi: 'Tôi thấy may mắn khi có người hàng xóm tốt bụng.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 10: MY FAVORITE WEATHER
  // =========================================================================
  buildLesson({
    id: 'topic-10-weather',
    topicNumber: 10,
    topicGroup: '10. My Favorite Weather',
    title: 'Bài 10: My Favorite Weather (Thời tiết nắng ấm)',
    category: '10. My Favorite Weather',
    fullText:
      'My favorite weather is sunny and warm. I love when the sun shines brightly and the sky is blue. It makes me feel happy and energetic. On sunny days, I enjoy going outside to play sports or hang out with friends. I also like to go for walks in the park and enjoy nature. Warm weather allows me to wear my favorite clothes, like t-shirts and shorts. It’s the perfect time to have picnics and enjoy ice cream. Sunny weather always brightens my mood and makes everything feel more enjoyable.',
    fullVietnameseText:
      'Thời tiết yêu thích của tôi là trời nắng và ấm áp. Tôi thích khi ánh mặt trời rực rỡ và bầu trời trong xanh. Nó khiến tôi cảm thấy tràn đầy năng lượng. Vào những ngày nắng, tôi thích ra ngoài chơi thể thao, đi dạo công viên và thưởng thức kem. Thời tiết nắng ấm luôn làm tâm trạng tôi bừng sáng.',
    clauses: [
      { en: 'My favorite weather is sunny and warm.', vi: 'Thời tiết tôi thích là nắng và ấm áp.', isEnd: true },
      { en: 'The bright sun makes me feel energetic.', vi: 'Ánh nắng rực rỡ làm tôi thấy tràn trề năng lượng.', isEnd: true },
      { en: 'I enjoy going outside to play sports.', vi: 'Tôi thích ra ngoài chơi thể thao.', isEnd: true },
      { en: 'It is the perfect time for picnics and ice cream.', vi: 'Đó là lúc hoàn hảo để đi dã ngoại và ăn kem.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 11: MY FAVORITE SONG
  // =========================================================================
  buildLesson({
    id: 'topic-11-song',
    topicNumber: 11,
    topicGroup: '11. My Favorite Song',
    title: 'Bài 11: My Favorite Song (Shape of You - Ed Sheeran)',
    category: '11. My Favorite Song',
    fullText:
      'My favorite song is "Shape of You" by Ed Sheeran. I love the rhythm and melody; it always makes me want to dance. The lyrics are catchy, and I enjoy singing along when I hear it. I listen to this song when I’m feeling happy or just want to relax. It reminds me of good times with my friends at parties. Whenever I hear this song, I can’t help but smile and feel energized. Music is a big part of my life, and this song is definitely one of my favorites.',
    fullVietnameseText:
      'Bài hát yêu thích của tôi là "Shape of You" của Ed Sheeran. Tôi mê giai điệu và tiết tấu sôi động của bài hát; nó luôn khiến tôi muốn nhảy theo. Lời bài hát rất bắt tai và tôi thích hát theo mỗi khi nghe. Bất cứ khi nào nghe bài hát này, tôi đều mỉm cười và cảm thấy phấn chấn.',
    clauses: [
      { en: 'My favorite song is "Shape of You".', vi: 'Bài hát yêu thích của tôi là "Shape of You".', isEnd: true },
      { en: 'I love the catchy rhythm and melody.', vi: 'Tôi thích tiết tấu và giai điệu bắt tai.', isEnd: true },
      { en: 'It always makes me want to dance and sing.', vi: 'Nó luôn làm tôi muốn nhảy múa và hát theo.', isEnd: true },
      { en: 'Whenever I hear it, I feel energized.', vi: 'Mỗi khi nghe bài hát, tôi thấy tràn trề năng lượng.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 12: MY FAVORITE FILM
  // =========================================================================
  buildLesson({
    id: 'topic-12-film',
    topicNumber: 12,
    topicGroup: '12. My Favorite Film',
    title: 'Bài 12: My Favorite Film (The Lion King)',
    category: '12. My Favorite Film',
    fullText:
      'My favorite film is "The Lion King." I love the story about family and friendship. The animation is beautiful, and the music is amazing. I enjoy watching it with my family on weekends. Each character has a special role that makes the movie exciting. The lessons about courage and responsibility really touch my heart. I can watch this film over and over again without getting bored. "The Lion King" always brings back wonderful memories of my childhood.',
    fullVietnameseText:
      'Bộ phim yêu thích của tôi là "The Lion King" (Vua Sư Tử). Tôi yêu câu chuyện về tình cảm gia đình và tình bạn. Hình ảnh hoạt hình tuyệt đẹp và âm nhạc vô cùng xuất sắc. Những bài học về lòng dũng cảm và tinh thần trách nhiệm thực sự chạm đến trái tim tôi. Bộ phim luôn gợi lại những ký ức tuổi thơ tuyệt đẹp.',
    clauses: [
      { en: 'My favorite film is "The Lion King".', vi: 'Bộ phim tôi yêu thích là "The Lion King".', isEnd: true },
      { en: 'I love the story about family and friendship.', vi: 'Tôi yêu câu chuyện về gia đình và tình bạn.', isEnd: true },
      { en: 'The animation is beautiful and music is amazing.', vi: 'Hình ảnh hoạt họa đẹp và âm nhạc tuyệt vời.', isEnd: true },
      { en: 'The lessons about courage touch my heart.', vi: 'Bài học về lòng dũng cảm chạm vào trái tim tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 13: MY FAVORITE TV SHOW
  // =========================================================================
  buildLesson({
    id: 'topic-13-tv-show',
    topicNumber: 13,
    topicGroup: '13. My Favorite TV Show',
    title: 'Bài 13: My Favorite TV Show (Anh Trai Say Hi)',
    category: '13. My Favorite TV Show',
    fullText:
      'My favorite TV show is "Anh Trai Say Hi" on Vie channel. It is a fun and entertaining program that makes me laugh. The show features funny skits and interesting challenges. I enjoy watching the hosts interact with each other and with the audience. They often share funny stories and jokes that brighten my day. I watch this show every weekend with my family. It’s a great way for us to relax and have fun together. "Anh Trai Say Hi" always puts me in a good mood.',
    fullVietnameseText:
      'Chương trình truyền hình yêu thích của tôi là "Anh Trai Say Hi". Đó là một chương trình giải trí hài hước khiến tôi cười sảng khoái. Show có nhiều thử thách thú vị và màn tương tác dí dỏm. Tôi xem chương trình này vào mỗi cuối tuần cùng gia đình để thư giãn cùng nhau.',
    clauses: [
      { en: 'My favorite TV show is "Anh Trai Say Hi".', vi: 'Chương trình yêu thích của tôi là "Anh Trai Say Hi".', isEnd: true },
      { en: 'It features funny skits and interesting challenges.', vi: 'Chương trình có nhiều tiểu phẩm và thử thách hay.', isEnd: true },
      { en: 'I watch this show every weekend with family.', vi: 'Tôi xem chương trình mỗi cuối tuần cùng gia đình.', isEnd: true },
      { en: 'It always puts me in a good mood.', vi: 'Nó luôn giúp tôi có tâm trạng vui vẻ.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 14: MY FAVORITE BOOK
  // =========================================================================
  buildLesson({
    id: 'topic-14-book',
    topicNumber: 14,
    topicGroup: '14. My Favorite Book',
    title: 'Bài 14: My Favorite Book (Harry Potter)',
    category: '14. My Favorite Book',
    fullText:
      'My favorite book is "Harry Potter and the Sorcerer\'s Stone." I love the story of Harry and his adventures at Hogwarts. The magic and friendship in the book inspire me a lot. I enjoy reading about the characters and their challenges. The writing is engaging, and I always feel excited when I read it. I often read this book when I want to escape into a different world. It’s a fantastic journey that makes me dream big. "Harry Potter" will always be one of my favorite books.',
    fullVietnameseText:
      'Cuốn sách yêu thích của tôi là "Harry Potter và Hòn đá Phù thủy". Tôi say mê câu chuyện về Harry và những cuộc phiêu lưu tại trường Hogwarts. Phép thuật và tình bạn trong cuốn sách truyền cảm hứng rất nhiều cho tôi. Đó là chuyến phiêu lưu kỳ thú giúp tôi thỏa sức ước mơ.',
    clauses: [
      { en: 'My favorite book is "Harry Potter".', vi: 'Cuốn sách yêu thích của tôi là "Harry Potter".', isEnd: true },
      { en: 'I love his magical adventures at Hogwarts.', vi: 'Tôi thích những chuyến phiêu lưu phép thuật ở Hogwarts.', isEnd: true },
      { en: 'The themes of magic and friendship inspire me.', vi: 'Chủ đề phép thuật và tình bạn truyền cảm hứng cho tôi.', isEnd: true },
      { en: 'It is a fantastic journey that makes me dream big.', vi: 'Đó là hành trình kỳ diệu giúp tôi mơ ước lớn.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 15: CRAB NOODLE SOUP (BÁNH ĐA CUA)
  // =========================================================================
  buildLesson({
    id: 'topic-15-crab-noodles',
    topicNumber: 15,
    topicGroup: '15. My Favorite Dish',
    title: 'Bài 15: My Favorite Dish - Crab Noodle Soup (Bánh đa cua Hải Phòng)',
    category: '15. My Favorite Dish',
    fullText:
      'My favorite dish is banh da cua, which is a delicious noodle soup from Hai Phong. The broth is rich and flavorful, made with crab and spices. I love the soft rice noodles and the fresh herbs that come with it. When I eat banh da cua, I feel happy and satisfied. It\'s a popular dish, and I often enjoy it at local restaurants. I like to add chili for some extra spice. Eating this dish reminds me of my hometown and the good times with my family and friends.',
    fullVietnameseText:
      'Món ăn yêu thích của tôi là bánh đa cua, món súp mì cua trứ danh từ Hải Phòng. Nước dùng đậm đà thơm phức từ cua đồng và gia vị. Tôi thích sợi bánh đa mềm dai và rau thơm tươi ngon. Thưởng thức món này làm tôi nhớ về quê hương và những khoảnh khắc ấm áp bên người thân.',
    clauses: [
      { en: 'My favorite dish is banh da cua', vi: 'Món ăn yêu thích của tôi là bánh đa cua' },
      { en: 'from Hai Phong.', vi: 'của Hải Phòng.', isEnd: true },
      { en: 'The crab broth is rich and flavorful.', vi: 'Nước dùng cua đậm đà hương vị.', isEnd: true },
      { en: 'I love the soft noodles and fresh herbs.', vi: 'Tôi thích sợi bánh mềm và rau thơm tươi.', isEnd: true },
      { en: 'It reminds me of my hometown and family.', vi: 'Món ăn gợi nhớ quê hương và gia đình tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 16: SPICY BREAD (BÁNH MÌ CAY)
  // =========================================================================
  buildLesson({
    id: 'topic-16-spicy-bread',
    topicNumber: 16,
    topicGroup: '16. My Favorite Dish: Spicy Bread',
    title: 'Bài 16: My Favorite Dish - Spicy Bread (Bánh mì cay Hải Phòng)',
    category: '16. My Favorite Dish: Spicy Bread',
    fullText:
      'My favorite dish is banh mi cay, which is a spicy Vietnamese sandwich filled with delicious ingredients. I love the crispy bread and the variety of fillings, like meats, vegetables, and spicy sauce. Each bite is a burst of flavor, and I enjoy the mix of textures. I often eat banh mi cay for breakfast or as a snack. It’s a popular street food, and I like to get it from local vendors. Eating this dish makes me feel energized and happy. I can’t resist the delicious taste!',
    fullVietnameseText:
      'Món ăn yêu thích của tôi là bánh mì cay, món bánh mì kẹp giòn rụm với pa-tê thơm béo và tương ớt cay nồng đặc trưng. Mỗi miếng cắn là sự bùng nổ hương vị. Tôi thường ăn bánh mì cay vào bữa sáng hoặc lúc xế chiều. Tôi không thể cưỡng lại vị ngon này!',
    clauses: [
      { en: 'My favorite snack is banh mi cay.', vi: 'Món ăn vặt yêu thích của tôi là bánh mì cay.', isEnd: true },
      { en: 'I love the crispy bread and spicy sauce.', vi: 'Tôi thích bánh mì giòn và nước sốt cay.', isEnd: true },
      { en: 'Each bite is a burst of flavor.', vi: 'Mỗi miếng cắn là một sự bùng nổ hương vị.', isEnd: true },
      { en: 'I often eat it for breakfast or a snack.', vi: 'Tôi thường ăn vào bữa sáng hoặc bữa phụ.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 17: MILK TEA
  // =========================================================================
  buildLesson({
    id: 'topic-17-milk-tea',
    topicNumber: 17,
    topicGroup: '17. My Favorite Drink',
    title: 'Bài 17: My Favorite Drink - Milk Tea (Trà sữa)',
    category: '17. My Favorite Drink',
    fullText:
      'My favorite drink is milk tea. I love its sweet and creamy taste. The combination of tea and milk makes it very refreshing. I often add some pearls for a fun texture. I enjoy drinking milk tea while hanging out with my friends. It’s a popular drink, and there are many places to try it. I like to experiment with different flavors, like matcha or chocolate. Milk tea always makes me feel relaxed and happy.',
    fullVietnameseText:
      'Thức uống yêu thích của tôi là trà sữa. Tôi mê vị ngọt ngào và béo ngậy của nó. Sự kết hợp giữa trà và sữa rất sảng khoái, đặc biệt là khi thêm trân châu dai giòn. Uống trà sữa cùng bạn bè luôn làm tôi cảm thấy thư giãn và vui vẻ.',
    clauses: [
      { en: 'My favorite drink is milk tea.', vi: 'Đồ uống yêu thích của tôi là trà sữa.', isEnd: true },
      { en: 'I love its sweet and creamy taste.', vi: 'Tôi thích vị ngọt và béo ngậy của nó.', isEnd: true },
      { en: 'I often add pearls for a fun texture.', vi: 'Tôi thường thêm trân châu cho vui miệng.', isEnd: true },
      { en: 'Drinking milk tea with friends makes me happy.', vi: 'Uống trà sữa cùng bạn bè làm tôi rất vui.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 18: RONALDO
  // =========================================================================
  buildLesson({
    id: 'topic-18-ronaldo',
    topicNumber: 18,
    topicGroup: '18. My Favorite Sports Player',
    title: 'Bài 18: My Favorite Sports Player - Ronaldo',
    category: '18. My Favorite Sports Player',
    fullText:
      'My favorite sports player is Ronaldo. He is an amazing soccer player from Portugal. I admire his skills and dedication on the field. Ronaldo works very hard to be the best, and he inspires many young players. I love watching him play, especially when he scores goals. His speed and technique are incredible. Ronaldo has won many awards, and he always gives his best in every game. He is my role model in sports and life.',
    fullVietnameseText:
      'Cầu thủ thể thao yêu thích của tôi là Ronaldo. Anh ấy là một cầu thủ bóng đá xuất sắc đến từ Bồ Đào Nha. Tôi ngưỡng mộ kỹ năng và sự cống hiến không ngừng nghỉ của anh trên sân cỏ. Ronaldo là tấm gương truyền cảm hứng lớn cho tôi trong thể thao và cuộc sống.',
    clauses: [
      { en: 'My favorite sports player is Ronaldo.', vi: 'Cầu thủ yêu thích của tôi là Ronaldo.', isEnd: true },
      { en: 'He is an amazing soccer star from Portugal.', vi: 'Anh là ngôi sao bóng đá cừ khôi từ Bồ Đào Nha.', isEnd: true },
      { en: 'I admire his hard work and dedication.', vi: 'Tôi ngưỡng mộ sự chăm chỉ và tận tụy của anh.', isEnd: true },
      { en: 'He is my role model in sports and life.', vi: 'Anh ấy là hình mẫu lý tưởng của tôi trong cuộc sống.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 19: TAYLOR SWIFT
  // =========================================================================
  buildLesson({
    id: 'topic-19-taylor-swift',
    topicNumber: 19,
    topicGroup: '19. My Favorite Singer',
    title: 'Bài 19: My Favorite Singer - Taylor Swift',
    category: '19. My Favorite Singer',
    fullText:
      'My favorite singer is Taylor Swift. I love her music and the stories she tells in her songs. Her voice is beautiful and always makes me feel emotional. I enjoy listening to her songs during different moments in my life. She writes about love, friendship, and personal experiences. I admire her talent and creativity. I often go to her concerts with my friends, and it’s always a fun experience. Taylor Swift is truly an inspiration to me.',
    fullVietnameseText:
      'Ca sĩ yêu thích của tôi là Taylor Swift. Tôi yêu âm nhạc và những câu chuyện mà cô gửi gắm trong bài hát. Giọng hát truyền cảm của cô luôn chạm vào cảm xúc người nghe. Taylor Swift thực sự là nguồn cảm hứng lớn đối với tôi.',
    clauses: [
      { en: 'My favorite singer is Taylor Swift.', vi: 'Ca sĩ yêu thích của tôi là Taylor Swift.', isEnd: true },
      { en: 'Her voice is beautiful and emotional.', vi: 'Giọng hát của cô tuyệt đẹp và giàu cảm xúc.', isEnd: true },
      { en: 'She writes songs about love and friendship.', vi: 'Cô sáng tác nhạc về tình yêu và tình bạn.', isEnd: true },
      { en: 'Taylor Swift is truly an inspiration to me.', vi: 'Taylor Swift thực sự truyền cảm hứng cho tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 20: TOM HANKS
  // =========================================================================
  buildLesson({
    id: 'topic-20-tom-hanks',
    topicNumber: 20,
    topicGroup: '20. My Favorite Actor',
    title: 'Bài 20: My Favorite Actor - Tom Hanks',
    category: '20. My Favorite Actor',
    fullText:
      'My favorite actor is Tom Hanks. He is an incredible performer with many great movies. I love how he can play different types of characters. His acting makes me feel connected to the story. I have watched many of his films, and each one is special. Tom Hanks brings emotion and depth to his roles. I admire his kindness and humility off-screen as well. He is a true legend in the film industry.',
    fullVietnameseText:
      'Diễn viên yêu thích của tôi là Tom Hanks. Ông là một diễn viên tài năng xuất chúng với vô số bộ phim kinh điển. Diễn xuất chân thật và chiều sâu cảm xúc của ông luôn thu hút tôi. Ngoài đời, ông là một người rất khiêm tốn và nhân hậu.',
    clauses: [
      { en: 'My favorite actor is Tom Hanks.', vi: 'Diễn viên yêu thích của tôi là Tom Hanks.', isEnd: true },
      { en: 'He can play many different characters.', vi: 'Ông có thể hóa thân thành nhiều nhân vật khác nhau.', isEnd: true },
      { en: 'His acting brings emotion and depth.', vi: 'Diễn xuất của ông mang lại cảm xúc và chiều sâu.', isEnd: true },
      { en: 'He is a true legend in the film industry.', vi: 'Ông là huyền thoại đích thực của điện ảnh.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 21: MY IDEAL HOUSE
  // =========================================================================
  buildLesson({
    id: 'topic-21-ideal-house',
    topicNumber: 21,
    topicGroup: '21. My Ideal House',
    title: 'Bài 21: My Ideal House (Ngôi nhà mơ ước)',
    category: '21. My Ideal House',
    fullText:
      'My ideal house is a cozy and comfortable place. I would love a house with a big garden full of flowers and trees. Inside, I want a spacious living room where my family can relax together. I would also like a bright kitchen where I can cook delicious meals. My bedroom should be a peaceful space where I can study and sleep well. I dream of having a small library with my favorite books. The house should be in a quiet neighborhood with friendly neighbors. Overall, my ideal house would be a warm and happy place for my family.',
    fullVietnameseText:
      'Ngôi nhà lý tưởng của tôi là một nơi ấm cúng và tiện nghi với một khu vườn rộng rợp bóng cây hoa. Bên trong là phòng khách rộng rãi cho cả gia đình quây quần và căn bếp sáng sủa để nấu những bữa ăn ngon. Đó sẽ là tổ ấm ấm áp và hạnh phúc của chúng tôi.',
    clauses: [
      { en: 'My ideal house is cozy and comfortable.', vi: 'Ngôi nhà lý tưởng của tôi ấm cúng và tiện nghi.', isEnd: true },
      { en: 'I want a big garden with flowers and trees.', vi: 'Tôi muốn có khu vườn rộng đầy hoa và cây.', isEnd: true },
      { en: 'Inside, there is a spacious living room', vi: 'Bên trong là phòng khách rộng rãi' },
      { en: 'and a bright kitchen for cooking.', vi: 'và phòng bếp sáng sủa để nấu ăn.', isEnd: true },
      { en: 'It will be a happy home for my family.', vi: 'Đó sẽ là mái ấm hạnh phúc của gia đình tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 22: MY IDEAL JOB (LOGISTICS MANAGER)
  // =========================================================================
  buildLesson({
    id: 'topic-22-ideal-job',
    topicNumber: 22,
    topicGroup: '22. My Ideal Job',
    title: 'Bài 22: My Ideal Job - Logistics Manager (Quản lý Logistics)',
    category: '22. My Ideal Job',
    fullText:
      'My ideal job is to work as a logistics manager. I want to help organize and manage the transportation of goods. I enjoy solving problems and making sure everything runs smoothly. Working in a team with friendly colleagues is very important to me. I hope to learn new skills and advance in my career. I want a job that allows me to travel and meet different people. My ideal job would be challenging but also rewarding. I believe I can make a positive impact in the logistics industry.',
    fullVietnameseText:
      'Công việc lý tưởng của tôi là làm quản lý logistics. Tôi muốn điều phối và quản lý việc vận chuyển hàng hóa trơn tru. Tôi thích giải quyết các vấn đề phát sinh và làm việc cùng đồng nghiệp thân thiện. Công việc này thử thách nhưng đem lại nhiều thành quả xứng đáng.',
    clauses: [
      { en: 'My ideal job is a logistics manager.', vi: 'Công việc lý tưởng của tôi là quản lý logistics.', isEnd: true },
      { en: 'I want to manage the transport of goods.', vi: 'Tôi muốn quản lý việc vận chuyển hàng hóa.', isEnd: true },
      { en: 'I enjoy solving problems smoothly.', vi: 'Tôi thích giải quyết vấn đề một cách suôn sẻ.', isEnd: true },
      { en: 'It is a challenging and rewarding career.', vi: 'Đó là một sự nghiệp đầy thử thách và xứng đáng.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 23: MY IDEAL BOYFRIEND
  // =========================================================================
  buildLesson({
    id: 'topic-23-ideal-boyfriend',
    topicNumber: 23,
    topicGroup: '23. My Ideal Partner',
    title: 'Bài 23: My Ideal Boyfriend (Bạn trai lý tưởng)',
    category: '23. My Ideal Partner',
    fullText:
      'My ideal boyfriend is kind and supportive. He should be someone I can talk to about anything. I want him to share my interests and enjoy spending time together. Having a good sense of humor is important; I love to laugh. I hope he is also respectful and values our relationship. It would be great if he enjoys outdoor activities like hiking or cycling. I appreciate someone who is ambitious and has goals for the future. Overall, my ideal boyfriend would be my best friend and partner.',
    fullVietnameseText:
      'Bạn trai lý tưởng của tôi là người tốt bụng và biết ủng hộ tôi. Anh ấy nên là người tôi có thể tâm sự mọi điều và có khiếu hài hước. Người ấy tôn trọng mối quan hệ, thích hoạt động ngoài trời và có hoài bão cho tương lai.',
    clauses: [
      { en: 'My ideal boyfriend is kind and supportive.', vi: 'Bạn trai lý tưởng của tôi tốt bụng và biết thấu hiểu.', isEnd: true },
      { en: 'He should have a great sense of humor.', vi: 'Anh ấy nên có khiếu hài hước tuyệt vời.', isEnd: true },
      { en: 'I value someone who is ambitious for the future.', vi: 'Tôi đánh giá cao người có chí tiến thủ cho tương lai.', isEnd: true },
      { en: 'He would be my best friend and partner.', vi: 'Anh ấy sẽ là người bạn thân và bạn đời của tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 24: MY IDEAL GIRLFRIEND
  // =========================================================================
  buildLesson({
    id: 'topic-24-ideal-girlfriend',
    topicNumber: 24,
    topicGroup: '24. My Ideal Partner',
    title: 'Bài 24: My Ideal Girlfriend (Bạn gái lý tưởng)',
    category: '24. My Ideal Partner',
    fullText:
      'My ideal girlfriend is someone who is caring and understanding. I want her to be supportive of my dreams and goals. It’s important that we share common interests and enjoy spending time together. I love a girl who can make me laugh and has a great sense of humor. She should also be honest and open in our relationship. I appreciate someone who enjoys trying new things, like going to new restaurants or traveling. I hope she is also ambitious and has her own goals. Overall, my ideal girlfriend would be my partner in every adventure.',
    fullVietnameseText:
      'Bạn gái lý tưởng của tôi là người chu đáo và thấu hiểu, luôn ủng hộ ước mơ của tôi. Cô ấy hài hước, chân thành và thích trải nghiệm những điều mới như đi du lịch và khám phá ẩm thực. Cô ấy sẽ là người bạn đồng hành trong mọi chuyến phiêu lưu.',
    clauses: [
      { en: 'My ideal girlfriend is caring and understanding.', vi: 'Bạn gái lý tưởng của tôi chu đáo và biết thấu hiểu.', isEnd: true },
      { en: 'She is supportive of my dreams and goals.', vi: 'Cô ấy luôn ủng hộ ước mơ và mục tiêu của tôi.', isEnd: true },
      { en: 'She should be honest, open, and adventurous.', vi: 'Cô ấy chân thành, cởi mở và thích khám phá.', isEnd: true },
      { en: 'She would be my partner in every adventure.', vi: 'Cô ấy sẽ là bạn đồng hành trong mọi chuyến đi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 25: MY IDEAL HUSBAND
  // =========================================================================
  buildLesson({
    id: 'topic-25-ideal-husband',
    topicNumber: 25,
    topicGroup: '25. My Ideal Spouse',
    title: 'Bài 25: My Ideal Husband (Người chồng lý tưởng)',
    category: '25. My Ideal Spouse',
    fullText:
      'My ideal husband is someone who is loving and responsible. I want him to be supportive of my goals and dreams. It’s important that we communicate openly and honestly. I appreciate a man who has a good sense of humor and can make me laugh. He should also be hardworking and ambitious. I hope he enjoys spending time with family and values our relationship. It would be great if he shares my interests and enjoys doing activities together. Overall, my ideal husband would be my partner in life and my best friend.',
    fullVietnameseText:
      'Người chồng lý tưởng của tôi là người giàu tình cảm và có trách nhiệm. Anh ấy chăm chỉ, có chí tiến thủ và luôn coi trọng gia đình. Hai chúng tôi có thể trò chuyện cởi mở và chia sẻ mọi niềm vui trong cuộc sống.',
    clauses: [
      { en: 'My ideal husband is loving and responsible.', vi: 'Người chồng lý tưởng giàu tình cảm và có trách nhiệm.', isEnd: true },
      { en: 'He is hardworking and family-oriented.', vi: 'Anh ấy chăm chỉ và luôn hướng về gia đình.', isEnd: true },
      { en: 'We communicate openly and honestly.', vi: 'Chúng tôi trò chuyện cởi mở và chân thành.', isEnd: true },
      { en: 'He is my partner in life and my best friend.', vi: 'Anh ấy là bạn đời và người bạn thân nhất của tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 26: MY IDEAL WIFE
  // =========================================================================
  buildLesson({
    id: 'topic-26-ideal-wife',
    topicNumber: 26,
    topicGroup: '26. My Ideal Spouse',
    title: 'Bài 26: My Ideal Wife (Người vợ lý tưởng)',
    category: '26. My Ideal Spouse',
    fullText:
      'My ideal wife is someone who is caring and supportive. I want her to be my partner in every aspect of life. It’s important that we can talk openly and share our feelings. I appreciate a woman who has a good sense of humor and enjoys having fun. She should also be hardworking and have her own goals. I hope she enjoys spending time with family and values our relationship. It would be great if she shares my interests and enjoys activities together. Overall, my ideal wife would be my best friend and the love of my life.',
    fullVietnameseText:
      'Người vợ lý tưởng của tôi là người dịu dàng, biết quan tâm và chia sẻ mọi mặt trong cuộc sống. Cô ấy có mục tiêu riêng, chăm sóc gia đình và có khiếu hài hước. Cô ấy sẽ là bạn thân và là tình yêu lớn nhất cuộc đời tôi.',
    clauses: [
      { en: 'My ideal wife is caring and supportive.', vi: 'Vợ lý tưởng của tôi chu đáo và biết sẻ chia.', isEnd: true },
      { en: 'She is hardworking with her own goals.', vi: 'Cô ấy chăm chỉ và có những hoài bão riêng.', isEnd: true },
      { en: 'She values family and enjoys spending time together.', vi: 'Cô ấy coi trọng gia đình và thích quây quần.', isEnd: true },
      { en: 'She would be my best friend and love of life.', vi: 'Cô ấy sẽ là bạn thân và tình yêu của đời tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 27: MY COOKING SKILLS
  // =========================================================================
  buildLesson({
    id: 'topic-27-cooking',
    topicNumber: 27,
    topicGroup: '27. Skills',
    title: 'Bài 27: My Cooking Skills (Kỹ năng nấu ăn)',
    category: '27. Skills',
    fullText:
      'I enjoy cooking, but I’m still learning. I can make a few simple dishes like fried rice, noodles, and omelets. My mom taught me how to cook, and she helps me when I try new recipes. Sometimes, I mess up, but I always try again. I like cooking because it’s fun to experiment with different flavors. My favorite dish to make is fried rice because it’s easy and tasty. My family enjoys my cooking, and that makes me happy. I hope to improve my cooking skills even more in the future!',
    fullVietnameseText:
      'Tôi rất thích nấu ăn dù vẫn đang học hỏi. Tôi có thể nấu các món đơn giản như cơm rang, mì xào và trứng cuộn. Mẹ đã dạy tôi nấu nướng và giúp tôi thử công thức mới. Nấu ăn cho gia đình thưởng thức khiến tôi rất vui.',
    clauses: [
      { en: 'I enjoy cooking simple dishes.', vi: 'Tôi thích nấu các món ăn đơn giản.', isEnd: true },
      { en: 'I can make fried rice, noodles, and omelets.', vi: 'Tôi có thể làm cơm rang, mì và trứng cuộn.', isEnd: true },
      { en: 'My mom taught me how to cook.', vi: 'Mẹ đã dạy tôi cách nấu nướng.', isEnd: true },
      { en: 'My family enjoys my cooking very much.', vi: 'Gia đình rất thích đồ ăn do tôi nấu.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 28: MY SWIMMING SKILLS
  // =========================================================================
  buildLesson({
    id: 'topic-28-swimming',
    topicNumber: 28,
    topicGroup: '28. Skills',
    title: 'Bài 28: My Swimming Skills (Kỹ năng bơi lội)',
    category: '28. Skills',
    fullText:
      'I enjoy swimming, but I’m not an expert yet. I can swim basic strokes like freestyle and backstroke. I learned how to swim when I was younger, and I’ve been practicing ever since. Sometimes, I get tired quickly, but I’m trying to improve my stamina. Swimming is fun because it helps me stay active and healthy. I feel relaxed when I’m in the water, especially on hot days. I want to get better at swimming so I can swim faster and longer. One day, I hope to swim in the ocean confidently!',
    fullVietnameseText:
      'Tôi rất thích bơi lội. Tôi có thể bơi các kiểu cơ bản như bơi sải và bơi ngửa. Bơi lội giúp tôi duy trì sức khỏe, dẻo dai và thư giãn tuyệt đối trong những ngày hè oi bức. Tôi ước một ngày có thể bơi lội tự tin ngoài biển khơi.',
    clauses: [
      { en: 'I can swim freestyle and backstroke.', vi: 'Tôi biết bơi sải và bơi ngửa.', isEnd: true },
      { en: 'Swimming keeps me active and healthy.', vi: 'Bơi lội giúp tôi khỏe mạnh và năng động.', isEnd: true },
      { en: 'I feel relaxed in the water on hot days.', vi: 'Tôi thấy thư thái trong nước vào ngày nắng nóng.', isEnd: true },
      { en: 'I hope to swim in the ocean confidently.', vi: 'Tôi mong được bơi lội tự tin ngoài biển khơi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 29: MEMORABLE EXPERIENCE AT SCHOOL (SPORTS DAY)
  // =========================================================================
  buildLesson({
    id: 'topic-29-sports-day',
    topicNumber: 29,
    topicGroup: '29. Memorable Experiences',
    title: 'Bài 29: A Memorable Experience at School (Ngày hội thể thao)',
    category: '29. Memorable Experiences',
    fullText:
      'One of my best memories at school is sports day! Everyone was excited to join different games and competitions. I joined the relay race with my friends, and we practiced a lot. On the big day, we cheered for each other and felt nervous. When it was our turn, we ran as fast as we could. Crossing the finish line together was so much fun! To our surprise, our team won first place, and we were very proud. After the race, we celebrated with ice cream and laughter. It was a great day that brought us closer together. I will always remember the fun we had!',
    fullVietnameseText:
      'Kỷ niệm đẹp nhất ở trường của tôi là ngày hội thể thao. Cả nhóm tôi đã tham gia chạy tiếp sức và luyện tập chăm chỉ. Đội chúng tôi bất ngờ giành giải nhất và cùng nhau ăn mừng bằng kem trong tiếng cười rộn rã. Đó là kỷ niệm gắn kết bạn bè tôi không bao giờ quên.',
    clauses: [
      { en: 'One of my best memories is sports day!', vi: 'Kỷ niệm đẹp nhất của tôi là ngày hội thể thao!', isEnd: true },
      { en: 'I joined the relay race with friends.', vi: 'Tôi tham gia chạy tiếp sức cùng các bạn.', isEnd: true },
      { en: 'To our surprise, we won first place!', vi: 'Thật bất ngờ, đội tôi đã giành giải nhất!', isEnd: true },
      { en: 'We celebrated with ice cream and laughter.', vi: 'Chúng tôi ăn mừng bằng kem và tiếng cười.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 30: MEMORABLE FAMILY TRIP: HA LONG BAY
  // =========================================================================
  buildLesson({
    id: 'topic-30-halong-bay',
    topicNumber: 30,
    topicGroup: '30. Travel & Trips',
    title: 'Bài 30: A Memorable Family Trip - Ha Long Bay (Vịnh Hạ Long)',
    category: '30. Travel & Trips',
    fullText:
      'One of the most memorable family trips I took was to Ha Long Bay. The moment we arrived, I was blown away by the breathtaking views of beautiful islands and clear blue water. We hopped on a boat and set off to explore the stunning caves. It was amazing to see the unique rock formations that seemed to tell stories of their own. We even went swimming in the warm water and soaked up the sunshine. In the evening, we had a fantastic barbecue on the beach while sharing fun stories and laughter. The atmosphere was lively, filled with joy and excitement. I felt so grateful to be with my family in such a magical place. Every moment was an adventure, and we made memories that will last a lifetime. Ha Long Bay will always hold a special place in my heart!',
    fullVietnameseText:
      'Chuyến đi gia đình đáng nhớ nhất của tôi là đến Vịnh Hạ Long. Khung cảnh non nước mây trời hùng vĩ và làn nước trong xanh làm tôi choáng ngợp. Chúng tôi đi thuyền ngắm các hang động kỳ ảo, bơi lội và thưởng thức tiệc nướng BBQ trên bãi biển vào buổi tối. Hạ Long luôn giữ một vị trí đặc biệt trong tim tôi.',
    clauses: [
      { en: 'Our most memorable trip was to Ha Long Bay.', vi: 'Chuyến đi đáng nhớ nhất là tới Vịnh Hạ Long.', isEnd: true },
      { en: 'The breathtaking islands and blue water amazed me.', vi: 'Những hòn đảo và làn nước trong xanh làm tôi mê mẩn.', isEnd: true },
      { en: 'We explored caves and swam in the warm water.', vi: 'Chúng tôi khám phá hang động và bơi lội.', isEnd: true },
      { en: 'We had a fantastic barbecue on the beach.', vi: 'Chúng tôi tổ chức tiệc BBQ tuyệt vời trên biển.', isEnd: true },
      { en: 'Ha Long Bay holds a special place in my heart.', vi: 'Vịnh Hạ Long giữ vị trí đặc biệt trong tim tôi.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 31: MEMORABLE SCHOOL TRIP: CAT BA ISLAND
  // =========================================================================
  buildLesson({
    id: 'topic-31-cat-ba',
    topicNumber: 31,
    topicGroup: '31. Travel & Trips',
    title: 'Bài 31: A Memorable School Trip - Cat Ba Island (Đảo Cát Bà)',
    category: '31. Travel & Trips',
    fullText:
      'My school trip to Cat Ba Island was absolutely unforgettable! We started our adventure by traveling on a bus and then hopping on a ferry. When we arrived, the scenery was stunning, with lush greenery and sparkling blue water. We went hiking and were rewarded with breathtaking views of the island. One of the highlights was swimming in the clear water with my friends, splashing around and having a blast. At night, we gathered around a campfire, sharing stories and singing our favorite songs. The atmosphere was magical, and it was a wonderful bonding experience for everyone. I made many new friends during this trip, and we laughed so much together. That trip truly brought us closer as a class!',
    fullVietnameseText:
      'Chuyến đi đảo Cát Bà cùng trường là kỷ niệm khó quên! Chúng tôi đi xe buýt và phà ra đảo, leo núi ngắm toàn cảnh đảo xanh mát và tắm biển thỏa thích. Buổi tối quây quần bên đống lửa trại ca hát đã gắn kết cả lớp gần nhau hơn bao giờ hết.',
    clauses: [
      { en: 'My school trip to Cat Ba was unforgettable!', vi: 'Chuyến đi Cát Bà cùng trường thật khó quên!', isEnd: true },
      { en: 'We enjoyed hiking and breathtaking island views.', vi: 'Chúng tôi đi bộ leo núi ngắm toàn cảnh đảo.', isEnd: true },
      { en: 'At night, we gathered around a campfire singing.', vi: 'Đêm đến, cả lớp quây quần bên lửa trại ca hát.', isEnd: true },
      { en: 'That trip truly brought us closer as a class!', vi: 'Chuyến đi đã gắn kết cả lớp chúng tôi!', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 32: A MEMORABLE GIFT
  // =========================================================================
  buildLesson({
    id: 'topic-32-gift',
    topicNumber: 32,
    topicGroup: '32. Memories & Gifts',
    title: 'Bài 32: A Memorable Gift - First Bicycle (Chiếc xe đạp đầu tiên)',
    category: '32. Memories & Gifts',
    fullText:
      'A memorable gift I received was my first bicycle for my birthday. When I saw it, I was filled with excitement! The bike was bright red and shiny, and it looked amazing. I couldn’t wait to hop on and ride it. I spent the entire day practicing, even though I fell a few times. But I never gave up because I was determined to learn. Once I figured it out, I felt so proud of myself! I rode my bike around the neighborhood, discovering new streets and hidden spots. That bike gave me so much joy and a sense of freedom. I remember that day with a big smile, as it was the start of many fun adventures. That bicycle will always hold a special place in my heart!',
    fullVietnameseText:
      'Món quà đáng nhớ nhất mà tôi nhận được là chiếc xe đạp đầu tiên vào ngày sinh nhật. Chiếc xe màu đỏ tươi sáng bóng. Tôi đã dành cả ngày tập đi dù bị ngã vài lần. Khi biết đi, tôi tự hào đạp xe quanh xóm khám phá những con ngõ mới với cảm giác tự do tuyệt vời.',
    clauses: [
      { en: 'A memorable gift was my first bicycle.', vi: 'Món quà đáng nhớ là chiếc xe đạp đầu tiên.', isEnd: true },
      { en: 'The bike was bright red and shiny.', vi: 'Chiếc xe màu đỏ tươi sáng bóng.', isEnd: true },
      { en: 'I practiced all day and learned how to ride.', vi: 'Tôi tập cả ngày và đã biết đi xe.', isEnd: true },
      { en: 'That bike gave me joy and a sense of freedom.', vi: 'Chiếc xe đem lại niềm vui và cảm giác tự do.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 33: A MEMORABLE MEAL (TET DINNER)
  // =========================================================================
  buildLesson({
    id: 'topic-33-meal',
    topicNumber: 33,
    topicGroup: '33. Food & Festivals',
    title: 'Bài 33: A Memorable Meal - Family Tet Dinner (Bữa cơm tất niên ngày Tết)',
    category: '33. Food & Festivals',
    fullText:
      'A memorable meal for me was a family dinner during Tet. We gathered at my grandparents\' house, and the table was full of delicious food. There were traditional dishes like banh chung and pickled vegetables. I remember everyone laughing and sharing stories around the table. My grandma made her special soup, which everyone loves. We enjoyed the food and the time spent together. The atmosphere was warm and joyful. I felt grateful to be with my family for this special occasion. We talked about our favorite memories from past Tet celebrations. That meal brought us closer together and made me appreciate my family even more. It will always hold a special place in my heart.',
    fullVietnameseText:
      'Bữa ăn đáng nhớ nhất đối với tôi là bữa cơm gia đình ngày Tết tại nhà ông bà. Bàn ăn đầy ắp các món truyền thống như bánh chưng và dưa hành. Tiếng cười nói rộn rã và bát canh đặc biệt của bà làm không khí ấm áp ngập tràn. Bữa cơm nhắc nhở tôi thêm trân quý gia đình mình.',
    clauses: [
      { en: 'A memorable meal was our family Tet dinner.', vi: 'Bữa ăn đáng nhớ là bữa cơm tất niên ngày Tết.', isEnd: true },
      { en: 'We gathered at my grandparents’ house.', vi: 'Cả nhà quây quần tại nhà ông bà.', isEnd: true },
      { en: 'We enjoyed traditional dishes like banh chung.', vi: 'Mọi người thưởng thức bánh chưng truyền thống.', isEnd: true },
      { en: 'The atmosphere was warm, joyful, and loving.', vi: 'Không khí ấm cúng, rộn rã và yêu thương.', isEnd: true },
    ],
  }),

  // =========================================================================
  // TOPIC 34: A MEMORABLE ENGLISH LESSON
  // =========================================================================
  buildLesson({
    id: 'topic-34-english-lesson',
    topicNumber: 34,
    topicGroup: '34. Education & Lessons',
    title: 'Bài 34: A Memorable English Lesson - Poetry (Tiết học làm thơ Tiếng Anh)',
    category: '34. Education & Lessons',
    fullText:
      'One of my most memorable English lessons was when we explored poetry. Our teacher brought in different poems, and we were excited to read them. She explained how poems express feelings and tell stories in unique ways. We learned about styles like haiku and free verse. Then, the teacher encouraged us to write our own poems. I felt nervous at first, but it turned out to be fun. I wrote a short poem about nature and shared it with the class. Everyone cheered, making me feel proud. What I loved most was how supportive the teacher was. She reminded us that there are no strict rules in poetry, allowing us to express ourselves freely. That lesson made me love English even more and showed me the power of words.',
    fullVietnameseText:
      'Một trong những tiết học Tiếng Anh đáng nhớ nhất là khi chúng tôi khám phá thi ca. Cô giáo hướng dẫn các thể thơ như haiku và thơ tự do, sau đó khuyến khích chúng tôi tự viết bài thơ của riêng mình. Tôi đã viết về thiên nhiên và được cả lớp cổ vũ. Tiết học đã thắp lên trong tôi tình yêu sâu sắc với Tiếng Anh và sức mạnh của ngôn từ.',
    clauses: [
      { en: 'A memorable English lesson was about poetry.', vi: 'Tiết học tiếng Anh đáng nhớ là về thơ ca.', isEnd: true },
      { en: 'The teacher encouraged us to write our own poems.', vi: 'Cô giáo khuyến khích chúng tôi tự làm thơ.', isEnd: true },
      { en: 'I wrote a poem about nature and felt proud.', vi: 'Tôi viết về thiên nhiên và cảm thấy rất tự hào.', isEnd: true },
      { en: 'That lesson made me love English even more.', vi: 'Tiết học làm tôi thêm yêu môn Tiếng Anh.', isEnd: true },
    ],
  }),
];
