const db = require('../db');

class Incident {
  static getAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM incidents';
      const params = [];
      const conditions = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      if (filters.corridor) {
        conditions.push('corridor = ?');
        params.push(filters.corridor);
      }
      if (filters.priority) {
        conditions.push('priority = ?');
        params.push(filters.priority);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        // Normalize boolean values
        resolve(rows.map(r => ({
          ...r,
          is_diversion: !!r.is_diversion,
          is_verified: !!r.is_verified
        })));
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM incidents WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          is_diversion: !!row.is_diversion,
          is_verified: !!row.is_verified
        });
      });
    });
  }

  static create(data) {
    return new Promise((resolve, reject) => {
      const id = data.id || `FKID${String(Math.floor(Math.random() * 900000) + 100000)}`;
      const query = `
        INSERT INTO incidents (
          id, event_type, incident_type, start_lat, start_lon, end_lat, end_lon,
          start_address, end_address, incident_category, is_diversion, created_at,
          scheduled_end, status, is_verified, last_updated, description, vehicle_type,
          vehicle_reg, corridor, priority, first_response_at, attachments, version,
          reported_by, created_by, assigned_to, escalated_to, additional_field, locality,
          sub_locality, kg_id, resolved_address, resolved_lat, resolved_lon, resolved_by,
          resolved_at, closed_by, closed_at, additional_notes, division, zone, junction,
          commuter_impact_score, duration_sla_hours, estimated_clearance, backup_field
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        data.event_type || 'unplanned',
        data.incident_type,
        data.start_lat,
        data.start_lon,
        data.end_lat || data.start_lat,
        data.end_lon || data.start_lon,
        data.start_address,
        data.end_address || null,
        data.incident_category || null,
        data.is_diversion ? 1 : 0,
        data.created_at || new Date().toISOString(),
        data.scheduled_end || null,
        data.status || 'active',
        data.is_verified ? 1 : 0,
        new Date().toISOString(),
        data.description,
        data.vehicle_type || null,
        data.vehicle_reg || null,
        data.corridor || 'Non-corridor',
        data.priority || 'Low',
        data.first_response_at || null,
        data.attachments ? JSON.stringify(data.attachments) : null,
        data.version || 1,
        data.reported_by || 'FKUSR00011',
        data.created_by || 'FKUSR00001',
        data.assigned_to || null,
        data.escalated_to || null,
        data.additional_field || null,
        data.locality || 'Unknown',
        data.sub_locality || null,
        data.kg_id || `FKKG000${Math.floor(Math.random() * 1000)}`,
        data.resolved_address || null,
        data.resolved_lat || null,
        data.resolved_lon || null,
        data.resolved_by || null,
        data.resolved_at || null,
        data.closed_by || null,
        data.closed_at || null,
        data.additional_notes || null,
        data.division || 'Bengaluru Corporation',
        data.zone || 'Central Zone 2',
        data.junction || 'Junction',
        data.commuter_impact_score || 45,
        data.duration_sla_hours || 4,
        data.estimated_clearance || null,
        data.backup_field || null
      ];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        Incident.getById(id).then(resolve).catch(reject);
      });
    });
  }

  static update(id, updates) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(updates);
      if (keys.length === 0) return reject(new Error('No fields to update'));

      // Convert boolean inputs to integers for SQLite mapping
      if ('is_diversion' in updates) updates.is_diversion = updates.is_diversion ? 1 : 0;
      if ('is_verified' in updates) updates.is_verified = updates.is_verified ? 1 : 0;

      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const query = `UPDATE incidents SET ${setClause}, last_updated = ? WHERE id = ?`;
      const params = [...keys.map(k => updates[k]), new Date().toISOString(), id];

      db.run(query, params, function(err) {
        if (err) return reject(err);
        if (this.changes === 0) return resolve(null);
        Incident.getById(id).then(resolve).catch(reject);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM incidents WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      });
    });
  }

  static getActiveCount() {
    return new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM incidents WHERE status = 'active'", (err, row) => {
        if (err) return reject(err);
        resolve(row.count);
      });
    });
  }
}

module.exports = Incident;
