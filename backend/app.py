from flask import Flask
from flask_cors import CORS
from database.db import init_db
from routes.expense_routes import expense_bp
from routes.dashboard_routes import dashboard_bp

app = Flask(__name__)

CORS(app)

# Initialize database
init_db()

# Register expense routes
app.register_blueprint(expense_bp)
app.register_blueprint(dashboard_bp)



@app.route("/")
def home():
    return {
        "message": "SmartBudget Backend is running!"
    }


if __name__ == "__main__":
    app.run(debug=True)