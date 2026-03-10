/** WebSocket client for real-time alert streaming. */

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1';

type MessageHandler = (data: any) => void;

class WSClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnect = 10;

  connect() {
    const token = localStorage.getItem('wafx_access_token');
    if (!token) return;

    try {
      this.ws = new WebSocket(`${WS_BASE}/alerts?token=${token}`);

      this.ws.onopen = () => {
        console.log('[WAFx WS] Connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const type = msg.type;
          const handlers = this.handlers.get(type) || [];
          handlers.forEach((h) => h(msg.data));

          // Also fire wildcard handlers
          const wildcardHandlers = this.handlers.get('*') || [];
          wildcardHandlers.forEach((h) => h(msg));
        } catch (e) {
          console.error('[WAFx WS] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[WAFx WS] Disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WAFx WS] Error:', error);
      };
    } catch (e) {
      console.error('[WAFx WS] Connection error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`[WAFx WS] Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  on(eventType: string, handler: MessageHandler) {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  off(eventType: string, handler: MessageHandler) {
    const handlers = this.handlers.get(eventType) || [];
    this.handlers.set(
      eventType,
      handlers.filter((h) => h !== handler)
    );
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new WSClient();
