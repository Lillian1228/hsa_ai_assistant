"""
Copyright 2025 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import sqlite3
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import logger
from pathlib import Path


class Database:
    """SQL database for storing approved receipt items."""
    
    def __init__(self, db_path: str = "receipts.db"):
        """
        Initialize the database connection.
        
        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize the database schema if it doesn't exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS approved_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price REAL NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    category TEXT NOT NULL,
                    store_name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    image_url TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            logger.info("Database initialized successfully")
    
    @contextmanager
    def _get_connection(self):
        """Get a database connection with proper cleanup."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
        finally:
            conn.close()
    
    def insert_approved_items(
        self,
        items: List[Dict[str, Any]],
        store_name: str,
        date: str,
        image_url: str,
    ) -> None:
        """
        Insert approved items into the database.
        
        Args:
            items: List of approved items with name, price, quantity, category
            store_name: Name of the store
            date: Date of purchase
            image_url: URL of the receipt image
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            for item in items:
                cursor.execute("""
                    INSERT INTO approved_items 
                    (name, price, quantity, category, store_name, date, image_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    item.get("name", ""),
                    item.get("price", 0.0),
                    item.get("quantity", 1),
                    item.get("category", ""),
                    store_name,
                    date,
                    image_url,
                ))
            conn.commit()
            logger.info(f"Inserted {len(items)} approved items into database")
    
    def get_all_items(self) -> List[Dict[str, Any]]:
        """
        Get all approved items from the database.
        
        Returns:
            List of dictionaries containing all approved items
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    id,
                    name,
                    price,
                    quantity,
                    category,
                    store_name,
                    date,
                    image_url,
                    created_at
                FROM approved_items
                ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_items_by_date_range(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """
        Get approved items within a date range.
        
        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
        
        Returns:
            List of dictionaries containing approved items in the date range
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    id,
                    name,
                    price,
                    quantity,
                    category,
                    store_name,
                    date,
                    image_url,
                    created_at
                FROM approved_items
                WHERE date >= ? AND date <= ?
                ORDER BY date DESC, created_at DESC
            """, (start_date, end_date))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_items_by_category(
        self, category: str
    ) -> List[Dict[str, Any]]:
        """
        Get approved items by category.
        
        Args:
            category: Category to filter by (hsa_eligible, non_hsa_eligible, unsure_hsa)
        
        Returns:
            List of dictionaries containing approved items with the specified category
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    id,
                    name,
                    price,
                    quantity,
                    category,
                    store_name,
                    date,
                    image_url,
                    created_at
                FROM approved_items
                WHERE category = ?
                ORDER BY date DESC, created_at DESC
            """, (category,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

