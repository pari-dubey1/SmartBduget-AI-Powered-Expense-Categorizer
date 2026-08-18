from pathlib import Path

import joblib


# Get project root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Path to the trained ML model
MODEL_PATH = PROJECT_ROOT / "models" / "expense_classifier_v2.pkl"


# Load the trained model
model = joblib.load(MODEL_PATH)


def predict_category(description: str) -> str:
    """Predict category from expense description."""

    # Validate input type
    if not isinstance(description, str):
        raise TypeError("description must be a string")

    # Remove extra spaces
    description = description.strip()

    # Reject empty descriptions
    if not description:
        raise ValueError("description cannot be empty")

    # Predict expense category
    prediction = model.predict([description])

    # Return category name
    return prediction[0]