# 📊 ASTRAM: Machine Learning Strategy & Feature Mapping

## 1. Executive Summary
Bengaluru's traffic network is highly dynamic. Currently, the ASTRAM Command Center Prototype uses hardcoded rules and static configurations for its orchestration features. To make the system a true "Event-Driven Congestion Intelligence Platform," we must replace these heuristic rules with Machine Learning (ML) models trained on historical data.

This document analyzes the anonymized ASTRAM Event Dataset ([Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/Astram%20event%20data_anonymized%20-%20Astram%20event%20data_anonymizedb40ac87.csv)) containing **8,173 recorded incidents**, and outlines the specific features that require ML, mapping them to the dataset's columns, appropriate algorithms, and integration strategies.

---

## 2. Key Insights from the ASTRAM Dataset
Before designing the ML models, we analyzed the dataset. Here are the key findings that shape our ML strategy:

### A. Unplanned vs. Planned Incidents
*   **Unplanned**: **94.3% (7,706)** of all incidents (accidents, breakdowns, waterlogging, etc.)
*   **Planned**: **5.7% (467)** of all incidents (processions, protests, construction, public events)
*   > [!NOTE]
    > **ML Implication**: Models must focus heavily on real-time anomaly detection, predictive forecasting, and reactive incident lifecycle tracking, as the vast majority of delays are unplanned.

### B. Primary Causes of Disruptions
The top incident categories are:
1.  `vehicle_breakdown`: **4,896 incidents** (59.9%) — by far the largest congestion driver.
2.  `pot_holes`: **537 incidents** (6.6%)
3.  `construction`: **480 incidents** (5.9%)
4.  `water_logging`: **458 incidents** (5.6%)
5.  `accident`: **365 incidents** (4.5%)
6.  `tree_fall`: **284 incidents** (3.5%)

### C. The Dual-Speed Incident Lifecycle (SLA Gap)
We observed a severe disparity in average closure times (calculated as `closed_datetime` minus `start_datetime`):

| Incident Category (`event_cause`) | Average Closure Time (Hours) | Category Classification | Required Intervention |
| :--- | :--- | :--- | :--- |
| **Debris** | 1,621.7 hours (~67.5 days) | Structural / Inter-Agency | BBMP Waste Management |
| **Potholes** (`pot_holes`) | 591.9 hours (~24.6 days) | Structural / Inter-Agency | BBMP Road Infrastructure |
| **Road Conditions** | 431.5 hours (~18.0 days) | Structural / Inter-Agency | BBMP Maintenance |
| **Construction** | 227.7 hours (~9.5 days) | Structural / Inter-Agency | BBMP/BMRCL Coordination |
| **Water Logging** | 204.9 hours (~8.5 days) | Structural / Inter-Agency | BWSSB / BBMP Drainage |
| **Tree Fall** | 102.7 hours (~4.3 days) | Structural / Inter-Agency | BBMP Forestry & BESCOM |
| **Congestion** | 1.2 hours (~74 mins) | Transient / Traffic | Police Patrol & Signals |
| **Vehicle Breakdown** | 0.95 hours (~57 mins) | Transient / Traffic | Towing & Patrol Crews |
| **Procession** | 0.9 hours (~54 mins) | Transient / Traffic | Route Diversion & Escort |
| **Accident** | 0.8 hours (~48 mins) | Transient / Traffic | Emergency Green Corridor |

*   > [!IMPORTANT]
    > **ML Implication**: The Incident Lifecycle Tracker must distinguish between **Transient Traffic Events** (resolved in hours/minutes) and **Structural Infrastructure Events** (resolved in days/weeks). Hardcoded SLA timers (e.g. 4h for all high-priority issues) lead to false alarms and administrative fatigue.

### D. Priority & Area Bottlenecks
*   `High` priority incidents take **87.4 hours** on average to close, whereas `Low` priority incidents take **135.9 hours**.
*   **CBD 2** (291.6 hours) and **CBD 1** (264.8 hours) experience the longest average closure times, while Airport routes and Outer Ring Road (ORR) segments have faster resolution times.
*   **Non-corridors** account for **3,124 entries** (38.2%) and average **134.1 hours** to close, demonstrating a significant resource gap outside primary corridors.

---

## 3. ASTRAM Features Mapping to ML Models

We will replace the static, hardcoded front-end logic with **7 Core Machine Learning Engines**:

### 1. Weather-Traffic Fusion Engine (Flood & Disruption Predictor)
*   **Current Mock Logic** ([WeatherFusion.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/WeatherFusion.tsx)): Hardcoded multipliers (e.g., Heavy Rain = +110% Congestion, +60% Incident Risk) and static text warnings.
*   **Why ML is Needed**: Waterlogging and flooding depend on local topography (low-lying valleys, underpasses), drainage capacity, and prior saturation levels, not just current rain intensity. A generic multiplier leads to over-alerting.
*   **ML Task**: Spatio-temporal Classification & Risk Forecasting.
*   **Target Label**: Probability of water logging/flooding (`event_cause == 'water_logging'`) at a specific coordinate grid cell during a time window.
*   **CSV Features Used**:
    *   `latitude`, `longitude` (geographical coordinates of previous water logging incidents).
    *   `police_station`, `zone` (regional infrastructure capacity indicators).
    *   `start_datetime` (extracted month for monsoon seasonality, and hour of day).
    *   *External inputs*: Live precipitation rate (mm/hr) and cumulative 24h rainfall from meteorological APIs.
*   **Algorithm**: **XGBoost Classifier** or **Random Forest** (yielding a probability score $P(\text{Flood}) \in [0, 1]$).
*   **System Action**: Automates the trigger of monsoon protocols (e.g., deploying suction pumps via [onTogglePumpTeams](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/WeatherFusion.tsx#L131-L150) and updating VMS signboards) when prediction probability exceeds 80%.

### 2. Commuter Impact Score (CIS) Estimator
*   **Current Mock Logic** ([CisDial.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/CisDial.tsx)): Renders a static `score` prop between 0 and 100 which is hardcoded in parent components.
*   **Why ML is Needed**: Commuter impact is a complex function of lane blockage, vehicle size, corridor capacity, and traffic density. A breakdown of an LCV (light commercial vehicle) on Tumkur Road during peak hours causes severe gridlock, whereas the same breakdown on a minor non-corridor street has minimal impact.
*   **ML Task**: Regression (Predicting traffic queue length or speed drop).
*   **Target Label**: Congestion / Speed Drop index normalized to $[0, 100]$.
*   **CSV Features Used**:
    *   `event_cause` (accident vs. breakdown vs. construction).
    *   `requires_road_closure` (Boolean flag).
    *   `corridor` (identifying capacity: primary highway vs. secondary link).
    *   `veh_type` (`heavy_vehicle`, `lcv`, `private_car` - see breakdown of `veh_type` counts in dataset).
    *   `start_datetime` (hour of day to separate peak commuter rush vs. late-night).
*   **Algorithm**: **Gradient Boosting Regressor** or **Multi-layer Perceptron (MLP)**.
*   **System Action**: Automatically feeds the predicted score to [CisDial](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/CisDial.tsx) upon new incident creation, auto-triaging incidents.

### 3. Incident Lifecycle & SLA Breach Tracker (TTR Predictor)
*   **Current Mock Logic** ([IncidentTracker.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/IncidentTracker.tsx)): Displays a countdown timer based on priority (4h for High, 24h for Low).
*   **Why ML is Needed**: As shown in the statistical analysis, potholes and roadwork take 10-25 days to close, while accidents take less than an hour. A static countdown is highly inaccurate and ignores division-level workload.
*   **ML Task**: Regression (Predicting Time-to-Resolution - TTR).
*   **Target Label**: `closure_time_hrs` (calculated as `closed_datetime - start_datetime`).
*   **CSV Features Used**:
    *   `event_cause` (major predictor: pothole vs. accident).
    *   `priority` (`High` vs. `Low`).
    *   `police_station`, `zone` (field officer workload and agency responsiveness).
    *   `corridor` (accessibility / traffic density).
    *   `veh_type` (blockage clearance difficulty).
*   **Algorithm**: **Survival Analysis (Cox Proportional Hazards Model)** or **Random Forest Regressor**.
*   **System Action**: Calculates a dynamic, case-specific SLA. If the real-time resolution pace exceeds the predicted SLA window, the system triggers the automatic escalation chain.

### 4. WhatsApp Field Officer Bot (NLP & Computer Vision)
*   **Current Mock Logic** ([WhatsAppBot.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/WhatsAppBot.tsx)): String keyword matching (e.g. `normText.includes('water')`) and fake image analysis logic.
*   **Why ML is Needed**: Field officers report incidents using unstructured text, often mixing English and Kannada (e.g. "ಊರ್ವಶಿ ಜಂಕ್ಷನ್ ನಲ್ಲಿ..."). Furthermore, they upload photos of accidents that must be parsed to confirm blocking and estimate towing needs.
*   **ML Tasks**:
    1.  **Multilingual Named Entity Recognition (NER)** & Classification.
    2.  **Computer Vision (CV)** Object Detection.
*   **Target Label**:
    *   Text: Extract incident type (`event_cause`), locality, registration number (`veh_no`).
    *   Image: Identify vehicle type, crash severity, and road blockage percentage.
*   **CSV Features Used**:
    *   `description` (free-text logs) to train NLP classifiers.
    *   `veh_no` and `veh_type` to map entity labels.
    *   Uploaded image attachments (can be linked to `event_cause`).
*   **Algorithm**: Fine-tuned **mBERT** (Multilingual BERT) or **XLM-RoBERTa** for textual classification; **YOLOv8** / **ResNet** for incident verification from photos.
*   **System Action**: Allows officers to log verified incidents on the map directly via text/photo without manual form submission.

### 5. AI Traffic Co-Pilot Brain (LLM RAG Agent)
*   **Current Mock Logic** ([AiCopilot.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/AiCopilot.tsx)): Hardcoded responses for exact keywords like "Monsoon Plan", "IPL Crowd Nudge", or "Wilson Garden SLA".
*   **Why ML is Needed**: Command dispatchers need to query past incidents, query Standard Operating Procedures (SOPs), and receive suggestions for novel situations. A rule-based chat cannot answer open-ended questions.
*   **ML Task**: Retrieval-Augmented Generation (RAG).
*   **Target Label**: Conversational text output with executable action payloads.
*   **CSV Features Used**:
    *   The entire historical database of incident descriptions (`description`), resolution methods (`comment`), and spatial/temporal context (`corridor`, `junction`, `start_datetime`).
*   **Algorithm**: **Gemini 1.5 Flash / Pro** (using `google-genai` SDK) connected to a Vector Database (e.g. **ChromaDB** or **Pinecone**) containing embeddings of historical incidents and agency SOPs.
*   **System Action**: The NLP prompt box in [AiCopilot](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/AiCopilot.tsx) processes free-form questions like *"Where did vehicle breakdowns cause the longest delays on Tumkur Road last winter?"* and generates verified, data-backed execution advice.

### 6. Manpower Optimizer & Shift Scheduler
*   **Current Mock Logic** ([ManpowerLeaderboard.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/ManpowerLeaderboard.tsx)): Displays mock lists of SI/PC assignments and performance scores.
*   **Why ML is Needed**: To optimize patrol coverage, officers must be preemptively dispatched to zones where high-impact incidents are mathematically likely to occur, rather than simply responding after a bottleneck forms.
*   **ML Task**: Spatio-temporal demand forecasting.
*   **Target Label**: Density / frequency of incidents in a grid zone/junction per hour.
*   **CSV Features Used**:
    *   `start_datetime` (day of week, time of day, holiday status).
    *   `latitude`, `longitude`, `junction`, `police_station`.
    *   `event_cause` (accident/breakdown probability modeling).
*   **Algorithm**: **Spatio-Temporal Graph Neural Networks (STGNN)** or **Prophet** (time-series forecasting).
*   **System Action**: Automatically highlights high-probability incident clusters on the map, recommending patrol routes and scheduling officer placements dynamically.

### 7. Signal Timing Recommendation Engine & Route Vaccination
*   **Current Mock Logic** ([DigitalTwinMap.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/DigitalTwinMap.tsx#L320-L389)): Static toggles for "Trigger Green Wave Override".
*   **Why ML is Needed**: Congestion propagates dynamically down a corridor. Recalibrating signal timings at one junction (e.g. Chinnaswamy Stadium during an IPL match) without balancing downstream signals creates massive tailbacks elsewhere.
*   **ML Task**: Policy Optimization for Adaptive Control.
*   **Target Label**: Duration of green light phases for specific signal splits.
*   **CSV Features Used**:
    *   Junction metrics, historical traffic counts, incident duration profiles.
*   **Algorithm**: **Deep Reinforcement Learning (DRL)** (e.g., Deep Q-Networks or Advantage Actor-Critic (A2C)).
*   **System Action**: Recommends multi-junction adaptive timing phase offsets to the dispatcher, minimizing total vehicle delay.

---

## 4. Proposed ML Architecture & Data Pipeline

```mermaid
graph TD
    subgraph Data Layer
        A[Astram Event CSV Dataset] --> D(Data Processing & Embedding)
        B[Live Weather API] --> E(Real-time Context Parser)
        C[Leaflet Map Coordinates] --> E
    end

    subgraph ML Pipeline
        D --> F[Vector DB / Embeddings]
        F --> G[RAG LLM Engine]
        D --> H[XGBoost & RandomForest Models]
        E --> H
    end

    subgraph Service Layer (FastAPI Back-End)
        G --> I[CO-PILOT API]
        H --> J[PREDICTIVE telemetry API]
    end

    subgraph Next.js Front-End Widgets
        I --> K[AiCopilot.tsx]
        J --> L[WeatherFusion.tsx]
        J --> M[CisDial.tsx]
        J --> N[IncidentTracker.tsx]
    end

    style Next.js Front-End Widgets fill:#0f172a,stroke:#38bdf8,stroke-width:2px;
    style Service Layer (FastAPI Back-End) fill:#1e293b,stroke:#a855f7,stroke-width:2px;
    style ML Pipeline fill:#1e293b,stroke:#10b981,stroke-width:2px;
```

---

## 5. Summary Matrix: Next.js to ML Mapping

| Next.js Component | File Path | Current Hardcoded UI Variable | Proposed Target ML Model | Primary CSV Column Mappings |
| :--- | :--- | :--- | :--- | :--- |
| **CisDial** | [CisDial.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/CisDial.tsx) | `score` prop (0-100) | Commuter Impact Score (CIS) Regressor | `corridor`, `event_cause`, `requires_road_closure`, `veh_type`, `start_datetime` |
| **WeatherFusion** | [WeatherFusion.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/WeatherFusion.tsx) | `multiplier`, `probability`, `warnings` | Spatio-Temporal Flood Classifier | `latitude`, `longitude`, `event_cause` ("water_logging"), `start_datetime`, `police_station` |
| **IncidentTracker** | [IncidentTracker.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/IncidentTracker.tsx) | Heuristic SLA (4h High, 24h Low) | Time-to-Resolution (TTR) Predictor | `event_cause`, `priority`, `corridor`, `start_datetime`, `closed_datetime` |
| **WhatsAppBot** | [WhatsAppBot.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/WhatsAppBot.tsx) | Regex match and hardcoded image analysis | Multilingual NLP Classifier & YOLOv8 Obstacle Detector | `description`, `veh_type`, `veh_no`, `address`, uploaded media |
| **AiCopilot** | [AiCopilot.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/AiCopilot.tsx) | `normText` conditional branches | LLM RAG Copilot | Historical log descriptions, incident metadata, SOP guidelines |
| **ManpowerLeaderboard** | [ManpowerLeaderboard.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/ManpowerLeaderboard.tsx) | Mock SI/PC performance grids | Spatio-Temporal Demand Dispatcher | `police_station`, `start_datetime`, incident spatial coordinates |
| **DigitalTwinMap** | [DigitalTwinMap.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/DigitalTwinMap.tsx) | Manual Green Wave triggers | Reinforcement Learning Adaptive Signal Controller | `junction`, `corridor`, `requires_road_closure` |

---

## 6. Next Steps for Implementation
1.  **Expose FastAPI Backend**: Create a Python backend using FastAPI (e.g. `backend/app.py`) to load the trained models and serve predictions.
2.  **Train Models in Jupyter**: Write python notebooks (e.g. using `scikit-learn`, `xgboost`, and `google-genai` SDK) to load the CSV, train the models, and serialize them (e.g., using `pickle` or `joblib`).
3.  **Frontend fetch Calls**: In `src/app/page.tsx`, replace the hardcoded state update handlers with fetch calls to the FastAPI backend routes.
