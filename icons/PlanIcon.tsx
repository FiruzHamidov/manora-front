import { SVGProps } from 'react';

const PlanIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      fill="#666F8D"
      d="M7.333 3.333v1.334h9.334v12H14v-1.333h1.333v-4H14V10h1.333V6h-4v1.333H10V6H7.333v4h5.334v1.333h-1.334v4h1.334v1.334H10v-5.334H7.333v5.334H4a.668.668 0 0 1-.471-1.138.667.667 0 0 1 .471-.195h2V2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14V3.333H7.333Z"
    />
  </svg>
);
export default PlanIcon;
