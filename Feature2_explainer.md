# 📊 Feature 2: Commuter Impact Score (CIS) Estimator Explainer

## 1. What is the Use of this Feature? (The Business Case)
The **Commuter Impact Score (CIS)** is a composite traffic pressure gauge (normalized from `10` to `100`) that represents the real-time congestion penalty of all active road blockages in the city. 

In a standard traffic command center, assessing the gravity of an incident is highly subjective. A dispatcher might treat a vehicle breakdown on a suburban road with the same priority as a breakdown on a major airport highway, leading to resource misallocations.

The **ML-backed CIS Estimator** solves this by scoring each incident objectively:
*   **Capacity-Aware Triage**: It automatically recognizes that minor cars blocking non-corridors have low impact (e.g. `20-30` CIS score), while heavy vehicle breakdowns blocking high-speed corridors (e.g. Outer Ring Road, Tumkur Road) during peak commute hours cause major backlogs (e.g. `70-90` CIS score).
*   **Quantifying Congestion Severity**: Normalizes multi-incident cascades into a single unified dial (e.g., `SEVERE` for scores $\ge 80$), giving dispatchers instant, color-coded visual confirmation of overall network status.
*   **Triggering Diversions**: When the ML model predicts a score exceeding `60` (High) or `80` (Severe), ASTRAM automatically triggers recommended route diversions to bypass the congested areas.

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

### A. Offline Training (`ML_work/train_cis.py`)
Since the historical database does not contain a pre-computed "impact score", we build a ground-truth composite traffic penalty using a multi-factor capacity equation:
$$\text{Base Impact} = \text{CorridorWeight}(\text{corridor}) \times \text{VehicleWeight}(\text{veh\_type}) \times \text{ClosureFactor}(\text{requires\_road\_closure}) \times \text{TimeFactor}(\text{hour})$$
*   **Corridor Weights**: Major highways (Tumkur, ORR, Mysore, Hosur Road) are weighted higher (`2.0`) than minor suburban non-corridors (`1.0`).
*   **Vehicle Weights**: Buses, heavy commercial trucks, and utility vehicles are weighted higher (`2.2`) than private cars and taxis (`1.1`) because they occupy more road surface and take longer to tow.
*   **Closure weights**: If the incident requires a diversion (`is_diversion` or `requires_road_closure`), it multiplies the baseline impact by `2.5x`.
*   **Hour Peak Weights**: Peak rush hours (08:00-11:00 and 17:00-20:00) multiply impact by `1.8x`.

We train a **Decision Tree Regressor** (`max_depth=5`) on this target using these features:
1.  `corridor` (Categorical, mapped to integer codes)
2.  `veh_type` (Categorical, mapped to integer codes)
3.  `event_cause` (Categorical, mapped to integer codes)
4.  `requires_road_closure` (Binary, `0` or `1`)
5.  `hour` (Numerical, `0` to `23`)

The script recursively traverses the trained tree and serializes its nodes and category maps to [cis_ml_model.json](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/data/cis_ml_model.json).

```json
{
  "category_maps": {
    "corridor": { "Tumkur Road": 0, "ORR East 1": 1, ... },
    "veh_type": { "heavy_vehicle": 0, "bmtc_bus": 1, ... }
  },
  "tree": {
    "type": "split",
    "feature": "corridor_encoded",
    "threshold": 1.5,
    "left": { ... },
    "right": { ... }
  }
}
```

### B. Client-Side TypeScript Evaluator (`src/data/cisMlEvaluator.ts`)
Instead of sending HTTP requests to a backend API every time a score needs to be calculated, we run the machine learning inference **directly in TypeScript on the client**.
1.  **Map Properties**: Converts the active incident's string categories (e.g. `incident.corridor = 'ORR East 2'`) to their integer codes from the JSON dictionary.
2.  **Tree Traversal**: Starting at the root node of the decision tree, the function compares the features against splits:
    ```typescript
    function evaluateTree(node: DecisionTreeNode, features: Record<string, number>): number {
      if (node.type === 'leaf') return node.value;
      const val = features[node.feature] || -1;
      return val <= node.threshold 
        ? evaluateTree(node.left, features) 
        : evaluateTree(node.right, features);
    }
    ```
3.  **Return Score**: Evaluates in microseconds, returning a normalized score from `10` to `100`.

### C. Dashboard Assembly (`src/app/page.tsx`)
The `calculateCis` function updates dynamically:
1.  Iterates through all **active incidents** in the system.
2.  Runs the Decision Tree model on each active incident based on the timeline's active `hour` parameter:
    `const incScore = evaluateIncidentCis(inc, hour)`
3.  Finds the **maximum incident score** as the traffic baseline:
    `let totalScore = maxIncidentScore`
4.  Adds a penalty of **`+5` points** for each additional active incident beyond the first.
5.  Combines this score with the **weather disruption factor** (+20% of the live weather ML congestion multiplier).
6.  Checks if any tickets have breached their SLA timeline (+12 points penalty).
7.  Deducts score if active traffic diversions are enabled (`alternativePlanActive` $\rightarrow$ `-18` points reduction).
8.  Feeds this final combined score into the [CisDial](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/CisDial.tsx) component.
