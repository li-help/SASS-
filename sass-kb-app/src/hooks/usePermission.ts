import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse } from '@/services/docService';

export function usePermission(
  resourceType: string,
  resourceId: string | undefined,
  action: string,
) {
  return useQuery({
    queryKey: ['permission', resourceType, resourceId, action],
    queryFn: () =>
      api.get<any, ApiResponse<{ allowed: boolean }>>('/permission/check', {
        params: { resourceType, resourceId: resourceId!, action },
      }),
    enabled: !!resourceId,
    staleTime: 60_000,
    select: (res) => res.data?.allowed ?? false,
  });
}
