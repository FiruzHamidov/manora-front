import { ReactNode } from 'react';
import { Navbar } from './_components/navbar';

export default function NewBuildingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <Navbar />

      <div className="mt-5">{children}</div>
    </div>
  );
}
