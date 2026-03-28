import { create } from 'zustand';

export interface UploadFile {
  id: string;
  file: File;
  previewUrl: string;
  hash: string;
  isDuplicate: boolean;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  storagePath?: string;
}

export interface GeneratedCaption {
  postId: string;
  caption: string;
  hashtags: string[];
  detectedTopics: string[];
  altText: string;
  clientId: string | null;
  status: 'generating' | 'ready' | 'error';
}

interface UploadState {
  currentStep: 1 | 2 | 3 | 4;
  selectedAccountIds: string[];
  files: UploadFile[];
  captions: GeneratedCaption[];
  scheduleMode: 'now' | 'optimal' | 'even' | 'custom';
  batchId: string | null;

  setStep: (step: 1 | 2 | 3 | 4) => void;
  setSelectedAccounts: (ids: string[]) => void;
  addFiles: (files: UploadFile[]) => void;
  updateFile: (id: string, update: Partial<UploadFile>) => void;
  removeFile: (id: string) => void;
  setCaptions: (captions: GeneratedCaption[]) => void;
  updateCaption: (postId: string, update: Partial<GeneratedCaption>) => void;
  setScheduleMode: (mode: 'now' | 'optimal' | 'even' | 'custom') => void;
  setBatchId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1 as const,
  selectedAccountIds: [] as string[],
  files: [] as UploadFile[],
  captions: [] as GeneratedCaption[],
  scheduleMode: 'even' as const,
  batchId: null as string | null,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,
  setStep: (currentStep) => set({ currentStep }),
  setSelectedAccounts: (selectedAccountIds) => set({ selectedAccountIds }),
  addFiles: (newFiles) => set((s) => ({ files: [...s.files, ...newFiles] })),
  updateFile: (id, update) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, ...update } : f)),
    })),
  removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  setCaptions: (captions) => set({ captions }),
  updateCaption: (postId, update) =>
    set((s) => ({
      captions: s.captions.map((c) => (c.postId === postId ? { ...c, ...update } : c)),
    })),
  setScheduleMode: (scheduleMode) => set({ scheduleMode }),
  setBatchId: (batchId) => set({ batchId }),
  reset: () => set(initialState),
}));
