import { FC } from 'react';
import Link from 'next/link';
import { Developer } from '@/services/new-buildings/types';
import { resolveMediaUrl } from '@/constants/base-url';
import InstagramIcon from '@/icons/InstagramIcon';
import WhatsAppIcon from '@/icons/Whatsapp';
import FacebookBlueIcon from '@/icons/FacebookBlueIcon';
import FallbackImage from '@/app/_components/FallbackImage';

interface DeveloperCardProps {
  developer: Developer;
}

const DeveloperCard: FC<DeveloperCardProps> = ({ developer }) => {
  const source = (developer as Developer & { __source?: 'local' | 'aura' }).__source === 'aura' ? 'aura' : 'local';
  const logoUrl = developer.logo_path
    ? resolveMediaUrl(developer.logo_path, '/images/no-image.png', source)
    : '/images/no-image.png';

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const cleanPhone = developer.phone?.replace(/[^\d+]/g, '') || '';

  return (
    <Link
      href={`/developers/${developer.id}`}
      className="bg-white rounded-[22px] p-6 transition-shadow block hover:shadow-lg"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0">
          <FallbackImage src={logoUrl} alt={developer.name} fill className="object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">{developer.name}</h3>
          <p className="text-[#666F8D] text-sm">Застройщик</p>
        </div>
      </div>

      {developer.description && (
        <p className="text-[#666F8D] text-sm mb-4 line-clamp-2">
          {developer.description}
        </p>
      )}

      <div className="space-y-2 text-sm text-[#666F8D] mb-4">
        {developer.founded_year && (
          <div className="flex justify-between">
            <span>Год основания</span>
            <span className="font-medium text-gray-900">
              {developer.founded_year}
            </span>
          </div>
        )}
        {developer.under_construction_count !== undefined && (
          <div className="flex justify-between">
            <span>Строится</span>
            <span className="font-medium text-gray-900">
              {developer.under_construction_count}
            </span>
          </div>
        )}
        {developer.built_count !== undefined && (
          <div className="flex justify-between">
            <span>Построено</span>
            <span className="font-medium text-gray-900">
              {developer.built_count}
            </span>
          </div>
        )}
        {developer.total_projects !== undefined && (
          <div className="flex justify-between">
            <span>Всего объектов</span>
            <span className="font-medium text-gray-900">
              {developer.total_projects}
            </span>
          </div>
        )}
      </div>

      {/* Social media links */}
      <div className="flex gap-2">
        {developer.facebook && (
          <a
            href={formatUrl(developer.facebook)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Facebook"
          >
            <FacebookBlueIcon className="w-10 h-10" />
          </a>
        )}
        {developer.instagram && (
          <a
            href={formatUrl(developer.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>
        )}

        {developer.phone && (
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="w-10 h-10 text-white" />
          </a>
        )}
      </div>
    </Link>
  );
};

export default DeveloperCard;
