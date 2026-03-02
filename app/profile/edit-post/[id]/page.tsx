'use client';

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {FormLayout} from '@/ui-components/FormLayout';
import {ProgressIndicator} from '@/ui-components/ProgressIndicator';
import {PropertySelectionStep} from '../../add-post/_components/PropertySelectionStep';
import {PropertyDetailsStep} from '../../add-post/_components/PropertyDetailsStep';
import {useAddPostForm} from '@/hooks/useAddPostForm';
import {useMultiStepForm} from '@/hooks/useMultiStepForm';
import {useGetPropertyByIdQuery} from '@/services/properties/hooks';
import {Property} from '@/services/properties/types';
import {useProfile} from '@/services/login/hooks';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import {axios} from "@/utils/axios";
import {Button} from "@/ui-components/Button";
import {ArrowLeft, ArrowRight} from "lucide-react";
import SafeHtml from "@/app/profile/edit-post/[id]/_components/SafeHtml";
import {isListingModeratorRole} from '@/constants/roles';

const STEPS = ['Основная информация', 'Детали и фото'];

export default function EditPost() {
    const {id} = useParams();
    const router = useRouter();
    const {data: user} = useProfile();

    const userRole = user?.role?.slug;
    const isAdminUser = isListingModeratorRole(userRole);
    const isAgentUser = userRole === 'agent';

    const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    // загрузка списка агентов (для админа)
    useEffect(() => {
        if (!user) return;
        if (!isAdminUser) return;

        (async () => {
            try {
                setAgentsLoading(true);
                // корректно типизируем ответ axios: data будет массивом агентов
                const { data } = await axios.get<{ id: number; name: string }[]>('/user/agents');
                if (Array.isArray(data)) {
                    setAgents(data.map((a) => ({ id: Number(a.id), name: String(a.name) })));
                } else {
                    setAgents([]);
                }
            } catch (err) {
                console.error('Failed to load agents', err);
                setAgents([]);
            } finally {
                setAgentsLoading(false);
            }
        })();
    }, [user, isAdminUser]);

    const {
        data: propertyData,
        isLoading,
        error,
    } = useGetPropertyByIdQuery(id as string);

    // Convert property data to match add-post Property type
const convertedPropertyData: Partial<Property> | undefined = propertyData
    ? {
            id: propertyData.id,
            description: propertyData.description,
            price: propertyData.price,
            currency: 'TJS',
            rooms: propertyData.rooms,
            floor: propertyData.floor,
            title: propertyData.title,
            address: propertyData.address,
            district: propertyData.district,
            creator: propertyData.creator,
            agent_id: propertyData.agent_id,
            type_id: propertyData.type_id,
            status_id: propertyData.status_id,
            location_id: propertyData.location_id,
            repair_type_id: propertyData.repair_type_id,
            developer_id: propertyData.developer_id,
            contract_type_id: propertyData.contract_type_id,
            heating_type_id: propertyData.heating_type_id,
            parking_type_id: propertyData.parking_type_id,
            total_area: propertyData.total_area,
            land_size: propertyData.land_size,
            living_area: propertyData.living_area,
            total_floors: propertyData.total_floors,
            year_built: propertyData.year_built,
            youtube_link: propertyData.youtube_link,
            condition: propertyData.condition,
            apartment_type: propertyData.apartment_type,
            has_garden: propertyData.has_garden,
            has_parking: propertyData.has_parking,
            is_mortgage_available: propertyData.is_mortgage_available,
            is_from_developer: propertyData.is_from_developer,
            is_full_apartment: propertyData.is_full_apartment,
            is_for_aura: propertyData.is_for_aura,
            is_business_owner: propertyData.is_business_owner,
            landmark: propertyData.landmark,
            latitude: propertyData.latitude,
            longitude: propertyData.longitude,
            owner_phone: propertyData.owner_phone,
            owner_name: propertyData.owner_name,
            object_key: propertyData.object_key,
            offer_type: propertyData.offer_type,
            sold_at: propertyData.sold_at,
            status_comment: propertyData.status_comment,
            photos: propertyData.photos,
            moderation_status: propertyData.moderation_status,
            created_by: propertyData.created_by ?? propertyData.creator?.id ?? null,
            // ===== Сделка / залог =====

            buyer_full_name: propertyData.buyer_full_name ?? '',
            buyer_phone: propertyData.buyer_phone ?? '',

            deposit_amount: propertyData.deposit_amount ?? 0,
            deposit_currency: propertyData.deposit_currency ?? 'TJS',
            deposit_received_at: propertyData.deposit_received_at ?? '',
            deposit_taken_at: propertyData.deposit_taken_at ?? '',

            planned_contract_signed_at: propertyData.planned_contract_signed_at ?? '',

            company_expected_income: propertyData.company_expected_income ?? '',
            company_expected_income_currency:
                propertyData.company_expected_income_currency ?? 'TJS',

            company_commission_amount: propertyData.company_commission_amount ?? '',
            company_commission_currency:
                propertyData.company_commission_currency ?? 'TJS',

            actual_sale_price: propertyData.actual_sale_price ?? '',
            actual_sale_currency:
                propertyData.actual_sale_currency ?? 'TJS',

            money_holder: propertyData.money_holder ?? undefined,
        }
        : undefined;



    // Check if user has permission to edit
    useEffect(() => {
        if (propertyData && user) {
            const canEdit =
                isAdminUser ||
                (propertyData.creator &&
                    (user?.id === propertyData.creator.id ||
                        (propertyData.agent_id && user?.id === propertyData.agent_id)));

            if (!canEdit) {
                router.push('/profile');
            }
        }
    }, [propertyData, user, router, isAdminUser]);

    const formData = useAddPostForm({
        editMode: true,
        propertyData: convertedPropertyData as Property | undefined,
    });

    const guardActive = (formData.isDirty || formData.hasNewFiles) && !formData.isSubmitting;
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const rejectionComment = propertyData?.rejection_comment ?? '';

    useUnsavedChanges(guardActive, 'Все несохранённые изменения будут потеряны. Выйти?');

    const {currentStep, nextStep, prevStep} = useMultiStepForm({
        totalSteps: 2,
        initialStep: 1,
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await formData.handleSubmit(e);
        router.push(`/apartment/${id}`);
    };

    if (isLoading) {
        return (
            <FormLayout title="Загрузка..." description="Загружаем данные объявления">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-lg">Загрузка...</div>
                </div>
            </FormLayout>
        );
    }

    if (error || !propertyData) {
        return (
            <FormLayout
                title="Ошибка"
                description="Не удалось загрузить данные объявления"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-lg text-red-600">
                        Ошибка при загрузке объекта
                    </div>
                </div>
            </FormLayout>
        );
    }

    if (!user || !convertedPropertyData) {
        return (
            <FormLayout title="Загрузка..." description="Проверяем права доступа">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-lg">Загрузка...</div>
                </div>
            </FormLayout>
        );
    }

    return (
        <FormLayout
            title="Редактировать объявление"
            description="Измените информацию о вашем объекте недвижимости"
        >
            <ProgressIndicator
                currentStep={currentStep}
                totalSteps={2}
                steps={STEPS}
                className="mb-8"
            />
            {rejectionComment && (
                <div className={`relative w-full sm:fixed right-4 border sm:border-none rounded-2xl overflow-hidden z-[1000] w-full sm:w-[320px] md:w-[440px] transition-all m-4 sm:mt-0 ${isCommentOpen ? 'bottom-0 translate-y-0 sm:bottom-4 sm:translate-none' : 'bottom-0 sm:bottom-4 translate-y-0 sm:translate-y-22'} `}>
                    <div className="bg-white  sm:shadow-lg rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b">
                            <div className="text-sm font-medium">Комментарий модерации</div>
                            <div className="sm:flex hidden items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCommentOpen(v => !v)}
                                    className="text-sm text-blue-600 px-3 py-1"
                                >
                                    {isCommentOpen ? 'Свернуть' : 'Развернуть'}
                                </button>
                            </div>
                        </div>
                        <div className='p-3'>
                            {isCommentOpen ? (
                                <SafeHtml html={rejectionComment} className="prose text-sm" />
                            ) : (
                                <div className="px-3 py-2 text-sm text-gray-700 truncate">
                                    <SafeHtml html={rejectionComment} className="prose text-sm" />
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
            {currentStep === 1 && (
                <PropertySelectionStep
                    isAgent={isAgentUser}
                    isEdit={true}
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
                    isAdmin={isAdminUser}
                    agents={agents}
                    agentsLoading={agentsLoading}
                />
            )}


                <Button
                    className="w-10 h-10 fixed z-[999] p-4 bottom-26 sm:top-1/2 sm:-translate-y-1/2 left-4"
                    type="button"
                    variant="circle"
                    disabled={currentStep == 1}
                    onClick={() => {
                        prevStep();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    size="sm"
                >
                    <ArrowLeft className='w-4'/>
                </Button>



                <Button
                    className="w-10 h-10 fixed z-[999] p-4 bottom-26 sm:top-1/2 sm:-translate-y-1/2 left-15"
                    type="button"
                    variant="circle"
                    disabled={currentStep == 2}
                    onClick={() => {
                        nextStep();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    size="sm"
                >
                    <ArrowRight className='w-4'/>
                </Button>


        </FormLayout>
    );
}
