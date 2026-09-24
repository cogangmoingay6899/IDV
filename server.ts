import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Universal CORS handler to prevent CORS errors on any domain (ieltsduongvu.com, subdomains, iframes)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Expires, Accept'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Strict Anti-Caching for all API routes (prevents Cloudflare/LiteSpeed/Nginx/Varnish from caching dynamic data)
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Body parsing middleware (generous 50MB limit to easily handle long essays, audio recordings, and large student batches)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Storage directory on VPS filesystem
  const dataDir = path.join(process.cwd(), 'server-storage');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // File path for tracking deleted IDs across all devices
  const deletedIdsFilePath = path.join(dataDir, 'deleted_ids.json');

  const getDeletedIds = (): Set<string> => {
    try {
      if (fs.existsSync(deletedIdsFilePath)) {
        const raw = fs.readFileSync(deletedIdsFilePath, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return new Set(list);
      }
    } catch (e) {}
    // Default initial tombstones for cleaned mock classes and tests
    return new Set([
      'pt-101', 'pt-102', 'pt-103',
      'cls-29', 'cls-41', 'cls-50', 'cls-58', 'cls-59', 'cls-61', 'cls-63', 'cls-64', 'cls-65',
      'cls-66', 'cls-67', 'cls-68', 'cls-69', 'cls-70', 'cls-71', 'cls-72', 'cls-73', 'cls-74',
      'cls-75', 'cls-76', 'cls-77', 'cls-78', 'cls-79', 'cls-80', 'cls-81', 'cls-82', 'cls-83',
      'cls-84', 'cls-85', 'cls-86', 'cls-87', 'cls-88', 'cls-89', 'cls-90', 'cls-91', 'cls-92',
      'cls-93', 'cls-94'
    ]);
  };

  const addDeletedIds = (newIds: string[]) => {
    const current = getDeletedIds();
    let changed = false;
    for (const id of newIds) {
      if (id && !current.has(id)) {
        current.add(id);
        changed = true;
      }
    }
    if (changed || !fs.existsSync(deletedIdsFilePath)) {
      try {
        fs.writeFileSync(deletedIdsFilePath, JSON.stringify(Array.from(current), null, 2), 'utf-8');
        broadcastEvent({ type: 'deleted_ids_updated', ids: Array.from(current) });
      } catch (err) {
        console.error('[VPS Storage] Error writing deleted_ids.json:', err);
      }
    }
    return current;
  };

  // Initialize deleted_ids file on start
  addDeletedIds([]);

  // In-memory cache for ultra-fast response times
  const collectionsCache = new Map<string, any[]>();

  // SSE client connections for real-time synchronization across devices & tabs
  const sseClients = new Set<express.Response>();

  const broadcastEvent = (eventData: { type: string; collection?: string; id?: string; data?: any; ids?: string[] }) => {
    const payload = `data: ${JSON.stringify(eventData)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        sseClients.delete(client);
      }
    }
  };

  const getCollectionFilePath = (colName: string): string => {
    const safeName = colName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(dataDir, `${safeName}.json`);
  };

  const readCollectionFromDisk = (colName: string): any[] => {
    try {
      const filePath = getCollectionFilePath(colName);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error(`[VPS Storage] Error reading collection "${colName}":`, err);
    }
    return [];
  };

  const writeCollectionToDisk = (colName: string, items: any[]) => {
    try {
      const filePath = getCollectionFilePath(colName);
      const tempPath = `${filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.error(`[VPS Storage] Error writing collection "${colName}":`, err);
    }
  };

  const getCollectionData = (colName: string): any[] => {
    if (!collectionsCache.has(colName)) {
      const data = readCollectionFromDisk(colName);
      collectionsCache.set(colName, data);
    }
    const rawList = collectionsCache.get(colName) || [];
    const delSet = getDeletedIds();
    return rawList.filter((item) => !delSet.has(item.id) && item.id !== 'meta_deleted_ids');
  };

  const saveCollectionData = (colName: string, items: any[], notifySSE: boolean = true) => {
    const delSet = getDeletedIds();
    const cleanItems = items.filter((item) => !delSet.has(item.id) && item.id !== 'meta_deleted_ids');
    collectionsCache.set(colName, cleanItems);
    writeCollectionToDisk(colName, cleanItems);
    if (notifySSE) {
      broadcastEvent({ type: 'sync', collection: colName, data: cleanItems });
    }
  };

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      storageType: 'vps_filesystem',
      storagePath: dataDir,
      time: new Date().toISOString(),
      activeSSEConnections: sseClients.size,
      corsEnabled: true,
      cacheDisabled: true,
    });
  });

  // --- REAL-TIME SSE ENDPOINT ---
  app.get('/api/storage/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write('retry: 3000\n');
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // --- GENERIC VPS STORAGE CRUD ENDPOINTS ---

  // 1. GET full collection
  app.get('/api/storage/:collection', (req, res) => {
    try {
      const colName = req.params.collection;
      const data = getCollectionData(colName);
      res.json({ success: true, collection: colName, count: data.length, data });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 2. GET single document by ID
  app.get('/api/storage/:collection/:id', (req, res) => {
    try {
      const { collection: colName, id } = req.params;
      const data = getCollectionData(colName);
      const found = data.find((item) => String(item.id) === String(id));
      if (!found) {
        return res.status(404).json({ error: `Document ${id} not found in ${colName}` });
      }
      res.json({ success: true, collection: colName, data: found });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 3. POST / UPSERT single document
  app.post('/api/storage/:collection', (req, res) => {
    try {
      const colName = req.params.collection;
      const item = req.body;
      if (!item || item.id === undefined || item.id === null) {
        return res.status(400).json({ error: 'Item must contain an "id" field' });
      }

      const stringId = String(item.id);
      const existing = getCollectionData(colName);
      const index = existing.findIndex((e) => String(e.id) === stringId);

      let updatedList: any[];
      if (index >= 0) {
        updatedList = [...existing];
        updatedList[index] = { ...existing[index], ...item };
      } else {
        updatedList = [item, ...existing];
      }

      saveCollectionData(colName, updatedList, true);
      res.json({ success: true, collection: colName, data: item });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 4. POST BATCH UPSERT documents
  app.post('/api/storage/:collection/batch', (req, res) => {
    try {
      const colName = req.params.collection;
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Body must be an array of items' });
      }

      const existing = getCollectionData(colName);
      const existingMap = new Map<string, any>();
      existing.forEach((e) => existingMap.set(String(e.id), e));

      items.forEach((item) => {
        if (item && item.id !== undefined && item.id !== null) {
          const stringId = String(item.id);
          const current = existingMap.get(stringId) || {};
          existingMap.set(stringId, { ...current, ...item });
        }
      });

      const updatedList = Array.from(existingMap.values());
      saveCollectionData(colName, updatedList, true);
      res.json({ success: true, collection: colName, count: updatedList.length, data: updatedList });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 5. DELETE single document
  app.delete('/api/storage/:collection/:id', (req, res) => {
    try {
      const { collection: colName, id } = req.params;
      addDeletedIds([String(id)]);
      const existing = getCollectionData(colName);
      const filtered = existing.filter((item) => String(item.id) !== String(id));
      saveCollectionData(colName, filtered, true);
      broadcastEvent({ type: 'delete', collection: colName, id: String(id) });
      res.json({ success: true, message: `Deleted ${id} from ${colName}` });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 5b. DELETE / CLEAR ENTIRE collection
  app.delete('/api/storage/:collection', (req, res) => {
    try {
      const colName = req.params.collection;
      const existing = getCollectionData(colName);
      if (existing.length > 0) {
        addDeletedIds(existing.map((item) => String(item.id)));
      }
      saveCollectionData(colName, [], true);
      res.json({ success: true, message: `Purged all data in collection ${colName}` });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 5c. GLOBAL DELETED IDS ENDPOINTS FOR CROSS-DEVICE SYNC
  app.get('/api/deleted-ids', (req, res) => {
    res.json({ success: true, deletedIds: Array.from(getDeletedIds()) });
  });

  app.post('/api/deleted-ids', (req, res) => {
    try {
      const idsToAdd: string[] = [];
      if (Array.isArray(req.body?.ids)) {
        idsToAdd.push(...req.body.ids.map(String));
      } else if (req.body?.id) {
        idsToAdd.push(String(req.body.id));
      }
      const updated = addDeletedIds(idsToAdd);
      res.json({ success: true, count: updated.size, deletedIds: Array.from(updated) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error updating deleted ids' });
    }
  });

  // 6. BACKUP & EXPORT ALL DATA (Full database export in 1 click)
  app.get('/api/storage-backup/export', (req, res) => {
    try {
      const allFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));
      const fullBackup: Record<string, any[]> = {};
      for (const f of allFiles) {
        const colName = f.replace(/\.json$/, '');
        fullBackup[colName] = getCollectionData(colName);
      }
      res.setHeader('Content-Disposition', `attachment; filename=ielts_vps_backup_${Date.now()}.json`);
      res.json({
        exportedAt: new Date().toISOString(),
        collectionsCount: Object.keys(fullBackup).length,
        data: fullBackup,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Backup error' });
    }
  });

  // 7. RESTORE BACKUP DATA (Full database restore in 1 click)
  app.post('/api/storage-backup/import', (req, res) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Invalid backup format' });
      }
      for (const [colName, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          saveCollectionData(colName, items, false);
        }
      }
      // Broadcast full reload
      broadcastEvent({ type: 'full_reload' });
      res.json({ success: true, message: 'Backup restored successfully onto VPS' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Restore error' });
    }
  });

  // --- BACKWARDS COMPATIBILITY ROUTES FOR PLACEMENT TESTS ---
  app.get('/api/placement-tests', (req, res) => {
    try {
      const tests = getCollectionData('placementTests');
      res.json({ success: true, count: tests.length, data: tests });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server error' });
    }
  });

  app.post('/api/placement-tests', (req, res) => {
    try {
      const newTest = req.body;
      if (!newTest || !newTest.candidateName) {
        return res.status(400).json({ error: 'Candidate name is required' });
      }
      if (!newTest.id) {
        newTest.id = `pt-online-${Date.now()}`;
      }
      if (getDeletedIds().has(newTest.id)) {
        return res.status(400).json({ error: 'This test record was marked as deleted and cannot be re-added.' });
      }
      if (!newTest.submittedAt) {
        newTest.submittedAt = new Date().toISOString();
      }

      const existing = getCollectionData('placementTests');
      const filtered = existing.filter((t) => t.id !== newTest.id);
      const updated = [newTest, ...filtered];
      saveCollectionData('placementTests', updated, true);

      console.log(
        `[VPS Storage] Successfully saved placement test: ${newTest.candidateName} (${newTest.code || newTest.id})`
      );

      // Auto-push to Google Apps Script Webhook in the background
      const webhookUrl = req.body?.webhookUrl || 'https://script.google.com/macros/s/AKfycbyR_WM6kpyQZmdODOT8Z0okH0YSFDdqi_yJZ8riYOcVOx7bXeAayesEdIMWzoLsVj-J/exec';
      if (webhookUrl && webhookUrl.startsWith('http')) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test: newTest,
            candidateName: newTest.candidateName,
            phone: newTest.phone,
            submittedAt: newTest.submittedAt || new Date().toISOString(),
          }),
        }).catch((wErr) => console.warn('[VPS Webhook Proxy] Direct push error:', wErr));
      }

      res.json({ success: true, message: 'Saved successfully to VPS storage', data: newTest });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server error' });
    }
  });

  // --- TEST GOOGLE APPS SCRIPT WEBHOOK ---
  app.post('/api/test-webhook', async (req, res) => {
    try {
      const webhookUrl = req.body?.webhookUrl;
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        return res.json({ success: false, message: 'URL Webhook không hợp lệ.' });
      }

      const pingData = req.body?.pingData || {
        headers: ['Timestamp', 'Score', 'Họ tên của em', 'Số điện thoại của em'],
        row: [new Date().toLocaleString('vi-VN'), '100/100', '🧪 [Test Kết Nối]', '0999999999'],
      };

      const gRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pingData),
      });

      const text = await gRes.text();
      let isSuccess = false;
      let parsedMsg = '';

      try {
        const json = JSON.parse(text);
        if (json.status === 'success' || json.status === 'online') {
          isSuccess = true;
          parsedMsg = `Google Sheet phản hồi: OK (Sheet: ${json.sheetName || 'Mặc định'}, Tổng dòng: ${json.totalRows || 'Đã thêm'})`;
        } else {
          parsedMsg = json.message || JSON.stringify(json);
        }
      } catch (pe) {
        if (text.includes('html') || text.includes('<!DOCTYPE') || text.includes('Google')) {
          isSuccess = false;
          parsedMsg = 'Google chặn truy cập hoặc chưa cấp quyền. Lưu ý: Khi Triển khai (Deploy) Web App trong Apps Script, tại mục "Ai có quyền truy cập" (Who has access), bạn BẮT BUỘC phải chọn "Bất kỳ ai" (Anyone).';
        } else {
          parsedMsg = text.slice(0, 150);
        }
      }

      res.json({
        success: isSuccess,
        status: gRes.status,
        message: parsedMsg || (isSuccess ? 'Đã gửi thành công' : 'Lỗi kết nối Webhook'),
      });
    } catch (err: any) {
      res.json({
        success: false,
        message: 'Lỗi khi gọi Webhook: ' + (err?.message || 'Không thể kết nối'),
      });
    }
  });

  // --- MANUAL / BATCH SYNC TO GOOGLE APPS SCRIPT WEBHOOK (STRICTLY 1-WAY: APP -> GOOGLE SHEET) ---
  app.post('/api/sync-placement-webhook', async (req, res) => {
    try {
      const webhookUrl = req.body?.webhookUrl || 'https://script.google.com/macros/s/AKfycbyR_WM6kpyQZmdODOT8Z0okH0YSFDdqi_yJZ8riYOcVOx7bXeAayesEdIMWzoLsVj-J/exec';
      const providedTests = req.body?.tests;
      const testsToSync = (Array.isArray(providedTests) && providedTests.length > 0)
        ? providedTests
        : getCollectionData('placementTests');

      const { PLACEMENT_SHEET_COLUMNS, extractTestRowValues } = await import('./src/utils/placementGoogleSheets');

      let successCount = 0;
      for (let i = 0; i < testsToSync.length; i++) {
        const t = testsToSync[i];
        try {
          const rowData = extractTestRowValues(t, i);
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              headers: PLACEMENT_SHEET_COLUMNS,
              row: rowData,
              test: t,
              candidateName: t.candidateName,
              phone: t.phone,
              submittedAt: t.submittedAt || t.testDate || new Date().toISOString(),
            }),
          });
          successCount++;
        } catch (e) {}
      }

      res.json({ success: true, count: successCount, total: testsToSync.length, webhookUrl });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Webhook sync error' });
    }
  });

  app.delete('/api/placement-tests/:id', (req, res) => {
    try {
      const { id } = req.params;
      addDeletedIds([String(id)]);
      const existing = getCollectionData('placementTests');
      const filtered = existing.filter((t) => t.id !== id);
      saveCollectionData('placementTests', filtered, true);
      broadcastEvent({ type: 'delete', collection: 'placementTests', id: String(id) });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server error' });
    }
  });

  // --- AI PRONUNCIATION EVALUATION ENDPOINT ---
  app.post('/api/ai/evaluate-pronunciation', async (req, res) => {
    try {
      const { targetText, spokenText } = req.body;
      if (!targetText) {
        return res.status(400).json({ error: 'targetText is required' });
      }

      const cleanTarget = String(targetText).trim();
      const cleanSpoken = String(spokenText || '').trim();

      // Check if Gemini API Key exists
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

      if (apiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bạn là chuyên gia chấm điểm phát âm IELTS Speaking của trung tâm IELTS DƯƠNG VŨ.
Hãy đánh giá kết quả học viên đọc phát âm sau đây:
- Câu gốc cần đọc (Target Sentence): "${cleanTarget}"
- Nhận diện giọng nói thực tế của học viên (Spoken Text): "${cleanSpoken}"

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm Markdown codeblock \`\`\`json) với cấu trúc:
{
  "accuracyScore": 85, // Số nguyên từ 0 đến 100 thể hiện độ chính xác phát âm
  "feedbackNotes": "Nhận xét ngắn gọn 1-2 câu khen ngợi hoặc lưu ý cách phát âm trọng âm, nối âm (bằng tiếng Việt)",
  "mispronouncedWords": ["từ1", "từ2"] // Danh sách các từ học viên phát âm chưa chuẩn hoặc đọc thiếu
}`,
          });

          const resText = response.text || '';
          const cleanedJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return res.json({
            success: true,
            accuracyScore: parsed.accuracyScore ?? 80,
            feedbackNotes: parsed.feedbackNotes || 'Phát âm tương đối rõ ràng. Hãy chú ý nối âm và trọng âm nhé!',
            mispronouncedWords: parsed.mispronouncedWords || [],
          });
        } catch (geminiErr: any) {
          console.warn('[Gemini AI] Error in pronunciation evaluation, fallback to algorithm:', geminiErr?.message);
        }
      }

      // Algorithmic Fallback evaluation
      const targetWords = cleanTarget.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(/\s+/).filter(Boolean);
      const spokenWords = cleanSpoken.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(/\s+/).filter(Boolean);

      if (targetWords.length === 0) {
        return res.json({ success: true, accuracyScore: 100, feedbackNotes: 'Rất tốt!', mispronouncedWords: [] });
      }

      let matchCount = 0;
      const mispronounced: string[] = [];

      targetWords.forEach((tw) => {
        if (spokenWords.includes(tw)) {
          matchCount++;
        } else {
          mispronounced.push(tw);
        }
      });

      const score = Math.min(100, Math.round((matchCount / targetWords.length) * 100));
      let feedback = 'Phát âm tròn vàõ rõ tiếng!';
      if (score < 50) feedback = 'Cần chú ý đọc lại kĩ từng từ theo mẫu IPA nhé!';
      else if (score < 80) feedback = 'Đã phát âm khá tốt, chú ý nhấn trọng âm các từ chưa chuẩn.';

      res.json({
        success: true,
        accuracyScore: score,
        feedbackNotes: feedback,
        mispronouncedWords: mispronounced,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server error' });
    }
  });

  // --- DEDICATED HIGH-QUALITY KORE VOICE TTS ENDPOINT WITH DISK CACHE ---
  const audioCacheDir = path.join(dataDir, 'tts-cache');
  if (!fs.existsSync(audioCacheDir)) {
    fs.mkdirSync(audioCacheDir, { recursive: true });
  }

  app.post('/api/ai/tts-kore', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'text is required' });
      }

      const cleanText = text.trim();
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(`${voice}:${cleanText}`).digest('hex');
      const cacheFilePath = path.join(audioCacheDir, `${hash}.wav`);

      // 1. Return immediately from disk cache if already generated (offline on disk)
      if (fs.existsSync(cacheFilePath)) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        const stream = fs.createReadStream(cacheFilePath);
        return stream.pipe(res);
      }

      // 2. Generate using flagship Kore voice with gemini-3.8-flash-lite-tts
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'Gemini API Key not configured on server' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: cleanText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = aiResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio returned from Gemini Kore voice' });
      }

      const audioBuffer = Buffer.from(base64Audio, 'base64');

      // Save to disk cache for future instant offline playback
      try {
        fs.writeFileSync(cacheFilePath, audioBuffer);
      } catch (writeErr) {
        console.warn('[TTS Cache] Failed to write cache:', writeErr);
      }

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(audioBuffer);
    } catch (err: any) {
      console.error('[TTS Kore Error]:', err);
      res.status(500).json({ error: err?.message || 'Failed to synthesize speech with Kore' });
    }
  });


  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VPS Server] Running on http://localhost:${PORT}`);
    console.log(`[VPS Server] Storage directory: ${dataDir}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VPS server:', err);
});
