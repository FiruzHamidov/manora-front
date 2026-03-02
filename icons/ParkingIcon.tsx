import { SVGProps } from 'react';

const ParkingIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="currentColor"
    {...props}
  >
    <path
      fill="#0036A5"
      d="M13.406 7.078h-2.812a.703.703 0 0 0-.703.703v2.813c0 .388.314.703.703.703h2.812c1.163 0 2.11-.946 2.11-2.11 0-1.163-.947-2.109-2.11-2.109Z"
    />
    <path
      fill="#0036A5"
      d="M21.89 0H2.11C.945 0 0 .946 0 2.11v19.78C0 23.055.946 24 2.11 24h19.78c1.164 0 2.11-.946 2.11-2.11V2.11C24 .945 23.054 0 21.89 0Zm-8.484 14.11H9.891v4.921a.703.703 0 0 1-.704.703H7.782a.703.703 0 0 1-.703-.703V4.97c0-.389.315-.703.703-.703h5.625a4.928 4.928 0 0 1 4.922 4.921 4.928 4.928 0 0 1-4.922 4.922Z"
    />
  </svg>
);
export default ParkingIcon;
