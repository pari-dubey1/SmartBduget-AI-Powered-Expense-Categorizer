import pandas as pd

# Suggest savings based on highest spending
def get_savings_suggestion(df: pd.DataFrame) -> dict:
    required = {"Category", "Amount"}

    if not required.issubset(df.columns):
        raise ValueError("DataFrame must contain Category and Amount columns")

    summary = df.groupby("Category")["Amount"].sum()

    top_category = summary.idxmax()
    current_spending = summary.max()

    reduction_percent = 10
    potential_saving = current_spending * reduction_percent / 100

    return {
    "category": top_category,
    "current_spending": round(float(current_spending), 2),
    "suggested_reduction_percent": reduction_percent,
    "potential_saving": round(float(potential_saving), 2),
    "reason": f"{top_category} is your highest-spending category.",
    "message": (
        f"Consider reducing {top_category} spending "
        f"by {reduction_percent}%."
       )
    }

  