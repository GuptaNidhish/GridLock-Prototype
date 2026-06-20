# 🚥 Feature 7: Signal Timing Recommendation Engine & Route Vaccination Explainer

## 1. What is the Use of this Feature? (The Business Case)
Signal timing coordination across multiple intersections is crucial to prevent congestion propagation. When a corridor saturates (due to peak hour travel, heavy rain, or a severe crash), adjusting a single signal without coordinate offsets creates massive tailbacks downstream. 

The **Signal Timing Recommendation Engine & Route Vaccination** transitions corridor control from static signal cycles to **context-aware mathematical optimization**:
1.  **Webster Optimal Signal Coordination**: Calculates optimal cycle lengths and green-phase splits dynamically for major intersections, reducing average vehicle delays by up to 30%.
2.  **Interactive System Recalibration**: Let dispatchers apply recommended Webster cycle adjustments with a single click, instantly syncing green wave overrides across the Leaflet live map.
3.  **Context-Aware Route Vaccination**: Replaces static timelines with dynamic, checkable checklist timelines that adapt to the environment—switching from event advisories (default) to drain clearance (monsoon) or alternate routing preps (construction) dynamically based on active incidents and weather.

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

### A. Offline Flow & Lost Time Compilation (`ML_work/train_signals.py`)
Compiles baseline parameters from the historical ASTRAM dataset:
1.  **Baseline Flow Ratios ($Y$)**: Groups historical incidents by start hour and calculates a baseline flow saturation level (ranging from `0.35` off-peak to `0.70` during morning/evening commute peaks).
2.  **Weather Lost Time ($L$)**: Maps weather conditions to standard startup lost times (seconds per cycle lost due to driver reaction delays):
    *   `clear`: 10 seconds
    *   `light_rain`: 12 seconds
    *   `heavy_rain`: 15 seconds (due to wet surface braking and lower acceleration).
3.  **Model Serialization**: Exports parameters to [signals_ml_model.json](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/data/signals_ml_model.json).

### B. Client-Side Webster Optimizer (`src/data/signalsMlEvaluator.ts`)
Executes optimization equations and timeline compilers dynamically on the client:
1.  **Webster Signal Optimizer**:
    *   **SATURATION ($Y$)**: Retrieves baseline $Y$ for the hour. Adds `+0.08` for every active incident on the corridor, and an additional `+0.12` if the incident is directly at the junction location. Clamps $Y$ to a maximum of `0.85`.
    *   **CYCLE LENGTH ($C_o$)**: Computes optimal cycle length using Webster's equation:
        $$C_o = \frac{1.5L + 5}{1 - Y}$$
        Clamps $C_o$ between 60s (off-peak minimum) and 180s (coordinated green-wave maximum).
    *   **GREEN SPLIT**: Shifts the main road green-phase split dynamically up to `70%` (e.g. 126s main / 54s cross) under high congestion to prioritize main corridor clearance.
    *   **FLOW EFFICIENCY**: Evaluates relative delay reduction percentage (+10% up to +30%) depending on weather and active incident density.
2.  **Dynamic Route Vaccination Compiler**:
    *   **Construction Active**: If an active incident matches `road_work` or contains `digging` keywords (like the Urvashi Junction/Lalbagh Road work), compiles a timeline directing BBMP lane clearances, IT corridor WFH advisories, and tow truck pre-positioning.
    *   **Heavy Rain Active**: Compiles a monsoon timeline directing storm drain clearances, standby BESCOM generator checks, and dewatering pump pre-staging.
    *   **Default**: Compiles standard planned event routing advisories and VMS warning signages.

### C. UI Integration (`src/components/OrchestrationPanels.tsx`)
*   **Checkable Timeline**: Tenders timeline items as interactive check boxes, allowing dispatchers to check off tasks as they are cleared. Re-initializes whenever weather or construction incidents change.
*   **Recalibration Apply Triggers**: Loops through recommendations for three major junctions (Queens Statue Circle, BSNL CACT Underpass, Jalahalli Cross Junction). If a dispatcher clicks "Apply", the system triggers the green wave override on the map and updates the signal tags to "Recalibrated".
