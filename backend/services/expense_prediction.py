import pandas as pd


# Predict next month's spending from historical data
def predict_next_month_spending(df: pd.DataFrame) -> dict:
    # Check required columns
    required = {"Month", "Month_Number", "Year", "Amount"}

    if not required.issubset(df.columns):
        raise ValueError(
            "DataFrame must contain Month, Month_Number, Year and Amount columns"
        )

    # Calculate total spending for each month
    monthly_spending = (
        df.groupby(["Year", "Month_Number", "Month"])["Amount"]
        .sum()
        .reset_index()
        .sort_values(["Year", "Month_Number"])
    )

    # Ensure enough data is available
    if len(monthly_spending) < 2:
        raise ValueError("At least two months of spending data are required")

    # Get the latest month's spending
    latest = monthly_spending.iloc[-1]

    # Calculate average monthly spending change
    monthly_changes = monthly_spending["Amount"].diff().dropna()
    average_change = monthly_changes.mean()

    # Predict next month's spending
    predicted_spending = latest["Amount"] + average_change

    # Calculate next month and year
    next_month_number = latest["Month_Number"] + 1
    next_year = latest["Year"]

    if next_month_number > 12:
        next_month_number = 1
        next_year += 1

    # Convert month number to month name
    month_names = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ]

    predicted_month = month_names[next_month_number - 1]

    # Return the prediction
    return {
        "predicted_month": predicted_month,
        "predicted_year": int(next_year),
        "predicted_spending": round(float(predicted_spending), 2)
    }