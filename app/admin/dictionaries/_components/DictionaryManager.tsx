'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { DictionaryResource } from '@/services/dictionaries/types';
import { generateSlug, parseDictionaryError } from '@/services/dictionaries/utils';
import DictionaryForm, {
  DictionaryFormErrors,
  DictionaryFormField,
} from './DictionaryForm';
import DictionaryTable, { DictionaryTableColumn } from './DictionaryTable';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

type DictionaryValues = Record<string, string>;
type DictionaryPayload = Record<string, string | number | null>;
type DictionaryManagerMode = 'create' | 'edit';
type DictItem = { id: number };

type DictionaryManagerProps<T extends DictItem> = {
  title: string;
  resource: DictionaryResource;
  items: T[];
  isLoading: boolean;
  error: unknown;
  columns: DictionaryTableColumn<T>[];
  searchText: (item: T) => string;
  toolbar?: ReactNode;
  fields:
    | DictionaryFormField[]
    | ((args: { item: T | null; values: DictionaryValues }) => DictionaryFormField[]);
  initialValues: DictionaryValues;
  toFormValues: (item: T) => DictionaryValues;
  toPayload: (values: DictionaryValues, mode: DictionaryManagerMode, item?: T) => DictionaryPayload;
  validate: (values: DictionaryValues, mode: DictionaryManagerMode, item?: T) => DictionaryFormErrors;
  deleting: boolean;
  createPending: boolean;
  updatePending: boolean;
  onCreate: (resource: DictionaryResource, payload: DictionaryPayload) => Promise<unknown>;
  onUpdate: (resource: DictionaryResource, id: number, payload: DictionaryPayload) => Promise<unknown>;
  onDelete: (resource: DictionaryResource, id: number) => Promise<unknown>;
};

export default function DictionaryManager<T extends DictItem>({
  title,
  resource,
  items,
  isLoading,
  error,
  columns,
  searchText,
  toolbar,
  fields,
  initialValues,
  toFormValues,
  toPayload,
  validate,
  deleting,
  createPending,
  updatePending,
  onCreate,
  onUpdate,
  onDelete,
}: DictionaryManagerProps<T>) {
  const [mode, setMode] = useState<DictionaryManagerMode | null>(null);
  const [selected, setSelected] = useState<T | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [values, setValues] = useState<DictionaryValues>(initialValues);
  const [errors, setErrors] = useState<DictionaryFormErrors>({});
  const [slugTouched, setSlugTouched] = useState(false);

  const formFields = useMemo(() => {
    if (typeof fields === 'function') {
      return fields({ item: selected, values });
    }

    return fields;
  }, [fields, selected, values]);

  const hasSlugField = formFields.some((field) => field.name === 'slug');
  const isSubmitting = createPending || updatePending;
  const isBusy = isSubmitting || deleting;

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return items;

    return items.filter((item) => searchText(item).toLowerCase().includes(term));
  }, [items, searchTerm, searchText]);

  const openCreate = () => {
    setMode('create');
    setSelected(null);
    setValues(initialValues);
    setErrors({});
    setSlugTouched(false);
  };

  const openEdit = (item: T) => {
    setMode('edit');
    setSelected(item);
    setValues(toFormValues(item));
    setErrors({});
    setSlugTouched(Boolean((item as DictItem & { slug?: unknown }).slug));
  };

  const closeModal = () => {
    setMode(null);
    setSelected(null);
    setValues(initialValues);
    setErrors({});
    setSlugTouched(false);
  };

  const handleChange = (name: string, value: string) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === 'name' && hasSlugField && !slugTouched) {
        next.slug = generateSlug(value);
      }
      if (name === 'slug') setSlugTouched(true);
      return next;
    });
  };

  const applyFieldErrors = (fieldErrors: Record<string, string[]>) => {
    const nextErrors: DictionaryFormErrors = {};

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      nextErrors[field] = messages.join(' ');
    });

    setErrors(nextErrors);
  };

  const handleSubmit = async () => {
    if (!mode) return;

    const validationErrors = validate(values, mode, selected ?? undefined);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload = toPayload(values, mode, selected ?? undefined);
      if (mode === 'create') {
        await onCreate(resource, payload);
        toast.success(`Новая запись добавлена: ${title}`);
      } else if (selected) {
        await onUpdate(resource, selected.id, payload);
        toast.success(`Запись обновлена: ${title}`);
      }
      closeModal();
    } catch (error) {
      const { status, message, fieldErrors } = parseDictionaryError(error);
      if (status === 422 && Object.keys(fieldErrors).length > 0) {
        applyFieldErrors(fieldErrors);
        if (message) {
          toast.error(message);
        }
        return;
      }

      showAxiosErrorToast(error, `Ошибка сохранения: ${title}`);
    }
  };

  const handleDelete = async (item: T) => {
    const label = String((item as DictItem & { name?: unknown }).name ?? item.id);
    if (!confirm(`Удалить запись «${label}»? Это действие нельзя отменить.`)) return;

    try {
      await onDelete(resource, item.id);
      toast.success('Запись удалена');
    } catch (error) {
      showAxiosErrorToast(error, `Ошибка удаления: ${title}`);
    }
  };

  return (
    <section className="rounded-2xl border border-[#D0D5DD] bg-white p-4 md:p-5 space-y-4">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#101828]">{title}</h3>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#006341] text-white hover:bg-[#004D33]"
            disabled={isBusy}
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Поиск"
            className="w-full sm:max-w-[320px] px-4 py-2 rounded-md border border-[#D0D5DD]"
          />
          {toolbar}
        </div>
      </header>

      {isLoading && <div className="text-[#475467]">Загрузка…</div>}
      {!isLoading && Boolean(error) && <div className="text-red-500">Ошибка загрузки</div>}

      {!isLoading && !error && filteredItems.length === 0 && (
        <div className="text-[#475467]">Ничего не найдено</div>
      )}

      {!isLoading && !error && filteredItems.length > 0 && (
        <DictionaryTable
          items={filteredItems}
          columns={columns}
          onEdit={openEdit}
          onDelete={handleDelete}
          deleting={isBusy}
        />
      )}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-black/35"
            aria-label="Закрыть"
          />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <h4 className="text-lg font-semibold mb-4">
              {mode === 'create' ? 'Новая запись' : 'Редактирование'}
            </h4>

            <DictionaryForm
              fields={formFields}
              values={values}
              errors={errors}
              disabled={isSubmitting}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </section>
  );
}
