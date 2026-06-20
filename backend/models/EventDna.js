const db = require('../db');

class EventDna {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM event_dna_profiles', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(r => ({
          ...r,
          mode_split: r.mode_split ? JSON.parse(r.mode_split) : null
        })));
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM event_dna_profiles WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          mode_split: row.mode_split ? JSON.parse(row.mode_split) : null
        });
      });
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO event_dna_profiles (
          profile_name, incident_type, avg_duration_hours, avg_delay_minutes,
          avg_manpower_needed, avg_barricade_points, weather_sensitivity, mode_split
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.profile_name,
        data.incident_type,
        data.avg_duration_hours,
        data.avg_delay_minutes,
        data.avg_manpower_needed,
        data.avg_barricade_points,
        data.weather_sensitivity || 1.0,
        JSON.stringify(data.mode_split || {})
      ];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        EventDna.getById(this.lastID).then(resolve).catch(reject);
      });
    });
  }
}

module.exports = EventDna;
