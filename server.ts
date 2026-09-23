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

  // In-memory cache for ultra-fast response times
  const collectionsCache = new Map<string, any[]>();

  // SSE client connections for real-time synchronization across devices & tabs
  const sseClients = new Set<express.Response>();

  const broadcastEvent = (eventData: { type: string; collection?: string; id?: string; data?: any }) => {
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
    return collectionsCache.get(colName) || [];
  };

  const saveCollectionData = (colName: string, items: any[], notifySSE: boolean = true) => {
    collectionsCache.set(colName, items);
    writeCollectionToDisk(colName, items);
    if (notifySSE) {
      broadcastEvent({ type: 'sync', collection: colName, data: items });
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
      const existing = getCollectionData(colName);
      const filtered = existing.filter((item) => String(item.id) !== String(id));
      saveCollectionData(colName, filtered, true);
      res.json({ success: true, message: `Deleted ${id} from ${colName}` });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
    }
  });

  // 5b. DELETE / CLEAR ENTIRE collection
  app.delete('/api/storage/:collection', (req, res) => {
    try {
      const colName = req.params.collection;
      saveCollectionData(colName, [], true);
      res.json({ success: true, message: `Purged all data in collection ${colName}` });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server storage error' });
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
      const existing = getCollectionData('placementTests');
      const filtered = existing.filter((t) => t.id !== id);
      saveCollectionData('placementTests', filtered, true);
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Server error' });
    }
  });

  // Vite middleware setup (development vs production)
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
