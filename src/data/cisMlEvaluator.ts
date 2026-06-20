import { Incident } from './mockDatabase';
import cisModel from './cis_ml_model.json';

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

interface CisModelType {
  category_maps: {
    corridor: Record<string, number>;
    veh_type: Record<string, number>;
    event_cause: Record<string, number>;
  };
  feature_names: string[];
  tree: DecisionTreeNode;
}

const model = cisModel as unknown as CisModelType;

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
 * Calculates the Commuter Impact Score (CIS) for a single incident using the Decision Tree model.
 * @param incident The active incident object
 * @param hour The hour of the day (0-23)
 */
export function evaluateIncidentCis(incident: Incident, hour: number): number {
  // Map incident fields to training feature categories
  const corridorKey = incident.corridor || 'Non-corridor';
  const corridorCode = model.category_maps.corridor[corridorKey] !== undefined 
    ? model.category_maps.corridor[corridorKey] 
    : (model.category_maps.corridor['Non-corridor'] || 0);

  const vehKey = incident.vehicle_type || 'private_car';
  const vehCode = model.category_maps.veh_type[vehKey] !== undefined
    ? model.category_maps.veh_type[vehKey]
    : (model.category_maps.veh_type['private_car'] || 0);

  // Map incident_type to event_cause
  let causeKey: string = incident.incident_type;
  if (causeKey === 'road_work') {
    causeKey = 'construction';
  }
  const causeCode = model.category_maps.event_cause[causeKey] !== undefined
    ? model.category_maps.event_cause[causeKey]
    : (model.category_maps.event_cause['others'] || 0);

  const requiresRoadClosure = incident.is_diversion ? 1 : 0;

  // Construct features dictionary matching the features used during training:
  // ['corridor_encoded', 'veh_type_encoded', 'event_cause_encoded', 'requires_road_closure', 'hour']
  const features: Record<string, number> = {
    corridor_encoded: corridorCode,
    veh_type_encoded: vehCode,
    event_cause_encoded: causeCode,
    requires_road_closure: requiresRoadClosure,
    hour: hour
  };

  // Run the ML tree inference
  const score = evaluateTree(model.tree, features);
  return Math.round(score);
}
