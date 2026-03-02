'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  useNewBuilding,
  useUpdateNewBuilding,
} from '@/services/new-buildings/hooks';
import { useNewBuildingForm } from '@/hooks/useNewBuildingForm';
import { useParams } from 'next/navigation';
import { FormLayout } from '@/ui-components/FormLayout';
import { ProgressIndicator } from '@/ui-components/ProgressIndicator';
import NBSelectionStep from '../../_components/NBSelectionStep';
import NBDetailsStep from '../../_components/NBDetailsStep';
import NBManagementStep from '../../_components/NBManagementStep';
import type {
  NewBuildingPayload,
  LocationOption,
  BuildingApiError,
} from '@/services/new-buildings/types';
import { toast } from 'react-toastify';

const STEPS = [
  'Основная информация',
  'Детали и локация',
  'Фото, блоки, квартиры',
];

export default function NewBuildingEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: initial, isLoading } = useNewBuilding(Number(id));
  const update = useUpdateNewBuilding(Number(id));

  const {
    form,
    setForm,
    handleChange,
    toggleFeature,
    isSubmitting,
    developers,
    stages,
    materials,
    features,
    locations,
  } = useNewBuildingForm();

  const [step, setStep] = useState(1);
  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));
  const locationOptions: LocationOption[] = (locations ?? []) as LocationOption[];

  useEffect(() => {
    if (!initial) return;

    const nb = initial.data;

    setForm((prev) => ({
      ...prev,
      title: nb.title,
      description: nb.description ?? '',
      district: nb.district ?? '',
      developer_id: nb.developer_id ?? null,
      construction_stage_id: nb.construction_stage_id ?? null,
      material_id: nb.material_id ?? null,
      location_id: nb.location_id ?? null,

      installment_available: nb.installment_available,
      heating: nb.heating,
      has_terrace: nb.has_terrace,

      floors_range: nb.floors_range ?? '',
      completion_at: nb.completion_at?.slice(0, 10) ?? '',

      address: nb.address ?? '',
      latitude: nb.latitude ?? '',
      longitude: nb.longitude ?? '',

      ceiling_height: nb.ceiling_height ?? null,

      moderation_status: nb.moderation_status ?? 'pending',

      features: (nb.features ?? []).map((f) => f.id),
    }));
  }, [initial, setForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const toNumOrNull = (v: unknown): number | null => {
        if (v === '' || v === null || v === undefined) return null;
        return typeof v === 'number' ? v : Number(v);
      };

      const payload: NewBuildingPayload = {
        ...form,
        developer_id: form.developer_id ? Number(form.developer_id) : null,
        construction_stage_id: form.construction_stage_id
          ? Number(form.construction_stage_id)
          : null,
        material_id: form.material_id ? Number(form.material_id) : null,
        location_id: form.location_id ? Number(form.location_id) : null,
        latitude: toNumOrNull(form.latitude),
        longitude: toNumOrNull(form.longitude),
        ceiling_height: toNumOrNull((form as any).ceiling_height),
      };

      await update.mutateAsync(payload);
      toast.success('Сохранено');
      // router.push(`/new-buildings/${id}`);
    } catch (err: unknown) {
      const apiErr = err as BuildingApiError;
      toast.error(apiErr?.response?.data?.message || 'Не удалось сохранить');
    }
  };

  const selectedFeatureIds: number[] = Array.isArray(form.features)
    ? (form.features as number[])
    : [];

  const locationId: number | null =
    typeof form.location_id === 'number' ? form.location_id : null;

  return (
    <FormLayout
      title="Редактировать новостройку"
      description="Обновите данные ЖК"
    >
      <ProgressIndicator
        currentStep={step}
        totalSteps={3}
        steps={STEPS}
        className="mb-8"
      />

      {isLoading && <div className="text-sm text-gray-500">Загрузка...</div>}

      {!isLoading && initial && step === 1 && (
        <NBSelectionStep
          title={form.title}
          description={form.description || ''}
          developers={developers}
          stages={stages}
          materials={materials}
          features={features}
          values={{
            developer_id: form.developer_id,
            construction_stage_id: form.construction_stage_id,
            material_id: form.material_id,
            installment_available: !!form.installment_available,
            heating: !!form.heating,
            has_terrace: !!form.has_terrace,
            moderation_status: form.moderation_status || 'pending',
          }}
          onChange={handleChange}
          onToggleFeature={toggleFeature}
          selectedFeatureIds={selectedFeatureIds}
          onNext={nextStep}
        />
      )}

      {!isLoading && initial && step === 2 && (
        <NBDetailsStep
          values={{
            location_id: locationId,
            floors_range: form.floors_range || '',
            completion_at: (form.completion_at || '').slice(0, 10),
            district: (form.district || ''),
            address: form.address || '',
            latitude: form.latitude ?? '',
            longitude: form.longitude ?? '',
            ceiling_height: form.ceiling_height ?? '',
          }}
          locations={locationOptions}
          onChange={handleChange}
          isSubmitting={isSubmitting || update.isPending}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e).then(() => {
              nextStep();
            });
          }}
          onBack={prevStep}
        />
      )}

      {!isLoading && initial && step === 3 && (
        <NBManagementStep buildingId={Number(id)} onBack={prevStep} />
      )}
    </FormLayout>
  );
}
