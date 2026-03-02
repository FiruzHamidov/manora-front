'use client';

import {useEffect, useState} from 'react';
import type {UserDto, DeleteUserPayload, Agent} from '@/services/users/types';

/** ---- Диалог удаления ---- */
type DeleteDialogProps = {
    open: boolean;
    onClose: () => void;
    user?: UserDto | null;
    agents?: Agent[];
    loadingAgents: boolean;
    onConfirm: (p: Omit<DeleteUserPayload, 'id'>) => Promise<void>;
};

export default function DeleteUserDialog({open, onClose, user, agents, loadingAgents, onConfirm}: DeleteDialogProps) {
    const [distribute, setDistribute] = useState(true);
    const [agentId, setAgentId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setDistribute(true);
            setAgentId(null);
            setSubmitting(false);
        }
    }, [open]);

    if (!open || !user) return null;

    const canSubmit = distribute || (!!agentId && agentId !== user.id);

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            await onConfirm({
                distribute_to_agents: distribute,
                agent_id: distribute ? undefined : agentId ?? undefined,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose}/>
            <div className="fixed z-[61] inset-x-0 top-[10%] mx-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="p-6">
                    <h3 className="text-lg font-semibold">Удалить пользователя</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Что сделать с объектами пользователя <b>{user.name}</b>?
                    </p>

                    {/* Тумблер распределения */}
                    <div className="mt-4 flex items-center justify-between rounded-xl border p-3">
                        <div>
                            <div className="font-medium">Распределить по всем агентам</div>
                            <div className="text-sm text-gray-500">Round-robin между доступными агентами</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDistribute((v) => !v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${distribute ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
              <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      distribute ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
                        </button>
                    </div>

                    {/* Селект агента (если не распределяем) */}
                    <div className="mt-4">
                        <label className={`block text-sm font-medium ${distribute ? 'text-gray-400' : ''}`}>Передать
                            одному агенту</label>
                        <select
                            disabled={distribute}
                            value={agentId ?? ''}
                            onChange={(e) => setAgentId(e.target.value ? Number(e.target.value) : null)}
                            className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
                        >
                            <option value="" disabled>
                                {loadingAgents ? 'Загрузка агентов…' : 'Выберите агента'}
                            </option>
                            {agents?.map((a) => (
                                <option key={a.id} value={a.id} disabled={a.id === user.id}>
                                    {a.name} (id: {a.id})
                                </option>
                            ))}
                        </select>
                        {!distribute && !agentId && (
                            <div className="mt-1 text-xs text-amber-600">Выберите агента для передачи объектов</div>
                        )}
                        {!distribute && agentId === user.id && (
                            <div className="mt-1 text-xs text-red-600">Нельзя передать объекты удаляемому
                                пользователю</div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2">
                        <button onClick={onClose} className="px-3 py-2 rounded-md border">
                            Отмена
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!canSubmit || submitting}
                            className="px-4 py-2 rounded-md bg-red-600 text-white disabled:opacity-60"
                        >
                            {submitting ? 'Удаляем…' : 'Удалить'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}