def validate_expense_data(data):
    """
    Validate incoming expense data.

    Returns:
        (True, None) if valid
        (False, error_message) if invalid
    """

    if not data:
        return False, "Request body is required"

    date = data.get("date")
    description = data.get("description")
    amount = data.get("amount")
    payment_method = data.get("payment_method")

    if not date:
        return False, "Date is required"

    if not description:
        return False, "Description is required"

    if amount is None:
        return False, "Amount is required"

    if not payment_method:
        return False, "Payment method is required"

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return False, "Amount must be a number"

    if amount <= 0:
        return False, "Amount must be greater than 0"

    return True, None