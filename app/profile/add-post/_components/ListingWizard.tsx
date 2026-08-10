'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import {
  BadgeDollarSign,
  Blocks,
  BrickWall,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock3,
  DoorOpen,
  Grid3X3,
  Hammer,
  House,
  KeyRound,
  Landmark,
  LoaderCircle,
  MapPin,
  Paintbrush,
  PackageOpen,
  Sparkles,
  Store,
  TreePine,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/ui-components/Input';
import { PhotoUpload } from '@/ui-components/PhotoUpload';
import { Select } from '@/ui-components/Select';
import { SearchableSelect } from '@/ui-components/SearchableSelect';
import { showToast } from '@/ui-components/Toast';
import { DuplicateDialog } from '@/app/profile/_components/DuplicateDialog';
import { useAddPostForm } from '@/hooks/useAddPostForm';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { isListingModeratorRole, normalizeRoleSlug } from '@/constants/roles';
import { useProfile } from '@/services/login/hooks';
import { axios } from '@/utils/axios';
import type { Property } from '@/services/properties/types';
import type { SelectOption } from '@/services/add-post/types';
import { PROPERTY_DOCUMENT_TYPES } from '@/constants/property-document-types';
import { getRepairTypeValidationError } from '@/services/add-post/repair-type-form';
import { getAddressValidationError } from '@/services/add-post/location-form';
import {
  LISTING_CATEGORY_CARDS,
  type ListingCategory,
} from '@/services/add-post/listing-categories';
import { orderListingLocationOptions } from '@/services/home/location-options';

type WizardMode = 'add' | 'edit';
type StepErrors = Record<string, string>;

type ListingWizardProps = {
  mode: WizardMode;
  propertyData?: Property;
  rejectionComment?: string;
};

type DictOption = {
  id: string | number;
  name: string;
};

type TransportDraft = {
  category_id: string;
  brand_id: string;
  model_id: string;
  year: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  drive_type: string;
  condition: string;
};

const STEP_TITLES = [
  'Тип объявления',
  'Введите адрес',
  'Параметры объекта',
  'Фото',
  'Описание объявления',
  'Цена',
];

const PUBLICATION_STATUS_OPTIONS = [
  { id: 'approved', label: 'Опубликован' },
  { id: 'pending', label: 'На модерации' },
] as const;

const FUEL_OPTIONS = [
  { value: 'petrol', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'electric', label: 'Электро' },
  { value: 'gas', label: 'Газ' },
  { value: 'other', label: 'Другое' },
];

const TRANSMISSION_OPTIONS = [
  { value: 'manual', label: 'Механика' },
  { value: 'automatic', label: 'Автомат' },
  { value: 'robot', label: 'Робот' },
  { value: 'variator', label: 'Вариатор' },
];

const DRIVE_OPTIONS = [
  { value: 'front', label: 'Передний' },
  { value: 'rear', label: 'Задний' },
  { value: 'all_wheel', label: 'Полный' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'used', label: 'С пробегом' },
];

const toSelectOptions = (options: Array<{ value: string; label: string }>) =>
  options.map((option) => ({
    id: option.value,
    name: option.label,
  }));

type YMapClickEvent = {
  get: (key: 'coords') => [number, number];
};

type YPlacemarkDragEvent = {
  get: (key: 'target') => {
    geometry: {
      getCoordinates: () => [number, number];
    };
  };
};

type GeocoderGeoObject = {
  getAddressLine?: () => string;
  getAdministrativeAreas?: () => string[];
  geometry?: {
    getCoordinates?: () => [number, number];
  };
};

type GeocoderResult = {
  geoObjects: {
    get: (index: number) => GeocoderGeoObject | null;
  };
};

type YMapsApi = {
  geocode: (
    request: string | [number, number],
    options?: { results?: number }
  ) => Promise<GeocoderResult>;
};

type AddressLookupState = 'idle' | 'searching' | 'resolved' | 'error';

const isTransportType = (option?: { slug?: string; name?: string } | null) => {
  const haystack = `${option?.slug ?? ''} ${option?.name ?? ''}`.toLowerCase();
  return /transport|транспорт|авто|car/.test(haystack);
};

const isLandLikeType = (option?: { slug?: string; name?: string } | null) => {
  const haystack = `${option?.slug ?? ''} ${option?.name ?? ''}`.toLowerCase();
  return /land|участ|земл/.test(haystack);
};

const isCommercialType = (option?: { slug?: string; name?: string } | null) => {
  const haystack = `${option?.slug ?? ''} ${option?.name ?? ''}`.toLowerCase();
  return /commercial|коммер/.test(haystack);
};

const isApartmentLikeType = (option?: { slug?: string; name?: string } | null) => {
  const haystack = `${option?.slug ?? ''} ${option?.name ?? ''}`.toLowerCase();
  return /apartment|flat|квартир|комнат/.test(haystack);
};

const resolveRoomsPreset = (rooms: number | null): string => {
  if (rooms === null || rooms === undefined) return '1';
  if (rooms === 0) return 'studio';
  if (rooms >= 6) return '6+';
  return String(rooms);
};

const roomsPresetToNumber = (preset: string): number => {
  if (preset === 'studio') return 0;
  if (preset === '6+') return 6;
  if (preset === 'free') return 6;
  return Number(preset) || 1;
};

const toOptions = (payload: unknown): DictOption[] => {
  const raw = Array.isArray(payload) ? payload : (payload as { data?: unknown[] } | null)?.data ?? [];
  return raw.map((item) => {
    const source = item as { id: string | number; name?: string; title?: string };
    return {
      id: source.id,
      name: source.name ?? source.title ?? `#${source.id}`,
    };
  });
};

const makeSyntheticEvent = (
  name: string,
  value: string
): ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> =>
  ({
    target: { name, value },
    currentTarget: { name, value },
  } as unknown as ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>);

function StepChip({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
        active
          ? 'border-2 border-[#006341] bg-[#F7FBF9] text-[#006341] shadow-[0_2px_8px_rgba(0,99,65,0.08)]'
          : 'border-[#D7DDE6] bg-white text-[#2D3554] hover:border-[#9FB7AA] hover:bg-[#F9FCFA] hover:text-[#006341]'
      }`}
    >
      {Icon ? <Icon aria-hidden="true" size={17} strokeWidth={1.9} className="shrink-0" /> : null}
      <span>{label}</span>
    </button>
  );
}

const getPropertyTypeIcon = (option: { slug?: string; name?: string }): LucideIcon => {
  const value = `${option.slug ?? ''} ${option.name ?? ''}`.toLowerCase();

  if (/commercial|коммер/.test(value)) return Store;
  if (/room|комнат/.test(value)) return DoorOpen;
  if (/dacha|дач/.test(value)) return TreePine;
  if (/house|дом/.test(value)) return House;
  return Building2;
};

const getBuildingTypeIcon = (option: { slug?: string; name?: string }): LucideIcon => {
  const value = `${option.slug ?? ''} ${option.name ?? ''}`.toLowerCase();

  if (/brick|кирпич/.test(value)) return BrickWall;
  if (/monolith|монолит/.test(value)) return Landmark;
  if (/block|блоч/.test(value)) return Blocks;
  if (/wood|дерев/.test(value)) return TreePine;
  if (/panel|панел/.test(value)) return Grid3X3;
  return Hammer;
};

const getRepairTypeIcon = (option: { slug?: string; name?: string }): LucideIcon => {
  const value = `${option.slug ?? ''} ${option.name ?? ''}`.toLowerCase();

  if (/без ремонт|короб|shell|unfinished/.test(value)) return PackageOpen;
  if (/нов|new/.test(value)) return Sparkles;
  return Paintbrush;
};

function PublicationStepper({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: string[];
}) {
  const progress = Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 83.333);

  return (
    <div className="mb-8 rounded-2xl border border-[#DCE9E2] bg-[#F7FBF8] p-4 md:px-5">
      <div className="relative">
        <div className="absolute left-[8.333%] right-[8.333%] top-4 h-px bg-[#D5E1DB] md:top-5" />
        <div
          className="absolute left-[8.333%] top-4 h-px bg-[#007A4D] transition-[width] duration-300 md:top-5"
          style={{ width: `${progress}%` }}
        />

        <ol
          className="relative z-10 grid grid-cols-6"
          aria-label="Этапы публикации объявления"
        >
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <li
                key={step}
                className="flex min-w-0 flex-col items-center text-center"
                aria-label={`${stepNumber}. ${step}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition md:h-10 md:w-10 md:text-sm ${
                    isComplete
                      ? 'border-[#007A4D] bg-[#007A4D] text-white'
                      : isCurrent
                        ? 'border-[#007A4D] bg-white text-[#007A4D] shadow-[0_0_0_4px_rgba(0,122,77,0.12)]'
                        : 'border-[#D5E1DB] bg-white text-[#94A3B8]'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : stepNumber}
                </span>
                <span
                  className={`mt-2 hidden max-w-full px-1 text-xs font-medium leading-4 md:block ${
                    isCurrent ? 'text-[#006341]' : isComplete ? 'text-[#365C4C]' : 'text-[#7B8A9D]'
                  }`}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-3 text-center text-xs font-semibold text-[#006341] md:hidden">
        Шаг {currentStep}: {steps[currentStep - 1]}
      </p>
    </div>
  );
}

function WizardActions({
  currentStep,
  totalSteps,
  isSubmitting,
  mode,
  onBack,
  onNext,
}: {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  mode: WizardMode;
  onBack: () => void;
  onNext: () => void;
}) {
  const isLast = currentStep === totalSteps;

  return (
    <div className="mt-10 flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        className="min-w-[108px] rounded-lg bg-[#DCE3EC] px-5 py-3 text-sm font-medium text-[#7A8798] disabled:cursor-not-allowed disabled:opacity-80"
      >
        Назад
      </button>
      <button
        type={isLast ? 'submit' : 'button'}
        onClick={isLast ? undefined : onNext}
        disabled={isSubmitting}
        className="min-w-[108px] rounded-lg bg-[#006341] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLast ? (isSubmitting ? 'Сохранение...' : mode === 'edit' ? 'Сохранить' : 'Создать') : 'Продолжить'}
      </button>
    </div>
  );
}

export default function ListingWizard({
  mode,
  propertyData,
  rejectionComment,
}: ListingWizardProps) {
  const router = useRouter();
  const { data: user } = useProfile();
  const userRole = normalizeRoleSlug(user?.role?.slug);
  const canManagePublicationStatus = isListingModeratorRole(userRole);
  const formData = useAddPostForm({
    editMode: mode === 'edit',
    propertyData,
    forcePendingModeration: !canManagePublicationStatus,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [roomsPreset, setRoomsPreset] = useState('1');
  const [coordinates, setCoordinates] = useState<[number, number]>([
    Number(formData.form.latitude) || 38.5598,
    Number(formData.form.longitude) || 68.787,
  ]);
  const [listingCategory, setListingCategory] = useState<ListingCategory>('secondary');
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [addressCaption, setAddressCaption] = useState('');
  const [addressLookupState, setAddressLookupState] = useState<AddressLookupState>('idle');
  const [isYMapsReady, setIsYMapsReady] = useState(false);
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  const [transportForm, setTransportForm] = useState<TransportDraft>({
    category_id: '',
    brand_id: '',
    model_id: '',
    year: '',
    mileage: '',
    fuel_type: '',
    transmission: '',
    drive_type: '',
    condition: '',
  });
  const initializedRef = useRef(false);
  const ymapsRef = useRef<YMapsApi | null>(null);
  const geocodeRequestRef = useRef(0);
  const skipForwardGeocodeRef = useRef(false);
  const setFieldValueRef = useRef<(name: string, value: string) => void>(() => undefined);
  const isDirty = (formData.isDirty || formData.hasNewFiles) && !formData.isSubmitting;
  const locationOptions = useMemo(() => {
    const uniqueByName = new globalThis.Map<string, { id: string | number; name: string }>();

    formData.locations.forEach((option) => {
      const name = String(option.city || option.name || '').trim();
      if (!name) return;

      const key = name.toLocaleLowerCase('ru-RU');
      const current = uniqueByName.get(key);
      if (!current || String(option.id) === String(formData.form.location_id)) {
        uniqueByName.set(key, { id: option.id, name });
      }
    });

    return orderListingLocationOptions(Array.from(uniqueByName.values()));
  }, [formData.form.location_id, formData.locations]);
  const selectedLocationName = useMemo(
    () =>
      locationOptions.find((option) => String(option.id) === String(formData.form.location_id))
        ?.name ?? '',
    [formData.form.location_id, locationOptions]
  );

  useUnsavedChanges(isDirty, 'Все несохранённые изменения будут потеряны. Выйти?');

  const { data: categoriesData } = useQuery({
    queryKey: ['wizard', 'car-categories'],
    queryFn: async () => (await axios.get('/car-categories')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['wizard', 'car-brands'],
    queryFn: async () => (await axios.get('/car-brands')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: modelsData } = useQuery({
    queryKey: ['wizard', 'car-models', transportForm.brand_id],
    queryFn: async () => (await axios.get('/car-models', { params: { brand_id: transportForm.brand_id } })).data,
    enabled: Boolean(transportForm.brand_id),
    staleTime: 5 * 60 * 1000,
  });

  const transportPropertyType = useMemo(
    () => formData.propertyTypes.find((item) => isTransportType(item)) ?? null,
    [formData.propertyTypes]
  );

  const secondaryPropertyTypes = useMemo(
    () => formData.propertyTypes.filter((item) => !isTransportType(item)),
    [formData.propertyTypes]
  );
  const carCategoryOptions = useMemo(() => toOptions(categoriesData), [categoriesData]);
  const carBrandOptions = useMemo(() => toOptions(brandsData), [brandsData]);
  const carModelOptions = useMemo(() => toOptions(modelsData), [modelsData]);

  const selectedPropertyOption = useMemo(
    () =>
      formData.propertyTypes.find((item) => Number(item.id) === Number(formData.selectedPropertyType)) ??
      null,
    [formData.propertyTypes, formData.selectedPropertyType]
  );

  const shouldShowRooms = Boolean(
    selectedPropertyOption &&
      !isLandLikeType(selectedPropertyOption) &&
      !isCommercialType(selectedPropertyOption) &&
      !isTransportType(selectedPropertyOption)
  );

  useEffect(() => {
    if (initializedRef.current) return;

    const selectedType = formData.propertyTypes.find(
      (item) => Number(item.id) === Number(formData.selectedPropertyType)
    );

    if (selectedType && isTransportType(selectedType)) {
      setListingCategory('transport');
    } else {
      setListingCategory('secondary');
      if (!formData.selectedPropertyType && secondaryPropertyTypes.length > 0) {
        formData.setSelectedPropertyType(Number(secondaryPropertyTypes[0].id));
      }
    }

    setRoomsPreset(resolveRoomsPreset(formData.selectedRooms));
    initializedRef.current = true;
  }, [
    formData,
    secondaryPropertyTypes,
  ]);

  useEffect(() => {
    if (!formData.form.latitude || !formData.form.longitude) return;
    setCoordinates([
      Number(formData.form.latitude) || 38.5598,
      Number(formData.form.longitude) || 68.787,
    ]);
  }, [formData.form.latitude, formData.form.longitude]);

  useEffect(() => {
    setAddressCaption(formData.form.address || '');
  }, [formData.form.address]);

  const titleCounter = `${String(formData.form.title ?? '').length}/100`;
  const descriptionCounter = `${String(formData.form.description ?? '').length}/3000`;
  const repairTypeFieldError =
    stepErrors.repair_type_id ??
    (formData.isRepairTypesError
      ? 'Не удалось загрузить типы ремонта.'
      : !formData.isRepairTypesLoading && formData.repairTypes.length === 0
        ? 'Типы ремонта пока недоступны.'
        : undefined);

  const clearStepError = (key: string) => {
    setStepErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    formData.handleChange(event);
    clearStepError(event.target.name);
  };
  setFieldValueRef.current = (name, value) => {
    handleFieldChange(makeSyntheticEvent(name, value));
  };

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    geocodeRequestRef.current += 1;
    handleFieldChange(event);
    setAddressCaption('');
    setAddressLookupState('idle');
    setFieldValueRef.current('latitude', '');
    setFieldValueRef.current('longitude', '');
  };

  const handleLocationChange = (value: string) => {
    geocodeRequestRef.current += 1;
    setFieldValueRef.current('location_id', value);
    if (formData.form.address.trim()) {
      setAddressCaption('');
      setAddressLookupState('idle');
      setFieldValueRef.current('latitude', '');
      setFieldValueRef.current('longitude', '');
    }
  };

  useEffect(() => {
    const address = formData.form.address.trim();

    if (skipForwardGeocodeRef.current) {
      skipForwardGeocodeRef.current = false;
      return;
    }

    if (!address) {
      setAddressCaption('');
      setAddressLookupState('idle');
      return;
    }

    if (address.length < 3 || !isYMapsReady || !ymapsRef.current) {
      setAddressLookupState('idle');
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++geocodeRequestRef.current;
      const addressIncludesCity =
        selectedLocationName &&
        address.toLocaleLowerCase('ru-RU').includes(selectedLocationName.toLocaleLowerCase('ru-RU'));
      const query =
        selectedLocationName && !addressIncludesCity
          ? `Таджикистан, ${selectedLocationName}, ${address}`
          : `Таджикистан, ${address}`;

      setAddressLookupState('searching');

      try {
        const result = await ymapsRef.current!.geocode(query, { results: 1 });
        if (requestId !== geocodeRequestRef.current) return;

        const geoObject = result.geoObjects.get(0);
        const nextCoordinates = geoObject?.geometry?.getCoordinates?.();

        if (!nextCoordinates) {
          setAddressLookupState('error');
          return;
        }

        setCoordinates(nextCoordinates);
        setFieldValueRef.current('latitude', String(nextCoordinates[0]));
        setFieldValueRef.current('longitude', String(nextCoordinates[1]));
        setAddressCaption(geoObject?.getAddressLine?.() || query);
        setAddressLookupState('resolved');
      } catch {
        if (requestId === geocodeRequestRef.current) {
          setAddressLookupState('error');
        }
      }
    }, 650);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formData.form.address, isYMapsReady, selectedLocationName]);

  const validateStep = (): boolean => {
    const nextErrors: StepErrors = {};

    if (currentStep === 1) {
      if (listingCategory !== 'transport' && !formData.selectedPropertyType) {
        nextErrors.property_type = 'Выберите тип недвижимости.';
      }
    }

    if (currentStep === 2) {
      const addressError = getAddressValidationError(formData.form.address);
      if (addressError) nextErrors.address = addressError;
    }

    if (currentStep === 3) {
      if (listingCategory === 'transport') {
        if (!transportForm.category_id) nextErrors.transport_category = 'Выберите тип кузова.';
        if (!transportForm.brand_id) nextErrors.transport_brand = 'Выберите марку.';
        if (!transportForm.model_id) nextErrors.transport_model = 'Выберите модель.';
        if (!transportForm.year.trim()) nextErrors.transport_year = 'Укажите год выпуска.';
      }

      if (listingCategory !== 'transport') {
        const areaValue = isLandLikeType(selectedPropertyOption)
          ? formData.form.land_size
          : formData.form.total_area;

        if (shouldShowRooms && formData.selectedRooms === null) {
          nextErrors.rooms = 'Выберите количество комнат.';
        }

        const repairTypeError = getRepairTypeValidationError(formData.form.repair_type_id);
        if (repairTypeError) {
          nextErrors.repair_type_id = repairTypeError;
        }

        if (!String(areaValue ?? '').trim()) {
          nextErrors.area = isLandLikeType(selectedPropertyOption)
            ? 'Укажите площадь участка.'
            : 'Укажите общую площадь.';
        }
      }
    }

    if (currentStep === 5) {
      if (!formData.form.title.trim()) {
        nextErrors.title = 'Введите заголовок объявления.';
      }
      if (!formData.form.description.trim()) {
        nextErrors.description = 'Введите описание объявления.';
      }
    }

    if (currentStep === 6 && !formData.form.price.trim()) {
      nextErrors.price = 'Укажите цену.';
    }

    setStepErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCategorySelect = (category: ListingCategory) => {
    setListingCategory(category);

    if (category === 'transport') {
      if (transportPropertyType) {
        formData.setSelectedPropertyType(Number(transportPropertyType.id));
      }
      formData.setSelectedOfferType('sale');
      formData.setSelectedRooms(null);
      setCurrentStep(2);
      return;
    }

    const nextType = secondaryPropertyTypes[0];
    if (nextType) {
      formData.setSelectedPropertyType(Number(nextType.id));
    }
    clearStepError('property_type');
  };

  const updateAddressFromCoordinates = async (coords: [number, number]) => {
    const requestId = ++geocodeRequestRef.current;
    setCoordinates(coords);
    setFieldValueRef.current('latitude', String(coords[0]));
    setFieldValueRef.current('longitude', String(coords[1]));
    setAddressLookupState('searching');

    if (!ymapsRef.current) {
      setAddressLookupState('idle');
      return;
    }

    try {
      const result = await ymapsRef.current.geocode(coords, { results: 1 });
      if (requestId !== geocodeRequestRef.current) return;

      const firstGeoObject = result.geoObjects.get(0);
      if (!firstGeoObject) {
        setAddressLookupState('error');
        return;
      }

      const address = firstGeoObject.getAddressLine?.() ?? '';
      if (address) {
        skipForwardGeocodeRef.current = true;
        setAddressCaption(address);
        setFieldValueRef.current('address', address);
      }

      const administrativeAreas = firstGeoObject.getAdministrativeAreas?.() ?? [];
      const district = administrativeAreas[0] ?? '';
      if (district) {
        setFieldValueRef.current('district', district);
      }

      const normalizedAddress = `${address} ${administrativeAreas.join(' ')}`.toLocaleLowerCase('ru-RU');
      const matchedLocation = formData.locations.find((location: SelectOption) => {
        const names = [location.city, location.name]
          .map((name) => String(name ?? '').trim().toLocaleLowerCase('ru-RU'))
          .filter(Boolean);
        return names.some((name) => normalizedAddress.includes(name));
      });

      if (matchedLocation) {
        setFieldValueRef.current('location_id', String(matchedLocation.id));
      }

      setAddressLookupState(address ? 'resolved' : 'idle');
    } catch {
      setAddressLookupState('error');
    }
  };

  const handleMapClick = (event: YMapClickEvent) => {
    void updateAddressFromCoordinates(event.get('coords'));
  };

  const handleRoomsPresetChange = (preset: string) => {
    setRoomsPreset(preset);
    formData.setSelectedRooms(roomsPresetToNumber(preset));
    clearStepError('rooms');
  };

  const handleTransportChange = (key: keyof TransportDraft, value: string) => {
    setTransportForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'brand_id' ? { model_id: '' } : {}),
    }));

    const errorKeyMap: Partial<Record<keyof TransportDraft, string>> = {
      category_id: 'transport_category',
      brand_id: 'transport_brand',
      model_id: 'transport_model',
      year: 'transport_year',
    };

    const errorKey = errorKeyMap[key];
    if (errorKey) clearStepError(errorKey);
    if (key === 'brand_id') clearStepError('transport_model');
  };

  const handleNext = () => {
    if (!validateStep() || currentStep >= STEP_TITLES.length) return;
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentStep <= 1) return;
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (currentStep !== STEP_TITLES.length) {
      handleNext();
      return;
    }

    if (!validateStep()) return;

    if (listingCategory === 'transport') {
      showToast('info', 'Создание автомобилей пока не подключено к отдельному car API.');
      return;
    }

    if (transportPropertyType) {
      formData.setSelectedPropertyType(Number(transportPropertyType.id));
    }

    const success = await formData.handleSubmit(event);
    if (!success) return;

    if (mode === 'edit' && propertyData?.id && canManagePublicationStatus) {
      router.push(`/apartment/${propertyData.id}`);
      return;
    }

    const targetStatus = canManagePublicationStatus
      ? formData.selectedModerationStatus
      : 'pending';
    const resultFlag = mode === 'edit' ? 'updated=1' : 'created=1';
    router.push(`/profile/my-listings?tab=${targetStatus}&${resultFlag}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-14">
      <div className="mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center gap-2 text-xs text-[#8C98AB]">
          <Link href="/" className="hover:text-[#006341]">Главная</Link>
          <ChevronRight size={12} />
          <span>Каталог</span>
          <ChevronRight size={12} />
          <span>{mode === 'edit' ? 'Редактировать объявление' : 'Добавить объявление'}</span>
        </nav>

        {/*<h1 className="mb-5 text-[22px] font-extrabold text-[#111827]">*/}
        {/*  {mode === 'edit' ? 'Редактировать объявление' : 'Добавить объявление'}*/}
        {/*</h1>*/}

        {rejectionComment ? (
          <div className="mb-4 rounded-2xl border border-[#F8D7DA] bg-[#FFF5F5] p-4 text-sm text-[#7A1F28]">
            <div className="flex items-start justify-between gap-4">
              <div className={`${commentExpanded ? '' : 'line-clamp-2'}`}>{rejectionComment}</div>
              <button
                type="button"
                onClick={() => setCommentExpanded((prev) => !prev)}
                className="shrink-0 text-sm font-medium text-[#006341]"
              >
                {commentExpanded ? 'Свернуть' : 'Развернуть'}
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-7">
            <div className="mb-6 text-[#111827]">
              <div className="mb-1 text-2xl font-extrabold">
                {mode === 'edit' ? 'Редактировать объявление' : 'Добавить объявление'}
              </div>
              <div className="text-sm text-[#94A3B8]">
                Шаг {currentStep} из {STEP_TITLES.length}: {STEP_TITLES[currentStep - 1]}
              </div>
            </div>

            <PublicationStepper currentStep={currentStep} steps={STEP_TITLES} />

            {currentStep === 1 ? (
              <div className="space-y-8">
                <div className="grid gap-3 md:grid-cols-3">
                  {LISTING_CATEGORY_CARDS.map((card) => {
                    const active = listingCategory === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleCategorySelect(card.id)}
                        className={`flex min-h-[92px] items-center justify-between overflow-hidden rounded-2xl border bg-white pl-5 pr-3 text-left transition ${
                          active ? 'border-[#006341] border-2 shadow-[0_0_0_2px_rgba(0,99,65,0.08)]' : 'border-[#D7DDE6]'
                        }`}
                      >
                        <span className="text-sm font-medium text-[#1F2937]">{card.title}</span>
                        <div className="relative h-[86px] w-[120px] shrink-0">
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                className="object-contain object-right"
                sizes="120px"
                quality={85}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {listingCategory !== 'transport' ? (
                  <>
                    <div>
                      <div className="mb-3 text-sm font-semibold text-[#111827]">Тип объявления</div>
                      <div className="flex flex-wrap gap-2">
                        <StepChip
                          label="Продажа"
                          icon={BadgeDollarSign}
                          active={formData.selectedOfferType === 'sale'}
                          onClick={() => formData.setSelectedOfferType('sale')}
                        />
                        <StepChip
                          label="Аренда"
                          icon={KeyRound}
                          active={formData.selectedOfferType === 'rent'}
                          onClick={() => formData.setSelectedOfferType('rent')}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-sm font-semibold text-[#111827]">Недвижимость</div>
                      <div className="flex flex-wrap gap-2">
                        {secondaryPropertyTypes.map((option) => (
                          <StepChip
                            key={option.id}
                            label={option.name}
                            icon={getPropertyTypeIcon(option)}
                            active={Number(formData.selectedPropertyType) === Number(option.id)}
                            onClick={() => {
                              formData.setSelectedPropertyType(Number(option.id));
                              clearStepError('property_type');
                            }}
                          />
                        ))}
                      </div>
                      {stepErrors.property_type ? (
                        <p className="mt-2 text-sm text-red-600">{stepErrors.property_type}</p>
                      ) : null}
                    </div>

                    {mode === 'edit' && formData.buildingTypes.length > 0 ? (
                      <div>
                        <div className="mb-3 text-sm font-semibold text-[#111827]">Тип объекта</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.buildingTypes.map((option) => (
                            <StepChip
                              key={option.id}
                              label={option.name}
                              icon={getBuildingTypeIcon(option)}
                              active={Number(formData.selectedBuildingType) === Number(option.id)}
                              onClick={() => formData.setSelectedBuildingType(Number(option.id))}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {canManagePublicationStatus ? (
                      <div>
                        <div className="mb-3 text-sm font-semibold text-[#111827]">Статус</div>
                        <div className="flex flex-wrap gap-2">
                          {PUBLICATION_STATUS_OPTIONS.map((option) => (
                            <StepChip
                              key={option.id}
                              label={option.label}
                              icon={option.id === 'approved' ? CircleCheck : Clock3}
                              active={formData.selectedModerationStatus === option.id}
                              onClick={() => formData.setSelectedModerationStatus(option.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-4">
                <h2 className="text-[30px] font-extrabold text-[#111827]">Введите адрес</h2>
                <SearchableSelect
                  label="Город"
                  name="location_id"
                  value={formData.form.location_id}
                  onValueChange={handleLocationChange}
                  options={locationOptions}
                  placeholder="Выберите город"
                  searchPlaceholder="Найдите город в списке"
                />
                <Input
                  label="Адрес"
                  name="address"
                  value={formData.form.address}
                  onChange={handleAddressChange}
                  placeholder="Например, улица Айни, 48"
                  error={stepErrors.address}
                />

                <div
                  className="min-h-5 text-sm"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {addressLookupState === 'searching' ? (
                    <span className="inline-flex items-center gap-2 text-[#64748B]">
                      <LoaderCircle size={16} className="animate-spin text-[#16845F]" />
                      Ищем точку на карте… Можно продолжить без ожидания.
                    </span>
                  ) : null}
                  {addressLookupState === 'resolved' ? (
                    <span className="inline-flex items-center gap-2 font-medium text-[#087553]">
                      <CheckCircle2 size={16} />
                      Метка установлена. При необходимости передвиньте её.
                    </span>
                  ) : null}
                  {addressLookupState === 'error' ? (
                    <span className="inline-flex items-center gap-2 text-[#B45309]">
                      <MapPin size={16} />
                      Точка не найдена автоматически. Можно продолжить без метки.
                    </span>
                  ) : null}
                  {addressLookupState === 'idle' ? (
                    <span className="inline-flex items-center gap-2 text-[#64748B]">
                      <MapPin size={16} className="text-[#16845F]" />
                      Карта необязательна — при желании укажите точное место.
                    </span>
                  ) : null}
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[#DDE7E2] bg-[#EEF2F7] shadow-[0_8px_24px_rgba(27,62,48,0.08)]">
                  <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-[#40524A] shadow-md backdrop-blur">
                    Метка на карте — необязательно
                  </div>
                  <YMaps
                    query={{
                      lang: 'ru_RU',
                      apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
                    }}
                  >
                    <Map
                      width="100%"
                      height={360}
                      defaultState={{ center: coordinates, zoom: 12 }}
                      state={{ center: coordinates, zoom: 12 }}
                      onClick={handleMapClick}
                      modules={['geocode']}
                      onLoad={(ymaps) => {
                        const maybe = ymaps as {
                          geocode?: YMapsApi['geocode'];
                        };
                        ymapsRef.current =
                          typeof maybe.geocode === 'function'
                            ? { geocode: (request, options) => maybe.geocode!(request, options) }
                            : null;
                        setIsYMapsReady(Boolean(ymapsRef.current));
                        return undefined;
                      }}
                    >
                      {formData.form.latitude && formData.form.longitude ? (
                        <Placemark
                          geometry={coordinates}
                          options={{ draggable: true }}
                          onDragEnd={(event: YPlacemarkDragEvent) => {
                            const nextCoordinates = event.get('target').geometry.getCoordinates();
                            void updateAddressFromCoordinates(nextCoordinates);
                          }}
                        />
                      ) : null}
                    </Map>
                  </YMaps>
                </div>
                {addressCaption ? (
                  <div className="rounded-xl bg-[#F1F7F4] px-3 py-2.5 text-sm text-[#456057]">
                    <span className="font-semibold text-[#1C4938]">Выбранный адрес:</span>{' '}
                    {addressCaption}
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 text-[30px] font-extrabold text-[#111827]">
                    {listingCategory === 'transport' ? 'О транспорте' : 'О квартире'}
                  </h2>

                  {listingCategory === 'transport' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Select
                        label="Тип кузова"
                        name="transport_category"
                          value={transportForm.category_id}
                          onChange={(event) => handleTransportChange('category_id', event.target.value)}
                        options={carCategoryOptions}
                        placeholder="Выберите тип кузова"
                        error={stepErrors.transport_category}
                      />

                      <Select
                        label="Состояние"
                        name="transport_condition"
                          value={transportForm.condition}
                          onChange={(event) => handleTransportChange('condition', event.target.value)}
                        options={toSelectOptions(CONDITION_OPTIONS)}
                        placeholder="Выберите состояние"
                      />

                      <Select
                        label="Марка"
                        name="transport_brand"
                          value={transportForm.brand_id}
                          onChange={(event) => handleTransportChange('brand_id', event.target.value)}
                        options={carBrandOptions}
                        placeholder="Выберите марку"
                        error={stepErrors.transport_brand}
                      />

                      <Select
                        label="Модель"
                        name="transport_model"
                          value={transportForm.model_id}
                          onChange={(event) => handleTransportChange('model_id', event.target.value)}
                        options={carModelOptions}
                        placeholder="Выберите модель"
                        error={stepErrors.transport_model}
                        disabled={!transportForm.brand_id}
                      />

                      <Input
                        label="Год выпуска"
                        name="transport_year"
                        value={transportForm.year}
                        onChange={(event) => handleTransportChange('year', event.target.value)}
                        error={stepErrors.transport_year}
                      />
                      <Input
                        label="Пробег"
                        name="transport_mileage"
                        value={transportForm.mileage}
                        onChange={(event) => handleTransportChange('mileage', event.target.value)}
                      />

                      <Select
                        label="Топливо"
                        name="transport_fuel_type"
                          value={transportForm.fuel_type}
                          onChange={(event) => handleTransportChange('fuel_type', event.target.value)}
                        options={toSelectOptions(FUEL_OPTIONS)}
                        placeholder="Выберите топливо"
                      />

                      <Select
                        label="Коробка передач"
                        name="transport_transmission"
                          value={transportForm.transmission}
                          onChange={(event) => handleTransportChange('transmission', event.target.value)}
                        options={toSelectOptions(TRANSMISSION_OPTIONS)}
                        placeholder="Выберите коробку"
                      />

                      <Select
                        label="Привод"
                        name="transport_drive_type"
                          value={transportForm.drive_type}
                          onChange={(event) => handleTransportChange('drive_type', event.target.value)}
                        options={toSelectOptions(DRIVE_OPTIONS)}
                        placeholder="Выберите привод"
                      />
                    </div>
                  ) : (
                    <>
                  {shouldShowRooms ? (
                    <>
                      <div className="mb-3 text-sm font-medium text-[#111827]">Количество комнат</div>
                      <div className="mb-5 flex flex-wrap gap-2">
                        {[
                          { id: 'studio', label: 'Студия' },
                          { id: '1', label: '1' },
                          { id: '2', label: '2' },
                          { id: '3', label: '3' },
                          { id: '4', label: '4' },
                          { id: '5', label: '5' },
                          { id: '6+', label: '6+' },
                          { id: 'free', label: 'Свободная планировка' },
                        ].map((item) => (
                          <StepChip
                            key={item.id}
                            label={item.label}
                            active={roomsPreset === item.id}
                            onClick={() => handleRoomsPresetChange(item.id)}
                          />
                        ))}
                      </div>
                      {stepErrors.rooms ? (
                        <p className="mt-2 text-sm text-red-600">{stepErrors.rooms}</p>
                      ) : null}
                    </>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-4">
                    <Input
                      label={isLandLikeType(selectedPropertyOption) ? 'Площадь участка' : 'Общая площадь'}
                      name={isLandLikeType(selectedPropertyOption) ? 'land_size' : 'total_area'}
                      value={isLandLikeType(selectedPropertyOption) ? formData.form.land_size : formData.form.total_area}
                      onChange={handleFieldChange}
                      error={stepErrors.area}
                    />
                    {!isLandLikeType(selectedPropertyOption) ? (
                      <Input
                        label="Жилая площадь"
                        name="living_area"
                        value={formData.form.living_area}
                        onChange={handleFieldChange}
                      />
                    ) : null}
                    {!isLandLikeType(selectedPropertyOption) ? (
                      <Input
                        label="Этаж"
                        name="floor"
                        value={formData.form.floor}
                        onChange={handleFieldChange}
                      />
                    ) : null}
                    {!isLandLikeType(selectedPropertyOption) ? (
                      <Input
                        label="Этажей в доме"
                        name="total_floors"
                        value={formData.form.total_floors}
                        onChange={handleFieldChange}
                      />
                    ) : null}
                  </div>
                  <div className="mt-5">
                    <div id="repair-type-label" className="mb-3 text-sm font-medium text-[#111827]">
                      Тип ремонта <span className="text-red-500">*</span>
                    </div>
                    {formData.isRepairTypesLoading ? (
                      <div className="inline-flex min-h-10 items-center gap-2 text-sm text-[#64748B]">
                        <LoaderCircle aria-hidden="true" size={17} className="animate-spin text-[#16845F]" />
                        Загрузка типов ремонта…
                      </div>
                    ) : !formData.isRepairTypesError && formData.repairTypes.length > 0 ? (
                      <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-labelledby="repair-type-label"
                      >
                        {formData.repairTypes.map((option) => (
                          <StepChip
                            key={option.id}
                            label={option.name}
                            icon={getRepairTypeIcon(option)}
                            active={String(formData.form.repair_type_id) === String(option.id)}
                            onClick={() => {
                              setFieldValueRef.current('repair_type_id', String(option.id));
                              clearStepError('repair_type_id');
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                    {repairTypeFieldError ? (
                      <p className="mt-2 text-sm text-red-600">{repairTypeFieldError}</p>
                    ) : null}
                    {formData.isRepairTypesError || (
                      !formData.isRepairTypesLoading && formData.repairTypes.length === 0
                    ) ? (
                      <button
                        type="button"
                        onClick={() => void formData.retryRepairTypes()}
                        className="mt-2 text-sm font-medium text-[#006341] hover:underline"
                      >
                        Повторить загрузку
                      </button>
                    ) : null}
                  </div>
                  {isApartmentLikeType(selectedPropertyOption) ? (
                    <div className="mt-5 max-w-xl">
                      <Select
                        label="Тип документа"
                        name="document_type"
                        value={formData.form.document_type}
                        onChange={handleFieldChange}
                        options={[...PROPERTY_DOCUMENT_TYPES]}
                        placeholder="Выберите тип документа"
                      />
                      <p className="mt-2 text-xs leading-5 text-[#718096]">
                        Укажите документ, подтверждающий право на квартиру.
                      </p>
                    </div>
                  ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="space-y-5">
                <h2 className="text-[30px] font-extrabold text-[#111827]">Фото</h2>
                <div className="rounded-[22px] border border-dashed border-[#C9D6E5] p-4 md:p-6">
                  <PhotoUpload
                    photos={formData.form.photos}
                    onPhotoChange={formData.handleFileChange}
                    onPhotoRemove={formData.removePhoto}
                    onReorder={formData.handleReorder}
                    label=""
                    className="[&>label]:hidden"
                  />
                </div>
              </div>
            ) : null}

            {currentStep === 5 ? (
              <div className="space-y-5">
                <h2 className="text-[30px] font-extrabold text-[#111827]">
                  {listingCategory === 'transport' ? 'Описание транспорта' : 'Описание квартиры'}
                </h2>

                <div>
                  <Input
                    label="Заголовок объявления"
                    name="title"
                    value={formData.form.title}
                    onChange={handleFieldChange}
                    maxLength={100}
                    placeholder="Заголовок"
                    error={stepErrors.title}
                  />
                  <p className="mt-2 text-right text-sm text-[#94A3B8]">{titleCounter}</p>
                </div>

                <div>
                  <Input
                    label="Описание"
                    name="description"
                    value={formData.form.description}
                    onChange={handleFieldChange}
                    maxLength={3000}
                    placeholder="Описание..."
                    textarea
                    rows={8}
                    error={stepErrors.description}
                    inputClassName="min-h-[220px]"
                  />
                  <p className="mt-2 text-right text-sm text-[#94A3B8]">{descriptionCounter}</p>
                </div>
              </div>
            ) : null}

            {currentStep === 6 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-4 text-[30px] font-extrabold text-[#111827]">Цена</h2>
                  <div className="grid gap-4 md:max-w-[420px]">
                    <Input
                      label="Цена"
                      name="price"
                      value={formData.form.price}
                      onChange={handleFieldChange}
                      error={stepErrors.price}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <WizardActions
              currentStep={currentStep}
              totalSteps={STEP_TITLES.length}
              isSubmitting={formData.isSubmitting}
              mode={mode}
              onBack={handleBack}
              onNext={handleNext}
            />
          </div>
        </form>

        <DuplicateDialog
          open={formData.dupDialogOpen}
          onClose={() => formData.setDupDialogOpen(false)}
          items={formData.duplicates}
          onForce={formData.forceCreate}
        />
      </div>
    </div>
  );
}
