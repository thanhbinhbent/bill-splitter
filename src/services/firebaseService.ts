import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: "AIzaSyDBi4JvczVH751BBmu7DVIWWxen5cvB78Q",
  authDomain: "bill-splitter-app-f718e.firebaseapp.com",
  databaseURL:
    "https://bill-splitter-app-f718e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bill-splitter-app-f718e",
  storageBucket: "bill-splitter-app-f718e.firebasestorage.app",
  messagingSenderId: "421677972551",
  appId: "1:421677972551:web:4d1eb95c12f803ca0d0562",
  measurementId: "G-VM6QN9ME1C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Define types
export interface Session {
  bills: Bill[];
  createDate: string;
  participant: Participant[];
}

export interface Bill {
  id: string;
  amount: number;
  billName: string;
  paidBy: string;
  sharedBy: string[];
}

export interface Participant {
  id: string;
  name: string;
}

class FirebaseService {
  private db = getDatabase(app);

  async getSessionData(sessionId: string): Promise<Session | null> {
    try {
      const snapshot = await get(ref(this.db, `/sessions/${sessionId}`));
      if (snapshot.exists()) {
        return snapshot.val() as Session;
      } else {
        console.error(`No session found for ID: ${sessionId}`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching session data: ", error);
      return null;
    }
  }

  async postSessionData(session: Session): Promise<string> {
    const sessionId = uuidv4();
    try {
      await set(ref(this.db, `/sessions/${sessionId}`), {
        ...session,
        createDate: new Date().toISOString(),
      });

      console.log(`Session created successfully with ID: ${sessionId}`);
      return sessionId;
    } catch (error) {
      console.error("Error posting session data: ", error);
      throw new Error("Failed to post session data");
    }
  }
}

export const firebaseService = new FirebaseService();
