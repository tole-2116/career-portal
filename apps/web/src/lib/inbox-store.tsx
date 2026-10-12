import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "talenthub-inbox";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  createdAt: string;
  handled: boolean;
};

type InboxState = { messages: ContactMessage[] };

const emptyState: InboxState = { messages: [] };

type InboxValue = InboxState & {
  addMessage: (message: Omit<ContactMessage, "id" | "createdAt" | "handled">) => void;
  toggleHandled: (id: string) => void;
  deleteMessage: (id: string) => void;
};

const InboxContext = createContext<InboxValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InboxState>(emptyState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<InboxState>;
      setState({ messages: Array.isArray(parsed.messages) ? parsed.messages : [] });
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const update = useCallback((next: InboxState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const value = useMemo<InboxValue>(() => {
    const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      ...state,
      addMessage: (message) =>
        update({
          ...state,
          messages: [
            { ...message, id: id(), createdAt: new Date().toISOString(), handled: false },
            ...state.messages,
          ],
        }),
      toggleHandled: (messageId) =>
        update({
          ...state,
          messages: state.messages.map((item) =>
            item.id === messageId ? { ...item, handled: !item.handled } : item,
          ),
        }),
      deleteMessage: (messageId) =>
        update({ ...state, messages: state.messages.filter((item) => item.id !== messageId) }),
    };
  }, [state, update]);

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxValue {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside InboxProvider");
  return ctx;
}
