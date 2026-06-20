import pandas as pd
import numpy as np
import json
import os
from sklearn.tree import DecisionTreeRegressor

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "ttr_ml_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Clean datetime columns
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['closed_datetime'] = pd.to_datetime(df['closed_datetime'], errors='coerce')

# Calculate target variable: closure time in hours
df['closure_time_hrs'] = (df['closed_datetime'] - df['start_datetime']).dt.total_seconds() / 3600.0

# Clean target variable: drop rows where TTR is null or negative, and cap positive outliers
df = df.dropna(subset=['closure_time_hrs'])
df = df[df['closure_time_hrs'] >= 0]
df['closure_time_hrs'] = np.clip(df['closure_time_hrs'], 0, 2000.0) # Cap outliers at 2000 hours

print(f"Dataset cleaned. Training on {len(df)} records with valid closure times.")

# Fill categorical NAs
df['event_cause'] = df['event_cause'].fillna('others')
df['priority'] = df['priority'].fillna('Low')
df['police_station'] = df['police_station'].fillna('Unknown')
df['corridor'] = df['corridor'].fillna('Non-corridor')
df['veh_type'] = df['veh_type'].fillna('private_car')

# Encode categorical columns
categorical_cols = ['event_cause', 'priority', 'police_station', 'corridor', 'veh_type']
category_maps = {}

for col in categorical_cols:
    unique_vals = sorted(df[col].unique().tolist())
    val_map = {val: i for i, val in enumerate(unique_vals)}
    category_maps[col] = val_map
    df[col + '_encoded'] = df[col].map(val_map)

# Features and target
feature_cols = ['event_cause_encoded', 'priority_encoded', 'police_station_encoded', 'corridor_encoded', 'veh_type_encoded']
X = df[feature_cols]
y = df['closure_time_hrs']

# Train decision tree regressor
print("Training Decision Tree Regressor model for TTR...")
model = DecisionTreeRegressor(max_depth=5, random_state=42)
model.fit(X, y)

# Traversal serialization function
def serialize_node(tree, node, feature_names):
    if tree.feature[node] != -2: # split node
        return {
            'type': 'split',
            'feature': feature_names[tree.feature[node]],
            'threshold': float(tree.threshold[node]),
            'left': serialize_node(tree, tree.children_left[node], feature_names),
            'right': serialize_node(tree, tree.children_right[node], feature_names)
        }
    else: # leaf node
        return {
            'type': 'leaf',
            'value': float(tree.value[node][0][0])
        }

# Serialize tree structure
tree_serialized = serialize_node(model.tree_, 0, feature_cols)

# Output structure
output_data = {
    'category_maps': category_maps,
    'feature_names': feature_cols,
    'tree': tree_serialized
}

# Write output file
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(output_data, f, indent=2)

print(f"TTR ML Model compiled successfully to {output_path}!")
