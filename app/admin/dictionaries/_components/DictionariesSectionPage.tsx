'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Select } from '@/ui-components/Select';
import {
  useCreateDictionaryEntry,
  useDeleteDictionaryEntry,
  useDictionaryEntries,
  useUpdateDictionaryEntry,
} from '@/services/dictionaries/hooks';
import type { DictionaryPayload, DictionaryRecord, DictionaryResource } from '@/services/dictionaries/types';
import { filterOptionsExcludingId } from '@/services/dictionaries/utils';
import { Pencil, Plus, SquareStack } from 'lucide-react';
import DictionaryManager from './DictionaryManager';

type DictFormError = Record<string, string>;

export type DictionarySection =
  | 'Недвижимость'
  | 'География'
  | 'Транспорт'
  | 'Организация'
  | 'Новостройки';

function required(values: DictFormError, field: string, label: string) {
  if (!values[field]?.trim()) {
    return `${label} обязателен`;
  }
  return '';
}

function floatFromString(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function DictionariesSectionPage({ section }: { section: DictionarySection }) {
  const isRealEstate = section === 'Недвижимость';
  const isGeography = section === 'География';
  const isTransport = section === 'Транспорт';

  const propertyTypes = useDictionaryEntries('property-types', undefined, isRealEstate);
  const propertyStatuses = useDictionaryEntries('property-statuses', undefined, isRealEstate);
  const buildingTypes = useDictionaryEntries('building-types', undefined, isRealEstate);
  const parkingTypes = useDictionaryEntries('parking-types', undefined, isRealEstate);
  const heatingTypes = useDictionaryEntries('heating-types', undefined, isRealEstate);
  const repairTypes = useDictionaryEntries('repair-types', undefined, isRealEstate);
  const contractTypes = useDictionaryEntries('contract-types', undefined, isRealEstate);
  const locations = useDictionaryEntries('locations', undefined, isGeography);
  const [districtCityFilter, setDistrictCityFilter] = useState('');
  const districts = useDictionaryEntries('districts', {
    city_ids: districtCityFilter ? [Number(districtCityFilter)] : undefined,
  }, isGeography);

  const carCategories = useDictionaryEntries('car-categories', undefined, isTransport);
  const carBrands = useDictionaryEntries('car-brands', undefined, isTransport);
  const [carModelsBrandFilter, setCarModelsBrandFilter] = useState('');
  const carModels = useDictionaryEntries('car-models', {
    brand_id: carModelsBrandFilter || undefined,
  }, isTransport);

  const createMutation = useCreateDictionaryEntry();
  const updateMutation = useUpdateDictionaryEntry();
  const deleteMutation = useDeleteDictionaryEntry();

  const create = async (resource: DictionaryResource, payload: DictionaryPayload) => {
    await createMutation.mutateAsync({ resource, payload });
  };

  const update = async (resource: DictionaryResource, id: number, payload: DictionaryPayload) => {
    await updateMutation.mutateAsync({ resource, id, payload });
  };

  const remove = async (resource: DictionaryResource, id: number) => {
    await deleteMutation.mutateAsync({ resource, id });
  };

  const locationOptions = useMemo(
    () =>
      locations.data?.map((location) => ({
        value: String(location.id),
        label: location.city ?? `#${location.id}`,
      })) ?? [],
    [locations.data]
  );

  const cityById = useMemo(() => {
    const map = new Map<number, string>();
    (locations.data ?? []).forEach((location) => {
      map.set(location.id, location.city ?? `#${location.id}`);
    });
    return map;
  }, [locations.data]);

  const carCategoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    (carCategories.data ?? []).forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [carCategories.data]);

  const carBrandNameById = useMemo(() => {
    const map = new Map<number, string>();
    (carBrands.data ?? []).forEach((brand) => {
      map.set(brand.id, brand.name);
    });
    return map;
  }, [carBrands.data]);

  const getCarCategoryParentOptions = useMemo(() => {
    return (category: DictionaryRecord | null) =>
      filterOptionsExcludingId(carCategories.data ?? [], category?.id).map((item) => ({
        value: String(item.id),
        label: item.name,
      }));
  }, [carCategories.data]);

  const carModelBrandOptions = useMemo(
    () =>
      (carBrands.data ?? []).map((brand) => ({
        value: String(brand.id),
        label: brand.name,
      })),
    [carBrands.data]
  );

  return (
    <div className="space-y-6">
      {section === 'Недвижимость' && (
        <div className="space-y-6">
          <DictionaryManager<DictionaryRecord>
            title="Типы недвижимости"
            resource="property-types"
            items={propertyTypes.data ?? []}
            isLoading={propertyTypes.isLoading}
            error={propertyTypes.error}
            columns={[
              { label: 'Название', render: (item) => item.name },
              { label: 'Slug', render: (item) => item.slug || '—' },
            ]}
            searchText={(item) => `${item.name} ${item.slug ?? ''}`}
            initialValues={{ name: '', slug: '' }}
            toFormValues={(item) => ({
              name: item.name,
              slug: item.slug ?? '',
            })}
            fields={() => [
              { name: 'name', label: 'Название', type: 'text', required: true },
              { name: 'slug', label: 'Slug', type: 'text', required: true },
            ]}
            toPayload={(values) => ({
              name: values.name.trim(),
              slug: values.slug.trim(),
            })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              const slugError = required(values, 'slug', 'Slug');
              if (nameError) errors.name = nameError;
              if (slugError) errors.slug = slugError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Статусы недвижимости"
            resource="property-statuses"
            items={propertyStatuses.data ?? []}
            isLoading={propertyStatuses.isLoading}
            error={propertyStatuses.error}
            columns={[
              { label: 'Название', render: (item) => item.name },
              { label: 'Slug', render: (item) => item.slug || '—' },
            ]}
            searchText={(item) => `${item.name} ${item.slug ?? ''}`}
            initialValues={{ name: '', slug: '' }}
            toFormValues={(item) => ({
              name: item.name,
              slug: item.slug ?? '',
            })}
            fields={() => [
              { name: 'name', label: 'Название', type: 'text', required: true },
              { name: 'slug', label: 'Slug', type: 'text', required: true },
            ]}
            toPayload={(values) => ({
              name: values.name.trim(),
              slug: values.slug.trim(),
            })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              const slugError = required(values, 'slug', 'Slug');
              if (nameError) errors.name = nameError;
              if (slugError) errors.slug = slugError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Типы строений"
            resource="building-types"
            items={buildingTypes.data ?? []}
            isLoading={buildingTypes.isLoading}
            error={buildingTypes.error}
            columns={[{ label: 'Название', render: (item) => item.name }]}
            searchText={(item) => item.name}
            initialValues={{ name: '' }}
            toFormValues={(item) => ({ name: item.name })}
            fields={() => [{ name: 'name', label: 'Название', type: 'text', required: true }]}
            toPayload={(values) => ({ name: values.name.trim() })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              if (nameError) errors.name = nameError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Типы парковок"
            resource="parking-types"
            items={parkingTypes.data ?? []}
            isLoading={parkingTypes.isLoading}
            error={parkingTypes.error}
            columns={[{ label: 'Название', render: (item) => item.name }]}
            searchText={(item) => item.name}
            initialValues={{ name: '' }}
            toFormValues={(item) => ({ name: item.name })}
            fields={() => [{ name: 'name', label: 'Название', type: 'text', required: true }]}
            toPayload={(values) => ({ name: values.name.trim() })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              if (nameError) errors.name = nameError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Типы отопления"
            resource="heating-types"
            items={heatingTypes.data ?? []}
            isLoading={heatingTypes.isLoading}
            error={heatingTypes.error}
            columns={[{ label: 'Название', render: (item) => item.name }]}
            searchText={(item) => item.name}
            initialValues={{ name: '' }}
            toFormValues={(item) => ({ name: item.name })}
            fields={() => [{ name: 'name', label: 'Название', type: 'text', required: true }]}
            toPayload={(values) => ({ name: values.name.trim() })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              if (nameError) errors.name = nameError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Состояние ремонта"
            resource="repair-types"
            items={repairTypes.data ?? []}
            isLoading={repairTypes.isLoading}
            error={repairTypes.error}
            columns={[{ label: 'Название', render: (item) => item.name }]}
            searchText={(item) => item.name}
            initialValues={{ name: '' }}
            toFormValues={(item) => ({ name: item.name })}
            fields={() => [{ name: 'name', label: 'Название', type: 'text', required: true }]}
            toPayload={(values) => ({ name: values.name.trim() })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              if (nameError) errors.name = nameError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Виды договоров"
            resource="contract-types"
            items={contractTypes.data ?? []}
            isLoading={contractTypes.isLoading}
            error={contractTypes.error}
            columns={[
              { label: 'Название', render: (item) => item.name },
              { label: 'Slug', render: (item) => item.slug || '—' },
            ]}
            searchText={(item) => `${item.name} ${item.slug ?? ''}`}
            initialValues={{ name: '', slug: '' }}
            toFormValues={(item) => ({
              name: item.name,
              slug: item.slug ?? '',
            })}
            fields={() => [
              { name: 'name', label: 'Название', type: 'text', required: true },
              { name: 'slug', label: 'Slug', type: 'text', required: true },
            ]}
            toPayload={(values) => ({
              name: values.name.trim(),
              slug: values.slug.trim(),
            })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              const slugError = required(values, 'slug', 'Slug');
              if (nameError) errors.name = nameError;
              if (slugError) errors.slug = slugError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />
        </div>
      )}

      {section === 'География' && (
        <div className="space-y-6">
          <DictionaryManager<DictionaryRecord>
            title="Города"
            resource="locations"
            items={locations.data ?? []}
            isLoading={locations.isLoading}
            error={locations.error}
            columns={[
              { label: 'Город', render: (item) => item.city || item.name || '—' },
              {
                label: 'Широта',
                render: (item) => (item.latitude == null ? '—' : item.latitude),
              },
              {
                label: 'Долгота',
                render: (item) => (item.longitude == null ? '—' : item.longitude),
              },
            ]}
            searchText={(item) => `${item.city ?? item.name ?? ''} ${item.latitude ?? ''} ${item.longitude ?? ''}`}
            initialValues={{ city: '', latitude: '', longitude: '' }}
            toFormValues={(item) => ({
              city: item.city ?? '',
              latitude: item.latitude == null ? '' : String(item.latitude),
              longitude: item.longitude == null ? '' : String(item.longitude),
            })}
            fields={() => [
              { name: 'city', label: 'Название', type: 'text', required: true },
              { name: 'latitude', label: 'Широта', type: 'text' },
              { name: 'longitude', label: 'Долгота', type: 'text' },
            ]}
            toPayload={(values) => {
              const latitude = floatFromString(values.latitude);
              const longitude = floatFromString(values.longitude);

              return {
                city: values.city.trim(),
                latitude: latitude === null ? null : latitude,
                longitude: longitude === null ? null : longitude,
              };
            }}
            validate={(values) => {
              const errors: DictFormError = {};
              const cityError = required(values, 'city', 'Город');
              if (cityError) errors.city = cityError;

              const latitude = floatFromString(values.latitude);
              if (values.latitude?.trim() && latitude === null) {
                errors.latitude = 'Широта должна быть числом';
              } else if (latitude !== null && (latitude < -90 || latitude > 90)) {
                errors.latitude = 'Широта должна быть от -90 до 90';
              }

              const longitude = floatFromString(values.longitude);
              if (values.longitude?.trim() && longitude === null) {
                errors.longitude = 'Долгота должна быть числом';
              } else if (longitude !== null && (longitude < -180 || longitude > 180)) {
                errors.longitude = 'Долгота должна быть от -180 до 180';
              }

              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Районы"
            resource="districts"
            items={districts.data ?? []}
            isLoading={districts.isLoading}
            error={districts.error}
            columns={[
              { label: 'Район', render: (item) => item.name },
              {
                label: 'Город',
                render: (item) => cityById.get(item.city_id ?? 0) ?? '—',
              },
            ]}
            searchText={(item) => `${item.name} ${cityById.get(item.city_id ?? 0) ?? ''}`}
            toolbar={
              <div className="w-full sm:w-auto">
                <Select
                  name="districts-city-filter"
                  label="Фильтр по городу"
                  value={districtCityFilter}
                  onChange={(event) => setDistrictCityFilter(event.target.value)}
                  options={[{ value: '', label: 'Все города' }, ...locationOptions]}
                  labelField="label"
                  valueField="value"
                  className="min-w-[260px]"
                />
              </div>
            }
            initialValues={{ name: '', city_id: '' }}
            toFormValues={(item) => ({
              name: item.name,
              city_id: item.city_id == null ? '' : String(item.city_id),
            })}
            fields={({ item }) => [
              { name: 'name', label: 'Название', type: 'text', required: true },
              {
                name: 'city_id',
                label: 'Город',
                type: 'select',
                required: true,
                options: locationOptions,
              },
            ]}
            toPayload={(values) => {
              const cityId = Number(values.city_id);
              return {
                name: values.name.trim(),
                city_id: Number.isNaN(cityId) ? null : cityId,
              };
            }}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              if (nameError) errors.name = nameError;

              if (!values.city_id?.trim()) {
                errors.city_id = 'Город обязателен';
              } else if (Number.isNaN(Number(values.city_id))) {
                errors.city_id = 'Неверный город';
              }

              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />
        </div>
      )}

      {section === 'Транспорт' && (
        <div className="space-y-6">
          <DictionaryManager<DictionaryRecord>
            title="Категории транспорта"
            resource="car-categories"
            items={carCategories.data ?? []}
            isLoading={carCategories.isLoading}
            error={carCategories.error}
            columns={[
              { label: 'Название', render: (item) => item.name },
              { label: 'Slug', render: (item) => item.slug || '—' },
              {
                label: 'Родитель',
                render: (item) => carCategoryNameById.get(item.parent_id ?? 0) || '—',
              },
            ]}
            searchText={(item) =>
              `${item.name} ${item.slug ?? ''} ${carCategoryNameById.get(item.parent_id ?? 0) || ''}`
            }
            initialValues={{ name: '', slug: '', parent_id: '' }}
            toFormValues={(item) => ({
              name: item.name,
              slug: item.slug ?? '',
              parent_id: item.parent_id == null ? '' : String(item.parent_id),
            })}
            fields={({ item }) => [
              { name: 'name', label: 'Название', type: 'text', required: true },
              { name: 'slug', label: 'Slug', type: 'text', required: true },
              {
                name: 'parent_id',
                label: 'Родитель',
                type: 'select',
                options: getCarCategoryParentOptions(item),
              },
            ]}
            toPayload={(values) => {
              const parentId = Number(values.parent_id);
              return {
                name: values.name.trim(),
                slug: values.slug.trim(),
                parent_id: Number.isNaN(parentId) ? null : parentId,
              };
            }}
            validate={(values, _mode, item) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              const slugError = required(values, 'slug', 'Slug');
              if (nameError) errors.name = nameError;
              if (slugError) errors.slug = slugError;

              if (values.parent_id?.trim() && item?.id && Number(values.parent_id) === item.id) {
                errors.parent_id = 'Категория не может быть родителем самой себе';
              }

              if (values.parent_id?.trim() && Number.isNaN(Number(values.parent_id))) {
                errors.parent_id = 'Неверный родитель';
              }

              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Марки авто"
            resource="car-brands"
            items={carBrands.data ?? []}
            isLoading={carBrands.isLoading}
            error={carBrands.error}
            columns={[
              { label: 'Название', render: (item) => item.name },
              { label: 'Slug', render: (item) => item.slug || '—' },
            ]}
            searchText={(item) => `${item.name} ${item.slug ?? ''}`}
            initialValues={{ name: '', slug: '' }}
            toFormValues={(item) => ({
              name: item.name,
              slug: item.slug ?? '',
            })}
            fields={() => [
              { name: 'name', label: 'Название', type: 'text', required: true },
              { name: 'slug', label: 'Slug', type: 'text', required: true },
            ]}
            toPayload={(values) => ({
              name: values.name.trim(),
              slug: values.slug.trim(),
            })}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Название');
              const slugError = required(values, 'slug', 'Slug');
              if (nameError) errors.name = nameError;
              if (slugError) errors.slug = slugError;
              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />

          <DictionaryManager<DictionaryRecord>
            title="Модели авто"
            resource="car-models"
            items={carModels.data ?? []}
            isLoading={carModels.isLoading}
            error={carModels.error}
            columns={[
              { label: 'Модель', render: (item) => item.name },
              { label: 'Slug', render: (item) => item.slug || '—' },
              {
                label: 'Марка',
                render: (item) => carBrandNameById.get(item.brand_id ?? 0) || '—',
              },
            ]}
            searchText={(item) =>
              `${item.name} ${item.slug ?? ''} ${carBrandNameById.get(item.brand_id ?? 0) || ''}`
            }
            toolbar={
              <div className="w-full sm:w-auto">
                <Select
                  name="car-models-filter"
                  label="Фильтр по марке"
                  value={carModelsBrandFilter}
                  onChange={(event) => setCarModelsBrandFilter(event.target.value)}
                  options={[{ value: '', label: 'Все' }, ...carModelBrandOptions]}
                  labelField="label"
                  valueField="value"
                  required={false}
                  className="min-w-[260px]"
                />
              </div>
            }
            initialValues={{ name: '', slug: '', brand_id: '' }}
            toFormValues={(item) => ({
              name: item.name,
              slug: item.slug ?? '',
              brand_id: item.brand_id == null ? '' : String(item.brand_id),
            })}
            fields={() => [
              {
                name: 'brand_id',
                label: 'Марка',
                type: 'select',
                required: true,
                options: carModelBrandOptions,
              },
              { name: 'name', label: 'Модель', type: 'text', required: true },
              { name: 'slug', label: 'Slug', type: 'text', required: true },
            ]}
            toPayload={(values) => {
              const brandId = Number(values.brand_id);
              return {
                name: values.name.trim(),
                slug: values.slug.trim(),
                brand_id: Number.isNaN(brandId) ? null : brandId,
              };
            }}
            validate={(values) => {
              const errors: DictFormError = {};
              const nameError = required(values, 'name', 'Модель');
              const slugError = required(values, 'slug', 'Slug');
              if (nameError) errors.name = nameError;
              if (slugError) errors.slug = slugError;

              const brandId = Number(values.brand_id);
              if (!values.brand_id?.trim()) {
                errors.brand_id = 'Марка обязательна';
              } else if (Number.isNaN(brandId)) {
                errors.brand_id = 'Неверная марка';
              }

              return errors;
            }}
            deleting={deleteMutation.isPending}
            createPending={createMutation.isPending}
            updatePending={updateMutation.isPending}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />
        </div>
      )}

      {section === 'Организация' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HubCard
            href="/admin/branches"
            title="Филиалы"
            description="Управление филиалами"
            icon={<SquareStack className="w-5 h-5" />}
          />
          <HubCard
            href="/admin/new-buildings/developers"
            title="Застройщики"
            description="Управление застройщиками"
            icon={<SquareStack className="w-5 h-5" />}
          />
          <HubCard
            href="/admin/new-buildings/stages"
            title="Этапы строительства"
            description="Управление этапами строительства"
            icon={<Pencil className="w-5 h-5" />}
          />
          <HubCard
            href="/admin/new-buildings/materials"
            title="Материалы"
            description="Управление материалами"
            icon={<Pencil className="w-5 h-5" />}
          />
          <HubCard
            href="/admin/new-buildings/features"
            title="Особенности"
            description="Управление особенностями"
            icon={<Pencil className="w-5 h-5" />}
          />
        </div>
      )}

      {section === 'Новостройки' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HubCard
            href="/admin/new-buildings"
            title="Новостройки"
            description="Перейти к карточкам новостроек"
            icon={<Plus className="w-5 h-5" />}
          />
        </div>
      )}
    </div>
  );
}

function HubCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#D0D5DD] bg-white p-5 hover:border-[#006341] hover:shadow-sm transition"
    >
      <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-[#EFFAF5] p-2 text-[#006341] group-hover:bg-[#d6f0e3]">
        {icon}
      </div>
      <div className="text-base font-semibold text-[#101828]">{title}</div>
      <div className="mt-1 text-sm text-[#475467]">{description}</div>
    </Link>
  );
}
