import psycopg
from flask import current_app, g
import logging

def get_db():
    if 'db' not in g:
        try:
            db_config = current_app.config['DB_CONFIG']
            g.db = psycopg.connect(
                host=db_config['host'],
                port=db_config['port'],
                dbname=db_config['database'],
                user=db_config['user'],
                password=db_config['password']
            )
            logging.info("Kết nối PostgreSQL thành công")
        except Exception as e:
            logging.error(f"Lỗi kết nối PostgreSQL: {e}")
            raise e
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()
        logging.info("Đã đóng kết nối database")

def init_app(app):
    app.teardown_appcontext(close_db)

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
            if fetch_one:
                result = cur.fetchone()
                if result and hasattr(cur, 'description'):
                    columns = [desc[0] for desc in cur.description]
                    result = dict(zip(columns, result))
                return result
            elif fetch_all:
                results = cur.fetchall()
                if results and hasattr(cur, 'description'):
                    columns = [desc[0] for desc in cur.description]
                    results = [dict(zip(columns, row)) for row in results]
                return results
            else:
                conn.commit()
                return cur.rowcount
    except Exception as e:
        conn.rollback()
        logging.error(f"Lỗi query: {e}")
        raise e