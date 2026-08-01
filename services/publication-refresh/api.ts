import { axios } from '@/utils/axios';
import { getPublicationRefreshEndpoint } from './helpers';
import type {
  PublicationListingKind,
  PublicationRefreshResponse,
} from './types';

export const refreshListingPublication = async <
  T = PublicationRefreshResponse,
>({
  id,
  kind,
}: {
  id: string | number;
  kind: PublicationListingKind;
}): Promise<T> => {
  const { data } = await axios.post<T>(
    getPublicationRefreshEndpoint(kind, id)
  );
  return data;
};
