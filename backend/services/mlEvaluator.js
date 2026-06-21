const fs = require('fs');
const path = require('path');

// Load model JSON files
const cisModelPath = path.join(__dirname, '../../src/data/cis_ml_model.json');
const ttrModelPath = path.join(__dirname, '../../src/data/ttr_ml_model.json');

let cisModel = null;
let ttrModel = null;

try {
  cisModel = JSON.parse(fs.readFileSync(cisModelPath, 'utf8'));
} catch (err) {
  console.error('Failed to load CIS ML model in backend:', err.message);
}

try {
  ttrModel = JSON.parse(fs.readFileSync(ttrModelPath, 'utf8'));
} catch (err) {
  console.error('Failed to load TTR ML model in backend:', err.message);
}

// Tree traversal helper
function evaluateTree(node, features) {
  if (!node) return 0;
  if (node.type === 'leaf') {
    return node.value;
  }
  const val = features[node.feature] !== undefined ? features[node.feature] : -1;
  if (val <= node.threshold) {
    return evaluateTree(node.left, features);
  } else {
    return evaluateTree(node.right, features);
  }
}

/**
 * Predicts Commuter Impact Score (CIS) in real-time
 */
function evaluateCis(incident, hour) {
  if (!cisModel) return 45; // fallback

  const corridorKey = incident.corridor || 'Non-corridor';
  const corridorCode = cisModel.category_maps.corridor[corridorKey] !== undefined
    ? cisModel.category_maps.corridor[corridorKey]
    : (cisModel.category_maps.corridor['Non-corridor'] || 0);

  const vehKey = incident.vehicle_type || 'private_car';
  const vehCode = cisModel.category_maps.veh_type[vehKey] !== undefined
    ? cisModel.category_maps.veh_type[vehKey]
    : (cisModel.category_maps.veh_type['private_car'] || 0);

  let causeKey = incident.incident_type;
  if (causeKey === 'road_work') {
    causeKey = 'construction';
  }
  const causeCode = cisModel.category_maps.event_cause[causeKey] !== undefined
    ? cisModel.category_maps.event_cause[causeKey]
    : (cisModel.category_maps.event_cause['others'] || 0);

  const requiresRoadClosure = incident.is_diversion ? 1 : 0;

  const features = {
    corridor_encoded: corridorCode,
    veh_type_encoded: vehCode,
    event_cause_encoded: causeCode,
    requires_road_closure: requiresRoadClosure,
    hour: hour !== undefined ? hour : new Date().getHours()
  };

  const score = evaluateTree(cisModel.tree, features);
  return Math.max(10, Math.min(100, Math.round(score)));
}

/**
 * Predicts SLA duration hours (TTR) in real-time
 */
function evaluateTtr(incident) {
  if (!ttrModel) return 4; // fallback

  let causeKey = incident.incident_type;
  if (causeKey === 'road_work') {
    causeKey = 'construction';
  }
  const causeCode = ttrModel.category_maps.event_cause[causeKey] !== undefined
    ? ttrModel.category_maps.event_cause[causeKey]
    : (ttrModel.category_maps.event_cause['others'] || 0);

  const priorityCode = ttrModel.category_maps.priority[incident.priority] !== undefined
    ? ttrModel.category_maps.priority[incident.priority]
    : (ttrModel.category_maps.priority['Low'] || 0);

  const stationKey = incident.locality || 'Unknown';
  const stationCode = ttrModel.category_maps.police_station[stationKey] !== undefined
    ? ttrModel.category_maps.police_station[stationKey]
    : (ttrModel.category_maps.police_station['Unknown'] || 0);

  const corridorKey = incident.corridor || 'Non-corridor';
  const corridorCode = ttrModel.category_maps.corridor[corridorKey] !== undefined
    ? ttrModel.category_maps.corridor[corridorKey]
    : (ttrModel.category_maps.corridor['Non-corridor'] || 0);

  const vehKey = incident.vehicle_type || 'private_car';
  const vehCode = ttrModel.category_maps.veh_type[vehKey] !== undefined
    ? ttrModel.category_maps.veh_type[vehKey]
    : (ttrModel.category_maps.veh_type['private_car'] || 0);

  const features = {
    event_cause_encoded: causeCode,
    priority_encoded: priorityCode,
    police_station_encoded: stationCode,
    corridor_encoded: corridorCode,
    veh_type_encoded: vehCode
  };

  const predictedTtrHours = evaluateTree(ttrModel.tree, features);
  return Math.max(0.5, parseFloat(predictedTtrHours.toFixed(1)));
}

module.exports = {
  evaluateCis,
  evaluateTtr
};
