const Incident = require('../models/Incident');

exports.getActiveAlerts = async (req, res) => {
  try {
    const incidents = await Incident.getAll({ status: 'active' });
    const alerts = [];

    const now = new Date();

    incidents.forEach(inc => {
      // 1. SLA Breach Alert
      const createdTime = new Date(inc.created_at);
      const diffHrs = (now - createdTime) / 3600000;

      if (diffHrs > inc.duration_sla_hours) {
        alerts.push({
          id: `ALERT_SLA_${inc.id}`,
          type: 'SLA_BREACH',
          severity: 'Critical',
          incident_id: inc.id,
          message: `Incident ${inc.id} at ${inc.locality} has exceeded SLA duration limit of ${inc.duration_sla_hours} hours. Elapsed: ${diffHrs.toFixed(1)} hrs.`,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Cascade Anomaly Alert
      if (inc.commuter_impact_score > 75) {
        alerts.push({
          id: `ALERT_CASC_${inc.id}`,
          type: 'CONGESTION_CASCADE',
          severity: 'Warning',
          incident_id: inc.id,
          message: `High impact score (${inc.commuter_impact_score}) at ${inc.locality} is triggering gridlock cascades on surrounding corridors.`,
          timestamp: new Date().toISOString()
        });
      }
    });

    res.json({
      success: true,
      alert_count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
