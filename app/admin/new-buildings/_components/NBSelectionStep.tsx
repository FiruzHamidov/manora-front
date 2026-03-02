'use client';

import { Input } from '@/ui-components/Input';
import { Button } from '@/ui-components/Button';
import { Select } from '@/ui-components/Select';
import { ChangeEvent } from 'react';
import type {
    Developer,
    ConstructionStage,
    Material,
    Feature,
} from '@/services/new-buildings/types';
import { SelectToggle } from '@/ui-components/SelectToggle';
import type { SelectOption } from '@/services/add-post/types';

interface Props {
    title: string;
    description: string;
    developers: Developer[];
    stages: ConstructionStage[];
    materials: Material[];
    features: Feature[];

    values: {
        developer_id: number | null | undefined;
        construction_stage_id: number | null | undefined;
        material_id: number | null | undefined;
        installment_available: boolean;
        heating: boolean;
        has_terrace: boolean;
        moderation_status: string;
    };

    onChange: (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    onToggleFeature: (f: Feature) => void;
    selectedFeatureIds: Array<number | string>;
    onNext: () => void;
}

export default function NBSelectionStep({
                                            title,
                                            description,
                                            developers,
                                            stages,
                                            materials,
                                            features,
                                            values,
                                            onChange,
                                            onToggleFeature,
                                            selectedFeatureIds,
                                            onNext,
                                        }: Props) {
    const isValid = !!title;

    const makeChange = (name: string, value: string | number | boolean) =>
        onChange({ target: { name, value } } as unknown as ChangeEvent<HTMLInputElement>);

    const developersOptions: SelectOption[] = developers.map((d) => ({
        id: Number(d.id),
        name: d.name,
    }));

    const handleDeveloperChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value === '' ? '' : Number(e.target.value);
        makeChange('developer_id', val);
    };

    return (
        <div className="flex flex-col gap-6">
            <Input label="Название ЖК" name="title" value={title} onChange={onChange} required />
            <Input label="Описание" name="description" value={description} onChange={onChange} textarea />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Застройщик */}
                <Select
                    label="Застройщик"
                    name="developer_id"
                    value={values.developer_id ? String(values.developer_id) : ''}
                    options={developersOptions}
                    onChange={handleDeveloperChange}
                />

                {/* Этап и материал (во всю ширину) */}
                <SelectToggle<number>
                    title="Этап строительства"
                    options={stages.map((s) => ({ id: Number(s.id), name: s.name }))}
                    selected={values.construction_stage_id ?? null}
                    setSelected={(id) => makeChange('construction_stage_id', Number(id))}
                    className="w-full"
                />
                <SelectToggle<number>
                    title="Материал"
                    options={materials.map((m) => ({ id: Number(m.id), name: m.name }))}
                    selected={values.material_id ?? null}
                    setSelected={(id) => makeChange('material_id', Number(id))}
                    className="w-full"
                />
            </div>

            {/* Красивые чекбоксы */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { name: 'installment_available', label: 'Рассрочка', checked: values.installment_available },
                    { name: 'heating', label: 'Отопление', checked: values.heating },
                    { name: 'has_terrace', label: 'Терраса', checked: values.has_terrace },
                ].map((c) => (
                    <label
                        key={c.name}
                        className="flex items-center gap-2 text-sm text-[#333] p-3 border rounded-lg cursor-pointer hover:border-[#0036A5] transition"
                    >
                        <input
                            type="checkbox"
                            name={c.name}
                            checked={c.checked}
                            onChange={(e) => makeChange(c.name, e.currentTarget.checked)}
                            className="h-4 w-4 text-[#0036A5] border-gray-300 rounded focus:ring-[#0036A5]"
                        />
                        {c.label}
                    </label>
                ))}
            </div>

            <SelectToggle<string>
                title="Статус модерации"
                options={[
                    { id: 'pending', name: 'На модерации' },
                    { id: 'approved', name: 'Одобрено' },
                    { id: 'rejected', name: 'Отклонено' },
                    { id: 'draft', name: 'Черновик' },
                    { id: 'deleted', name: 'Удалено' },
                ]}
                selected={values.moderation_status || 'pending'}
                setSelected={(val) => makeChange('moderation_status', val)}
                className="w-full"
            />

            <div>
                <div className="mb-2 text-sm text-[#666F8D]">Удобства (фичи)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {features.map((f) => {
                        const checked = selectedFeatureIds.includes(f.id);
                        return (
                            <label
                                key={String(f.id)}
                                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                                    checked ? 'bg-[#0036A5] text-white border-[#0036A5]' : 'hover:border-[#0036A5]'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => onToggleFeature(f)}
                                    className="h-4 w-4 text-[#0036A5] border-gray-300 rounded focus:ring-[#0036A5]"
                                />
                                <span>{f.name}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={onNext} disabled={!isValid} className="mt-8">
                    Продолжить
                </Button>
            </div>
        </div>
    );
}