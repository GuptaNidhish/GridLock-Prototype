require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const db = require('./db'); // Initializes SQLite schema and seeds data
const apiRoutes = require('./routes/api');
const { initWebSocket } = require('./services/websocketService');
const simulationService = require('./services/simulationService');

const app = express();
const port = process.env.PORT || 3001;

// CORS setup to allow communication with frontend on port 3000
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API Routes
app.use('/api/v1', apiRoutes);

// Status route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    simulation_active: simulationService.getState().simulationActive
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSockets
initWebSocket(server);

// Start Server
server.listen(port, () => {
  console.log(`ASTRAM Backend Server listening on port ${port}`);
  
  // Start simulation cycles
  simulationService.start();
});

module.exports = server;
