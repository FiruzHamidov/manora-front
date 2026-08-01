import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PROPERTY_QUERY_KEYS } from '@/services/properties/constants';
import { refreshListingPublication } from './api';
import type {
  PublicationListingKind,
  PublicationRefreshResponse,
} from './types';

type RefreshVariables = {
  id: string | number;
  kind: PublicationListingKind;
};

const mergeListing = (
  value: unknown,
  updated: PublicationRefreshResponse
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => mergeListing(item, updated));
  }

  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  if (String(record.id ?? '') === String(updated.id)) {
    return { ...record, ...updated };
  }

  let changed = false;
  const next = { ...record };

  for (const key of ['data', 'items', 'pages']) {
    if (!(key in record)) continue;
    const merged = mergeListing(record[key], updated);
    if (merged !== record[key]) {
      next[key] = merged;
      changed = true;
    }
  }

  return changed ? next : value;
};

export const useRefreshListingPublicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    PublicationRefreshResponse,
    Error,
    RefreshVariables
  >({
    mutationFn: (variables) =>
      refreshListingPublication<PublicationRefreshResponse>(variables),
    onSuccess: (updated, variables: RefreshVariables) => {
      if (variables.kind === 'car') {
        queryClient.setQueriesData(
          { queryKey: ['cars'] },
          (current) => mergeListing(current, updated)
        );
        queryClient.setQueriesData(
          { queryKey: ['cars', 'detail', String(variables.id)] },
          (current) => mergeListing(current, updated)
        );
        queryClient.invalidateQueries({ queryKey: ['cars'] });
        return;
      }

      queryClient.setQueriesData(
        { queryKey: [PROPERTY_QUERY_KEYS.PROPERTY] },
        (current) => mergeListing(current, updated)
      );
      queryClient.setQueriesData(
        {
          queryKey: [
            PROPERTY_QUERY_KEYS.PROPERTY_DETAIL,
            String(variables.id),
          ],
        },
        (current) => mergeListing(current, updated)
      );
      queryClient.invalidateQueries({
        queryKey: [PROPERTY_QUERY_KEYS.PROPERTY],
      });
      queryClient.invalidateQueries({
        queryKey: [
          PROPERTY_QUERY_KEYS.PROPERTY_DETAIL,
          String(variables.id),
        ],
      });
    },
  });
};
