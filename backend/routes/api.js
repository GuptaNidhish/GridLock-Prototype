const express = require('express');
const router = express.Router();

const incidentController = require('../controllers/incidentController');
const officerController = require('../controllers/officerController');
const planController = require('../controllers/planController');
const simulateController = require('../controllers/simulateController');
const signalController = require('../controllers/signalController');
const routeController = require('../controllers/routeController');
const weatherController = require('../controllers/weatherController');
const analyticsController = require('../controllers/analyticsController');
const eventController = require('../controllers/eventController');
const zoneController = require('../controllers/zoneController');
const alertController = require('../controllers/alertController');

// Incidents
router.get('/incidents', incidentController.getIncidents);
router.get('/incidents/:id', incidentController.getIncidentById);
router.post('/incidents', incidentController.createIncident);
router.put('/incidents/:id', incidentController.updateIncident);
router.delete('/incidents/:id', incidentController.deleteIncident);

// Officers
router.get('/officers', officerController.getOfficers);
router.get('/officers/:id', officerController.getOfficerById);
router.put('/officers/:id', officerController.updateOfficer);

// Barricade Plans
router.get('/plans', planController.getPlans);
router.get('/plans/:id', planController.getPlanById);
router.post('/plans', planController.createPlan);
router.put('/plans/:id', planController.updatePlan);

// What-If Simulation
router.post('/simulate', simulateController.simulateScenario);

// Signal timing optimization
router.post('/signals/optimize', signalController.optimizeSignal);

// Route diversion route suggestions
router.post('/routes/diversion', routeController.getDiversionRoute);

// Weather Alerts
router.get('/weather/alerts', weatherController.getWeatherAlerts);

// Analytics
router.get('/analytics/dashboard', analyticsController.getDashboardMetrics);

// Event DNA Profiles
router.get('/events/profiles', eventController.getEventProfiles);
router.get('/events/profiles/:id', eventController.getEventProfileById);
router.post('/events/profiles', eventController.createEventProfile);

// Polygon Zone check
router.post('/zones/overlap', zoneController.checkZoneOverlap);

// Warnings Alerts
router.get('/alerts/active', alertController.getActiveAlerts);

module.exports = router;
