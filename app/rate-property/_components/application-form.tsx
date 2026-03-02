'use client';

import {ChangeEvent, FormEvent, useState} from 'react';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

interface ApplicationFormProps {
    id?: string,
    title?: string
}

export const ApplicationForm = ({id, title}: ApplicationFormProps) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        requestType: '',
        area: '',
        address: '',
        message: '',
        rooms: '',
    });

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const sourceUrl = getSourceUrl();
        const result = await submitLead({
            lead: {
                service_type: title || 'Оценка недвижимости',
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                comment: formData.message.trim() || undefined,
                source: id || 'web-rate-property-form',
                source_url: sourceUrl,
                utm: getUtmFromUrl(sourceUrl),
                context: {
                    request_type: formData.requestType || undefined,
                    area: formData.area || undefined,
                    address: formData.address || undefined,
                    rooms: formData.rooms || undefined,
                    form_title: title || undefined,
                },
            },
            telegram: {
                ...formData,
                title: title ?? 'Оценка недвижимости',
                sourceId: id,
                pageUrl: sourceUrl,
            },
        });

        if (!result.ok) {
            alert(getLeadErrorMessage(result));
            return;
        }

        setFormData({
            name: '',
            phone: '',
            requestType: '',
            area: '',
            address: '',
            message: '',
            rooms: '',
        });
        alert('Заявка отправлена! Мы скоро свяжемся с вами.');
    };

    const setRooms = (value: string) =>
        setFormData((prev) => ({...prev, rooms: value}));

    // Shared classes to keep inputs subtle (no focus emphasis)
    const inputBase =
        'w-full h-[50px] md:h-[56px] pl-11 pr-3 bg-[#EEF2F6] rounded-xl border border-transparent placeholder:text-[#8891A7] outline-none focus:outline-none focus:ring-0 focus:border-transparent';
    const iconBase =
        'absolute inset-y-0 left-0 pl-3 flex items-center text-[#0036A5] pointer-events-none';

    return (
        <div className="bg-gradient-to-br from-[#0036A5] to-[#115DFB] rounded-3xl overflow-hidden" id={id}>
            <div className="px-5 md:px-20 py-7 md:py-[60px]">
                <h2 className="text-white font-bold text-2xl md:text-[40px] leading-tight mb-6 md:mb-10">
                    Консультируем бесплатно
                </h2>

                <div className="bg-white rounded-2xl p-4 md:p-6 lg:p-8">
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                    >
                        {/* Name */}
                        <div>
                            <label className="block text-sm mb-1.5">Представьтесь</label>
                            <div className="relative">
                <span className={iconBase}>
                  <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="6" r="4" fill="#0036A5"/>
                    <ellipse cx="12" cy="17" rx="7" ry="4" fill="#0036A5"/>
                  </svg>
                </span>
                                <input type="hidden" value={title}/>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Введите ваше имя"
                                    className={inputBase}
                                />
                            </div>
                        </div>

                        {/* Request type */}
                        <div>
                            <label className="block text-sm mb-1.5">Тип обращения</label>
                            <div className="relative">
                <span className={iconBase}>
                  <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        d="M18.5 3H16C15.7239 3 15.5 3.22386 15.5 3.5V3.55891L19 6.35891V3.5C19 3.22386 18.7762 3 18.5 3Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 9.5C10.75 8.80964 11.3097 8.25 12 8.25C12.6904 8.25 13.25 8.80964 13.25 9.5C13.25 10.1904 12.6904 10.75 12 10.75C11.3097 10.75 10.75 10.1904 10.75 9.5Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M20.75 10.9605L21.5315 11.5857C21.855 11.8444 22.3269 11.792 22.5857 11.4685C22.8444 11.1451 22.792 10.6731 22.4685 10.4143L14.3426 3.91362C12.9731 2.81796 11.027 2.81796 9.65742 3.91362L1.53151 10.4143C1.20806 10.6731 1.15562 11.1451 1.41438 11.4685C1.67313 11.792 2.1451 11.8444 2.46855 11.5857L3.25003 10.9605V21.25H2.00003C1.58581 21.25 1.25003 21.5858 1.25003 22C1.25003 22.4142 1.58581 22.75 2.00003 22.75H22C22.4142 22.75 22.75 22.4142 22.75 22C22.75 21.5858 22.4142 21.25 22 21.25H20.75V10.9605ZM9.25003 9.5C9.25003 7.98122 10.4812 6.75 12 6.75C13.5188 6.75 14.75 7.98122 14.75 9.5C14.75 11.0188 13.5188 12.25 12 12.25C10.4812 12.25 9.25003 11.0188 9.25003 9.5ZM12.0494 13.25C12.7143 13.25 13.2871 13.2499 13.7459 13.3116C14.2375 13.3777 14.7088 13.5268 15.091 13.909C15.4733 14.2913 15.6223 14.7625 15.6884 15.2542C15.7462 15.6842 15.7498 16.2146 15.75 16.827C15.75 16.8679 15.75 16.9091 15.75 16.9506L15.75 21.25H14.25V17C14.25 16.2717 14.2484 15.8009 14.2018 15.454C14.1581 15.1287 14.0875 15.0268 14.0304 14.9697C13.9733 14.9126 13.8713 14.842 13.546 14.7982C13.1991 14.7516 12.7283 14.75 12 14.75C11.2717 14.75 10.8009 14.7516 10.4541 14.7982C10.1288 14.842 10.0268 14.9126 9.9697 14.9697C9.9126 15.0268 9.84199 15.1287 9.79826 15.454C9.75162 15.8009 9.75003 16.2717 9.75003 17V21.25H8.25003L8.25003 16.9506C8.24999 16.2858 8.24996 15.7129 8.31163 15.2542C8.37773 14.7625 8.52679 14.2913 8.90904 13.909C9.29128 13.5268 9.76255 13.3777 10.2542 13.3116C10.7129 13.2499 11.2858 13.25 11.9507 13.25H12.0494Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 9.5C10.75 8.80964 11.3097 8.25 12 8.25C12.6904 8.25 13.25 8.80964 13.25 9.5C13.25 10.1904 12.6904 10.75 12 10.75C11.3097 10.75 10.75 10.1904 10.75 9.5Z"
                        fill="#0036A5"
                    />
                  </svg>
                </span>
                                <select
                                    name="requestType"
                                    value={formData.requestType}
                                    onChange={handleInputChange}
                                    className={`${inputBase} appearance-none pr-9`}
                                >
                                    <option value="">Выберите</option>
                                    <option value="buy">Покупка</option>
                                    <option value="sell">Продажа</option>
                                    <option value="rent">Аренда</option>
                                    <option value="consultation">Консультация</option>
                                </select>
                                <span
                                    className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-[#8891A7]">
                  <svg
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                  >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.19l3.71-3.96a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0L4.15 8.27a.75.75 0 011.08-1.06z"
                        clipRule="evenodd"
                    />
                  </svg>
                </span>
                            </div>
                        </div>

                        {/* Area */}
                        <div>
                            <label className="block text-sm mb-1.5">Площадь м.кв</label>
                            <div className="relative">
                <span className={iconBase}>
                  <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        d="M18.5 3H16C15.7239 3 15.5 3.22386 15.5 3.5V3.55891L19 6.35891V3.5C19 3.22386 18.7762 3 18.5 3Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 9.5C10.75 8.80964 11.3097 8.25 12 8.25C12.6904 8.25 13.25 8.80964 13.25 9.5C13.25 10.1904 12.6904 10.75 12 10.75C11.3097 10.75 10.75 10.1904 10.75 9.5Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M20.75 10.9605L21.5315 11.5857C21.855 11.8444 22.3269 11.792 22.5857 11.4685C22.8444 11.1451 22.792 10.6731 22.4685 10.4143L14.3426 3.91362C12.9731 2.81796 11.027 2.81796 9.65742 3.91362L1.53151 10.4143C1.20806 10.6731 1.15562 11.1451 1.41438 11.4685C1.67313 11.792 2.1451 11.8444 2.46855 11.5857L3.25003 10.9605V21.25H2.00003C1.58581 21.25 1.25003 21.5858 1.25003 22C1.25003 22.4142 1.58581 22.75 2.00003 22.75H22C22.4142 22.75 22.75 22.4142 22.75 22C22.75 21.5858 22.4142 21.25 22 21.25H20.75V10.9605ZM9.25003 9.5C9.25003 7.98122 10.4812 6.75 12 6.75C13.5188 6.75 14.75 7.98122 14.75 9.5C14.75 11.0188 13.5188 12.25 12 12.25C10.4812 12.25 9.25003 11.0188 9.25003 9.5ZM12.0494 13.25C12.7143 13.25 13.2871 13.2499 13.7459 13.3116C14.2375 13.3777 14.7088 13.5268 15.091 13.909C15.4733 14.2913 15.6223 14.7625 15.6884 15.2542C15.7462 15.6842 15.7498 16.2146 15.75 16.827C15.75 16.8679 15.75 16.9091 15.75 16.9506L15.75 21.25H14.25V17C14.25 16.2717 14.2484 15.8009 14.2018 15.454C14.1581 15.1287 14.0875 15.0268 14.0304 14.9697C13.9733 14.9126 13.8713 14.842 13.546 14.7982C13.1991 14.7516 12.7283 14.75 12 14.75C11.2717 14.75 10.8009 14.7516 10.4541 14.7982C10.1288 14.842 10.0268 14.9126 9.9697 14.9697C9.9126 15.0268 9.84199 15.1287 9.79826 15.454C9.75162 15.8009 9.75003 16.2717 9.75003 17V21.25H8.25003L8.25003 16.9506C8.24999 16.2858 8.24996 15.7129 8.31163 15.2542C8.37773 14.7625 8.52679 14.2913 8.90904 13.909C9.29128 13.5268 9.76255 13.3777 10.2542 13.3116C10.7129 13.2499 11.2858 13.25 11.9507 13.25H12.0494Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.75 9.5C10.75 8.80964 11.3097 8.25 12 8.25C12.6904 8.25 13.25 8.80964 13.25 9.5C13.25 10.1904 12.6904 10.75 12 10.75C11.3097 10.75 10.75 10.1904 10.75 9.5Z"
                        fill="#0036A5"
                    />
                  </svg>
                </span>
                                <input
                                    name="area"
                                    value={formData.area}
                                    onChange={handleInputChange}
                                    placeholder="мин м в кв"
                                    className={inputBase}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm mb-1.5">Телефон</label>
                            <div className="relative">
                <span className={iconBase}>
                  <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        d="M10.0376 5.31617L10.6866 6.4791C11.2723 7.52858 11.0372 8.90533 10.1147 9.8278C10.1147 9.8278 8.99578 10.9467 11.0245 12.9755C13.0532 15.0042 14.1722 13.8853 14.1722 13.8853C15.0947 12.9628 16.4714 12.7277 17.5209 13.3134L18.6838 13.9624C20.2686 14.8468 20.4557 17.0692 19.0628 18.4622C18.2258 19.2992 17.2004 19.9505 16.0669 19.9934C14.1588 20.0658 10.9183 19.5829 7.6677 16.3323C4.41713 13.0817 3.93421 9.84122 4.00655 7.93309C4.04952 6.7996 4.7008 5.77423 5.53781 4.93723C6.93076 3.54428 9.15317 3.73144 10.0376 5.31617Z"
                        fill="#0036A5"
                    />
                    <path
                        d="M13.2595 1.87983C13.3257 1.47094 13.7122 1.19357 14.1211 1.25976C14.1464 1.26461 14.2279 1.27983 14.2705 1.28933C14.3559 1.30834 14.4749 1.33759 14.6233 1.38082C14.9201 1.46726 15.3347 1.60967 15.8323 1.8378C16.8286 2.29456 18.1544 3.09356 19.5302 4.46936C20.906 5.84516 21.705 7.17097 22.1617 8.16725C22.3899 8.66487 22.5323 9.07947 22.6187 9.37625C22.6619 9.52466 22.6912 9.64369 22.7102 9.72901C22.7197 9.77168 22.7267 9.80594 22.7315 9.83125L22.7373 9.86245C22.8034 10.2713 22.5286 10.6739 22.1197 10.7401C21.712 10.8061 21.3279 10.53 21.2601 10.1231C21.258 10.1121 21.2522 10.0828 21.2461 10.0551C21.2337 9.9997 21.2124 9.91188 21.1786 9.79572C21.1109 9.56339 20.9934 9.21806 20.7982 8.79238C20.4084 7.94207 19.7074 6.76789 18.4695 5.53002C17.2317 4.29216 16.0575 3.59117 15.2072 3.20134C14.7815 3.00618 14.4362 2.88865 14.2038 2.82097C14.0877 2.78714 13.9417 2.75363 13.8863 2.7413C13.4793 2.67347 13.1935 2.28755 13.2595 1.87983Z"
                        fill="#0036A5"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13.4857 5.3293C13.5995 4.93102 14.0146 4.7004 14.4129 4.81419L14.2069 5.53534C14.4129 4.81419 14.4129 4.81419 14.4129 4.81419L14.4144 4.81461L14.4159 4.81505L14.4192 4.81602L14.427 4.81834L14.4468 4.8245C14.4618 4.82932 14.4807 4.8356 14.5031 4.84357C14.548 4.85951 14.6074 4.88217 14.6802 4.91337C14.8259 4.97581 15.0249 5.07223 15.2695 5.21694C15.7589 5.50662 16.4271 5.9878 17.2121 6.77277C17.9971 7.55775 18.4782 8.22593 18.7679 8.7154C18.9126 8.95991 19.009 9.15897 19.0715 9.30466C19.1027 9.37746 19.1254 9.43682 19.1413 9.48173C19.1493 9.50418 19.1555 9.52301 19.1604 9.53809L19.1665 9.55788L19.1688 9.56563L19.1698 9.56896L19.1702 9.5705C19.1702 9.5705 19.1707 9.57194 18.4495 9.77798L19.1707 9.57194C19.2845 9.97021 19.0538 10.3853 18.6556 10.4991C18.2607 10.6119 17.8492 10.3862 17.7313 9.99413L17.7276 9.98335C17.7223 9.96832 17.7113 9.93874 17.6928 9.89554C17.6558 9.8092 17.5887 9.66797 17.4771 9.47938C17.2541 9.10264 16.8514 8.53339 16.1514 7.83343C15.4515 7.13348 14.8822 6.73078 14.5055 6.50781C14.3169 6.39619 14.1757 6.32909 14.0893 6.29209C14.0461 6.27358 14.0165 6.26254 14.0015 6.25721L13.9907 6.25352C13.5987 6.13564 13.3729 5.72419 13.4857 5.3293Z"
                        fill="#0036A5"
                    />
                  </svg>
                </span>
                                <input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Введите номер телефона"
                                    className={inputBase}
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm mb-1.5">Адрес</label>
                            <div className="relative">
                <span className={iconBase}>
                  <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C7.58172 2 4 6.00258 4 10.5C4 14.9622 6.55332 19.8124 10.5371 21.6744C11.4657 22.1085 12.5343 22.1085 13.4629 21.6744C17.4467 19.8124 20 14.9622 20 10.5C20 6.00258 16.4183 2 12 2ZM12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z"
                        fill="#0036A5"
                    />
                  </svg>
                </span>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Введите адрес"
                                    className={inputBase}
                                />
                            </div>
                        </div>

                        {/* Rooms */}
                        <div>
                            <label className="block text-sm mb-1.5">Количество комнат</label>
                            <div className="flex gap-2">
                                {['1', '2', '3', '4+'].map((r) => {
                                    const active = formData.rooms === r;
                                    return (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRooms(r)}
                                            className={
                                                'h-[50px] w-[70px] cursor-pointer px-4 rounded-xl border text-lg text-[#000] font-bold transition-colors ' +
                                                (active
                                                    ? 'bg-white border-2 border-[#0036A5] text-[#0036A5]'
                                                    : 'bg-[#EEF2F6] border-transparent')
                                            }
                                        >
                                            {r}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message - span full width on desktop */}
                        <div className="md:col-span-2">
                            <label className="block text-sm mb-1.5">Текст письма</label>
                            <textarea
                                name="message"
                                rows={4}
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="Текст письма"
                                className="w-full min-h-[120px] px-3 py-3 bg-[#EEF2F6] rounded-xl border border-transparent placeholder:text-[#8891A7] outline-none focus:outline-none focus:ring-0 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="md:self-end">
                            <button
                                type="submit"
                                className="w-full md:w-auto mt-2 md:mt-0 bg-[#0036A5] text-white px-5 h-[50px] rounded-xl transition-colors"
                            >
                                Оценить недвижимость бесплатно
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
