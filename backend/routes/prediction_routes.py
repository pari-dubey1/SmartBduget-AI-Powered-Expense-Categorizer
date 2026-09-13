from flask import Blueprint, request, jsonify
from datetime import date
import calendar

from database.db import (
    get_month_total,
    get_previous_months_average,
    get_monthly_prediction_features
)

from services.monthly_predictor import (
    predict_monthly_spending
)


prediction_bp = Blueprint(
    "prediction",
    __name__,
    url_prefix="/api/prediction"
)


@prediction_bp.route("/monthly", methods=["GET"])
def monthly_prediction():

    month = request.args.get("month")
    year = request.args.get("year")

    # Validate required parameters
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

    # Validate month
    if month < 1 or month > 12:
        return jsonify({
            "error": "Month must be between 1 and 12"
        }), 400

    # Get current month's spending
    current_spending = get_month_total(
        month,
        year
    )

    # Get current month's transaction features
    features = get_monthly_prediction_features(
        month,
        year
    )

    # Get previous 3 months average
    rolling_3_month_avg = get_previous_months_average(
        month,
        year,
        3
    )

    # --------------------------------------------------
    # CASE 1: No spending in requested month
    # --------------------------------------------------

    if current_spending <= 0:

        if rolling_3_month_avg > 0:
            prediction = rolling_3_month_avg
            prediction_method = "historical_average"

        else:
            prediction = 0.0
            prediction_method = "insufficient_history"

    # --------------------------------------------------
    # CASE 2: Spending exists
    # --------------------------------------------------

    else:

        previous_month_spending = (
            rolling_3_month_avg
            if rolling_3_month_avg > 0
            else current_spending
        )

        ml_prediction = predict_monthly_spending(
            month=month,
            transaction_count=features["transaction_count"],
            average_transaction=features["average_transaction"],
            previous_month_spending=previous_month_spending,
            rolling_3_month_avg=(
                rolling_3_month_avg
                if rolling_3_month_avg > 0
                else current_spending
            )
        )

        today = date.today()

        is_current_month = (
            year == today.year
            and month == today.month
        )

        # --------------------------------------------------
        # Current month:
        # project spending based on days elapsed
        # --------------------------------------------------

        if is_current_month:

            days_elapsed = today.day

            days_in_month = calendar.monthrange(
                year,
                month
            )[1]

            projected_spending = (
                current_spending / days_elapsed
            ) * days_in_month

            # Protect against unrealistic ML predictions
            if ml_prediction > current_spending * 10:

                prediction = projected_spending
                prediction_method = (
                    "current_spending_projection"
                )

            else:

                prediction = ml_prediction
                prediction_method = "ml_model"

        # --------------------------------------------------
        # Past month:
        # ML prediction should remain close to
        # the observed spending scale
        # --------------------------------------------------

        else:

            reference_spending = max(
                current_spending,
                rolling_3_month_avg
            )

            # If the ML model produces an unrealistic
            # prediction compared with actual/history,
            # use the historical average when available.
            if (
                reference_spending > 0
                and (
                    ml_prediction > reference_spending * 10
                    or ml_prediction < reference_spending * 0.1
                )
            ):

                if rolling_3_month_avg > 0:
                    prediction = rolling_3_month_avg
                    prediction_method = "historical_average"

                else:
                    prediction = current_spending
                    prediction_method = "current_spending"

            else:

                prediction = ml_prediction
                prediction_method = "ml_model"

    # --------------------------------------------------
    # Final response
    # --------------------------------------------------

    prediction = round(
        float(prediction),
        2
    )

    expected_remaining = max(
        prediction - current_spending,
        0
    )

    return jsonify({
        "month": month,
        "year": year,
        "current_spending": round(
            current_spending,
            2
        ),
        "predicted_month_end": prediction,
        "expected_remaining_spending": round(
            float(expected_remaining),
            2
        ),
        "prediction_method": prediction_method
    }), 200