import copilotRagModel from './copilot_rag_model.json';

interface SopEntry {
  id: string;
  title: string;
  desc: string;
  actionType: 'deploy_pumps' | 'recalibrate_signals' | 'escalate_wilson';
  corridor: string;
  priority: string;
  vector: [number, number][];
}

interface IncidentEntry {
  id: string;
  desc: string;
  cause: string;
  corridor: string;
  loc: string;
  ttr: number;
  priority: string;
  vector: [number, number][];
}

interface RagModelType {
  vocabulary: string[];
  idf_weights: Record<string, number>;
  sops: SopEntry[];
  incidents: IncidentEntry[];
}

const model = copilotRagModel as unknown as RagModelType;

// Simple custom tokenizer that splits on word characters and Kannada Unicode blocks
function tokenize(text: string): string[] {
  const textLower = text.toLowerCase();
  const matches = textLower.match(/[a-z0-9\u0c80-\u0cff]+/g);
  return matches || [];
}

// Compute cosine similarity between query sparse vector and a document's sparse vector
function computeCosineSimilarity(
  queryVec: Record<number, number>,
  queryMagnitude: number,
  docVec: [number, number][]
): number {
  if (queryMagnitude === 0 || docVec.length === 0) return 0;

  let dotProduct = 0;
  let docSqSum = 0;

  for (let i = 0; i < docVec.length; i++) {
    const termIdx = docVec[i][0];
    const termWeight = docVec[i][1];
    docSqSum += termWeight * termWeight;

    if (queryVec[termIdx] !== undefined) {
      dotProduct += queryVec[termIdx] * termWeight;
    }
  }

  const docMagnitude = Math.sqrt(docSqSum);
  if (docMagnitude === 0) return 0;

  return dotProduct / (queryMagnitude * docMagnitude);
}

export interface CopilotResponse {
  text: string;
  actionType?: 'deploy_pumps' | 'recalibrate_signals' | 'escalate_wilson';
  actionLabel?: string;
  matchedIncidentsCount?: number;
}

/**
 * Executes a local semantic RAG search against compiled SOPs and historical incidents.
 * @param query The free-text question submitted by the dispatcher
 * @param activeIncidentsCount Current number of active incident items
 */
export function queryCopilotRAG(query: string, activeIncidentsCount: number): CopilotResponse {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return {
      text: `🤖 ASTRAM Co-Pilot is active. Please ask a traffic-related question.\nTry asking: "Monsoon Plan", "IPL Crowd Nudge", or search historical incidents like "Accidents on Tumkur Road".`
    };
  }

  // 1. Vectorize query
  const tf: Record<string, number> = {};
  tokens.forEach((t) => {
    tf[t] = (tf[t] || 0) + 1;
  });

  const queryVec: Record<number, number> = {};
  let querySqSum = 0;

  // Map vocabulary word to index
  const vocabMap: Record<string, number> = {};
  model.vocabulary.forEach((word, idx) => {
    vocabMap[word] = idx;
  });

  tokens.forEach((t) => {
    const vocabIdx = vocabMap[t];
    if (vocabIdx !== undefined) {
      const termFreq = tf[t] / tokens.length;
      const idf = model.idf_weights[t] || 0;
      const tfidf = termFreq * idf;
      queryVec[vocabIdx] = tfidf;
    }
  });

  // Calculate query magnitude
  Object.values(queryVec).forEach((val) => {
    querySqSum += val * val;
  });
  const queryMagnitude = Math.sqrt(querySqSum);

  // If query terms don't match any vocab terms, fallback to basic text checks
  if (queryMagnitude === 0) {
    const norm = query.toLowerCase();
    if (norm.includes('monsoon') || norm.includes('rain') || norm.includes('flood')) {
      return {
        text: `🤖 ASTRAM Monsoon Assessment:\n- Heavy rain drops corridor average speeds by 60%.\n- Critical hot-spot: BSNL CACT Underpass.\n- Mitigation recommendation: Suction pump routing deployment.\n\nWould you like to trigger pump deployments?`,
        actionType: 'deploy_pumps',
        actionLabel: 'Deploy Pumps'
      };
    } else if (norm.includes('ipl') || norm.includes('match') || norm.includes('crowd')) {
      return {
        text: `🤖 ASTRAM IPL Orchestration Plan:\n- 34,000 attendees inbound Chinnaswamy.\n- Active action: Signal cycle at Queens Statue set to 180s green phase.\n- Alternative routing active on CBD links (delays reduced by 25 min).`,
        actionType: 'recalibrate_signals',
        actionLabel: 'Tweak Signals'
      };
    } else if (norm.includes('wilson') || norm.includes('sla') || norm.includes('digging')) {
      return {
        text: `🤖 Incident FKID000002 Audit:\n- Description: Road work blocking Urvashi Junction.\n- Duration: 80 days (SLA Violation).\n- Dispatching escalation order to ACP Traffic Suresh Gowda.`,
        actionType: 'escalate_wilson',
        actionLabel: 'Escalate Command'
      };
    }

    return {
      text: `🤖 ASTRAM Co-Pilot Context:\n- No exact matching keyword or semantic query found.\n- Active incidents currently monitored: ${activeIncidentsCount}.\n\nTry asking about: "Monsoon Plan", "IPL Crowd Nudge", or query historical logs (e.g. "breakdown peenya" or "Lalbagh road work").`
    };
  }

  // 2. Compute similarity against SOPs
  let bestSop: SopEntry | null = null;
  let bestSopScore = -Infinity;

  model.sops.forEach((sop) => {
    const score = computeCosineSimilarity(queryVec, queryMagnitude, sop.vector);
    if (score > bestSopScore) {
      bestSopScore = score;
      bestSop = sop;
    }
  });

  // 3. Compute similarity against Incidents
  const matchedIncidents: { incident: IncidentEntry; score: number }[] = [];
  model.incidents.forEach((inc) => {
    const score = computeCosineSimilarity(queryVec, queryMagnitude, inc.vector);
    if (score > 0.04) { // low threshold to capture potential matches
      matchedIncidents.push({ incident: inc, score });
    }
  });

  // Sort incidents by similarity descending
  matchedIncidents.sort((a, b) => b.score - a.score);

  // If SOP score is high enough, prioritize SOP advice
  if (bestSop && bestSopScore > 0.12) {
    const matchedSop = bestSop as SopEntry;
    let actionLabel = 'Execute Action';
    if (matchedSop.actionType === 'deploy_pumps') actionLabel = 'Deploy Pumps';
    if (matchedSop.actionType === 'recalibrate_signals') actionLabel = 'Tweak Signals';
    if (matchedSop.actionType === 'escalate_wilson') actionLabel = 'Escalate Command';

    return {
      text: `🤖 SOP MATCH: **${matchedSop.title}** (Confidence: ${(bestSopScore * 100).toFixed(0)}%)\n\nProtocol Details:\n${matchedSop.desc}\n\n*Recommended action to dispatch: ${actionLabel}*`,
      actionType: matchedSop.actionType,
      actionLabel: actionLabel
    };
  }

  // If incidents matched, aggregate results
  if (matchedIncidents.length > 0) {
    const topMatches = matchedIncidents.slice(0, 5);
    const validTtrs = matchedIncidents.filter(m => m.incident.ttr >= 0).map(m => m.incident.ttr);
    const avgTtr = validTtrs.length > 0 ? (validTtrs.reduce((a, b) => a + b, 0) / validTtrs.length).toFixed(1) : 'Unknown';

    // Count by corridor
    const corridorCounts: Record<string, number> = {};
    matchedIncidents.forEach(m => {
      const c = m.incident.corridor || 'Non-corridor';
      corridorCounts[c] = (corridorCounts[c] || 0) + 1;
    });
    let topCorridor = 'Non-corridor';
    let maxCorridorCount = 0;
    Object.entries(corridorCounts).forEach(([corridor, count]) => {
      if (count > maxCorridorCount) {
        maxCorridorCount = count;
        topCorridor = corridor;
      }
    });

    const topIncident = topMatches[0].incident;
    const priorityEmoji = topIncident.priority === 'High' ? '🚨' : '⚠️';

    const textResponse = `🤖 RAG REPORT: Historical precedents matching "${query}"\n` +
      `- Found **${matchedIncidents.length}** historical events.\n` +
      `- Average resolution speed: **${avgTtr} hours**.\n` +
      `- Most impacted corridor: **${topCorridor}** (${(maxCorridorCount / matchedIncidents.length * 100).toFixed(0)}% of matches).\n\n` +
      `📌 **Key Precedent Event (ID: ${topIncident.id})**:\n` +
      `- Description: "${topIncident.desc}"\n` +
      `- Cause: ${topIncident.cause.toUpperCase().replace('_', ' ')}\n` +
      `- Location: ${topIncident.loc}\n` +
      `- Duration: ${topIncident.ttr >= 0 ? topIncident.ttr.toFixed(1) + ' hours' : 'Unresolved'}\n` +
      `- Priority: ${priorityEmoji} ${topIncident.priority}\n\n` +
      `*Recommendation*: Preemptively allocate patrol units along ${topIncident.loc.split(',')[0]} to mitigate dynamic spillover delays.`;

    return {
      text: textResponse,
      matchedIncidentsCount: matchedIncidents.length
    };
  }

  // Fallback if no matching records found
  return {
    text: `🤖 No direct historical matches found for "${query}" (Confidence too low).\n\nASTRAM Live Telemetry Summary:\n- Monitored Corridors: 4\n- Total active incidents: ${activeIncidentsCount}\n\nTry asking: "What is the Monsoon Plan?", "SLA breach at Wilson Garden", or query by area: "Accident peenya" / "tree fall sankey".`
  };
}
