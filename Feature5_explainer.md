# 🧠 Feature 5: AI Traffic Co-Pilot Brain (LLM RAG Agent) Explainer

## 1. What is the Use of this Feature? (The Business Case)
In the Traffic Management Command Center, dispatchers need to make immediate, critical decisions during disruptions (e.g., floods, high-profile crowd events, chronic construction bottlenecks). To make informed choices, they must query:
1.  **Historical Precedents**: How long do vehicle breakdowns on Hebbal Flyover typically take to resolve? What about accidents in Peenya?
2.  **Standard Operating Procedures (SOPs)**: What is the official protocol when waterlogging exceeds 2 feet at ORR underpasses?

Previously, the **AI Traffic Co-Pilot** was a simple text matcher that only recognized hardcoded phrases like *"Monsoon Plan"*. If a dispatcher typed *"How do we handle heavy rainfall?"* or *"What is the flood protocol?"*, the system failed to match and returned a generic template message.

The **ML-based localized RAG Engine** solves this:
*   **Semantic Understanding**: Calculates mathematical similarity between free-form search queries and reference guides/historical events.
*   **Data-Driven Precedent Summaries**: Aggregates matched logs to instantly report statistics like total occurrences, average resolution speed, and hotspot corridors.
*   **Direct Inline Execution dispatches**: If a query matches an official SOP, the system renders a clickable action button (e.g. *Deploy Pumps*, *Tweak Signals*, *Escalate Command*) directly inside the chat thread, letting dispatchers trigger protocols inline.

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

### A. Offline Vector Compilation (`ML_work/train_copilot.py`)
We build a local searchable corpus by combining historical database entries and official protocol guidelines:
1.  **SOP Guidelines Definition**: Define official checklists for **Monsoon Flood Protocols**, **IPL Crowd Management**, and **Wilson Garden SLA violations** as distinct RAG documents.
2.  **Historical Log Preprocessing**: Load all historical incident descriptions, calculate their actual Time-to-Resolution (TTR) from start and close timestamps, and deduplicate repetitive descriptions to create a diverse search corpus of **1,800 events**.
3.  **TF-IDF Vocabulary Fitting**: Fit a `TfidfVectorizer` (with `max_features=300` and English stop-words) across all combined texts using a tokenizer supporting both English and Kannada Unicode.
4.  **Sparse Vectorization**: To keep the bundle size small (~350KB), we convert the dense $1803 \times 300$ TF-IDF matrix into a **sparse representation**, only writing the non-zero indices and weights (`[[term_idx, tfidf_weight], ...]`) for each document to [copilot_rag_model.json](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/data/copilot_rag_model.json).

```json
{
  "vocabulary": ["accident", "agara", "blocking", "breakdown", "bmtc", "bus", "flooded", "monsoon", "peenya", ...],
  "idf_weights": { "monsoon": 4.82, "peenya": 3.91, ... },
  "sops": [
    {
      "id": "SOP_MONSOON",
      "title": "Monsoon Flood Mitigation Plan",
      "desc": "Monsoon Plan: Preemptively deploy suction pumps...",
      "actionType": "deploy_pumps",
      "vector": [[7, 0.45], [12, 0.81], ...]
    }
  ],
  "incidents": [
    {
      "id": "FKID000000",
      "desc": "s m circle in coming man track",
      "cause": "vehicle_breakdown",
      "corridor": "Tumkur Road",
      "loc": "Jalahalli Cross Junction, Peenya",
      "ttr": 0.95,
      "vector": [[3, 0.58], [8, 0.72], ...]
    }
  ]
}
```

### B. Client-Side RAG Search Engine (`src/data/copilotRagEvaluator.ts`)
Executes the vector space retrieval directly in the client browser inside TypeScript:
1.  **Query Vectorization**: Tokenizes the dispatcher's free-form question and maps tokens to vocabulary indices. Computes query term weights using the model's compiled IDF weights and calculates the query vector's magnitude $\|\vec{Q}\|$.
2.  **Cosine Similarity Calculation**: Computes the dot product of the query vector against all indexed documents, normalized by their magnitudes:
    $$\text{CosineSimilarity}(\vec{Q}, \vec{D}) = \frac{\sum_{i \in \vec{Q} \cap \vec{D}} Q_i \times D_i}{\|\vec{Q}\| \times \|\vec{D}\|}$$
3.  **Result Routing Protocol**:
    *   **Protocol SOP Match**: If the highest-scoring match is an SOP guide and its similarity score is above `0.12` (12%), it returns the SOP text along with the executable `actionType` payload.
    *   **Precedent Incident Match**: Otherwise, if there are matching historical incidents, the engine filters those above a `0.04` similarity threshold. It aggregates metrics (number of matched events, average resolution hours, top corridor) and formats a detailed summary report citing the most similar event (precedent) as a reference card.
    *   **Fallback**: If similarity scores are below thresholds, it returns a diagnostic overview of active incidents and suggest queries.

### C. UI Integration (`src/components/AiCopilot.tsx`)
*   **Chat Processing**: Hooked into the chat input bar, replacing static regex checks with `queryCopilotRAG(query, activeIncidentsCount)`.
*   **Inline Action Rendering**: When an SOP match returns an action (e.g. `actionType: 'deploy_pumps'`), the chatbot renders a flashing **"Execute Action: Deploy Pumps"** button in the chat bubble.
*   **Unified State Dispatch**: Clicking the button fires the `onExecuteAction` callback, synchronizing the execution state back to the main container state in `page.tsx` (deploying pumps, adjusting signals, or escalating incident tickets on the map).
