'use client';

import { useParams } from 'next/navigation';
import { useDeveloper } from '@/services/new-buildings/hooks';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { ExternalLink, Pencil } from 'lucide-react';
import Image from 'next/image';
import InstagramIcon from '@/icons/InstagramIcon';

export default function DeveloperShowPage() {
  const params = useParams<{ id: string }>();
  const { data: developer, isLoading } = useDeveloper(
    params.id ? Number(params.id) : undefined
  );

  if (isLoading)
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  if (!developer) return <div>Застройщик не найден</div>;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {developer.logo_path && (
            <div className="rounded-lg overflow-hidden w-16 h-16 bg-gray-50 flex-shrink-0">
              <Image
                src={`${process.env.NEXT_PUBLIC_STORAGE_URL}/${developer.logo_path}`}
                alt={developer.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{developer.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Статус:{' '}
              <span
                className={`capitalize ${
                  developer.moderation_status === 'approved'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}
              >
                {developer.moderation_status || 'На модерации'}
              </span>
            </p>
          </div>
        </div>
        <Link href={`/admin/new-buildings/developers/${developer.id}/edit`}>
          <Button>
            <Pencil className="w-4 h-4 mr-2" /> Редактировать
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-2xl p-4">
            <h2 className="font-medium mb-3">Основная информация</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-gray-500">Название:</span>{' '}
                <span className="font-medium">{developer.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Телефон:</span>{' '}
                <a
                  href={`tel:${developer.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {developer.phone || '—'}
                </a>
              </div>
              <div>
                <span className="text-gray-500">Год основания:</span>{' '}
                {developer.founded_year || '—'}
              </div>
              <div>
                <span className="text-gray-500">Сайт:</span>{' '}
                {developer.website ? (
                  <a
                    href={developer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {developer.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  '—'
                )}
              </div>
              <div>
                <span className="text-gray-500">Дата регистрации:</span>{' '}
                {formatDate(developer.created_at)}
              </div>
              <div>
                <span className="text-gray-500">Последнее обновление:</span>{' '}
                {formatDate(developer.updated_at)}
              </div>
            </div>
          </div>

          <div className="border rounded-2xl p-4">
            <h2 className="font-medium mb-3">Проекты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {developer.total_projects || 0}
                </div>
                <div className="text-sm text-gray-600">Всего проектов</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {developer.built_count || 0}
                </div>
                <div className="text-sm text-gray-600">Построено</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {developer.under_construction_count || 0}
                </div>
                <div className="text-sm text-gray-600">В процессе</div>
              </div>
            </div>
          </div>

          {developer.description && (
            <div className="border rounded-2xl p-4">
              <h2 className="font-medium mb-2">О компании</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {developer.description}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="border rounded-2xl overflow-hidden">
            <div className="p-3 border-b">
              <h3 className="font-medium">Соцсети</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {developer.instagram && (
                  <a
                    href={developer.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white">
                      <InstagramIcon />
                    </div>
                    <div>
                      <div className="font-medium">Instagram</div>
                      <div className="text-xs text-gray-500">
                        {developer.instagram.replace(
                          /^https?:\/\/(www\.)?/,
                          ''
                        )}
                      </div>
                    </div>
                  </a>
                )}

                {developer.facebook && (
                  <a
                    href={developer.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Facebook</div>
                      <div className="text-xs text-gray-500">
                        {developer.facebook.replace(/^https?:\/\/(www\.)?/, '')}
                      </div>
                    </div>
                  </a>
                )}

                {developer.telegram && (
                  <a
                    href={developer.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.21-.06-.07-.19-.04-.27-.02-.12.02-1.93 1.25-5.44 3.68-.51.35-.98.53-1.39.51-.46-.01-1.33-.26-1.98-.47-.8-.26-1.43-.4-1.38-.85.03-.22.28-.45.75-.68 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.72-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Telegram</div>
                      <div className="text-xs text-gray-500">
                        {developer.telegram.replace(/^https?:\/\/(www\.)?/, '')}
                      </div>
                    </div>
                  </a>
                )}

                {!developer.instagram &&
                  !developer.facebook &&
                  !developer.telegram && (
                    <div className="text-sm text-gray-500 p-2">
                      Социальные сети не указаны
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
