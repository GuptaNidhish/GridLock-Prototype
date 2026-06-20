# 🤖 Feature 4: WhatsApp Bot Multilingual NLP Engine Explainer

## 1. What is the Use of this Feature? (The Business Case)
Field officers in Bengaluru report traffic disruptions (accidents, waterlogging, fallen trees, potholes) in real-time. Instead of filling out complex UI forms while directing traffic on busy corridors, they report incidents using a mobile chat client (simulated as the **WhatsApp Field Officer Bot**).

Previously, this chat parser was a simple keyword matcher. Typing *"tree fall"* or *"accident"* worked, but typing natural descriptions like *"Major crash on Hosur Road"* or typing in Kannada (*"ಬಸ್ ಬ್ರೇಕ್ ಡೌನ್"* - BMTC bus breakdown) failed to match.

The **ML-backed NLP Engine** solves this:
*   **Unstructured Free-Text Support**: Officers can type descriptions naturally in their language.
*   **Multilingual Support**: Supports both English and Kannada Unicode blocks, recognizing script patterns.
*   **Automatic Geolocation Mapping**: Extracts location references in the message (e.g. *"peenya"*, *"sankey"*, *"underpass"*) and automatically assigns the exact coordinates (latitude, longitude, corridor) to place a marker on the Leaflet Live Map instantly.

---

## 2. What is it Doing Under the Hood? (The Technical Implementation)

### A. Offline Classifier Training (`ML_work/train_whatsapp_nlp.py`)
We train a text classifier on **6,813 descriptions** with associated event causes in the CSV dataset.
1.  **Kannada/English Tokenizer**: Splits texts into lowercase word tokens, supporting both English alphabets and Kannada Unicode script blocks (range `\u0c80` to `\u0cff`).
2.  **TF-IDF Vectorizer**: Constructs term frequency-inverse document frequency weights for a vocabulary of the top 400 features, mapping how unique each word is across all logs (e.g. word `"ವೋಟರ್"` (water) has high IDF weight for waterlogging).
3.  **Logistic Regression Classifier**: Learns optimal weights and intercepts for the classes `['vehicle_breakdown', 'tree_fall', 'accident', 'water_logging', 'pot_holes', 'construction', 'others']`.
4.  **JSON Model Serialization**: Saves the vocabulary index, prior IDF weights, class intercept vectors, and coefficients arrays to [whatsapp_nlp_model.json](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/data/whatsapp_nlp_model.json).

```json
{
  "classes": ["accident", "construction", "others", "pot_holes", "tree_fall", "vehicle_breakdown", "water_logging"],
  "vocabulary": ["accident", "blocking", "bus", "down", "fall", "flooded", "heavy", "traffic", "tree", "ವೋಟರ್", ...],
  "idf_weights": { "accident": 3.82, "ವೋಟರ್": 4.54, ... },
  "coefficients": {
    "water_logging": [-0.5, 0.2, -0.1, 1.8, ...],
    "tree_fall": [0.1, -0.3, 0.4, -0.2, 2.5, ...]
  },
  "intercepts": { "water_logging": -1.24, "tree_fall": -2.05, ... }
}
```

### B. Client-Side NLP Classifier Engine (`src/data/whatsappNlpEvaluator.ts`)
Executes the TF-IDF feature mapping and Logistic Regression classification directly in TypeScript inside the client:
1.  **Tokenization**:
    `const matches = textLower.match(/[a-z0-9\u0c80-\u0cff]+/g)`
2.  **TF-IDF Extraction**: Calculates term frequency in the input text and multiplies it by the model's IDF weights for the 400 vocabulary terms.
3.  **Logistic Regression Evaluation**: Computes the dot product of the coefficients and the TF-IDF features for each class, adding the class intercept:
    $$\text{Score}(C) = \text{Intercept}(C) + \sum_{i=1}^{400} \text{TF-IDF}_{i} \times \text{Coefficient}_{i}(C)$$
    The class with the highest score is predicted as the incident cause.
4.  **Location Extractor**: Checks keywords (e.g., Agara, Peenya, Sankey, Underpass) and retrieves their coordinates.

### C. UI Integration (`src/components/WhatsAppBot.tsx`)
*   **Inference Trigger**: When the officer types in the WhatsApp Bot, [WhatsAppBot.tsx](file:///Users/nidhishgupta/Desktop/GridLock%20Prototype/src/components/WhatsAppBot.tsx) intercepts the text and runs the model:
    `const predictedType = predictIncidentType(textToSend);`
    `const geoDetails = extractIncidentLocation(textToSend);`
*   **Bot Response**: Responds dynamically showing the ML-classified cause, address, and corridor:
    *“🤖 ML CLASSIFIER LOGGED: WATER LOGGING at BSNL CACT Underpass, ORR East 2”*
*   **Live Map Update**: Auto-triggers the `onAddIncidentFromBot` callback to place the new incident marker on the map and trigger the Commuter Impact Score (CIS) recalculation.
