'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import {
  useBuildingBlocks,
  useDeleteBuildingBlock,
  useNewBuilding,
} from '@/services/new-buildings/hooks';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function BuildingBlocksPage() {
  const params = useParams<{ id: string }>();
  const newBuildingId = Number(params.id);

  const { data: buildingResponse, isLoading: buildingLoading } =
    useNewBuilding(newBuildingId);
  const { data: blocks, isLoading: blocksLoading } =
    useBuildingBlocks(newBuildingId);
  const deleteBlock = useDeleteBuildingBlock(newBuildingId);

  const building = buildingResponse?.data;

  const handleDelete = async (blockId: number) => {
    if (!confirm('Удалить блок? Это действие необратимо.')) return;
    try {
      await deleteBlock.mutateAsync(blockId);
      toast.success('Блок удалён');
    } catch {
      toast.error('Ошибка при удалении блока');
    }
  };

  if (buildingLoading || blocksLoading) {
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  }

  if (!building) {
    return <div>Новостройка не найдена</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Блоки: {building.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление блоками новостройки
          </p>
        </div>
        <Link href={`/admin/new-buildings/${newBuildingId}/blocks/create`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Добавить блок
          </Button>
        </Link>
      </div>

      {!blocks || blocks.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-2xl">
          <p className="text-gray-500 mb-4">Блоки не найдены</p>
          <Link href={`/admin/new-buildings/${newBuildingId}/blocks/create`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Создать первый блок
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Этажность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Срок сдачи
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blocks.map((block) => (
                <tr key={block.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {block.id}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {block.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {block.floors_from}–{block.floors_to} этажей
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(block.completion_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <Link
                      href={`/admin/new-buildings/${newBuildingId}/blocks/${block.id}/edit`}
                    >
                      <Button variant="outline" size="sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(block.id)}
                      disabled={deleteBlock.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-start">
        <Link href={`/admin/new-buildings/${newBuildingId}`}>
          <Button variant="outline">← Назад к новостройке</Button>
        </Link>
      </div>
    </div>
  );
}
