import manpowerModel from './manpower_ml_model.json';

interface ManpowerModelType {
  corridor_scales: Record<string, number>;
  hourly_distributions: Record<string, number[]>;
  corridors: string[];
}

const model = manpowerModel as unknown as ManpowerModelType;

export interface RecommendedShift {
  position: string;
  corridor: string;
  officersNeeded: number;
  lead: string;
  activeShift: string;
}

export interface ManpowerEvaluationResult {
  recommendedShifts: RecommendedShift[];
  totalRecommended: number;
  availableStaff: number;
  statusText: string;
  statusColorClass: string;
}

// Fixed leads and shifts for simulation aesthetics
const POSITION_LEADS = [
  { position: 'MG Road Gate', corridor: 'CBD 1', lead: 'ASI Raju Hegde', activeShift: 'Shift A' },
  { position: 'Queens Statue Circle', corridor: 'CBD 2', lead: 'SI Kumar Swamy', activeShift: 'Shift A' },
  { position: 'Cubbon Rd/Museum Junc', corridor: 'CBD 1', lead: 'Inspector सुरेश', activeShift: 'Shift A' },
  { position: 'BSNL CACT Underpass', corridor: 'ORR East 2', lead: 'HC Manjunath Prasanna', activeShift: 'Shift B' },
  { position: 'Jalahalli Cross Junction', corridor: 'Tumkur Road', lead: 'ASI Chandra Dev', activeShift: 'Shift B' },
  { position: 'Agara Junction', corridor: 'ORR East 1', lead: 'SI Prakash Kumar', activeShift: 'Shift C' },
];

interface IncidentType {
  id: string;
  status: 'active' | 'resolved' | 'closed';
  start_address?: string;
  corridor: string;
  priority: 'High' | 'Low';
}

/**
 * Dynamically predicts manpower needs per post using ML spatio-temporal distributions,
 * weather factors, and active telemetry incidents.
 * 
 * @param hour Current replay hour (0-23)
 * @param weather Current weather mode ('clear' | 'light_rain' | 'heavy_rain')
 * @param activeIncidents Current list of incidents
 */
export function evaluateManpowerNeeds(
  hour: number,
  weather: string,
  activeIncidents: IncidentType[]
): ManpowerEvaluationResult {
  const activeList = activeIncidents.filter((i) => i.status === 'active');
  const availableStaff = 31; // Constant available officers from command pool

  // Compute weather multiplier
  let weatherMultiplier = 1.0;
  if (weather === 'light_rain') weatherMultiplier = 1.4;
  if (weather === 'heavy_rain') weatherMultiplier = 2.2;

  let totalRecommended = 0;

  const recommendedShifts: RecommendedShift[] = POSITION_LEADS.map((p) => {
    // 1. Get base corridor scale (log-activity weight)
    const baseScale = model.corridor_scales[p.corridor] !== undefined ? model.corridor_scales[p.corridor] : 1.0;

    // 2. Get hourly probability distribution for the corridor
    const hourDist = model.hourly_distributions[p.corridor] !== undefined
      ? (model.hourly_distributions[p.corridor][hour] || 0.04)
      : 0.04;

    // 3. Compute baseline predicted manpower (scale probability to average hourly need)
    let rawNeed = baseScale * hourDist * 24;

    // 4. Apply weather factors
    rawNeed *= weatherMultiplier;

    // 5. Apply active incident dispatch overhead (+2 per active incident on corridor, +4 directly at junction)
    activeList.forEach((inc) => {
      if (inc.corridor === p.corridor) {
        rawNeed += 2;
        // Check if incident is directly at this post's location
        const addressStr = inc.start_address || '';
        const locationLower = addressStr.toLowerCase();
        const positionLower = p.position.toLowerCase().replace('junction', '').replace('circle', '').trim();
        if (locationLower.includes(positionLower)) {
          rawNeed += 2; // direct post crash overhead
        }
      }
    });

    // Clamp recommendation between 1 and 8 officers per post
    const officersNeeded = Math.max(1, Math.min(8, Math.round(rawNeed)));
    totalRecommended += officersNeeded;

    return {
      position: p.position,
      corridor: p.corridor,
      officersNeeded,
      lead: p.lead,
      activeShift: p.activeShift,
    };
  });

  // Calculate staffing alert status
  let statusText = 'Optimal Ratio ✅';
  let statusColorClass = 'text-emerald-400';

  if (totalRecommended > availableStaff) {
    statusText = 'Under-staffed ⚠️';
    statusColorClass = 'text-red-400 animate-pulse';
  } else if (totalRecommended < 15) {
    statusText = 'Over-staffed';
    statusColorClass = 'text-yellow-400';
  }

  return {
    recommendedShifts,
    totalRecommended,
    availableStaff,
    statusText,
    statusColorClass,
  };
}
