'use client';

import {useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {FormLayout} from '@/ui-components/FormLayout';
import {useGetPropertyByIdQuery} from '@/services/properties/hooks';
import {Property} from '@/services/properties/types';
import {useProfile} from '@/services/login/hooks';
import {isListingModeratorRole} from '@/constants/roles';
import ListingWizard from '../../add-post/_components/ListingWizard';

export default function EditPost() {
    const {id} = useParams();
    const router = useRouter();
    const {data: user} = useProfile();

    const userRole = user?.role?.slug;
    const isAdminUser = isListingModeratorRole(userRole);

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

    return <ListingWizard mode="edit" propertyData={convertedPropertyData as Property} rejectionComment={propertyData.rejection_comment ?? ''} />;
}
