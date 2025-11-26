import mimetypes
import gradio as gr
import requests
import base64
from typing import List, Dict, Any
from settings import get_settings
from PIL import Image
import io
from schema import ImageData, ChatRequest, ChatResponse, ReceiptReviewRequest, ReceiptReviewResponse, ReviewItem


SETTINGS = get_settings()


def encode_image_to_base64_and_get_mime_type(image_path: str) -> ImageData:
    """Encode a file to base64 string and get MIME type.

    Reads an image file and returns the base64-encoded image data and its MIME type.

    Args:
        image_path: Path to the image file to encode.

    Returns:
        ImageData object containing the base64 encoded image data and its MIME type.
    """
    # Read the image file
    with open(image_path, "rb") as file:
        image_content = file.read()

    # Get the mime type
    mime_type = mimetypes.guess_type(image_path)[0]

    # Base64 encode the image
    base64_data = base64.b64encode(image_content).decode("utf-8")

    # Return as ImageData object
    return ImageData(serialized_image=base64_data, mime_type=mime_type)


def decode_base64_to_image(base64_data: str) -> Image.Image:
    """Decode a base64 string to PIL Image.

    Converts a base64-encoded image string back to a PIL Image object
    that can be displayed or processed further.

    Args:
        base64_data: Base64 encoded string of the image.

    Returns:
        PIL Image object of the decoded image.
    """
    # Decode the base64 string and convert to PIL Image
    image_data = base64.b64decode(base64_data)
    image_buffer = io.BytesIO(image_data)
    image = Image.open(image_buffer)

    return image


def approve_review(
    approved_items_json: str | list | dict,
    receipt_id: str,
    store_name: str,
    date: str,
    total_cost: float,
    payment_card: str,
    card_last_four_digit: str,
) -> tuple[str, str]:
    """Send approval to backend and return response message"""
    try:
        # Parse the JSON string if it's a string, otherwise use as-is
        if isinstance(approved_items_json, str):
            import json
            try:
                approved_items = json.loads(approved_items_json)
            except json.JSONDecodeError as e:
                return f"Error: Invalid JSON format - {str(e)}", ""
        else:
            approved_items = approved_items_json
        
        # Validate that approved_items is a list
        if not isinstance(approved_items, list):
            return "Error: Items must be a JSON array", []
        
        # Convert approved items to ReviewItem objects for all three categories
        # Validate each item has required fields
        approved_hsa_eligible_items = []
        approved_non_hsa_eligible_items = []
        approved_unsure_hsa_items = []
        
        for item in approved_items:
            if not isinstance(item, dict):
                continue
            # Ensure required fields are present
            if "name" not in item or "price" not in item:
                continue
            
            category = item.get("category", "")
            try:
                # Filter out category field when creating ReviewItem (category is not part of ReviewItem schema)
                item_for_review = {k: v for k, v in item.items() if k != "category"}
                review_item = ReviewItem(**item_for_review)
                if category == "hsa_eligible":
                    approved_hsa_eligible_items.append(review_item)
                elif category == "non_hsa_eligible":
                    approved_non_hsa_eligible_items.append(review_item)
                elif category == "unsure_hsa":
                    approved_unsure_hsa_items.append(review_item)
            except Exception as e:
                return f"Error: Invalid item format - {str(e)}", []
        
        review_response = ReceiptReviewResponse(
            receipt_id=receipt_id,
            approved_hsa_eligible_items=approved_hsa_eligible_items,
            approved_non_hsa_eligible_items=approved_non_hsa_eligible_items,
            approved_unsure_hsa_items=approved_unsure_hsa_items,
            store_name=store_name,
            date=date,
            total_cost=total_cost,
            payment_card=payment_card,
            card_last_four_digit=card_last_four_digit,
        )
        
        # Send to backend
        review_url = SETTINGS.BACKEND_URL.replace("/chat", "/review")
        response = requests.post(review_url, json=review_response.model_dump())
        response.raise_for_status()
        
        # Backend now returns JSON with items array, not ChatResponse
        result = response.json()
        if "error" in result:
            return f"Error: {result['error']}", []
        
        # Get the items count from the response
        items = result.get("items", [])
        items_count = len(items)
        hsa_count = len(approved_hsa_eligible_items)
        non_hsa_count = len(approved_non_hsa_eligible_items)
        unsure_count = len(approved_unsure_hsa_items)
        total_count = hsa_count + non_hsa_count + unsure_count
        
        # Return message and items data for table display
        message = f"Receipt stored successfully! All {total_count} item(s) stored in Firestore ({hsa_count} HSA eligible, {non_hsa_count} non-HSA eligible, {unsure_count} unsure). {hsa_count} HSA eligible item(s) stored in SQL database. Total items in SQL database: {items_count}."
        return message, items
    except Exception as e:
        return f"Error approving review: {str(e)}", []


# Global variable to store latest review request (in production, use proper state management)
_latest_review_request = None

def get_response_from_llm_backend(
    message: Dict[str, Any],
    history: List[Dict[str, Any]],
) -> List[str | gr.Image]:
    """Send the message and history to the backend and get a response.

    Args:
        message: Dictionary containing the current message with 'text' and optional 'files' keys.
        history: List of previous message dictionaries in the conversation.

    Returns:
        List containing text response and any image attachments from the backend service.
    """
    # Extract files and convert to base64
    image_data = []
    if uploaded_files := message.get("files", []):
        for file_path in uploaded_files:
            image_data.append(encode_image_to_base64_and_get_mime_type(file_path))

    # Prepare the request payload
    payload = ChatRequest(
        text=message["text"],
        files=image_data,
        session_id="default_session",
        user_id="default_user",
    )

    # Send request to backend
    try:
        response = requests.post(SETTINGS.BACKEND_URL, json=payload.model_dump())
        response.raise_for_status()  # Raise exception for HTTP errors

        result = ChatResponse(**response.json())
        if result.error:
            return [f"Error: {result.error}"]

        chat_responses = []

        if result.thinking_process:
            chat_responses.append(
                gr.ChatMessage(
                    role="assistant",
                    content=result.thinking_process,
                    metadata={"title": "🧠 Thinking Process"},
                )
            )

        # Check if review is needed
        review_request = result.review_request
        
        # Fallback: Try to extract review request from response text if backend didn't extract it
        if not review_request and result.response:
            import json as json_module
            import re as re_module
            # Look for JSON code block in response
            json_match = re_module.search(r"```json\s*(.*?)\s*```", result.response, re_module.DOTALL)
            if json_match:
                try:
                    json_str = json_match.group(1).strip()
                    json_data = json_module.loads(json_str)
                    if isinstance(json_data, dict) and "review_request" in json_data:
                        review_data = json_data["review_request"]
                        # Filter out category field when creating ReviewItem (category is not part of ReviewItem schema)
                        hsa_eligible_items = [
                            ReviewItem(**{k: v for k, v in item.items() if k != "category"}) 
                            for item in review_data.get("hsa_eligible_items", [])
                        ]
                        non_hsa_eligible_items = [
                            ReviewItem(**{k: v for k, v in item.items() if k != "category"}) 
                            for item in review_data.get("non_hsa_eligible_items", [])
                        ]
                        unsure_hsa_items = [
                            ReviewItem(**{k: v for k, v in item.items() if k != "category"}) 
                            for item in review_data.get("unsure_hsa_items", [])
                        ]
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
                        print(f"DEBUG: Extracted review request from response text (fallback)")
                except Exception as e:
                    print(f"DEBUG: Failed to extract review request from response text: {e}")
        
        if review_request:
            print(f"DEBUG: Review request received: receipt_id={review_request.receipt_id}, hsa_eligible={len(review_request.hsa_eligible_items)}, non_hsa_eligible={len(review_request.non_hsa_eligible_items)}, unsure_hsa={len(review_request.unsure_hsa_items)}")
            
            # Store review request globally for the review panel
            global _latest_review_request
            _latest_review_request = review_request
            print(f"DEBUG: Stored review request in global variable")
        
        if review_request:
            # Format review message
            review_text = f"""## 📋 Review Required: Receipt Item HSA Eligibility Categorization

**Store:** {review_request.store_name}  
**Date:** {review_request.date}  
**Total Cost:** ${review_request.total_cost:.2f}  
**Payment Card:** {review_request.payment_card}  
**Card Last 4 Digits:** {review_request.card_last_four_digit}

### ✅ HSA Eligible Items ({len(review_request.hsa_eligible_items)}) - Will be stored:
"""
            for item in review_request.hsa_eligible_items:
                review_text += f"- {item.name}: ${item.price:.2f} x {item.quantity}\n"
            
            if review_request.non_hsa_eligible_items:
                review_text += f"\n### ❌ Non-HSA Eligible Items ({len(review_request.non_hsa_eligible_items)}) - Will NOT be stored:\n"
                for item in review_request.non_hsa_eligible_items:
                    review_text += f"- {item.name}: ${item.price:.2f} x {item.quantity}\n"
            else:
                review_text += "\n### ❌ Non-HSA Eligible Items: None"
            
            if review_request.unsure_hsa_items:
                review_text += f"\n### ❓ Unsure HSA Items ({len(review_request.unsure_hsa_items)}) - Review needed:\n"
                for item in review_request.unsure_hsa_items:
                    review_text += f"- {item.name}: ${item.price:.2f} x {item.quantity}\n"
            else:
                review_text += "\n### ❓ Unsure HSA Items: None"
            
            review_text += "\n\n**⚠️ Please go to the 'Review Receipt' tab and click 'Refresh' to load the review data.**"
            
            chat_responses.append(gr.ChatMessage(role="assistant", content=review_text))
        else:
            # Regular response
            chat_responses.append(gr.ChatMessage(role="assistant", content=result.response))

        if result.attachments:
            for attachment in result.attachments:
                image_data = attachment.serialized_image
                chat_responses.append(gr.Image(decode_base64_to_image(image_data)))

        return chat_responses
    except requests.exceptions.RequestException as e:
        return [f"Error connecting to backend service: {str(e)}"]


if __name__ == "__main__":
    # Store current review request in a global variable (in production, use proper state management)
    current_review_request = gr.State(value=None)
    
    with gr.Blocks(title="Personal Expense Assistant") as demo:
        gr.Markdown("# Personal Expense Assistant")
        gr.Markdown("This assistant can help you to store receipts data, find receipts, and track your expenses during certain period.")
        
        with gr.Tabs() as tabs:
            with gr.Tab("Chat"):
                # Chat interface
                chatbot = gr.ChatInterface(
                    get_response_from_llm_backend,
                    type="messages",
                    multimodal=True,
                    textbox=gr.MultimodalTextbox(file_count="multiple", file_types=["image"]),
                )
            
            with gr.Tab("Review Receipt") as review_tab:
                gr.Markdown("## 📋 Review Receipt Items - HSA Eligibility")
                gr.Markdown("When a receipt requires review, the HSA eligibility categorization will appear here. You can edit items and approve to store only HSA eligible items.")
                
                with gr.Row():
                    refresh_btn = gr.Button("🔄 Refresh / Load Latest Review", variant="secondary")
                
                receipt_info = gr.Markdown(value="No receipt pending review. Click 'Refresh' after uploading a receipt that requires review.")
                
                gr.Markdown("### Edit Items")
                gr.Markdown("""
You can edit the JSON below to modify items:
- **Change category**: Set `"category": "hsa_eligible"`, `"category": "non_hsa_eligible"`, or `"category": "unsure_hsa"` to move items between categories
- **Edit names**: Modify the `"name"` field to correct item names
- **Edit descriptions**: Modify the `"description"` field to add or update product descriptions (useful for abbreviated item names)
- **Edit prices**: Adjust the `"price"` field if needed
- **Edit quantities**: Change the `"quantity"` field
- **Add/Remove items**: You can add new items or remove items from the array

**Note**: Only items with `"category": "hsa_eligible"` will be stored after approval.
""")
                
                all_items_json = gr.Code(
                    label="All Items (edit to modify categorization)",
                    value="[]",
                    language="json",
                    lines=15,
                    interactive=True,
                )
                
                with gr.Row():
                    approve_btn = gr.Button("✅ Approve & Store HSA Eligible Items", variant="primary")
                    cancel_btn = gr.Button("❌ Cancel")
                
                approval_status = gr.Markdown()
                
                gr.Markdown("### Stored Items")
                items_table = gr.HTML(
                    label="All Stored Items",
                    value="<p>No items stored yet. Approve a receipt to see stored items.</p>",
                )
                
                # Hidden state variables
                receipt_id_state = gr.State(value="")
                store_name_state = gr.State(value="")
                date_state = gr.State(value="")
                total_cost_state = gr.State(value=0.0)
                payment_card_state = gr.State(value="")
                card_last_four_digit_state = gr.State(value="")
                review_request_state = gr.State(value=None)
        
        # Function to load latest review request
        def load_latest_review():
            """Load the latest review request from global state"""
            global _latest_review_request
            review_request = _latest_review_request
            
            print(f"DEBUG: load_latest_review called, _latest_review_request = {review_request}")
            
            if review_request is None:
                return (
                    "No receipt pending review. Upload a receipt first, then wait for the agent to request a review.",
                    "[]",  # Return empty JSON array as string
                    "",
                    "",
                    "",
                    0.0,
                    "",
                    "",
                    None,
                    "",
                )
            
            # Combine all items for editing
            all_items = [
                {**item.model_dump(), "category": "hsa_eligible"} 
                for item in review_request.hsa_eligible_items
            ] + [
                {**item.model_dump(), "category": "non_hsa_eligible"} 
                for item in review_request.non_hsa_eligible_items
            ] + [
                {**item.model_dump(), "category": "unsure_hsa"} 
                for item in review_request.unsure_hsa_items
            ]
            
            # Convert to JSON string for the Code component
            import json as json_module
            all_items_json_str = json_module.dumps(all_items, indent=2, ensure_ascii=False)
            
            info_text = f"""
**Store:** {review_request.store_name}  
**Date:** {review_request.date}  
**Total Cost:** ${review_request.total_cost:.2f}  
**Payment Card:** {review_request.payment_card}  
**Card Last 4 Digits:** {review_request.card_last_four_digit}  
**Receipt ID:** {review_request.receipt_id}
"""
            
            return (
                info_text,
                all_items_json_str,  # Return as JSON string
                review_request.receipt_id,
                review_request.store_name,
                review_request.date,
                review_request.total_cost,
                review_request.payment_card,
                review_request.card_last_four_digit,
                review_request,
                "",
            )
        
        refresh_btn.click(
            fn=load_latest_review,
            outputs=[
                receipt_info,
                all_items_json,
                receipt_id_state,
                store_name_state,
                date_state,
                total_cost_state,
                payment_card_state,
                card_last_four_digit_state,
                review_request_state,
                approval_status,
            ],
        )
        
        # Function to handle approval
        def handle_approval(items_json_str, receipt_id, store_name, date, total_cost, payment_card, card_last_four_digit):
            """Handle review approval"""
            if not receipt_id:
                return (
                    gr.update(),  # receipt_info
                    gr.update(),  # all_items_json
                    gr.update(),  # receipt_id_state
                    gr.update(),  # store_name_state
                    gr.update(),  # date_state
                    gr.update(),  # total_cost_state
                    gr.update(),  # payment_card_state
                    gr.update(),  # card_last_four_digit_state
                    gr.update(),  # review_request_state
                    "❌ No receipt to approve.",  # approval_status
                    gr.update(),  # items_table
                )
            
            # Parse JSON string to list/dict
            import json as json_module
            try:
                if isinstance(items_json_str, str):
                    items_json = json_module.loads(items_json_str)
                else:
                    items_json = items_json_str
            except json_module.JSONDecodeError as e:
                return (
                    gr.update(),  # receipt_info
                    gr.update(),  # all_items_json
                    gr.update(),  # receipt_id_state
                    gr.update(),  # store_name_state
                    gr.update(),  # date_state
                    gr.update(),  # total_cost_state
                    gr.update(),  # payment_card_state
                    gr.update(),  # card_last_four_digit_state
                    gr.update(),  # review_request_state
                    f"❌ Invalid JSON format: {str(e)}",  # approval_status
                    gr.update(),  # items_table
                )
            
            message, items_data = approve_review(
                items_json, receipt_id, store_name, date, total_cost, payment_card, card_last_four_digit
            )
            
            # Format items for HTML table display with clickable image URLs
            table_html = ""
            if items_data and isinstance(items_data, list) and len(items_data) > 0:
                # Build HTML table with clickable image links
                table_html = """
                <style>
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    .items-table th, .items-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .items-table th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                    }
                    .items-table tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .image-link {
                        color: #0066cc;
                        text-decoration: none;
                    }
                    .image-link:hover {
                        text-decoration: underline;
                    }
                </style>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Store Name</th>
                            <th>Date</th>
                            <th>Payment Card</th>
                            <th>Card Last 4</th>
                            <th>Image</th>
                        </tr>
                    </thead>
                    <tbody>
                """
                
                for item in items_data:
                    # Convert image_url to clickable format
                    image_url = item.get("image_url", "")
                    image_link_html = ""
                    if image_url:
                        # URL is already in HTTPS format (storage.cloud.google.com)
                        # Just create the clickable link
                        if image_url.startswith("http"):
                            image_link_html = f'<a href="{image_url}" target="_blank" class="image-link">🔗 View</a>'
                        elif image_url.startswith("gs://"):
                            # Fallback: convert gs:// to HTTPS format if needed
                            https_url = image_url.replace("gs://", "https://storage.cloud.google.com/")
                            image_link_html = f'<a href="{https_url}" target="_blank" class="image-link">🔗 View</a>'
                        else:
                            image_link_html = image_url
                    
                    description = item.get("description", "") or ""
                    # If description is empty, show a dash or the name
                    description_display = description if description else "-"
                    
                    payment_card = item.get("payment_card", "") or "-"
                    card_last_four = item.get("card_last_four_digit", "") or "-"
                    
                    table_html += f"""
                        <tr>
                            <td>{item.get("id", "")}</td>
                            <td>{item.get("name", "")}</td>
                            <td>{description_display}</td>
                            <td>${item.get("price", 0):.2f}</td>
                            <td>{item.get("quantity", 1)}</td>
                            <td>{item.get("store_name", "")}</td>
                            <td>{item.get("date", "")}</td>
                            <td>{payment_card}</td>
                            <td>{card_last_four}</td>
                            <td>{image_link_html if image_link_html else "N/A"}</td>
                        </tr>
                    """
                
                table_html += """
                    </tbody>
                </table>
                """
            else:
                table_html = "<p>No items stored yet. Approve a receipt to see stored items.</p>"
            
            if "Error" not in message and "successfully" in message.lower():
                # Clear the review panel on success and show table
                return (
                    "No receipt pending review.",
                    "[]",  # Clear JSON
                    "",
                    "",
                    "",
                    0.0,
                    "",
                    "",
                    None,
                    f"✅ {message}",
                    table_html,  # items_table (HTML)
                )
            return (
                gr.update(),  # receipt_info
                gr.update(),  # all_items_json
                gr.update(),  # receipt_id_state
                gr.update(),  # store_name_state
                gr.update(),  # date_state
                gr.update(),  # total_cost_state
                gr.update(),  # payment_card_state
                gr.update(),  # card_last_four_digit_state
                gr.update(),  # review_request_state
                f"❌ {message}",  # approval_status
                table_html if table_html else gr.update(),  # items_table (HTML)
            )
        
        approve_btn.click(
            fn=handle_approval,
            inputs=[
                all_items_json,
                receipt_id_state,
                store_name_state,
                date_state,
                total_cost_state,
                payment_card_state,
                card_last_four_digit_state,
            ],
            outputs=[
                receipt_info,
                all_items_json,
                receipt_id_state,
                store_name_state,
                date_state,
                total_cost_state,
                payment_card_state,
                card_last_four_digit_state,
                review_request_state,
                approval_status,
                items_table,
            ],
        )
        
        cancel_btn.click(
            fn=lambda: (
                "No receipt pending review.",
                "[]",  # Clear JSON as string
                "",
                "",
                "",
                0.0,
                "",
                "",
                None,
                "Review cancelled.",
                gr.update(),  # items_table - keep existing data
            ),
            outputs=[
                receipt_info,
                all_items_json,
                receipt_id_state,
                store_name_state,
                date_state,
                total_cost_state,
                payment_card_state,
                card_last_four_digit_state,
                review_request_state,
                approval_status,
                items_table,
            ],
        )
        
        # Function to check for review requests and update panel
        # This would need to be called when a review is detected
        # For now, users can manually check the Review Receipt tab after uploading
        
        # Add a helper function that can be called to show review
        def show_review_if_needed():
            """Helper to show review tab - can be enhanced with JavaScript"""
            pass
    
    demo.launch(
        server_name="0.0.0.0",
        server_port=8080,
    )