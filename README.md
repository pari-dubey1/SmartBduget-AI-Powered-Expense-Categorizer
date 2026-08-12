# SmartBudget - AI Powered Expense Categorizer

## Project Structure

```text
SmartBudget/
│
├── backend/
│   ├── app.py                     # Flask application entry point
│   ├── requirements.txt           # Backend dependencies
│   ├── database.db                # SQLite database
│   ├── database/                  # Database-related modules
│   ├── models/                    # Trained ML models used by backend
│   ├── routes/                    # API endpoints
│   ├── services/                  # Business logic
│   └── utils/                     # Helper functions and utilities
│
├── frontend/                      # Frontend application
│
├── datasets/
│   ├── personal_finance_dataset_8000_extended.csv
│   ├── cleaned_dataset.csv
│   └── augmented_dataset.csv
│
├── models/
│   ├── expense_classifier.pkl
│   └── expense_classifier_v2.pkl
│
├── notebooks/
│   ├── data_cleaning.ipynb
│   ├── dataset_augmentation.ipynb
│   ├── final_train_model.ipynb
│   └── train_model.ipynb
│
├── venv/                          # Local virtual environment (ignored by Git)
│
├── .gitignore
├── requirements.txt
└── README.md
```
