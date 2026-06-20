# 📅 Feature 6: Manpower Optimizer & Shift Scheduler Explainer

## 1. What is the Use of this Feature? (The Business Case)
Deploying traffic patrol units in a major metropolitan area like Bengaluru has historically been reactive—officers are dispatched only after a massive bottleneck or accident has already occurred. This creates a delayed response, extending clearance times and multiplying secondary queue delays.

The **Manpower Optimizer & Shift Scheduler** shifts resource management from reactive dispatch to **preemptive, data-driven orchestration**:
1.  **Spatio-Temporal Risk Forecasting**: Automatically calculates incident risks for each major junction and corridor based on the hour of the day and day of week.
2.  **Telemetry-Aware Risk Inflation**: Dynamically inflates recommended staffing needs during adverse conditions (heavy rain/flooding) or when active incidents (crashes, breakdowns) are logged on the map.
3.  **Command Pool Load Alerts**: Compares total recommended officers across posts against the pool of available personnel (31 officers) to alert commanders of staffing imbalances (*Under-staffed*, *Optimal*, or *Over-staffed*).

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

### A. Offline Spatio-Temporal Profiling (`ML_work/train_manpower.py`)
Trains an incident density and corridor scale model using the historical ASTRAM dataset:
1.  **Corridor Scale Weighting**: Groups historical records by corridor and computes relative activity scales using a logarithmic scaling function to avoid extreme resource allocation spikes:
    $$\text{Scale}(C) = \log(1 + \text{Incidents}_{C}) \times 0.4 + 1.0$$
2.  **Hourly Probability Distributions**: Computes a normalized probability distribution (24 floats summing to 1.0) of incident start times for each corridor. A Laplace smoothing factor of `0.01` is applied to prevent zero-probability hours.
3.  **Model Compilation**: Serializes the corridor scales and hourly distributions to [manpower_ml_model.json](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/data/manpower_ml_model.json).

### B. Client-Side Resource Optimizer (`src/data/manpowerMlEvaluator.ts`)
Evaluates required staffing numbers dynamically in the browser:
1.  **Telemetry Inputs**: Receives the current replay hour (0-23), weather conditions (`clear`, `light_rain`, `heavy_rain`), and the array of active incidents.
2.  **Preemptive Resource Prediction**: For each position, the baseline hourly manpower is calculated:
    $$\text{BaseNeed} = \text{Scale}(C) \times \text{Distribution}(C, \text{Hour}) \times 24$$
3.  **Risk Multipliers & Incident Overhead**:
    *   **Weather Multipliers**: Multiplies need by `1.4` for light rain and `2.2` for heavy rain to account for stalled vehicles and water logging delays.
    *   **Incident Overhead**: Adds `+2` officers for every active incident on the corresponding corridor, and an additional `+2` officers if the incident is at the post's direct address (e.g. BSNL CACT Underpass).
4.  **Clamping & Status Evaluation**: Clamps positions to a range of 1 to 8 officers. If the sum of recommendations exceeds the available staff pool (31), it triggers an **UNDER-STAFFED ⚠️** warning; if it falls below 15, it highlights an **OVER-STAFFED** surplus.

### C. UI Integration (`src/components/ManpowerLeaderboard.tsx`)
*   **Dynamic telemetries**: Subscribes to page-level weather and time of day states from `page.tsx`.
*   **Interactive Table Updates**: Renders dynamic officer counts per post and highlights the active staffing ratio alert in real-time as time advances or weather shifts.
