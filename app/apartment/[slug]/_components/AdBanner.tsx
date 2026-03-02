import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

interface AdsBannerProps {
    "data-ad-slot": string;
    "data-ad-format": string;
    "data-full-width-responsive": 'true' | 'false';
    "data-ad-layout"?: string;
}

const AdBanner = (props: AdsBannerProps) => {
    return (
        <GoogleAdSlot
            slot={props['data-ad-slot']}
            format={props['data-ad-format']}
            fullWidthResponsive={props['data-full-width-responsive']}
            layout={props['data-ad-layout']}
            className="mt-2"
        />
    );
};
export default AdBanner;
