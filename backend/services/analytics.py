import pandas as pd


# Validate columns needed for analytics
def _validate_columns(df: pd.DataFrame) -> None:
    required = {"Category", "Amount", "Month"}

    if not required.issubset(df.columns):
        raise ValueError(
            "DataFrame must contain Category, Amount, and Month columns"
        )


# Get total spending by category
def get_category_summary(df: pd.DataFrame) -> pd.DataFrame:
    _validate_columns(df)

    return df.groupby("Category")["Amount"].sum().reset_index()


# Get total spending by month
def get_monthly_summary(df: pd.DataFrame) -> pd.DataFrame:
    _validate_columns(df)

    months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ]

    summary = df.groupby("Month")["Amount"].sum().reset_index()

    # Keep months in calendar order
    summary["Month"] = pd.Categorical(
        summary["Month"],
        categories=months,
        ordered=True
    )

    return summary.sort_values("Month").reset_index(drop=True)


# Get the highest-spending category
def get_top_category(df: pd.DataFrame) -> str:
    _validate_columns(df)

    summary = get_category_summary(df)

    return summary.loc[summary["Amount"].idxmax(), "Category"]

# Get average monthly spending
def get_average_monthly_spending(df: pd.DataFrame) -> float:
    _validate_columns(df)

    summary = get_monthly_summary(df)

    return summary["Amount"].mean()


# Get highest and lowest spending months
def get_spending_extremes(df: pd.DataFrame) -> dict:
    _validate_columns(df)

    summary = get_monthly_summary(df)

    highest = summary.loc[summary["Amount"].idxmax()]
    lowest = summary.loc[summary["Amount"].idxmin()]

    return {
        "highest_spending_month": {
            "month": str(highest["Month"]),
            "amount": round(float(highest["Amount"]),2)
        },
        "lowest_spending_month": {
            "month": str(lowest["Month"]),
            "amount": round(float(lowest["Amount"]),2)
        }
    }

# Calculate month-to-month spending changes
def get_monthly_changes(df: pd.DataFrame) -> pd.DataFrame:
    _validate_columns(df)

    summary = get_monthly_summary(df).copy()

    summary["Change"] = summary["Amount"].pct_change().mul(100).round(2)

    return summary