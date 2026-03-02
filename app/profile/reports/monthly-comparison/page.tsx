'use client';

import { useEffect, useMemo, useState } from 'react';
import { reportsApi, type MonthlyComparisonDiffItem, type MonthlyComparisonRangeResponse } from '@/services/reports/api';
import { useBranches } from '@/services/branches/hooks';
import { useProfile } from '@/services/login/hooks';
import { Input } from '@/ui-components/Input';
import { ReportsNavigation } from '../_components/ReportsNavigation';

type MetricDefinition = {
  key: string;
  label: string;
};

const METRICS: MetricDefinition[] = [
  { key: 'added_total', label: 'Добавлено (всего)' },
  { key: 'added_sale_total', label: 'Опубликовано / Продажа' },
  { key: 'added_rent_total', label: 'Опубликовано / Аренда' },
  { key: 'closed_total', label: 'Закрыто (всего)' },
  { key: 'closed_sale_total', label: 'Закрыто / Продажа' },
  { key: 'closed_rent_total', label: 'Закрыто / Аренда' },
  { key: 'sold_by_owner_total', label: 'Продано владельцем' },
  { key: 'sold_by_agent_total', label: 'Продано агентом' },
  { key: 'deposit_total', label: 'Залог' },
  { key: 'shows_total', label: 'Показы' },
];

function currentMonthStr() {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

function previousMonthStr(baseMonth: string) {
  const [year, month] = baseMonth.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${d.getFullYear()}-${mm}`;
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function deltaClass(delta: number) {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-500';
}

type LeaderRow = {
  agent_id: number | null;
  agent_name: string;
  value?: number;
  count?: number;
  shows_count?: number;
  added_total?: number;
  closed_total?: number;
  added_count?: number;
  closed_count?: number;
  sold_by_agent_count?: number;
  sold_agent_count?: number;
  sold_count?: number;
  rented_count?: number;
};

function extractPeriodLabel(value: unknown, fallback?: string) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const v = value as { period?: { from?: string; to?: string } };
    if (v.period?.from && v.period?.to) return `${v.period.from} — ${v.period.to}`;
  }
  return fallback ?? '—';
}

function formatMonthYear(input?: string) {
  if (!input) return '—';
  const normalized = /^\d{4}-\d{2}$/.test(input) ? `${input}-01` : input;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return input;
  const value = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(d);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function extractLeadersFromBlock(block?: { leaders?: Record<string, unknown> } | null) {
  const source = (block?.leaders ?? {}) as Record<string, unknown>;
  const asLeaderArray = (input: unknown): LeaderRow[] => {
    if (!Array.isArray(input)) return [];
    return input
      .filter((item) => item && typeof item === 'object')
      .map((item) => item as LeaderRow);
  };

  return {
    by_shows: asLeaderArray(source.by_shows),
    by_added: asLeaderArray(source.by_added),
    by_sold_agent: asLeaderArray(
      source.by_sold_agent ??
        source.by_sales_agent ??
        source.by_sold ??
        source.by_agent_sold
    ),
    by_rented: asLeaderArray(
      source.by_rented ??
        source.by_rent ??
      source.by_rent_closed
    ),
  };
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0);
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return num(value);
  }
  return null;
}

function extractRawKpi(block?: { kpi?: Record<string, unknown> } | null): Record<string, unknown> {
  return (block?.kpi ?? {}) as Record<string, unknown>;
}

function resolveMetricValue(source: Record<string, unknown>, metricKey: string): number {
  switch (metricKey) {
    case 'added_sale_total':
      return pickNumber(source, ['added_sale_total', 'published_sale_total']) ?? 0;
    case 'added_rent_total':
      return pickNumber(source, ['added_rent_total', 'published_rent_total']) ?? 0;
    case 'closed_sale_total':
      return pickNumber(source, ['closed_sale_total']) ?? (num(source.sold_total) + num(source.sold_by_owner_total));
    case 'closed_rent_total':
      return pickNumber(source, ['closed_rent_total', 'rented_total']) ?? 0;
    case 'sold_by_agent_total':
      return pickNumber(source, ['sold_by_agent_total', 'sold_total']) ?? 0;
    default:
      return num(source[metricKey]);
  }
}

export default function MonthlyComparisonReportPage() {
  const { data: profile } = useProfile();
  const { data: branches } = useBranches();
  const isBranchFilterAvailable =
    profile?.role?.slug === 'admin' || profile?.role?.slug === 'superadmin';

  const [toMonth, setToMonth] = useState<string>(currentMonthStr());
  const [fromMonth, setFromMonth] = useState<string>(() => previousMonthStr(currentMonthStr()));
  const [branchId, setBranchId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<MonthlyComparisonRangeResponse | null>(null);
  const [leadersTab, setLeadersTab] = useState<'from' | 'to'>('to');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await reportsApi.monthlyComparisonRange({
          from_month: fromMonth || undefined,
          to_month: toMonth || undefined,
          branch_id: branchId || undefined,
        });
        if (!cancelled) setReport(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError('Не удалось загрузить сравнительный отчёт.');
          setReport(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fromMonth, toMonth, branchId]);

  const rows = useMemo(() => {
    if (!report) return [];
    const fromKpi = extractRawKpi(report.from);
    const toKpi = extractRawKpi(report.to);
    const diff = (report.diff ?? {}) as Record<string, MonthlyComparisonDiffItem>;
    return METRICS.map((metric) => {
      const prev = Number(diff[metric.key]?.previous ?? resolveMetricValue(fromKpi, metric.key));
      const current = Number(diff[metric.key]?.current ?? resolveMetricValue(toKpi, metric.key));
      const delta = Number(diff[metric.key]?.delta ?? current - prev);
      const deltaPct =
        diff[metric.key]?.delta_pct ?? (prev === 0 ? null : (delta / prev) * 100);
      return {
        key: metric.key,
        label: metric.label,
        prev,
        current,
        delta,
        deltaPct,
      };
    });
  }, [report]);

  const monthLabels = useMemo(
    () => ({
      previous: extractPeriodLabel(report?.from, fromMonth),
      current: extractPeriodLabel(report?.to, toMonth),
    }),
    [report, fromMonth, toMonth]
  );

  const leaders = useMemo(() => {
    if (!report) return extractLeadersFromBlock(null);
    return extractLeadersFromBlock(leadersTab === 'from' ? report.from : report.to);
  }, [report, leadersTab]);

  const leadersTabLabel = useMemo(() => {
    if (!report) return { from: 'Прошлый', to: 'Текущий' };
    return {
      from: formatMonthYear(report.from?.period?.from ?? report.from_month),
      to: formatMonthYear(report.to?.period?.from ?? report.to_month),
    };
  }, [report]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Сравнение прошлого и текущего месяца</h1>
      <ReportsNavigation />

      <div className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Месяц от"
          type="month"
          name="from_month"
          value={fromMonth}
          onChange={(e) => setFromMonth(e.target.value)}
        />
        <Input
          label="Месяц до"
          type="month"
          name="to_month"
          value={toMonth}
          onChange={(e) => setToMonth(e.target.value)}
        />

        {isBranchFilterAvailable && (
          <div className="flex flex-col gap-2">
            <label className="block text-sm text-[#666F8D]">Филиал</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-[#BAC0CC] bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0036A5]"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="">— Все —</option>
              {(branches ?? []).map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-2xl shadow p-6 text-gray-600">Загрузка отчёта...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">{error}</div>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="text-sm text-gray-500">Прошлый месяц</div>
              <div className="text-xl font-semibold mt-1">{monthLabels.previous}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="text-sm text-gray-500">Текущий месяц</div>
              <div className="text-xl font-semibold mt-1">{monthLabels.current}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-3">Метрика</th>
                  <th className="pb-3">Прошлый</th>
                  <th className="pb-3">Текущий</th>
                  <th
                    className="pb-3 cursor-help"
                    title="Δ — абсолютная разница: Текущий месяц минус Прошлый месяц."
                  >
                    Δ
                  </th>
                  <th
                    className="pb-3 cursor-help"
                    title="Δ % — процентное изменение относительно Прошлого месяца."
                  >
                    Δ %
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t">
                    <td className="py-3 font-medium">{row.label}</td>
                    <td className="py-3">{row.prev.toLocaleString()}</td>
                    <td className="py-3">{row.current.toLocaleString()}</td>
                    <td
                      className={`py-3 font-medium ${deltaClass(row.delta)}`}
                      title="Абсолютное изменение: Текущий − Прошлый"
                    >
                      {row.delta > 0 ? '+' : ''}
                      {row.delta.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 font-medium ${deltaClass(row.delta)}`}
                      title="Процент изменения относительно Прошлого месяца"
                    >
                      {formatPercent(row.deltaPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow p-3">
            <div className="inline-flex rounded-xl border border-[#BAC0CC] bg-[#F8FAFC] p-1">
              <button
                type="button"
                onClick={() => setLeadersTab('from')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  leadersTab === 'from' ? 'bg-[#0036A5] text-white' : 'text-[#0036A5] hover:bg-white'
                }`}
              >
                {leadersTabLabel.from}
              </button>
              <button
                type="button"
                onClick={() => setLeadersTab('to')}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  leadersTab === 'to' ? 'bg-[#0036A5] text-white' : 'text-[#0036A5] hover:bg-white'
                }`}
              >
                {leadersTabLabel.to}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <LeaderBlock title="Лидеры по показам" items={leaders.by_shows} />
            <LeaderBlock title="Лидеры по добавленным" items={leaders.by_added} />
            <LeaderBlock
              title="Лидеры по продажам (продано агентом)"
              items={leaders.by_sold_agent}
              valueKeys={['sold_by_agent_count', 'sold_agent_count', 'sold_count', 'value', 'count']}
            />
            <LeaderBlock
              title="Лидеры по арендовано"
              items={leaders.by_rented}
              valueKeys={['rented_count', 'value', 'count']}
            />
          </div>
        </>
      )}
    </div>
  );
}

function LeaderBlock({
  title,
  items,
  valueKeys,
}: {
  title: string;
  items: LeaderRow[];
  valueKeys?: Array<keyof LeaderRow>;
}) {
  const keys = valueKeys ?? [
    'value',
    'count',
    'shows_count',
    'added_total',
    'added_count',
    'closed_total',
    'closed_count',
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && <div className="text-sm text-gray-500">Нет данных</div>}
        {items.map((item, idx) => (
          <div
            key={`${item.agent_id ?? 'na'}-${idx}`}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
          >
            <span className="truncate">{item.agent_name}</span>
            <span className="font-semibold text-[#0036A5]">
              {Number(keys.map((k) => item[k]).find((v) => v !== undefined && v !== null) ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
