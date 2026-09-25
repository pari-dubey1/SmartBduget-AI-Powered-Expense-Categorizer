from flask import Flask, request, jsonify
from flask_cors import CORS
from database.db import init_db, get_expenses, get_budget_status
from routes.expense_routes import expense_bp
from routes.dashboard_routes import dashboard_bp
from routes.budget_routes import budget_bp
from routes.prediction_routes import prediction_bp
from services.predictor import predict_category_with_confidence, get_supported_categories
from services.overspending import analyze_budget_status
from services.savings import get_savings_suggestion
import pandas as pd
app = Flask(__name__)

CORS(app)

# Initialize database
init_db()

# Register expense routes
app.register_blueprint(expense_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(budget_bp)
app.register_blueprint(prediction_bp)



@app.route("/")
def home():
    return {
        "message": "SmartBudget Backend is running!"
    }


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    description = str(data.get("description", "")).strip()
    if not description:
        return jsonify({"error": "Description is required"}), 400
    try:
        category, confidence = predict_category_with_confidence(description)
        response = {"category": category}
        if confidence is not None:
            response["confidence"] = confidence
        return jsonify(response), 200
    except Exception as error:
        app.logger.exception("Expense category prediction failed: %s", error)
        return jsonify({"error": "Unable to predict expense category"}), 500


@app.route("/api/savings-insights", methods=["GET"])
def savings_insights():
    expenses = get_expenses()
    if not expenses:
        return jsonify({"message": "Add expenses to generate savings insights.", "suggestions": []}), 200
    try:
        frame = pd.DataFrame(expenses).rename(columns={"category": "Category", "amount": "Amount"})
        return jsonify(get_savings_suggestion(frame)), 200
    except Exception as error:
        app.logger.exception("Savings insight generation failed: %s", error)
        return jsonify({"error": "Unable to generate savings insights"}), 500


@app.route("/api/overspending", methods=["GET"])
def overspending():
    month = request.args.get("month")
    year = request.args.get("year")
    if month is None or year is None:
        return jsonify({"error": "Month and year are required"}), 400
    try:
        analysis = analyze_budget_status(get_budget_status(int(month), int(year)))
        return jsonify({"month": int(month), "year": int(year), "budgets": analysis}), 200
    except (TypeError, ValueError):
        return jsonify({"error": "Month and year must be numbers"}), 400
    except Exception as error:
        app.logger.exception("Overspending analysis failed: %s", error)
        return jsonify({"error": "Unable to generate overspending alerts"}), 500


@app.route("/api/categories", methods=["GET"])
def categories():
    try:
        return jsonify({"categories": get_supported_categories()}), 200
    except Exception as error:
        app.logger.exception("Category list generation failed: %s", error)
        return jsonify({"error": "Unable to load categories"}), 500


if __name__ == "__main__":
    app.run(debug=True)