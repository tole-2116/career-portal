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

/** A CV sent without picking a job ("open application"). */
export type OpenApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  fileName: string;
  createdAt: string;
  /** Set once HR links the application to a posting. */
  assignedJobId: string | null;
};

type InboxState = { messages: ContactMessage[]; openApplications: OpenApplication[] };

const emptyState: InboxState = { messages: [], openApplications: [] };

type InboxValue = InboxState & {
  addMessage: (message: Omit<ContactMessage, "id" | "createdAt" | "handled">) => void;
  toggleHandled: (id: string) => void;
  deleteMessage: (id: string) => void;
  addOpenApplication: (
    application: Omit<OpenApplication, "id" | "createdAt" | "assignedJobId">,
  ) => void;
  assignApplication: (id: string, jobId: string | null) => void;
  deleteOpenApplication: (id: string) => void;
};

const InboxContext = createContext<InboxValue | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InboxState>(emptyState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<InboxState>;
      setState({
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        openApplications: Array.isArray(parsed.openApplications) ? parsed.openApplications : [],
      });
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
      addOpenApplication: (application) =>
        update({
          ...state,
          openApplications: [
            {
              ...application,
              id: id(),
              createdAt: new Date().toISOString(),
              assignedJobId: null,
            },
            ...state.openApplications,
          ],
        }),
      assignApplication: (applicationId, jobId) =>
        update({
          ...state,
          openApplications: state.openApplications.map((item) =>
            item.id === applicationId ? { ...item, assignedJobId: jobId } : item,
          ),
        }),
      deleteOpenApplication: (applicationId) =>
        update({
          ...state,
          openApplications: state.openApplications.filter((item) => item.id !== applicationId),
        }),
    };
  }, [state, update]);

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxValue {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used inside InboxProvider");
  return ctx;
}
