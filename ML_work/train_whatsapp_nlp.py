import pandas as pd
import numpy as np
import json
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Define paths relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv")
output_path = os.path.join(script_dir, "..", "src", "data", "whatsapp_nlp_model.json")

print(f"Loading dataset from: {csv_path}")
df = pd.read_csv(csv_path)

# Drop rows with null descriptions or causes
df = df.dropna(subset=['description', 'event_cause'])
df['description'] = df['description'].astype(str)

# Map minor event causes to standard groups to simplify classes
target_causes = ['vehicle_breakdown', 'tree_fall', 'accident', 'water_logging', 'pot_holes', 'construction', 'others']
df['target_cause'] = df['event_cause'].apply(lambda x: x if x in target_causes else 'others')

print(f"Training text classifier on {len(df)} descriptions across {len(target_causes)} classes.")

# Custom tokenizer to support both English and Kannada characters
def custom_tokenizer(text):
    text = text.lower()
    # Match both Latin (a-z) and Kannada Unicode character blocks (0x0C80 - 0x0CFF)
    words = re.findall(r'[a-zA-Z0-9\u0c80-\u0cff]+', text)
    return words

# Train TF-IDF vectorizer
print("Extracting TF-IDF text features...")
vectorizer = TfidfVectorizer(
    tokenizer=custom_tokenizer,
    token_pattern=None,
    max_features=400, # Limit vocabulary to keep JSON small and fast
    stop_words='english' # Built-in English stop words
)

X = vectorizer.fit_transform(df['description'])
y = df['target_cause']

# Train Logistic Regression
print("Training Logistic Regression classifier...")
clf = LogisticRegression(max_iter=500, class_weight='balanced', random_state=42)
clf.fit(X, y)

# Retrieve model parameters
vocab = vectorizer.vocabulary_
idf = vectorizer.idf_.tolist()
classes = clf.classes_.tolist()
coef = clf.coef_.tolist() # shape: (n_classes, n_features)
intercept = clf.intercept_.tolist() # shape: (n_classes,)

# Map vocab word to its IDF weight
feature_names = vectorizer.get_feature_names_out().tolist()
vocab_idf_map = {word: float(idf[vocab[word]]) for word in feature_names}

# Compile JSON model parameters
model_data = {
    'classes': classes,
    'vocabulary': feature_names,
    'idf_weights': vocab_idf_map,
    'coefficients': {classes[i]: coef[i] for i in range(len(classes))},
    'intercepts': {classes[i]: float(intercept[i]) for i in range(len(classes))}
}

# Output file
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(model_data, f, indent=2)

print(f"WhatsApp NLP model successfully compiled to {output_path}!")
