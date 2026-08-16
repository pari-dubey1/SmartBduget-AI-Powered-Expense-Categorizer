import sqlite3
from pathlib import Path


DATABASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = DATABASE_DIR / "smartbudget.db"
SCHEMA_PATH = DATABASE_DIR / "schema.sql"


def get_db_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_db_connection()

    with open(SCHEMA_PATH, "r", encoding="utf-8") as file:
        schema = file.read()

    connection.executescript(schema)
    connection.commit()
    connection.close()


if __name__ == "__main__":
    init_db()
    print("SmartBudget database initialized successfully.")
    

# --------------------------------------------------
# CREATE — ADD EXPENSE
# --------------------------------------------------

def add_expense(
    date,
    description,
    amount,
    category,
    payment_method
):
    connection = get_db_connection()

    cursor = connection.execute(
        """
        INSERT INTO expenses
        (date, description, amount, category, payment_method)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            date,
            description,
            amount,
            category,
            payment_method
        )
    )

    connection.commit()

    expense_id = cursor.lastrowid

    connection.close()

    return expense_id


# --------------------------------------------------
# READ — GET ALL EXPENSES
# --------------------------------------------------

def get_expenses():
    connection = get_db_connection()

    rows = connection.execute(
        """
        SELECT *
        FROM expenses
        ORDER BY date DESC, id DESC
        """
    ).fetchall()

    connection.close()

    return [dict(row) for row in rows]


# --------------------------------------------------
# READ — GET ONE EXPENSE
# --------------------------------------------------

def get_expense_by_id(expense_id):
    connection = get_db_connection()

    row = connection.execute(
        """
        SELECT *
        FROM expenses
        WHERE id = ?
        """,
        (expense_id,)
    ).fetchone()

    connection.close()

    if row is None:
        return None

    return dict(row)


# --------------------------------------------------
# UPDATE — UPDATE EXPENSE
# --------------------------------------------------

def update_expense(
    expense_id,
    date,
    description,
    amount,
    category,
    payment_method
):
    connection = get_db_connection()

    cursor = connection.execute(
        """
        UPDATE expenses
        SET date = ?,
            description = ?,
            amount = ?,
            category = ?,
            payment_method = ?
        WHERE id = ?
        """,
        (
            date,
            description,
            amount,
            category,
            payment_method,
            expense_id
        )
    )

    connection.commit()

    updated = cursor.rowcount > 0

    connection.close()

    return updated


# --------------------------------------------------
# DELETE — DELETE EXPENSE
# --------------------------------------------------

def delete_expense(expense_id):
    connection = get_db_connection()

    cursor = connection.execute(
        """
        DELETE FROM expenses
        WHERE id = ?
        """,
        (expense_id,)
    )

    connection.commit()

    deleted = cursor.rowcount > 0

    connection.close()

    return deleted


# --------------------------------------------------
# DIRECT EXECUTION
# --------------------------------------------------

if __name__ == "__main__":
    init_db()
    print("SmartBudget database initialized successfully.")