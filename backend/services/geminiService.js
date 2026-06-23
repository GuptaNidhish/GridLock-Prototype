const { GoogleGenerativeAI } = require('@google/generative-ai');
const Incident = require('../models/Incident');

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey !== 'your_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini Service successfully initialized with API Key.');
  } catch (err) {
    console.error('Failed to initialize Gemini Client:', err.message);
  }
} else {
  console.log('Gemini Service running in Fallback Mock Mode (no GEMINI_API_KEY set).');
}

/**
 * Fetch traffic recommendations from Gemini based on active incidents & weather
 */
async function getTrafficRecommendations(weather = 'clear', incidentId = null) {
  try {
    // 1. Get incident(s) from database
    let activeIncidents = [];
    if (incidentId) {
      const incident = await Incident.getById(incidentId);
      if (incident) {
        activeIncidents = [incident];
      }
    } else {
      activeIncidents = await Incident.getAll({ status: 'active' });
    }

    // 2. If no API key, return dynamically compiled fallback data
    if (!genAI) {
      return getMockFallback(activeIncidents, weather, 'NO_API_KEY');
    }

    // 3. Compile context prompt
    const weatherString = weather === 'heavy_rain' ? 'Heavy Torrential Rain (monsoon alert active)'
      : weather === 'light_rain' ? 'Light Drizzle/Rain (wet road conditions)'
        : 'Clear Skies (dry roads)';

    const incidentListString = activeIncidents.map((inc, index) => {
      return `${index + 1}. [ID: ${inc.id}] Type: ${inc.incident_type}, Location: ${inc.start_address}, Severity: ${inc.priority}, Corridor: ${inc.corridor}, Description: ${inc.description}`;
    }).join('\n');

    const prompt = `
You are ASTRAM Traffic Brain, the AI traffic command and orchestration engine for Bengaluru City Police.
Your task is to analyze the current city traffic status and provide concrete, actionable recommendations for dispatchers.

Current Weather: ${weatherString}

Active Traffic Incidents:
${activeIncidents.length === 0 ? 'No active traffic incidents. Flow is nominal.' : incidentListString}

Based on these details, generate concrete traffic recommendations inside a single JSON object.
The JSON must strictly match the following schema:
{
  "apiMode": "LIVE_GEMINI",
  "summary": "A 1-2 sentence executive briefing on the traffic grid state.",
  "barricading": [
    {
      "id": "barricade_1",
      "location": "Junction name or road segment where a barrier should be placed",
      "action": "Specific instructions for what setup is required (e.g., full block, outer lane closure)",
      "officersRequired": 2,
      "signageText": "Text to display on portable VMS boards at this point"
    }
  ],
  "policeDeployment": [
    {
      "id": "police_1",
      "junction": "Junction name where officers are needed",
      "officersCount": 3,
      "role": "Specific duty for officers (e.g. manual bypass signaling, clearing rubberneckers, towing escort)",
      "priority": "High" or "Medium" or "Low"
    }
  ],
  "alternateRoutes": [
    {
      "id": "route_1",
      "congestedRoute": "The corridor/junction currently blocked",
      "suggestedAlternate": "The detailed bypass route suggestion",
      "expectedSavings": "Estimated time saved in minutes (e.g., '15 mins')",
      "vmsMessage": "Brief warning warning sign text for citywide display boards"
    }
  ]
}

Ensure all actions are realistic to the specific locations listed in the active incidents. Focus barricading and deployment priorities on high-impact incidents (like flooding or major accidents) first. If there are no incidents, output low-priority standby patrols and standard monitoring layouts.
`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse response
    const parsed = JSON.parse(text);
    return parsed;

  } catch (error) {
    console.error('Error generating Gemini recommendations, falling back to mock:', error.message);
    let fallbackIncidents = [];
    if (incidentId) {
      const incident = await Incident.getById(incidentId).catch(() => null);
      if (incident) {
        fallbackIncidents = [incident];
      }
    } else {
      fallbackIncidents = await Incident.getAll({ status: 'active' }).catch(() => []);
    }
    return getMockFallback(fallbackIncidents, weather, `ERROR: ${error.message}`);
  }
}

/**
 * Helper to generate diverse wording for mock fallbacks based on incident properties and stable hash of the ID.
 */
function getWordingForIncident(inc) {
  let hash = 0;
  if (inc.id) {
    for (let i = 0; i < inc.id.length; i++) {
      hash = (hash << 5) - hash + inc.id.charCodeAt(i);
      hash |= 0;
    }
  }
  const index = Math.abs(hash);

  const locName = inc.locality || 'Incident Spot';
  const corridorName = inc.corridor && inc.corridor !== 'Non-corridor' ? inc.corridor : 'local roads';

  const barricadeOptions = {
    accident: [
      `Cordon left lanes near ${locName} to establish a safe operational zone for emergency response.`,
      `Set up a divider block on ${corridorName} to prevent rubbernecking delays near the collision site.`,
      `Deploy reflective guidance cones and detour indicators before the accident spot at ${locName}.`
    ],
    water_logging: [
      `Delineate flooded lanes on ${corridorName} using reflective drums and monsoon barrier boards.`,
      `Block entry to the low-lying underpass at ${locName} to prevent commuter water stalling.`,
      `Set up outer lane cordons to steer traffic away from deep water stagnation areas.`
    ],
    vehicle_breakdown: [
      `Place high-visibility safety barriers behind the stalled heavy vehicle on ${corridorName}.`,
      `Cordon the breakdown area near ${locName} to allow safe towing access.`,
      `Set up cone barriers to redirect traffic around the stalled vehicle.`
    ],
    signal_failure: [
      `Install temporary manual signboards and traffic cones to guide vehicles through ${locName} junction.`,
      `Place barrier stands to channelize merging flows at ${locName} until signal power is restored.`,
      `Establish temporary lane separators to maintain straight-line flow through the junction.`
    ],
    default: [
      `Position warning barriers 50m prior to the disruption at ${locName} on ${corridorName}.`,
      `Deploy caution cones around the work crew to isolate the active hazard zone.`,
      `Delineate the utility lane blockage to keep travel lanes clear.`
    ]
  };

  const policeOptions = {
    accident: [
      `Manage lane merging, clear collision debris, and guide recovery cranes to restore lane access.`,
      `Direct traffic away from the impact lanes and coordinate ambulance/tow logistics.`,
      `Orchestrate alternate lane passes and disperse onlooker congestion.`
    ],
    water_logging: [
      `Direct vehicles around flooded underpass channels and assist dewatering pump operations.`,
      `Prevent light vehicles from entering flooded segments and guide heavy transport through the center.`,
      `Supervise drainage clearing efforts and direct stranded commuters to detours.`
    ],
    vehicle_breakdown: [
      `Coordinate crane dispatch, assist the driver in pushing the vehicle to the shoulder, and maintain flow.`,
      `Clear backup queues and assist tow crews in securing the stalled vehicle.`,
      `Manage traffic merging around the breakdown zone and prevent double-parking.`
    ],
    signal_failure: [
      `Deploy officers to conduct manual hand-signal traffic control and resolve cross-street lockups.`,
      `Regulate junction flows manually and prioritize high-volume corridors.`,
      `Synchronize merging vectors using hand signals until signal restoration is complete.`
    ],
    default: [
      `Maintain gridlock monitoring, supervise local diversions, and report flow index telemetry.`,
      `Enforce slow speeds past the work site and manage pedestrian crossings.`,
      `Clear merging lane friction and report update statuses to ASTRAM Command.`
    ]
  };

  const routeOptions = {
    accident: [
      { alt: `Inner Ring Road -> Trinity Circle bypass`, savings: '12-14 mins', msg: `ACCIDENT AT ${locName.toUpperCase()}. BYPASS VIA INNER RING RD.` },
      { alt: `Cubbon Road -> MG Road corridor`, savings: '8-10 mins', msg: `DELAYS AT ${locName.toUpperCase()}. USE CUBBON RD FOR CBD.` },
      { alt: `Adjacent parallel arterial pathways`, savings: '6-8 mins', msg: `COLLISION AHEAD. PLAN ALTERNATE ROUTES VIA ARTERIALS.` }
    ],
    water_logging: [
      { alt: `${corridorName} flyover upper tier (avoid service lane)`, savings: '15-18 mins', msg: `FLOODING AT ${locName.toUpperCase()} UNDERPASS. USE FLYOVER.` },
      { alt: `Sarjapur Main Road -> Haralur detour`, savings: '20 mins', msg: `BSNL UNDERPASS FLOODED. REROUTE VIA SARJAPUR RD.` },
      { alt: `Windsor Manor -> Sankey Road bypass`, savings: '12 mins', msg: `WATER STAGNATION AT ${locName.toUpperCase()}. CHOOSE SANKEY RD.` }
    ],
    default: [
      { alt: `Kanakapura Rd detour or adjacent service links`, savings: '5 mins', msg: `CONGESTION AT ${locName.toUpperCase()}. DRIVE WITH CAUTION.` },
      { alt: `Outer Ring Road flyover bypass channels`, savings: '8 mins', msg: `CORRIDOR SLOWDOWN. DIVERSION BOARDS ACTIVE.` },
      { alt: `Local parallel layout arterial networks`, savings: '6 mins', msg: `ASTRAM ALERT: HIGH CIS AT ${locName.toUpperCase()}. USE ALTERNATES.` }
    ]
  };

  const type = inc.incident_type || 'default';
  const barricades = barricadeOptions[type] || barricadeOptions.default;
  const police = policeOptions[type] || policeOptions.default;
  const routes = routeOptions[type] || routeOptions.default;

  return {
    barricade: barricades[index % barricades.length],
    police: police[index % police.length],
    route: routes[index % routes.length]
  };
}

/**
 * Generate highly relevant dynamic mock recommendations when API is not configured or fails
 */
function getMockFallback(activeIncidents, weather, reason = 'NO_API_KEY') {
  const isRain = weather !== 'clear';
  const hasIncidents = activeIncidents.length > 0;

  const summary = hasIncidents
    ? `Fallback AI Strategy compiled for ${activeIncidents.length} active disruptions under ${weather.replace('_', ' ')} conditions.`
    : `System nominal. Normal flow on all corridors under clear skies. Standby recommendations active.`;

  // Dynamically build recommendation sets from incidents list
  const barricading = [];
  const policeDeployment = [];
  const alternateRoutes = [];

  activeIncidents.forEach((inc, idx) => {
    const wording = getWordingForIncident(inc);

    // 1. Barricade
    barricading.push({
      id: `barricade_${idx}`,
      location: inc.junction || inc.locality || 'Incident Spot',
      action: wording.barricade,
      officersRequired: inc.priority === 'High' ? 3 : 1,
      signageText: wording.route.msg
    });

    // 2. Officers
    policeDeployment.push({
      id: `police_${idx}`,
      junction: inc.junction || inc.locality || 'Incident Spot',
      officersCount: inc.priority === 'High' ? 4 : 2,
      role: wording.police,
      priority: inc.priority
    });

    // 3. Detours
    alternateRoutes.push({
      id: `route_${idx}`,
      congestedRoute: inc.corridor || 'Local Corridor',
      suggestedAlternate: wording.route.alt,
      expectedSavings: wording.route.savings,
      vmsMessage: wording.route.msg
    });
  });

  // Default monitoring items if empty
  if (barricading.length === 0) {
    barricading.push({
      id: 'barricade_default',
      location: 'Silk Board Signal Junction',
      action: 'Maintain standby checkpoint cones in utility lanes.',
      officersRequired: 1,
      signageText: 'ASTRAM COMMAND: MONITORING NOMINAL SPEEDS'
    });
  }

  if (policeDeployment.length === 0) {
    policeDeployment.push({
      id: 'police_default',
      junction: 'Hebbal Flyover Service Rd',
      officersCount: 2,
      role: 'Monitor peak congestion flow speed and relay telemetry logs.',
      priority: 'Low'
    });
  }

  if (alternateRoutes.length === 0) {
    alternateRoutes.push({
      id: 'route_default',
      congestedRoute: 'All major corridors',
      suggestedAlternate: 'Standard commuter pathways (No detours active)',
      expectedSavings: '0 mins',
      vmsMessage: 'BENGALURU TRAFFIC: STATUS NOMINAL ON MAIN ROADS'
    });
  }

  return {
    apiMode: reason === 'NO_API_KEY' ? 'MOCK_FALLBACK_NO_KEY' : 'MOCK_FALLBACK_ERROR',
    summary,
    barricading,
    policeDeployment,
    alternateRoutes
  };
}

module.exports = {
  getTrafficRecommendations
};
