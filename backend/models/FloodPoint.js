const db = require('../db');

// Helper to calculate geographical distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class FloodPoint {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM flood_risk_points', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM flood_risk_points WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  static getNear(lat, lon, maxDistanceKm = 1.0) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM flood_risk_points', [], (err, rows) => {
        if (err) return reject(err);
        const near = rows.filter(row => {
          const dist = calculateDistance(lat, lon, row.lat, row.lon);
          return dist <= maxDistanceKm;
        });
        resolve(near);
      });
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO flood_risk_points (
          lat, lon, road_name, locality, risk_level, incident_count,
          avg_resolution_hours, responsible_agency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.lat,
        data.lon,
        data.road_name,
        data.locality,
        data.risk_level || 'Medium',
        data.incident_count || 1,
        data.avg_resolution_hours || 4.0,
        data.responsible_agency || 'BBMP'
      ];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        FloodPoint.getById(this.lastID).then(resolve).catch(reject);
      });
    });
  }
}

module.exports = FloodPoint;
module.exports.calculateDistance = calculateDistance;
