import pandas as pd
import numpy as np
import json
import os
from sklearn.tree import DecisionTreeRegressor

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "cis_ml_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Fill NAs
df['event_cause'] = df['event_cause'].fillna('others')
df['veh_type'] = df['veh_type'].fillna('private_car')
df['corridor'] = df['corridor'].fillna('Non-corridor')
df['requires_road_closure'] = df['requires_road_closure'].fillna(False).astype(int)

# Extract hour
df['start_datetime'] = pd.to_datetime(df['start_datetime'], errors='coerce')
df['hour'] = df['start_datetime'].dt.hour.fillna(12).astype(int)

# Define traffic flow weights for the composite commuter impact formula (as target label)
corridor_weights = {
    'Tumkur Road': 2.0, 'ORR East 1': 2.0, 'ORR East 2': 2.0,
    'Bellary Road 1': 2.0, 'Bellary Road 2': 2.0, 'Hosur Road': 2.0,
    'ORR North 1': 2.0, 'ORR North 2': 2.0, 'ORR West 1': 2.0,
    'Mysore Road': 2.0, 'Bannerghata Road': 2.0, 'Old Madras Road': 2.0,
    'CBD 1': 1.8, 'CBD 2': 1.8, 'Old Airport Road': 1.8,
    'Non-corridor': 1.0
}

vehicle_weights = {
    'heavy_vehicle': 2.2, 'bmtc_bus': 2.2, 'truck': 2.2,
    'private_bus': 2.2, 'ksrtc_bus': 2.2,
    'lcv': 1.5,
    'private_car': 1.1, 'taxi': 1.1, 'others': 1.1
}

# Calculate composite target CIS score:
# Base target is CorridorWeight * VehicleWeight * ClosureFactor * HourFactor
def calculate_target_score(row):
    corr_w = corridor_weights.get(row['corridor'], 1.0)
    veh_w = vehicle_weights.get(row['veh_type'], 1.0)
    closure_f = 2.5 if row['requires_road_closure'] == 1 else 1.0
    
    # Hour peak factor
    h = row['hour']
    if (8 <= h <= 11) or (17 <= h <= 20):
        hour_f = 1.8 # peak hours
    elif (7 <= h < 8) or (11 < h < 17) or (20 < h <= 22):
        hour_f = 1.3 # moderate
    else:
        hour_f = 0.6 # night
        
    base_impact = corr_w * veh_w * closure_f * hour_f
    # Map range to 10 - 100
    # Min possible base_impact = 1.0 * 1.0 * 1.0 * 0.6 = 0.6
    # Max possible base_impact = 2.0 * 2.2 * 2.5 * 1.8 = 19.8
    # Min/max scale
    score = 10 + ((base_impact - 0.6) / (19.8 - 0.6)) * 90
    return float(np.clip(score, 10, 100))

print("Calculating ground-truth Commuter Impact Scores (CIS)...")
df['cis_target'] = df.apply(calculate_target_score, axis=1)

# Encode categorical columns
categorical_cols = ['corridor', 'veh_type', 'event_cause']
category_maps = {}

for col in categorical_cols:
    unique_vals = sorted(df[col].unique().tolist())
    val_map = {val: i for i, val in enumerate(unique_vals)}
    category_maps[col] = val_map
    df[col + '_encoded'] = df[col].map(val_map)

# Features and target
feature_cols = ['corridor_encoded', 'veh_type_encoded', 'event_cause_encoded', 'requires_road_closure', 'hour']
X = df[feature_cols]
y = df['cis_target']

# Train decision tree regressor
print("Training Decision Tree Regressor model...")
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

print(f"CIS ML Model compiled successfully to {output_path}!")
