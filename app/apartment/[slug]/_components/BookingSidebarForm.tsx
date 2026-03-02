'use client';

import {useMemo, useState} from 'react';
import {formatISO} from 'date-fns';
import {axios} from '@/utils/axios';
import {toast} from 'react-toastify';

interface BookingSidebarFormProps {
    propertyId: number;
    defaultAgentId?: number;
}

export default function BookingSidebarForm({
                                               propertyId,
                                               defaultAgentId,
                                           }: BookingSidebarFormProps) {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [note, setNote] = useState('');

    const [start, setStart] = useState(() => {
        const d = new Date();
        d.setMinutes(0, 0, 0);
        return d.toISOString().slice(0, 16);
    });

    const [end, setEnd] = useState(() => {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        d.setMinutes(0, 0, 0);
        return d.toISOString().slice(0, 16);
    });

    const [submitting, setSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        return (
            propertyId &&
            clientName.trim().length > 1 &&
            clientPhone.trim().length > 5 &&
            note.trim().length > 1 &&
            !!start &&
            !!end &&
            new Date(start) < new Date(end)
        );
    }, [propertyId, clientName, clientPhone, note, start, end]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        try {
            await axios.post('/bookings', {
                property_id: propertyId,
                agent_id: defaultAgentId,
                start_time: formatISO(new Date(start)),
                end_time: formatISO(new Date(end)),
                note,
                client_name: clientName.trim(),
                client_phone: clientPhone.trim(),
            });

            toast.success('Показ создан');

            setClientName('');
            setClientPhone('');
            setNote('');

            const s = new Date();
            s.setMinutes(0, 0, 0);
            setStart(s.toISOString().slice(0, 16));

            const eDate = new Date();
            eDate.setHours(eDate.getHours() + 1);
            eDate.setMinutes(0, 0, 0);
            setEnd(eDate.toISOString().slice(0, 16));
        } catch (e) {
            console.error(e);
            toast.error('Ошибка при создании показа');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-[22px] md:px-[26px] px-4 py-5 md:py-8 mt-4">
            <h3 className="text-2xl font-bold mb-2">Создать показ</h3>
            <p className="text-[#666F8D] mb-4">
                Заполните данные для записи на просмотр.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm mb-1">Имя клиента</label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded p-2"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ваше имя"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1">Телефон клиента</label>
                    <input
                        type="tel"
                        className="w-full border border-gray-300 rounded p-2"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+992..."
                        required
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-sm mb-1">Начало показа</label>
                    <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded p-2"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        required
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-sm mb-1">Окончание показа</label>
                    <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded p-2"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        required
                    />
                </div>


                <div>
                    <label className="block text-sm mb-1">Комментарий</label>
                    <textarea
                        className="w-full border border-gray-300 rounded p-2"
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Уточнения по встрече..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full bg-[#0036A5] hover:bg-blue-800 text-white py-4 rounded-full transition disabled:opacity-70"
                >
                    {submitting ? 'Создаю...' : 'Создать показ'}
                </button>
            </form>
        </div>
    );
}