import { Incident } from './mockDatabase';
import ttrModel from './ttr_ml_model.json';

interface DecisionTreeLeaf {
  type: 'leaf';
  value: number;
}

interface DecisionTreeSplit {
  type: 'split';
  feature: string;
  threshold: number;
  left: DecisionTreeNode;
  right: DecisionTreeNode;
}

type DecisionTreeNode = DecisionTreeSplit | DecisionTreeLeaf;

interface TtrModelType {
  category_maps: {
    event_cause: Record<string, number>;
    priority: Record<string, number>;
    police_station: Record<string, number>;
    corridor: Record<string, number>;
    veh_type: Record<string, number>;
  };
  feature_names: string[];
  tree: DecisionTreeNode;
}

const model = ttrModel as unknown as TtrModelType;

// Traverse Decision Tree recursively
function evaluateTree(node: DecisionTreeNode, features: Record<string, number>): number {
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
 * Predicts the expected Time-to-Resolution (TTR) in hours for a single incident using the ML Decision Tree.
 * @param incident The active incident object
 */
export function evaluateIncidentTtr(incident: Incident): number {
  // Map incident_type to event_cause
  let causeKey: string = incident.incident_type;
  if (causeKey === 'road_work') {
    causeKey = 'construction';
  }
  const causeCode = model.category_maps.event_cause[causeKey] !== undefined
    ? model.category_maps.event_cause[causeKey]
    : (model.category_maps.event_cause['others'] || 0);

  const priorityCode = model.category_maps.priority[incident.priority] !== undefined
    ? model.category_maps.priority[incident.priority]
    : (model.category_maps.priority['Low'] || 0);

  const stationKey = incident.locality || 'Unknown';
  const stationCode = model.category_maps.police_station[stationKey] !== undefined
    ? model.category_maps.police_station[stationKey]
    : (model.category_maps.police_station['Unknown'] || 0);

  const corridorKey = incident.corridor || 'Non-corridor';
  const corridorCode = model.category_maps.corridor[corridorKey] !== undefined
    ? model.category_maps.corridor[corridorKey]
    : (model.category_maps.corridor['Non-corridor'] || 0);

  const vehKey = incident.vehicle_type || 'private_car';
  const vehCode = model.category_maps.veh_type[vehKey] !== undefined
    ? model.category_maps.veh_type[vehKey]
    : (model.category_maps.veh_type['private_car'] || 0);

  // Construct features dictionary matching the features used during training:
  // ['event_cause_encoded', 'priority_encoded', 'police_station_encoded', 'corridor_encoded', 'veh_type_encoded']
  const features: Record<string, number> = {
    event_cause_encoded: causeCode,
    priority_encoded: priorityCode,
    police_station_encoded: stationCode,
    corridor_encoded: corridorCode,
    veh_type_encoded: vehCode
  };

  // Run the ML tree inference
  const predictedTtrHours = evaluateTree(model.tree, features);
  
  // Clean values: enforce minimum SLA of 0.5 hours (30 minutes)
  return Math.max(0.5, parseFloat(predictedTtrHours.toFixed(1)));
}
