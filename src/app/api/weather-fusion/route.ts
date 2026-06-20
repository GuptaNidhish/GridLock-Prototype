import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface HistoricalIncident {
  cause: string;
  police_station: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  corridor: string;
  priority: string;
  closure_time_hrs: number | null;
}

interface ModelData {
  metadata: {
    total_records: number;
    cause_breakdown: Record<string, number>;
    average_closure_times: Record<string, number>;
  };
  spatial_priors: Record<string, Record<string, number>>;
  temporal_month_priors: Record<string, Record<string, number>>;
  temporal_hour_priors: Record<string, Record<string, number>>;
  historical_incidents: HistoricalIncident[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weather = searchParams.get('weather') || 'clear';
    const hour = parseInt(searchParams.get('hour') || '17', 10);
    const month = parseInt(searchParams.get('month') || '6', 10); // June (Monsoon peak)

    // Load compiled model parameters
    const modelPath = path.join(process.cwd(), 'src', 'data', 'weather_ml_model.json');
    const modelRaw = await fs.readFile(modelPath, 'utf-8');
    const model: ModelData = JSON.parse(modelRaw);

    const weatherCauses = ['water_logging', 'tree_fall', 'accident'];
    const totalRecords = model.metadata.total_records;

    // Likelihoods of weather given cause: P(Weather | Cause)
    const likelihoods: Record<string, Record<string, number>> = {
      water_logging: { heavy_rain: 0.85, light_rain: 0.14, clear: 0.01 },
      tree_fall: { heavy_rain: 0.70, light_rain: 0.20, clear: 0.10 },
      accident: { heavy_rain: 0.40, light_rain: 0.35, clear: 0.25 },
      others: { heavy_rain: 0.05, light_rain: 0.15, clear: 0.80 }
    };

    // Calculate overall posterior probabilities for each cause:
    // P(Cause | Weather, Month, Hour) propto P(Weather | Cause) * P(Month | Cause) * P(Hour | Cause) * P(Cause)
    const posteriors: Record<string, number> = {};
    let totalScore = 0;

    weatherCauses.forEach((cause) => {
      const prior = (model.metadata.cause_breakdown[cause] || 1) / totalRecords;
      const pWeather = likelihoods[cause][weather] || 0.1;
      const pMonth = model.temporal_month_priors[cause]?.[month.toString()] || 1/12;
      const pHour = model.temporal_hour_priors[cause]?.[hour.toString()] || 1/24;

      // Joint likelihood
      const score = pWeather * pMonth * pHour * prior;
      posteriors[cause] = score;
      totalScore += score;
    });

    // Add others
    const othersPrior = 1 - weatherCauses.reduce((acc, c) => acc + (model.metadata.cause_breakdown[c] || 0) / totalRecords, 0);
    const scoreOthers = likelihoods.others[weather] * (1/12) * (1/24) * othersPrior;
    posteriors.others = scoreOthers;
    totalScore += scoreOthers;

    // Normalize posteriors
    const normalizedPosteriors: Record<string, number> = {};
    Object.keys(posteriors).forEach((cause) => {
      normalizedPosteriors[cause] = totalScore > 0 ? posteriors[cause] / totalScore : 0;
    });

    // Extract relative temporal prior factors compared to uniform distributions:
    // month Relative = P(Month | Cause) / (1/12), hour Relative = P(Hour | Cause) / (1/24)
    const getRelativeFactor = (cause: string) => {
      const pMonth = model.temporal_month_priors[cause]?.[month.toString()] || 1/12;
      const pHour = model.temporal_hour_priors[cause]?.[hour.toString()] || 1/24;
      return (pMonth / (1/12)) * (pHour / (1/24));
    };

    const wlFactor = getRelativeFactor('water_logging');
    const tfFactor = getRelativeFactor('tree_fall');
    const accFactor = getRelativeFactor('accident');

    // Use log transformation to handle high-skew relative risks (e.g. 35x risks) safely
    const wlScaled = Math.log1p(wlFactor);
    const tfScaled = Math.log1p(tfFactor);
    const accScaled = Math.log1p(accFactor);

    // 1. Calculate dynamic congestion multiplier
    let congestionMultiplier = 'Nominal';
    let riskSpike = '0%';
    const isPeakHour = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20);

    if (weather === 'clear') {
      if (isPeakHour) {
        congestionMultiplier = '+15%';
        riskSpike = '+5%';
      } else {
        congestionMultiplier = 'Nominal';
        riskSpike = '0%';
      }
    } else if (weather === 'light_rain') {
      const multiplierPct = Math.round(15 + accScaled * 10 + wlScaled * 5);
      congestionMultiplier = `+${Math.min(50, multiplierPct)}%`;

      const riskPct = Math.round(10 + accScaled * 8 + wlScaled * 4);
      riskSpike = `+${Math.min(35, riskPct)}%`;
    } else if (weather === 'heavy_rain') {
      const multiplierPct = Math.round(60 + wlScaled * 20 + tfScaled * 10);
      congestionMultiplier = `+${Math.min(150, multiplierPct)}%`;

      const riskPct = Math.round(45 + wlScaled * 12 + tfScaled * 6);
      riskSpike = `+${Math.min(95, riskPct)}%`;
    }

    // 3. Generate location-specific warnings based on spatial prior probability and history
    // Filter warnings matching the selected conditions
    let activeCauses: string[] = [];
    if (weather === 'heavy_rain') {
      activeCauses = ['water_logging', 'tree_fall'];
    } else if (weather === 'light_rain') {
      activeCauses = ['accident', 'water_logging'];
    }

    // Sort historical records to find high-impact warnings matching these causes
    const matchedIncidents = model.historical_incidents.filter((inc) => activeCauses.includes(inc.cause));

    // Map to user-friendly warning details
    const warnings = matchedIncidents.map((inc) => {
      // Calculate dynamic risk level based on spatial prior at the police station
      const spatialPrior = model.spatial_priors[inc.cause]?.[inc.police_station] || 0.01;
      const riskScore = spatialPrior * (weather === 'heavy_rain' ? 2.5 : 1.2);

      let severity: 'high' | 'medium' | 'low' = 'low';
      if (riskScore > 0.05 || inc.priority === 'High') {
        severity = 'high';
      } else if (riskScore > 0.01) {
        severity = 'medium';
      }

      const cleanAddress = inc.address.split(',').slice(0, 3).join(',');

      return {
        title: `${inc.cause.replace('_', ' ').toUpperCase()} at ${inc.police_station}`,
        address: cleanAddress,
        description: inc.description,
        lat: inc.latitude,
        lon: inc.longitude,
        severity,
        timeFactor: `Typical resolution: ${inc.closure_time_hrs ? inc.closure_time_hrs.toFixed(1) : '1.5'} hrs`
      };
    }).slice(0, 4); // Limit to top 4 warnings

    // In case no warnings are matched (e.g. clear weather)
    if (warnings.length === 0) {
      warnings.push({
        title: 'Nominal Operations',
        address: 'Citywide Corridor Grid',
        description: 'No weather-induced disruptions detected. Standard signal timing patterns active.',
        lat: 12.9716,
        lon: 77.5946,
        severity: 'low',
        timeFactor: 'Resolution: N/A'
      });
    }

    return NextResponse.json({
      success: true,
      weather,
      month,
      hour,
      congestion_multiplier: congestionMultiplier,
      incident_risk_spike: riskSpike,
      posteriors: normalizedPosteriors,
      warnings
    });
  } catch (error: any) {
    console.error('Error running weather ML prediction API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
