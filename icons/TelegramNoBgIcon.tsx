import { SVGProps } from 'react';

const TelegramNoBgIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    {...props}
  >
    <rect width={47} height={47} x={0.5} y={0.5} stroke="#BAC0CC" rx={23.5} />
    <path
      fill="#26a4e3"
      d="m21.848 26.985-.331 4.653c.473 0 .678-.203.924-.447l2.22-2.121 4.598 3.367c.843.47 1.437.223 1.665-.775l3.018-14.144.001-.001c.268-1.247-.45-1.734-1.272-1.428L14.929 22.88c-1.211.47-1.193 1.145-.206 1.451l4.536 1.411 10.536-6.593c.495-.328.946-.146.575.182l-8.522 7.653Z"
    />
  </svg>
);
export default TelegramNoBgIcon;
