'use client';

import React, { createContext, useContext, useState } from 'react';

interface OrderSelectionContextType {
  selectedIds: number[];
  toggleId: (id: number) => void;
  selectAll: (allIds: number[]) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
}

const Context = createContext<OrderSelectionContextType | null>(null);

export function OrderSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleId = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = (allIds: number[]) => {
    // If all are currently selected, deselect all. Otherwise, select everything on the page.
    if (selectedIds.length === allIds.length && allIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...allIds]);
    }
  };

  const clear = () => setSelectedIds([]);

  const isSelected = (id: number) => selectedIds.includes(id);

  return (
    <Context.Provider value={{ selectedIds, toggleId, selectAll, clear, isSelected }}>
      {children}
    </Context.Provider>
  );
}

export function useOrderSelection() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useOrderSelection must be used within OrderSelectionProvider');
  return ctx;
}
