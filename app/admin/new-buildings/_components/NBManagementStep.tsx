'use client';

import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { Image as ImageIcon, Building2, Home } from 'lucide-react';

interface NBManagementStepProps {
  buildingId: number;
  onBack: () => void;
}

export default function NBManagementStep({
  buildingId,
  onBack,
}: NBManagementStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Дополнительные данные</h2>
        <p className="text-gray-600">
          Управляйте фотографиями, блоками и квартирами новостройки
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photos Card */}
        <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">Фотографии</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Загрузите фото новостройки, установите обложку и измените порядок
            отображения.
          </p>
          <Link href={`/admin/new-buildings/${buildingId}/photos`}>
            <Button variant="outline" className="w-full">
              Управление фото
            </Button>
          </Link>
        </div>

        {/* Blocks Card */}
        <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">Блоки</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Добавьте корпуса (блоки) новостройки с указанием этажности и сроков
            сдачи.
          </p>
          <Link href={`/admin/new-buildings/${buildingId}/blocks`}>
            <Button variant="outline" className="w-full">
              Управление блоками
            </Button>
          </Link>
        </div>

        {/* Units Card */}
        <div className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg">Квартиры</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Добавьте квартиры с планировками, ценами и фотографиями для каждой
            квартиры.
          </p>
          <Link href={`/admin/new-buildings/${buildingId}/units`}>
            <Button variant="outline" className="w-full">
              Управление квартирами
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-blue-900 mb-2">💡 Рекомендации:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Сначала загрузите фотографии новостройки</li>
          <li>Затем создайте блоки (корпуса) с этажностью</li>
          <li>Наконец, добавьте квартиры в каждый блок</li>
          <li>Для квартир можно загрузить отдельные планировки</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <Link href={`/admin/new-buildings/${buildingId}`} className="flex-1">
          <Button className="w-full">Перейти к новостройке</Button>
        </Link>
      </div>
    </div>
  );
}
