'use client';

import {useGetAgentsQuery} from '@/services/users/hooks';

import {FC, useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {Property} from '@/services/properties/types';
import {toast} from 'react-toastify';
import {axios} from '@/utils/axios';
import {SelectToggle} from '@/ui-components/SelectToggle';
import {Input} from '@/ui-components/Input';
import {Listing} from "@/app/_components/top-listing/types";
import SafeHtml from "@/app/profile/edit-post/[id]/_components/SafeHtml";
import {UpdateModerationAndDealPayload} from "@/services/properties/deal";
import {isListingModeratorRole, RoleSlug} from '@/constants/roles';

interface ModerationModalProps {
    property: Listing | Property;
    onClose: () => void;
    onUpdated: (updated: Partial<Property>) => void;
    userRole: RoleSlug;
}

const STATUS_REQUIRING_COMMENT = ['sold', 'sold_by_owner', 'rented', 'denied', 'deleted'];
const STATUS_REQUIRING_DEAL = ['rented'];
const STATUS_REQUIRING_DEPOSIT = ['deposit'];

const ModerationModal: FC<ModerationModalProps> = ({
                                                       property,
                                                       onClose,
                                                       onUpdated,
                                                       userRole,
                                                   }) => {
    const [selectedListingType, setSelectedListingType] = useState(property.listing_type);
    const [selectedModerationStatus, setSelectedModerationStatus] = useState(property.moderation_status);
    const [statusComment, setStatusComment] = useState<string>((property as any).status_comment ?? '');
    const [actualSalePrice, setActualSalePrice] = useState('');
    const [companyCommission, setCompanyCommission] = useState('');
    const [moneyHolder, setMoneyHolder] = useState<string | ''>('');

    const [buyerFullName, setBuyerFullName] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');

    const [depositAmount, setDepositAmount] = useState('');
    const [depositCurrency, setDepositCurrency] = useState<'TJS' | 'USD'>('TJS');
    const [depositReceivedAt, setDepositReceivedAt] = useState('');
    const [depositTakenAt, setDepositTakenAt] = useState('');

    const [companyExpectedIncome, setCompanyExpectedIncome] = useState('');
    const [companyExpectedIncomeCurrency, setCompanyExpectedIncomeCurrency] =
        useState<'TJS' | 'USD'>('TJS');

    const [plannedContractSignedAt, setPlannedContractSignedAt] = useState('');
    const [loading, setLoading] = useState(false);
    const toDateInput = (value?: string | null) => {
        if (!value) return '';
        return value.split(' ')[0]; // YYYY-MM-DD
    };

    const isAdminUser = isListingModeratorRole(userRole);
    const isAgentUser = userRole === 'agent';
    const isAdminOrModerator = userRole === 'admin' || userRole === 'moderator';
    useEffect(() => {
        // ===== hydrate from backend =====
        setActualSalePrice(property.actual_sale_price?.toString() ?? '');
        setCompanyCommission(property.company_commission_amount?.toString() ?? '');
        setMoneyHolder(property.money_holder ?? '');

        setBuyerFullName(property.buyer_full_name ?? '');
        setBuyerPhone(property.buyer_phone ?? '');

        setDepositAmount(property.deposit_amount?.toString() ?? '');
        setDepositCurrency(property.deposit_currency ?? 'TJS');
        setDepositReceivedAt(toDateInput(property.deposit_received_at));
        setDepositTakenAt(toDateInput(property.deposit_taken_at));
        setPlannedContractSignedAt( toDateInput(property.planned_contract_signed_at));

        setCompanyExpectedIncome(
            property.company_expected_income?.toString() ?? ''
        );
        setCompanyExpectedIncomeCurrency(
            property.company_expected_income_currency ?? 'TJS'
        );


    }, [property]);

    const {data: agents = [], isLoading: agentsLoading} = useGetAgentsQuery();

    const [selectedAgents, setSelectedAgents] = useState<
        Array<{
            agent_id: number;
            role: 'main' | 'assistant' | 'partner';
            commission_amount?: string;
        }>
    >([]);

    // признак “vip/urgent”
    const isPromo = selectedListingType === 'vip' || selectedListingType === 'urgent';

    // если агент и объявление vip/urgent → запрет approved (и автосброс в pending)
    useEffect(() => {
        if (isAgentUser && isPromo && selectedModerationStatus === 'approved') {
            setSelectedModerationStatus('pending');
        }
    }, [isAgentUser, isPromo, selectedModerationStatus]);

    useEffect(() => {
        if (selectedModerationStatus === 'sold_by_owner') {
            setSelectedModerationStatus('sold');
        }
    }, [selectedModerationStatus]);

    const moderationOptions = ((): { id: string; name: string }[] => {
        const offerType = property.offer_type

        const base = [
            {id: 'pending', name: 'На модерации'},
            {id: 'approved', name: 'Одобрено'},
            {id: 'deposit', name: 'Залог'},
            // {id: 'rejected', name: 'Отклонено'},
            // {id: 'draft', name: 'Черновик'},
            {id: 'sold', name: 'Продано'},
            {id: 'rented', name: 'Арендовано'},
            {id: 'denied', name: 'Отказано клиентом'},
        ];

        // Добавляем 'deleted' только для админа
        if (isAdminUser) {
            base.push({id: 'deleted', name: 'Удалено'});
        }

        // агент + vip/urgent → убираем approved из списка
        if (isAgentUser && isPromo) {
            return base.filter(o => o.id !== 'approved');
        }

        // Фильтрация по типу оффера: если аренда — убираем статусы про продажу; если продажа — убираем статусы про аренду
        let list = base.slice();
        if (offerType === 'rent') {
            list = list.filter(s => s.id !== 'sold' && s.id !== 'sold_by_owner');
        } else if (offerType === 'sale') {
            list = list.filter(s => s.id !== 'rented');
        }

        if (isAdminOrModerator) {
            list = list.filter((option) => option.id !== 'deposit');
        }

        return list;
    })();

    useEffect(() => {
        if (isAgentUser && isPromo && selectedModerationStatus === 'approved') {
            setSelectedModerationStatus('pending');
        }
    }, [isAgentUser, isPromo, selectedModerationStatus]);

    const mustProvideComment = STATUS_REQUIRING_COMMENT.includes(selectedModerationStatus);
    const mustProvideDeal = STATUS_REQUIRING_DEAL.includes(selectedModerationStatus);
    const mustProvideDeposit = STATUS_REQUIRING_DEPOSIT.includes(selectedModerationStatus);

    // useEffect(() => {
    //     if (!mustProvideDeal) {
    //         setActualSalePrice('');
    //         setCompanyCommission('');
    //         setMoneyHolder('');
    //     }
    //
    //     if (!mustProvideDeposit) {
    //         setBuyerFullName('');
    //         setBuyerPhone('');
    //         setDepositAmount('');
    //         setDepositReceivedAt('');
    //         setDepositTakenAt('');
    //         setCompanyExpectedIncome('');
    //         setPlannedContractSignedAt('');
    //     }
    // }, [mustProvideDeal, mustProvideDeposit]);

    const handleSave = async () => {
        // клиентская валидация: если выбран статус, требующий комментарий — проверяем
        if (mustProvideComment && (!statusComment || statusComment.trim() === '')) {
            toast.error('Требуется комментарий при смене статуса.');
            return;
        }

        if (mustProvideDeposit) {
            if (Number(depositAmount) <= 0) {
                toast.error('Сумма залога должна быть больше 0');
                setLoading(false);
                return;
            }
            if (!buyerFullName.trim()) {
                toast.error('Укажите ФИО покупателя');
                return;
            }
            if (!buyerPhone.trim()) {
                toast.error('Укажите номер телефона покупателя');
                return;
            }
            if (!depositAmount) {
                toast.error('Укажите сумму залога');
                return;
            }
            if (!depositReceivedAt) {
                toast.error('Укажите дату получения залога');
                return;
            }
            if (!moneyHolder) {
                toast.error('Укажите, у кого находятся деньги');
                return;
            }
            if (!companyExpectedIncome || Number(companyExpectedIncome) < 0) {
                toast.error('Укажите ожидаемый доход компании');
                return;
            }
            if (!plannedContractSignedAt) {
                toast.error('Укажите планируемую дату договора');
                return;
            }
        }

        if (mustProvideDeal) {
            if (!actualSalePrice || Number(actualSalePrice) <= 0) {
                toast.error('Укажите фактическую сумму сделки');
                return;
            }

            if (!companyCommission || Number(companyCommission) < 0) {
                toast.error('Укажите комиссию компании (0 если без комиссии)');
                return;
            }

            if (!moneyHolder) {
                toast.error('Укажите, у кого находятся деньги');
                return;
            }

            if (selectedModerationStatus === 'sold' && selectedAgents.length === 0) {
                toast.error('Укажите хотя бы одного агента, участвующего в продаже');
                return;
            }
        }

        setLoading(true);
        try {
            const payload: UpdateModerationAndDealPayload = {
                moderation_status: selectedModerationStatus,
            };

            // админ может менять listing_type
            if (isAdminUser) {
                payload.listing_type = selectedListingType;
            }

            // оба (agent/admin) могут менять модерацию, но для агента с promo принудительно ставим pending
            if (isAdminUser || isAgentUser) {
                let nextStatus = selectedModerationStatus;

                // ВАЖНО: если агент и (vip/urgent), то серверу отправляем только pending
                const effectiveListingType = isAdminUser
                    ? selectedListingType
                    : property.listing_type; // агент не меняет listing_type в UI
                const promoForAgent =
                    isAgentUser && (effectiveListingType === 'vip' || effectiveListingType === 'urgent');

                if (promoForAgent) {
                    nextStatus = 'pending';
                }
                payload.moderation_status = nextStatus;
            }

            // отправляем комментарий если он есть или если выбран требующий комментарий статус
            if (statusComment && statusComment.trim() !== '') {
                payload.status_comment = statusComment.trim();
            } else if (mustProvideComment) {
                // сюда мы не должны попасть из-за проверки выше, но оставим на всякий случай
                payload.status_comment = '';
            }

            if (mustProvideDeposit) {
                payload.buyer_full_name = buyerFullName;
                payload.buyer_phone = buyerPhone;

                payload.deposit_amount = Number(depositAmount);
                payload.deposit_currency = depositCurrency;
                payload.deposit_received_at = depositReceivedAt;
                payload.deposit_taken_at = depositTakenAt || null;

                payload.money_holder = moneyHolder as any;

                payload.company_expected_income = Number(companyExpectedIncome);
                payload.company_expected_income_currency = companyExpectedIncomeCurrency;

                payload.planned_contract_signed_at = plannedContractSignedAt;
            }

            if (mustProvideDeal) {
                payload.actual_sale_price = Number(actualSalePrice);
                payload.actual_sale_currency = property.actual_sale_currency ?? 'TJS';

                payload.company_commission_amount = Number(companyCommission);
                payload.company_commission_currency = property.company_commission_currency ?? 'TJS';

                payload.money_holder = moneyHolder as any;

                payload.money_received_at = property.money_received_at ?? '';
                payload.contract_signed_at = property.contract_signed_at ?? '';

                if (selectedModerationStatus === 'sold') {
                    payload.agents = selectedAgents.map(a => ({
                        agent_id: a.agent_id,
                        role: a.role,
                        commission_amount: a.commission_amount
                            ? Number(a.commission_amount)
                            : null,
                    }));
                }
            }

            const response = await axios.patch(
                `/properties/${property.id}/moderation-listing`,
                payload
            );
            toast.success('Обновлено успешно!');
            onUpdated(response.data?.data ?? payload);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Ошибка при обновлении');
        } finally {
            setLoading(false);
        }
    };

    // ...ниже JSX
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div
                className={`bg-white p-6 rounded-xl w-full shadow-xl max-h-[90vh] overflow-y-auto ${
                    selectedModerationStatus === 'sold' ? 'max-w-3xl' : 'max-w-md'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Управление объявлением</h2>

                {(isAdminUser || isAgentUser) && (
                    <div className="mb-4">
                        <SelectToggle
                            title="Тип объявления"
                            options={[
                                {id: 'regular', name: 'Обычное'},
                                {id: 'vip', name: 'VIP'},
                                {id: 'urgent', name: 'Срочная продажа'},
                            ]}
                            selected={selectedListingType}
                            setSelected={setSelectedListingType}
                        />
                    </div>
                )}

                {(isAdminUser || isAgentUser) && (
                    <div className="mb-4">
                        <SelectToggle
                            title="Статус модерации"
                            options={moderationOptions}
                            selected={selectedModerationStatus}
                            setSelected={setSelectedModerationStatus}
                            disabled={isAgentUser && isPromo}
                        />
                        {/* Подсказка для агента при vip/urgent */}
                        {isAgentUser && isPromo && (
                            <p className="text-xs text-amber-600 mt-2">
                                Для VIP/Срочной продажи у агентов статус публикации всегда «На модерации».
                            </p>
                        )}
                    </div>
                )}

                <div className='mb-4'>
                    <SafeHtml html={property.rejection_comment} className="prose text-sm p-4 border rounded-2xl"/>
                </div>

                {/* Новое поле комментария статуса — показывается когда выбран статус, требующий комментарий */}
                {mustProvideComment && (
                    <div className="mb-4">
                        <Input
                            label="Причина смены статуса"
                            name="status_comment"
                            value={statusComment}
                            textarea
                            required
                            placeholder="Напишите причину изменения статуса..."
                            onChange={(e) => setStatusComment(e.target.value)}
                        />
                    </div>
                )}

                {mustProvideDeposit && (
                    <div className="mb-4 border rounded-xl p-4 bg-amber-50">
                        <h3 className="font-semibold mb-3">Данные залога (обязательно)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="ФИО покупателя"
                                name="buyer_full_name"
                                value={buyerFullName}
                                required
                                onChange={e => setBuyerFullName(e.target.value)}
                            />

                            <Input
                                label="Телефон покупателя"
                                name="buyer_phone"
                                value={buyerPhone}
                                required
                                onChange={e => setBuyerPhone(e.target.value)}
                            />

                            <Input
                                label="Сумма залога"
                                name="deposit_amount"
                                type="number"
                                value={depositAmount}
                                required
                                onChange={e => setDepositAmount(e.target.value)}
                            />

                            <Input
                                label="Дата получения залога"
                                name="deposit_received_at"
                                type="date"
                                value={depositReceivedAt}
                                required
                                onChange={e => setDepositReceivedAt(e.target.value)}
                            />
                            <Input
                                label="Планируемая дата договора"
                                name="planned_contract_signed_at"
                                type="date"
                                value={plannedContractSignedAt}
                                required
                                onChange={e => setPlannedContractSignedAt(e.target.value)}
                            />

                            <Input
                                label="Ожидаемый доход компании"
                                name="company_expected_income"
                                type="number"
                                value={companyExpectedIncome}
                                required
                                onChange={e => setCompanyExpectedIncome(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {mustProvideDeal && (
                    <div className="mb-4 border rounded-xl p-4 bg-gray-50">
                        <h3 className="font-semibold mb-3">Данные сделки (обязательно)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="mb-3">
                                <Input
                                    label="Фактическая сумма сделки"
                                    name="actual_sale_price"
                                    type="number"
                                    value={actualSalePrice}
                                    required
                                    onChange={e => setActualSalePrice(e.target.value)}
                                />
                            </div>

                            <div className="mb-3">
                                <Input
                                    label="Комиссия компании"
                                    name="company_commission_amount"
                                    type="number"
                                    value={companyCommission}
                                    required
                                    onChange={e => setCompanyCommission(e.target.value)}
                                />
                            </div>
                        </div>

                        {selectedModerationStatus === 'sold' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">
                                    Агенты, участвующие в продаже <span className="text-red-500">*</span>
                                </label>

                                {agentsLoading ? (
                                    <p className="text-sm text-gray-500">Загрузка агентов...</p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-white">
                                        {agents.map((agent: any) => {
                                            const selected = selectedAgents.find(a => a.agent_id === agent.id);

                                            return (
                                                <div key={agent.id} className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedAgents(prev => [
                                                                    ...prev,
                                                                    {agent_id: agent.id, role: 'assistant'},
                                                                ]);
                                                            } else {
                                                                setSelectedAgents(prev =>
                                                                    prev.filter(a => a.agent_id !== agent.id)
                                                                );
                                                            }
                                                        }}
                                                    />

                                                    <span className="flex-1">
                                                        {agent.name ?? agent.email}
                                                    </span>

                                                    {selected && (
                                                        <>
                                                            <select
                                                                value={selected.role}
                                                                onChange={(e) =>
                                                                    setSelectedAgents(prev =>
                                                                        prev.map(a =>
                                                                            a.agent_id === agent.id
                                                                                ? {...a, role: e.target.value as any}
                                                                                : a
                                                                        )
                                                                    )
                                                                }
                                                                className="border rounded px-1 py-0.5"
                                                            >
                                                                <option value="main">Главный</option>
                                                                <option value="assistant">Помощник</option>
                                                                <option value="partner">Партнёр</option>
                                                            </select>

                                                            <input
                                                                type="number"
                                                                placeholder="Комиссия"
                                                                value={selected.commission_amount ?? ''}
                                                                onChange={(e) =>
                                                                    setSelectedAgents(prev =>
                                                                        prev.map(a =>
                                                                            a.agent_id === agent.id
                                                                                ? {
                                                                                    ...a,
                                                                                    commission_amount: e.target.value
                                                                                }
                                                                                : a
                                                                        )
                                                                    )
                                                                }
                                                                className="w-24 border rounded px-2 py-0.5"
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {mustProvideDeposit && (
                    <div className="mt-4">
                        <label className="block text-sm mb-1 font-medium">
                            У кого находятся деньги <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={moneyHolder}
                            onChange={(e) => setMoneyHolder(e.target.value)}
                            className="w-full border rounded-lg p-2"
                            name="money_holder"
                            required
                        >
                            <option value="">— выберите —</option>
                            <option value="company">Компания</option>
                            <option value="agent">Агент</option>
                            <option value="owner">Владелец</option>
                            <option value="developer">Застройщик</option>
                            <option value="client">Клиент</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end space-x-2 mt-6">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        disabled={loading}
                        className="px-4 py-2 rounded bg-[#0036A5] text-white hover:bg-blue-700 transition disabled:opacity-70"
                    >
                        {loading ? 'Сохраняю...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModerationModal;
