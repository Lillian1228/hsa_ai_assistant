# requirements (example)
# pip install google-genai google-adk

import os
import mimetypes
import json
import re
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from google.genai import types
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService  # or GcsArtifactService for production
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.genai.types import Part, Blob
from google.adk.agents.callback_context import CallbackContext
from google.adk.apps.app import App, ResumabilityConfig

# Load environment variables (including API keys)
load_dotenv()

# Set Google AI API key from environment variable
# The google-genai library automatically reads GOOGLE_API_KEY or GEMINI_API_KEY
api_key = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError(
        "Missing GOOGLE_API_KEY or GEMINI_API_KEY environment variable. "
        "Please set it in your .env file or environment. "
        "Get your API key from: https://aistudio.google.com/apikey"
    )

# Set the API key as an environment variable for google-genai to use
os.environ['GOOGLE_API_KEY'] = api_key

# 1) Configure sessions + artifacts
session_service = InMemorySessionService()
artifact_service = InMemoryArtifactService()  
# (For production, you could use GcsArtifactService(bucket_name="your-bucket") ) :contentReference[oaicite:3]{index=3}

# 2) Define the upload-file tool
async def upload_file_tool(
    file_path: str,
    tool_context: CallbackContext
) -> Dict[str, Any]:
    """Reads a local file, saves it as an artifact, and returns the name for use."""
    # infer MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"
    # read bytes
    with open(file_path, "rb") as f:
        data = f.read()
    # create Part
    artifact_part = Part(inline_data=Blob(data=data, mime_type=mime_type))
    # save it
    version = await tool_context.save_artifact(filename=os.path.basename(file_path),
                                               artifact=artifact_part)
    return {
        "status": "success",
        "artifact_filename": os.path.basename(file_path),
        "version": version,
        "mime_type": mime_type
    }

# 3) Define the agent
file_upload_agent = LlmAgent(   
    model="gemini-2.5-flash",  # your choice
    name="file_upload_agent",
    description="Agent that can receive PNG/JPEG/PDF uploads and extract the content.",
    instruction="""
You are an assistant that helps the user extract the HSA/FSA related expenses from files they upload (images or documents).
When the user uploads a file, process it using the tool `upload_file_tool`. Once uploaded, follow the steps below:
Step 1: extract the store name, date, payment card name, card last 4 digits, and the product names, quantities, and their costs into a structured format. 
If there is no purchases found, skip the rest of the steps and return NULL.
The structured format should be a nested JSON object with the following fields:
- store_name: str
- date: str
- payment_method: str
- card_last_4_digits: str
- products: list[dict]
    - product_name: str
    - quantity: int
    - cost: float
Step 2: Evaluate if the products are HSA/FSA eligible and assign their eligibility flag 'Y/N' as well as their HSA/FSA eligibile category to each product, and attach a short eligibility category.
Append the eligiblity flag and category of each product to prior json output.
Step 3: Calculate the total cost of the eligible products if any and append the total cost to the JSON object. Leave the total cost as 0 if no eligible products.
Final structure of the JSON output should have the follow fields:
- store_name: str
- date: str
- payment_card: str
- card_last_4_digits: str
- products: list[dict]
    - product_name: str
    - quantity: int
    - cost: float
    - eligible: str
    - category: str
- total_cost: float
IMPORTANT: Your final response must be ONLY a valid JSON object, no additional text or explanation. Return the JSON directly without markdown code blocks.
""",
tools=[FunctionTool(func=upload_file_tool)],
output_key="receipt_analysis",
)

# Wrap the agent in a resumable app - THIS IS THE KEY FOR LONG-RUNNING OPERATIONS!
receipt_parser_app = App(
    name="receipt_parser",
    root_agent=file_upload_agent,
    resumability_config=ResumabilityConfig(is_resumable=False),
)
# 4) Set up the Runner
runner = Runner(
    agent=file_upload_agent,
    app_name="receipt_parser",
    session_service=session_service,
    artifact_service=artifact_service
)

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract JSON object from text, handling markdown code blocks and extra text.
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Parsed JSON as dict, or None if no valid JSON found
    """
    if not text:
        return None
    
    # Try to find JSON in markdown code blocks first
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find JSON object directly
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try the whole text
            json_str = text.strip()
    
    try:
        # Remove any leading/trailing whitespace
        json_str = json_str.strip()
        # Parse JSON
        return json.loads(json_str)
    except json.JSONDecodeError:
        # If direct parsing fails, try to extract just the JSON part
        try:
            # Find the first { and last } to extract JSON
            start = json_str.find('{')
            end = json_str.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(json_str[start:end])
        except json.JSONDecodeError:
            pass
    return None

# 5) Example of usage
async def run_receipt_analysis(
    file_path: str,
    user_id: str = "test_user",
    session_id: Optional[str] = None,
    return_json: bool = True
) -> Optional[Dict[str, Any]]:
    """
    Run receipt analysis on an uploaded file.
    
    Args:
        file_path: Path to the file to be analyzed (required)
        user_id: User identifier (default: "test_user")
        session_id: Session identifier (auto-generated if None)
        return_json: If True, return parsed JSON dict; if False, print output
        
    Returns:
        Parsed JSON dict if return_json=True, None otherwise
    """
    # Send a message about the file upload - the agent will automatically:
    # 1. Process the upload using upload_file_tool
    # 2. Extract HSA/FSA expenses from the uploaded document
    # Based on the agent's instructions, it handles both steps automatically
    user_msg = f"Please upload and analyze the receipt at {file_path}"
    new_message = types.Content(
        role="user",
        parts=[types.Part(text=user_msg)]
    )

    # Generate unique session ID if not provided
    if session_id is None:
        session_id = "sess001"

    # Create session
    await session_service.create_session(
        app_name="receipt_parser", user_id=user_id, session_id=session_id
    )

    # Collect all text responses
    all_text = []
    structured_output = None

    async for event in runner.run_async(
        user_id=user_id, 
        session_id=session_id,
        new_message=new_message
    ):
        if hasattr(event, 'content') and hasattr(event.content, 'parts'):
            for part in event.content.parts:
                # 1. If it's plain text
                if hasattr(part, "text") and part.text:
                    text_content = part.text
                    all_text.append(text_content)
                    if return_json:
                        # Try to extract JSON from this text
                        parsed_json = extract_json_from_text(text_content)
                        if parsed_json:
                            structured_output = parsed_json
                    else:
                        print("Text:", text_content)

                # 2. If it's a function call / tool invocation
                if hasattr(part, "function_call") and part.function_call:
                    func = part.function_call
                    if not return_json:
                        print("Function call requested:")
                        print("  name:", func.name)
                        print("  args dict:", func.args)

                # 3. If it's a function response
                if hasattr(part, "function_response") and part.function_response:
                    resp = part.function_response
                    if not return_json:
                        print("Function response received:")
                        print("  name:", resp.name)
                        print("  response dict:", resp.response)
        else:
            if not return_json:
                print(event)
    
    # If we didn't find JSON in individual parts, try the full text
    if return_json and structured_output is None and all_text:
        full_text = "\n".join(all_text)
        structured_output = extract_json_from_text(full_text)
    
    if return_json:
        return structured_output
    return None

# If running as script ...
async def main():
    file_path = "/Users/chenhuizhang/Downloads/receipts/Image_20251116114011_54_29.jpg"
    
    # Get structured JSON output
    result = await run_receipt_analysis(
        file_path=file_path,
        return_json=False
    )
    
    if result:
        print("\n" + "="*50)
        print("STRUCTURED JSON OUTPUT:")
        print("="*50)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*50)
        
        # Access individual fields
        print(f"\nStore: {result.get('store_name', 'N/A')}")
        print(f"Date: {result.get('date', 'N/A')}")
        print(f"Total Cost: ${result.get('total_cost', 0):.2f}")
        print(f"Number of Products: {len(result.get('products', []))}")
    else:
        print("No structured JSON output found. Run with return_json=False to see raw output.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

# Mock tool implementation
# def get_current_time(city: str) -> dict:
#     """Returns the current time in a specified city."""
#     return {"status": "success", "city": city, "time": "10:30 AM"}

# root_agent = Agent(
#     model='gemini-2.5-flash',
#     name='root_agent',
#     description="Tells the current time in a specified city.",
#     instruction="You are a helpful assistant that tells the current time in cities. Use the 'get_current_time' tool for this purpose.",
#     tools=[get_current_time],
# )

