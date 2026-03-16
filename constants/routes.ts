export const PUBLIC_API_ROUTES = [
  "/login",
  "/sms/request",
  "/sms/verify",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/properties",
  "/cars",
  "/new-buildings",
  "/developers",
  "/locations",
  "/property-types",
  "/building-types",
  "/repair-types",
  "/heating-types",
  "/parking-types",
  "/contract-types",
  "/car-categories",
  "/car-brands",
  "/car-models",
  "/construction-stages",
  "/materials",
  "/features",
  "/lead-requests",
];

export const AUTH_REQUIRED_ROUTES = [
  "/favorites",
  "/profile",
  "/profile/messages",
  "/profile/favorites",
  "/profile/wallet",
  "/profile/my-listings",
  "/profile/add-post",
  "/dashboard",
  "/admin",
  "/admin/users",
  "/admin/branches",
  "/admin/crm",
];

export const AGENT_ONLY_ROUTES = [
  "/dashboard",
  "/dashboard/listings",
  "/dashboard/analytics",
];

export const ADMIN_ONLY_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/branches",
  "/admin/crm",
  "/admin/listings",
  "/admin/reports",
];
