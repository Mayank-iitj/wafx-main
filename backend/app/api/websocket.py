"""WebSocket hub for real-time alert and event streaming."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_ws_user

logger = logging.getLogger("wafx.ws")
router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manage active WebSocket connections grouped by org_id."""

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, org_id: str) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(org_id, []).append(websocket)
        logger.info("WS connected: org=%s (total=%d)", org_id, len(self._connections.get(org_id, [])))

    async def disconnect(self, websocket: WebSocket, org_id: str) -> None:
        async with self._lock:
            conns = self._connections.get(org_id, [])
            if websocket in conns:
                conns.remove(websocket)
        logger.info("WS disconnected: org=%s", org_id)

    async def broadcast(self, org_id: str, message: dict[str, Any]) -> None:
        """Send a message to all connections in an org."""
        conns = self._connections.get(org_id, [])
        dead: list[WebSocket] = []
        data = json.dumps(message, default=str)
        for ws in conns:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            await self.disconnect(ws, org_id)


manager = ConnectionManager()


@router.websocket("/ws/alerts")
async def alert_stream(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    """Real-time alert stream for the SOC dashboard."""
    user = await get_ws_user(websocket, db)
    org_id = str(user.org_id)

    await manager.connect(websocket, org_id)
    try:
        while True:
            # Keep the connection alive; server pushes via broadcast()
            data = await websocket.receive_text()
            # Clients can send filter preferences
            try:
                msg = json.loads(data)
                logger.debug("WS message from %s: %s", user.email, msg)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await manager.disconnect(websocket, org_id)


async def push_alert_to_org(org_id: str, alert_data: dict[str, Any]) -> None:
    """Utility to push a new alert to all connected clients of an org."""
    await manager.broadcast(org_id, {
        "type": "new_alert",
        "data": alert_data,
    })


async def push_event_to_org(org_id: str, event_type: str, data: dict[str, Any]) -> None:
    """Generic event push."""
    await manager.broadcast(org_id, {
        "type": event_type,
        "data": data,
    })
