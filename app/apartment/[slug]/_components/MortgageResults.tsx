'use client';

export function MortgageResults({
                                    propertyPrice,
                                    interestRate,
                                    totalInterest,
                                    monthlyPayment,
                                    onRequestClick,
                                }: {
    propertyPrice: string;
    interestRate: string;
    totalInterest: string;
    monthlyPayment: string;
    onRequestClick: () => void;
}) {
    return (
        <div className="bg-white rounded-[22px] px-4 py-5 md:py-8 md:px-9">
            <div className="md:mb-8 mb-5">
                <h3 className="text-lg mb-1 md:mb-3">Стоимость недвижимости</h3>
                <p className="text-[#0036A5] text-3xl md:text-[32px] font-bold">{propertyPrice}</p>
            </div>
            <div className="md:mb-8 mb-5">
                <h3 className="text-lg mb-1 md:mb-3">Процентная ставка</h3>
                <p className="text-[#0036A5] text-3xl md:text-[32px] font-bold">{interestRate}</p>
            </div>
            <div className="md:mb-8 mb-5">
                <h3 className="text-lg mb-1 md:mb-3">Сумма переплаты</h3>
                <p className="text-[#0036A5] text-3xl md:text-[32px] font-bold">{totalInterest}</p>
            </div>
            <div className="mb-6 md:mb-10">
                <h3 className="text-lg mb-1 md:mb-3">Ежемесячный платёж</h3>
                <p className="text-[#0036A5] text-3xl md:text-[32px] font-bold">{monthlyPayment}</p>
            </div>

            <button
                onClick={onRequestClick}
                className="w-full bg-[#0036A5] hover:bg-blue-800 text-white rounded-full py-5 transition-colors text-lg cursor-pointer"
            >
                Отправить заявку
            </button>
        </div>
    );
}