const Incident = require('../models/Incident');

exports.getIncidents = async (req, res) => {
  try {
    const { status, corridor, priority } = req.query;
    const incidents = await Incident.getAll({ status, corridor, priority });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.getById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const newInc = await Incident.create(req.body);
    // Broadcast notification via WebSocket helper if defined globally
    if (global.broadcast) {
      global.broadcast({
        type: 'NEW_INCIDENT',
        data: newInc
      });
    }
    res.status(201).json(newInc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateIncident = async (req, res) => {
  try {
    const updated = await Incident.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Incident not found' });
    if (global.broadcast) {
      global.broadcast({
        type: 'INCIDENT_UPDATED',
        data: updated
      });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    const success = await Incident.delete(req.params.id);
    if (!success) return res.status(404).json({ error: 'Incident not found' });
    if (global.broadcast) {
      global.broadcast({
        type: 'INCIDENT_DELETED',
        id: req.params.id
      });
    }
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
