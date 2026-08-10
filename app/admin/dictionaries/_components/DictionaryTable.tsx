'use client';

import { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export type DictionaryTableColumn<T> = {
  label: string;
  render: (item: T) => ReactNode;
};

type DictionaryTableProps<T> = {
  items: T[];
  columns: DictionaryTableColumn<T>[];
  deleting: boolean;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
};

export default function DictionaryTable<T extends { id: number }>({
  items,
  columns,
  deleting,
  onEdit,
  onDelete,
}: DictionaryTableProps<T>) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto border rounded-2xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              {columns.map((column) => (
                <th key={column.label} className="px-4 py-3">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                {columns.map((column) => (
                  <td key={column.label} className="px-4 py-3">
                    {column.render(item)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="p-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition"
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:hidden gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border bg-white p-4">
            {columns.map((column) => (
              <div key={`${item.id}-${column.label}`} className="flex justify-between gap-4 text-sm py-1">
                <span className="text-gray-500 shrink-0">{column.label}:</span>
                <span className="text-right font-medium text-gray-900">{column.render(item)}</span>
              </div>
            ))}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="px-3 py-2 rounded-md border hover:bg-gray-50"
              >
                Изменить
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="px-3 py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                disabled={deleting}
              >
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

