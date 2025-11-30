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
                    description TEXT DEFAULT '',
                    price REAL NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    store_name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    image_url TEXT NOT NULL,
                    payment_card TEXT DEFAULT '',
                    card_last_four_digit TEXT DEFAULT '',
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
        payment_card: str = "",
        card_last_four_digit: str = "",
    ) -> None:
        """
        Insert approved items into the database, skipping duplicates.
        
        An item is considered a duplicate if it has the same name, description, price,
        quantity, store_name, date, and image_url (same receipt).
        
        Args:
            items: List of approved items with name, price, quantity
            store_name: Name of the store
            date: Date of purchase
            image_url: URL of the receipt image
            payment_card: Payment card type or name
            card_last_four_digit: Last four digits of the payment card
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            inserted_count = 0
            skipped_count = 0
            
            for item in items:
                # Check if this item already exists (duplicate check)
                cursor.execute("""
                    SELECT COUNT(*) FROM approved_items
                    WHERE name = ? 
                    AND description = ?
                    AND price = ?
                    AND quantity = ?
                    AND store_name = ?
                    AND date = ?
                    AND image_url = ?
                """, (
                    item.get("name", ""),
                    item.get("description", ""),
                    item.get("price", 0.0),
                    item.get("quantity", 1),
                    store_name,
                    date,
                    image_url,
                ))
                
                count = cursor.fetchone()[0]
                
                if count == 0:
                    # Item doesn't exist, insert it
                    cursor.execute("""
                        INSERT INTO approved_items 
                        (name, description, price, quantity, store_name, date, image_url, payment_card, card_last_four_digit)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item.get("name", ""),
                        item.get("description", ""),
                        item.get("price", 0.0),
                        item.get("quantity", 1),
                        store_name,
                        date,
                        image_url,
                        payment_card,
                        card_last_four_digit,
                    ))
                    inserted_count += 1
                else:
                    # Item already exists, skip it
                    skipped_count += 1
                    logger.debug(
                        f"Skipped duplicate item: {item.get('name', '')} "
                        f"(price: {item.get('price', 0.0)}, quantity: {item.get('quantity', 1)}) "
                        f"from {store_name} on {date}"
                    )
            
            conn.commit()
            logger.info(
                f"Inserted {inserted_count} approved items into database, "
                f"skipped {skipped_count} duplicates"
            )
    
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
                    description,
                    price,
                    quantity,
                    store_name,
                    date,
                    image_url,
                    payment_card,
                    card_last_four_digit,
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
                    description,
                    price,
                    quantity,
                    store_name,
                    date,
                    image_url,
                    payment_card,
                    card_last_four_digit,
                    created_at
                FROM approved_items
                WHERE date >= ? AND date <= ?
                ORDER BY date DESC, created_at DESC
            """, (start_date, end_date))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    

