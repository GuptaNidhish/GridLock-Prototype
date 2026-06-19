# ASTRAM Command Center Context

## Project Overview
ASTRAM COMMAND is an Event-Driven Congestion Intelligence Platform for Bengaluru's traffic network. It transitions traffic management from reactive policing to active, data-driven city orchestration.

## ASTRAM Dataset Schema (45 Columns Mapping)
*   **Col 1: `incident_id`** → Unique identifier (e.g., `FKID000000`)
*   **Col 2: `event_type`** → `planned` / `unplanned`
*   **Col 3: `start_latitude`** → e.g., `13.04`
*   **Col 4: `start_longitude`** → e.g., `77.5181`
*   **Col 5: `end_latitude`** → `0` or actual value (`0` = same as start)
*   **Col 6: `end_longitude`** → `0` or actual value
*   **Col 7: `start_address`** → Full geocoded address with PIN
*   **Col 8: `end_address / sub_type`** → `vehicle_breakdown`, `tree_fall`, `accident`, `water_logging`, etc.
*   **Col 9: `incident_category`** → Secondary classification
*   **Col 10: `is_diversion`** → `TRUE` / `FALSE`
*   **Col 11: `created_at`** → Timestamp of incident report
*   **Col 12: `scheduled_end`** → Timestamp for planned events (`NULL` for unplanned)
*   **Col 13: `status`** → `active` / `resolved` / `closed`
*   **Col 14: `is_verified`** → `yes` / `no`
*   **Col 15: `last_updated`** → Last modification timestamp
*   **Col 16: `description`** → Free text (Kannada + English)
*   **Col 17: `vehicle_type`** → `lcv`, `heavy_vehicle`, `private_car`, `bmtc_bus`, etc.
*   **Col 18: `vehicle_reg`** → Anonymized registration (e.g., `FKN00GL0000`)
*   **Col 19: `corridor`** → `Tumkur Road`, `ORR East 1`, `CBD 2`, `Non-corridor`, etc.
*   **Col 20: `priority`** → `High` / `Low`
*   **Col 21-23: NULL fields** → Reserved (e.g., `estimated_clearance`, backups)
*   **Col 24: `first_response_at`** → Acknowledging officer timestamp
*   **Col 25: `attachments`** → `[]` or `NULL`
*   **Col 26: `version`** → Record version (usually 1)
*   **Col 27: `reported_by`** → Field officer ID (e.g., `FKUSR00000`)
*   **Col 28: `created_by`** → Dispatcher/system ID (e.g., `FKUSR00001`)
*   **Col 29: `assigned_to`** → Assigned officer ID
*   **Col 30: `escalated_to`** → Escalated officer ID
*   **Col 31: `additional_field`** → `NULL` in most cases
*   **Col 32: `locality`** → e.g., `Peenya`, `HSR Layout`, `Wilson Garden`
*   **Col 33: `sub_locality`** → `NULL` in most cases
*   **Col 34: `kg_id`** → Zone / Knowledge Graph ID (e.g., `FKKG000000`)
*   **Col 35: `resolved_address`** → Address where resolved
*   **Col 36: `resolved_lat`** → Resolution latitude
*   **Col 37: `resolved_lon`** → Resolution longitude
*   **Col 38: `resolved_by`** → Officer who resolved the incident
*   **Col 39: `resolved_at`** → Resolution timestamp
*   **Col 40: `closed_by`** → Officer who closed the incident
*   **Col 41: `closed_at`** → Closure timestamp
*   **Col 42: `additional_notes`** → `NULL` in most cases
*   **Col 43: `division`** → e.g., `Bengaluru Central Corporation`, `North Corporation`
*   **Col 44: `zone`** → e.g., `Central Zone 2`, `North Zone 1`
*   **Col 45: `junction`** → e.g., `QueensStatueCircle`, `LalbaghMainGateJunc`

## Key Data Insights & Anomalies
1.  **Response Time / Resolution Gap**: Incidents like `FKID000002` (cement blocking) stayed open for 80 days. High SLA breach.
2.  **Officer Workload Imbalance**: System account (`FKUSR00001`) creates most entries. Specific officers like `FKUSR00011` handle repetitive water logging on ORR East.
3.  **Corridor Mismatch**: "Non-corridor" incidents are marked "Low" priority, but they cause chronic delays (e.g., 17 days for BWSSB work).

## Features to Implement (with Working Actions)
1.  **Digital Twin City**: Interactive live map of traffic networks. *Interactive clicking allows dispatchers to directly set barricades, toggle signal priority, or route emergency corridors.*
2.  **Chrono-Replay**: Timeline playback of historical incidents with counterfactual simulations.
3.  **Citizen Pulse**: Social media scraping with active forms to log detected events.
4.  **Smart Barricade Planner**: Coordinate-based barricade placement with print-ready actions.
5.  **Weather-Traffic Fusion Engine**: Prediction of flood-risk points based on weather reports, auto-triggering monsoon protocols.
6.  **Manpower Optimizer**: Shift scheduling and PC/SI placement boards.
7.  **Incident Lifecycle Tracker**: SLA tracking and automatic escalation chain handlers.
8.  **Inter-Agency Command Bridge**: BBMP, BESCOM, and BWSSB ticket statuses.
9.  **Crowd Dynamics Estimator**: Venue mode-split calculations.
10. **Route Vaccination**: Signal timing nudges ahead of planned events.
11. **Signal Timing Recommendation Engine**: Adaptive signal phase recommendation card.
12. **Emergency Vehicle Corridor**: VIP path clearing controls.
13. **Anomaly Detection**: Infers causes from sudden speed drops.
14. **VIP Movement Integration**: Public delay impact predictors.
15. **Predictive Parking Pressure Map**: Lot occupancy level monitors.
16. **Commuter Impact Score (CIS)**: Congestion index gauge (0-100).
17. **WhatsApp Bot Simulator**: Interactive chat thread allowing text-based incident creations and camera analysis.
18. **Event Calendar Intelligence**: Scraped event risk schedule grid.
19. **Performance Analytics Dashboard**: Response sparklines and compliance ratings.
20. **Officer Gamification**: Achievement leaderboards and badges.
21. **AI Traffic Co-Pilot Brain [NEW]**: Rule-based intelligence engine parsing system logs to output structured execution advice. Includes an NLP prompt bar ("Ask ASTRAM AI...").
22. **Pop-out Window Sub-routing [NEW]**: Individual widgets are addressable via separate full-screen routes (`/map`, `/whatsapp`, `/analytics`, `/tracker`) allowing open-in-new-tab actions.
23. **Resizable Grid Workspace Settings [NEW]**: Flexible layout grid allowing reordering, rescaled dimensions, and layout state saves to local storage.

## Implementation Architecture
*   **Framework**: Next.js (App Router, TypeScript)
*   **Styling**: Tailwind CSS / Vanilla CSS variables for high-fidelity glassmorphism dark theme.
*   **State Management**: LocalStorage for workspace configs, unified state in main container.
