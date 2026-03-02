'use client';

import type {ActiveElement, Chart, ChartEvent} from 'chart.js';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import {Bar, Line, Pie} from 'react-chartjs-2';
import type React from 'react';
import {useMemo, useRef} from "react";
import {useRouter} from "next/navigation";

ChartJS.register(
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, PointElement, LineElement, BarElement
);

const COLORS = [
    '#0036A5', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#E91E63', '#8BC34A', '#00BCD4',
];

const STATUS_OPTIONS = [
    {label: 'Черновик', value: 'draft'},
    {label: 'Ожидание', value: 'pending'},
    {label: 'Одобрено/Опубликовано', value: 'approved'},
    {label: 'Отклонено', value: 'rejected'},
    {label: 'Продано', value: 'sold'},
    {label: 'Продано владельцем', value: 'sold_by_owner'},
    {label: 'Арендовано', value: 'rented'},
    {label: 'Удалено', value: 'deleted'},
    {label: 'Отказано клиентом', value: 'denied'},
];

export function PieStatus({title, data, dateFrom, dateTo, soldDateFrom, soldDateTo, agentId, branchId}: {
    title?: string
    data: { label: string; value: number }[],
    dateFrom: string,
    dateTo: string,
    soldDateFrom: string,
    soldDateTo: string,
    agentId: string,
    branchId?: string
})
{
    const router = useRouter();
    const chartRef = useRef<Chart<'pie', number[], unknown> | null>(null);

    const chartData = useMemo(() => ({
        labels: data.map(d => d.label),
        datasets: [{
            data: data.map(d => d.value),
            backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
            borderColor: '#fff',
            borderWidth: 2,
        }],
    }), [data]);

    const options = useMemo(() => ({
        responsive: true,
        onHover: (event: ChartEvent, elements: ActiveElement[]) => {
            const nativeEvent = event.native as Event | undefined;
            const target = nativeEvent ? (nativeEvent.target as HTMLElement | null) : null;
            if (target) target.style.cursor = elements && elements.length ? 'pointer' : 'default';
        },
    }), []);

    // Найти соответствующее moderation_status по метке
    const mapLabelToModerationStatus = (label: string) => {
        const norm = String(label).trim().toLowerCase();
        // точное совпадение по label
        const found = STATUS_OPTIONS.find(opt => String(opt.label).toLowerCase() === norm);
        if (found) return found.value;
        // частичное совпадение по ключевым словам
        const partial = STATUS_OPTIONS.find(opt => norm.includes(String(opt.label).toLowerCase().split('/')[0]));
        return partial ? partial.value : label;
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const chart = chartRef.current;
        if (!chart) return;
        const points = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', {intersect: true}, false) || [];
        if (!points || points.length === 0) return;
        const index = points[0].index;
        const label = data[index]?.label;
        if (!label) return;

        const moderation = mapLabelToModerationStatus(label);

        const params = new URLSearchParams({
            date_from: dateFrom,
            sold_at_from: soldDateFrom,
            date_to: dateTo,
            sold_at_to: soldDateTo,
            interval: 'week',
            price_metric: 'sum',
            moderation_status: moderation,
            page: '1',
            per_page: '20',
            agent_id: agentId
        });
        if (branchId) params.set('branch_id', branchId);


        // если из внешнего состояния уже передан moderationStatus и он отличается — перезапишем
        // (в большинстве случаев мы хотим перейти по тому статусу, по которому кликнули)
        router.push(`/profile/reports/objects?${params.toString()}`);
    };

    return (
        <div className="p-4 bg-white rounded-2xl shadow">
            <h3 className="font-semibold mb-3">{title}</h3>
            <Pie
                ref={(el) => {
                    chartRef.current = el as Chart<'pie', number[], unknown> | null
                }}
                data={chartData}
                onClick={handleCanvasClick}
                options={options}
            />
        </div>
    );
}

export function BarOffer({data, dateFrom, dateTo, soldDateFrom, soldDateTo, agentId, branchId}: {
    data: { label: string; value: number }[],
    dateFrom: string,
    dateTo: string,
    soldDateFrom: string,
    soldDateTo: string,
    agentId: string,
    branchId?: string
}) {
    const router = useRouter();

    const chartRef = useRef<Chart<'bar', number[], unknown> | null>(null);

    // Преобразуем данные один раз
    const chartData = useMemo(() => ({
        labels: data.map(d => d.label),
        datasets: [{
            label: 'Количество',
            data: data.map(d => d.value),
            backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        }],
    }), [data]);

    const options = useMemo(() => ({
        responsive: true,
        plugins: {legend: {display: false}},
        // делаем курсор указателем над элементами
        onHover: (event: ChartEvent, elements: ActiveElement[]) => {
            const nativeEvent = event.native as Event | undefined;
            const target = nativeEvent ? (nativeEvent.target as HTMLElement | null) : null;
            if (target) target.style.cursor = elements && elements.length ? 'pointer' : 'default';
        },
    }), []);

    const mapLabelToOfferType = (label: string) => {
        const norm = String(label).trim().toLowerCase();
        // подстраховка для русских и английских меток (сравниваем в нижнем регистре)
        if (norm === 'аренда' || norm === 'аренду' || norm === 'rent') return 'rent';
        if (norm === 'продажа' || norm === 'продать' || norm === 'sale') return 'sale';
        // иногда метки могут быть в форме 'аренда/снять' или 'продажа/купить' — проверим наличие ключевых слов
        if (norm.includes('аренд') || norm.includes('снять')) return 'rent';
        if (norm.includes('прод') || norm.includes('купить')) return 'sale';
        // если уже ключ в нужном формате, отдадим как есть
        return label;
    };

    // When canvas is clicked React passes MouseEvent only — use chartRef to get elements under pointer
    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const chart = chartRef.current;
        if (!chart) return;
        // chart.js wants native event
        const points = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', {intersect: true}, false) || [];
        if (!points || points.length === 0) return;
        const index = points[0].index;
        const label = data[index]?.label;
        if (!label) return;

        const offerType = mapLabelToOfferType(label);


        const params = new URLSearchParams({
            interval: 'week',
            price_metric: 'sum',
            offer_type: offerType,
            page: '1',
            per_page: '20',
            date_from: dateFrom,
            sold_at_from: soldDateFrom,
            date_to: dateTo,
            sold_at_to: soldDateTo,
            agent_id: agentId
        });
        if (branchId) params.set('branch_id', branchId);

        router.push(`/profile/reports/objects?${params.toString()}`);
    };

    return (
        <div className="p-4 bg-white rounded-2xl shadow">
            <h3 className="font-semibold mb-3">Тип объявления</h3>
            <Bar
                ref={(el) => {
                    chartRef.current = el as Chart<'bar', number[], unknown> | null
                }}
                data={chartData}
                options={options}
                onClick={handleCanvasClick}
            />
        </div>
    );
}

export function LineTimeSeries({data}: { data: { x: string; total: number; closed: number }[] }) {
    return (
        <div className="p-4 bg-white rounded-2xl shadow">
            <h3 className="font-semibold mb-3">Динамика (всего/продано)</h3>
            <Line
                data={{
                    labels: data.map(d => d.x),
                    datasets: [
                        {
                            label: 'Всего',
                            data: data.map(d => d.total),
                            borderColor: COLORS[0],
                            backgroundColor: COLORS[0] + '33',
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: 'Продано',
                            data: data.map(d => d.closed),
                            borderColor: COLORS[1],
                            backgroundColor: COLORS[1] + '33',
                            tension: 0.3,
                            fill: true,
                        },
                    ],
                }}
                options={{responsive: true}}
            />
        </div>
    );
}

// export function BarBuckets({ data }: { data: { label: string; value: number }[] }) {
//     return (
//         <div className="p-4 bg-white rounded-2xl shadow">
//             <h3 className="font-semibold mb-3">Распределение по ценовым корзинам</h3>
//             <Bar
//                 data={{
//                     labels: data.map(d => d.label),
//                     datasets: [{
//                         label: 'Объекты',
//                         data: data.map(d => d.value),
//                         backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
//                     }],
//                 }}
//                 options={{ responsive: true, plugins: { legend: { display: false } } }}
//             />
//         </div>
//     );
// }

export function BarRooms({data, dateFrom, dateTo}: {
    data: { label: string; value: number }[],
    dateFrom: string,
    dateTo: string
}) {
    const router = useRouter();
    const chartRef = useRef<Chart<'bar', number[], unknown> | null>(null);

    const chartData = useMemo(() => ({
        labels: data.map(d => d.label),
        datasets: [{
            label: 'Объекты',
            data: data.map(d => d.value),
            backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        }],
    }), [data]);

    const options = useMemo(() => ({
        responsive: true,
        plugins: {legend: {display: false}},
        onHover: (event: ChartEvent, elements: ActiveElement[]) => {
            const nativeEvent = event.native as Event | undefined;
            const target = nativeEvent ? (nativeEvent.target as HTMLElement | null) : null;
            if (target) target.style.cursor = elements && elements.length ? 'pointer' : 'default';
        },
    }), []);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const chart = chartRef.current;
        if (!chart) return;
        const points = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', {intersect: true}, false) || [];
        if (!points || points.length === 0) return;
        const index = points[0].index;
        const label = data[index]?.label;
        if (!label) return;

        const params = new URLSearchParams({
            date_from: dateFrom,
            date_to: dateTo,
            interval: 'week',
            price_metric: 'sum',
            rooms: label,
            page: '1',
            per_page: '20',
        });

        router.push(`/profile/reports/objects?${params.toString()}`);
    };

    return (
        <div className="p-4 bg-white rounded-2xl shadow">
            <h3 className="font-semibold mb-3">Количество комнат</h3>
            <Bar
                ref={(el) => {
                    chartRef.current = el as Chart<'bar', number[], unknown> | null
                }}
                data={chartData}
                options={options}
                onClick={handleCanvasClick}
            />
        </div>
    );
}
