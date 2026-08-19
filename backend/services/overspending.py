# Check if current spending is unusually high
def check_overspending(current_spending: float, average_spending: float) -> dict:
    if average_spending <= 0:
        raise ValueError("average_spending must be greater than zero")

    percentage_increase = (
        (current_spending - average_spending) / average_spending
    ) * 100

    is_overspending = percentage_increase > 20

    if is_overspending:
        message = (
            f"Your spending is {percentage_increase:.2f}% "
            "higher than your average."
        )
    else:
        message = "Your spending is within your normal range."

    return {
        "is_overspending": is_overspending,
        "percentage_increase": round(percentage_increase, 2),
        "message": message
    }
