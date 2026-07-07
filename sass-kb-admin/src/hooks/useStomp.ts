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

  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
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
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token]);

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
      };
    },
    [],
  );

  return { client: clientRef.current, connected, subscribe };
}
