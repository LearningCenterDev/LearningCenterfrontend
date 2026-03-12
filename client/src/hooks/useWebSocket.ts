import { useEffect } from "react";
import { User } from "@shared/schema";

export function useWebSocket(user: User | null) {
  useEffect(() => {
    if (!user) return;

    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&role=${user.role}`;

    let ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      (window as any).__ws = ws;
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      (window as any).__ws = null;
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (!((window as any).__ws)) {
          const newWs = new WebSocket(wsUrl);
          newWs.onopen = () => {
            console.log('WebSocket reconnected');
            (window as any).__ws = newWs;
          };
        }
      }, 3000);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);
}
