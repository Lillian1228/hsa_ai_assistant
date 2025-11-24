# expense_manager_agent/tools.py

import datetime
from typing import Dict, List, Any
from google.cloud import firestore
from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1 import FieldFilter
from google.cloud.firestore_v1.base_query import And
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
from settings import get_settings
from google import genai

SETTINGS = get_settings()
DB_CLIENT = firestore.Client(
    project=SETTINGS.GCLOUD_PROJECT_ID
)  # Will use "(default)" database
COLLECTION = DB_CLIENT.collection(SETTINGS.DB_COLLECTION_NAME)
GENAI_CLIENT = genai.Client(
    vertexai=True, location=SETTINGS.GCLOUD_LOCATION, project=SETTINGS.GCLOUD_PROJECT_ID
)
EMBEDDING_DIMENSION = 768
EMBEDDING_FIELD_NAME = "embedding"
INVALID_ITEMS_FORMAT_ERR = """
Invalid items format. Must be a list of dictionaries with 'name', 'price', and 'quantity' keys."""
RECEIPT_DESC_FORMAT = """
Store Name: {store_name}
Transaction Time: {transaction_time}
Total Amount: {total_amount}
Currency: {currency}
Purchased Items:
{purchased_items}
Receipt Image ID: {receipt_id}
"""


def sanitize_image_id(image_id: str) -> str:
    """Sanitize image ID by removing any leading/trailing whitespace."""
    if image_id.startswith("[IMAGE-"):
        image_id = image_id.split("ID ")[1].split("]")[0]

    return image_id.strip()


def request_receipt_review(
    image_id: str,
    store_name: str,
    date: str,
    total_cost: float,
    hsa_eligible_items: List[Dict[str, Any]],
    non_hsa_eligible_items: List[Dict[str, Any]],
    unsure_hsa_items: List[Dict[str, Any]],
    payment_card: str,
    card_last_four_digit: str,
) -> str:
    """
    Request human review for receipt item categorization by HSA eligibility.
    
    **MANDATORY**: This tool MUST be called for EVERY receipt that needs to be stored.
    Human review is required for ALL receipt storage operations - there are NO exceptions.
    
    After calling this tool, the agent MUST return the review data in JSON format
    in the FINAL RESPONSE section for the backend to process.
    
    The `store_receipt_data` tool should NEVER be called directly by the agent.
    It is only called by the system after human approval through the review endpoint.

    Args:
        image_id (str): The unique identifier of the image.
        store_name (str): The name of the store.
        date (str): The date of purchase (can be in format "YYYY-MM-DD" or ISO format).
        total_cost (float): The total amount spent.
        hsa_eligible_items (List[Dict[str, Any]]): A list of HSA eligible items. Each item must have:
            - name (str): The name of the item.
            - price (float): The price of the item.
            - quantity (int, optional): The quantity of the item. Defaults to 1 if not provided.
            - category (str): Should be "hsa_eligible".
        non_hsa_eligible_items (List[Dict[str, Any]]): A list of non-HSA eligible items. Each item must have:
            - name (str): The name of the item.
            - price (float): The price of the item.
            - quantity (int, optional): The quantity of the item. Defaults to 1 if not provided.
            - category (str): Should be "non_hsa_eligible".
        unsure_hsa_items (List[Dict[str, Any]]): A list of items with unsure HSA eligibility. Each item must have:
            - name (str): The name of the item.
            - price (float): The price of the item.
            - quantity (int, optional): The quantity of the item. Defaults to 1 if not provided.
            - category (str): Should be "unsure_hsa".
        payment_card (str): The payment card type or name (e.g., "Visa", "Mastercard", "American Express").
        card_last_four_digit (str): The last four digits of the payment card.

    Returns:
        str: A message indicating that review has been requested. The agent should then
             return the review data in JSON format in the FINAL RESPONSE section.
    """
    try:
        image_id = sanitize_image_id(image_id)
        
        # Validate date (accept various formats)
        if not isinstance(date, str):
            raise ValueError("Invalid date: must be a string")
        
        # Try to parse date in common formats
        date_valid = False
        for date_format in ["%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S.%fZ"]:
            try:
                datetime.datetime.strptime(date.replace("Z", ""), date_format.replace("Z", ""))
                date_valid = True
                break
            except ValueError:
                continue
        
        if not date_valid:
            # If parsing fails, just check it's not empty
            if not date.strip():
                raise ValueError("Date cannot be empty")

        # Validate items format
        for item_list, item_type in [
            (hsa_eligible_items, "hsa_eligible"), 
            (non_hsa_eligible_items, "non_hsa_eligible"),
            (unsure_hsa_items, "unsure_hsa")
        ]:
            if not isinstance(item_list, list):
                raise ValueError(f"Invalid {item_type} items format. Must be a list.")
            
            for item in item_list:
                if (
                    not isinstance(item, dict)
                    or "name" not in item
                    or "price" not in item
                ):
                    raise ValueError(
                        f"Invalid {item_type} item format. Each item must have 'name' and 'price' keys."
                    )
                if "quantity" not in item:
                    item["quantity"] = 1
                if "category" not in item:
                    item["category"] = item_type

        # Validate payment card fields
        if not isinstance(payment_card, str):
            raise ValueError("payment_card must be a string")
        if not isinstance(card_last_four_digit, str):
            raise ValueError("card_last_four_digit must be a string")
        if card_last_four_digit and not card_last_four_digit.isdigit():
            raise ValueError("card_last_four_digit must contain only digits")
        if card_last_four_digit and len(card_last_four_digit) != 4:
            raise ValueError("card_last_four_digit must be exactly 4 digits")
        
        # Return a message with the JSON data embedded for easy extraction
        # The agent should include this JSON in the FINAL RESPONSE section
        import json as json_module
        
        review_data = {
            "review_request": {
                "receipt_id": image_id,
                "store_name": store_name,
                "date": date,
                "total_cost": total_cost,
                "hsa_eligible_items": hsa_eligible_items,
                "non_hsa_eligible_items": non_hsa_eligible_items,
                "unsure_hsa_items": unsure_hsa_items,
                "payment_card": payment_card,
                "card_last_four_digit": card_last_four_digit,
            }
        }
        
        json_str = json_module.dumps(review_data, indent=2)
        
        return f"""Review requested for receipt {image_id}. 

IMPORTANT: You MUST include the following JSON in your FINAL RESPONSE section:

```json
{json_str}
```

This JSON must be included exactly as shown above in a JSON code block."""

    except Exception as e:
        raise Exception(f"Failed to request receipt review: {str(e)}")


def store_receipt_data(
    image_id: str,
    store_name: str,
    transaction_time: str,
    total_amount: float,
    purchased_items: List[Dict[str, Any]],
    currency: str = "IDR",
) -> str:
    """
    Store receipt data in the database. 
    
    **IMPORTANT**: This function should ONLY be called by the backend review endpoint
    after human review and approval. It should NEVER be called directly by the agent.
    
    Only HSA eligible items will be stored. This function is called automatically after
    the user approves the receipt review in the frontend.

    Args:
        image_id (str): The unique identifier of the image. For example IMAGE-POSITION 0-ID 12345,
            the ID of the image is 12345.
        store_name (str): The name of the store.
        transaction_time (str): The time of purchase, in ISO format ("YYYY-MM-DDTHH:MM:SS.ssssssZ").
        total_amount (float): The total amount spent.
        purchased_items (List[Dict[str, Any]]): A list of HSA ELIGIBLE items only with their prices. Each item must have:
            - name (str): The name of the item.
            - price (float): The price of the item.
            - quantity (int, optional): The quantity of the item. Defaults to 1 if not provided.
        currency (str, optional): The currency of the transaction, can be derived from the store location.
            If unsure, default is "IDR".

    Returns:
        str: A success message with the receipt ID.

    Raises:
        Exception: If the operation failed or input is invalid.
    """
    try:
        # In case of it provide full image placeholder, extract the id string
        image_id = sanitize_image_id(image_id)

        # Check if the receipt already exists
        doc = get_receipt_data_by_image_id(image_id)

        if doc:
            return f"Receipt with ID {image_id} already exists"

        # Validate transaction time
        if not isinstance(transaction_time, str):
            raise ValueError(
                "Invalid transaction time: must be a string in ISO format 'YYYY-MM-DDTHH:MM:SS.ssssssZ'"
            )
        try:
            datetime.datetime.fromisoformat(transaction_time.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError(
                "Invalid transaction time format. Must be in ISO format 'YYYY-MM-DDTHH:MM:SS.ssssssZ'"
            )

        # Validate items format
        if not isinstance(purchased_items, list):
            raise ValueError(INVALID_ITEMS_FORMAT_ERR)

        for _item in purchased_items:
            if (
                not isinstance(_item, dict)
                or "name" not in _item
                or "price" not in _item
            ):
                raise ValueError(INVALID_ITEMS_FORMAT_ERR)

            if "quantity" not in _item:
                _item["quantity"] = 1

        # Create a combined text from all receipt information for better embedding
        result = GENAI_CLIENT.models.embed_content(
            model="text-embedding-004",
            contents=RECEIPT_DESC_FORMAT.format(
                store_name=store_name,
                transaction_time=transaction_time,
                total_amount=total_amount,
                currency=currency,
                purchased_items=purchased_items,
                receipt_id=image_id,
            ),
        )

        embedding = result.embeddings[0].values

        doc = {
            "receipt_id": image_id,
            "store_name": store_name,
            "transaction_time": transaction_time,
            "total_amount": total_amount,
            "currency": currency,
            "purchased_items": purchased_items,
            EMBEDDING_FIELD_NAME: Vector(embedding),
        }

        COLLECTION.add(doc)

        return f"Receipt stored successfully with ID: {image_id} (only HSA eligible items stored)"
    except Exception as e:
        raise Exception(f"Failed to store receipt: {str(e)}")


def search_receipts_by_metadata_filter(
    start_time: str,
    end_time: str,
    min_total_amount: float = -1.0,
    max_total_amount: float = -1.0,
) -> str:
    """
    Filter receipts by metadata within a specific time range and optionally by amount.

    Args:
        start_time (str): The start datetime for the filter (in ISO format, e.g. 'YYYY-MM-DDTHH:MM:SS.ssssssZ').
        end_time (str): The end datetime for the filter (in ISO format, e.g. 'YYYY-MM-DDTHH:MM:SS.ssssssZ').
        min_total_amount (float): The minimum total amount for the filter (inclusive). Defaults to -1.
        max_total_amount (float): The maximum total amount for the filter (inclusive). Defaults to -1.

    Returns:
        str: A string containing the list of receipt data matching all applied filters.

    Raises:
        Exception: If the search failed or input is invalid.
    """
    try:
        # Validate start and end times
        if not isinstance(start_time, str) or not isinstance(end_time, str):
            raise ValueError("start_time and end_time must be strings in ISO format")
        try:
            datetime.datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            datetime.datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("start_time and end_time must be strings in ISO format")

        # Start with the base collection reference
        query = COLLECTION

        # Build the composite query by properly chaining conditions
        # Notes that this demo assume 1 user only,
        # need to refactor the query for multiple user
        filters = [
            FieldFilter("transaction_time", ">=", start_time),
            FieldFilter("transaction_time", "<=", end_time),
        ]

        # Add optional filters
        if min_total_amount != -1:
            filters.append(FieldFilter("total_amount", ">=", min_total_amount))

        if max_total_amount != -1:
            filters.append(FieldFilter("total_amount", "<=", max_total_amount))

        # Apply the filters
        composite_filter = And(filters=filters)
        query = query.where(filter=composite_filter)

        # Execute the query and collect results
        search_result_description = "Search by Metadata Results:\n"
        for doc in query.stream():
            data = doc.to_dict()
            data.pop(
                EMBEDDING_FIELD_NAME, None
            )  # Remove embedding as it's not needed for display

            search_result_description += f"\n{RECEIPT_DESC_FORMAT.format(**data)}"

        return search_result_description
    except Exception as e:
        raise Exception(f"Error filtering receipts: {str(e)}")


def search_relevant_receipts_by_natural_language_query(
    query_text: str, limit: int = 5
) -> str:
    """
    Search for receipts with content most similar to the query using vector search.
    This tool can be use for user query that is difficult to translate into metadata filters.
    Such as store name or item name which sensitive to string matching.
    Use this tool if you cannot utilize the search by metadata filter tool.

    Args:
        query_text (str): The search text (e.g., "coffee", "dinner", "groceries").
        limit (int, optional): Maximum number of results to return (default: 5).

    Returns:
        str: A string containing the list of contextually relevant receipt data.

    Raises:
        Exception: If the search failed or input is invalid.
    """
    try:
        # Generate embedding for the query text
        result = GENAI_CLIENT.models.embed_content(
            model="text-embedding-004", contents=query_text
        )
        query_embedding = result.embeddings[0].values

        # Notes that this demo assume 1 user only,
        # need to refactor the query for multiple user
        vector_query = COLLECTION.find_nearest(
            vector_field=EMBEDDING_FIELD_NAME,
            query_vector=Vector(query_embedding),
            distance_measure=DistanceMeasure.EUCLIDEAN,
            limit=limit,
        )

        # Execute the query and collect results
        search_result_description = "Search by Contextual Relevance Results:\n"
        for doc in vector_query.stream():
            data = doc.to_dict()
            data.pop(
                EMBEDDING_FIELD_NAME, None
            )  # Remove embedding as it's not needed for display
            search_result_description += f"\n{RECEIPT_DESC_FORMAT.format(**data)}"

        return search_result_description
    except Exception as e:
        raise Exception(f"Error searching receipts: {str(e)}")


def get_receipt_data_by_image_id(image_id: str) -> Dict[str, Any]:
    """
    Retrieve receipt data from the database using the image_id.

    Args:
        image_id (str): The unique identifier of the receipt image. For example, if the placeholder is
            [IMAGE-ID 12345], the ID to use is 12345.

    Returns:
        Dict[str, Any]: A dictionary containing the receipt data with the following keys:
            - receipt_id (str): The unique identifier of the receipt image.
            - store_name (str): The name of the store.
            - transaction_time (str): The time of purchase in UTC.
            - total_amount (float): The total amount spent.
            - currency (str): The currency of the transaction.
            - purchased_items (List[Dict[str, Any]]): List of items purchased with their details.
        Returns an empty dictionary if no receipt is found.
    """
    # In case of it provide full image placeholder, extract the id string
    image_id = sanitize_image_id(image_id)

    # Query the receipts collection for documents with matching receipt_id (image_id)
    # Notes that this demo assume 1 user only,
    # need to refactor the query for multiple user
    query = COLLECTION.where(filter=FieldFilter("receipt_id", "==", image_id)).limit(1)
    docs = list(query.stream())

    if not docs:
        return {}

    # Get the first matching document
    doc_data = docs[0].to_dict()
    doc_data.pop(EMBEDDING_FIELD_NAME, None)

    return doc_data