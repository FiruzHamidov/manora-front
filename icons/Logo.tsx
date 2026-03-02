import { ImgHTMLAttributes } from 'react';

const Logo = (props: ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="/logo.svg" alt="Manora" {...props} />
);

export default Logo;
