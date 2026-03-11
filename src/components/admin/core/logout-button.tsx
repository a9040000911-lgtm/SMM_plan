'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/admin/auth/actions';

export function LogoutButton() {
  return (
    <button 
      onClick={() => logoutAction()}
      className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
      title="Logout from Admin Panel"
    >
      <LogOut size={18} />
    </button>
  );
}
