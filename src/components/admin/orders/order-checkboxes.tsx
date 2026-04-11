'use client';

import React, { useEffect, useRef } from 'react';
import { useOrderSelection } from './order-selection-context';

export function MasterCheckbox({ allIds }: { allIds: number[] }) {
  const { selectedIds, selectAll } = useOrderSelection();
  const checkboxRef = useRef<HTMLInputElement>(null);

  const isAllSelected = selectedIds.length === allIds.length && allIds.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={isAllSelected}
      onChange={() => selectAll(allIds)}
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
    />
  );
}

export function OrderRowCheckbox({ orderId }: { orderId: number }) {
  const { isSelected, toggleId } = useOrderSelection();

  return (
    <input
      type="checkbox"
      checked={isSelected(orderId)}
      onChange={() => toggleId(orderId)}
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
    />
  );
}
