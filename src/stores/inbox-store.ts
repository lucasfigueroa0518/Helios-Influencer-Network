import { create } from 'zustand';

type InboxTab = 'all' | 'comments' | 'dms';
type InboxFilter = {
  accountId?: string;
  status?: string;
  search?: string;
};

interface InboxState {
  activeTab: InboxTab;
  selectedMessageId: string | null;
  filters: InboxFilter;
  setActiveTab: (tab: InboxTab) => void;
  setSelectedMessage: (id: string | null) => void;
  setFilters: (filters: Partial<InboxFilter>) => void;
  clearFilters: () => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  activeTab: 'all',
  selectedMessageId: null,
  filters: {},
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedMessage: (selectedMessageId) => set({ selectedMessageId }),
  setFilters: (newFilters) =>
    set((s) => ({ filters: { ...s.filters, ...newFilters } })),
  clearFilters: () => set({ filters: {} }),
}));
