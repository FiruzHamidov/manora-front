import { SVGProps } from 'react';

const LocationIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#666F8D"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.037}
      d="M3.75 7.859c0 3.639 3.183 6.648 4.592 7.801.202.165.304.25.454.291.118.033.29.033.407 0 .15-.042.252-.125.455-.29 1.409-1.154 4.592-4.163 4.592-7.802a5.164 5.164 0 0 0-1.538-3.672A5.28 5.28 0 0 0 9 2.667a5.28 5.28 0 0 0-3.712 1.52A5.163 5.163 0 0 0 3.75 7.86Z"
    />
    <path
      stroke="#666F8D"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.037}
      d="M7.5 7.167a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z"
    />
  </svg>
);
export default LocationIcon;
