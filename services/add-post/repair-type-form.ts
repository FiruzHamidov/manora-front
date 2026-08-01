export const REPAIR_TYPE_REQUIRED_MESSAGE = 'Выберите тип ремонта.';

export const normalizeRepairTypeId = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const getRepairTypeValidationError = (value: unknown): string | undefined =>
  normalizeRepairTypeId(value) ? undefined : REPAIR_TYPE_REQUIRED_MESSAGE;

export const withRequiredRepairType = <T extends Record<string, unknown>>(
  payload: T,
  repairTypeId: unknown
): T & { repair_type_id: string } => {
  const normalizedId = normalizeRepairTypeId(repairTypeId);

  if (!normalizedId) {
    throw new Error(REPAIR_TYPE_REQUIRED_MESSAGE);
  }

  return {
    ...payload,
    repair_type_id: normalizedId,
  };
};
