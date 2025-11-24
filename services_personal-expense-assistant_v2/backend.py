from expense_manager_agent.agent import root_agent as expense_manager_agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.events import Event
from fastapi import FastAPI, Body, Depends
from typing import AsyncIterator, Dict
from types import SimpleNamespace
import uvicorn
from contextlib import asynccontextmanager
from utils import (
    extract_attachment_ids_and_sanitize_response,
    download_image_from_gcs,
    extract_thinking_process,
    format_user_request_to_adk_content_and_store_artifacts,
    get_gcs_image_url,
)
from schema import ImageData, ChatRequest, ChatResponse, ReceiptReviewRequest, ReceiptReviewResponse, ReviewItem
import logger
from google.adk.artifacts import GcsArtifactService
from settings import get_settings
from database import Database
import json
import re

SETTINGS = get_settings()
APP_NAME = "expense_manager_app"


# Application state to hold service contexts
class AppContexts(SimpleNamespace):
    """A class to hold application contexts with attribute access"""

    session_service: InMemorySessionService = None
    artifact_service: GcsArtifactService = None
    expense_manager_agent_runner: Runner = None
    database: Database = None
    # Track image URLs by receipt_id (image_hash_id)
    image_urls: Dict[str, str] = {}


# Initialize application state
app_contexts = AppContexts()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize service contexts during application startup
    app_contexts.session_service = InMemorySessionService()
    app_contexts.artifact_service = GcsArtifactService(
        bucket_name=SETTINGS.STORAGE_BUCKET_NAME
    )
    app_contexts.expense_manager_agent_runner = Runner(
        agent=expense_manager_agent,  # The agent we want to run
        app_name=APP_NAME,  # Associates runs with our app
        session_service=app_contexts.session_service,  # Uses our session manager
        artifact_service=app_contexts.artifact_service,  # Uses our artifact manager
    )
    # Initialize SQL database
    app_contexts.database = Database()
    app_contexts.image_urls = {}

    logger.info("Application started successfully")
    yield
    logger.info("Application shutting down")
    # Perform cleanup during application shutdown if necessary


# Helper function to get application state as a dependency
async def get_app_contexts() -> AppContexts:
    return app_contexts


def extract_review_request_from_response(response_text: str) -> tuple[str, ReceiptReviewRequest | None]:
    """
    Extract review request data from agent response.
    The agent should return structured data in a JSON code block.
    
    Returns:
        tuple[str, ReceiptReviewRequest | None]: Sanitized response and review request if found.
    """
    review_request = None
    sanitized_text = response_text
    
    # Try multiple patterns to find JSON code blocks
    # Pattern 1: Standard JSON code block with ```json - extract everything between markers
    json_block_pattern = r"```json\s*(.*?)\s*```"
    json_match = re.search(json_block_pattern, response_text, re.DOTALL)
    
    # Pattern 2: JSON code block without language specifier
    if not json_match:
        json_block_pattern = r"```\s*(.*?)\s*```"
        json_match = re.search(json_block_pattern, response_text, re.DOTALL)
    
    if json_match:
        json_str = json_match.group(1).strip()
        
        try:
            json_data = json.loads(json_str)
            
            # Check if this is a review request
            if isinstance(json_data, dict) and "review_request" in json_data:
                review_data = json_data["review_request"]
                
                # Validate required fields
                required_fields = ["receipt_id", "store_name", "date", "total_cost", "payment_card", "card_last_four_digit"]
                if not all(key in review_data for key in required_fields):
                    logger.warning("Review request missing required fields", review_data_keys=list(review_data.keys()), required_fields=required_fields)
                    return sanitized_text, None
                
                # Convert to ReviewItem objects
                hsa_eligible_items = []
                non_hsa_eligible_items = []
                unsure_hsa_items = []
                
                try:
                    hsa_eligible_items = [
                        ReviewItem(**item) for item in review_data.get("hsa_eligible_items", [])
                    ]
                    non_hsa_eligible_items = [
                        ReviewItem(**item) for item in review_data.get("non_hsa_eligible_items", [])
                    ]
                    unsure_hsa_items = [
                        ReviewItem(**item) for item in review_data.get("unsure_hsa_items", [])
                    ]
                except Exception as e:
                    logger.error(f"Error creating ReviewItem objects: {e}")
                    return sanitized_text, None
                
                review_request = ReceiptReviewRequest(
                    receipt_id=review_data.get("receipt_id", ""),
                    store_name=review_data.get("store_name", ""),
                    date=review_data.get("date", ""),
                    total_cost=review_data.get("total_cost", 0.0),
                    payment_card=review_data.get("payment_card", ""),
                    card_last_four_digit=review_data.get("card_last_four_digit", ""),
                    hsa_eligible_items=hsa_eligible_items,
                    non_hsa_eligible_items=non_hsa_eligible_items,
                    unsure_hsa_items=unsure_hsa_items,
                )
                
                # Remove the JSON block from the response
                sanitized_text = response_text.replace(json_match.group(0), "").strip()
                logger.info("Successfully extracted review request from JSON")
        
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing review request JSON: {e}", json_snippet=json_str[:200] if json_str else "No JSON string")
        except Exception as e:
            logger.error(f"Unexpected error parsing review request: {e}", exc_info=True)
    else:
        # Log that we couldn't find a JSON block - try to find JSON in the raw text
        logger.debug("No JSON code block found in response for review request extraction")
        # Try to find JSON object directly in the text as a fallback
        try:
            # Look for a JSON object starting with { and containing "review_request"
            start_idx = response_text.find('{"review_request"')
            if start_idx != -1:
                # Find the matching closing brace
                brace_count = 0
                end_idx = start_idx
                for i in range(start_idx, len(response_text)):
                    if response_text[i] == '{':
                        brace_count += 1
                    elif response_text[i] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break
                
                if end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    json_data = json.loads(json_str)
                    if isinstance(json_data, dict) and "review_request" in json_data:
                        review_data = json_data["review_request"]
                        hsa_eligible_items = [ReviewItem(**item) for item in review_data.get("hsa_eligible_items", [])]
                        non_hsa_eligible_items = [ReviewItem(**item) for item in review_data.get("non_hsa_eligible_items", [])]
                        unsure_hsa_items = [ReviewItem(**item) for item in review_data.get("unsure_hsa_items", [])]
                        review_request = ReceiptReviewRequest(
                            receipt_id=review_data.get("receipt_id", ""),
                            store_name=review_data.get("store_name", ""),
                            date=review_data.get("date", ""),
                            total_cost=review_data.get("total_cost", 0.0),
                            payment_card=review_data.get("payment_card", ""),
                            card_last_four_digit=review_data.get("card_last_four_digit", ""),
                            hsa_eligible_items=hsa_eligible_items,
                            non_hsa_eligible_items=non_hsa_eligible_items,
                            unsure_hsa_items=unsure_hsa_items,
                        )
                        sanitized_text = response_text[:start_idx] + response_text[end_idx:].strip()
                        logger.info("Successfully extracted review request from raw JSON text")
        except Exception as e:
            logger.debug(f"Fallback JSON extraction also failed: {e}")
    
    return sanitized_text, review_request


# Create FastAPI app
app = FastAPI(title="Personal Expense Assistant API", lifespan=lifespan)


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest = Body(...),
    app_context: AppContexts = Depends(get_app_contexts),
) -> ChatResponse:
    """Process chat request and get response from the agent"""

    final_response_text = "Agent did not produce a final response."  # Default

    # Use the session ID from the request or default if not provided
    session_id = request.session_id
    user_id = request.user_id
    
    # Track image URLs for uploaded images before processing
    # Calculate hash IDs from uploaded images and store their URLs
    import base64
    import hashlib
    for image_data in request.files:
        image_byte = base64.b64decode(image_data.serialized_image)
        hasher = hashlib.sha256(image_byte)
        image_hash_id = hasher.hexdigest()[:12]
        
        # Construct and store the image URL
        image_url = get_gcs_image_url(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
            image_hash_id=image_hash_id,
        )
        app_context.image_urls[image_hash_id] = image_url
        logger.info(f"Tracked image URL for {image_hash_id}: {image_url}")
    
    # Prepare the user's message in ADK format and store image artifacts
    content = await format_user_request_to_adk_content_and_store_artifacts(
        request=request,
        app_name=APP_NAME,
        artifact_service=app_context.artifact_service,
    )

    # Create session if it doesn't exist
    if not await app_context.session_service.get_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    ):
        await app_context.session_service.create_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )

    try:
        # Process the message with the agent
        # Type annotation: runner.run_async returns an AsyncIterator[Event]
        events_iterator: AsyncIterator[Event] = (
            app_context.expense_manager_agent_runner.run_async(
                user_id=user_id, session_id=session_id, new_message=content
            )
        )
        async for event in events_iterator:  # event has type Event
            # Key Concept: is_final_response() marks the concluding message for the turn
            if event.is_final_response():
                if event.content and event.content.parts:
                    # Extract text from the first part
                    final_response_text = event.content.parts[0].text
                elif event.actions and event.actions.escalate:
                    # Handle potential errors/escalations
                    final_response_text = f"Agent escalated: {event.error_message or 'No specific message.'}"
                break  # Stop processing events once the final response is found

        logger.info(
            "Received final response from agent", raw_final_response=final_response_text[:500]  # Log first 500 chars
        )

        # Extract and process any attachments and thinking process in the response
        base64_attachments = []
        sanitized_text, attachment_ids = extract_attachment_ids_and_sanitize_response(
            final_response_text
        )
        sanitized_text, thinking_process = extract_thinking_process(sanitized_text)
        
        # Extract review request if present - use the original response text before sanitization
        # to ensure we capture the JSON even if it's in the thinking process or attachments section
        sanitized_text, review_request = extract_review_request_from_response(final_response_text)
        
        # If not found in final response, try the sanitized text as fallback
        if not review_request:
            sanitized_text, review_request = extract_review_request_from_response(sanitized_text)
        
        # Log if review request was found or not
        if review_request:
            logger.info(
                "Review request extracted successfully",
                receipt_id=review_request.receipt_id,
                hsa_eligible_items_count=len(review_request.hsa_eligible_items),
                non_hsa_eligible_items_count=len(review_request.non_hsa_eligible_items),
                unsure_hsa_items_count=len(review_request.unsure_hsa_items),
            )
        else:
            logger.warning(
                "No review request found in response",
                response_preview=final_response_text[:200],
                has_json_block="```json" in final_response_text or '{"review_request"' in final_response_text or '"hsa_eligible_items"' in final_response_text,
            )

        # Download images from GCS and replace hash IDs with base64 data
        for image_hash_id in attachment_ids:
            # Download image data and get MIME type
            result = await download_image_from_gcs(
                artifact_service=app_context.artifact_service,
                image_hash=image_hash_id,
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )
            if result:
                base64_data, mime_type = result
                base64_attachments.append(
                    ImageData(serialized_image=base64_data, mime_type=mime_type)
                )

        logger.info(
            "Processed response with attachments",
            sanitized_response=sanitized_text,
            thinking_process=thinking_process,
            attachment_ids=attachment_ids,
            has_review_request=review_request is not None,
        )

        return ChatResponse(
            response=sanitized_text,
            thinking_process=thinking_process,
            attachments=base64_attachments,
            review_request=review_request,
        )

    except Exception as e:
        logger.error("Error processing chat request", error_message=str(e))
        return ChatResponse(
            response="", error=f"Error in generating response: {str(e)}"
        )


@app.post("/review")
async def review(
    review_response: ReceiptReviewResponse = Body(...),
    app_context: AppContexts = Depends(get_app_contexts),
):
    """
    Process receipt review approval and store approved HSA eligible items in SQL database.
    Returns all rows from the database in JSON format.
    """
    try:
        from expense_manager_agent.tools import store_receipt_data
        import datetime as dt
        
        # Convert ReviewItem objects to dicts for store_receipt_data
        purchased_items = [
            {
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
            }
            for item in review_response.approved_hsa_eligible_items
        ]
        
        # Convert date to transaction_time format (ISO format) for database storage
        # If date is already in ISO format, use it; otherwise convert from YYYY-MM-DD
        transaction_time = review_response.date
        try:
            # Try to parse as ISO format first
            dt.datetime.fromisoformat(transaction_time.replace("Z", "+00:00"))
        except ValueError:
            # If not ISO, try to convert from YYYY-MM-DD to ISO format
            try:
                date_obj = dt.datetime.strptime(transaction_time, "%Y-%m-%d")
                transaction_time = date_obj.strftime("%Y-%m-%dT00:00:00.000000Z")
            except ValueError:
                # If parsing fails, use the date as-is and let store_receipt_data validate
                pass
        
        # Store only approved HSA eligible items in Firestore (for backward compatibility)
        # Note: store_receipt_data still uses transaction_time and total_amount for database compatibility
        result = store_receipt_data(
            image_id=review_response.receipt_id,
            store_name=review_response.store_name,
            transaction_time=transaction_time,
            total_amount=review_response.total_cost,
            purchased_items=purchased_items,
            currency="USD",  # Default currency, can be updated if needed
        )
        
        # Get the image URL for the receipt
        # Try to get from tracked URLs first, otherwise construct it
        image_url = app_context.image_urls.get(review_response.receipt_id)
        if not image_url:
            # If not tracked, construct the URL (may need user_id/session_id from context)
            # For now, use a generic structure - in production, you'd want to track these
            image_url = get_gcs_image_url(
                app_name=APP_NAME,
                user_id="default_user",  # In production, get from review context
                session_id="default_session",  # In production, get from review context
                image_hash_id=review_response.receipt_id,
            )
            logger.warning(f"Image URL not found in tracked URLs, constructed: {image_url}")
        
        # Prepare items for SQL insertion with category
        items_for_sql = [
            {
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "category": item.category,
            }
            for item in review_response.approved_hsa_eligible_items
        ]
        
        # Insert approved items into SQL database
        app_context.database.insert_approved_items(
            items=items_for_sql,
            store_name=review_response.store_name,
            date=review_response.date,
            image_url=image_url,
        )
        
        logger.info(
            "Receipt review approved and stored",
            receipt_id=review_response.receipt_id,
            hsa_eligible_items_count=len(purchased_items),
            image_url=image_url,
        )
        
        # Get all rows from the database and return as JSON
        all_items = app_context.database.get_all_items()
        
        return {"items": all_items}
        
    except Exception as e:
        logger.error("Error processing review", error_message=str(e))
        return {"error": f"Error processing review: {str(e)}", "items": []}


# Only run the server if this file is executed directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081)