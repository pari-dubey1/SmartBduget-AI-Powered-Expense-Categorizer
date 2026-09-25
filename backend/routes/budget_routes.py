import sqlite3
from flask import Blueprint, request, jsonify, current_app
import pandas as pd

from database.db import (
    add_budget,
    get_budgets,
    get_budget_by_id,
    update_budget,
    delete_budget,
    get_budget_status,
    get_expenses
)
from services.overspending import analyze_budget_status
from services.savings import get_savings_suggestion
from services.predictor import get_supported_categories


budget_bp = Blueprint(
    "budget",
    __name__,
    url_prefix="/api/budgets"
)


# Create a budget
@budget_bp.route("", methods=["POST"])
def create_budget():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Request body is required"
        }), 400

    category = data.get("category")
    amount = data.get("amount")
    month = data.get("month")
    year = data.get("year")

    if not category:
        return jsonify({
            "error": "Category is required"
        }), 400
    if category not in get_supported_categories():
        return jsonify({"error": "Category is not supported"}), 400

    if amount is None:
        return jsonify({
            "error": "Amount is required"
        }), 400

    if month is None or year is None:
        return jsonify({
            "error": "Month and year are required"
        }), 400

    try:
        amount = float(amount)
        month = int(month)
        year = int(year)

    except (TypeError, ValueError):

        return jsonify({
            "error": "Amount, month and year must be valid numbers"
        }), 400

    if amount <= 0:

        return jsonify({
            "error": "Budget amount must be greater than 0"
        }), 400

    if month < 1 or month > 12:

        return jsonify({
            "error": "Month must be between 1 and 12"
        }), 400

    try:
        budget_id = add_budget(category, amount, month, year)
    except sqlite3.IntegrityError:
        return jsonify({
            "error": "A budget already exists for this category and month"
        }), 409
    except Exception as error:
        current_app.logger.exception("Budget creation failed: %s", error)
        return jsonify({"error": "Could not create budget"}), 500

    return jsonify({
        "message": "Budget created successfully",
        "budget_id": budget_id
    }), 201


# Get all budgets
@budget_bp.route("", methods=["GET"])
def list_budgets():

    month = request.args.get("month")
    year = request.args.get("year")

    if month is not None and year is not None:

        try:
            month = int(month)
            year = int(year)

        except ValueError:

            return jsonify({
                "error": "Month and year must be numbers"
            }), 400

    else:
        month = None
        year = None

    budgets = get_budgets(
        month,
        year
    )

    return jsonify({
        "budgets": budgets,
        "count": len(budgets)
    }), 200


# Get one budget
@budget_bp.route("/<int:budget_id>", methods=["GET"])
def get_single_budget(budget_id):

    budget = get_budget_by_id(budget_id)

    if budget is None:

        return jsonify({
            "error": "Budget not found"
        }), 404

    return jsonify(budget), 200


# Update a budget
@budget_bp.route("/<int:budget_id>", methods=["PUT"])
def edit_budget(budget_id):

    existing = get_budget_by_id(budget_id)

    if existing is None:

        return jsonify({
            "error": "Budget not found"
        }), 404

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "Request body is required"
        }), 400

    category = data.get(
        "category",
        existing["category"]
    )
    if category not in get_supported_categories():
        return jsonify({"error": "Category is not supported"}), 400

    amount = data.get(
        "amount",
        existing["amount"]
    )

    month = data.get(
        "month",
        existing["month"]
    )

    year = data.get(
        "year",
        existing["year"]
    )

    try:
        amount = float(amount)
        month = int(month)
        year = int(year)

    except (TypeError, ValueError):

        return jsonify({
            "error": "Invalid budget values"
        }), 400

    if amount <= 0:

        return jsonify({
            "error": "Budget amount must be greater than 0"
        }), 400

    if month < 1 or month > 12:

        return jsonify({
            "error": "Month must be between 1 and 12"
        }), 400

    try:
        updated = update_budget(budget_id, category, amount, month, year)
    except sqlite3.IntegrityError:
        return jsonify({
            "error": "A budget already exists for this category and month"
        }), 409

    if not updated:

        return jsonify({
            "error": "Could not update budget"
        }), 500

    return jsonify({
        "message": "Budget updated successfully",
        "budget": get_budget_by_id(budget_id)
    }), 200


# Delete a budget
@budget_bp.route("/<int:budget_id>", methods=["DELETE"])
def remove_budget(budget_id):

    existing = get_budget_by_id(budget_id)

    if existing is None:

        return jsonify({
            "error": "Budget not found"
        }), 404

    deleted = delete_budget(budget_id)

    if not deleted:

        return jsonify({
            "error": "Could not delete budget"
        }), 500

    return jsonify({
        "message": "Budget deleted successfully"
    }), 200
# Get budget status and overspending analysis
@budget_bp.route("/status", methods=["GET"])
def budget_status():

    month = request.args.get("month")
    year = request.args.get("year")

    if month is None or year is None:
        return jsonify({
            "error": "Month and year are required"
        }), 400

    try:
        month = int(month)
        year = int(year)

    except (TypeError, ValueError):
        return jsonify({
            "error": "Month and year must be numbers"
        }), 400

    if month < 1 or month > 12:
        return jsonify({
            "error": "Month must be between 1 and 12"
        }), 400

    budget_data = get_budget_status(
        month,
        year
    )

    analysis = analyze_budget_status(
        budget_data
    )

    return jsonify({
        "month": month,
        "year": year,
        "budgets": analysis
    }), 200
# Get savings suggestion
@budget_bp.route("/savings", methods=["GET"])
def savings_suggestion():

    expenses = get_expenses()

    if not expenses:
        return jsonify({
            "error": "No expenses available for savings suggestion"
        }), 404

    df = pd.DataFrame(expenses)

    # Convert database column names
    # to the names expected by savings.py
    df = df.rename(columns={
        "category": "Category",
        "amount": "Amount"
    })

    try:
        suggestion = get_savings_suggestion(df)

    except Exception as error:
        print("Savings suggestion error:", error)

        return jsonify({
            "error": "Unable to generate savings suggestion"
        }), 500

    return jsonify(suggestion), 200