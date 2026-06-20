# ⏱️ Feature 3: Incident SLA & Time-to-Resolution (TTR) Predictor Explainer

## 1. What is the Use of this Feature? (The Business Case)
Traffic incident duration directly impacts corridor capacity and commuter delay. In city operations, dispatchers track whether field response teams are resolving incidents inside a predefined **Service Level Agreement (SLA)** window.

Traditionally, this SLA window is a static baseline (e.g. 4 hours for all High priority alerts, 24 hours for Low priority alerts). In reality, this static threshold is highly inaccurate:
*   A **vehicle breakdown** or a **minor crash** is typically cleared within 45 to 60 minutes. Setting a 4-hour countdown timer means a 2-hour delay (a massive failure) goes unflagged by the system.
*   A **pothole repairing** or a **road digging** project takes average 24.6 days (592 hours) to complete because it involves agency handoffs (BBMP). Setting a 24-hour SLA causes continuous, false "breach alert" alarms, causing alarm fatigue for dispatchers.

The **ML-backed TTR Predictor** solves this by generating a case-specific SLA:
*   **Realistic Expectations**: Predicts the expected clearance time based on historical resolution times under similar features (location, cause, vehicle, priority).
*   **Accurate SLA Warning Triggers**: Flags a breach dynamically when the actual elapsed hours exceed the case-specific prediction ($P(\text{Breach}) \propto \text{elapsed} > \text{ML SLA}$).
*   **Precision Escalation**: Escales commands (e.g. to Station Inspector or ACP Traffic) only when an incident exceeds its realistic, data-backed resolution window.

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

### A. Offline Training (`ML_work/train_ttr.py`)
The training script loads the historical CSV dataset, calculates the actual incident resolution duration:
$$\text{closure\_time\_hrs} = \text{closed\_datetime} - \text{start\_datetime}$$
It cleans nulls, filters out negative durations, and caps outliers at 2,000 hours. It trains a **Decision Tree Regressor** (`max_depth=5`) on this target using these features:
1.  `event_cause` (e.g. pothole vs. accident vs. waterlogging)
2.  `priority` (`High` vs. `Low`)
3.  `police_station` (proxy for localized division workload/efficiency)
4.  `corridor` (accessibility factors)
5.  `veh_type` (clearance difficulty)

The script serializes the tree splits and category string indices to [ttr_ml_model.json](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/data/ttr_ml_model.json).

```json
{
  "category_maps": {
    "event_cause": { "accident": 0, "construction": 1, ... },
    "priority": { "High": 0, "Low": 1 },
    "police_station": { "Yelahanka": 0, "Sadashivanagar": 1, ... }
  },
  "tree": {
    "type": "split",
    "feature": "event_cause_encoded",
    "threshold": 3.5,
    "left": { ... },
    "right": { ... }
  }
}
```

### B. Client-Side TypeScript Evaluator (`src/data/ttrMlEvaluator.ts`)
We run the machine learning model directly on the client for instant calculations.
1.  **Map Properties**: Converts the active incident's string properties to their integer training codes.
2.  **Traverse Tree**: Recursively searches splits against thresholds.
3.  **Clean Output**: Enforces a logical minimum clearance window of `0.5 hours` (30 minutes) to avoid zero values.

### C. Dashboard Assembly (`src/components/IncidentTracker.tsx` & `page.tsx`)
*   **State Initialization**: When the app mounts, `page.tsx` maps the initial mock database incidents to their correct ML-predicted SLAs dynamically:
    ```typescript
    const [incidents, setIncidents] = useState<Incident[]>(() => {
      return initialIncidents.map((inc) => ({
        ...inc,
        duration_sla_hours: evaluateIncidentTtr(inc),
      }));
    });
    ```
    *   *Result*: The default vehicle breakdown (`FKID000000`) is assigned an ML SLA of **`1.3 hours`**, whereas the Lalbagh Road Digging (`FKID000002`) gets an ML SLA of **`591.9 hours`** (matching real BBMP metrics).
*   **Lifecycle creation**: When you log a new incident, `handleAddIncident` evaluates its ML predicted SLA and attaches it directly.
*   **Enforcing the Breach**: In [IncidentTracker.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/IncidentTracker.tsx), the violation checker calculates elapsed hours since creation (`timeDiffMs / (1000 * 60 * 60)`) and triggers the warning card only if it exceeds the ML target:
    ```typescript
    const elapsedHours = timeDiffMs / (1000 * 60 * 60);
    const isViolated = selectedIncident.status === 'active' && elapsedHours > selectedIncident.duration_sla_hours;
    ```
