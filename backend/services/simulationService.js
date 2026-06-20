const Incident = require('../models/Incident');
const { broadcast } = require('./websocketService');

// Pick & Rand helpers
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

const CORRIDORS = ['Tumkur Road', 'ORR East 1', 'ORR East 2', 'CBD 2', 'Non-corridor'];
const TYPES = ['vehicle_breakdown', 'tree_fall', 'accident', 'water_logging', 'road_work'];
const LOCATIONS = [
  { name: 'Tumkur Rd near Peenya 2nd Stage', lat: 13.028, lon: 77.518, corridor: 'Tumkur Road' },
  { name: 'Hebbal Flyover Service Rd', lat: 13.035, lon: 77.597, corridor: 'ORR East 1' },
  { name: 'Mekhri Circle Underpass', lat: 13.013, lon: 77.590, corridor: 'CBD 2' },
  { name: 'Silk Board Signal Junction', lat: 12.917, lon: 77.624, corridor: 'ORR East 2' },
  { name: 'Hosur Rd near Madiwala', lat: 12.922, lon: 77.620, corridor: 'ORR East 2' },
  { name: 'Bellary Rd near Palace Grounds', lat: 13.005, lon: 77.585, corridor: 'Non-corridor' },
  { name: 'Mysore Rd near Kengeri', lat: 12.930, lon: 77.520, corridor: 'Non-corridor' },
  { name: 'KR Puram Railway Bridge', lat: 13.000, lon: 77.680, corridor: 'ORR East 1' },
  { name: 'Yeshwanthpur Circle', lat: 13.022, lon: 77.543, corridor: 'Tumkur Road' },
  { name: 'Bannerghatta Rd near IIM', lat: 12.950, lon: 77.600, corridor: 'Non-corridor' },
  { name: 'Koramangala Inner Ring Rd', lat: 12.935, lon: 77.616, corridor: 'Non-corridor' },
  { name: 'Marathahalli Bridge ORR', lat: 12.960, lon: 77.700, corridor: 'ORR East 1' },
];

const DESCRIPTIONS = {
  vehicle_breakdown: [
    'Heavy goods truck stalled blocking two lanes',
    'BMTC bus engine failure near bus stop',
    'Private car tyre burst in fast lane',
    'Auto-rickshaw overheated blocking left lane',
  ],
  tree_fall: [
    'Large banyan tree uprooted blocking full road',
    'Branch fallen on overhead cables and road',
    'Neem tree collapsed after heavy winds',
  ],
  accident: [
    'Multi-vehicle collision involving 3 cars',
    'Two-wheeler skidded and hit divider',
    'KSRTC bus rear-ended by truck',
    'Hit-and-run incident reported by witnesses',
  ],
  water_logging: [
    'Underpass flooded — 2.5 feet water level rising',
    'Storm drain overflow blocking service road',
    'Manhole burst causing street flooding',
  ],
  road_work: [
    'BWSSB pipeline repair blocking one lane',
    'BBMP pothole resurfacing in progress',
    'Metro pillar work causing lane restriction',
  ],
  public_event: [
    'Religious procession blocking main road',
    'Political rally affecting traffic flow',
  ]
};

const OFFICER_NAMES = [
  'SI Ramesh Kumar', 'ASI Pradeep Gowda', 'HC Manjunath', 'PC Suresh Babu',
  'Inspector Kavitha', 'SI Naveen Reddy', 'ASI Bharath', 'HC Srinivas',
];

// In-Memory Simulation State
let simulationActive = true;
let clock = '';
let uptime = 0;
let weather = 'clear';
let feedEntries = [];
let incidentCounter = 200;

let corridorSpeeds = [
  { id: 'tumkur', name: 'Tumkur Road', speed: 35, trend: 'stable' },
  { id: 'bellary', name: 'Bellary Road', speed: 28, trend: 'stable' },
  { id: 'orr_east_1', name: 'ORR East 1', speed: 42, trend: 'stable' },
  { id: 'orr_east_2', name: 'ORR East 2', speed: 15, trend: 'down' },
  { id: 'hosur', name: 'Hosur Road', speed: 22, trend: 'stable' },
  { id: 'cbd_2', name: 'CBD 2', speed: 12, trend: 'down' },
];

let signalPhases = [
  { junctionId: 'hebbal', junctionName: 'Hebbal Flyover', phase: 'green', remaining: 45, cycleDuration: 120, greenDuration: 45, amberDuration: 5, redDuration: 70 },
  { junctionId: 'mekhri', junctionName: 'Mekhri Circle', phase: 'red', remaining: 30, cycleDuration: 90, greenDuration: 35, amberDuration: 5, redDuration: 50 },
  { junctionId: 'silkboard', junctionName: 'Silk Board', phase: 'green', remaining: 60, cycleDuration: 180, greenDuration: 60, amberDuration: 8, redDuration: 112 },
  { junctionId: 'stadium', junctionName: 'Chinnaswamy', phase: 'amber', remaining: 3, cycleDuration: 100, greenDuration: 40, amberDuration: 5, redDuration: 55 },
  { junctionId: 'underpass', junctionName: 'BSNL Underpass', phase: 'red', remaining: 55, cycleDuration: 110, greenDuration: 40, amberDuration: 5, redDuration: 65 },
];

function addFeedEntry(icon, message, severity) {
  const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const entry = {
    id: `feed_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: ts,
    icon,
    message,
    severity
  };
  feedEntries = [entry, ...feedEntries].slice(0, 50);
  broadcast({
    type: 'FEED_UPDATE',
    data: entry
  });
}

function getState() {
  return {
    clock,
    uptime,
    simulationActive,
    feedEntries,
    corridorSpeeds,
    signalPhases,
    weather
  };
}

function toggleSimulation() {
  simulationActive = !simulationActive;
  addFeedEntry('⚙️', `SIMULATION: ${simulationActive ? 'RESUMED' : 'PAUSED'}`, 'info');
  broadcast({
    type: 'SIMULATION_STATE_CHANGE',
    data: { simulationActive }
  });
}

function start() {
  // 1. Clock timer (1s)
  setInterval(() => {
    const now = new Date();
    clock = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    uptime += 1;
    
    broadcast({
      type: 'CLOCK_TICK',
      data: { clock, uptime }
    });
  }, 1000);

  // 2. Signals timer (1s)
  setInterval(() => {
    if (!simulationActive) return;
    signalPhases = signalPhases.map((sp) => {
      let remaining = sp.remaining - 1;
      let phase = sp.phase;

      if (remaining <= 0) {
        if (phase === 'green') {
          phase = 'amber';
          remaining = sp.amberDuration;
        } else if (phase === 'amber') {
          phase = 'red';
          remaining = sp.redDuration;
        } else {
          phase = 'green';
          remaining = sp.greenDuration;
        }
      }

      return { ...sp, phase, remaining };
    });

    broadcast({
      type: 'SIGNALS_TICK',
      data: signalPhases
    });
  }, 1000);

  // 3. Corridor Speed Drift (5s)
  setInterval(() => {
    if (!simulationActive) return;
    corridorSpeeds = corridorSpeeds.map((cs) => {
      const delta = randInt(-4, 4);
      const baseSpeed = weather === 'heavy_rain' ? 12 : weather === 'light_rain' ? 22 : 35;
      let newSpeed = Math.max(4, Math.min(55, cs.speed + delta));

      if (newSpeed > baseSpeed + 15) newSpeed -= 2;
      if (newSpeed < baseSpeed - 10) newSpeed += 2;

      const trend = delta > 1 ? 'up' : delta < -1 ? 'down' : 'stable';
      return { ...cs, speed: newSpeed, trend };
    });

    broadcast({
      type: 'SPEEDS_TICK',
      data: corridorSpeeds
    });
  }, 5000);

  // 4. Auto-Incident Spawner (15s to 25s randomized)
  let nextSpawnTime = randInt(15, 25) * 1000;
  const runSpawner = async () => {
    if (simulationActive) {
      const loc = pick(LOCATIONS);
      const type = pick(TYPES);
      const desc = pick(DESCRIPTIONS[type]);
      incidentCounter += 1;
      const id = `FKID${String(incidentCounter).padStart(6, '0')}`;

      try {
        const newInc = await Incident.create({
          id,
          event_type: 'unplanned',
          incident_type: type,
          start_lat: loc.lat + rand(-0.002, 0.002),
          start_lon: loc.lon + rand(-0.002, 0.002),
          start_address: `${loc.name}, Bengaluru`,
          description: desc,
          corridor: loc.corridor,
          priority: Math.random() > 0.6 ? 'High' : 'Low',
          status: 'active',
          is_verified: Math.random() > 0.3,
          is_diversion: false,
          locality: loc.name.split(' ')[0],
          division: 'Bengaluru Central Corporation',
          zone: pick(['Central Zone 2', 'North Zone 1', 'South Zone 3']),
          junction: loc.name.replace(/\s+/g, ''),
          kg_id: `FKKG${String(randInt(1, 50)).padStart(6, '0')}`,
          created_at: new Date().toISOString(),
          reported_by: `FKUSR${String(randInt(1, 20)).padStart(5, '0')}`,
          created_by: 'FKUSR00001',
          commuter_impact_score: randInt(15, 85),
          duration_sla_hours: pick([2, 4, 8, 12, 24]),
        });

        broadcast({
          type: 'NEW_INCIDENT',
          data: newInc
        });

        addFeedEntry('🔴', `NEW INCIDENT: ${type.replace(/_/g, ' ').toUpperCase()} — ${loc.name} [${id}]`, 'critical');
      } catch (err) {
        console.error('Error spawning auto-incident:', err.message);
      }
    }
    nextSpawnTime = randInt(15, 25) * 1000;
    setTimeout(runSpawner, nextSpawnTime);
  };
  setTimeout(runSpawner, 8000); // start first spawn in 8s

  // 5. Auto-Resolver (30s)
  setInterval(async () => {
    if (!simulationActive) return;
    try {
      const activeIncidents = await Incident.getAll({ status: 'active' });
      if (activeIncidents.length <= 2) return;

      const oldest = activeIncidents[activeIncidents.length - 1];
      const resolver = pick(OFFICER_NAMES);

      const updated = await Incident.update(oldest.id, {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolver
      });

      if (updated) {
        broadcast({
          type: 'INCIDENT_UPDATED',
          data: updated
        });
        addFeedEntry('✅', `RESOLVED: ${oldest.id} cleared by ${resolver}`, 'success');
      }
    } catch (err) {
      console.error('Error resolving auto-incident:', err.message);
    }
  }, 30000);

  // 6. Weather Cycle (90s)
  setInterval(() => {
    if (!simulationActive) return;
    const weathers = ['clear', 'clear', 'light_rain', 'heavy_rain'];
    const nextWeather = pick(weathers);
    weather = nextWeather;

    broadcast({
      type: 'WEATHER_TICK',
      data: { weather }
    });

    if (weather === 'heavy_rain') {
      addFeedEntry('🌧️', 'WEATHER ALERT: Heavy rain detected — Monsoon protocol triggered', 'warning');
    } else if (weather === 'light_rain') {
      addFeedEntry('🌦️', 'WEATHER UPDATE: Light drizzle across Bengaluru — Road surfaces wet', 'info');
    } else {
      addFeedEntry('☀️', 'WEATHER CLEAR: Skies clearing — Normal operations resuming', 'info');
    }
  }, 90000);

  // 7. SLA Breach Checker (20s)
  setInterval(async () => {
    if (!simulationActive) return;
    try {
      const activeList = await Incident.getAll({ status: 'active' });
      const now = Date.now();
      activeList.forEach((inc) => {
        const age = (now - new Date(inc.created_at).getTime()) / (1000 * 60 * 60);
        if (age > inc.duration_sla_hours) {
          addFeedEntry('🚨', `SLA BREACH: ${inc.id} exceeded ${inc.duration_sla_hours}h threshold`, 'critical');
        }
      });
    } catch (err) {
      console.error('Error in SLA check interval:', err.message);
    }
  }, 20000);

  // Startup Feed logs
  addFeedEntry('🤖', 'ASTRAM Command Engine active on server — Monitoring corridors', 'info');
  addFeedEntry('📡', 'Telemetry links verified — All 5 junction sensors streaming', 'info');
}

module.exports = {
  start,
  getState,
  toggleSimulation,
  addFeedEntry
};
