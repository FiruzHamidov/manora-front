import { SVGProps } from 'react';

const WhiteSettingsIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M7.125 10.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5ZM10.875 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
    />
    <path
      stroke="#0036A5"
      strokeLinecap="round"
      strokeWidth={1.5}
      d="M11.25 12.719h5.25M6.75 5.219H1.5M1.5 12.719H3M16.5 5.219H15"
    />
  </svg>
);
export default WhiteSettingsIcon;
