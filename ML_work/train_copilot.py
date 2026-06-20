import pandas as pd
import numpy as np
import json
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "copilot_rag_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Drop rows with null descriptions
df = df.dropna(subset=['description'])
df['description'] = df['description'].astype(str)
df['event_cause'] = df['event_cause'].astype(str).fillna('others')
df['corridor'] = df['corridor'].astype(str).fillna('Non-corridor')
df['police_station'] = df['police_station'].astype(str).fillna('Unknown Locality')
df['address'] = df['address'].astype(str).fillna('Unknown Address')
df['priority'] = df['priority'].astype(str).fillna('Low')

# Calculate closure duration (TTR)
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')
df['closure_time_hrs'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 3600.0
df['closure_time_hrs'] = df['closure_time_hrs'].fillna(-1.0)

# Build search text document
df['search_text'] = df['description'] + " " + df['event_cause'] + " " + df['corridor'] + " " + df['police_station']

# Remove duplicates to optimize memory and keep high-quality diverse incidents
df = df.drop_duplicates(subset=['search_text'])

print(f"Total unique incident records: {len(df)}")
# Sample a representative subset to keep compiled JSON size low (<500KB)
df_sample = df.sample(n=min(1800, len(df)), random_state=42).copy()

# Add SOP guidelines as virtual RAG documents
sops = [
    {
        "id": "SOP_MONSOON",
        "title": "Monsoon Flood Mitigation Plan",
        "desc": "Monsoon Plan: Preemptively deploy suction pumps. Redirect LCV traffic to bypass, clear drain blockages at Outer Ring Road BSNL CACT underpass.",
        "actionType": "deploy_pumps",
        "corridor": "ORR East 2",
        "priority": "High"
    },
    {
        "id": "SOP_IPL",
        "title": "IPL Crowd Flow Optimization Plan",
        "desc": "IPL Crowd Nudge: Recalibrate Queens Statue cycle timing to 180s green phase. Activate alternative routing on CBD links to reduce delay.",
        "actionType": "recalibrate_signals",
        "corridor": "CBD 2",
        "priority": "High"
    },
    {
        "id": "SOP_WILSON",
        "title": "Wilson Garden Chronic SLA Violation Plan",
        "desc": "Wilson Garden SLA: Lalbagh Road digging active for 80 days. Escalate command level to ACP Traffic, deploy physical barriers.",
        "actionType": "escalate_wilson",
        "corridor": "Non-corridor",
        "priority": "High"
    }
]

# Combine all texts for fitting vectorizer
all_docs = []
for sop in sops:
    all_docs.append(sop['desc'])

incident_docs = df_sample['search_text'].tolist()
all_docs.extend(incident_docs)

# Custom tokenizer supporting English and Kannada script character blocks
def custom_tokenizer(text):
    text = text.lower()
    words = re.findall(r'[a-zA-Z0-9\u0c80-\u0cff]+', text)
    return words

print("Fitting TF-IDF text features on corpus...")
vectorizer = TfidfVectorizer(
    tokenizer=custom_tokenizer,
    token_pattern=None,
    max_features=300, # keeps index lightweight and retrieval highly performing
    stop_words='english'
)

X = vectorizer.fit_transform(all_docs)

# Extract vocabulary and weights
feature_names = vectorizer.get_feature_names_out().tolist()
vocab_idx = vectorizer.vocabulary_
idf = vectorizer.idf_.tolist()
vocab_idf_map = {word: float(idf[vocab_idx[word]]) for word in feature_names}

# Helper to translate sparse matrix rows into standard array list
def to_sparse_list(row):
    indices = row.indices.tolist()
    data = row.data.tolist()
    return [[int(i), float(d)] for i, d in zip(indices, data)]

# Compile SOP vectors
compiled_sops = []
for i, sop in enumerate(sops):
    row_vec = X[i]
    compiled_sops.append({
        "id": sop["id"],
        "title": sop["title"],
        "desc": sop["desc"],
        "actionType": sop["actionType"],
        "corridor": sop["corridor"],
        "priority": sop["priority"],
        "vector": to_sparse_list(row_vec)
    })

# Compile Incident vectors
compiled_incidents = []
for idx, (_, row) in enumerate(df_sample.iterrows()):
    doc_index = len(sops) + idx
    row_vec = X[doc_index]
    address_str = str(row['address'])
    if address_str.lower() in ('nan', ''):
        address_str = 'Unknown Address'
        
    compiled_incidents.append({
        "id": str(row['id']),
        "desc": str(row['description']),
        "cause": str(row['event_cause']),
        "corridor": str(row['corridor']),
        "loc": address_str,
        "ttr": float(row['closure_time_hrs']),
        "priority": str(row['priority']),
        "vector": to_sparse_list(row_vec)
    })

# Save package
model_data = {
    "vocabulary": feature_names,
    "idf_weights": vocab_idf_map,
    "sops": compiled_sops,
    "incidents": compiled_incidents
}

os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(model_data, f, indent=2)

print(f"Co-Pilot RAG Model compiled successfully! Total indexed: {len(compiled_incidents)} incidents, {len(compiled_sops)} SOPs.")
