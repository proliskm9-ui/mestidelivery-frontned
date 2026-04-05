export class TrackingSocket {
    private ws: WebSocket | null = null;
    private listeners: ((data: any) => void)[] = [];
    private reconnectTimer: any = null;

    constructor(private orderId: number) { }

    connect() {
        if (this.ws) return;

        // Replace http/https with ws/wss
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        // Extract host
        const urlObj = new URL(baseUrl);
        const protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = urlObj.host;

        const wsUrl = `${protocol}//${host}/ws/tracking/${this.orderId}`;

        console.log('Connecting WS:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WS Connected');
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.listeners.forEach(cb => cb(data));
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

        this.ws.onclose = () => {
            console.log('WS Closed, reconnecting...');
            this.ws = null;
            this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        };
    }

    subscribe(loadingCallback: (data: any) => void) {
        this.listeners.push(loadingCallback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== loadingCallback);
        };
    }

    disconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.onclose = null; // Prevent reconnect
            this.ws.close();
            this.ws = null;
        }
    }
}
