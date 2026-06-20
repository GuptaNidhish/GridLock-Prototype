const db = require('../db');

class BarricadePlan {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM barricade_plans', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(r => ({
          ...r,
          barricade_points: r.barricade_points ? JSON.parse(r.barricade_points) : [],
          signage_points: r.signage_points ? JSON.parse(r.signage_points) : [],
          diversion_routes: r.diversion_routes ? JSON.parse(r.diversion_routes) : []
        })));
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM barricade_plans WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          barricade_points: row.barricade_points ? JSON.parse(row.barricade_points) : [],
          signage_points: row.signage_points ? JSON.parse(row.signage_points) : [],
          diversion_routes: row.diversion_routes ? JSON.parse(row.diversion_routes) : []
        });
      });
    });
  }

  static getByIncidentId(incidentId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM barricade_plans WHERE incident_id = ?', [incidentId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(r => ({
          ...r,
          barricade_points: r.barricade_points ? JSON.parse(r.barricade_points) : [],
          signage_points: r.signage_points ? JSON.parse(r.signage_points) : [],
          diversion_routes: r.diversion_routes ? JSON.parse(r.diversion_routes) : []
        })));
      });
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO barricade_plans (
          event_dna_profile_id, incident_id, barricade_points, signage_points,
          diversion_routes, total_officers, setup_time_minutes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.event_dna_profile_id || null,
        data.incident_id,
        JSON.stringify(data.barricade_points || []),
        JSON.stringify(data.signage_points || []),
        JSON.stringify(data.diversion_routes || []),
        data.total_officers || 0,
        data.setup_time_minutes || 0,
        data.status || 'pending'
      ];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        BarricadePlan.getById(this.lastID).then(resolve).catch(reject);
      });
    });
  }

  static update(id, updates) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(updates);
      if (keys.length === 0) return reject(new Error('No fields to update'));

      if ('barricade_points' in updates) updates.barricade_points = JSON.stringify(updates.barricade_points);
      if ('signage_points' in updates) updates.signage_points = JSON.stringify(updates.signage_points);
      if ('diversion_routes' in updates) updates.diversion_routes = JSON.stringify(updates.diversion_routes);

      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const query = `UPDATE barricade_plans SET ${setClause} WHERE id = ?`;
      const params = [...keys.map(k => updates[k]), id];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        BarricadePlan.getById(id).then(resolve).catch(reject);
      });
    });
  }
}

module.exports = BarricadePlan;
