'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const RecoveryTarget = createContext<HTMLDivElement | null>(null);

/** Keep receipt verification reachable without revealing a hidden listing. */
export function ResidentialLeadRecoveryBoundary({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  const outerTarget = useContext(RecoveryTarget);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return <RecoveryTarget.Provider value={outerTarget ?? (hidden ? target : null)}>
    <div hidden={hidden}>{children}</div>
    <div ref={setTarget} className="mx-auto max-w-xl space-y-4 px-4 empty:hidden" />
  </RecoveryTarget.Provider>;
}

export function useResidentialLeadRecoveryTarget() {
  return useContext(RecoveryTarget);
}
