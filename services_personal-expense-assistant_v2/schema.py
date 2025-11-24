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

from pydantic import BaseModel
from typing import List, Optional


class ImageData(BaseModel):
    """Model for image data with hash identifier.

    Attributes:
        serialized_image: Optional Base64 encoded string of the image content.
        mime_type: MIME type of the image.
    """

    serialized_image: str
    mime_type: str


class ChatRequest(BaseModel):
    """Model for a chat request.

    Attributes:
        text: The text content of the message.
        files: List of image data objects
        session_id: Session identifier for the conversation.
        user_id: User identifier for the conversation.
    """

    text: str
    files: List[ImageData] = []
    session_id: str = "default_session"
    user_id: str = "default_user"


class ReviewItem(BaseModel):
    """Model for a single item in review.
    
    Attributes:
        name: The name of the item.
        price: The price of the item.
        quantity: The quantity of the item.
        category: The category of the item (hsa_eligible, non_hsa_eligible, or unsure_hsa).
    """
    name: str
    price: float
    quantity: int = 1
    category: str  # "hsa_eligible", "non_hsa_eligible", or "unsure_hsa"


class ReceiptReviewRequest(BaseModel):
    """Model for a receipt review request.
    
    Attributes:
        receipt_id: The image ID of the receipt (internal tracking).
        store_name: The name of the store.
        date: The date of purchase.
        hsa_eligible_items: List of HSA eligible items.
        non_hsa_eligible_items: List of non-HSA eligible items.
        unsure_hsa_items: List of items with unsure HSA eligibility.
        payment_card: The payment card type or name.
        card_last_four_digit: The last four digits of the payment card.
        total_cost: The total amount spent.
    """
    receipt_id: str
    store_name: str
    date: str
    hsa_eligible_items: List[ReviewItem]
    non_hsa_eligible_items: List[ReviewItem]
    unsure_hsa_items: List[ReviewItem]
    payment_card: str
    card_last_four_digit: str
    total_cost: float


class ReceiptReviewResponse(BaseModel):
    """Model for a receipt review response.
    
    Attributes:
        receipt_id: The image ID of the receipt.
        approved_hsa_eligible_items: List of approved HSA eligible items to store.
        store_name: The name of the store (from original review request).
        date: The date of purchase (from original review request).
        total_cost: The total amount spent (from original review request).
        payment_card: The payment card type or name (from original review request).
        card_last_four_digit: The last four digits of the payment card (from original review request).
    """
    receipt_id: str
    approved_hsa_eligible_items: List[ReviewItem]
    store_name: str
    date: str
    total_cost: float
    payment_card: str
    card_last_four_digit: str


class ChatResponse(BaseModel):
    """Model for a chat response.

    Attributes:
        response: The text response from the model.
        thinking_process: Optional thinking process of the model.
        attachments: List of image data to be displayed to the user.
        error: Optional error message if something went wrong.
        review_request: Optional review request if human review is needed.
    """

    response: str
    thinking_process: str = ""
    attachments: List[ImageData] = []
    error: Optional[str] = None
    review_request: Optional[ReceiptReviewRequest] = None
