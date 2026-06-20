import nlpModel from './whatsapp_nlp_model.json';

interface NlpModelType {
  classes: string[];
  vocabulary: string[];
  idf_weights: Record<string, number>;
  coefficients: Record<string, number[]>;
  intercepts: Record<string, number>;
}

const model = nlpModel as unknown as NlpModelType;

// Tokenize text, preserving English letters, numbers, and Kannada script (Unicode range \u0c80-\u0cff)
function tokenize(text: string): string[] {
  const textLower = text.toLowerCase();
  const matches = textLower.match(/[a-z0-9\u0c80-\u0cff]+/g);
  return matches || [];
}

/**
 * Predicts the incident category (event_cause) based on multilingual text description.
 * Uses client-side TF-IDF vectorization and Logistic Regression weights.
 * @param text The free-text incident report (Kannada/English)
 */
export function predictIncidentType(text: string): string {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 'others';

  // Compute Term Frequency (TF)
  const tf: Record<string, number> = {};
  tokens.forEach((tok) => {
    tf[tok] = (tf[tok] || 0) + 1;
  });

  // Construct TF-IDF vector matching the vocabulary
  const tfIdf: number[] = new Array(model.vocabulary.length).fill(0);
  model.vocabulary.forEach((word, idx) => {
    if (tf[word] !== undefined) {
      const termFreq = tf[word] / tokens.length;
      const idf = model.idf_weights[word] || 0;
      tfIdf[idx] = termFreq * idf;
    }
  });

  // Run Logistic Regression evaluation:
  // Score = Intercept + DotProduct(Weights, TF-IDF)
  let bestClass = 'others';
  let bestScore = -Infinity;

  model.classes.forEach((cls) => {
    const intercept = model.intercepts[cls] || 0;
    const coefs = model.coefficients[cls] || [];
    let score = intercept;
    for (let i = 0; i < tfIdf.length; i++) {
      score += tfIdf[i] * (coefs[i] || 0);
    }
    if (score > bestScore) {
      bestScore = score;
      bestClass = cls;
    }
  });

  // Map ML predicted class back to Incident tracker category
  if (bestClass === 'construction') return 'road_work';
  if (bestClass === 'pot_holes') return 'road_work'; // group under road work in frontend database

  return bestClass;
}

/**
 * Heuristically extracts the coordinate mapping, geocoded address, and corridor name
 * based on location keywords in the report.
 * @param text The incident text
 */
export function extractIncidentLocation(text: string): {
  location: string;
  lat: number;
  lon: number;
  corridor: 'Tumkur Road' | 'ORR East 1' | 'ORR East 2' | 'CBD 2' | 'Non-corridor';
} {
  const norm = text.toLowerCase();

  if (norm.includes('sankey') || norm.includes('sadashiva') || norm.includes('bhashyam') || norm.includes('circle')) {
    return {
      location: 'Sankey Road near Bashyam Circle, Sadashiva Nagar',
      lat: 13.0034,
      lon: 77.5790,
      corridor: 'CBD 2',
    };
  } else if (norm.includes('peenya') || norm.includes('tumkur') || norm.includes('jalahalli') || norm.includes('cross')) {
    return {
      location: 'Tumkur Road, Jalahalli Cross Junction, Peenya',
      lat: 13.0400,
      lon: 77.5181,
      corridor: 'Tumkur Road',
    };
  } else if (norm.includes('orr') || norm.includes('bsnl') || norm.includes('underpass') || norm.includes('cact') || norm.includes('east')) {
    return {
      location: 'BSNL CACT Underpass, Outer Ring Road',
      lat: 12.9995,
      lon: 77.6827,
      corridor: 'ORR East 2',
    };
  } else if (norm.includes('hsr') || norm.includes('agara') || norm.includes('halcyon') || norm.includes('19th main')) {
    return {
      location: '19th Main Road, Agara, HSR Layout',
      lat: 12.9219,
      lon: 77.6452,
      corridor: 'ORR East 1',
    };
  }

  // Fallback defaults
  return {
    location: 'Majestic Metro Station, Kempegowda Bus Station',
    lat: 12.9778,
    lon: 77.5714,
    corridor: 'Non-corridor',
  };
}
