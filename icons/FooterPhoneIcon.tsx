import { SVGProps } from 'react';

const FooterPhoneIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth={2}
      d="M21 3s3.3.3 7.5 4.5S33 15 33 15M21.31 8.304s1.486.424 3.713 2.651c2.227 2.228 2.651 3.713 2.651 3.713M15.056 7.974l.974 1.745c.878 1.574.526 3.639-.858 5.023 0 0-1.678 1.678 1.365 4.721s4.721 1.365 4.721 1.365c1.384-1.384 3.45-1.736 5.023-.858l1.745.974c2.377 1.326 2.658 4.66.568 6.75-1.255 1.255-2.793 2.232-4.494 2.296-2.862.109-7.723-.616-12.598-5.492-4.876-4.875-5.6-9.736-5.492-12.598.064-1.7 1.041-3.239 2.297-4.494 2.09-2.09 5.423-1.809 6.75.568Z"
    />
  </svg>
);
export default FooterPhoneIcon;
