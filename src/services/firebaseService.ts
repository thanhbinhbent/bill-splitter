import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
    let sessionId: string;

    try {
      do {
        // Generate a new sessionId
        sessionId = `BINH-${nanoid(10)}`;

        // Check if the sessionId exists
        const snapshot = await get(ref(this.db, `/sessions/${sessionId}`));
        if (!snapshot.exists()) {
          break; // Exit loop if the sessionId is unique
        }
      } while (true);

      // Post the session data with the unique sessionId
      await set(ref(this.db, `/sessions/${sessionId}`), {
        ...session,
        createDate: new Date().toISOString(),
      });

      return sessionId;
    } catch (error) {
      console.error("Error posting session data: ", error);
      throw new Error("Failed to post session data");
    }
  }
}

export const firebaseService = new FirebaseService();
