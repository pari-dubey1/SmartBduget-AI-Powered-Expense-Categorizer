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
def get_total_spending(month=None, year=None):
    connection = get_db_connection()

    query = """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
    """

    params = []

    if month is not None and year is not None:
        query += """
            WHERE strftime('%m', date) = ?
            AND strftime('%Y', date) = ?
        """

        params = [
            f"{int(month):02d}",
            str(year)
        ]

    row = connection.execute(
        query,
        params
    ).fetchone()

    connection.close()

    return float(row["total"])
def get_expense_count(month=None, year=None):
    connection = get_db_connection()

    query = """
        SELECT COUNT(*) AS count
        FROM expenses
    """

    params = []

    if month is not None and year is not None:
        query += """
            WHERE strftime('%m', date) = ?
            AND strftime('%Y', date) = ?
        """

        params = [
            f"{int(month):02d}",
            str(year)
        ]

    row = connection.execute(
        query,
        params
    ).fetchone()

    connection.close()

    return row["count"]
def get_category_spending(month=None, year=None):
    connection = get_db_connection()

    query = """
        SELECT
            category,
            SUM(amount) AS total
        FROM expenses
    """

    params = []

    if month is not None and year is not None:
        query += """
            WHERE strftime('%m', date) = ?
            AND strftime('%Y', date) = ?
        """

        params = [
            f"{int(month):02d}",
            str(year)
        ]

    query += """
        GROUP BY category
        ORDER BY total DESC
    """

    rows = connection.execute(
        query,
        params
    ).fetchall()

    connection.close()

    return [
        {
            "category": row["category"],
            "total": float(row["total"])
        }
        for row in rows
    ]
def get_monthly_spending():
    connection = get_db_connection()

    rows = connection.execute(
        """
        SELECT
            strftime('%Y', date) AS year,
            strftime('%m', date) AS month,
            SUM(amount) AS total
        FROM expenses
        GROUP BY year, month
        ORDER BY year, month
        """
    ).fetchall()

    connection.close()

    return [
        {
            "year": int(row["year"]),
            "month": int(row["month"]),
            "total": float(row["total"])
        }
        for row in rows
    ]
def get_highest_category(month=None, year=None):
    category_data = get_category_spending(
        month,
        year
    )

    if not category_data:
        return None

    return category_data[0]
def get_average_expense(month=None, year=None):
    connection = get_db_connection()

    query = """
        SELECT COALESCE(AVG(amount), 0) AS average
        FROM expenses
    """

    params = []

    if month is not None and year is not None:
        query += """
            WHERE strftime('%m', date) = ?
            AND strftime('%Y', date) = ?
        """

        params = [
            f"{int(month):02d}",
            str(year)
        ]

    row = connection.execute(
        query,
        params
    ).fetchone()

    connection.close()

    return float(row["average"])