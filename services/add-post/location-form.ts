export const ADDRESS_REQUIRED_MESSAGE = 'Введите адрес.';

export const getAddressValidationError = (address: unknown): string | undefined =>
  String(address ?? '').trim() ? undefined : ADDRESS_REQUIRED_MESSAGE;
