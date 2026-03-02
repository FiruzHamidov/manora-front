'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAuthToken } from '@/utils/axios';

type User = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;
};

type ChangeDiff = {
  old?: unknown;
  new?: unknown;
};

type LogItem = {
  id: number;
  property_id: number;
  user_id: number | null;
  action: string;
  changes: Record<string, ChangeDiff> | null;
  comment?: string | null;
  created_at: string;
  updated_at?: string;
  user?: User | null;
};

const FIELD_LABELS: Record<string, string> = {
  // basic fields
  title: 'Заголовок',
  description: 'Описание',
  price: 'Цена',
  currency: 'Валюта',
  offer_type: 'Сделка',
  rooms: 'Комнат',
  total_area: 'Площадь (общая)',
  living_area: 'Площадь (жилая)',
  land_size: 'Площадь участка',
  floor: 'Этаж',
  total_floors: 'Всего этажей',
  year_built: 'Год постройки',

  // location & address
  location_id: 'Расположение (город)',
  district: 'Район',
  address: 'Адрес',
  address_full: 'Полный адрес',
  landmark: 'Ориентир',
  latitude: 'Широта',
  longitude: 'Долгота',

  // contact / owner
  owner_name: 'ФИО владельца',
  owner_phone: 'Телефон владельца',
  owner: 'Владелец',
  agent_id: 'Агент',
  created_by: 'Создал',

  // types & flags
  type_id: 'Тип недвижимости',
  property_type: 'Тип недвижимости',
  building_type: 'Тип объекта',
  apartment_type: 'Тип квартиры',
  repair_type_id: 'Ремонт',
  heating_type_id: 'Отопление',
  parking_type_id: 'Парковка',
  has_garden: 'Есть сад',
  has_parking: 'Есть парковка',
  is_mortgage_available: 'Доступна ипотека',
  is_from_developer: 'От застройщика',

  // moderation / listing
  listing_type: 'Тип объявления',
  moderation_status: 'Статус модерации',
  contract_type_id: 'Тип контракта',
  offer_type_label: 'Тип предложения',

  // media / external
  youtube_link: 'Ссылка YouTube',
  photos: 'Фотографии',
  object_key: 'Ключ от объекта',

  // counters / metadata
  views_count: 'Просмотры',
  views: 'Просмотры',
  created_at: 'Создано',
  updated_at: 'Обновлено',

  // fallback / extra
  comment: 'Комментарий',
  status_id: 'Статус объявления',
  building_type_id: 'Тип здания',
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  listing_type: {
    regular: 'Обычное',
    vip: 'VIP',
    urgent: 'Срочно',
  },
  moderation_status: {
    pending: 'Ожидает модерации',
    approved: 'Одобрено',
    deleted: 'Удалено',
    rejected: 'Отклонено',
    draft: 'Черновик',
    sold: 'Продано',
    sold_by_owner: 'Продано владельцем',
    rented: 'Арендовано',
    denied: 'Отказано клиентом',
  },
  // при необходимости можно добавить перевод других полей
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Создано',
  updated: 'Обновлено',
  deleted: 'Удалено',
  restored: 'Восстановлено',
};

function humanizeField(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function translateField(key: string) {
  return FIELD_LABELS[key] ?? humanizeField(key);
}

function translateValue(field: string, value: unknown) {
  if (value === null || value === undefined) return '';
  // если есть маппинг значений для поля
  if (VALUE_LABELS[field] && typeof value === 'string') {
    return VALUE_LABELS[field][value] ?? value;
  }
  // булевы значения
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  // числа и строки возвращаем как есть
  return String(value);
}

export default function PropertyLogsPage() {
  const params = useParams();
  const slug = String(params?.slug ?? '');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [perPage, setPerPage] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, slug]);

  async function fetchLogs(pageToFetch = 1) {
    setLoading(true);
    setError(null);
    const token = getAuthToken?.();
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://backend.aura.tj';
    const url = `${base}/properties/${slug}/logs?page=${pageToFetch}&per_page=${perPage}`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ошибка ${res.status}: ${txt}`);
      }

      const data = await res.json();
      setLogs(Array.isArray(data.data) ? data.data : []);
      setTotal(typeof data.total === 'number' ? data.total : null);
      setPerPage(typeof data.per_page === 'number' ? data.per_page : perPage);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Не удалось загрузить логи');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso?: string) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1 className='mb-3'>История объекта #{slug}</h1>

      {error && (
        <div style={{ background: '#ffe6e6', padding: 12, borderRadius: 6, marginBottom: 12 }}>{error}</div>
      )}

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>История отсутствует</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {logs.map((log) => (
                <div key={log.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <strong style={{ marginRight: 8 }}>{(ACTION_LABELS[log.action] ?? log.action).toUpperCase()}</strong>
                      <small style={{ color: '#666' }}>{formatDate(log.created_at)}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {log.user ? (
                        <div style={{ fontSize: 13 }}>
                          <div>{log.user.name || `#${log.user.id}`}</div>
                          <div style={{ color: '#888' }}>{log.user.email}</div>
                        </div>
                      ) : (
                        <div style={{ color: '#888', fontSize: 13 }}>Система</div>
                      )}
                    </div>
                  </div>

                  {log.comment && (
                    <div style={{ marginBottom: 8, color: '#333' }}>{log.comment}</div>
                  )}

                  {log.changes && Object.keys(log.changes).length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>Поле</th>
                          <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>Старое</th>
                          <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>Новое</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(log.changes).map(([field, diff]) => (
                          <tr key={field}>
                            <td style={{ padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid #fafafa' }}>{translateField(field)}</td>
                            <td style={{ padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid #fafafa', color: '#666' }}>{translateValue(field, (diff as ChangeDiff).old ?? '')}</td>
                            <td style={{ padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid #fafafa' }}>{translateValue(field, (diff as ChangeDiff).new ?? '')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: '#666' }}>Нет детализированных изменений</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div style={{ color: '#666' }}>
              Всего: {total ?? '-'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '6px 10px' }}>
                Назад
              </button>
              <div style={{ alignSelf: 'center' }}>Стр. {page}</div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={total !== null && page * perPage >= (total ?? 0)}
                style={{ padding: '6px 10px' }}>
                Вперёд
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}