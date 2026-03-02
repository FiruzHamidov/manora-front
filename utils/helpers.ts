import {Property} from "@/services/properties/types";

export const buildTitle = (l: Property) => {
    const kind = getKindName(l);
    const slug = l.type?.slug;

    if (slug === 'commercial') {
        // комнаты не показываем, фокус на площади/этаже
        return `${kind}${l.total_area ? `, ${l.total_area} м²` : ''}${
            l.floor ? `, ${l.floor}/${l.total_floors} этаж` : ''
        }`;
    }

    if (slug === 'land-plots') {
        // для участка чаще показывают площадь (если есть поле под сотки — подставь его)
        return `${kind}${l.land_size ? `, ${l.land_size} соток` : ''}`;
    }

    if (slug === 'houses') {
        // для домов комнатность опционально
        return `${l.rooms ? `${l.rooms} комн. ` : ''}${kind}${
            l.land_size ? `, ${l.land_size} соток` : ''
        }${l.floor ? `, ${l.floor}/${l.total_floors} этаж` : ''}`;
    }

    if (slug === 'parking') {
        return kind; // можно добавить «подземная/наземная» по отдельному полю, если появится
    }

    // квартиры: secondary / new-buildings (или дефолт)
    return `${l.rooms ? `${l.rooms} комн. ` : ''}${kind}${
        l.floor ? `, ${l.floor}/${l.total_floors} этаж` : ''
    }${l.total_area ? `, ${l.total_area} м²` : ''}`;
};

const getKindName = (l: Property) => {
    const slug = l.type?.slug;

    switch (slug) {
        case 'commercial':
            return 'Коммерческое помещение';
        case 'land-plots':
            return 'Земельный участок';
        case 'houses':
            return 'дом'; // при желании можно развести на коттедж/таунхаус по отдельному полю
        case 'parking':
            return 'парковка';
        // квартиры идут в двух категориях: secondary и new-buildings
        case 'secondary':
        case 'new-buildings':
        default:
            // если есть уточнение типа квартиры — используем его
            return l.apartment_type || 'квартира';
    }
};