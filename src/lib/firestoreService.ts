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
  updateDoc,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

// Local in-memory listeners for client-side state reactivity
type CollectionListener<T> = (data: T[]) => void;
const activeListeners = new Map<string, Set<CollectionListener<any>>>();
const cachedCollections = new Map<string, any[]>();
const firestoreUnsubscribers = new Map<string, Unsubscribe>();

// Known deleted mock/sample items that should never reappear on any device
const KNOWN_DEFAULT_DELETED_IDS = [
  'pt-101', 'pt-102', 'pt-103',
  'cls-29', 'cls-41', 'cls-50', 'cls-58', 'cls-59', 'cls-61', 'cls-63', 'cls-64', 'cls-65',
  'cls-66', 'cls-67', 'cls-68', 'cls-69', 'cls-70', 'cls-71', 'cls-72', 'cls-73', 'cls-74',
  'cls-75', 'cls-76', 'cls-77', 'cls-78', 'cls-79', 'cls-80', 'cls-81', 'cls-82', 'cls-83',
  'cls-84', 'cls-85', 'cls-86', 'cls-87', 'cls-88', 'cls-89', 'cls-90', 'cls-91', 'cls-92',
  'cls-93', 'cls-94'
];

// Global in-memory set of deleted IDs synced across all devices and storage backends
export const globalDeletedIdsSet = new Set<string>(KNOWN_DEFAULT_DELETED_IDS);

// Load any previously remembered deleted IDs from localStorage
try {
  if (typeof window !== 'undefined') {
    const rawGlobal = localStorage.getItem('idv_global_deleted_ids');
    if (rawGlobal) {
      const parsed = JSON.parse(rawGlobal);
      if (Array.isArray(parsed)) parsed.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
    }
    const rawClasses = localStorage.getItem('idv_deleted_class_ids');
    if (rawClasses) {
      const parsed = JSON.parse(rawClasses);
      if (Array.isArray(parsed)) parsed.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
    }
    const rawPlacement = localStorage.getItem('idv_deleted_placement_test_ids');
    if (rawPlacement) {
      const parsed = JSON.parse(rawPlacement);
      if (Array.isArray(parsed)) parsed.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
    }
    const rawStudents = localStorage.getItem('idv_deleted_student_ids');
    if (rawStudents) {
      const parsed = JSON.parse(rawStudents);
      if (Array.isArray(parsed)) parsed.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
    }
  }
} catch (e) {}

/**
 * Checks if a record ID has been deleted on ANY device in the cloud
 */
export function isRecordDeleted(id: string, colName?: string): boolean {
  if (!id || id === 'meta_deleted_ids') return true;
  if (globalDeletedIdsSet.has(String(id))) return true;
  return false;
}

/**
 * Helper to purge a deleted item from local in-memory cache and notify subscribers
 */
function purgeDeletedItemFromCache(collectionName: string, id: string) {
  const existing = cachedCollections.get(collectionName) || [];
  const filtered = existing.filter((item) => String(item.id) !== String(id) && item.id !== 'meta_deleted_ids');
  cachedCollections.set(collectionName, filtered);
  try {
    localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(filtered));
  } catch (e) {}
  const listeners = activeListeners.get(collectionName);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(filtered);
      } catch (e) {}
    });
  }
}

/**
 * Synchronizes deleted IDs across cloud Firestore and VPS Server
 */
export async function syncCloudDeletedRecords(): Promise<void> {
  // 1. Fetch from server API
  try {
    const res = await fetch('/api/deleted-ids');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.deletedIds)) {
        json.deletedIds.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
      }
    }
  } catch (e) {}

  // 2. Fetch from Firestore metadata documents for classes, placementTests, students
  const collectionsWithMeta = ['classes', 'placementTests', 'students'];
  for (const col of collectionsWithMeta) {
    try {
      const metaSnap = await getDoc(doc(db, col, 'meta_deleted_ids'));
      if (metaSnap.exists()) {
        const data = metaSnap.data();
        if (Array.isArray(data?.deletedIds)) {
          data.deletedIds.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
        }
      }
    } catch (e) {}
  }

  // Persist updated deleted set to localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('idv_global_deleted_ids', JSON.stringify(Array.from(globalDeletedIdsSet)));
    }
  } catch (e) {}

  // Clean currently cached collections
  for (const [colName, items] of cachedCollections.entries()) {
    const clean = items.filter((item) => !isRecordDeleted(item.id, colName));
    if (clean.length !== items.length) {
      cachedCollections.set(colName, clean);
      try {
        localStorage.setItem(`vps_col_${colName}`, JSON.stringify(clean));
      } catch (e) {}
      const listeners = activeListeners.get(colName);
      if (listeners) {
        listeners.forEach((cb) => {
          try {
            cb(clean);
          } catch (e) {}
        });
      }
    }
  }
}

// Auto-run sync on client startup
if (typeof window !== 'undefined') {
  syncCloudDeletedRecords();

  // Listen to SSE events for real-time cross-machine deletion sync
  try {
    const sse = new EventSource('/api/storage/events');
    sse.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'delete' && msg.id) {
          globalDeletedIdsSet.add(String(msg.id));
          if (msg.collection) {
            purgeDeletedItemFromCache(msg.collection, String(msg.id));
          }
        } else if (msg.type === 'deleted_ids_updated' && Array.isArray(msg.ids)) {
          msg.ids.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
          syncCloudDeletedRecords();
        }
      } catch (e) {}
    };
  } catch (e) {}
}

// BroadcastChannel for instant cross-tab communication
let broadcastBus: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastBus = new BroadcastChannel('ielts_vps_sync_bus');
    broadcastBus.onmessage = (event) => {
      const { collection: colName, data } = event.data || {};
      if (colName && Array.isArray(data)) {
        const cleanData = data.filter((item: any) => !isRecordDeleted(item.id, colName));
        cachedCollections.set(colName, cleanData);
        const listeners = activeListeners.get(colName);
        if (listeners) {
          listeners.forEach((cb) => {
            try {
              cb(cleanData);
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
  let initialItems: T[] = (initialData || []).filter((i) => !isRecordDeleted(i.id, collectionName));
  try {
    const cached = localStorage.getItem(`vps_col_${collectionName}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        initialItems = parsed.filter((c: any) => !isRecordDeleted(c.id, collectionName));
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
        const missing = candidateSubs.filter((s: any) => !initialIds.has(s.id) && !isRecordDeleted(s.id, 'placementTests'));
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
    const missing = initialData.filter((p) => !existingIds.has(p.id) && !isRecordDeleted(p.id, collectionName));
    if (missing.length > 0) {
      initialItems = [...missing, ...initialItems];
    }
  }

  // Filter any deleted records from initialItems
  initialItems = initialItems.filter((i) => !isRecordDeleted(i.id, collectionName));

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
            // Check if snapshot contains meta_deleted_ids document
            const metaDoc = snapshot.docs.find((d) => d.id === 'meta_deleted_ids');
            if (metaDoc && metaDoc.exists()) {
              const metaData = metaDoc.data();
              if (Array.isArray(metaData?.deletedIds)) {
                metaData.deletedIds.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
              }
            }

            let firestoreItems: T[] = snapshot.docs
              .filter((d) => d.id !== 'meta_deleted_ids' && !isRecordDeleted(d.id, collectionName))
              .map((d) => ({
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
          } else {
            // Snapshot is empty: emit empty array and do NOT seed classes or placement tests
            cachedCollections.set(collectionName, []);
            try {
              localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify([]));
            } catch (e) {}

            const currentListeners = activeListeners.get(collectionName);
            if (currentListeners) {
              currentListeners.forEach((cb) => {
                try {
                  cb([]);
                } catch (err) {}
              });
            }

            // NEVER re-seed classes or placementTests
            if (collectionName !== 'classes' && collectionName !== 'placementTests' && initialData && initialData.length > 0) {
              const nonDeletedInitial = initialData.filter((i) => !isRecordDeleted(i.id, collectionName));
              if (nonDeletedInitial.length > 0) {
                console.log(`[Firebase Firestore] Seeding initial data for ${collectionName}...`);
                saveBatchDocuments(collectionName, nonDeletedInitial).catch((err) => {
                  console.warn(`[Firebase Firestore] Seeding error for ${collectionName}:`, err);
                });
              }
            }
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
      // Check for meta_deleted_ids
      const metaDoc = snapshot.docs.find((d) => d.id === 'meta_deleted_ids');
      if (metaDoc && metaDoc.exists()) {
        const metaData = metaDoc.data();
        if (Array.isArray(metaData?.deletedIds)) {
          metaData.deletedIds.forEach((id: string) => globalDeletedIdsSet.add(String(id)));
        }
      }

      const items: T[] = snapshot.docs
        .filter((d) => d.id !== 'meta_deleted_ids' && !isRecordDeleted(d.id, collectionName))
        .map((d) => ({
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
        const clean = json.data.filter((item: any) => !isRecordDeleted(item.id, collectionName));
        cachedCollections.set(collectionName, clean);
        return clean;
      }
    }
  } catch (err) {}

  // Fallback to local memory/cache
  const cached = cachedCollections.get(collectionName);
  if (cached) return cached.filter((item: any) => !isRecordDeleted(item.id, collectionName));

  try {
    const raw = localStorage.getItem(`vps_col_${collectionName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((item: any) => !isRecordDeleted(item.id, collectionName));
    }
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
 * Delete a document from Firestore and local cache with permanent cross-device sync
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const stringId = String(id);

  // 1. Record to global in-memory deleted IDs set
  globalDeletedIdsSet.add(stringId);

  // 2. Optimistic cache update
  const existingList = cachedCollections.get(collectionName) || [];
  const filtered = existingList.filter((item) => String(item.id) !== stringId);
  cachedCollections.set(collectionName, filtered);
  try {
    localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify(filtered));
    localStorage.setItem('idv_global_deleted_ids', JSON.stringify(Array.from(globalDeletedIdsSet)));
    if (collectionName === 'classes') {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('idv_deleted_class_ids') || '[]');
      if (!deletedIds.includes(stringId)) {
        deletedIds.push(stringId);
        localStorage.setItem('idv_deleted_class_ids', JSON.stringify(deletedIds));
      }
    } else if (collectionName === 'placementTests') {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('idv_deleted_placement_test_ids') || '[]');
      if (!deletedIds.includes(stringId)) {
        deletedIds.push(stringId);
        localStorage.setItem('idv_deleted_placement_test_ids', JSON.stringify(deletedIds));
      }
    } else if (collectionName === 'students') {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('idv_deleted_student_ids') || '[]');
      if (!deletedIds.includes(stringId)) {
        deletedIds.push(stringId);
        localStorage.setItem('idv_deleted_student_ids', JSON.stringify(deletedIds));
      }
    }
  } catch (e) {}

  const listeners = activeListeners.get(collectionName);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(filtered);
      } catch (err) {}
    });
  }

  // Broadcast to other open browser tabs
  if (broadcastBus) {
    try {
      broadcastBus.postMessage({ collection: collectionName, data: filtered });
    } catch (e) {}
  }

  // 3. Delete document from Firestore
  try {
    const docRef = doc(db, collectionName, stringId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[Firebase Firestore] Delete error for ${collectionName}/${stringId}:`, err);
  }

  // 4. Save tombstone to Firestore meta_deleted_ids document
  try {
    const metaRef = doc(db, collectionName, 'meta_deleted_ids');
    const metaSnap = await getDoc(metaRef);
    let currentList: string[] = [];
    if (metaSnap.exists() && Array.isArray(metaSnap.data()?.deletedIds)) {
      currentList = metaSnap.data().deletedIds;
    }
    if (!currentList.includes(stringId)) {
      currentList.push(stringId);
      await setDoc(metaRef, { deletedIds: currentList, updatedAt: new Date().toISOString() }, { merge: true });
    }
  } catch (err) {
    console.warn(`[Firebase Firestore] Could not update meta_deleted_ids for ${collectionName}:`, err);
  }

  // 5. Post tombstone to VPS server deleted-ids API
  try {
    fetch('/api/deleted-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: stringId, collection: collectionName }),
    }).catch(() => {});
  } catch (e) {}

  // 6. Delete from VPS backend storage
  try {
    fetch(`/api/storage/${encodeURIComponent(collectionName)}/${encodeURIComponent(stringId)}?_t=${Date.now()}`, {
      method: 'DELETE',
      headers: { 'Cache-Control': 'no-cache' },
    }).catch(() => {});
  } catch (e) {}

  // 7. If placement test, also send DELETE to dedicated placement-tests endpoint
  if (collectionName === 'placementTests') {
    try {
      fetch(`/api/placement-tests/${encodeURIComponent(stringId)}?_t=${Date.now()}`, {
        method: 'DELETE',
        headers: { 'Cache-Control': 'no-cache' },
      }).catch(() => {});
    } catch (e) {}
  }
}

/**
 * Permanently purges all documents in a collection from Firestore, VPS, and Local cache.
 */
export async function clearCollection(collectionName: string): Promise<void> {
  // 1. Clear local memory cache & localStorage
  cachedCollections.set(collectionName, []);
  try {
    localStorage.setItem(`vps_col_${collectionName}`, JSON.stringify([]));
    if (collectionName === 'classes') {
      localStorage.removeItem('idv_deleted_class_ids');
    }
  } catch (e) {}

  // 2. Notify all local listeners
  const listeners = activeListeners.get(collectionName);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb([]);
      } catch (err) {}
    });
  }

  // 3. Broadcast to all open tabs
  if (broadcastBus) {
    try {
      broadcastBus.postMessage({ collection: collectionName, data: [] });
    } catch (e) {}
  }

  // 4. Batch delete all documents in Firestore
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      console.log(`✅ [Firebase Firestore] Cleared all ${snap.size} documents in ${collectionName}`);
    }
  } catch (err) {
    console.warn(`⚠️ [Firebase Firestore] Clear collection error on ${collectionName}:`, err);
  }

  // 5. Clear VPS backend storage
  try {
    fetch(`/api/storage/${encodeURIComponent(collectionName)}?_t=${Date.now()}`, {
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
 * Adds a submission or score record to the test's submissions array using atomic arrayUnion.
 */
export async function addSubmissionToTest(
  collectionName: string,
  testId: string,
  submission: any
) {
  try {
    const cleanSub = sanitizeFirestoreData(submission);
    const docRef = doc(db, collectionName, testId);
    try {
      await updateDoc(docRef, {
        submissions: arrayUnion(cleanSub),
        updatedAt: new Date().toISOString(),
      });
    } catch (updateErr) {
      // Fallback if doc doesn't exist yet or updateDoc fails
      const test = await fetchDocument<any>(collectionName, testId);
      if (test) {
        const existingSubs = Array.isArray(test.submissions) ? test.submissions : [];
        const filteredSubs = existingSubs.filter((s: any) => s.id !== cleanSub.id);
        const updated = {
          ...test,
          submissions: [...filteredSubs, cleanSub],
        };
        await saveDocument(collectionName, updated);
      }
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
