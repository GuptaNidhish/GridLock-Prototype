const Incident = require('../models/Incident');

// Ray-casting algorithm for Point-in-Polygon (PnPoly)
function isPointInPolygon(point, polygon) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

exports.checkZoneOverlap = async (req, res) => {
  try {
    const { polygon } = req.body; // Array of [lat, lon] coordinates

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ error: 'Valid polygon coordinates array required (min 3 points)' });
    }

    const incidents = await Incident.getAll({ status: 'active' });
    const overlappingIncidents = incidents.filter(inc => {
      return isPointInPolygon([inc.start_lat, inc.start_lon], polygon);
    });

    res.json({
      success: true,
      overlap_count: overlappingIncidents.length,
      incidents: overlappingIncidents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
