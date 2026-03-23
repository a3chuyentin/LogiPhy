import sqlite3
import hashlib
import os
import json
from typing import Optional, Dict, List, Any
import logging
from app.config import Config

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or Config.DATABASE_PATH
        self.init_db()

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    password TEXT NOT NULL,
                    totalpoint INTEGER DEFAULT 0,
                    currentpoint INTEGER DEFAULT 0,
                    selecteditem TEXT DEFAULT 'none',
                    is_admin BOOLEAN DEFAULT 0
                )
            ''')
            
            try:
                with open(Config.SHOP_ITEMS_FILE, 'r', encoding='utf-8') as file:
                    shop_data = json.load(file)
                    shop_items = shop_data.get('items', [])
                    
                cursor.execute("PRAGMA table_info(users)")
                existing_columns = [column[1] for column in cursor.fetchall()]
                
                for item in shop_items:
                    item_id = item['id']
                    if item_id not in existing_columns:
                        cursor.execute(f"ALTER TABLE users ADD COLUMN {item_id} BOOLEAN DEFAULT 0")
                        logger.info(f"Added column {item_id} to users table")
                        
            except Exception as e:
                logger.error(f"Error loading shop items for DB init: {str(e)}")
            
            cursor.execute("SELECT * FROM users WHERE username = 'admin'")
            if not cursor.fetchone():
                hashed_password = hashlib.sha256('admin123'.encode()).hexdigest()
                cursor.execute('''
                    INSERT INTO users (username, password, totalpoint, currentpoint, is_admin)
                    VALUES (?, ?, 0, 0, 1)
                ''', ('admin', hashed_password))
            
            conn.commit()

    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def user_exists(self, username: str) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
            return cursor.fetchone() is not None

    def login_user(self, username: str, password: str) -> bool:
        hashed_password = self.hash_password(password)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT username FROM users WHERE username = ? AND password = ?",
                (username, hashed_password)
            )
            return cursor.fetchone() is not None

    def register_user(self, username: str, password: str) -> bool:
        if self.user_exists(username):
            return False
        
        hashed_password = self.hash_password(password)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (username, password, totalpoint, currentpoint, selecteditem)
                VALUES (?, ?, 0, 0, 'none')
            ''', (username, hashed_password))
            
            try:
                with open(Config.SHOP_ITEMS_FILE, 'r', encoding='utf-8') as file:
                    shop_data = json.load(file)
                    shop_items = shop_data.get('items', [])
                    
                for item in shop_items:
                    item_id = item['id']
                    cursor.execute(f"UPDATE users SET {item_id} = 0 WHERE username = ?", (username,))
                    
            except Exception as e:
                logger.error(f"Error initializing items for new user: {str(e)}")
            
            conn.commit()
            return True

    def get_user_data(self, username: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def update_points(self, username: str, totalpoint: int, currentpoint: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET totalpoint = ?, currentpoint = ?
                WHERE username = ?
            ''', (totalpoint, currentpoint, username))
            conn.commit()
            return cursor.rowcount > 0

    def update_current_point(self, username: str, currentpoint: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE users 
                SET currentpoint = ?
                WHERE username = ?
            ''', (currentpoint, username))
            conn.commit()
            return cursor.rowcount > 0

    def update_field(self, username: str, field: str, value: Any) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if field not in columns:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {field} BOOLEAN DEFAULT 0")
                logger.info(f"Added missing column {field} to users table")
            
            cursor.execute(f"UPDATE users SET {field} = ? WHERE username = ?", (value, username))
            conn.commit()
            return cursor.rowcount > 0

    def update_selected_item(self, username: str, item_id: str) -> bool:
        return self.update_field(username, 'selecteditem', item_id)

    def update_user_password(self, username: str, new_password: str) -> bool:
        hashed_password = self.hash_password(new_password)
        return self.update_field(username, 'password', hashed_password)

    def get_rankings(self, limit: int = 50, exclude_admin: bool = True) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if exclude_admin:
                cursor.execute('''
                    SELECT username, totalpoint, selecteditem 
                    FROM users 
                    WHERE is_admin = 0
                    ORDER BY totalpoint DESC 
                    LIMIT ?
                ''', (limit,))
            else:
                cursor.execute('''
                    SELECT username, totalpoint, selecteditem 
                    FROM users 
                    ORDER BY totalpoint DESC 
                    LIMIT ?
                ''', (limit,))
            return [dict(row) for row in cursor.fetchall()]

    def get_all_users(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT username, totalpoint, currentpoint, is_admin FROM users")
            return [dict(row) for row in cursor.fetchall()]

    def is_admin(self, username: str) -> bool:
        user_data = self.get_user_data(username)
        return user_data and user_data.get('is_admin', False)

    def update_user_points(self, username: str, totalpoint: int, currentpoint: int) -> bool:
        return self.update_points(username, totalpoint, currentpoint)

    def delete_user(self, username: str) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users WHERE username = ?", (username,))
            conn.commit()
            return cursor.rowcount > 0