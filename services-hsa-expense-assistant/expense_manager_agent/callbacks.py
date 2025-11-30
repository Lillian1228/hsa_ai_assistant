# expense_manager_agent/callbacks.py

import hashlib
from google.genai import types
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from typing import Optional

def modify_image_data_in_history(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> None:
    # The following code will modify the request sent to LLM
    # We will only keep image data in the last 3 user messages using a reverse and counter approach

    # Count how many user messages we've processed
    user_message_count = 0

    # Process the reversed list
    for content in reversed(llm_request.contents):
        # Only count for user manual query, not function call
        if (content.role == "user") and (content.parts[0].function_response is None):
            user_message_count += 1
            modified_content_parts = []

            # Check any missing image ID placeholder for any image data
            # Then remove image data from conversation history if more than 3 user messages
            for idx, part in enumerate(content.parts):
                if part.inline_data is None:
                    modified_content_parts.append(part)
                    continue

                if (
                    (idx + 1 >= len(content.parts))
                    or (content.parts[idx + 1].text is None)
                    or (not content.parts[idx + 1].text.startswith("[IMAGE-ID "))
                ):
                    # Generate hash ID for the image and add a placeholder
                    image_data = part.inline_data.data
                    hasher = hashlib.sha256(image_data)
                    image_hash_id = hasher.hexdigest()[:12]
                    placeholder = f"[IMAGE-ID {image_hash_id}]"

                    # Only keep image data in the last 3 user messages
                    if user_message_count <= 3:
                        modified_content_parts.append(part)

                    modified_content_parts.append(types.Part(text=placeholder))

                else:
                    # Only keep image data in the last 3 user messages
                    if user_message_count <= 3:
                        modified_content_parts.append(part)

            # This will modify the contents inside the llm_request
            content.parts = modified_content_parts


# --- Core Citation Injection Function ---
# def inject_inline_citations(response):
#     """
#     Inserts inline citations (e.g., [1](url)) into the text of a single response.
#     This function must be called on the response that *received* the grounding metadata.
#     """
#     if not response or not response.candidates or not response.candidates[0].grounding_metadata:
#         return response.text if response.text else ""

#     candidate = response.candidates[0]
#     text = candidate.content.parts[0].text
#     metadata = candidate.grounding_metadata

#     chunks = metadata.grounding_chunks
#     supports = metadata.grounding_supports
    
#     # Sort supports by end_index descending to prevent index shifting during insertion
#     sorted_supports = sorted(
#         supports, 
#         key=lambda x: x.segment.end_index, 
#         reverse=True
#     )

#     full_text = text
    
#     for support in sorted_supports:
#         end_index = support.segment.end_index
#         citation_str = ""
#         # Group all chunks for this segment into a single citation string
#         for index in support.grounding_chunk_indices:
#             # Citation index is 1-based, chunk index is 0-based
#             url = chunks[index].web.uri
#             citation_str += f" [[{index + 1}]({url})]"
            
#         # Insert the markdown link into the text
#         full_text = full_text[:end_index] + citation_str + full_text[end_index:]

#     return full_text

# --- 1. The Logic to Form the Citation String ---
def inject_citations_logic(text: str, metadata) -> str:
    """
    Parses grounding metadata and inserts markdown citations (e.g. [[1](url)]) 
    into the text at the correct indices.
    """
    if not metadata or not metadata.grounding_chunks or not metadata.grounding_supports:
        return text

    chunks = metadata.grounding_chunks
    supports = metadata.grounding_supports
    
    # Sort supports in reverse order (end_index desc) so we don't mess up 
    # indices as we modify the string from the end backwards.
    sorted_supports = sorted(
        supports, 
        key=lambda x: x.segment.end_index, 
        reverse=True
    )

    full_text = text
    
    for support in sorted_supports:
        end_index = support.segment.end_index
        citation_str = ""
        
        # A single support segment might cite multiple sources
        for index in support.grounding_chunk_indices:
            # chunk index is 0-based; typically displayed as 1-based
            url = chunks[index].web.uri
            # Create a Markdown link: [[1](https://google.com)]
            citation_str += f" [[{index + 1}]({url})]"
            
        # Insert the citation string into the text
        full_text = full_text[:end_index] + citation_str + full_text[end_index:]
        
    return full_text


# --- 2. The Robust Callback Function ---
def add_inline_citations_callback(callback_context: CallbackContext) -> Optional[types.Content]:
    """
    Retrieves the last agent response from the session history, checks for 
    grounding metadata, and returns a modified Content object with citations.
    """
    # Access the stable session object
    session = callback_context.session
    
    # Safety check
    if not session or not session.events:
        return None

    # Iterate backwards through history to find the last 'model' event with content
    # This bypasses the need to know the exact current attribute name (response/output/etc.)
    target_event = None
    for event in reversed(session.events):
        if event.content and event.content.parts:
            # We found the last text message. 
            target_event = event
            break
    
    if not target_event:
        return None
    print("Target event content avaiable.")
    # Extract text and metadata from the found event
    original_text = target_event.content.parts[0].text
    metadata = None

    # Robust metadata lookup: It might be on the event or deeply nested
    if hasattr(target_event, 'grounding_metadata'):
        metadata = target_event.grounding_metadata
    elif hasattr(target_event.content, 'grounding_metadata'):
        metadata = target_event.content.grounding_metadata
    
    # If we didn't find metadata, checking the candidates (standard GenAI structure)
    if not metadata and hasattr(target_event, 'candidates'):
         if target_event.candidates and target_event.candidates[0].grounding_metadata:
             metadata = target_event.candidates[0].grounding_metadata
             

    if not metadata:
        # No search happened, or no grounding info returned
        print("No grounding metadata found.")
        return None
    print("Grounding metadata avaiable.")
    # print(metadata)
    # print(original_text)
    # Inject the citations
    cited_text = inject_citations_logic(original_text, metadata)
    print(cited_text)
    # Return the REPLACEMENT content
    # This tells the ADK to swap the original text with your new cited text
    return types.Content(
        role=target_event.content.role,
        parts=[types.Part(text=cited_text)]
    )