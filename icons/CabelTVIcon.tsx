import { SVGProps } from 'react';

const CableTVIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="currentColor"
    {...props}
  >
    <path
      fill="#0036A5"
      d="M.93 10.68v12.3C.93 25.75 3.18 28 5.95 28h16.1c2.77 0 5.02-2.25 5.02-5.02v-12.3c0-2.77-2.25-5.03-5.02-5.03h-5.63l3.94-3.94c.39-.39.39-1.03 0-1.42a.996.996 0 0 0-1.41 0L14 5.24 9.05.29a.996.996 0 0 0-1.41 0c-.39.39-.39 1.03 0 1.42l3.94 3.94H5.95C3.18 5.65.93 7.91.93 10.68Zm7.38.15c0-.36.19-.69.5-.87.31-.18.69-.18 1 0l10.39 6a1 1 0 0 1 0 1.73l-10.39 6c-.15.09-.33.14-.5.14-.17 0-.35-.05-.5-.14a1 1 0 0 1-.5-.86v-12Z"
    />
    <path fill="#0036A5" d="M10.31 12.56v8.53l7.39-4.26-7.39-4.27Z" />
  </svg>
);
export default CableTVIcon;
