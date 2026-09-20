/**
 * Firebase Firestore Cloud Service & Real-time Dual-Sync Engine
 *
 * Provides persistent storage and real-time syncing across:
 * 1. Quản lý thông tin học viên & trạng thái đóng học phí (Students & Tuition records)
 * 2. Lưu kết quả bài kiểm tra đầu vào (Placement Tests & Candidate Answers)
 * 3. Lưu lịch sử điểm số bài kiểm tra từ vựng & bài test định kỳ (Vocab Tests, Reviews & Periodic Exam Scores)
 *
 * Also maintains resilient VPS filesystem / Local fallback so no data is ever lost.
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

// Local in-memory listeners for client-side state reactivity
type CollectionListener<T> = (data: T[]) => void;
const activeListeners = new Map<string, Set<CollectionListener<any>>>();
const cachedCollections = new Map<string, any[]>();
const firestoreUnsubscribers = new Map<string, Unsubscribe>();

// BroadcastChannel for instant cross-tab communication
let broadcastBus: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastBus = new BroadcastChannel('ielts_vps_sync_bus');
    broadcastBus.onmessage = (event) => {
      const { collection: colName, data } = event.data || {};
      if (colName && Array.isArray(data)) {
        cachedCollections.set(colName, data);
        const listeners = activeListeners.get(colName);
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

/**
 * Deeply sanitizes an object before saving (removes undefined, converts non-serializables)
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
 * Generic helper to subscribe to a Collection in real-time from Firebase Firestore.
 * Automatically seeds the collection with initialData if empty on first launch.
 */
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void
): () => void {
  // 1. Register listener in local subscriber registry
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
  if (
    (collectionName === 'vocab_tests' || collectionName === 'vocab_reviews') &&
    initialData &&
    initialData.length > 0
  ) {
    const existingIds = new Set(initialItems.map((i) => i.id));
    const missing = initialData.filter((p) => !existingIds.has(p.id));
    if (missing.length > 0) {
      initialItems = [...missing, ...initialItems];
    }
  }

  // Emit immediate cached/seed data so UI renders instantly
  cachedCollections.set(collectionName, initialItems);
  onData(initialItems);

  // 3. Connect real-time Firebase Firestore listener
  if (!firestoreUnsubscribers.has(collectionName) && typeof window !== 'undefined') {
    try {
      const colRef = collection(db, collectionName);
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreItems: T[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as T[];

            cachedCollections.set(collectionName, firestoreItems);
            try {
              localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(firestoreItems));
            } catch (e) {}

            const currentListeners = activeListeners.get(collectionName);
            if (currentListeners) {
              currentListeners.forEach((cb) => {
                try {
                  cb(firestoreItems);
                } catch (err) {}
              });
            }
          } else if (initialData && initialData.length > 0) {
            // Seed Firestore with initial records on very first boot
            console.log(`[Firebase Firestore] Seeding initial data for ${collectionName}...`);
            saveBatchDocuments(collectionName, initialData).catch((err) => {
              console.warn(`[Firebase Firestore] Seeding error for ${collectionName}:`, err);
            });
          }
        },
        (error) => {
          console.warn(`[Firebase Firestore] Snapshot listener fallback for ${collectionName}:`, error);
          // Fallback to VPS Server fetch if Firestore snapshot encountered permissions/network
          fetchFromVPSServer(collectionName, initialData, onData);
        }
      );
      firestoreUnsubscribers.set(collectionName, unsub);
    } catch (err) {
      console.warn(`[Firebase Firestore] Init error on ${collectionName}:`, err);
      fetchFromVPSServer(collectionName, initialData, onData);
    }
  }

  // Unsubscribe function
  return () => {
    listenerSet.delete(onData);
    if (listenerSet.size === 0) {
      activeListeners.delete(collectionName);
      const unsub = firestoreUnsubscribers.get(collectionName);
      if (unsub) {
        unsub();
        firestoreUnsubscribers.delete(collectionName);
      }
    }
  };
}

// Fallback helper to fetch from VPS endpoint
async function fetchFromVPSServer<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void
) {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (res.ok) {
      const result = await res.json();
      let serverItems: T[] = Array.isArray(result.data) ? result.data : [];
      if (serverItems.length > 0) {
        cachedCollections.set(collectionName, serverItems);
        try {
          localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(serverItems));
        } catch (e) {}
        onData(serverItems);
      }
    }
  } catch (e) {}
}

/**
 * Fetch all documents in a collection from Firestore (with VPS/local cache fallback)
 */
export async function fetchCollection<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items: T[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as T[];
      cachedCollections.set(collectionName, items);
      try {
        localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(items));
      } catch (e) {}
      return items;
    }
  } catch (err) {
    console.warn(`[Firebase Firestore] fetchCollection fallback for ${collectionName}:`, err);
  }

  // Fallback to VPS backend
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        cachedCollections.set(collectionName, json.data);
        return json.data;
      }
    }
  } catch (err) {}

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
 * Fetch a single document by ID from Firestore (with fallback)
 */
export async function fetchDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, String(id));
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as T;
    }
  } catch (err) {
    console.warn(`[Firebase Firestore] fetchDocument error for ${collectionName}/${id}:`, err);
  }

  const list = cachedCollections.get(collectionName) || [];
  const found = list.find((item) => String(item.id) === String(id));
  return found || null;
}

/**
 * Save or update a single document in Firestore (Dual persistence to Firebase + VPS)
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  const cleanItem = sanitizeFirestoreData(item);
  const stringId = String(cleanItem.id);

  // 1. Optimistically update client cache and notify local subscribers immediately
  const existingList = cachedCollections.get(collectionName) || [];
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

  // 2. Persist to Firebase Firestore
  try {
    const docRef = doc(db, collectionName, stringId);
    await setDoc(docRef, cleanItem, { merge: true });
    console.log(`✅ [Firebase Firestore] Saved ${collectionName}/${stringId}`);
  } catch (firestoreErr) {
    console.warn(`⚠️ [Firebase Firestore] Firestore save fallback:`, firestoreErr);
  }

  // 3. Dual-persist to VPS Server Storage (Guarantees local server & cross-network sync)
  try {
    fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify(cleanItem),
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Save multiple items in a batch to Firestore
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

  // 2. Batch write to Firestore
  try {
    const batch = writeBatch(db);
    cleanItems.slice(0, 450).forEach((item) => {
      const docRef = doc(db, collectionName, String(item.id));
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
    console.log(`✅ [Firebase Firestore] Batch saved ${cleanItems.length} items to ${collectionName}`);
  } catch (err) {
    console.warn(`⚠️ [Firebase Firestore] Batch save error on ${collectionName}:`, err);
  }

  // 3. Persist batch to VPS backend server
  try {
    fetch(`/api/storage/${encodeURIComponent(collectionName)}/batch?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify(cleanItems),
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Delete a document from Firestore and local cache
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

  // 2. Delete from Firestore
  try {
    const docRef = doc(db, collectionName, stringId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[Firebase Firestore] Delete error for ${collectionName}/${stringId}:`, err);
  }

  // 3. Delete from VPS
  try {
    fetch(`/api/storage/${encodeURIComponent(collectionName)}/${encodeURIComponent(stringId)}?_t=${Date.now()}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' },
    }).catch(() => {});
  } catch (e) {}
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
    console.error(`[Firebase Firestore] Error incrementing student count for class ${classId}:`, err);
  }
}

/**
 * Adds a submission or score record to the test's submissions array.
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
    console.error(`[Firebase Firestore] Error adding submission to ${collectionName}:`, err);
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
    console.error('[Firebase Firestore] Error cleaning obsolete teachers:', err);
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
    console.error('[Firebase Firestore] Error syncing preset vocab tests:', err);
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
    console.error('[Firebase Firestore] Error syncing preset vocab reviews:', err);
  }
}
