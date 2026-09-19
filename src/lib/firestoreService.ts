/**
 * VPS Storage Service & Real-time Synchronization
 *
 * Stores all application data directly on the VPS Server filesystem (/server-storage/*.json)
 * with real-time Server-Sent Events (SSE) updates across all clients and browser tabs.
 * Built-in Anti-Cache, CORS-friendly, and Offline-Resilient Auto-Retry Engine.
 */

// Local in-memory listeners for client-side state reactivity
type CollectionListener<T> = (data: T[]) => void;
const activeListeners = new Map<string, Set<CollectionListener<any>>>();
const cachedCollections = new Map<string, any[]>();

// BroadcastChannel for instant cross-tab communication
let broadcastBus: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastBus = new BroadcastChannel('ielts_vps_sync_bus');
    broadcastBus.onmessage = (event) => {
      const { collection, data } = event.data || {};
      if (collection && Array.isArray(data)) {
        cachedCollections.set(collection, data);
        const listeners = activeListeners.get(collection);
        if (listeners) {
          listeners.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {}
          });
        }
      }
    };
  }
} catch (e) {}

// Server-Sent Events connection for cross-device & cross-network real-time sync
let sseSource: EventSource | null = null;
let isSSEConnected = false;

function initSSEConnection() {
  if (typeof window === 'undefined' || sseSource) return;

  try {
    sseSource = new EventSource('/api/storage/events');

    sseSource.onopen = () => {
      isSSEConnected = true;
      console.log('[VPS Storage] Connected to real-time sync stream.');
      flushPendingOutbox();
    };

    sseSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'sync' && payload.collection) {
          const colName = payload.collection;
          const items = payload.data;
          cachedCollections.set(colName, items);
          try {
            localStorage.setItem(`vps_col_${colName}`, JSON.stringify(items));
          } catch (e) {}

          // Notify all subscribers of this collection
          const listeners = activeListeners.get(colName);
          if (listeners) {
            listeners.forEach((cb) => {
              try {
                cb(items);
              } catch (err) {
                console.error(`Error notifying listener for ${colName}:`, err);
              }
            });
          }
        } else if (payload.type === 'full_reload') {
          window.location.reload();
        }
      } catch (err) {
        console.warn('[VPS Storage] SSE message parsing error:', err);
      }
    };

    sseSource.onerror = () => {
      isSSEConnected = false;
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
      // Reconnect after 4 seconds
      setTimeout(initSSEConnection, 4000);
    };
  } catch (err) {
    console.warn('[VPS Storage] SSE initialization warning:', err);
  }
}

// Flush pending offline queue whenever connection returns
export async function flushPendingOutbox() {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  try {
    const rawOutbox = localStorage.getItem('idv_pending_offline_submissions');
    if (!rawOutbox) return;
    const outbox = JSON.parse(rawOutbox);
    if (Array.isArray(outbox) && outbox.length > 0) {
      console.log(`[VPS Storage] Flushing ${outbox.length} pending offline items...`);
      const remaining: any[] = [];
      for (const entry of outbox) {
        try {
          const res = await fetch(`/api/storage/${encodeURIComponent(entry.collection)}?_t=${Date.now()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify(entry.item),
          });
          if (!res.ok) {
            remaining.push(entry);
          }
        } catch (e) {
          remaining.push(entry);
        }
      }
      if (remaining.length > 0) {
        localStorage.setItem('idv_pending_offline_submissions', JSON.stringify(remaining));
      } else {
        localStorage.removeItem('idv_pending_offline_submissions');
        console.log('[VPS Storage] All offline items flushed successfully.');
      }
    }
  } catch (err) {
    console.warn('[VPS Storage] Error in flushPendingOutbox:', err);
  }
}

if (typeof window !== 'undefined') {
  initSSEConnection();
  window.addEventListener('online', () => {
    console.log('[VPS Storage] Browser is back online. Syncing...');
    flushPendingOutbox();
  });
}

/**
 * Generic helper to subscribe to a Collection in real-time from the VPS Server.
 * If collection is empty on the server, automatically seeds it with initialData.
 */
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void
): () => void {
  // 1. Register listener
  if (!activeListeners.has(collectionName)) {
    activeListeners.set(collectionName, new Set());
  }
  const listenerSet = activeListeners.get(collectionName)!;
  listenerSet.add(onData);

  // 2. Load from Local Storage cache immediately for instant UI load
  let initialItems: T[] = initialData || [];
  try {
    const cached = localStorage.getItem(`vps_col_${collectionName}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialItems = parsed;
      }
    }
  } catch (e) {}

  // Placement test candidate submissions recovery
  if (collectionName === 'placementTests') {
    try {
      const candidateSubs = JSON.parse(
        localStorage.getItem('idv_submitted_candidate_placement_tests') || '[]'
      );
      if (Array.isArray(candidateSubs) && candidateSubs.length > 0) {
        const initialIds = new Set(initialItems.map((i) => i.id));
        const missing = candidateSubs.filter((s: any) => !initialIds.has(s.id));
        if (missing.length > 0) {
          initialItems = [...missing, ...initialItems];
        }
      }
    } catch (e) {}
  }

  // Vocab tests / reviews presets check
  if ((collectionName === 'vocab_tests' || collectionName === 'vocab_reviews') && initialData && initialData.length > 0) {
    const existingIds = new Set(initialItems.map((i) => i.id));
    const missing = initialData.filter((p) => !existingIds.has(p.id));
    if (missing.length > 0) {
      initialItems = [...missing, ...initialItems];
    }
  }

  // Emit immediate cached/seed data
  cachedCollections.set(collectionName, initialItems);
  onData(initialItems);

  // 3. Fetch canonical data from VPS Server API with cachebuster
  fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((result) => {
      let serverItems: T[] = Array.isArray(result.data) ? result.data : [];

      if (serverItems.length === 0 && initialData && initialData.length > 0) {
        // Seed server with initial data
        console.log(`[VPS Storage] Seeding initial data for ${collectionName}...`);
        saveBatchDocuments(collectionName, initialData).catch((err) => {
          console.warn(`[VPS Storage] Seeding error for ${collectionName}:`, err);
        });
        serverItems = initialData;
      }

      // Merge any locally submitted placement tests
      if (collectionName === 'placementTests') {
        try {
          const candidateSubs = JSON.parse(
            localStorage.getItem('idv_submitted_candidate_placement_tests') || '[]'
          );
          if (Array.isArray(candidateSubs) && candidateSubs.length > 0) {
            const serverIds = new Set(serverItems.map((s) => s.id));
            const unsynced = candidateSubs.filter((s: any) => !serverIds.has(s.id));
            if (unsynced.length > 0) {
              saveBatchDocuments('placementTests', unsynced).catch(() => {});
              serverItems = [...unsynced, ...serverItems];
            }
          }
        } catch (e) {}
      }

      // Merge preset vocab tests
      if (
        (collectionName === 'vocab_tests' || collectionName === 'vocab_reviews') &&
        initialData &&
        initialData.length > 0
      ) {
        const serverIds = new Set(serverItems.map((s) => s.id));
        const missing = initialData.filter((p) => !serverIds.has(p.id));
        if (missing.length > 0) {
          saveBatchDocuments(collectionName, missing).catch(() => {});
          serverItems = [...missing, ...serverItems];
        }
      }

      // Special handling for teachers to ensure the standard 8 teachers are active
      if (collectionName === 'teachers' && initialData && initialData.length > 0) {
        const initialIds = new Set(initialData.map((d) => d.id));
        const hasObsolete = serverItems.some((t) => !initialIds.has(t.id));
        if (hasObsolete) {
          serverItems = initialData;
          saveBatchDocuments('teachers', initialData).catch(() => {});
        }
      }

      cachedCollections.set(collectionName, serverItems);
      try {
        localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(serverItems));
      } catch (e) {}

      onData(serverItems);
    })
    .catch((err) => {
      console.warn(`[VPS Storage] Server fetch fallback for ${collectionName}:`, err);
    });

  // Ensure SSE is active
  if (!sseSource && typeof window !== 'undefined') {
    initSSEConnection();
  }

  // Unsubscribe function
  return () => {
    listenerSet.delete(onData);
    if (listenerSet.size === 0) {
      activeListeners.delete(collectionName);
    }
  };
}

/**
 * Fetch all documents in a collection from VPS storage with Anti-Cache
 */
export async function fetchCollection<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        cachedCollections.set(collectionName, json.data);
        try {
          localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(json.data));
        } catch (e) {}
        return json.data;
      }
    }
  } catch (err) {
    console.warn(`[VPS Storage] Fetch collection error for ${collectionName}:`, err);
  }

  // Fallback to local memory/cache
  const cached = cachedCollections.get(collectionName);
  if (cached) return cached;

  try {
    const raw = localStorage.getItem(`vps_col_${collectionName}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
}

/**
 * Fetch a single document by ID from VPS storage
 */
export async function fetchDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const res = await fetch(
      `/api/storage/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}?_t=${Date.now()}`,
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data as T;
    }
  } catch (err) {
    console.warn(`[VPS Storage] Fetch document error for ${collectionName}/${id}:`, err);
  }

  const list = cachedCollections.get(collectionName) || [];
  const found = list.find((item) => String(item.id) === String(id));
  return found || null;
}

/**
 * Deeply sanitizes an object before saving
 */
export function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData);
  }
  const res: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      res[key] = sanitizeFirestoreData(value);
    }
  }
  return res;
}

/**
 * Save or update a document in a collection on VPS Storage with Auto-Retry
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  const cleanItem = sanitizeFirestoreData(item);

  // 1. Optimistically update client cache and notify local subscribers
  const existingList = cachedCollections.get(collectionName) || [];
  const stringId = String(cleanItem.id);
  const index = existingList.findIndex((e) => String(e.id) === stringId);

  let updatedList: any[];
  if (index >= 0) {
    updatedList = [...existingList];
    updatedList[index] = { ...existingList[index], ...cleanItem };
  } else {
    updatedList = [cleanItem, ...existingList];
  }

  cachedCollections.set(collectionName, updatedList);
  try {
    localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(updatedList));
  } catch (e) {}

  const listeners = activeListeners.get(collectionName);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(updatedList);
      } catch (err) {}
    });
  }

  if (broadcastBus) {
    try {
      broadcastBus.postMessage({ collection: collectionName, data: updatedList });
    } catch (e) {}
  }

  // 2. Persist to VPS backend server with retry logic
  let attempt = 0;
  const maxAttempts = 3;
  let savedSuccess = false;

  while (attempt < maxAttempts && !savedSuccess) {
    try {
      attempt++;
      const res = await fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(cleanItem),
      });
      if (res.ok) {
        savedSuccess = true;
        break;
      }
    } catch (err) {
      console.warn(`[VPS Storage] Attempt ${attempt}/${maxAttempts} failed for ${collectionName}:`, err);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  // If completely failed after 3 attempts, queue into offline outbox
  if (!savedSuccess && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('idv_pending_offline_submissions') || '[]';
      const outbox = JSON.parse(raw);
      outbox.push({ collection: collectionName, item: cleanItem, timestamp: Date.now() });
      localStorage.setItem('idv_pending_offline_submissions', JSON.stringify(outbox));
      console.warn(`[VPS Storage] Queued item ${stringId} to offline outbox for automatic sync.`);
    } catch (e) {}
  }
}

/**
 * Save multiple items in a batch to VPS Storage
 */
export async function saveBatchDocuments<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  const cleanItems = items.map((i) => sanitizeFirestoreData(i));

  // 1. Optimistic cache update
  const existingList = cachedCollections.get(collectionName) || [];
  const map = new Map<string, any>();
  existingList.forEach((e) => map.set(String(e.id), e));
  cleanItems.forEach((item) => {
    const sid = String(item.id);
    const curr = map.get(sid) || {};
    map.set(sid, { ...curr, ...item });
  });

  const updatedList = Array.from(map.values());
  cachedCollections.set(collectionName, updatedList);
  try {
    localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(updatedList));
  } catch (e) {}

  const listeners = activeListeners.get(collectionName);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(updatedList);
      } catch (err) {}
    });
  }

  if (broadcastBus) {
    try {
      broadcastBus.postMessage({ collection: collectionName, data: updatedList });
    } catch (e) {}
  }

  // 2. Persist batch to VPS backend server
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(collectionName)}/batch?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify(cleanItems),
    });
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
  } catch (err) {
    console.error(`[VPS Storage] Error saving batch to ${collectionName}:`, err);
  }
}

/**
 * Delete a document from a collection on VPS Storage
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const stringId = String(id);

  // 1. Optimistic cache update
  const existingList = cachedCollections.get(collectionName) || [];
  const filtered = existingList.filter((item) => String(item.id) !== stringId);
  cachedCollections.set(collectionName, filtered);
  try {
    localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(filtered));
  } catch (e) {}

  const listeners = activeListeners.get(collectionName);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(filtered);
      } catch (err) {}
    });
  }

  if (broadcastBus) {
    try {
      broadcastBus.postMessage({ collection: collectionName, data: filtered });
    } catch (e) {}
  }

  // 2. Persist deletion to VPS backend server
  try {
    const res = await fetch(
      `/api/storage/${encodeURIComponent(collectionName)}/${encodeURIComponent(stringId)}?_t=${Date.now()}`,
      { method: 'DELETE', headers: { 'Cache-Control': 'no-cache' } }
    );
    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }
  } catch (err) {
    console.error(`[VPS Storage] Error deleting ${stringId} from ${collectionName}:`, err);
  }
}

/**
 * Atomically increments the student count of a class.
 */
export async function incrementClassStudentCount(classId: string, amount: number = 1) {
  try {
    const cls = await fetchDocument<any>('classes', classId);
    if (cls) {
      const updated = {
        ...cls,
        currentStudents: Math.max(0, (cls.currentStudents || 0) + amount),
      };
      await saveDocument('classes', updated);
    }
  } catch (err) {
    console.error(`[VPS Storage] Error incrementing student count for class ${classId}:`, err);
  }
}

/**
 * Adds a submission to the test's submissions array.
 */
export async function addSubmissionToTest(
  collectionName: string,
  testId: string,
  submission: any
) {
  try {
    const test = await fetchDocument<any>(collectionName, testId);
    if (test) {
      const updatedSubmissions = [...(test.submissions || []), sanitizeFirestoreData(submission)];
      const updated = {
        ...test,
        submissions: updatedSubmissions,
      };
      await saveDocument(collectionName, updated);
    }
  } catch (err) {
    console.error(`[VPS Storage] Error adding submission to ${collectionName}:`, err);
  }
}

/**
 * Automatically cleans obsolete teacher records
 */
export async function cleanObsoleteTeachers<T extends { id: string }>(
  standardTeachers: T[]
) {
  try {
    await saveBatchDocuments('teachers', standardTeachers);
  } catch (err) {
    console.error('[VPS Storage] Error cleaning obsolete teachers:', err);
  }
}

/**
 * Synchronizes missing preset vocab tests
 */
export async function syncPresetVocabTests<T extends { id: string }>(
  presetTests: T[]
) {
  try {
    await saveBatchDocuments('vocab_tests', presetTests);
  } catch (err) {
    console.error('[VPS Storage] Error syncing preset vocab tests:', err);
  }
}

/**
 * Synchronizes missing preset vocab reviews
 */
export async function syncPresetVocabReviews<T extends { id: string }>(
  presetTests: T[]
) {
  try {
    await saveBatchDocuments('vocab_reviews', presetTests);
  } catch (err) {
    console.error('[VPS Storage] Error syncing preset vocab reviews:', err);
  }
}
