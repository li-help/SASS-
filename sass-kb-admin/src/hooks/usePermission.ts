import { useQuery } from '@tanstack/react-query';
import { permissionApi } from '@/services/roleApi';

export function usePermission(
  resourceType: string,
  resourceId: string | undefined,
  action: string,
) {
  return useQuery({
    queryKey: ['permission', resourceType, resourceId, action],
    queryFn: () => {
      if (!resourceId) throw new Error('resourceId is required');
      return permissionApi.check({
        resourceType,
        resourceId,
        action,
      });
    },
    enabled: !!resourceId,
    staleTime: 60_000,
    select: (res) => res.data?.allowed ?? false,
  });
}
