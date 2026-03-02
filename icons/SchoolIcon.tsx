import { SVGProps } from 'react';

const SchoolIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <g fill="#0036A5" clipPath="url(#a)">
      <path d="M27.784 8.396h-9.11l5.594 6.666H32v-1.39l-4.216-5.276Zm-23.568 0L0 13.67v1.391h7.732l5.593-6.666h-9.11Z" />
      <path d="M30.27 30.125V16.937h-6.876l-6.456-7.694V5.208h5.414V0h-7.29v9.243l-6.456 7.694H1.73v13.188H0V32h32v-1.875h-1.73ZM5.02 20h1.876v2.667H5.02V20Zm1.924 8H5.069v-2.667h1.875V28ZM16 13.062A2.94 2.94 0 0 1 18.938 16 2.94 2.94 0 0 1 16 18.938 2.94 2.94 0 0 1 13.062 16 2.94 2.94 0 0 1 16 13.062Zm4.938 17.063h-1.875v-6.52h-2.125v6.52h-1.875v-6.52h-2.126v6.52h-1.874v-8.396h9.874v8.396ZM26.93 28h-1.875v-2.667h1.875V28Zm.048-5.333h-1.875V20h1.875v2.667Z" />
      <path d="M16 14.938a1.064 1.064 0 0 0 0 2.124 1.064 1.064 0 0 0 0-2.125Z" />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h32v32H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SchoolIcon;
