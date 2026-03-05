from app.database.db_connection import execute_query

class UserQueries:
    @staticmethod
    def get_all_users():
        query = "SELECT id, username, email, created_at FROM users"
        return execute_query(query, fetch_all=True) or []