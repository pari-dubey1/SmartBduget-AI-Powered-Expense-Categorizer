from flask import Blueprint, request, jsonify

from database.db import (
    add_expense,
    get_expenses,
    get_expense_by_id,
    update_expense,
    delete_expense
)


expense_bp = Blueprint(
    "expense",
    __name__,
    url_prefix="/api/expenses"
)
@expense_bp.route("", methods=["POST"])
def create_expense():
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    date = data.get("date")
    description = data.get("description")
    amount = data.get("amount")
    payment_method = data.get("payment_method")

    # Temporary category
    category = data.get("category", "Other")

    if not date:
        return jsonify({
            "error": "Date is required"
        }), 400

    if not description:
        return jsonify({
            "error": "Description is required"
        }), 400

    if amount is None:
        return jsonify({
            "error": "Amount is required"
        }), 400

    if not payment_method:
        return jsonify({
            "error": "Payment method is required"
        }), 400

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Amount must be a number"
        }), 400

    if amount <= 0:
        return jsonify({
            "error": "Amount must be greater than 0"
        }), 400

    expense_id = add_expense(
        date,
        description,
        amount,
        category,
        payment_method
    )

    return jsonify({
        "message": "Expense added successfully",
        "expense_id": expense_id,
        "category": category
    }), 201
@expense_bp.route("", methods=["GET"])
def list_expenses():
    expenses = get_expenses()

    return jsonify({
        "expenses": expenses,
        "count": len(expenses)
    }), 200
@expense_bp.route("/<int:expense_id>", methods=["GET"])
def get_single_expense(expense_id):
    expense = get_expense_by_id(expense_id)

    if expense is None:
        return jsonify({
            "error": "Expense not found"
        }), 404

    return jsonify(expense), 200
@expense_bp.route("/<int:expense_id>", methods=["PUT"])
def edit_expense(expense_id):
    existing_expense = get_expense_by_id(expense_id)

    if existing_expense is None:
        return jsonify({
            "error": "Expense not found"
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    date = data.get(
        "date",
        existing_expense["date"]
    )

    description = data.get(
        "description",
        existing_expense["description"]
    )

    amount = data.get(
        "amount",
        existing_expense["amount"]
    )

    category = data.get(
        "category",
        existing_expense["category"]
    )

    payment_method = data.get(
        "payment_method",
        existing_expense["payment_method"]
    )

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Amount must be a number"
        }), 400

    if amount <= 0:
        return jsonify({
            "error": "Amount must be greater than 0"
        }), 400

    updated = update_expense(
        expense_id,
        date,
        description,
        amount,
        category,
        payment_method
    )

    if not updated:
        return jsonify({
            "error": "Could not update expense"
        }), 500

    return jsonify({
        "message": "Expense updated successfully",
        "expense": get_expense_by_id(expense_id)
    }), 200
@expense_bp.route("/<int:expense_id>", methods=["DELETE"])
def remove_expense(expense_id):
    existing_expense = get_expense_by_id(expense_id)

    if existing_expense is None:
        return jsonify({
            "error": "Expense not found"
        }), 404

    deleted = delete_expense(expense_id)

    if not deleted:
        return jsonify({
            "error": "Could not delete expense"
        }), 500

    return jsonify({
        "message": "Expense deleted successfully"
    }), 200