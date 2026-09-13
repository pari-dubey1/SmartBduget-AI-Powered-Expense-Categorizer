from flask import Flask
from flask_cors import CORS
from database.db import init_db
from routes.expense_routes import expense_bp
from routes.dashboard_routes import dashboard_bp
from routes.budget_routes import budget_bp
from routes.prediction_routes import prediction_bp
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


if __name__ == "__main__":
    app.run(debug=True)