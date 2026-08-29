import type { MetadataRoute } from 'next';
import { RESIDENTIAL_SITE } from '@/services/new-buildings/sharing';
import { RESIDENTIAL_V2_ENABLED } from '@/services/new-buildings/rollout';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/profile', '/dashboard'] }, sitemap: RESIDENTIAL_V2_ENABLED ? RESIDENTIAL_SITE + '/sitemap.xml' : undefined };
}
