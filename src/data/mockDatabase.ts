// ASTRAM Database Types matching the Postgres Schema

export interface Incident {
  id: string;
  event_type: 'planned' | 'unplanned';
  incident_type: 'vehicle_breakdown' | 'tree_fall' | 'accident' | 'water_logging' | 'road_work' | 'public_event';
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  start_address: string;
  end_address?: string;
  description: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  corridor: 'Tumkur Road' | 'ORR East 1' | 'ORR East 2' | 'CBD 2' | 'Non-corridor';
  priority: 'High' | 'Low';
  status: 'active' | 'resolved' | 'closed';
  is_verified: boolean;
  is_diversion: boolean;
  locality: string;
  division: string;
  zone: string;
  junction: string;
  kg_id: string;
  created_at: string;
  scheduled_start?: string;
  scheduled_end?: string;
  first_response_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  closed_at?: string;
  closed_by?: string;
  reported_by: string;
  created_by: string;
  assigned_to?: string;
  escalated_to?: string;
  commuter_impact_score: number; // 0-100
  duration_sla_hours: number;
  cascade_parent_id?: string;
}

export interface Officer {
  id: string;
  name: string;
  rank: 'SI' | 'ASI' | 'HC' | 'PC' | 'Inspector';
  station: string;
  zone: string;
  specializations: string[];
  familiar_areas: string[];
  performance_score: number; // 0-100
  total_incidents_handled: number;
  avg_response_time_minutes: number;
  current_status: 'on_duty' | 'off_duty' | 'on_leave';
  badges: string[];
}

export interface EventDnaProfile {
  id: number;
  profile_name: string;
  incident_type: string;
  avg_duration_hours: number;
  avg_delay_minutes: number;
  avg_manpower_needed: number;
  avg_barricade_points: number;
  weather_sensitivity: number; // multiplier
  mode_split: {
    private_car: number;
    cab_rideshare: number;
    metro: number;
    bmtc_bus: number;
    two_wheeler: number;
    walk: number;
  };
}

export interface BarricadePoint {
  id: string;
  lat: number;
  lon: number;
  road_name: string;
  type: 'full_block' | 'partial_block' | 'checkpoint' | 'cone_guidance';
  officers_assigned: number;
  setup_time_minutes: number;
  status: 'pending' | 'deployed';
}

// Initial Mock Datasets
export const initialIncidents: Incident[] = [
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
    vehicle_registration: 'FKN00GL2394',
    corridor: 'Tumkur Road',
    priority: 'High',
    status: 'closed',
    is_verified: true,
    is_diversion: false,
    locality: 'Peenya',
    division: 'North Corporation',
    zone: 'North Zone 1',
    junction: 'PeenyaJunc',
    kg_id: 'FKKG000010',
    created_at: '2026-06-19T17:01:00Z',
    first_response_at: '2026-06-19T17:03:00Z',
    resolved_at: '2026-06-19T18:45:00Z',
    closed_at: '2026-06-19T19:35:00Z',
    reported_by: 'FKUSR00003',
    created_by: 'FKUSR00001',
    assigned_to: 'FKUSR00006',
    commuter_impact_score: 42,
    duration_sla_hours: 2,
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
    is_verified: true,
    is_diversion: false,
    locality: 'Wilson Garden',
    division: 'Bengaluru Central Corporation',
    zone: 'Central Zone 2',
    junction: 'LalbaghMainGateJunc',
    kg_id: 'FKKG000002',
    created_at: '2026-03-31T10:00:00Z', // Active for nearly 80 days
    first_response_at: '2026-03-31T10:30:00Z',
    reported_by: 'FKUSR00003',
    created_by: 'FKUSR00001',
    assigned_to: 'FKUSR00003',
    commuter_impact_score: 65,
    duration_sla_hours: 24, // High SLA Violation!
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
    is_verified: true,
    is_diversion: true,
    locality: 'Sadashivanagar',
    division: 'North Corporation',
    zone: 'North Zone 1',
    junction: 'SankeyCircle',
    kg_id: 'FKKG000003',
    created_at: '2026-06-12T08:30:00Z',
    first_response_at: '2026-06-12T08:35:00Z',
    resolved_at: '2026-06-18T18:00:00Z',
    closed_at: '2026-06-19T01:00:00Z', // 6.7 days to resolve inter-agency
    reported_by: 'FKUSR00003',
    created_by: 'FKUSR00001',
    assigned_to: 'FKUSR00005',
    commuter_impact_score: 74,
    duration_sla_hours: 4,
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
    is_verified: true,
    is_diversion: true,
    locality: 'Whitefield',
    division: 'Bengaluru Central Corporation',
    zone: 'Central Zone 2',
    junction: 'TinFactoryJunction',
    kg_id: 'FKKG000012',
    created_at: '2026-06-19T14:15:00Z',
    first_response_at: '2026-06-19T14:22:00Z',
    reported_by: 'FKUSR00011',
    created_by: 'FKUSR00001',
    assigned_to: 'FKUSR00011',
    commuter_impact_score: 82,
    duration_sla_hours: 6,
  }
];

export const initialOfficers: Officer[] = [
  {
    id: 'FKUSR00003',
    name: 'Inspector Suresh Gowda',
    rank: 'Inspector',
    station: 'Wilson Garden Traffic PS',
    zone: 'Central Zone 2',
    specializations: ['Incident Management', 'Accident Response'],
    familiar_areas: ['Wilson Garden', 'Lalbagh Road', 'CBD 2'],
    performance_score: 82,
    total_incidents_handled: 28,
    avg_response_time_minutes: 4.8,
    current_status: 'on_duty',
    badges: ['Perfect SLA', 'Iron Man'],
  },
  {
    id: 'FKUSR00005',
    name: 'SI Kumar Swamy',
    rank: 'SI',
    station: 'Cubbon Park Traffic PS',
    zone: 'Central Zone 2',
    specializations: ['Event Orchestration', 'VIP Route Clearing'],
    familiar_areas: ['Queens Statue Circle', 'Cubbon Road', 'Chinnaswamy Stadium'],
    performance_score: 94,
    total_incidents_handled: 45,
    avg_response_time_minutes: 1.2,
    current_status: 'on_duty',
    badges: ['Quick Responder', 'Event Commander'],
  },
  {
    id: 'FKUSR00006',
    name: 'ASI Raju Hegde',
    rank: 'ASI',
    station: 'Peenya Traffic PS',
    zone: 'North Zone 1',
    specializations: ['Heavy Vehicle Diversions', 'Junction Control'],
    familiar_areas: ['Peenya', 'Tumkur Road', 'Jayamahal Road'],
    performance_score: 87,
    total_incidents_handled: 52,
    avg_response_time_minutes: 2.1,
    current_status: 'on_duty',
    badges: ['Iron Man'],
  },
  {
    id: 'FKUSR00011',
    name: 'HC Manjunath Prasanna',
    rank: 'HC',
    station: 'Whitefield Traffic PS',
    zone: 'Central Zone 2',
    specializations: ['Monsoon Response', 'Water Pump Coordination'],
    familiar_areas: ['ORR East 2', 'Whitefield', 'BSNL CACT Underpass'],
    performance_score: 85,
    total_incidents_handled: 34,
    avg_response_time_minutes: 3.5,
    current_status: 'on_duty',
    badges: ['Storm Rider'],
  }
];

export const eventDnaProfiles: EventDnaProfile[] = [
  {
    id: 1,
    profile_name: 'IPL Cricket Match (Chinnaswamy Stadium)',
    incident_type: 'planned_event',
    avg_duration_hours: 6.5,
    avg_delay_minutes: 47,
    avg_manpower_needed: 22,
    avg_barricade_points: 6,
    weather_sensitivity: 2.1,
    mode_split: {
      private_car: 0.30,
      cab_rideshare: 0.25,
      metro: 0.15,
      bmtc_bus: 0.10,
      two_wheeler: 0.15,
      walk: 0.05
    }
  }
];

export const initialBarricadePoints: BarricadePoint[] = [
  {
    id: 'BP001',
    lat: 12.9790,
    lon: 77.5950,
    road_name: 'MG Road Link',
    type: 'full_block',
    officers_assigned: 3,
    setup_time_minutes: 15,
    status: 'deployed',
  },
  {
    id: 'BP002',
    lat: 12.9815,
    lon: 77.5962,
    road_name: 'Cubbon Road Entry',
    type: 'partial_block',
    officers_assigned: 2,
    setup_time_minutes: 10,
    status: 'deployed',
  },
  {
    id: 'BP003',
    lat: 12.9802,
    lon: 77.5910,
    road_name: 'Queens Statue Circle',
    type: 'checkpoint',
    officers_assigned: 4,
    setup_time_minutes: 20,
    status: 'pending',
  }
];
