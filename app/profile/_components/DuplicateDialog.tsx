'use client';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import type { DuplicateCandidate } from '@/services/properties/types';

export function DuplicateDialog({
                                    open,
                                    onClose,
                                    items,
                                    onForce,
                                }: {
    open: boolean;
    onClose: () => void;
    items: DuplicateCandidate[];
    onForce: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-4">
                <h3 className="text-lg font-semibold mb-2">Возможные дубликаты</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Найдены объекты с совпадающими признаками (телефон/адрес/этаж/площадь/гео). Сверьте ссылки ниже.
                </p>

                <div className="max-h-[320px] overflow-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className="text-left text-gray-500">
                            <th className="py-2 px-3">ID</th>
                            <th className="py-2 px-3">Адрес</th>
                            <th className="py-2 px-3">Телефон</th>
                            <th className="py-2 px-3">Площадь</th>
                            <th className="py-2 px-3">Этаж</th>
                            <th className="py-2 px-3">Совпадение %</th>
                            <th className="py-2 px-3">Открыть</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((d) => (
                            <tr key={d.id} className="border-t">
                                <td className="py-2 px-3">{d.id}</td>
                                <td className="py-2 px-3">{d.address ?? '—'}</td>
                                <td className="py-2 px-3">{d.owner_phone ?? '—'}</td>
                                <td className="py-2 px-3">{d.total_area ?? '—'}</td>
                                <td className="py-2 px-3">{d.floor ?? '—'}</td>
                                <td className="py-2 px-3">{d.score ?? '—'}</td>
                                <td className="py-2 px-3">
                                    {d.links?.view ? (
                                        <Link className="text-[#0036A5]" href={d.links.view} target="_blank">
                                            Открыть
                                        </Link>
                                    ) : '—'}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                    <Button variant="secondary" onClick={onClose}>Отмена</Button>
                    <Button onClick={onForce}>Добавить всё равно</Button>
                </div>
            </div>
        </div>
    );
}