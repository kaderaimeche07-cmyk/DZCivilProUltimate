import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  increment,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  throw new Error(JSON.stringify(errInfo));
}

async function validateFirestoreConnection(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Non-blocking connection probe (expected when offline or path is denied by security rules)
  }
}

const VISITOR_ID_KEY = 'dz_civil_visitor_id';
const VISITOR_COUNTED_KEY = 'dz_civil_visitor_counted';

export async function trackUniqueVisitor(): Promise<void> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `vis_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    if (localStorage.getItem(VISITOR_COUNTED_KEY) === '1') {
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    void validateFirestoreConnection();

    // Write-only atomic +1 increment on count field (no read required, compliant with security rules)
    await setDoc(
      doc(db, 'app_stats', 'visitors'),
      { count: increment(1) },
      { merge: true }
    );
    localStorage.setItem(VISITOR_COUNTED_KEY, '1');
  } catch {
    // Silent fallback: offline mode or restricted storage must never interrupt user workflow
  }
}
