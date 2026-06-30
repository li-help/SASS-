import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStomp } from './useStomp';

interface EntityEvent {
  type: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  timestamp: number;
}

/**
 * 实体类型到 React Query cache key 的映射。
 * 收到某个实体类型的变更事件时，失效所有相关的查询缓存。
 */
const QUERY_KEY_MAP: Record<string, string[][]> = {
  USER: [['users'], ['dashboard-stats']],
  TENANT: [['tenants'], ['dashboard-stats']],
  SPACE: [['spaces'], ['dashboard-stats']],
  DOC: [['doc'], ['space-tree'], ['folder-docs'], ['dashboard-stats']],
  FILE: [['files'], ['dashboard-stats']],
  ROLE: [['roles']],
};

const DEBOUNCE_MS = 300;

export function useRealtimeRefresh() {
  const { subscribe } = useStomp();
  const queryClient = useQueryClient();
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const unsub = subscribe('/topic/entity-changes', (message) => {
      try {
        const event: EntityEvent = JSON.parse(message.body);
        const keysList = QUERY_KEY_MAP[event.entityType];
        if (!keysList) return;

        // 300ms debounce：合并短时间内同一实体类型的多个事件
        const existingTimer = debounceTimers.current.get(event.entityType);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          debounceTimers.current.delete(event.entityType);
          keysList.forEach((keys) => {
            queryClient.invalidateQueries({ queryKey: keys, exact: false });
          });
          if (import.meta.env.DEV) {
            console.debug(
              `[Realtime] ${event.type} ${event.entityType}#${event.entityId} → invalidated ${keysList.map(k => k.join('.')).join(', ')}`,
            );
          }
        }, DEBOUNCE_MS);

        debounceTimers.current.set(event.entityType, timer);
      } catch (e) {
        // 忽略无效消息
      }
    });

    return () => {
      unsub();
      // 清理所有 debounce timer
      debounceTimers.current.forEach((timer) => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, [subscribe, queryClient]);
}
