const db = require('../db');

class Officer {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM officers', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(r => ({
          ...r,
          specializations: r.specializations ? JSON.parse(r.specializations) : [],
          familiar_areas: r.familiar_areas ? JSON.parse(r.familiar_areas) : [],
          badges: r.badges ? JSON.parse(r.badges) : []
        })));
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM officers WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          specializations: row.specializations ? JSON.parse(row.specializations) : [],
          familiar_areas: row.familiar_areas ? JSON.parse(row.familiar_areas) : [],
          badges: row.badges ? JSON.parse(row.badges) : []
        });
      });
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO officers (
          id, name, rank, station, zone, specializations, familiar_areas,
          performance_score, total_incidents_handled, avg_response_time_minutes,
          current_status, badges
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.id,
        data.name,
        data.rank,
        data.station,
        data.zone,
        JSON.stringify(data.specializations || []),
        JSON.stringify(data.familiar_areas || []),
        data.performance_score || 80,
        data.total_incidents_handled || 0,
        data.avg_response_time_minutes || 5.0,
        data.current_status || 'off_duty',
        JSON.stringify(data.badges || [])
      ];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        Officer.getById(data.id).then(resolve).catch(reject);
      });
    });
  }

  static update(id, updates) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(updates);
      if (keys.length === 0) return reject(new Error('No fields to update'));

      // Convert arrays to JSON strings for SQLite persistence
      if ('specializations' in updates) updates.specializations = JSON.stringify(updates.specializations);
      if ('familiar_areas' in updates) updates.familiar_areas = JSON.stringify(updates.familiar_areas);
      if ('badges' in updates) updates.badges = JSON.stringify(updates.badges);

      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const query = `UPDATE officers SET ${setClause} WHERE id = ?`;
      const params = [...keys.map(k => updates[k]), id];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        Officer.getById(id).then(resolve).catch(reject);
      });
    });
  }
}

module.exports = Officer;
