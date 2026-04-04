from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map order_id -> List of WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, order_id: int):
        await websocket.accept()
        if order_id not in self.active_connections:
            self.active_connections[order_id] = []
        self.active_connections[order_id].append(websocket)
        logger.info(f"WebSocket connected for order {order_id}. Total: {len(self.active_connections[order_id])}")

    def disconnect(self, websocket: WebSocket, order_id: int):
        if order_id in self.active_connections:
            if websocket in self.active_connections[order_id]:
                self.active_connections[order_id].remove(websocket)
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]
        logger.info(f"WebSocket disconnected for order {order_id}")

    async def broadcast(self, order_id: int, message: dict):
        if order_id in self.active_connections:
            for connection in self.active_connections[order_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send WS message: {e}")
                    # Optionally remove dead connection

# Global instance
manager = ConnectionManager()
