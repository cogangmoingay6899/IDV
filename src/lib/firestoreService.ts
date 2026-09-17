import {
  collection,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generic helper to subscribe to a Firestore collection in real-time.
 * If collection is empty, automatically seeds it with initialData.
 */
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty && initialData && initialData.length > 0) {
        // Seed initial data to cloud database
        console.log(`Seeding initial data for ${collectionName}...`);
        try {
          const batch = writeBatch(db);
          initialData.forEach((item) => {
            const docRef = doc(db, collectionName, String(item.id));
            batch.set(docRef, item);
          });
          await batch.commit();
        } catch (err) {
          console.error(`Error seeding ${collectionName}:`, err);
        }
      } else {
        let items: T[] = snapshot.docs.map((doc) => doc.data() as T);

        // Special handling for teachers to purge legacy initial seed teachers
        if (collectionName === 'teachers') {
          const initialIds = new Set(initialData.map((d) => d.id));
          const hasObsolete = items.some((t) => !initialIds.has(t.id));
          if (hasObsolete) {
            // Asynchronously purge obsolete docs from firestore
            cleanObsoleteTeachers(initialData);
            // Immediately filter out obsolete docs for UI responsiveness
            items = items.filter((t) => initialIds.has(t.id));
            if (items.length === 0) {
              items = initialData;
            }
          }
        }

        // Special handling for vocab_tests to ensure all 124 preset tests are synced & visible
        if (collectionName === 'vocab_tests' && initialData && initialData.length > 0) {
          syncPresetVocabTests(initialData);
          const existingIds = new Set(items.map((i) => i.id));
          const missingPreset = initialData.filter((p) => !existingIds.has(p.id));
          if (missingPreset.length > 0) {
            items = [...missingPreset, ...items];
          }
        }

        // Special handling for vocab_reviews to ensure all 124 preset review tests are synced & visible
        if (collectionName === 'vocab_reviews' && initialData && initialData.length > 0) {
          syncPresetVocabReviews(initialData);
          const existingIds = new Set(items.map((i) => i.id));
          const missingPreset = initialData.filter((p) => !existingIds.has(p.id));
          if (missingPreset.length > 0) {
            items = [...missingPreset, ...items];
          }
        }

        onData(items);
      }
    },
    (error) => {
      console.error(`Firestore subscription error for ${collectionName}:`, error);
      // Fallback to local initial data if offline or error
      onData(initialData);
    }
  );

  return unsubscribe;
}

/**
 * Automatically cleans obsolete teacher records (e.g. old seed IDs like tch-1..tch-10)
 * and ensures the standard 8 teachers are active in Firestore.
 */
export async function cleanObsoleteTeachers<T extends { id: string }>(
  standardTeachers: T[]
) {
  try {
    const colRef = collection(db, 'teachers');
    const snapshot = await getDocs(colRef);
    const standardIds = new Set(standardTeachers.map((t) => t.id));
    const batch = writeBatch(db);
    let needCommit = false;

    snapshot.docs.forEach((d) => {
      if (!standardIds.has(d.id)) {
        batch.delete(d.ref);
        needCommit = true;
      }
    });

    standardTeachers.forEach((t) => {
      const docRef = doc(db, 'teachers', String(t.id));
      batch.set(docRef, t, { merge: true });
      needCommit = true;
    });

    if (needCommit) {
      await batch.commit();
      console.log('Teachers collection cleansed and synced with standard 8 teachers.');
    }
  } catch (err) {
    console.error('Error cleaning obsolete teachers:', err);
  }
}

/**
 * Synchronizes missing preset vocab tests into Firestore database
 */
export async function syncPresetVocabTests<T extends { id: string }>(
  presetTests: T[]
) {
  try {
    const colRef = collection(db, 'vocab_tests');
    const snapshot = await getDocs(colRef);
    const existingIds = new Set(snapshot.docs.map((d) => d.id));
    const batch = writeBatch(db);
    let needCommit = false;

    presetTests.forEach((t) => {
      if (!existingIds.has(t.id)) {
        const docRef = doc(db, 'vocab_tests', String(t.id));
        batch.set(docRef, t);
        needCommit = true;
      }
    });

    if (needCommit) {
      await batch.commit();
      console.log('Synced missing preset vocab tests into Firestore.');
    }
  } catch (err) {
    console.error('Error syncing preset vocab tests:', err);
  }
}

/**
 * Synchronizes missing preset vocab reviews into Firestore database
 */
export async function syncPresetVocabReviews<T extends { id: string }>(
  presetTests: T[]
) {
  try {
    const colRef = collection(db, 'vocab_reviews');
    const snapshot = await getDocs(colRef);
    const existingIds = new Set(snapshot.docs.map((d) => d.id));
    const batch = writeBatch(db);
    let needCommit = false;

    presetTests.forEach((t) => {
      if (!existingIds.has(t.id)) {
        const docRef = doc(db, 'vocab_reviews', String(t.id));
        batch.set(docRef, t);
        needCommit = true;
      }
    });

    if (needCommit) {
      await batch.commit();
      console.log('Synced missing preset vocab reviews into Firestore.');
    }
  } catch (err) {
    console.error('Error syncing preset vocab reviews:', err);
  }
}

/**
 * Fetch all documents in a collection once
 */
export async function fetchCollection<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((doc) => doc.data() as T);
  } catch (err) {
    console.error(`Error fetching collection ${collectionName}:`, err);
    return [];
  }
}

/**
 * Fetch a single document by ID
 */
export async function fetchDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, String(id));
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as T;
    }
  } catch (err) {
    console.error(`Error fetching document ${id} from ${collectionName}:`, err);
  }
  return null;
}

/**
 * Atomically increments the student count of a class.
 */
export async function incrementClassStudentCount(classId: string, amount: number = 1) {
  try {
    const docRef = doc(db, 'classes', classId);
    await updateDoc(docRef, {
      currentStudents: increment(amount),
    });
  } catch (err) {
    console.error(`Error incrementing student count for class ${classId}:`, err);
    throw err;
  }
}

/**
 * Atomically adds a submission to the test's submissions array.
 */
export async function addSubmissionToTest(
  collectionName: string,
  testId: string,
  submission: any
) {
  try {
    const docRef = doc(db, collectionName, String(testId));
    await updateDoc(docRef, {
      submissions: arrayUnion(submission),
    });
  } catch (err) {
    console.error(`Error adding submission to ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Deeply sanitizes an object for Firestore by removing undefined values
 * or replacing them with null, preventing Firestore setDoc from throwing.
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
 * Save or update a document in a collection
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    const cleanItem = sanitizeFirestoreData(item);
    const docRef = doc(db, collectionName, String(cleanItem.id));
    await setDoc(docRef, cleanItem, { merge: true });
  } catch (err) {
    console.error(`Error saving document to ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Delete a document from a collection
 */
export async function deleteDocument(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting document from ${collectionName}:`, err);
    throw err;
  }
}

/**
 * Save multiple items in a batch
 */
export async function saveBatchDocuments<T extends { id: string }>(
  collectionName: string,
  items: T[]
) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const cleanItem = sanitizeFirestoreData(item);
      const docRef = doc(db, collectionName, String(cleanItem.id));
      batch.set(docRef, cleanItem, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error(`Error saving batch to ${collectionName}:`, err);
    throw err;
  }
}
