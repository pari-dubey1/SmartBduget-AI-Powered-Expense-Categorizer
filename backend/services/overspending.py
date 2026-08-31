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
def analyze_budget_status(budget_data):

    results = []

    for item in budget_data:

        budget = item["budget"]
        spent = item["spent"]

        remaining = budget - spent

        usage_percentage = (
            (spent / budget) * 100
            if budget > 0
            else 0
        )

        if spent > budget:

            status = "overspending"

            message = (
                f"You have exceeded your "
                f"{item['category']} budget by "
                f"₹{abs(remaining):.2f}."
            )

        elif usage_percentage >= 80:

            status = "warning"

            message = (
                f"You have used "
                f"{usage_percentage:.1f}% of your "
                f"{item['category']} budget."
            )

        else:

            status = "safe"

            message = (
                f"Your {item['category']} spending "
                f"is within budget."
            )

        results.append({
            "category": item["category"],
            "budget": budget,
            "spent": spent,
            "remaining": remaining,
            "usage_percentage": round(
                usage_percentage,
                2
            ),
            "status": status,
            "message": message
        })

    return results
