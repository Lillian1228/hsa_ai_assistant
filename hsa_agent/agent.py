# requirements (example)
# pip install google-genai google-adk

import os
import mimetypes
from typing import Dict, Any
from google.genai import types
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService  # or GcsArtifactService for production
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.genai.types import Part, Blob
from google.adk.agents.callback_context import CallbackContext

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
When the user uploads a file, process it using the tool `upload_file_tool`.
Once uploaded, you may extract the store name, date, and the HSA/FSA eligible product names, quantities, and their costs into a structured format.
Also calculate the total cost of the eligible products and append the total cost to the JSON object.
The structured format should be a nested JSON object with the following fields:
- store_name: str
- date: str
- payment_mthod: str
- card_last_4_digits: str
- products: list[dict]
    - product_name: str
    - quantity: int
    - cost: float
- total_cost: float
""",
tools=[FunctionTool(func=upload_file_tool)],
output_key="receipt_analysis",
)

# Wrap the agent in a resumable app - THIS IS THE KEY FOR LONG-RUNNING OPERATIONS!
shipping_app = App(
    name="shipping_coordinator",
    root_agent=shipping_agent,
    resumability_config=ResumabilityConfig(is_resumable=True),
)
# 4) Set up the Runner
runner = Runner(
    agent=file_upload_agent,
    app_name="file_upload_app",
    # session_service=session_service,
    artifact_service=artifact_service
)

# 5) Example of usage
async def run_receipt_analysis(
    file_path: str,
    user_id: str = "user123",
    # session_id: str = "sess001"
):
    """
    Run receipt analysis on an uploaded file.
    
    Args:
        file_path: Path to the file to be analyzed (required)
        user_id: User identifier (default: "user123")
        session_id: Session identifier (default: "sess001")
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

    # Generate unique session ID
    session_id = f"order_{uuid.uuid4().hex[:8]}"

    # Create session
    await session_service.create_session(
        app_name="receipt_parser", user_id="test_user", session_id=session_id
    )

    async for event in runner.run_async(
        user_id=user_id, 
        session_id=session_id,
        new_message=new_message
    ):
        if hasattr(event, 'content') and hasattr(event.content, 'parts'):
            for part in event.content.parts:
                if hasattr(part, 'text') and part.text:
                    print(part.text)
        else:
            print(event)

# If running as script ...
import asyncio
asyncio.run(run_receipt_analysis(file_path="/Users/chenhuizhang/Downloads/receipts/Image_20251116114011_54_29.jpg"))

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

