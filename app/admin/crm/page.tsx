'use client';

import { ChangeEvent, CSSProperties, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Copy,
  ExternalLink,
  GripVertical,
  Mail,
  Phone,
  Plus,
  Search,
  Settings2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useProfile } from '@/services/login/hooks';
import { useUsers } from '@/services/users/hooks';
import {
  useCreateCrmStage,
  useCrmRequest,
  useCrmRequests,
  useCrmStages,
  useDeleteCrmStage,
  useMoveCrmRequest,
  useReorderCrmStages,
  useUpdateCrmRequest,
  useUpdateCrmStage,
} from '@/services/crm/hooks';
import type {
  CreateCrmStagePayload,
  CrmRequestItem,
  CrmRequestPriority,
  CrmRequestType,
  CrmRequestsFilters,
  CrmStage,
  UpdateCrmStagePayload,
} from '@/services/crm/types';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

type BoardState = {
  stageOrder: number[];
  stagesById: Record<number, CrmStage>;
  cardsByStage: Record<number, CrmRequestItem[]>;
  countsByStage: Record<number, number>;
};

type StageFormState = {
  id?: number;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  is_terminal: boolean;
};

const DEFAULT_STAGE_COLOR = '#D7E4FF';

const REQUEST_TYPE_LABELS: Record<CrmRequestType, string> = {
  lead_request: 'Лид',
  showing_request: 'Показ',
  selection_event: 'Подбор',
};

const PRIORITY_LABELS: Record<CrmRequestPriority, string> = {
  low: 'Низкий',
  normal: 'Нормальный',
  high: 'Высокий',
};

const PRIORITY_BADGE_STYLES: Record<CrmRequestPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-50 text-blue-700',
  high: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const EMPTY_STAGE_FORM: StageFormState = {
  name: '',
  slug: '',
  color: DEFAULT_STAGE_COLOR,
  is_active: true,
  is_terminal: false,
};

function stageDragId(id: number) {
  return `stage-${id}`;
}

function cardDragId(id: number) {
  return `card-${id}`;
}

function readDragId(value: UniqueIdentifier | null | undefined) {
  if (!value) return null;
  const [kind, rawId] = String(value).split('-');
  const id = Number(rawId);

  if (!kind || Number.isNaN(id)) return null;
  if (kind !== 'stage' && kind !== 'card') return null;

  return { kind, id };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function cloneBoard(board: BoardState): BoardState {
  return {
    stageOrder: [...board.stageOrder],
    stagesById: { ...board.stagesById },
    cardsByStage: Object.fromEntries(
      Object.entries(board.cardsByStage).map(([stageId, cards]) => [Number(stageId), [...cards]])
    ),
    countsByStage: { ...board.countsByStage },
  };
}

function createBoardState(stages: CrmStage[], requests?: CrmRequestItem[], countStages?: CrmStage[]): BoardState {
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const stageOrder = sortedStages.map((stage) => stage.id);
  const stagesById = Object.fromEntries(sortedStages.map((stage) => [stage.id, stage]));
  const cardsByStage: Record<number, CrmRequestItem[]> = {};
  const countsByStage: Record<number, number> = {};
  const countMap = new Map((countStages ?? stages).map((stage) => [stage.id, stage.requests_count]));

  for (const stage of sortedStages) {
    cardsByStage[stage.id] = [];
    countsByStage[stage.id] = countMap.get(stage.id) ?? 0;
  }

  for (const request of requests ?? []) {
    const stageId = request.stage_id;
    if (!stageId || !cardsByStage[stageId]) continue;
    cardsByStage[stageId].push(request);
  }

  for (const stageId of stageOrder) {
    cardsByStage[stageId].sort((a, b) => {
      const posA = a.stage_position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.stage_position ?? Number.MAX_SAFE_INTEGER;
      if (posA !== posB) return posA - posB;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }

  return { stageOrder, stagesById, cardsByStage, countsByStage };
}

function locateCard(board: BoardState, cardId: number) {
  for (const stageId of board.stageOrder) {
    const index = board.cardsByStage[stageId].findIndex((item) => item.id === cardId);
    if (index !== -1) return { stageId, index };
  }
  return null;
}

function moveCard(board: BoardState, cardId: number, toStageId: number, targetIndex: number) {
  const source = locateCard(board, cardId);
  if (!source) return board;

  const next = cloneBoard(board);
  const sourceCards = [...next.cardsByStage[source.stageId]];
  const [card] = sourceCards.splice(source.index, 1);

  if (!card) return board;

  if (!next.cardsByStage[toStageId]) return board;

  next.cardsByStage[source.stageId] = sourceCards;

  const targetCards = source.stageId === toStageId ? sourceCards : [...next.cardsByStage[toStageId]];
  const boundedIndex = Math.max(0, Math.min(targetIndex, targetCards.length));
  const adjustedIndex =
    source.stageId === toStageId && source.index < boundedIndex ? Math.max(0, boundedIndex - 1) : boundedIndex;
  targetCards.splice(boundedIndex, 0, {
    ...card,
    stage_id: toStageId,
    stage: next.stagesById[toStageId] ?? card.stage,
  });
  if (adjustedIndex !== boundedIndex) {
    const [movedCard] = targetCards.splice(boundedIndex, 1);
    targetCards.splice(adjustedIndex, 0, movedCard);
  }
  next.cardsByStage[toStageId] = targetCards;

  if (source.stageId !== toStageId) {
    next.countsByStage[source.stageId] = Math.max(0, (next.countsByStage[source.stageId] ?? 1) - 1);
    next.countsByStage[toStageId] = (next.countsByStage[toStageId] ?? 0) + 1;
  }

  return next;
}

function mergeRequestIntoBoard(board: BoardState, request: CrmRequestItem) {
  const next = cloneBoard(board);
  const current = locateCard(next, request.id);

  if (current) {
    next.cardsByStage[current.stageId] = next.cardsByStage[current.stageId].filter((item) => item.id !== request.id);
    if (current.stageId !== request.stage_id) {
      next.countsByStage[current.stageId] = Math.max(0, (next.countsByStage[current.stageId] ?? 1) - 1);
    }
  }

  if (!request.stage_id || !next.cardsByStage[request.stage_id]) return next;

  const insertIndex = request.stage_position ? Math.max(0, request.stage_position - 1) : next.cardsByStage[request.stage_id].length;
  const target = [...next.cardsByStage[request.stage_id]];
  target.splice(insertIndex, 0, {
    ...request,
    stage: next.stagesById[request.stage_id] ?? request.stage,
  });
  next.cardsByStage[request.stage_id] = target;

  if (!current || current.stageId !== request.stage_id) {
    next.countsByStage[request.stage_id] = (next.countsByStage[request.stage_id] ?? 0) + 1;
  }

  return next;
}

function getStageCount(board: BoardState) {
  return board.stageOrder.reduce((sum, stageId) => sum + (board.countsByStage[stageId] ?? 0), 0);
}

function getVisibleCardCount(board: BoardState) {
  return board.stageOrder.reduce((sum, stageId) => sum + board.cardsByStage[stageId].length, 0);
}

function toWhatsappHref(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

function serializeJson(value: unknown) {
  if (!value) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function stageChipStyle(color?: string | null) {
  return {
    backgroundColor: color ? `${color}22` : '#E8EEF9',
    color: '#0F172A',
    borderColor: color ? `${color}66` : '#C7D2E5',
  };
}

function RequestCard({
  request,
  stage,
  onOpen,
  onAssignToMe,
  sortable = true,
}: {
  request: CrmRequestItem;
  stage?: CrmStage;
  onOpen: (requestId: number) => void;
  onAssignToMe: (request: CrmRequestItem) => void;
  sortable?: boolean;
}) {
  const sortableApi = useSortable({
    id: cardDragId(request.id),
    disabled: !sortable,
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortableApi;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mainDate = request.last_event_at || request.created_at;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(request.id)}
      className={clsx(
        'rounded-2xl border bg-white p-4 shadow-sm transition cursor-pointer',
        request.priority === 'high'
          ? 'border-rose-200 shadow-rose-100/70'
          : 'border-slate-200 hover:border-slate-300',
        isDragging && 'opacity-60 shadow-lg'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx('rounded-full px-2.5 py-1 text-[11px] font-medium', PRIORITY_BADGE_STYLES[request.priority])}>
              {PRIORITY_LABELS[request.priority]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              {REQUEST_TYPE_LABELS[request.type]}
            </span>
            {stage && (
              <span
                className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                style={stageChipStyle(stage.color)}
              >
                {stage.name}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{request.title || request.service_type || 'Без названия'}</h3>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <div className="font-medium text-slate-900">{request.name || 'Контакт не указан'}</div>
        <div>{request.phone || 'Телефон не указан'}</div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{request.source || request.channel || 'Источник не указан'}</span>
          <span className="shrink-0 text-xs text-slate-500">{formatDate(mainDate)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">Ответственный</div>
          <div className="truncate text-sm font-medium text-slate-900">{request.assignee?.name || 'Не назначен'}</div>
        </div>
        {!request.assigned_to && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAssignToMe(request);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0036A5] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#002d72]"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Взять в работу
          </button>
        )}
      </div>
    </article>
  );
}

function StageColumn({
  stage,
  items,
  onOpenRequest,
  onAssignToMe,
}: {
  stage: CrmStage;
  items: CrmRequestItem[];
  onOpenRequest: (requestId: number) => void;
  onAssignToMe: (request: CrmRequestItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stageDragId(stage.id),
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex h-full min-h-[560px] w-[320px] shrink-0 flex-col rounded-[28px] border border-slate-200 bg-slate-50/90',
        isDragging && 'opacity-70'
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || DEFAULT_STAGE_COLOR }} />
            <h2 className="truncate text-sm font-semibold text-slate-900">{stage.name}</h2>
            {stage.is_terminal && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                Terminal
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{items.length} на доске</span>
            <span>•</span>
            <span>{stage.requests_count} всего</span>
            {!stage.is_active && (
              <>
                <span>•</span>
                <span className="text-amber-700">Выключена</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
          aria-label={`Переместить стадию ${stage.name}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <SortableContext items={items.map((item) => cardDragId(item.id))} strategy={rectSortingStrategy}>
          {items.map((item) => (
            <RequestCard
              key={item.id}
              request={item}
              stage={stage}
              onOpen={onOpenRequest}
              onAssignToMe={onAssignToMe}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-sm text-slate-500">
            В этой стадии пока нет заявок
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminCrmPage() {
  const { data: user } = useProfile();
  const { data: users } = useUsers();
  const [filters, setFilters] = useState({
    stageId: '',
    type: '',
    priority: '',
    assignedTo: '',
    unassigned: false,
    search: '',
  });
  const deferredSearch = useDeferredValue(filters.search);
  const [board, setBoard] = useState<BoardState>(() => createBoardState([]));
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isStagesPanelOpen, setIsStagesPanelOpen] = useState(false);
  const [stageForm, setStageForm] = useState<StageFormState>(EMPTY_STAGE_FORM);
  const [detailDraft, setDetailDraft] = useState({
    stage_id: '',
    priority: 'normal' as CrmRequestPriority,
    assigned_to: '',
    internal_note: '',
  });
  const snapshotRef = useRef<BoardState | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const stageFilters = useMemo<CrmRequestsFilters>(
    () => ({
      stage_id: filters.stageId ? Number(filters.stageId) : undefined,
      type: filters.type ? (filters.type as CrmRequestType) : undefined,
      priority: filters.priority ? (filters.priority as CrmRequestPriority) : undefined,
      assigned_to: filters.unassigned
        ? undefined
        : filters.assignedTo === 'me'
          ? 'me'
          : filters.assignedTo
            ? Number(filters.assignedTo)
            : undefined,
      unassigned: filters.unassigned ? 1 : undefined,
      search: deferredSearch.trim() || undefined,
      per_page: 200,
    }),
    [deferredSearch, filters.assignedTo, filters.priority, filters.stageId, filters.type, filters.unassigned]
  );

  const stagesQuery = useCrmStages();
  const requestsQuery = useCrmRequests(stageFilters, Boolean(stagesQuery.data));
  const requestDetailQuery = useCrmRequest(selectedRequestId ?? undefined);
  const updateRequest = useUpdateCrmRequest();
  const moveRequest = useMoveCrmRequest();
  const createStage = useCreateCrmStage();
  const updateStage = useUpdateCrmStage();
  const deleteStage = useDeleteCrmStage();
  const reorderStages = useReorderCrmStages();

  const moderators = useMemo(
    () =>
      (users ?? []).filter((candidate) =>
        ['moderator', 'admin', 'superadmin'].includes(candidate.role?.slug ?? '')
      ),
    [users]
  );

  useEffect(() => {
    if (!stagesQuery.data || !requestsQuery.data || activeDragId) return;

    const next = createBoardState(
      stagesQuery.data,
      requestsQuery.data.items.data,
      stagesQuery.data
    );
    setBoard(next);
  }, [activeDragId, requestsQuery.data, stagesQuery.data]);

  useEffect(() => {
    const detail = requestDetailQuery.data;
    if (!detail) return;

    setDetailDraft({
      stage_id: detail.stage_id ? String(detail.stage_id) : '',
      priority: detail.priority,
      assigned_to: detail.assigned_to ? String(detail.assigned_to) : '',
      internal_note: detail.internal_note ?? '',
    });
  }, [requestDetailQuery.data]);

  const activeDragRequest = useMemo(() => {
    const parsed = readDragId(activeDragId);
    if (!parsed || parsed.kind !== 'card') return null;

    for (const stageId of board.stageOrder) {
      const item = board.cardsByStage[stageId].find((card) => card.id === parsed.id);
      if (item) return item;
    }

    return null;
  }, [activeDragId, board]);

  const totalRequests = getStageCount(board);
  const visibleRequests = getVisibleCardCount(board);
  const boardHasCards = visibleRequests > 0;
  const hasSearch = Boolean(stageFilters.search);

  const openCreateStage = () => {
    setStageForm(EMPTY_STAGE_FORM);
  };

  const openEditStage = (stage: CrmStage) => {
    setStageForm({
      id: stage.id,
      name: stage.name,
      slug: stage.slug ?? '',
      color: stage.color || DEFAULT_STAGE_COLOR,
      is_active: stage.is_active,
      is_terminal: stage.is_terminal,
    });
  };

  const handleFiltersChange =
    (field: keyof typeof filters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = event.target;
      setFilters((current) => ({
        ...current,
        [field]: target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value,
      }));
    };

  const handleAssignToMe = async (request: CrmRequestItem) => {
    if (!user?.id) return;

    try {
      const updated = await updateRequest.mutateAsync({ id: request.id, assigned_to: user.id });
      setBoard((current) => mergeRequestIntoBoard(current, updated));
      toast.success('Заявка назначена на вас');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось назначить заявку');
    }
  };

  const handleDetailSave = async () => {
    if (!selectedRequestId) return;

    try {
      const updated = await updateRequest.mutateAsync({
        id: selectedRequestId,
        stage_id: detailDraft.stage_id ? Number(detailDraft.stage_id) : undefined,
        priority: detailDraft.priority,
        assigned_to: detailDraft.assigned_to ? Number(detailDraft.assigned_to) : null,
        internal_note: detailDraft.internal_note,
      });
      setBoard((current) => mergeRequestIntoBoard(current, updated));
      toast.success('Изменения сохранены');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось сохранить заявку');
    }
  };

  const handleStageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stageForm.name.trim()) {
      toast.error('Укажите название стадии');
      return;
    }

    try {
      if (stageForm.id) {
        const payload: UpdateCrmStagePayload = {
          name: stageForm.name.trim(),
          slug: stageForm.slug.trim() || undefined,
          color: stageForm.color || undefined,
          is_active: stageForm.is_active,
          is_terminal: stageForm.is_terminal,
        };
        await updateStage.mutateAsync({ id: stageForm.id, ...payload });
        toast.success('Стадия обновлена');
      } else {
        const payload: CreateCrmStagePayload = {
          name: stageForm.name.trim(),
          slug: stageForm.slug.trim() || undefined,
          color: stageForm.color || undefined,
          is_active: stageForm.is_active,
          is_terminal: stageForm.is_terminal,
        };
        await createStage.mutateAsync(payload);
        toast.success('Стадия создана');
      }
      setStageForm(EMPTY_STAGE_FORM);
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось сохранить стадию');
    }
  };

  const handleDeleteStage = async (stage: CrmStage) => {
    if ((board.countsByStage[stage.id] ?? stage.requests_count) > 0) {
      toast.error('Нельзя удалить стадию, пока в ней есть заявки');
      return;
    }

    if (!window.confirm(`Удалить стадию «${stage.name}»?`)) return;

    try {
      await deleteStage.mutateAsync(stage.id);
      if (stageForm.id === stage.id) setStageForm(EMPTY_STAGE_FORM);
      toast.success('Стадия удалена');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось удалить стадию');
    }
  };

  const handleCopy = async (value?: string | null, successMessage = 'Скопировано') => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    snapshotRef.current = cloneBoard(board);
    setActiveDragId(event.active.id);
  };

  const handleDragCancel = () => {
    if (snapshotRef.current) setBoard(snapshotRef.current);
    snapshotRef.current = null;
    setActiveDragId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const active = readDragId(event.active.id);
    const over = readDragId(event.over?.id);

    if (!active || !over || active.kind !== 'card') return;

    setBoard((current) => {
      const source = locateCard(current, active.id);
      if (!source) return current;

      if (over.kind === 'stage') {
        if (source.stageId === over.id) return current;
        return moveCard(current, active.id, over.id, current.cardsByStage[over.id]?.length ?? 0);
      }

      const target = locateCard(current, over.id);
      if (!target) return current;
      if (source.stageId === target.stageId && source.index === target.index) return current;

      return moveCard(current, active.id, target.stageId, target.index);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const active = readDragId(event.active.id);
    const snapshot = snapshotRef.current;
    snapshotRef.current = null;
    setActiveDragId(null);

    if (!active || !snapshot) return;

    if (active.kind === 'stage') {
      const over = readDragId(event.over?.id);
      if (!over || over.kind !== 'stage') {
        setBoard(snapshot);
        return;
      }

      const oldIndex = board.stageOrder.indexOf(active.id);
      const newIndex = board.stageOrder.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const nextOrder = arrayMove(board.stageOrder, oldIndex, newIndex);
      setBoard((current) => ({ ...current, stageOrder: nextOrder }));

      try {
        await reorderStages.mutateAsync({ stage_ids: nextOrder });
        toast.success('Порядок стадий обновлён');
      } catch (error) {
        setBoard(snapshot);
        showAxiosErrorToast(error, 'Не удалось сохранить порядок стадий');
      }
      return;
    }

    const before = locateCard(snapshot, active.id);
    const after = locateCard(board, active.id);

    if (!before || !after) {
      setBoard(snapshot);
      return;
    }

    if (before.stageId === after.stageId && before.index === after.index) return;

    try {
      const updated = await moveRequest.mutateAsync({
        id: active.id,
        stage_id: after.stageId,
        position: after.index + 1,
      });
      setBoard((current) => mergeRequestIntoBoard(current, updated));
    } catch (error) {
      setBoard(snapshot);
      showAxiosErrorToast(error, 'Не удалось переместить заявку');
    }
  };

  if (stagesQuery.isLoading && !stagesQuery.data) {
    return <div className="p-6 text-gray-500">Загрузка CRM…</div>;
  }

  if (requestsQuery.isLoading && !requestsQuery.data) {
    return <div className="p-6 text-gray-500">Загрузка заявок…</div>;
  }

  if (stagesQuery.error || requestsQuery.error) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5" />
            Ошибка загрузки CRM
          </div>
          <p className="text-sm">Не удалось получить стадии или заявки. Обновите страницу или повторите позже.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-[#0036A5]">
              <BriefcaseBusiness className="h-4 w-4" />
              CRM модуль
            </div>
            <h1 className="text-2xl font-semibold text-slate-950 md:text-3xl">Kanban заявок</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Основной режим CRM: все заявки распределены по стадиям, карточки и колонки можно перетаскивать без перезагрузки страницы.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-wide text-slate-400">На доске</div>
              <div className="text-lg font-semibold text-slate-900">{visibleRequests}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-wide text-slate-400">Всего заявок</div>
              <div className="text-lg font-semibold text-slate-900">{totalRequests}</div>
            </div>
            <button
              type="button"
              onClick={() => setIsStagesPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <Settings2 className="h-4 w-4" />
              Стадии
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Стадия</span>
            <select
              value={filters.stageId}
              onChange={handleFiltersChange('stageId')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
            >
              <option value="">Все стадии</option>
              {board.stageOrder.map((stageId) => (
                <option key={stageId} value={stageId}>
                  {board.stagesById[stageId]?.name || `Стадия #${stageId}`}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Тип</span>
            <select
              value={filters.type}
              onChange={handleFiltersChange('type')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
            >
              <option value="">Все типы</option>
              {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Приоритет</span>
            <select
              value={filters.priority}
              onChange={handleFiltersChange('priority')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
            >
              <option value="">Любой</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ответственный</span>
            <select
              value={filters.assignedTo}
              onChange={handleFiltersChange('assignedTo')}
              disabled={filters.unassigned}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5] disabled:bg-slate-100"
            >
              <option value="">Все</option>
              <option value="me">Только мои</option>
              {moderators.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end">
            <span className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.unassigned}
                onChange={handleFiltersChange('unassigned')}
                className="h-4 w-4 rounded border-slate-300 text-[#0036A5] focus:ring-[#0036A5]"
              />
              Только без ответственного
            </span>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Поиск</span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={filters.search}
                onChange={handleFiltersChange('search')}
                placeholder="Имя, телефон, источник, заголовок"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </label>
        </div>
      </section>

      {!boardHasCards && (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <div className="mx-auto max-w-xl space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Search className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {hasSearch ? 'Поиск не дал результатов' : 'На доске пока нет заявок'}
            </h2>
            <p className="text-sm text-slate-500">
              {hasSearch
                ? 'Сбросьте часть фильтров или уточните запрос, чтобы увидеть карточки на доске.'
                : 'Стадии уже доступны, карточки появятся здесь сразу после прихода заявок из backend CRM.'}
            </p>
          </div>
        </section>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={board.stageOrder.map((stageId) => stageDragId(stageId))} strategy={horizontalListSortingStrategy}>
          <section className="overflow-x-auto pb-2">
            <div className="flex min-h-[60vh] gap-4">
              {board.stageOrder.map((stageId) => {
                const stage = board.stagesById[stageId];
                if (!stage) return null;

                return (
                  <StageColumn
                    key={stageId}
                    stage={{ ...stage, requests_count: board.countsByStage[stageId] ?? stage.requests_count }}
                    items={board.cardsByStage[stageId] ?? []}
                    onOpenRequest={setSelectedRequestId}
                    onAssignToMe={handleAssignToMe}
                  />
                );
              })}
            </div>
          </section>
        </SortableContext>

        <DragOverlay>
          {activeDragRequest ? (
            <div className="w-[320px] rotate-1">
              <RequestCard
                request={activeDragRequest}
                stage={activeDragRequest.stage || (activeDragRequest.stage_id ? board.stagesById[activeDragRequest.stage_id] : undefined)}
                onOpen={() => undefined}
                onAssignToMe={() => undefined}
                sortable={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {requestsQuery.isFetching && (
        <div className="fixed bottom-5 right-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          Обновляем доску…
        </div>
      )}

      {selectedRequestId && (
        <>
          <button
            type="button"
            onClick={() => setSelectedRequestId(null)}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
            aria-label="Закрыть деталку заявки"
          />

          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">CRM заявка</div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {requestDetailQuery.data?.title || requestDetailQuery.data?.service_type || `#${selectedRequestId}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestId(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {requestDetailQuery.isLoading && !requestDetailQuery.data && <div className="text-sm text-slate-500">Загрузка заявки…</div>}

              {requestDetailQuery.data && (
                <div className="space-y-6">
                  <section className="grid gap-4 rounded-[24px] bg-slate-50 p-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Контакт</div>
                      <div className="text-sm font-medium text-slate-900">{requestDetailQuery.data.name || 'Без имени'}</div>
                      <div className="text-sm text-slate-600">{requestDetailQuery.data.phone || 'Телефон не указан'}</div>
                      {requestDetailQuery.data.email && (
                        <div className="text-sm text-slate-600">{requestDetailQuery.data.email}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Быстрые действия</div>
                      <div className="flex flex-wrap gap-2">
                        {requestDetailQuery.data.phone && (
                          <a
                            href={`tel:${requestDetailQuery.data.phone}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                          >
                            <Phone className="h-4 w-4" />
                            Позвонить
                          </a>
                        )}
                        {requestDetailQuery.data.phone && (
                          <button
                            type="button"
                            onClick={() => handleCopy(requestDetailQuery.data?.phone, 'Телефон скопирован')}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                          >
                            <Copy className="h-4 w-4" />
                            Копировать
                          </button>
                        )}
                        {toWhatsappHref(requestDetailQuery.data.phone) && (
                          <a
                            href={toWhatsappHref(requestDetailQuery.data.phone) ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                          >
                            <Users className="h-4 w-4" />
                            WhatsApp
                          </a>
                        )}
                        {requestDetailQuery.data.email && (
                          <a
                            href={`mailto:${requestDetailQuery.data.email}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Стадия</span>
                      <select
                        value={detailDraft.stage_id}
                        onChange={(event) => setDetailDraft((current) => ({ ...current, stage_id: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
                      >
                        <option value="">Без стадии</option>
                        {board.stageOrder.map((stageId) => (
                          <option key={stageId} value={stageId}>
                            {board.stagesById[stageId]?.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Приоритет</span>
                      <select
                        value={detailDraft.priority}
                        onChange={(event) =>
                          setDetailDraft((current) => ({
                            ...current,
                            priority: event.target.value as CrmRequestPriority,
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
                      >
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ответственный</span>
                      <select
                        value={detailDraft.assigned_to}
                        onChange={(event) => setDetailDraft((current) => ({ ...current, assigned_to: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
                      >
                        <option value="">Не назначен</option>
                        {moderators.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Быстрое действие</span>
                      <button
                        type="button"
                        onClick={() => handleAssignToMe(requestDetailQuery.data)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#0036A5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#002d72]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Взять в работу
                      </button>
                    </div>
                  </section>

                  <section className="space-y-4 rounded-[24px] border border-slate-200 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoItem label="Тип" value={REQUEST_TYPE_LABELS[requestDetailQuery.data.type]} />
                      <InfoItem label="Статус" value={requestDetailQuery.data.status} />
                      <InfoItem label="Источник" value={requestDetailQuery.data.source || '—'} />
                      <InfoItem label="Ссылка на источник" value={requestDetailQuery.data.source_url || '—'} />
                      <InfoItem label="Создано" value={formatDate(requestDetailQuery.data.created_at)} />
                      <InfoItem label="Последнее событие" value={formatDate(requestDetailQuery.data.last_event_at)} />
                    </div>

                    {requestDetailQuery.data.comment && (
                      <div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Комментарий клиента</div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{requestDetailQuery.data.comment}</div>
                      </div>
                    )}

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Internal note</span>
                      <textarea
                        value={detailDraft.internal_note}
                        onChange={(event) =>
                          setDetailDraft((current) => ({
                            ...current,
                            internal_note: event.target.value,
                          }))
                        }
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
                        placeholder="Заметки для модераторов"
                      />
                    </label>
                  </section>

                  <section className="space-y-4 rounded-[24px] border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Связанные сущности</div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Объект</div>
                        {requestDetailQuery.data.property_id ? (
                          <Link
                            href={`/profile/edit-post/${requestDetailQuery.data.property_id}`}
                            className="inline-flex items-center gap-2 font-medium text-[#0036A5]"
                          >
                            Объект #{requestDetailQuery.data.property_id}
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        ) : (
                          'Не привязан'
                        )}
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Подбор / booking</div>
                        <div>Selection: {requestDetailQuery.data.selection?.id || requestDetailQuery.data.selection_id || '—'}</div>
                        <div>Booking: {requestDetailQuery.data.booking?.id || requestDetailQuery.data.booking_id || '—'}</div>
                      </div>
                    </div>

                    {(requestDetailQuery.data.type === 'showing_request' || requestDetailQuery.data.type === 'selection_event') &&
                      requestDetailQuery.data.property_id && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          Для этой заявки доступна ссылка на объект:
                          {' '}
                          <Link href={`/profile/edit-post/${requestDetailQuery.data.property_id}`} className="font-semibold underline">
                            открыть объект #{requestDetailQuery.data.property_id}
                          </Link>
                        </div>
                      )}
                  </section>

                  <section className="grid gap-4 lg:grid-cols-2">
                    <JsonBlock title="Context" value={requestDetailQuery.data.context} />
                    <JsonBlock title="Payload" value={requestDetailQuery.data.payload} />
                  </section>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <div className="text-sm text-slate-500">Изменения сохраняются через CRM API без перезагрузки страницы.</div>
              <button
                type="button"
                onClick={handleDetailSave}
                disabled={updateRequest.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0036A5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#002d72] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {updateRequest.isPending ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </aside>
        </>
      )}

      {isStagesPanelOpen && (
        <>
          <button
            type="button"
            onClick={() => setIsStagesPanelOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/25"
            aria-label="Закрыть управление стадиями"
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[620px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Настройки CRM</div>
                <h2 className="text-lg font-semibold text-slate-950">Управление стадиями</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsStagesPanelOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto px-5 py-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Существующие стадии</h3>
                  <button
                    type="button"
                    onClick={openCreateStage}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                    Новая стадия
                  </button>
                </div>

                <div className="space-y-3">
                  {board.stageOrder.map((stageId, index) => {
                    const stage = board.stagesById[stageId];
                    if (!stage) return null;

                    return (
                      <article key={stage.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || DEFAULT_STAGE_COLOR }} />
                              <div className="font-medium text-slate-900">{stage.name}</div>
                              {stage.is_terminal && (
                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                                  Terminal
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              Позиция {index + 1} • {board.countsByStage[stage.id] ?? stage.requests_count} заявок
                            </div>
                            <div className="text-xs text-slate-500">Slug: {stage.slug || '—'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditStage(stage)}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                            >
                              Изменить
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStage(stage)}
                              className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Форма стадии</div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {stageForm.id ? 'Редактирование стадии' : 'Создание новой стадии'}
                    </h3>
                  </div>
                  {stageForm.id && (
                    <button
                      type="button"
                      onClick={openCreateStage}
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      Сбросить
                    </button>
                  )}
                </div>

                <form onSubmit={handleStageSubmit} className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Название</span>
                    <input
                      value={stageForm.name}
                      onChange={(event) => setStageForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
                      placeholder="Например, В работе"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Slug</span>
                    <input
                      value={stageForm.slug}
                      onChange={(event) => setStageForm((current) => ({ ...current, slug: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0036A5]"
                      placeholder="crm-in-progress"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Цвет</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <input
                        type="color"
                        value={stageForm.color}
                        onChange={(event) => setStageForm((current) => ({ ...current, color: event.target.value }))}
                        className="h-10 w-14 rounded-lg border-0 bg-transparent p-0"
                      />
                      <span className="text-sm text-slate-600">{stageForm.color}</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={stageForm.is_active}
                      onChange={(event) => setStageForm((current) => ({ ...current, is_active: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#0036A5] focus:ring-[#0036A5]"
                    />
                    Стадия активна
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={stageForm.is_terminal}
                      onChange={(event) => setStageForm((current) => ({ ...current, is_terminal: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-[#0036A5] focus:ring-[#0036A5]"
                    />
                    Terminal stage
                  </label>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    Порядок колонок меняется прямо на kanban-доске drag-and-drop. Здесь вы управляете CRUD и флагами стадии.
                  </div>

                  <button
                    type="submit"
                    disabled={createStage.isPending || updateStage.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0036A5] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#002d72] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {createStage.isPending || updateStage.isPending ? 'Сохраняем…' : stageForm.id ? 'Сохранить стадию' : 'Создать стадию'}
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-[24px] border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <AlertCircle className="h-4 w-4 text-slate-400" />
        {title}
      </div>
      <pre className="max-h-[320px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
        {serializeJson(value)}
      </pre>
    </div>
  );
}
