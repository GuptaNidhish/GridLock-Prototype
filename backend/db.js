const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'astram.db');

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Run migrations and seeds sequentially
db.serialize(() => {
  // 1. Incidents Table
  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      event_type TEXT,
      incident_type TEXT,
      start_lat REAL,
      start_lon REAL,
      end_lat REAL,
      end_lon REAL,
      start_address TEXT,
      end_address TEXT,
      incident_category TEXT,
      is_diversion INTEGER,
      created_at TEXT,
      scheduled_end TEXT,
      status TEXT,
      is_verified INTEGER,
      last_updated TEXT,
      description TEXT,
      vehicle_type TEXT,
      vehicle_reg TEXT,
      corridor TEXT,
      priority TEXT,
      first_response_at TEXT,
      attachments TEXT,
      version INTEGER,
      reported_by TEXT,
      created_by TEXT,
      assigned_to TEXT,
      escalated_to TEXT,
      additional_field TEXT,
      locality TEXT,
      sub_locality TEXT,
      kg_id TEXT,
      resolved_address TEXT,
      resolved_lat REAL,
      resolved_lon REAL,
      resolved_by TEXT,
      resolved_at TEXT,
      closed_by TEXT,
      closed_at TEXT,
      additional_notes TEXT,
      division TEXT,
      zone TEXT,
      junction TEXT,
      commuter_impact_score REAL,
      duration_sla_hours REAL,
      estimated_clearance TEXT,
      backup_field TEXT
    )
  `);

  // 2. Officers Table
  db.run(`
    CREATE TABLE IF NOT EXISTS officers (
      id TEXT PRIMARY KEY,
      name TEXT,
      rank TEXT,
      station TEXT,
      zone TEXT,
      specializations TEXT,
      familiar_areas TEXT,
      performance_score REAL,
      total_incidents_handled INTEGER,
      avg_response_time_minutes REAL,
      current_status TEXT,
      badges TEXT
    )
  `);

  // 3. Event DNA Profiles Table
  db.run(`
    CREATE TABLE IF NOT EXISTS event_dna_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_name TEXT,
      incident_type TEXT,
      avg_duration_hours REAL,
      avg_delay_minutes REAL,
      avg_manpower_needed REAL,
      avg_barricade_points REAL,
      weather_sensitivity REAL,
      mode_split TEXT
    )
  `);

  // 4. Barricade Plans Table
  db.run(`
    CREATE TABLE IF NOT EXISTS barricade_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_dna_profile_id INTEGER,
      incident_id TEXT,
      barricade_points TEXT,
      signage_points TEXT,
      diversion_routes TEXT,
      total_officers INTEGER,
      setup_time_minutes REAL,
      status TEXT
    )
  `);

  // 5. Flood Risk Points Table
  db.run(`
    CREATE TABLE IF NOT EXISTS flood_risk_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL,
      lon REAL,
      road_name TEXT,
      locality TEXT,
      risk_level TEXT,
      incident_count INTEGER,
      avg_resolution_hours REAL,
      responsible_agency TEXT
    )
  `);

  // Seed Data
  db.get("SELECT COUNT(*) as count FROM incidents", (err, row) => {
    if (err) return console.error('Error checking incidents:', err.message);
    if (row.count === 0) {
      console.log('Seeding initial database data...');

      // Seed Incidents
      const seedIncidents = [
        {
          id: 'FKID000000',
          event_type: 'unplanned',
          incident_type: 'vehicle_breakdown',
          start_lat: 13.04000,
          start_lon: 77.51810,
          end_lat: 13.04000,
          end_lon: 77.51810,
          start_address: 'Tumkur Road near Peenya Metro Station, Bengaluru - 560057',
          description: 'Breakdown of LCV carrying goods, blocking middle lane.',
          vehicle_type: 'lcv',
          vehicle_reg: 'FKN00GL2394',
          corridor: 'Tumkur Road',
          priority: 'High',
          status: 'closed',
          is_verified: 1,
          is_diversion: 0,
          locality: 'Peenya',
          division: 'North Corporation',
          zone: 'North Zone 1',
          junction: 'PeenyaJunc',
          kg_id: 'FKKG000010',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          first_response_at: new Date(Date.now() - 3600000 * 2.9).toISOString(),
          resolved_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          closed_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
          reported_by: 'FKUSR00003',
          created_by: 'FKUSR00001',
          assigned_to: 'FKUSR00006',
          commuter_impact_score: 42,
          duration_sla_hours: 2
        },
        {
          id: 'FKID000002',
          event_type: 'unplanned',
          incident_type: 'road_work',
          start_lat: 12.95680,
          start_lon: 77.58750,
          end_lat: 12.95680,
          end_lon: 77.58750,
          start_address: 'Urvashi Junction, Lalbagh Road, Bengaluru - 560027',
          description: 'Cement block spills and road digging blocking traffic near Urvashi Junction. Chronic infrastructure issue.',
          vehicle_type: 'heavy_vehicle',
          corridor: 'Non-corridor',
          priority: 'Low',
          status: 'active',
          is_verified: 1,
          is_diversion: 0,
          locality: 'Wilson Garden',
          division: 'Bengaluru Central Corporation',
          zone: 'Central Zone 2',
          junction: 'LalbaghMainGateJunc',
          kg_id: 'FKKG000002',
          created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
          first_response_at: new Date(Date.now() - 3600000 * 24 * 4.9).toISOString(),
          reported_by: 'FKUSR00003',
          created_by: 'FKUSR00001',
          assigned_to: 'FKUSR00003',
          commuter_impact_score: 65,
          duration_sla_hours: 24
        },
        {
          id: 'FKID000003',
          event_type: 'unplanned',
          incident_type: 'tree_fall',
          start_lat: 13.00340,
          start_lon: 77.57900,
          end_lat: 13.00340,
          end_lon: 77.57900,
          start_address: 'Sankey Road, Sadashivanagar, Bengaluru - 560080',
          description: 'Gulmohar tree fall blocking major portion of Sankey road, power cables down.',
          corridor: 'CBD 2',
          priority: 'High',
          status: 'closed',
          is_verified: 1,
          is_diversion: 1,
          locality: 'Sadashivanagar',
          division: 'North Corporation',
          zone: 'North Zone 1',
          junction: 'SankeyCircle',
          kg_id: 'FKKG000003',
          created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
          first_response_at: new Date(Date.now() - 3600000 * 24 * 1.95).toISOString(),
          resolved_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          closed_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          reported_by: 'FKUSR00003',
          created_by: 'FKUSR00001',
          assigned_to: 'FKUSR00005',
          commuter_impact_score: 74,
          duration_sla_hours: 4
        },
        {
          id: 'FKID000012',
          event_type: 'unplanned',
          incident_type: 'water_logging',
          start_lat: 12.99952,
          start_lon: 77.68275,
          end_lat: 12.99952,
          end_lon: 77.68275,
          start_address: 'BSNL CACT Underpass, Outer Ring Road, Bengaluru - 560016',
          description: 'Lorry stuck in underpass due to 3-feet water logging. Traffic moving extremely slow.',
          vehicle_type: 'heavy_vehicle',
          corridor: 'ORR East 2',
          priority: 'High',
          status: 'active',
          is_verified: 1,
          is_diversion: 1,
          locality: 'Whitefield',
          division: 'Bengaluru Central Corporation',
          zone: 'Central Zone 2',
          junction: 'TinFactoryJunction',
          kg_id: 'FKKG000012',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          first_response_at: new Date(Date.now() - 3600000 * 1.9).toISOString(),
          reported_by: 'FKUSR00011',
          created_by: 'FKUSR00001',
          assigned_to: 'FKUSR00011',
          commuter_impact_score: 82,
          duration_sla_hours: 6
        }
      ];

      const incStmt = db.prepare(`
        INSERT INTO incidents (
          id, event_type, incident_type, start_lat, start_lon, end_lat, end_lon,
          start_address, description, vehicle_type, vehicle_reg, corridor,
          priority, status, is_verified, is_diversion, locality, division,
          zone, junction, kg_id, created_at, first_response_at, resolved_at,
          closed_at, reported_by, created_by, assigned_to, commuter_impact_score,
          duration_sla_hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      seedIncidents.forEach((inc) => {
        incStmt.run(
          inc.id, inc.event_type, inc.incident_type, inc.start_lat, inc.start_lon, inc.end_lat, inc.end_lon,
          inc.start_address, inc.description, inc.vehicle_type || null, inc.vehicle_reg || null, inc.corridor,
          inc.priority, inc.status, inc.is_verified, inc.is_diversion, inc.locality, inc.division,
          inc.zone, inc.junction, inc.kg_id, inc.created_at, inc.first_response_at || null, inc.resolved_at || null,
          inc.closed_at || null, inc.reported_by, inc.created_by, inc.assigned_to || null, inc.commuter_impact_score,
          inc.duration_sla_hours
        );
      });
      incStmt.finalize();

      // Seed Officers
      const seedOfficers = [
        {
          id: 'FKUSR00003',
          name: 'Inspector Suresh Gowda',
          rank: 'Inspector',
          station: 'Wilson Garden Traffic PS',
          zone: 'Central Zone 2',
          specializations: JSON.stringify(['Incident Management', 'Accident Response']),
          familiar_areas: JSON.stringify(['Wilson Garden', 'Lalbagh Road', 'CBD 2']),
          performance_score: 82,
          total_incidents_handled: 28,
          avg_response_time_minutes: 4.8,
          current_status: 'on_duty',
          badges: JSON.stringify(['Perfect SLA', 'Iron Man'])
        },
        {
          id: 'FKUSR00005',
          name: 'SI Kumar Swamy',
          rank: 'SI',
          station: 'Cubbon Park Traffic PS',
          zone: 'Central Zone 2',
          specializations: JSON.stringify(['Event Orchestration', 'VIP Route Clearing']),
          familiar_areas: JSON.stringify(['Queens Statue Circle', 'Cubbon Road', 'Chinnaswamy Stadium']),
          performance_score: 94,
          total_incidents_handled: 45,
          avg_response_time_minutes: 1.2,
          current_status: 'on_duty',
          badges: JSON.stringify(['Quick Responder', 'Event Commander'])
        },
        {
          id: 'FKUSR00006',
          name: 'ASI Raju Hegde',
          rank: 'ASI',
          station: 'Peenya Traffic PS',
          zone: 'North Zone 1',
          specializations: JSON.stringify(['Heavy Vehicle Diversions', 'Junction Control']),
          familiar_areas: JSON.stringify(['Peenya', 'Tumkur Road', 'Jayamahal Road']),
          performance_score: 87,
          total_incidents_handled: 52,
          avg_response_time_minutes: 2.1,
          current_status: 'on_duty',
          badges: JSON.stringify(['Iron Man'])
        },
        {
          id: 'FKUSR00011',
          name: 'HC Manjunath Prasanna',
          rank: 'HC',
          station: 'Whitefield Traffic PS',
          zone: 'Central Zone 2',
          specializations: JSON.stringify(['Monsoon Response', 'Water Pump Coordination']),
          familiar_areas: JSON.stringify(['ORR East 2', 'Whitefield', 'BSNL CACT Underpass']),
          performance_score: 85,
          total_incidents_handled: 34,
          avg_response_time_minutes: 3.5,
          current_status: 'on_duty',
          badges: JSON.stringify(['Storm Rider'])
        }
      ];

      const offStmt = db.prepare(`
        INSERT INTO officers (
          id, name, rank, station, zone, specializations, familiar_areas,
          performance_score, total_incidents_handled, avg_response_time_minutes,
          current_status, badges
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      seedOfficers.forEach((off) => {
        offStmt.run(
          off.id, off.name, off.rank, off.station, off.zone, off.specializations, off.familiar_areas,
          off.performance_score, off.total_incidents_handled, off.avg_response_time_minutes,
          off.current_status, off.badges
        );
      });
      offStmt.finalize();

      // Seed Event DNA Profiles
      db.run(`
        INSERT INTO event_dna_profiles (
          profile_name, incident_type, avg_duration_hours, avg_delay_minutes,
          avg_manpower_needed, avg_barricade_points, weather_sensitivity, mode_split
        ) VALUES (
          'IPL Cricket Match (Chinnaswamy Stadium)',
          'planned_event',
          6.5,
          47,
          22,
          6,
          2.1,
          '{"private_car":0.3,"cab_rideshare":0.25,"metro":0.15,"bmtc_bus":0.1,"two_wheeler":0.15,"walk":0.05}'
        )
      `);

      // Seed Barricades
      const seedBarricades = [
        {
          id: 'BP001',
          event_dna_profile_id: 1,
          incident_id: 'FKID000003',
          barricade_points: JSON.stringify([{ lat: 12.9790, lon: 77.5950, road_name: 'MG Road Link', type: 'full_block', officers: 3 }]),
          signage_points: JSON.stringify([{ lat: 12.9770, lon: 77.5940, text: 'MG Road Closed' }]),
          diversion_routes: JSON.stringify(['Residency Road', 'Richmond Road']),
          total_officers: 3,
          setup_time_minutes: 15.0,
          status: 'deployed'
        },
        {
          id: 'BP002',
          event_dna_profile_id: 1,
          incident_id: 'FKID000003',
          barricade_points: JSON.stringify([{ lat: 12.9815, lon: 77.5962, road_name: 'Cubbon Road Entry', type: 'partial_block', officers: 2 }]),
          signage_points: JSON.stringify([{ lat: 12.9805, lon: 77.5952, text: 'Slow traffic ahead' }]),
          diversion_routes: JSON.stringify(['Infantry Road']),
          total_officers: 2,
          setup_time_minutes: 10.0,
          status: 'deployed'
        }
      ];

      const barStmt = db.prepare(`
        INSERT INTO barricade_plans (
          event_dna_profile_id, incident_id, barricade_points, signage_points,
          diversion_routes, total_officers, setup_time_minutes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      seedBarricades.forEach((bar) => {
        barStmt.run(
          bar.event_dna_profile_id, bar.incident_id, bar.barricade_points, bar.signage_points,
          bar.diversion_routes, bar.total_officers, bar.setup_time_minutes, bar.status
        );
      });
      barStmt.finalize();

      // Seed Flood Risk Points
      const seedFloodRiskPoints = [
        { lat: 12.99952, lon: 77.68275, road_name: 'BSNL CACT Underpass', locality: 'Outer Ring Road', risk_level: 'High', incident_count: 5, avg_resolution_hours: 6.5, responsible_agency: 'BBMP' },
        { lat: 13.00085, lon: 77.68137, road_name: 'Whitefield Road Underpass', locality: 'Whitefield', risk_level: 'High', incident_count: 3, avg_resolution_hours: 4.2, responsible_agency: 'BBMP' },
        { lat: 12.93450, lon: 77.61010, road_name: 'Koramangala 80ft Road Underpass', locality: 'Koramangala', risk_level: 'Medium', incident_count: 2, avg_resolution_hours: 3.0, responsible_agency: 'BBMP' },
        { lat: 13.03580, lon: 77.59710, road_name: 'Hebbal Flyover Loop', locality: 'Hebbal', risk_level: 'Medium', incident_count: 4, avg_resolution_hours: 2.8, responsible_agency: 'BBMP' }
      ];

      const floodStmt = db.prepare(`
        INSERT INTO flood_risk_points (
          lat, lon, road_name, locality, risk_level, incident_count,
          avg_resolution_hours, responsible_agency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      seedFloodRiskPoints.forEach((pt) => {
        floodStmt.run(
          pt.lat, pt.lon, pt.road_name, pt.locality, pt.risk_level, pt.incident_count,
          pt.avg_resolution_hours, pt.responsible_agency
        );
      });
      floodStmt.finalize();

      console.log('Database seeding complete.');
    } else {
      console.log('Database already has data. Skipping seed.');
    }
  });
});

module.exports = db;
