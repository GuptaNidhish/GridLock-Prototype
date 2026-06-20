# 🌧️ Feature 1: Weather-Traffic Fusion Engine Explainer

## 1. What is the Use of this Feature? (The Business Case)
During monsoon showers and severe weather, Bengaluru's traffic network experiences critical choke points. Underpasses flood, trees fall blocking power cables, and slippery roads trigger accidents. Traditionally, traffic management has been **reactive**: police officers only act *after* a driver reports a stall or a corridor is already gridlocked.

The **Weather-Traffic Fusion Engine** transitions city orchestration to **proactive management**:
*   **Preemptive Dispatch**: Predicts high-probability flooding hotspots before they occur, allowing the command center to dispatch suction pumps to vulnerable underpasses (e.g., BSNL CACT underpass) *before* the water rises.
*   **Dynamic Signage (Nudges)**: Estimates congestion spikes to update digital VMS signboards, advising heavy vehicles and commuters to take alternative bypass routes.
*   **Adaptive Resource Allocations**: Helps schedulers predict incident density spikes to adjust police patrol density during peak weather risks.

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

The engine consists of a two-stage machine learning system: **offline statistical training** and **real-time probabilistic inference**.

```
+---------------------------------------+
|  Historical CSV Dataset (8,173 rows)  |
+---------------------------------------+
                   |
                   v (Offline: train_weather.py)
+---------------------------------------+
|   weather_ml_model.json (ML Priors)   |
+---------------------------------------+
                   |
                   v (Online: /api/weather-fusion API Route)
+---------------------------------------+
|  Naive Bayes Inference & Risk Scaling |
+---------------------------------------+
                   |
                   v (Real-time: Frontend UI)
+-----------------------------------------------------------+
| Weather Card (Warnings)  <--->  CisDial (Congestion Dial) |
+-----------------------------------------------------------+
```

### A. Offline Training (`ML_work/train_weather.py`)
The training script parses the historical database of 8,173 incidents to extract the spatial and temporal distributions of weather-sensitive event causes: `water_logging`, `tree_fall`, and `accident`.
1.  **Spatial Likelihoods**: Calculates the prior probability of location given the cause, $P(\text{Locality} \mid \text{Cause})$, mapping which police stations (e.g., Yelahanka, K.R. Pura, Mahadevapura) are historically vulnerable to specific issues.
2.  **Temporal Month Priors**: Calculates the seasonal likelihood $P(\text{Month} \mid \text{Cause})$ to learn when rain impacts are peak (monsoons) vs. dry seasons.
3.  **Temporal Hour Priors**: Calculates the diurnal likelihood $P(\text{Hour} \mid \text{Cause})$ to learn what times of day incidents typically cluster (e.g. early morning water logging, evening commute accidents).
4.  **Incident Archive**: Extracts the actual coordinates, descriptions, and resolution durations for weather-related incidents to generate warnings.

### B. Real-Time Inference (`src/app/api/weather-fusion/route.ts`)
When a user changes the weather in the UI, or scrubs the Chrono-Replay timeline (shifting the hour of day), the front-end queries `/api/weather-fusion?weather=heavy_rain&month=6&hour=18`.

The backend performs the following steps:
1.  **Calculate Relative Temporal Factors**:
    To see how much the current month and hour elevate the risk of an incident, we divide the temporal priors by a uniform distribution ($1/12$ for months, $1/24$ for hours):
    $$\text{Relative Risk Factor} = \frac{P(\text{Month} \mid \text{Cause})}{1/12} \times \frac{P(\text{Hour} \mid \text{Cause})}{1/24}$$
2.  **Log-Transformation Scaling**:
    Relative risk spikes in the dataset can be extremely high (e.g. 35x baseline). To handle this wide range safely without causing overflow errors, we apply a log-transform:
    $$\text{Scaled Risk} = \ln(1 + \text{Relative Risk Factor})$$
3.  **Compute Weather Congestion & Risk Multipliers**:
    The engine adds the scaled risk to the weather baseline:
    *   **Heavy Rain (Downpour)** baseline is `60%`, scaling up to `150%` dynamically depending on month and hour.
    *   **Light Rain (Drizzle)** baseline is `15%`, scaling up to `50%` dynamically.
    *   **Clear** weather baseline is `0%` (Nominal), but scales to `+15%` congestion multiplier during peak rush hours (9:00-11:00, 17:00-20:00) to account for standard commuter volumes.
4.  **Extract Context-Aware Warnings**:
    Looks up matching historical incidents for the active weather causes (e.g. `water_logging` for heavy rain) and lists the actual address, Kannada/English description, and typical resolution duration from the CSV dataset.

### C. Frontend Integration (`src/components/WeatherFusion.tsx` & `page.tsx`)
*   **The Loader**: Shows a loading spinner whenever a fetch query is active.
*   **Interactive List**: Displays the warnings, rendering coordinates and the typical resolution hours (e.g., K.R. Pura waterlogging taking 155.8 hours).
*   **Commuter Impact score (CIS) Sync**: The page-level state intercepts the API's congestion multiplier and feeds it directly into the CIS calculation, causing the **CIS Dial Gauge** to change dynamically when weather or time changes.
