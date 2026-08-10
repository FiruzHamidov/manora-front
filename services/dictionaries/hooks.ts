import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dictionariesApi } from './api';
import type {
  DictionaryListParams,
  DictionaryPayload,
  DictionaryRecord,
  DictionaryResource,
} from './types';

export const useDictionaryEntries = (
  resource: DictionaryResource,
  params?: DictionaryListParams,
  enabled = true
) =>
  useQuery<DictionaryRecord[]>({
    queryKey: ['dictionaries', resource, params],
    queryFn: () => dictionariesApi.list(resource, params),
    staleTime: 5 * 60 * 1000,
    enabled,
  });

export const useCreateDictionaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      resource: DictionaryResource;
      payload: DictionaryPayload;
    }) => dictionariesApi.create(variables.resource, variables.payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['dictionaries', variables.resource] });
    },
  });
};

export const useUpdateDictionaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      resource: DictionaryResource;
      id: number;
      payload: DictionaryPayload;
    }) => dictionariesApi.update(variables.resource, variables.id, variables.payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['dictionaries', variables.resource] });
    },
  });
};

export const useDeleteDictionaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { resource: DictionaryResource; id: number }) =>
      dictionariesApi.remove(variables.resource, variables.id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['dictionaries', variables.resource] });
    },
  });
};
