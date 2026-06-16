import { SVGProps } from 'react';

const MinusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#006341"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M11.5 23h23"
    />
  </svg>
);
export default MinusIcon;
