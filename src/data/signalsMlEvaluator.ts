import signalsModel from './signals_ml_model.json';

interface SignalsModelType {
  hourly_flow_ratios: number[];
  weather_lost_time: Record<string, number>;
  junction_corridors: Record<string, string>;
}

const model = signalsModel as unknown as SignalsModelType;

export interface SignalRecommendation {
  junctionName: string;
  corridor: string;
  currentCycle: number;
  optimalCycle: number;
  mainSplitSec: number;
  crossSplitSec: number;
  flowEfficiencyGain: number;
}

export interface VaccineStep {
  day: string;
  text: string;
  done: boolean;
}

interface IncidentType {
  id: string;
  status: 'active' | 'resolved' | 'closed';
  start_address?: string;
  corridor: string;
  priority: 'High' | 'Low';
  incident_type?: string;
  description?: string;
}

/**
 * Evaluates multi-junction optimal cycle timings based on Webster's delay model.
 * Co = (1.5L + 5) / (1 - Y)
 * 
 * @param hour Current replay hour (0-23)
 * @param weather Current weather mode ('clear' | 'light_rain' | 'heavy_rain')
 * @param activeIncidents Current active incidents list
 */
export function evaluateSignalTimings(
  hour: number,
  weather: string,
  activeIncidents: IncidentType[]
): SignalRecommendation[] {
  const activeList = activeIncidents.filter((i) => i.status === 'active');
  const lostTime = model.weather_lost_time[weather] !== undefined ? model.weather_lost_time[weather] : 10;
  
  // Base Y (flow ratio) from hour of day
  const baseFlowRatio = model.hourly_flow_ratios[hour] !== undefined ? model.hourly_flow_ratios[hour] : 0.40;

  return Object.entries(model.junction_corridors).map(([junctionName, corridor]) => {
    let Y = baseFlowRatio;

    // Adjust Y (traffic flow saturation) based on active incidents on this corridor
    activeList.forEach((inc) => {
      if (inc.corridor === corridor) {
        Y += 0.08; // incident bottleneck overhead
        
        // Extra flow ratio penalty if incident is directly at the junction location
        const address = inc.start_address || '';
        const addressLower = address.toLowerCase();
        const juncLower = junctionName.toLowerCase().replace('junction', '').replace('circle', '').trim();
        if (addressLower.includes(juncLower)) {
          Y += 0.12; // blocked junction penalty
        }
      }
    });

    // Clamp Y to prevent divide-by-zero or negative cycles (Webster equation denominator)
    Y = Math.max(0.20, Math.min(0.85, Y));

    // Webster's optimal cycle length equation: Co = (1.5 * L + 5) / (1 - Y)
    let Co = Math.round((1.5 * lostTime + 5) / (1 - Y));
    
    // Clamp cycles between standard operational limits
    Co = Math.max(60, Math.min(180, Co));

    // Green split calculation based on main road traffic priority
    let mainRatio = 0.55;
    if (Y > 0.65) {
      mainRatio = 0.70; // favor main corridor heavily
    } else if (Y > 0.50) {
      mainRatio = 0.62;
    }

    const mainSplitSec = Math.round(Co * mainRatio);
    const crossSplitSec = Co - mainSplitSec;

    // Flow efficiency gain calculations
    let efficiency = 10; // baseline adaptive control benefits
    if (weather === 'light_rain') efficiency += 4;
    if (weather === 'heavy_rain') efficiency += 8;
    
    // Webster provides huge relief when actual blockages exist
    const corridorIncidentCount = activeList.filter(i => i.corridor === corridor).length;
    efficiency += corridorIncidentCount * 6;

    const flowEfficiencyGain = Math.min(30, efficiency);

    // Baseline current cycle before optimization (standard is 120s, or 90s off-peak)
    let currentCycle = 120;
    if (hour >= 23 || hour <= 6) {
      currentCycle = 90; // off-peak baseline cycle
    }

    return {
      junctionName,
      corridor,
      currentCycle,
      optimalCycle: Co,
      mainSplitSec,
      crossSplitSec,
      flowEfficiencyGain
    };
  });
}

/**
 * Dynamically compiles a 4-step Route Vaccination Timeline based on traffic telemetry.
 * 
 * @param activeIncidents Current active incidents list
 * @param weather Current weather mode ('clear' | 'light_rain' | 'heavy_rain')
 */
export function generateRouteVaccinationTimeline(
  activeIncidents: IncidentType[],
  weather: string
): VaccineStep[] {
  const activeList = activeIncidents.filter((i) => i.status === 'active');
  
  // Check if a road work / utility digging incident is active (such as FKID000002)
  const isConstructionActive = activeList.some(
    (inc) => inc.incident_type === 'road_work' || 
             inc.id === 'FKID000002' || 
             (inc.description && inc.description.toLowerCase().includes('digging'))
  );

  if (isConstructionActive) {
    return [
      { day: 'Day -3', text: 'Direct BBMP to clear alternate lanes and potholes around Lalbagh Road.', done: true },
      { day: 'Day -2', text: 'Issue WFH advisories to Wilson Garden IT corridors to reduce base flow.', done: true },
      { day: 'Day -1', text: 'Pre-position heavy tow trucks near Urvashi Junction for immediate stall clearance.', done: false },
      { day: 'Day 0', text: 'Apply Webster cycle recalibrations and initiate green waves along CBD links.', done: false }
    ];
  }

  if (weather === 'heavy_rain') {
    return [
      { day: 'Day -3', text: 'Direct BBMP Storm Water Drain (SWD) crews to clear trash blockages at BSNL CACT.', done: true },
      { day: 'Day -2', text: 'Alert BESCOM to verify standby generator power at low-lying pump stations.', done: true },
      { day: 'Day -1', text: 'Pre-stage mobile dewatering pumps at ORR East 2 underpasses.', done: false },
      { day: 'Day 0', text: 'Activate rain-adapted Webster timings to flush waterlogging backups.', done: false }
    ];
  }

  // Standard planned event schedule (default)
  return [
    { day: 'Day -3', text: 'Push gentle advisory on socials & adjust MapMyIndia routing weights.', done: true },
    { day: 'Day -2', text: 'Distribute WFH advisories to Whitefield IT Parks & adjust alternative timings.', done: true },
    { day: 'Day -1', text: 'Pre-position barricade units & post warning VMS signage.', done: false },
    { day: 'Day 0', text: 'Activate barricade checks and initiate signal green-waves at T-2h.', done: false }
  ];
}
