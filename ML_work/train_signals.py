import pandas as pd
import numpy as np
import json
import os

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "signals_ml_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Parse start_datetime
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df = df.dropna(subset=['start_datetime'])
df['hour'] = df['start_datetime'].dt.hour

print("Compiling baseline traffic flow ratios...")
# Count incidents per hour as a proxy for traffic pressure/congestion levels
hourly_counts = df['hour'].value_counts()
max_count = hourly_counts.max()

# Compute hourly flow ratio baseline (ranging from 0.35 in dead hours to 0.70 in peak hours)
hourly_flow_ratios = [0.35] * 24
for h in range(24):
    if h in hourly_counts:
        ratio = 0.35 + (hourly_counts[h] / max_count) * 0.35
        hourly_flow_ratios[h] = float(round(ratio, 3))

# Weather-based lost time (seconds per signal cycle due to reduced friction & deceleration)
weather_lost_time = {
    'clear': 20,
    'light_rain': 24,
    'heavy_rain': 30
}

# Compile model data
model_data = {
    'hourly_flow_ratios': hourly_flow_ratios,
    'weather_lost_time': weather_lost_time,
    'junction_corridors': {
        'Queens Statue Circle': 'CBD 2',
        'BSNL CACT Underpass': 'ORR East 2',
        'Jalahalli Cross Junction': 'Tumkur Road'
      }
}

os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(model_data, f, indent=2)

print(f"Signal optimization parameters successfully compiled to {output_path}!")
