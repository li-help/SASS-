import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, ReconnectionTimeMode, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';

interface StompState {
  client: Client | null;
  connected: boolean;
  subscribe: (destination: string, callback: (message: IMessage) => void) => () => void;
}

export function useStomp(): StompState {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const subscriptionsRef = useRef<Map<string, (message: IMessage) => void>>(new Map());

  const getToken = useCallback(() => {
    return useAuthStore.getState().accessToken;
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // 未登录，不连接
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`/ws?token=${token}`),
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.debug('[STOMP]', str);
        }
      },
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      onConnect: () => {
        setConnected(true);

        // 重新订阅之前的订阅
        subscriptionsRef.current.forEach((callback, destination) => {
          client.subscribe(destination, callback);
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
      },
      onWebSocketClose: () => {
        setConnected(false);
        // 检查 token 是否已更新（token 刷新后自动重连）
        const currentToken = getToken();
        if (currentToken && currentToken !== token) {
          // token 已刷新，client 会在 reconnectDelay 后自动重连
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.clear();
      client.deactivate();
      clientRef.current = null;
    };
  }, [getToken]);

  const subscribe = useCallback(
    (destination: string, callback: (message: IMessage) => void): (() => void) => {
      subscriptionsRef.current.set(destination, callback);

      const client = clientRef.current;
      if (client && client.connected) {
        const subscription = client.subscribe(destination, callback);
        return () => {
          subscriptionsRef.current.delete(destination);
          subscription.unsubscribe();
        };
      }

      // 返回 unsubscribe 函数
      return () => {
        subscriptionsRef.current.delete(destination);
        if (client && client.connected) {
          client.unsubscribe(destination);
        }
      };
    },
    [],
  );

  return { client: clientRef.current, connected, subscribe };
}
