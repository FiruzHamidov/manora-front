export const PRIMARY_CONTACT_PHONE = '';
export const SECONDARY_CONTACT_PHONE = '';

export const CONTACT_PHONES = [PRIMARY_CONTACT_PHONE, SECONDARY_CONTACT_PHONE].filter(
  (phone): phone is string => Boolean(phone && phone.trim())
);

export const CONTACT_EMAIL = 'info@manora.tj';

export const CONTACT_WHATSAPP_URL = '';
export const COMPANY_INSTAGRAM_URL = 'https://www.instagram.com/manora.tj_/';

export const toTelHref = (phone: string) => `tel:${phone.replace(/\s+/g, '')}`;
