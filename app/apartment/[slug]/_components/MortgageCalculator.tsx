'use client';

import {useEffect, useMemo, useState} from 'react';
import Image from "next/image";
import {FormInput} from '@/ui-components/FormInput';
import {SelectInput} from '@/ui-components/SelectInput';
import MortgageRequestModal, {MortgageRequestPayload} from './MortgageRequestModal';
import {InfoIcon} from "lucide-react";

const parseMoney = (v: string | number | undefined | null) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/[^\d.,]/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
};
const formatMoney = (n: number) =>
    new Intl.NumberFormat('ru-RU').format(Math.max(0, Math.round(n)));

type PaymentType = 'annuity' | 'differentiated';
type Frequency = 'monthly' | 'weekly';

interface MortgageCalculatorProps {
    id?: string;
    propertyPrice?: number | string; // можно прокинуть снаружи
}

/** Примеры банков — измените данные под реальные предложения */
const BANKS = [
    {id: 'alif', title: 'Alif Bank', logo: '/images/banks/alif.png', interestRate: 25, offerTermYears: 20},
    {id: 'eskhata', title: 'Eskhata', logo: '/images/banks/eskhata.png', interestRate: 24, offerTermYears: 15},
    {id: 'ibt', title: 'IBT', logo: '/images/banks/ibt.png', interestRate: 20, offerTermYears: 25},
    {id: 'amonat', title: 'Амонатбанк', logo: '/images/banks/amonat.svg', interestRate: 19, offerTermYears: 25},
    {id: 'spitamen', title: 'Спитаменбанк', logo: '/images/banks/spitamen.svg', interestRate: 24, offerTermYears: 25},
    {id: 'orien', title: 'Ориёнбанк', logo: '/images/banks/orien.svg', interestRate: 28, offerTermYears: 25},
];

function computePaymentForParams(P: number, annual: number, years: number, paymentType: PaymentType, paymentFrequency: Frequency) {
    const periods = paymentFrequency === 'monthly' ? 12 : 52;
    const n = Math.max(1, Math.round(years * periods));
    const r = annual / 100 / periods;

    let payment = 0;
    let totalInterest = 0;

    if (P <= 0 || annual < 0 || years <= 0) {
        return {payment: 0, totalInterest: 0};
    }

    if (paymentType === 'annuity') {
        if (r === 0) {
            payment = P / n;
            totalInterest = 0;
        } else {
            payment = (P * r) / (1 - Math.pow(1 + r, -n));
            totalInterest = payment * n - P;
        }
    } else {
        const principalPerPeriod = P / n;
        totalInterest = (P * r * (n + 1)) / 2;
        const firstInterest = P * r;
        payment = principalPerPeriod + firstInterest;
    }

    return {payment, totalInterest};
}

export default function MortgageCalculator({id, propertyPrice: propPrice}: MortgageCalculatorProps) {
    const initialPrice = useMemo(
        () => (propPrice !== undefined ? parseMoney(propPrice) : parseMoney('450 000')),
        [propPrice]
    );

    const [propertyPrice, setPropertyPrice] = useState<string>(formatMoney(initialPrice));
    const [initialDownPayment, setInitialDownPayment] = useState<string>(formatMoney(0)); // первоначальный взнос
    const [loanTerm, setLoanTerm] = useState<string>('3'); // годы
    const [paymentType] = useState<PaymentType>('annuity');
    const [paymentFrequency] = useState<Frequency>('monthly');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        setPropertyPrice(formatMoney(initialPrice));
    }, [initialPrice]);

    // Остаток кредита после первоначального взноса
    const principal = useMemo(() => {
        const P = parseMoney(propertyPrice);
        const down = parseMoney(initialDownPayment);
        return Math.max(0, P - down);
    }, [propertyPrice, initialDownPayment]);

    // Общий calc для MortgageResults (показывает расчёт по текущим полям: процент берем либо от выбранного банка либо поле ставки не показываем здесь потому что оставили минимальные поля)
    // Для минимального варианта мы оставляем MortgageResults отображаемым, но основной список банков справа содержит свои ставки/сроки.
    // const calc = useMemo(() => {
    //     const P = principal;
    //     // В calc используем среднюю/нулевую ставку — здесь оставим 0 чтобы MortgageResults можно было скрыть при желании.
    //     const annual = 0;
    //     const years = Number(loanTerm) || 0;
    //
    //     const {payment, totalInterest} = computePaymentForParams(P, annual, years, paymentType, paymentFrequency);
    //
    //     return {
    //         propertyPrice: `${formatMoney(parseMoney(propertyPrice))} с.`,
    //         interestRate: `—`,
    //         totalInterest: `${formatMoney(totalInterest)} с.`,
    //         monthlyPayment: `${formatMoney(payment)} с.`,
    //     };
    // }, [propertyPrice, principal, loanTerm, paymentType, paymentFrequency]);

    // payload для модалки сохранит входные параметры включая первоначальный взнос
    const modalPayload: MortgageRequestPayload = {
        propertyPrice: parseMoney(propertyPrice),
        interestRate: 0, // ставка определяется банком при отправке, здесь можно оставить 0 или выбранную ставку, если нужно — добавим
        loanTermYears: Number(loanTerm) || 0,
        paymentType,
        paymentFrequency,
        startDate: '', // дата выдачи удалена в упрощённой форме — оставляем пустую
        selectedBank,
        // @ts-expect-error — если ваша MortgageRequestPayload не включает downPayment, добавьте в интерфейс в модалке
        initialDownPayment: parseMoney(initialDownPayment),
    };

    // При выборе банка сохраним selectedBank (не меняем поля ввода — ставка показывается в карточке банка)
    const handleSelectBank = (bankId: string) => {
        setSelectedBank(bankId);
    };

    const P_input = parseMoney(propertyPrice);
    const down_input = parseMoney(initialDownPayment);

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 mt-10" id={id}>
                {/* ЛЕВАЯ КОЛОНКА: ~30% */}
                <div className="bg-white rounded-[18px] p-4 md:p-6 w-full lg:w-1/3 min-w-[260px] flex-shrink-0">
                    <h2 className="text-xl font-bold mb-4">Параметры</h2>

                    <div className="flex flex-col gap-4">
                        <FormInput
                            label="Стоимость недвижимости"
                            value={propertyPrice}
                            onChange={(value) => setPropertyPrice(formatMoney(parseMoney(value)))}
                            suffix="с."
                        />

                        <FormInput
                            label="Первоначальный взнос"
                            value={initialDownPayment}
                            onChange={(value) => setInitialDownPayment(formatMoney(parseMoney(value)))}
                            suffix="с."
                        />

                        <SelectInput
                            label="Срок (лет)"
                            value={loanTerm}
                            onChange={(value) => setLoanTerm(value)}
                            options={[
                                {id: '1', name: '1 год'},
                                {id: '2', name: '2 года'},
                                {id: '3', name: '3 года'},
                                {id: '4', name: '4 года'},
                                {id: '5', name: '5 лет'},
                                {id: '6', name: '6 лет'},
                                {id: '7', name: '7 лет'},
                                {id: '8', name: '8 лет'},
                                {id: '9', name: '9 лет'},
                                {id: '10', name: '10 лет'},
                                {id: '15', name: '15 лет'},
                                {id: '20', name: '20 лет'},
                                {id: '25', name: '25 лет'},
                            ]}
                        />

                        <button
                            onClick={() => setOpenModal(true)}
                            className="mt-2 w-full py-3 rounded-2xl bg-[#0036A5] text-white font-semibold hover:bg-blue-800 transition cursor-pointer"
                        >
                            Оставить заявку
                        </button>

                        <div className="text-xs text-gray-500 mt-3">
                            Остаток кредита: <span className="font-medium">{formatMoney(principal)} с.</span>
                            <div>Введённая цена: {formatMoney(P_input)} с., Взнос: {formatMoney(down_input)} с.</div>
                        </div>

                        <div className="text-sm text-gray-600">
                            <InfoIcon/>
                            В карточке банка показан расчёт ежемесячного платежа по предложенной ставке и предложенному
                            сроку банка.
                            Расчёт основан на остатке кредита (цена − первоначальный взнос). Нажмите «Оставить заявку»,
                            чтобы отправить заявку в выбранный банк.
                        </div>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА: ~70% список банков */}
                <div className="w-full lg:w-2/3 space-y-4">
                    <div
                        className="max-h-[60vh] lg:max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded scrollbar-track-rounded">
                        <div className="bg-white rounded-[18px] p-4 md:p-6">
                            <h2 className="text-xl font-bold mb-4">Предложения банков</h2>

                            <div className="grid gap-3">
                                {BANKS.map((b) => {
                                    const years = Number(loanTerm) || b.offerTermYears;
                                    const {payment} = computePaymentForParams(principal, b.interestRate, years, paymentType, 'monthly');
                                    return (
                                        <div
                                            key={b.id}
                                            onClick={() => handleSelectBank(b.id)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') handleSelectBank(b.id);
                                            }}
                                            className={`cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border transition ${
                                                selectedBank === b.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={b.logo}
                                                    alt={b.title}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 sm:w-12 sm:h-12 object-contain"
                                                />
                                                <div className="text-left">
                                                    <div className="text-sm font-medium">{b.title}</div>
                                                    <div className="text-xs text-gray-500">Ставка: {b.interestRate}% •
                                                        Срок: {years} лет
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right mt-3 sm:mt-0">
                                                <div className="text-sm font-semibold">{formatMoney(payment)} с.</div>
                                                <div className="text-xs text-gray-500">в мес.</div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectBank(b.id);
                                                    }}
                                                    className="mt-3 sm:mt-2 w-full sm:w-auto ml-0 py-1 px-3 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
                                                >
                                                    Выбрать
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Доп. блок результатов / пояснений (можно скрыть) */}
                    {/*<div className="bg-white rounded-[18px] p-4 md:p-6">*/}
                    {/*    <h3 className="text-lg font-semibold mb-2">Инфо</h3>*/}
                    {/*    */}
                    {/*</div>*/}
                </div>
            </div>

            <MortgageRequestModal open={openModal} onClose={() => setOpenModal(false)} payload={modalPayload}/>
        </>
    );
}