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
            slot="2404125144"
            format="auto"
            fullWidthResponsive="true"
            className="mt-2"
        />
    );
};
export default AdBanner;
