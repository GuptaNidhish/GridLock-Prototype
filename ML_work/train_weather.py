import pandas as pd
import numpy as np
import json
import os

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "weather_ml_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Clean datetime columns
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')
df['month'] = df['start_datetime'].dt.month
df['hour'] = df['start_datetime'].dt.hour

# Calculate resolution time
df['closure_time_hrs'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 3600.0

# Define weather-related causes
weather_causes = ['water_logging', 'tree_fall', 'accident']

# Fill NAs
df['event_cause'] = df['event_cause'].fillna('others')
df['police_station'] = df['police_station'].fillna('Unknown')
df['junction'] = df['junction'].fillna('Unknown')
df['corridor'] = df['corridor'].fillna('Non-corridor')

# Calculate total incident rates per weather-sensitive category
total_incidents = len(df)
cause_counts = df['event_cause'].value_counts().to_dict()

# Calculate spatial priors: P(location | event_cause)
# We will use police_station as a proxy for location
location_priors = {}
for cause in weather_causes:
    cause_df = df[df['event_cause'] == cause]
    station_counts = cause_df['police_station'].value_counts()
    total_cause = len(cause_df)
    priors = {}
    for station, count in station_counts.items():
        priors[station] = float((count + 1) / (total_cause + len(df['police_station'].unique())))
    location_priors[cause] = priors

# Calculate default smoothing prior for unseen locations
for cause in weather_causes:
    location_priors[cause]['_default'] = float(1 / (len(df[df['event_cause'] == cause]) + len(df['police_station'].unique())))

# Calculate month-wise probability P(month | event_cause)
month_priors = {}
for cause in weather_causes:
    cause_df = df[df['event_cause'] == cause]
    month_counts = cause_df['month'].value_counts()
    total_cause = len(cause_df)
    priors = {}
    for m in range(1, 13):
        count = month_counts.get(m, 0)
        priors[str(m)] = float((count + 1) / (total_cause + 12))
    month_priors[cause] = priors

# Calculate hourly probability P(hour | event_cause)
hour_priors = {}
for cause in weather_causes:
    cause_df = df[df['event_cause'] == cause]
    hour_counts = cause_df['hour'].value_counts()
    total_cause = len(cause_df)
    priors = {}
    for h in range(0, 24):
        count = hour_counts.get(h, 0)
        priors[str(h)] = float((count + 1) / (total_cause + 24))
    hour_priors[cause] = priors

# Get actual historical examples of incidents for high-risk warning generation
historical_warnings = []
sample_df = df[df['event_cause'].isin(weather_causes)].dropna(subset=['description', 'latitude', 'longitude'])
for cause in weather_causes:
    cause_samples = sample_df[sample_df['event_cause'] == cause].head(10)
    for _, row in cause_samples.iterrows():
        historical_warnings.append({
            'cause': cause,
            'police_station': str(row['police_station']) if not pd.isna(row['police_station']) else 'Unknown',
            'address': str(row['address']) if not pd.isna(row['address']) else 'Unknown Address',
            'description': str(row['description']) if not pd.isna(row['description']) else '',
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude']),
            'corridor': str(row['corridor']) if not pd.isna(row['corridor']) else 'Non-corridor',
            'priority': str(row['priority']) if not pd.isna(row['priority']) else 'Low',
            'closure_time_hrs': float(row['closure_time_hrs']) if not pd.isna(row['closure_time_hrs']) else None
        })

# Global averages for weather influence
metadata = {
    'total_records': total_incidents,
    'cause_breakdown': {k: int(v) for k, v in cause_counts.items()},
    'average_closure_times': {
        cause: float(df[df['event_cause'] == cause]['closure_time_hrs'].mean())
        for cause in weather_causes if len(df[df['event_cause'] == cause]) > 0
    }
}

# Compile model JSON
model_data = {
    'metadata': metadata,
    'spatial_priors': location_priors,
    'temporal_month_priors': month_priors,
    'temporal_hour_priors': hour_priors,
    'historical_incidents': historical_warnings
}

# Output file
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w") as f:
    json.dump(model_data, f, indent=2)

print(f"Weather ML Model compiled successfully to {output_path}!")
