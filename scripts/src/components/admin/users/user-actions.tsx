'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { PlusCircle, Shield, Loader2, Mail, Key, Trash2 } from 'lucide-react';
import { changeRoleAction, adjustBalanceAction, updateCredentialsAction, softDeleteUserAction } from '@/app/admin/users/actions';
import type { Role } from '@/generated/client';

export function UserActions({ userId, currentRole }: { userId: string, currentRole: Role }) {
  const [isBusy, setIsBusy] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm('ВНИМАНИЕ: Это действие архивирует пользователя. Его TG ID и Email будут отвязаны, баланс обнулен. Пользователь сможет вернуться только как "новый клиент". Продолжить?')) return;

    setIsBusy(true);
    try {
      await softDeleteUserAction(userId);
      alert('Пользователь успешно архивирован');
      window.location.href = '/admin/users';
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleEditEmail = async () => {
    const newEmail = prompt('Введите новый email:');
    if (!newEmail) return;

    setIsBusy(true);
    try {
      await updateCredentialsAction(userId, { email: newEmail });
      alert('Email обновлен');
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSetPassword = async () => {
    const newPass = prompt('Введите новый пароль:');
    if (!newPass) return;

    if (newPass.length < 6) {
      alert('Пароль слишком короткий (мин. 6 символов)');
      return;
    }

    setIsBusy(true);
    try {
      await updateCredentialsAction(userId, { password: newPass });
      alert('Пароль успешно обновлен');
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAdjustBalance = async () => {
    const amountStr = prompt('Введите сумму (положительная = начисление, отрицательная = списание):', '100');
    if (!amountStr) return;

    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount === 0) {
      alert('Неверная сумма');
      return;
    }

    const reason = prompt('Введите причину корректировки:', 'Поддержка клиентов');
    if (!reason) return;

    setIsBusy(true);
    try {
      await adjustBalanceAction(userId, amount, reason);
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleChangeRole = async () => {
    const roles: Role[] = ['USER', 'ADMIN', 'SUPPORT', 'SEO', 'RESELLER'];
    const roleList = roles.map((r, i) => `${i + 1}. ${r}`).join('\n');
    const choice = prompt(`Выберите новую роль (1-${roles.length}):\n${roleList}`, (roles.indexOf(currentRole) + 1).toString());

    if (!choice) return;
    const index = parseInt(choice) - 1;
    const newRole = roles[index];

    if (!newRole || newRole === currentRole) return;

    setIsBusy(true);
    try {
      await changeRoleAction(userId, newRole);
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleEditEmail}
        disabled={isBusy}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
        title="Изменить Email"
      >
        <Mail size={16} />
      </button>

      <button
        onClick={handleSetPassword}
        disabled={isBusy}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
        title="Сменить пароль"
      >
        <Key size={16} />
      </button>

      <button
        onClick={handleAdjustBalance}
        disabled={isBusy}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
      >
        {isBusy ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
        Изменить баланс
      </button>

      <button
        onClick={handleChangeRole}
        disabled={isBusy}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
      >
        <Shield size={16} className={isBusy ? 'animate-spin text-blue-500' : ''} />
        Сменить роль
      </button>

      <button
        onClick={handleDeleteAccount}
        disabled={isBusy}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-all"
        title="Архивировать аккаунт"
      >
        {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  );
}
