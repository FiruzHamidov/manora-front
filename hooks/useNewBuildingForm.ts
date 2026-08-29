import { ChangeEvent, FormEvent, useState } from "react";
import { toast } from "react-toastify";
import {
  useCreateNewBuilding,
  useLocations,
} from "@/services/new-buildings/hooks";
import type {
  NewBuildingPayload,
} from "@/services/new-buildings/types";
import { useAuth } from "@/hooks/useAuth";

type ApiError = {
  response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  message?: string;
};

export function useNewBuildingForm() {
  const [isSubmitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { role } = useAuth();
  const canModerate = role === "admin" || role === "superadmin";

  const [form, setForm] = useState<NewBuildingPayload>({
    title: "",
    description: "",
    developer_id: null,
    construction_stage_id: null,
    material_id: null,
    location_id: null,

    installment_available: false,
    heating: false,
    has_terrace: false,

    floors_range: "",
    completion_at: "",

    address: "",
    latitude: undefined,
    longitude: undefined,

    moderation_status: "draft",
    completion_precision: "unknown",
    features: [],
  });

  const { data: locations } = useLocations();

  const createMutation = useCreateNewBuilding();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const normalizedValue =
      name === 'location_id' ||
      name === 'developer_id' ||
      name === 'construction_stage_id' ||
      name === 'material_id' ||
      name === 'completion_year' ||
      name === 'completion_quarter'
        ? value === ''
          ? null
          : Number(value)
        : value;

    setForm(
      (prev) =>
        ({
          ...prev,
          [name]: type === "checkbox" ? checked : normalizedValue,
        } as NewBuildingPayload)
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setFieldErrors({});
    try {
      const toNumOrNull = (v: unknown): number | null => {
        if (v === "" || v === null || v === undefined) return null;
        return typeof v === "number" ? v : Number(v);
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
        // features contain explicit dictionary IDs from the picker
      };

      const result = await createMutation.mutateAsync(payload);
      toast.success("Новостройка создана");

      // Return the created building ID for redirect
      return result;
    } catch (err: unknown) {
      const e = err as ApiError;
      const apiErrors = e?.response?.data?.errors ?? {};
      setFieldErrors(
        Object.fromEntries(
          Object.entries(apiErrors).map(([field, messages]) => [field, messages[0] ?? "Некорректное значение"])
        )
      );
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Не удалось создать новостройку";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    handleChange,
    isSubmitting,
    handleSubmit,
    locations,
    fieldErrors,
    canModerate,
  };
}
