'use client';

import {FormLayout} from '@/ui-components/FormLayout';
import {ProgressIndicator} from '@/ui-components/ProgressIndicator';
import {PropertySelectionStep} from './_components/PropertySelectionStep';
import {PropertyDetailsStep} from './_components/PropertyDetailsStep';
import {useAddPostForm} from '@/hooks/useAddPostForm';
import {useMultiStepForm} from '@/hooks/useMultiStepForm';
import {DuplicateDialog} from "@/app/profile/_components/DuplicateDialog";
import {useProfile} from "@/services/login/hooks";
import {useUnsavedChanges} from '@/hooks/useUnsavedChanges';
import {Button} from "@/ui-components/Button";
import {ArrowLeft, ArrowRight} from "lucide-react";

const STEPS = ['Основная информация', 'Детали и фото'];

export default function AddPost() {
    const formData = useAddPostForm();
    const {currentStep, nextStep, prevStep, resetSteps} = useMultiStepForm({
        totalSteps: 2,
        initialStep: 1,
    });

    const {data: user} = useProfile();
    const isValid = Boolean(formData.selectedPropertyType && formData.selectedBuildingType && formData.selectedRooms);

    const isDirty = (formData.isDirty || formData.hasNewFiles) && !formData.isSubmitting;
    useUnsavedChanges(isDirty, 'Все несохранённые изменения будут потеряны. Выйти?');

    const handleFormSubmit = async (e: React.FormEvent) => {
        await formData.handleSubmit(e);
        resetSteps();
    };

    return (
        <FormLayout
            title="Добавить объявление"
            description="Заполните информацию о вашем объекте недвижимости"
        >
            <div className='flex items-center'>

                <ProgressIndicator
                    currentStep={currentStep}
                    totalSteps={2}
                    steps={STEPS}
                    className="mb-8"
                    onStepClick={prevStep}
                />
            </div>


            {currentStep === 1 && (
                <PropertySelectionStep
                    isAgent={(user?.role?.slug === 'agent')}
                    isEdit={false}
                    selectedModerationStatus={formData.selectedModerationStatus}
                    setSelectedModerationStatus={formData.setSelectedModerationStatus}
                    selectedOfferType={formData.selectedOfferType}
                    setSelectedOfferType={formData.setSelectedOfferType}
                    selectedListingType={formData.selectedListingType}
                    setSelectedListingType={formData.setSelectedListingType}
                    selectedPropertyType={formData.selectedPropertyType}
                    setSelectedPropertyType={formData.setSelectedPropertyType}
                    selectedBuildingType={formData.selectedBuildingType}
                    setSelectedBuildingType={formData.setSelectedBuildingType}
                    selectedRooms={formData.selectedRooms}
                    setSelectedRooms={formData.setSelectedRooms}
                    propertyTypes={formData.propertyTypes}
                    buildingTypes={formData.buildingTypes}
                    onNext={nextStep}
                    form={formData.form}
                    onChange={formData.handleChange}
                />
            )}

            {currentStep === 2 && (
                <PropertyDetailsStep
                    form={formData.form}
                    locations={formData.locations}
                    repairTypes={formData.repairTypes}
                    developers={formData.developers}
                    heatingTypes={formData.heatingTypes}
                    parkingTypes={formData.parkingTypes}
                    contractTypes={formData.contractTypes}
                    onSubmit={handleFormSubmit}
                    onChange={formData.handleChange}
                    onPhotoChange={formData.handleFileChange}
                    onPhotoRemove={formData.removePhoto}
                    onReorder={formData.handleReorder}
                    isSubmitting={formData.isSubmitting}
                    onBack={prevStep}
                    selectedPropertyType={formData.selectedPropertyType}
                    propertyTypes={formData.propertyTypes}
                />
            )}

            <DuplicateDialog
                open={formData.dupDialogOpen}
                onClose={() => formData.setDupDialogOpen(false)}
                items={formData.duplicates}
                onForce={formData.forceCreate}
            />

            <Button
                className="w-10 h-10 fixed z-[999] p-4 bottom-26 sm:top-1/2 sm:-translate-y-1/2 left-4"
                type="button"
                variant="circle"
                disabled={currentStep == 1}
                onClick={() => {
                    prevStep();
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                size="sm"
            >
                <ArrowLeft className='w-4'/>
            </Button>


            <Button
                className="w-10 h-10 fixed z-[999] p-4 bottom-26 sm:top-1/2 sm:-translate-y-1/2 left-15"
                type="button"
                variant="circle"
                disabled={currentStep == 2 || !isValid}
                onClick={() => {
                    nextStep();
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                size="sm"
            >
                <ArrowRight className='w-4'/>
            </Button>

        </FormLayout>

    );
}
