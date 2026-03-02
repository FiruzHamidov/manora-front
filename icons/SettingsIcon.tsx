import { SVGProps } from 'react';

const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#1E3A8A"
      strokeWidth={1.5}
      d="M9.5 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM14.5 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
    />
    <path
      stroke="#1E3A8A"
      strokeLinecap="round"
      strokeWidth={1.5}
      d="M15 16.959h7M9 6.958H2M2 16.959h2M22 6.958h-2"
    />
  </svg>
);
export default SettingsIcon;
