'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FavoritesProvider } from '@/services/favorites/provider';
import { subscribeSessionChanges } from '@/services/login/session-sync';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const QueryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState(() => ({ client: createQueryClient(), revision: 0 }));
  useEffect(() => subscribeSessionChanges(() => {
    // clear cancels old reads; a fresh client and subtree also discard private
    // observer results and form state, without changing the URL or guest storage.
    session.client.clear();
    const client = createQueryClient();
    setSession(current => ({ client, revision: current.revision + 1 }));
  }), [session.client]);
  return (
    <QueryClientProvider key={session.revision} client={session.client}><FavoritesProvider>{children}</FavoritesProvider></QueryClientProvider>
  );
};
