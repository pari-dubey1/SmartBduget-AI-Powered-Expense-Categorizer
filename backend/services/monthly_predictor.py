import joblib
import numpy as np
import pandas as pd

from pathlib import Path


# Get project root directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Path to monthly prediction model
MODEL_PATH = (
    BASE_DIR
    / "models"
    / "monthly_expense_predictor.pkl"
)


# Load trained model
model = joblib.load(MODEL_PATH)


FEATURES = [
    "month",
    "transaction_count",
    "average_transaction",
    "month_sin",
    "month_cos",
    "previous_month_spending",
    "rolling_3_month_avg"
]


def predict_monthly_spending(
    month,
    transaction_count,
    average_transaction,
    previous_month_spending,
    rolling_3_month_avg
):

    month_sin = np.sin(
        2 * np.pi * month / 12
    )

    month_cos = np.cos(
        2 * np.pi * month / 12
    )

    input_data = pd.DataFrame(
        [[
            month,
            transaction_count,
            average_transaction,
            month_sin,
            month_cos,
            previous_month_spending,
            rolling_3_month_avg
        ]],
        columns=FEATURES
    )

    prediction = model.predict(
        input_data
    )[0]

    return round(
        float(prediction),
        2
    )