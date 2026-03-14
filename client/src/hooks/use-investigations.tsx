import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import type { Entity } from "@shared/schema";
import { analyzeResponseSchema } from "@shared/schema";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StoredFileMeta = {
  id: string;
  name: string;
  size: number;
  isImage: boolean;
  isPDF: boolean;
};

export type Investigation = {
  id: string;
  title: string;
  date: string;
  evidenceType: string | null;
  rawText: string | null;
  fileName: string | null;
  uploadedFiles: StoredFileMeta[];
  entities: Entity[];
  analysis: z.infer<typeof analyzeResponseSchema> | null;
  chatHistory: ChatMessage[];
};

interface InvestigationsContextType {
  investigations: Investigation[];
  currentId: string | null;
  currentInvestigation: Investigation | null;
  setCurrentId: (id: string | null) => void;
  createInvestigation: (title?: string) => string;
  updateInvestigation: (id: string, updates: Partial<Investigation>) => void;
  deleteInvestigation: (id: string) => void;
  renameInvestigation: (id: string, newTitle: string) => void;
}

const InvestigationsContext = createContext<InvestigationsContextType | undefined>(undefined);

const STORAGE_KEY = "axis_investigations_v2";

export function InvestigationsProvider({ children }: { children: ReactNode }) {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInvestigations(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load investigations from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(investigations));
  }, [investigations, isLoaded]);

  const createInvestigation = (title: string = "New Investigation") => {
    const newInv: Investigation = {
      id: uuidv4(),
      title,
      date: new Date().toISOString(),
      evidenceType: null,
      rawText: null,
      fileName: null,
      uploadedFiles: [],
      entities: [],
      analysis: null,
      chatHistory: [],
    };
    setInvestigations((prev) => [newInv, ...prev]);
    setCurrentId(newInv.id);
    return newInv.id;
  };

  const updateInvestigation = (id: string, updates: Partial<Investigation>) => {
    setInvestigations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  const deleteInvestigation = (id: string) => {
    setInvestigations((prev) => prev.filter((inv) => inv.id !== id));
    if (currentId === id) setCurrentId(null);
  };

  const renameInvestigation = (id: string, newTitle: string) => {
    setInvestigations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, title: newTitle } : inv))
    );
  };

  const currentInvestigation = investigations.find((inv) => inv.id === currentId) || null;

  if (!isLoaded) return null;

  return (
    <InvestigationsContext.Provider
      value={{
        investigations,
        currentId,
        currentInvestigation,
        setCurrentId,
        createInvestigation,
        updateInvestigation,
        deleteInvestigation,
        renameInvestigation,
      }}
    >
      {children}
    </InvestigationsContext.Provider>
  );
}

export function useInvestigations() {
  const context = useContext(InvestigationsContext);
  if (context === undefined) {
    throw new Error("useInvestigations must be used within an InvestigationsProvider");
  }
  return context;
}