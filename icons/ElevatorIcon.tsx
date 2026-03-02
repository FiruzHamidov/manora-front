import { SVGProps } from 'react';

const ElevatorIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="currentColor"
    {...props}
  >
    <path
      fill="#0036A5"
      d="M21.333 0H2.667A2.675 2.675 0 0 0 0 2.667v18.666C0 22.8 1.2 24 2.667 24h18.666C22.8 24 24 22.8 24 21.333V2.667C24 1.2 22.8 0 21.333 0Zm-14 4a1.667 1.667 0 1 1 0 3.333 1.667 1.667 0 0 1 0-3.333Zm3.334 10.667H9.333V20h-4v-5.333H4v-3.334c0-1.466 1.2-2.666 2.667-2.666H8c1.467 0 2.667 1.2 2.667 2.666v3.334Zm6 4-3.334-5.334H20l-3.333 5.334Zm-3.334-8 3.334-5.334L20 10.667h-6.667Z"
    />
  </svg>
);
export default ElevatorIcon;
