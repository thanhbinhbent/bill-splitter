import { create } from "zustand";
import { Session } from "../utils/types";
interface SessionSearchState {
  sessionId: string;
  session: Session | null;
  setSessionId: (id: string) => void;
  setSession: (data: Session | null) => void;
}

export const useSessionSearchStore = create<SessionSearchState>((set) => ({
  sessionId: "",
  session: null,
  setSessionId: (id: string) => set({ sessionId: id }),
  setSession: (data: Session | null) => set({ session: data }),
}));
