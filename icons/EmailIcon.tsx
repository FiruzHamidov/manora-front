import { SVGProps } from 'react';

const EmailIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#fff"
      strokeWidth={2}
      d="M3 18c0-5.657 0-8.485 1.757-10.243C6.515 6 9.343 6 15 6h6c5.657 0 8.485 0 10.243 1.757C33 9.515 33 12.343 33 18s0 8.485-1.757 10.243C29.485 30 26.657 30 21 30h-6c-5.657 0-8.485 0-10.243-1.757C3 26.485 3 23.657 3 18Z"
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth={2}
      d="m9 12 3.238 2.699c2.755 2.295 4.133 3.443 5.762 3.443 1.63 0 3.007-1.148 5.762-3.443L27 12"
    />
  </svg>
);
export default EmailIcon;
