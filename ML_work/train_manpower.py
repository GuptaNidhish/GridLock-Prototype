import pandas as pd
import numpy as np
import json
import os
import math

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "manpower_ml_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Fill empty corridors
df['corridor'] = df['corridor'].astype(str).fillna('Non-corridor')
df.loc[df['corridor'] == 'nan', 'corridor'] = 'Non-corridor'

# Parse datetime
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df = df.dropna(subset=['start_datetime'])
df['hour'] = df['start_datetime'].dt.hour

print(f"Aggregating spatial-temporal profiles across {len(df)} records...")

# Group by corridor to compute total activity scale
corridor_counts = df['corridor'].value_counts()
total_incidents = len(df)

corridor_scales = {}
for corridor, count in corridor_counts.items():
    # Use logarithmic scale to balance resource allocation (min scale 1.0, max ~4.5)
    corridor_scales[corridor] = float(round(math.log1p(count) * 0.4 + 1.0, 2))

# Compute hourly probability distribution for each corridor (24 values normalized to sum to 1.0)
hourly_distributions = {}
all_corridors = df['corridor'].unique().tolist()

for corridor in all_corridors:
    corr_df = df[df['corridor'] == corridor]
    hour_counts = corr_df['hour'].value_counts()
    
    # Initialize 24 hours with a small Laplace smoothing factor to avoid 0% probabilities
    dist = [0.01] * 24
    for h in range(24):
        if h in hour_counts:
            dist[h] += hour_counts[h]
            
    # Normalize distribution
    sum_dist = sum(dist)
    dist = [float(round(v / sum_dist, 4)) for v in dist]
    hourly_distributions[corridor] = dist

# Package and export model parameters
model_data = {
    'corridor_scales': corridor_scales,
    'hourly_distributions': hourly_distributions,
    'corridors': all_corridors
}

os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(model_data, f, indent=2)

print(f"Manpower optimization model successfully compiled to {output_path}!")
print(f"Total corridors mapped: {len(all_corridors)}")
