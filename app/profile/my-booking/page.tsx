'use client';

import { useCallback, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { axios } from '@/utils/axios';
import { formatISO } from 'date-fns';
import { PropertiesResponse, Property } from '@/services/properties/types';
import {useProfile} from "@/services/login/hooks";
import dynamic from 'next/dynamic';

interface Booking {
  id: number;
  agent: {
    id: number;
    name: string;
  };
  start_time: string;
  end_time: string;
  note: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  property: Property;
  client_name: string;
  client_phone: string;
}

interface Agent {
  id: number;
  name: string;
}

export default function MyListings() {
  const { data: user } = useProfile();
  const [bookings, setBookings] = useState<EventInput[]>([]);
  const [properties, setProperties] = useState<PropertiesResponse>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'report'>('calendar');
  const BookingsReport = dynamic(() => import('@/app/profile/reports/bookings/page'), { ssr: false });

  // const formatInputDate = (date: Date) => {
  //   const pad = (n: number) => String(n).padStart(2, '0');
  //   return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  // };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#007bff';
    }
  };

  const fetchBookings = useCallback(async () => {
    try {
      const params: Record<string, string | number | undefined> = {};
      if (user?.role?.slug === 'agent') {
        params.agent_id = user.id;
      }

      const response = await axios.get<Booking[]>('/bookings', { params });
      const events: EventInput[] = response.data.map((booking) => ({
        id: booking.id.toString(),
        title: `${booking.property.rooms} кв, ${booking.property.total_area} м², ${booking.property.floor} эт, ${booking.property.district} ${booking.property.address}, Агент: ${booking.agent.name}`,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: getStatusColor(booking.status),
        borderColor: getStatusColor(booking.status),
      }));
      setBookings(events);
    } catch (error) {
      console.error('Ошибка при получении бронирований:', error);
    }
  }, [user]);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await axios.get<PropertiesResponse>('/properties?per_page=100');
      setProperties(response.data);
    } catch (error) {
      console.error('Ошибка при получении объектов:', error);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await axios.get<Agent[]>('/user/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Ошибка при получении агентов:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) return; // ждём, пока useProfile загрузит пользователя
    void (async () => {
      await Promise.all([fetchBookings(), fetchProperties(), fetchAgents()]);
    })();
  }, [user, fetchBookings, fetchProperties, fetchAgents]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  const handleEventClick = async ({ event }: EventClickArg) => {
    try {
      const response = await axios.get<Booking>(`/bookings/${event.id}`);
      setSelectedBooking(response.data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Ошибка при загрузке деталей показа:', error);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const start = selectInfo.start;
    const end = selectInfo.end || new Date(start.getTime() + 60 * 60 * 1000);
    setSelectedRange({ start, end });
    setSelectedProperty(null);
    // ✅ если агент — подставляем его id сразу
    setSelectedAgent(user?.role?.slug === 'agent' ? user.id : null);
    setNote('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRange || !selectedProperty || !selectedAgent || !note.trim() || !clientName.trim() || !clientPhone.trim()) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }

    const booking = {
      property_id: selectedProperty,
      agent_id: selectedAgent,
      start_time: formatISO(selectedRange.start),
      end_time: formatISO(selectedRange.end),
      note,
      client_name: clientName,
      client_phone: clientPhone,
    };

    try {
      await axios.post('/bookings', booking);
      setModalOpen(false);
      await fetchBookings();
    } catch (error) {
      alert(`Ошибка при создании брони: ${error}`);
    }
  };

  return (
    <>
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded ${activeTab === 'calendar' ? 'bg-[#0036A5] text-white' : 'bg-gray-100 text-black'}`}
          >
            Календарь
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded ${activeTab === 'report' ? 'bg-[#0036A5] text-white' : 'bg-gray-100 text-black'}`}
          >
            Список
          </button>
        </div>

        {activeTab === 'calendar' ? (
          <div>
            <div className="p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
                headerToolbar={{
                  left: isMobile ? 'prev,next' : 'prev,next today',
                  center: isMobile ? '' : 'title',
                  right: isMobile ? 'listWeek,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                }}
                views={{
                  listWeek: {
                    visibleRange: (currentDate: Date) => {
                      // start = today (00:00)
                      const start = new Date(currentDate);
                      start.setHours(0, 0, 0, 0);
                      // end = start + 7 days (exclusive)
                      const end = new Date(start);
                      end.setDate(end.getDate() + 7);
                      return { start, end };
                    },
                    // опционально: формат заголовка дня
                    listDayFormat: { weekday: 'long', month: 'short', day: 'numeric' },
                    expandRows: true,
                  },
                }}
                initialDate={new Date()}
                footerToolbar={{ center: isMobile ? 'title' : '' }}
                height="auto"
                expandRows
                dayMaxEventRows={isMobile ? 2 : 4}
                nowIndicator
                selectable
                select={handleDateSelect}
                locale={ruLocale}
                events={bookings}
                eventClick={handleEventClick}
              />
            </div>

            {modalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-semibold mb-4">Создать показ</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm">Объект</label>
                      <select
                        className="w-full border border-gray-300 rounded p-2"
                        value={selectedProperty ?? ''}
                        onChange={(e) => setSelectedProperty(Number(e.target.value))}
                        required
                      >
                        <option value="" disabled>
                          Выберите объект
                        </option>
                        {properties?.data.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.rooms} кв, {p.total_area} м², {p.floor} эт, {p.district} {p.address}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm">Агент</label>
                      <select
                        className="w-full border border-gray-300 rounded p-2"
                        value={selectedAgent ?? ''}
                        onChange={(e) => setSelectedAgent(Number(e.target.value))}
                        required
                        disabled={user?.role?.slug === 'agent'}
                      >
                        <option value="" disabled>
                          Выберите агента
                        </option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      {user?.role?.slug === 'agent' && (
                        <p className="text-xs text-gray-500 mt-1">Вы вошли как агент — используется ваш профиль.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm">Имя клиента</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded p-2"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm">Телефон клиента</label>
                      <input
                        type="tel"
                        className="w-full border border-gray-300 rounded p-2"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                        placeholder="+992..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm">Комментарий</label>
                      <textarea
                        className="w-full border border-gray-300 rounded p-2"
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded"
                        onClick={() => setModalOpen(false)}
                      >
                        Отмена
                      </button>
                      <button type="submit" className="bg-[#0036A5] hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Создать
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {detailsOpen && selectedBooking && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailsOpen(false)}>
                <div className="bg-white rounded-xl p-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-semibold mb-4">Детали показа</h2>
                  <div className="space-y-2">
                    <p>
                      <strong>Объект:</strong> {selectedBooking.property.rooms} кв, {selectedBooking.property.total_area} м²,{' '}
                      {selectedBooking.property.floor} этаж, {selectedBooking.property.district}, {selectedBooking.property.address}
                    </p>
                    <p>
                      <strong>Агент:</strong> {selectedBooking.agent.name}
                    </p>
                    <p>
                      <strong>Клиент:</strong> {selectedBooking.client_name},{' '}
                      <a href={`tel:${selectedBooking.client_phone}`}>📞 {selectedBooking.client_phone}</a>
                    </p>
                    <p>
                      <strong>Время:</strong> {selectedBooking.start_time} — {selectedBooking.end_time}
                    </p>
                    <p>
                      <strong>Комментарий:</strong> {selectedBooking.note}
                    </p>
                    <p>
                      <strong>Статус:</strong> {selectedBooking.status}
                    </p>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded" onClick={() => setDetailsOpen(false)}>
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <BookingsReport />
          </div>
        )}
      </div>
    </>
  );
}
