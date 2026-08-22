from flask import Blueprint, request, jsonify

from database.db import (
    get_total_spending,
    get_expense_count,
    get_category_spending,
    get_monthly_spending,
    get_highest_category,
    get_average_expense
)


dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)
@dashboard_bp.route("/summary", methods=["GET"])
def dashboard_summary():

    month = request.args.get("month")
    year = request.args.get("year")

    if month and year:
        try:
            month = int(month)
            year = int(year)

            if month < 1 or month > 12:
                return jsonify({
                    "error": "Month must be between 1 and 12"
                }), 400

        except ValueError:
            return jsonify({
                "error": "Month and year must be numbers"
            }), 400

    else:
        month = None
        year = None

    total = get_total_spending(month, year)

    count = get_expense_count(month, year)

    highest_category = get_highest_category(
        month,
        year
    )

    average = get_average_expense(
        month,
        year
    )

    return jsonify({
        "total_spending": total,
        "transaction_count": count,
        "average_expense": average,
        "highest_category": highest_category
    }), 200
@dashboard_bp.route("/category", methods=["GET"])
def category_summary():

    month = request.args.get("month")
    year = request.args.get("year")

    if month and year:
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

    category_data = get_category_spending(
        month,
        year
    )

    return jsonify({
        "categories": category_data
    }), 200
@dashboard_bp.route("/monthly", methods=["GET"])
def monthly_summary():

    monthly_data = get_monthly_spending()

    return jsonify({
        "monthly_spending": monthly_data
    }), 200