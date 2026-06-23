const { WebSocketServer } = require('ws');

let wss;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${clients.size}`);

    // Send initial greeting/current state
    const simulationService = require('./simulationService');
    ws.send(JSON.stringify({
      type: 'INIT_STATE',
      data: simulationService.getState()
    }));

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message);
        if (payload.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        } else if (payload.type === 'TOGGLE_SIMULATION') {
          simulationService.toggleSimulation();
        } else if (payload.type === 'MANUAL_INCIDENT') {
          const Incident = require('../models/Incident');
          Incident.create(payload.data).then(newInc => {
            broadcast({
              type: 'NEW_INCIDENT',
              data: newInc
            });
            simulationService.addFeedEntry('🔴', `MANUAL INCIDENT: ${newInc.incident_type.toUpperCase()} — ${newInc.locality} [${newInc.id}]`, 'critical');
          });
        }
      } catch (err) {
        console.error('Error handling WS message:', err.message);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
    });
  });

  // Global helper
  global.broadcast = broadcast;
}

function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcast
};
