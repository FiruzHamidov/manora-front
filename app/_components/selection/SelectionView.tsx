'use client';

import {useEffect} from 'react';
import SelectionPropertyCard from './SelectionPropertyCard';


import {axios} from '@/utils/axios';
import {SelectionPublic} from "@/services/selection/selection";
import {Property} from "@/services/properties/types";

type Props = {
    selection: SelectionPublic;
    initialProperties: Property[];
};

export default function SelectionView({selection, initialProperties}: Props) {
    const propsList = initialProperties;

    // авто-событие: просмотр подборки
    useEffect(() => {
        (async () => {
            try {
                await axios.post(`/selections/${selection.id}/events`, {
                    type: 'viewed',
                });
            } catch {
            }
        })();
    }, [selection.id]);

    return (
        <div className="min-h-screen bg-[#F5F8FF]">
            <header className="bg-white border-b border-black/5">
                <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div className="font-bold text-[#0036A5] text-xl">Manora • Подборка</div>
                    <div className="text-xs text-[#666F8D]">{new Date().toLocaleDateString('ru-RU')}</div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                    <h1 className="text-2xl font-bold text-[#020617] mb-2">
                        {selection.title || 'Подборка объектов'}
                    </h1>
                    {selection.note && <p className="text-[#666F8D] text-sm">{selection.note}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {propsList.map((p) => (
                        <SelectionPropertyCard
                            key={p.id}
                            selectionId={selection.id}
                            property={p}
                        />
                    ))}
                </div>
            </main>

            <footer className="max-w-6xl mx-auto px-4 py-10 text-center text-xs text-[#666F8D]">
                © {new Date().getFullYear()} manora.tj
            </footer>
        </div>
    );
}
