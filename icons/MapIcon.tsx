import { SVGProps } from 'react';

const MapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#0036A5"
      strokeWidth={1.5}
      d="M3.333 8.453c0-3.748 2.985-6.786 6.667-6.786s6.667 3.038 6.667 6.786c0 3.718-2.128 8.057-5.448 9.609a2.874 2.874 0 0 1-2.438 0c-3.32-1.552-5.448-5.89-5.448-9.61Z"
    />
    <circle cx={10} cy={8.333} r={2.5} stroke="#0036A5" strokeWidth={1.5} />
  </svg>
);
export default MapIcon;
