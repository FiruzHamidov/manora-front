'use client';

import { FormEvent, useState } from 'react';
import { FormLayout } from '@/ui-components/FormLayout';
import { ProgressIndicator } from '@/ui-components/ProgressIndicator';
import { useNewBuildingForm } from '@/hooks/useNewBuildingForm';
import NBSelectionStep from '../_components/NBSelectionStep';
import NBDetailsStep from '../_components/NBDetailsStep';
import NBManagementStep from '../_components/NBManagementStep';
import type { LocationOption } from '@/services/new-buildings/types';

const STEPS = [
  'Основная информация',
  'Детали и локация',
  'Фото, блоки, квартиры',
];

export default function NewBuildingCreatePage() {
  const {
    form,
    handleChange,
    toggleFeature,
    isSubmitting,
    handleSubmit,
    developers,
    stages,
    materials,
    features,
    locations,
  } = useNewBuildingForm();

  const [step, setStep] = useState(1);
  const [createdBuildingId, setCreatedBuildingId] = useState<number | null>(
    null
  );

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const locationOptions: LocationOption[] = (locations ?? []) as LocationOption[];

  // Избавляемся от `any`: предполагаем, что в форме хранятся ID фичей как number[]
  const selectedFeatureIds: number[] = Array.isArray(form.features)
    ? (form.features as number[])
    : [];

  // Избавляемся от `any` у location_id: ожидаем number | null
  const locationId: number | null =
    typeof form.location_id === 'number' ? form.location_id : null;

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSubmit(e)
      .then((result) => {
        if (result && result.id) {
          setCreatedBuildingId(result.id);
          nextStep();
        }
      })
      .catch((error) => {
        console.error('Form submission error:', error);
      });
  };

  return (
    <FormLayout
      title="Добавить новостройку"
      description="Заполните информацию о ЖК"
    >
      <ProgressIndicator
        currentStep={step}
        totalSteps={3}
        steps={STEPS}
        className="mb-8"
      />

      {step === 1 && (
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

      {step === 2 && (
        <NBDetailsStep
          values={{
            location_id: locationId,
            floors_range: form.floors_range || '',
            completion_at: (form.completion_at ?? '').slice(0, 10),
            district: form.district || '',
            address: form.address || '',
            latitude: form.latitude ?? '',
            longitude: form.longitude ?? '',
            ceiling_height: form.ceiling_height ?? '',
          }}
          locations={locationOptions}
          onChange={handleChange}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onBack={prevStep}
        />
      )}

      {step === 3 && createdBuildingId && (
        <NBManagementStep
          buildingId={createdBuildingId}
          onBack={() => {
            setStep(1);
            setCreatedBuildingId(null);
          }}
        />
      )}
    </FormLayout>
  );
}
