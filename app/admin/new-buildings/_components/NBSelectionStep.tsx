'use client';

import { Input } from '@/ui-components/Input';
import { Button } from '@/ui-components/Button';
import ResidentialDictionaryPicker from './ResidentialDictionaryPicker';
import { ChangeEvent, useState } from 'react';
import { SelectToggle } from '@/ui-components/SelectToggle';

interface Props {
    title: string;
    description: string;

    values: {
        developer_id: number | null | undefined;
        construction_stage_id: number | null | undefined;
        material_id: number | null | undefined;
        installment_available: boolean;
        heating: boolean;
        has_terrace: boolean;
        moderation_status: string;
        heating_description?: string | null;
        parking_description?: string | null;
        landscaping_description?: string | null;
        housing_class?: string | null;
        advantages?: string[] | null;
    };

    onChange: (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    selectedFeatureIds: Array<number | string>;
    onNext: () => void;
    errors?: Record<string, string>;
    canModerate: boolean;
}

export default function NBSelectionStep({
                                            title,
                                            description,
                                            values,
                                            onChange,
                                            selectedFeatureIds,
                                            onNext,
                                            errors = {},
                                        }: Props) {

    const [advantagesDraft, setAdvantagesDraft] = useState({ source: values.advantages, text: values.advantages?.join('\n') ?? '' });
    const advantagesText = advantagesDraft.source === values.advantages ? advantagesDraft.text : values.advantages?.join('\n') ?? '';
    const makeChange = (name: string, value: string | number | boolean | string[] | number[]) =>
        onChange({ target: { name, value } } as unknown as ChangeEvent<HTMLInputElement>);

    return (
        <div className="flex flex-col gap-6">
            <Input label="Название ЖК" name="title" value={title} onChange={onChange} error={errors.title} />
            <Input label="Описание" name="description" value={description} onChange={onChange} textarea />
            <Input label="Класс жилья" name="housing_class" value={values.housing_class ?? ''} onChange={onChange} error={errors.housing_class} maxLength={40} />
            <div className="grid gap-4 md:grid-cols-3">
                <Input label="Отопление: описание" name="heating_description" value={values.heating_description ?? ''} onChange={onChange} error={errors.heating_description} maxLength={1000} textarea />
                <Input label="Парковка" name="parking_description" value={values.parking_description ?? ''} onChange={onChange} error={errors.parking_description} maxLength={1000} textarea />
                <Input label="Благоустройство" name="landscaping_description" value={values.landscaping_description ?? ''} onChange={onChange} error={errors.landscaping_description} maxLength={1000} textarea />
            </div>
            <p className="text-sm text-gray-600">Пустое описание означает отсутствие сведений. Если подтверждено отсутствие парковки или отопления, укажите это текстом. Непоставленный флажок ниже не считается подтверждённым «Нет».</p>
            <label className="text-sm font-medium">Преимущества — по одному на строке, до 20
                <textarea name="advantages" value={advantagesText} rows={4} className="mt-2 w-full rounded-xl border p-3" onChange={event => {
                    const text = event.target.value, source = text.split('\n').map(value => value.trim()).filter(Boolean);
                    setAdvantagesDraft({ source, text }); makeChange('advantages', source);
                }} />
                {errors.advantages && <span className="block text-red-700">{errors.advantages}</span>}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResidentialDictionaryPicker resource="developers" label="Застройщик" selectedIds={[values.developer_id ?? 0]} onChange={ids => makeChange('developer_id', ids[0] ?? '')} error={errors.developer_id} />
                <ResidentialDictionaryPicker resource="construction-stages" label="Этап строительства" selectedIds={[values.construction_stage_id ?? 0]} onChange={ids => makeChange('construction_stage_id', ids[0] ?? '')} error={errors.construction_stage_id} />
                <ResidentialDictionaryPicker resource="materials" label="Материал" selectedIds={[values.material_id ?? 0]} onChange={ids => makeChange('material_id', ids[0] ?? '')} error={errors.material_id} />
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
                        className="flex items-center gap-2 text-sm text-[#333] p-3 border rounded-lg cursor-pointer hover:border-[#006341] transition"
                    >
                        <input
                            type="checkbox"
                            name={c.name}
                            checked={c.checked}
                            onChange={(e) => makeChange(c.name, e.currentTarget.checked)}
                            className="h-4 w-4 text-[#006341] border-gray-300 rounded focus:ring-[#006341]"
                        />
                        {c.label}
                    </label>
                ))}
            </div>

            <SelectToggle<string>
                title="Сохранить как"
                options={[{ id: 'draft', name: 'Черновик' }, { id: 'pending', name: 'На модерацию' }]}
                selected={values.moderation_status === 'draft' ? 'draft' : 'pending'}
                setSelected={(value) => makeChange('moderation_status', value)}
            />
            <p className="text-sm text-gray-600">Черновик можно сохранить без полного заполнения. Публикация доступна после проверки в разделе «Публикация и ответственность».</p>

            <ResidentialDictionaryPicker resource="features" label="Особенности" multiple selectedIds={selectedFeatureIds} onChange={ids => makeChange('features', ids)} error={errors.features} />

            <div className="flex justify-end">
                <Button onClick={onNext} className="mt-8">
                    Продолжить
                </Button>
            </div>
        </div>
    );
}
