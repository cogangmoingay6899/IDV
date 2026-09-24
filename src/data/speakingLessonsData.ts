// Complete collection of 34+ Speaking Practice Lessons
// extracted from the user's PRE IELTS SPEAKING curriculum with 100% exact sentence fidelity.

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

function splitWords(clause: string): PillWord[] {
  const tokens = clause.trim().split(/\s+/).filter(Boolean);
  return tokens.map((token) => {
    const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isFunction = FUNCTION_WORDS.has(clean);
    const bold = !isFunction || /\d/.test(token) || clean.length > 5;
    return { text: token, bold };
  });
}

interface RawLessonDef {
  id: string;
  topicNumber: number;
  topicGroup: string;
  title: string;
  category: string;
  fullText: string;
  fullVietnameseText: string;
  intonationText?: string;
  linkingRules?: { phrase: string; ipa: string }[];
  keyPhonetics?: { word: string; ipa: string }[];
}

function buildLesson(raw: RawLessonDef): RichSpeechLesson {
  // Automatically split fullText into sentence clauses 100% faithfully
  const rawSentences = raw.fullText.match(/[^.!?]+[.!?]+/g) || [raw.fullText];
  const clauses = rawSentences.map((s, idx) => ({
    en: s.trim(),
    vi: idx === 0 ? raw.fullVietnameseText : '',
    isEnd: true,
  }));

  const chunkRows: ChunkRow[] = [];
  let currentRow: ChunkPill[] = [];

  clauses.forEach((c, idx) => {
    const isEnd = c.isEnd ?? /[.!?]$/.test(c.en.trim());
    const subClauses = c.en.split(/[,;]\s+/);
    subClauses.forEach((sub, subIdx) => {
      const isLastSub = subIdx === subClauses.length - 1;
      const subText = sub.trim() + (isLastSub ? (c.en.match(/[.!?]$/)?.[0] || '') : (c.en.includes(',') ? ',' : ''));
      const words = splitWords(subText);
      const ipa = clauseToIPA(words);

      currentRow.push({
        id: `${raw.id}-p${idx + 1}-${subIdx + 1}`,
        words,
        vietnameseText: subIdx === 0 ? c.vi : '',
        isEndSentencePause: isLastSub && isEnd,
        ipa,
      });

      if ((isLastSub && isEnd) || currentRow.length >= 3) {
        chunkRows.push({ pills: currentRow });
        currentRow = [];
      }
    });
  });

  if (currentRow.length > 0) {
    chunkRows.push({ pills: currentRow });
  }

  const fullIpaText = chunkRows
    .map((r) => r.pills.map((p) => p.ipa).join('  ') + (r.pills[r.pills.length - 1]?.isEndSentencePause ? ' //' : ''))
    .join('\n');

  const intonation =
    raw.intonationText ||
    raw.fullText
      .replace(/([,;])/g, ' ↗$1')
      .replace(/([.!?])/g, ' ↘$1')
      .replace(/\s+/g, ' ');

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
  buildLesson({
    id: 'ed-practice-2',
    topicNumber: 0,
    topicGroup: 'LUYỆN PHÁT ÂM ĐUÔI -ED',
    title: 'LUYỆN ED - Practice 2: At the office & Meeting',
    category: 'LUYỆN ED',
    fullText:
      'Yesterday was so busy! At the office, I worked hard with my team. We developed a new advertising plan. Our meeting lasted about two hours. I remembered an advertising plan that worked five years ago, and I suggested we try that again. We needed to get the manager’s approval. We called him on the office phone. He admitted that the idea seemed good, but he believed we should lower the budget. We reported our numbers to him and talked about the budget for a long time. Finally, he decided to give us the money we wanted.',
    fullVietnameseText:
      'Hôm qua thật là bận rộn! Ở văn phòng, tôi đã làm việc chăm chỉ cùng nhóm của mình. Chúng tôi đã phát triển một kế hoạch quảng cáo mới. Cuộc họp kéo dài hai giờ. Tôi nhớ lại kế hoạch năm xưa và đề xuất thử lại. Cuối cùng sếp đã duyệt tiền.',
  }),

  buildLesson({
    id: 'ed-practice-3',
    topicNumber: 0,
    topicGroup: 'LUYỆN PHÁT ÂM ĐUÔI -ED',
    title: 'LUYỆN ED - Practice 3: Shopping & Home',
    category: 'LUYỆN ED',
    fullText:
      'On the way home, I stopped at the mall. I had promised my daughter a new MP3 player for her birthday. At the electronics store, I played songs and listened for quality sound. I decided to buy one at a medium price. When I got home, the kitchen was a mess. At our house, we have agreed to clean up after ourselves, so I asked around to find out who had cooked last. That person turned out to be my son. While he washed the dishes, I sat at the kitchen table and talked to him about his school work. Last year, he tested into an advanced program, and I wanted to see how he was doing. He seemed happy with it. He started telling me about his classes and what he learned that day.',
    fullVietnameseText:
      'Trên đường về, tôi ghé trung tâm mua máy MP3 cho con gái. Về nhà thấy bếp bừa bộn, hóa ra con trai nấu ăn. Tôi ngồi trò chuyện về việc học tập nâng cao của con trong lúc con rửa bát.',
  }),

  buildLesson({
    id: 'topic-1-studying',
    topicNumber: 1,
    topicGroup: '1. Self Introduction',
    title: 'Bài 1: Self Introduction - Studying',
    category: '1. Self Introduction',
    fullText:
      'I am a 10th-grade student at Tran Nguyen Han High School in Hai Phong. I enjoy studying Math, Literature, and English. Outside of school, I like playing soccer with my friends and reading books. Every day, I wake up at 6 a.m. to get ready for school. After school, I usually spend time doing homework and helping my parents with household chores. What I like most about my school is the friendly learning environment and how the teachers are always willing to help students. I love my school and always try my best to study well so that I can get into a university in the future. My goal is to become a successful and helpful person in society.',
    fullVietnameseText:
      'Tôi là học sinh lớp 10 trường THPT Trần Nguyên Hãn, Hải Phòng. Tôi thích học Toán, Văn, Anh, thích đá bóng và đọc sách. Mục tiêu của tôi là trở thành người thành công và có ích cho xã hội.',
  }),

  buildLesson({
    id: 'topic-1-working',
    topicNumber: 1,
    topicGroup: '1. Self Introduction',
    title: 'Bài 1B: Self Introduction - Working',
    category: '1. Self Introduction',
    fullText:
      'My name is Ha. I work at a logistics company in Hai Phong. My job is to manage shipments, organize deliveries, and make sure goods are transported smoothly. Outside of work, I like playing soccer with friends and reading books in my free time. Every day, I wake up at 6 a.m. to get ready for work. After work, I relax, read, or help my family with chores. What I like most about my job is the friendly environment and how my colleagues always help each other. I enjoy my work and try my best to improve my skills so that I can grow in my career. My goal is to be successful in the logistics field.',
    fullVietnameseText:
      'Tôi làm việc tại công ty logistics ở Hải Phòng, quản lý lô hàng và vận chuyển. Tôi thích môi trường thân thiện ở đây và mục tiêu là thành công trong lĩnh vực logistics.',
  }),

  buildLesson({
    id: 'topic-2-family',
    topicNumber: 2,
    topicGroup: '2. My Family',
    title: 'Bài 2: My Family',
    category: '2. My Family',
    fullText:
      'There are four people in my family: my parents, my sister, and me. My dad is an engineer at a government office, my mom is a housewife, my sister teaches at a primary school, and I’m a high school student. We all wake up at 6 a.m. every day. After breakfast, my dad and sister head to work, my mom does housework, and I go to school. We have lunch at noon and dinner at 7 p.m. In the evening, we usually spend about an hour in the living room, chatting or watching TV. After that, my sister and I go to our rooms to get ready for the next day. My family is really close, and we love each other a lot. We hope to stay together under the same roof forever.',
    fullVietnameseText:
      'Gia đình tôi có 4 người với các công việc khác nhau. Buổi tối cả nhà quây quần trò chuyện, xem tivi. Gia đình tôi rất gắn bó và yêu thương nhau.',
  }),

  buildLesson({
    id: 'topic-3-mom',
    topicNumber: 3,
    topicGroup: '3. My Mom',
    title: 'Bài 3: My Mom',
    category: '3. My Mom',
    fullText:
      'My mom is a housewife. She takes care of the household, cooks meals, and manages everything at home. She wakes up early every day to prepare breakfast and make sure everyone is ready for the day. In her free time, she enjoys gardening and watching TV. What I admire most about my mom is her dedication to our family. She always makes sure we are happy and well taken care of. Even though she doesn’t have a job outside, she works hard every day to keep our home running smoothly. I love my mom very much and I really look up to her.',
    fullVietnameseText:
      'Mẹ tôi là nội trợ chăm lo chu đáo cho gia đình. Điều tôi ngưỡng mộ nhất là sự tận tụy và hy sinh của mẹ. Tôi rất yêu và kính trọng mẹ.',
  }),

  buildLesson({
    id: 'topic-4a-social-media',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4A: My Hobbies - Social Media',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is using social media. I enjoy connecting with friends, sharing photos, and staying updated on what’s happening in the world. I often spend time browsing through posts, watching videos, and discovering new content that interests me. What I like most about social media is how easy it is to communicate and learn new things. It helps me stay in touch with people and explore different topics that I wouldn’t normally come across in my daily life.',
    fullVietnameseText:
      'Sở thích của tôi là dùng mạng xã hội để kết nối bạn bè, cập nhật tin tức và học hỏi những điều mới mẻ mỗi ngày.',
  }),

  buildLesson({
    id: 'topic-4b-football',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4B: My Hobbies - Football',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is playing football. I enjoy running on the field, working with my teammates, and scoring goals. It’s a great way for me to stay active and have fun with my friends. We usually play after school or on weekends. What I like most about football is the teamwork and excitement of the game. It helps me stay fit and improve my skills while also building strong friendships. Playing football is always a fun and energizing experience for me.',
    fullVietnameseText:
      'Sở thích của tôi là chơi bóng đá để rèn luyện sức khỏe, tinh thần đồng đội và tận hưởng niềm vui bên bạn bè.',
  }),

  buildLesson({
    id: 'topic-4c-gaming',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4C: My Hobbies - Gaming',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is playing games. I enjoy playing video games with my friends and trying out new games on my own. It’s a fun way for me to relax and unwind after a long day. I usually play games in the evening or on weekends. What I like most about gaming is the excitement and challenges it brings. It helps me improve my problem-solving skills and allows me to connect with friends online. Playing games is always an enjoyable experience for me.',
    fullVietnameseText:
      'Sở thích của tôi là chơi điện tử để thư giãn, rèn luyện tư duy giải quyết vấn đề và kết nối trực tuyến với bạn bè.',
  }),

  buildLesson({
    id: 'topic-4d-music',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4D: My Hobbies - Music',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is listening to music. I enjoy discovering new songs and artists, as well as listening to my favorite genres like pop and rock. Music helps me relax and feel good after a busy day. I usually listen to music while studying or during my free time. What I like most about music is how it can change my mood and inspire me. It connects me with different cultures and emotions. Listening to music is always a wonderful experience for me.',
    fullVietnameseText:
      'Sở thích của tôi là nghe nhạc pop và rock để thư giãn, thay đổi tâm trạng và truyền cảm hứng sau giờ học bận rộn.',
  }),

  buildLesson({
    id: 'topic-4e-films',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4E: My Hobbies - Films',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is watching movies. I enjoy exploring different genres, such as action, comedy, and drama. Watching movies is a great way for me to relax and escape into different stories. I usually watch movies in the evenings or on weekends. What I like most about movies is how they can take me on exciting adventures and make me feel different emotions. They also help me understand various cultures and perspectives. Watching movies is always an enjoyable experience for me.',
    fullVietnameseText:
      'Sở thích của tôi là xem phim hành động, hài và chính kịch để thư giãn, trải nghiệm những câu chuyện thú vị và hiểu thêm các nền văn hóa.',
  }),

  buildLesson({
    id: 'topic-4f-running',
    topicNumber: 4,
    topicGroup: '4. My Hobbies',
    title: 'Bài 4F: My Hobbies - Running',
    category: '4. My Hobbies',
    fullText:
      'One of my hobbies is running. I enjoy going for runs in the park or around my neighborhood. Running helps me stay fit and clear my mind. I usually run in the mornings or in the evenings after work or school. What I like most about running is the feeling of freedom it gives me and how it helps reduce stress. It’s also a great way to challenge myself and set personal goals. Running is always a refreshing experience for me.',
    fullVietnameseText:
      'Sở thích của tôi là chạy bộ để giữ gìn vóc dáng, giải tỏa căng thẳng và tận hưởng cảm giác tự do tuyệt vời.',
  }),

  buildLesson({
    id: 'topic-5-school',
    topicNumber: 5,
    topicGroup: '5. My School',
    title: 'Bài 5: My School',
    category: '5. My School',
    fullText:
      'My school is called Ngo Quyen High School. It is a friendly place where students learn and grow together. The teachers are kind and always ready to help us with our studies. I enjoy studying subjects like Math, English, and Literature. After classes, I often play football with my friends on the school grounds. We have a nice library where I can read books and prepare for exams. There are also many clubs and activities that I can join, like the art club and the science club. Overall, I really love my school and appreciate all the opportunities it gives me to learn.',
    fullVietnameseText:
      'Trường THPT Ngô Quyền của tôi rất thân thiện với thầy cô tận tình, thư viện đẹp và nhiều câu lạc bộ hữu ích. Tôi thực sự yêu ngôi trường này.',
  }),

  buildLesson({
    id: 'topic-6-city',
    topicNumber: 6,
    topicGroup: '6. My City',
    title: 'Bài 6: My City - Hai Phong City',
    category: '6. My City',
    fullText:
      'Hai Phong is my city, and it is a beautiful place by the sea. The city has many parks, where people can relax and enjoy nature. There is also delicious seafood available at local restaurants, and I love trying new dishes. I enjoy walking along the waterfront and visiting the local markets to see the fresh produce. The people here are friendly and welcoming, making everyone feel at home. There are also many interesting places to explore, like museums and temples that show our culture. The city is always bustling with activities, especially during festivals. I love living in Hai Phong because it has a vibrant atmosphere and rich history.',
    fullVietnameseText:
      'Hải Phòng là thành phố ven biển xinh đẹp với công viên, hải sản ngon, người dân thân thiện và bầu không khí sôi động đầy tự hào.',
  }),

  buildLesson({
    id: 'topic-7-close-friend',
    topicNumber: 7,
    topicGroup: '7. My Close Friend',
    title: 'Bài 7: My Close Friend',
    category: '7. My Close Friend',
    fullText:
      'My close friend is named Minh. We have been friends since childhood, and we share many great memories together. We enjoy playing games and watching movies during our free time. Minh is very funny, and he always makes me laugh, which brightens my day. We also help each other with our studies, especially when preparing for exams. Sometimes we go out to eat or explore new places in the city. I really appreciate having such a good friend in my life. Our friendship means a lot to me, and I hope it lasts forever.',
    fullVietnameseText:
      'Bạn thân của tôi là Minh. Chúng tôi chơi thân từ nhỏ, cùng học tập, giải trí và chia sẻ mọi niềm vui cuộc sống.',
  }),

  buildLesson({
    id: 'topic-8-favorite-teacher',
    topicNumber: 8,
    topicGroup: '8. My Favorite Teacher',
    title: 'Bài 8: My Favorite Teacher',
    category: '8. My Favorite Teacher',
    fullText:
      'My favorite teacher is Ms. Hoa. She teaches us English, and her classes are always engaging and fun. Ms. Hoa is very caring and always encourages us to do our best. She shares interesting stories that make learning more enjoyable. I appreciate how she helps us improve our speaking skills by organizing group activities. After class, she is always available if we have questions or need help. I admire her teaching style and enjoy her classes a lot. She inspires me to work hard and love learning.',
    fullVietnameseText:
      'Giáo viên yêu thích của tôi là cô Hoa dạy tiếng Anh. Các giờ học của cô rất lôi cuốn, giúp cải thiện kỹ năng nói và truyền cảm hứng học tập mạnh mẽ.',
  }),

  buildLesson({
    id: 'topic-9-neighbor',
    topicNumber: 9,
    topicGroup: '9. My Neighbor',
    title: 'Bài 9: My Neighbor',
    category: '9. My Neighbor',
    fullText:
      'My neighbor is a very friendly person. Her name is Mrs. Lan, and she lives next door with her family. She has two kids who play outside every day. We often wave at each other and say hello. Mrs. Lan likes to grow flowers in her garden, and they are beautiful. Sometimes, she shares her flowers with us, which makes us really happy. She also loves to bake, and we enjoy her tasty cookies. I feel lucky to have such a nice neighbor who always makes our neighborhood better!',
    fullVietnameseText:
      'Hàng xóm của tôi là bác Lan tốt bụng. Bác trồng hoa đẹp và nướng bánh ngon. Tôi rất may mắn có được người hàng xóm tuyệt vời này.',
  }),

  buildLesson({
    id: 'topic-10-weather',
    topicNumber: 10,
    topicGroup: '10. My Favorite Weather',
    title: 'Bài 10: My Favorite Weather',
    category: '10. My Favorite Weather',
    fullText:
      'My favorite weather is sunny and warm. I love when the sun shines brightly and the sky is blue. It makes me feel happy and energetic. On sunny days, I enjoy going outside to play sports or hang out with friends. I also like to go for walks in the park and enjoy nature. Warm weather allows me to wear my favorite clothes, like t-shirts and shorts. It’s the perfect time to have picnics and enjoy ice cream. Sunny weather always brightens my mood and makes everything feel more enjoyable.',
    fullVietnameseText:
      'Thời tiết yêu thích của tôi là nắng ấm rực rỡ, giúp tôi tràn đầy năng lượng để chơi thể thao, đi dạo và tận hưởng các buổi dã ngoại.',
  }),

  buildLesson({
    id: 'topic-11-song',
    topicNumber: 11,
    topicGroup: '11. My Favorite Song',
    title: 'Bài 11: My Favorite Song',
    category: '11. My Favorite Song',
    fullText:
      'My favorite song is "Shape of You" by Ed Sheeran. I love the rhythm and melody; it always makes me want to dance. The lyrics are catchy, and I enjoy singing along when I hear it. I listen to this song when I’m feeling happy or just want to relax. It reminds me of good times with my friends at parties. Whenever I hear this song, I can’t help but smile and feel energized. Music is a big part of my life, and this song is definitely one of my favorites.',
    fullVietnameseText:
      'Bài hát yêu thích của tôi là "Shape of You" với giai điệu bắt tai, mang lại năng lượng tích cực và những kỷ niệm vui vẻ bên bạn bè.',
  }),

  buildLesson({
    id: 'topic-12-film',
    topicNumber: 12,
    topicGroup: '12. My Favorite Film',
    title: 'Bài 12: My Favorite Film',
    category: '12. My Favorite Film',
    fullText:
      'My favorite film is "The Lion King." I love the story about family and friendship. The animation is beautiful, and the music is amazing. I enjoy watching it with my family on weekends. Each character has a special role that makes the movie exciting. The lessons about courage and responsibility really touch my heart. I can watch this film over and over again without getting bored. "The Lion King" always brings back wonderful memories of my childhood.',
    fullVietnameseText:
      'Bộ phim yêu thích của tôi là "The Lion King" với câu chuyện cảm động về gia đình, tình bạn và những bài học sâu sắc về lòng dũng cảm.',
  }),

  buildLesson({
    id: 'topic-13-tv-show',
    topicNumber: 13,
    topicGroup: '13. My Favorite TV Show',
    title: 'Bài 13: My Favorite TV Show',
    category: '13. My Favorite TV Show',
    fullText:
      'My favorite TV show is "Anh Trai Say Hi" on Hi Vie channel. It is a fun and entertaining program that makes me laugh. The show features funny skits and interesting challenges. I enjoy watching the hosts interact with each other and with the audience. They often share funny stories and jokes that brighten my day. I watch this show every weekend with my family. It’s a great way for us to relax and have fun together. "Anh Trai Say Hi" always puts me in a good mood.',
    fullVietnameseText:
      'Chương trình truyền hình yêu thích của tôi là "Anh Trai Say Hi", mang lại tiếng cười sảng khoái và phút giây thư giãn tuyệt vời bên gia đình.',
  }),

  buildLesson({
    id: 'topic-14-book',
    topicNumber: 14,
    topicGroup: '14. My Favorite Book',
    title: 'Bài 14: My Favorite Book',
    category: '14. My Favorite Book',
    fullText:
      'My favorite book is "Harry Potter and the Sorcerer\'s Stone." I love the story of Harry and his adventures at Hogwarts. The magic and friendship in the book inspire me a lot. I enjoy reading about the characters and their challenges. The writing is engaging, and I always feel excited when I read it. I often read this book when I want to escape into a different world. It’s a fantastic journey that makes me dream big. "Harry Potter" will always be one of my favorite books.',
    fullVietnameseText:
      'Cuốn sách yêu thích của tôi là "Harry Potter" với những chuyến phiêu lưu phép thuật kỳ thú tại Hogwarts, truyền cảm hứng cho tôi mơ ước lớn.',
  }),

  buildLesson({
    id: 'topic-15-crab-noodles',
    topicNumber: 15,
    topicGroup: '15. My Favorite Dish',
    title: 'Bài 15: My Favorite Dish - Crab Noodle Soup',
    category: '15. My Favorite Dish',
    fullText:
      'My favorite dish is banh da cua, which is a delicious noodle soup from Hải Phòng. The broth is rich and flavorful, made with crab and spices. I love the soft rice noodles and the fresh herbs that come with it. When I eat banh da cua, I feel happy and satisfied. It\'s a popular dish, and I often enjoy it at local restaurants. I like to add chili for some extra spice. Eating this dish reminds me of my hometown and the good times with my family and friends.',
    fullVietnameseText:
      'Món ăn yêu thích của tôi là bánh đa cua Hải Phòng với nước dùng đậm đà hương vị cua, sợi bánh mềm và rau thơm, gợi nhớ quê hương.',
  }),

  buildLesson({
    id: 'topic-16-spicy-bread',
    topicNumber: 16,
    topicGroup: '16. My Favorite Dish',
    title: 'Bài 16: My Favorite Dish - Spicy Bread',
    category: '16. My Favorite Dish',
    fullText:
      'My favorite dish is banh mi cay, which is a spicy Vietnamese sandwich filled with delicious ingredients. I love the crispy bread and the variety of fillings, like meats, vegetables, and spicy sauce. Each bite is a burst of flavor, and I enjoy the mix of textures. I often eat banh mi cay for breakfast or as a snack. It’s a popular street food, and I like to get it from local vendors. Eating this dish makes me feel energized and happy. I can’t resist the delicious taste!',
    fullVietnameseText:
      'Món ăn yêu thích của tôi là bánh mì cay đường phố với bánh giòn rụm, pa-tê béo và tương ớt cay nồng bùng nổ hương vị.',
  }),

  buildLesson({
    id: 'topic-17-milk-tea',
    topicNumber: 17,
    topicGroup: '17. My Favorite Drink',
    title: 'Bài 17: My Favorite Drink - Milk Tea',
    category: '17. My Favorite Drink',
    fullText:
      'My favorite drink is milk tea. I love its sweet and creamy taste. The combination of tea and milk makes it very refreshing. I often add some pearls for a fun texture. I enjoy drinking milk tea while hanging out with my friends. It’s a popular drink, and there are many places to try it. I like to experiment with different flavors, like matcha or chocolate. Milk tea always makes me feel relaxed and happy.',
    fullVietnameseText:
      'Thức uống yêu thích của tôi là trà sữa vị ngọt béo với trân châu dai giòn, thưởng thức cùng bạn bè giúp tôi thư giãn tuyệt vời.',
  }),

  buildLesson({
    id: 'topic-18-ronaldo',
    topicNumber: 18,
    topicGroup: '18. My Favorite Sports Player',
    title: 'Bài 18: My Favorite Sports Player - Ronaldo',
    category: '18. My Favorite Sports Player',
    fullText:
      'My favorite sports player is Ronaldo. He is an amazing soccer player from Portugal. I admire his skills and dedication on the field. Ronaldo works very hard to be the best, and he inspires many young players. I love watching him play, especially when he scores goals. His speed and technique are incredible. Ronaldo has won many awards, and he always gives his best in every game. He is my role model in sports and life.',
    fullVietnameseText:
      'Cầu thủ yêu thích của tôi là Ronaldo, siêu sao bóng đá Bồ Đào Nha. Tôi ngưỡng mộ sự chăm chỉ, kỹ năng tuyệt đỉnh và tinh thần cống hiến của anh.',
  }),

  buildLesson({
    id: 'topic-19-taylor-swift',
    topicNumber: 19,
    topicGroup: '19. My Favorite Singer',
    title: 'Bài 19: My Favorite Singer - Taylor Swift',
    category: '19. My Favorite Singer',
    fullText:
      'My favorite singer is Taylor Swift. I love her music and the stories she tells in her songs. Her voice is beautiful and always makes me feel emotional. I enjoy listening to her songs during different moments in my life. She writes about love, friendship, and personal experiences. I admire her talent and creativity. I often go to her concerts with my friends, and it\'s always a fun experience. Taylor Swift is truly an inspiration to me.',
    fullVietnameseText:
      'Ca sĩ yêu thích của tôi là Taylor Swift với giọng ca tuyệt đẹp và những sáng tác ý nghĩa về tình yêu, tình bạn truyền cảm hứng lớn.',
  }),

  buildLesson({
    id: 'topic-20-tom-hanks',
    topicNumber: 20,
    topicGroup: '20. My Favorite Actor',
    title: 'Bài 20: My Favorite Actor - Tom Hanks',
    category: '20. My Favorite Actor',
    fullText:
      'My favorite actor is Tom Hanks. He is an incredible performer with many great movies. I love how he can play different types of characters. His acting makes me feel connected to the story. I have watched many of his films, and each one is special. Tom Hanks brings emotion and depth to his roles. I admire his kindness and humility off-screen as well. He is a true legend in the film industry.',
    fullVietnameseText:
      'Diễn viên yêu thích của tôi là Tom Hanks, huyền thoại điện ảnh với khả năng hóa thân xuất sắc, mang lại cảm xúc sâu lắng trong từng vai diễn.',
  }),

  buildLesson({
    id: 'topic-21-ideal-house',
    topicNumber: 21,
    topicGroup: '21. My Ideal House',
    title: 'Bài 21: My Ideal House',
    category: '21. My Ideal House',
    fullText:
      'My ideal house is a cozy and comfortable place. I would love a house with a big garden full of flowers and trees. Inside, I want a spacious living room where my family can relax together. I would also like a bright kitchen where I can cook delicious meals. My bedroom should be a peaceful space where I can study and sleep well. I dream of having a small library with my favorite books. The house should be in a quiet neighborhood with friendly neighbors. Overall, my ideal house would be a warm and happy place for my family.',
    fullVietnameseText:
      'Ngôi nhà lý tưởng của tôi ấm cúng, có vườn hoa lớn, phòng khách rộng, bếp sáng sủa và phòng ngủ yên bình cùng thư viện nhỏ sách.',
  }),

  buildLesson({
    id: 'topic-22-ideal-job',
    topicNumber: 22,
    topicGroup: '22. My Ideal Job',
    title: 'Bài 22: My Ideal Job - Logistics Manager',
    category: '22. My Ideal Job',
    fullText:
      'My ideal job is to work as a logistics manager. I want to help organize and manage the transportation of goods. I enjoy solving problems and making sure everything runs smoothly. Working in a team with friendly colleagues is very important to me. I hope to learn new skills and advance in my career. I want a job that allows me to travel and meet different people. My ideal job would be challenging but also rewarding. I believe I can make a positive impact in the logistics industry.',
    fullVietnameseText:
      'Công việc lý tưởng của tôi là quản lý logistics, điều phối vận tải, giải quyết vấn đề và phát triển sự nghiệp trong môi trường năng động.',
  }),

  buildLesson({
    id: 'topic-23-ideal-boyfriend',
    topicNumber: 23,
    topicGroup: '23. My Ideal Partner',
    title: 'Bài 23: My Ideal Boyfriend',
    category: '23. My Ideal Partner',
    fullText:
      'My ideal boyfriend is kind and supportive. He should be someone I can talk to about anything. I want him to share my interests and enjoy spending time together. Having a good sense of humor is important; I love to laugh. I hope he is also respectful and values our relationship. It would be great if he enjoys outdoor activities like hiking or cycling. I appreciate someone who is ambitious and has goals for the future. Overall, my ideal boyfriend would be my best friend and partner.',
    fullVietnameseText:
      'Bạn trai lý tưởng là người tốt bụng, thấu hiểu, hài hước, có chí tiến thủ và cùng tôi chia sẻ những hoạt động ngoài trời.',
  }),

  buildLesson({
    id: 'topic-24-ideal-girlfriend',
    topicNumber: 24,
    topicGroup: '24. My Ideal Partner',
    title: 'Bài 24: My Ideal Girlfriend',
    category: '24. My Ideal Partner',
    fullText:
      'My ideal girlfriend is someone who is caring and understanding. I want her to be supportive of my dreams and goals. It’s important that we share common interests and enjoy spending time together. I love a girl who can make me laugh and has a great sense of humor. She should also be honest and open in our relationship. I appreciate someone who enjoys trying new things, like going to new restaurants or traveling. I hope she is also ambitious and has her own goals. Overall, my ideal girlfriend would be my partner in every adventure.',
    fullVietnameseText:
      'Bạn gái lý tưởng là người chu đáo, thấu hiểu, hài hước, chân thành và thích cùng tôi khám phá những điều mới mẻ trong cuộc sống.',
  }),

  buildLesson({
    id: 'topic-25-ideal-husband',
    topicNumber: 25,
    topicGroup: '25. My Ideal Spouse',
    title: 'Bài 25: My Ideal Husband',
    category: '25. My Ideal Spouse',
    fullText:
      'My ideal husband is someone who is loving and responsible. I want him to be supportive of my goals and dreams. It’s important that we communicate openly and honestly. I appreciate a man who has a good sense of humor and can make me laugh. He should also be hardworking and ambitious. I hope he enjoys spending time with family and values our relationship. It would be great if he shares my interests and enjoys doing activities together. Overall, my ideal husband would be my partner in life and my best friend.',
    fullVietnameseText:
      'Người chồng lý tưởng giàu tình cảm, có trách nhiệm, chăm chỉ, hài hước và luôn coi trọng gia đình để làm bạn đời tri kỷ.',
  }),

  buildLesson({
    id: 'topic-26-ideal-wife',
    topicNumber: 26,
    topicGroup: '26. My Ideal Spouse',
    title: 'Bài 26: My Ideal Wife',
    category: '26. My Ideal Spouse',
    fullText:
      'My ideal wife is someone who is caring and supportive. I want her to be my partner in every aspect of life. It’s important that we can talk openly and share our feelings. I appreciate a woman who has a good sense of humor and enjoys having fun. She should also be hardworking and have her own goals. I hope she enjoys spending time with family and values our relationship. It would be great if he shares my interests and enjoys activities together. Overall, my ideal wife would be my best friend and the love of my life.',
    fullVietnameseText:
      'Người vợ lý tưởng chu đáo, thấu hiểu, chăm chỉ và có mục tiêu sống, luôn chia sẻ mọi buồn vui và là tình yêu lớn của đời tôi.',
  }),

  buildLesson({
    id: 'topic-27-cooking',
    topicNumber: 27,
    topicGroup: '27. Skills',
    title: 'Bài 27: My Cooking Skills',
    category: '27. Skills',
    fullText:
      'I enjoy cooking, but I’m still learning. I can make a few simple dishes like fried rice, noodles, and omelets. My mom taught me how to cook, and she helps me when I try new recipes. Sometimes, I mess up, but I always try again. I like cooking because it’s fun to experiment with different flavors. My favorite dish to make is fried rice because it’s easy and tasty. My family enjoys my cooking, and that makes me happy. I hope to improve my cooking skills even more in the future!',
    fullVietnameseText:
      'Tôi thích nấu các món đơn giản như cơm rang, mì xào. Mẹ đã dạy tôi nấu ăn và gia đình rất thích thưởng thức món ăn do tôi làm.',
  }),

  buildLesson({
    id: 'topic-28-swimming',
    topicNumber: 28,
    topicGroup: '28. Skills',
    title: 'Bài 28: My Swimming Skills',
    category: '28. Skills',
    fullText:
      'I enjoy swimming, but I’m not an expert yet. I can swim basic strokes like freestyle and backstroke. I learned how to swim when I was younger, and I’ve been practicing ever since. Sometimes, I get tired quickly, but I’m trying to improve my stamina. Swimming is fun because it helps me stay active and healthy. I feel relaxed when I’m in the water, especially on hot days. I want to get better at swimming so I can swim faster and longer. One day, I hope to swim in the ocean confidently!',
    fullVietnameseText:
      'Tôi biết bơi sải và bơi ngửa, giúp duy trì sức khỏe và thư giãn trong những ngày hè. Tôi hy vọng sẽ sớm bơi lội tự tin ngoài đại dương.',
  }),

  buildLesson({
    id: 'topic-29-sports-day',
    topicNumber: 29,
    topicGroup: '29. Memorable Experiences',
    title: 'Bài 29: A Memorable Experience at School',
    category: '29. Memorable Experiences',
    fullText:
      'One of my best memories at school is sports day! Everyone was excited to join different games and competitions. I joined the relay race with my friends, and we practiced a lot. On the big day, we cheered for each other and felt nervous. When it was our turn, we ran as fast as we could. Crossing the finish line together was so much fun! To our surprise, our team won first place, and we were very proud. After the race, we celebrated with ice cream and laughter. It was a great day that brought us closer together. I will always remember the fun we had!',
    fullVietnameseText:
      'Kỷ niệm đẹp nhất ở trường là ngày hội thể thao khi đội chúng tôi vô địch chạy tiếp sức và cùng nhau ăn kem mừng chiến thắng.',
  }),

  buildLesson({
    id: 'topic-30-halong-bay',
    topicNumber: 30,
    topicGroup: '30. Travel & Trips',
    title: 'Bài 30: A Memorable Family Trip - Ha Long Bay',
    category: '30. Travel & Trips',
    fullText:
      'One of the most memorable family trips I took was to Ha Long Bay. The moment we arrived, I was blown away by the breathtaking views of beautiful islands and clear blue water. We hopped on a boat and set off to explore the stunning caves. It was amazing to see the unique rock formations that seemed to tell stories of their own. We even went swimming in the warm water and soaked up the sunshine. In the evening, we had a fantastic barbecue on the beach while sharing fun stories and laughter. The atmosphere was lively, filled with joy and excitement. I felt so grateful to be with my family in such a magical place. Every moment was an adventure, and we made memories that will last a lifetime. Ha Long Bay will always hold a special place in my heart!',
    fullVietnameseText:
      'Chuyến đi gia đình đáng nhớ nhất là đến Vịnh Hạ Long, ngắm đảo đá kỳ vĩ, bơi lội và tiệc BBQ trên bãi biển tuyệt vời.',
  }),

  buildLesson({
    id: 'topic-31-cat-ba',
    topicNumber: 31,
    topicGroup: '31. Travel & Trips',
    title: 'Bài 31: A Memorable School Trip - Cat Ba Island',
    category: '31. Travel & Trips',
    fullText:
      'My school trip to Cat Ba Island was absolutely unforgettable! We started our adventure by traveling on a bus and then hopping on a ferry. When we arrived, the scenery was stunning, with lush greenery and sparkling blue water. We went hiking and were rewarded with breathtaking views of the island. One of the highlights was swimming in the clear water with my friends, splashing around and having a blast. At night, we gathered around a campfire, sharing stories and singing our favorite songs. The atmosphere was magical, and it was a wonderful bonding experience for everyone. I made many new friends during this trip, and we laughed so much together. That trip truly brought us closer as a class!',
    fullVietnameseText:
      'Chuyến đi Cát Bà cùng trường thật khó quên với cảnh sắc thiên nhiên, leo núi, tắm biển và đêm lửa trại gắn kết cả lớp.',
  }),

  buildLesson({
    id: 'topic-32-gift',
    topicNumber: 32,
    topicGroup: '32. Memories & Gifts',
    title: 'Bài 32: A Memorable Gift - First Bicycle',
    category: '32. Memories & Gifts',
    fullText:
      'A memorable gift I received was my first bicycle for my birthday. When I saw it, I was filled with excitement! The bike was bright red and shiny, and it looked amazing. I couldn’t wait to hop on and ride it. I spent the entire day practicing, even though I fell a few times. But I never gave up because I was determined to learn. Once I figured it out, I felt so proud of myself! I rode my bike around the neighborhood, discovering new streets and hidden spots. That bike gave me so much joy and a sense of freedom. I remember that day with a big smile, as it was the start of many fun adventures. That bicycle will always hold a special place in my heart!',
    fullVietnameseText:
      'Món quà đáng nhớ là chiếc xe đạp đỏ đầu tiên. Sau khi kiên trì tập luyện, tôi đã tự tin đạp xe khám phá mọi nẻo đường.',
  }),

  buildLesson({
    id: 'topic-33-meal',
    topicNumber: 33,
    topicGroup: '33. Food & Festivals',
    title: 'Bài 33: A Memorable Meal - Tet Dinner',
    category: '33. Food & Festivals',
    fullText:
      'A memorable meal for me was a family dinner during Tet. We gathered at my grandparents\' house, and the table was full of delicious food. There were traditional dishes like bánh chưng and pickled vegetables. I remember everyone laughing and sharing stories around the table. My grandma made her special soup, which everyone loves. We enjoyed the food and the time spent together. The atmosphere was warm and joyful. I felt grateful to be with my family for this special occasion. We talked about our favorite memories from past Tet celebrations. That meal brought us closer together and made me appreciate my family even more. It will always hold a special place in my heart.',
    fullVietnameseText:
      'Bữa ăn tất niên ngày Tết quây quần bên gia đình với các món truyền thống và không khí ấm áp, yêu thương.',
  }),

  buildLesson({
    id: 'topic-34-english-lesson',
    topicNumber: 34,
    topicGroup: '34. Education & Lessons',
    title: 'Bài 34: A Memorable English Lesson - Poetry',
    category: '34. Education & Lessons',
    fullText:
      'One of my most memorable English lessons was when we explored poetry. Our teacher brought in different poems, and we were excited to read them. She explained how poems express feelings and tell stories in unique ways. We learned about styles like haiku and free verse. Then, the teacher encouraged us to write our own poems. I felt nervous at first, but it turned out to be fun. I wrote a short poem about nature and shared it with the class. Everyone cheered, making me feel proud. What I loved most was how supportive the teacher was. She reminded us that there are no strict rules in poetry, allowing us to express ourselves freely. That lesson made me love English even more and showed me the power of words.',
    fullVietnameseText:
      'Tiết học tiếng Anh làm thơ về thiên nhiên đã giúp tôi tự tin thể hiện cảm xúc và thêm yêu môn học này.',
  }),
];
