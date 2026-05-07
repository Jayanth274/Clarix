/**
 * WebSocket Server for Real-Time Navigation Tracking
 * Sends live updates to frontend during user navigation
 */

import { WebSocketServer } from 'ws';

const clients = new Map(); // sessionId -> WebSocket

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        const params = new URLSearchParams(req.url.split('?')[1]);
        const sessionId = params.get('sessionId');

        if (!sessionId) {
            ws.close(1008, 'Session ID required');
            return;
        }

        console.log(`WebSocket connected for session: ${sessionId}`);
        clients.set(sessionId, ws);

        ws.on('close', () => {
            console.log(`WebSocket disconnected for session: ${sessionId}`);
            clients.delete(sessionId);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for session ${sessionId}:`, error);
        });
    });

    console.log('✅ WebSocket server initialized on path /ws');
    return wss;
}

/**
 * Send message to specific session
 */
export function sendToSession(sessionId, message) {
    const ws = clients.get(sessionId);
    if (ws && ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify(message));
        return true;
    }
    return false;
}

/**
 * Broadcast to all clients
 */
export function broadcast(message) {
    clients.forEach((ws) => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(message));
        }
    });
}

/**
 * Get connected client count
 */
export function getClientCount() {
    return clients.size;
}

/**
 * Check if session has active connection
 */
export function hasConnection(sessionId) {
    return clients.has(sessionId);
}
