import { SVGProps } from 'react';

const BigPlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#0036A5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M11.5 23h23M23 34.5v-23"
    />
  </svg>
);
export default BigPlusIcon;
