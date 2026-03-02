import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  useCreateNewBuilding,
  useDevelopers,
  useConstructionStages,
  useMaterials,
  useFeatures,
  useLocations,
} from "@/services/new-buildings/hooks";
import type {
  Feature,
  NewBuildingPayload,
} from "@/services/new-buildings/types";
import { rows } from "@/utils/paginated";

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

export function useNewBuildingForm() {
  const [isSubmitting, setSubmitting] = useState(false);

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

    moderation_status: "pending",
    features: [],
  });

  const { data: developersPg } = useDevelopers();
  const { data: stagesPg } = useConstructionStages();
  const { data: materialsPg } = useMaterials();
  const { data: featuresPg } = useFeatures();
  const { data: locationsPg } = useLocations();

  // @ts-expect-error ignore
  const developers = rows(developersPg);
  const stages = rows(stagesPg);
  const materials = rows(materialsPg);
  const features = rows(featuresPg);
  const locations = locationsPg;

  const createMutation = useCreateNewBuilding();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(
      (prev) =>
        ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        } as NewBuildingPayload)
    );
  };

  const toggleFeature = (f: Feature) => {
    setForm((prev) => {
      // Всегда работаем только с number[]
      const current = Array.isArray(prev.features)
        ? prev.features.map((x) => Number(x))
        : [];
      const ids = new Set<number>(current);
      const idNum = Number(f.id);

      // eslint-disable-next-line
      ids.has(idNum) ? ids.delete(idNum) : ids.add(idNum);

      return { ...prev, features: Array.from(ids) } as NewBuildingPayload;
    });
  };

  const validate = useMemo(() => Boolean(form.title), [form.title]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate) return;

    setSubmitting(true);
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
        // features уже number[] благодаря toggleFeature
      };

      const result = await createMutation.mutateAsync(payload);
      toast.success("Новостройка создана");

      // Return the created building ID for redirect
      return result;
    } catch (err: unknown) {
      const e = err as ApiError;
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
    toggleFeature,
    isSubmitting,
    handleSubmit,
    developers,
    stages,
    materials,
    features,
    locations,
  };
}
