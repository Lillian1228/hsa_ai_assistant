# HSA AI Assistant

The link to our deployed HSA AI Assistant: https://hsa-ai-assistant-frontend-111362542486.us-central1.run.app/

# Problem

Many Health Savings Account (HSA) users struggle to keep track of receipts and confirm which medical expenses actually qualify. Unlike FSAs, HSAs don’t block ineligible purchases, which means it’s entirely on the account holder to document every expense and prove eligibility if the IRS ever asks. Losing a receipt or forgetting what something was for can lead to taxes and a 20% penalty—an anxiety most people don’t think about until it’s too late. In reality, many of us toss paper receipts in a drawer, let them fade in our wallets, or try to stay organized with half-finished spreadsheets and scattered Google Drive folders.

As HSAs grow—over $137 billion spread across 38 million accounts—more people are running into these exact problems. Online forums are filled with users trading improvised tracking hacks and asking for better tools. It’s clear that people want a simpler, smarter way to store receipts, check eligibility, and protect their tax advantages.

# Agentic Solution


Existing solutions that aim to simplify HSA/FSA expense tracking include HSA Store’s ExpenseTracker, Silver, TrackHSA.com etc. and none have perfectly solved the need. One might scan receipts but not handle web search for obscure items, another might auto-connect purchases but lacks conversational queries, etc. This project aims to combine and improve these capabilities into a single intelligent agentic system.

We focus on minimizing user effort: automating data entry, leveraging AI for decisions, but keeping the user in control for verification. The agent should feel like a helpful personal accountant for healthcare spending – always available to log a purchase or answer a question about your HSA.

Below outlines how a typical interaction would work:

1. **Capture or Upload Receipt:** The user inputs a receipt – this could be a photo, a scanned image, or a e-receipt screenshot from website.

![page1](images/page1.png)

2. **OCR and Data Extraction**: The agent uses a multimodal LLM such as Gemini 2.5 as its core to extract text from the receipt image. Key fields like date, provider/merchant name, line-item descriptions, and discounts, and final amounts are identified. It also estimates the product name (e.g., “RX” inferred as "Prescription") based on the product abbreviation on a receipt.

3. **HSA Eligibility Check**: For each expense item, the agent evaluates its HSA eligibility using its internal knowledge and web search tool. It can annotate the receipt data with preliminary decisions (e.g., marking each line as “HSA-eligible”, “not eligible”, "unsure"). This information is then presented to the user through the frontend UI for review. The user can then correct any mistakes (e.g., if the AI misread something or if a borderline item needs user judgment).

![page2](images/page2.png)

5. **Record Storage and Organization**: Once confirmed, the expense record is saved to our structured DB and the receipt embedding goes to our NoSQL Document DB, both hosted on Google Cloud Services. HSA-eligible expenses and their proofs are organized for future access. Each record includes details like date, merchant, amount, category, eligibility status, and the associated receipt image or file.

6. **Expense Tracking and Management**: The user can view a summary log of all HSA eligible expenses recorded with filtering or sorting (e.g., by year, by category, by provider) buttons to help users review their spending.


7. **Chat Interface**: Users can ask questions in plain English via a chat interface and the agent will interpret and answer based on the stored data and web search. i.e. “How much have I spent on vision care this year?”, “List all eligible expenses over $100”. The agent will parse the query, retrieve relevant data and respond conversationally. 

![page3](images/page3.png)


# Architecture

![eg](images/overview.png)

## Frontend: User Interactions

The frontend facilitates four key user interactions. Below is the flow of data between the user and the API.

### 1. Chat & Query
*   **User Action**: User types a message (e.g., "Analyze this receipt") or uploads a file in the chat interface.
*   **API Request (`POST /chat`)**:
    *   **Input**: `{ text: string, files: Base64[], session_id: string, user_id: string }`
*   **API Response**:
    *   **Output**: `{ response: string, review_request?: ReceiptData, attachments: string[] }`
*   **Frontend Action**: Displays the natural language response. If a `review_request` is present, automatically navigates the user to the **Review Interface**.

### 2. Receipt Upload (Step 1)
*   **User Action**: User uploads a receipt image via the dedicated upload area or chat.
*   **API Request (`POST /chat`)**:
    *   **Input**: `{ text: "Please analyze this receipt", files: [Base64Image], ... }`

### 3. AI Analysis & Review Request (Step 2)
*   **System Action**: The AI Agent analyzes the receipt, identifying items and categorizing them as HSA-eligible or non-eligible.
*   **API Response**:
    *   **Output**: Returns a structured `review_request` object containing extracted data (store, date, items) and their eligibility status.
*   **Frontend Action**: Automatically navigates the user to the **Review & Approve** page to verify the AI's classification.

### 4. Review & Approve (Step 3)
*   **User Action**: User verifies and edits the extracted receipt data (e.g., correcting prices, moving items between "HSA Eligible" and "Non-Eligible" categories) and clicks "Approve".
*   **API Request (`POST /review`)**:
    *   **Input**: `{ receipt_id: string, approved_hsa_eligible_items: Item[], approved_non_hsa_eligible_items: Item[], ... }`
*   **API Response**:
    *   **Output**: `{ items: ItemFull[] }` (Returns the fully processed and stored item records).
*   **Frontend Action**: Displays a success message and automatically navigates the user to the **Expense Summary** page (Step 4).

### 5. Expense Summary (Step 4)
*   **User Action**: User navigates to the Summary page to view their HSA spending report.
*   **API Request**:
    *   *Note: Currently integrated within the chat flow or local state management.*
*   **Frontend Action**: Visualizes the user's total HSA-eligible expenses vs. non-eligible expenses using the data confirmed in Step 3.

## Agent Workflow: 

**Multi-agent system**: Core to our HSA expense assistant is the expense manager agent which handles both text and image user requests with dedicated prompt instructions to LLMs and diverse thinking mode. The primary agent delegates specific sub-tasks to specialized agents or tools, ensuring efficient and accurate processing of complex user requests.

![agent_workflow](images/agent_flow.png)

### 1. Agent Custom Tools

The expense manager agent uses four custom tools to handle receipt data and queries:

**request_receipt_review**

When the agent processes a receipt image, it extracts key details such as store name, date, total cost, payment card details, and itemized line items, and categorizes each item based on its HSA eligibility. This tool initiates the human review workflow required before storage. It validates input data formats and returns a JSON payload for the backend to present to users in the review interface. 

**get_receipt_data_by_image_id**

This tool retrieves previously stored receipt data using the unique image identifier extracted from uploaded receipt images. When users reference a specific receipt, the agent uses this tool to fetch the document from Firestore. It returns receipt metadata, including store name, transaction time, total amount, currency, and all three item categories. 

**search_receipts_by_metadata_filter**

This tool performs structured Firestore queries using field filters on transaction_time and total_amount, enabling date-range and amount-range searches.  Results include all matching receipts with metadata and items. Example queries are like "show me all receipts between January and March" or "find receipts over $100."

**search_relevant_receipts_by_natural_language_query**

This tool uses semantic search via vector embeddings to find receipts by meaning rather than exact matches. It generates an embedding for the query text using Google's text-embedding-004 model, then performs a vector similarity search in Firestore against pre-computed receipt embeddings. The embeddings capture store names, item names, and other receipt details, enabling natural queries like "coffee purchases" or "groceries at Whole Foods" without requiring exact string matching.


### 2. Sub Agent as Tool

The `web_search_agent` is a specialized search agent which functions as a tool for the root agent, powered by `gemini-2.5-flash` and equipped with the built-in `google_search` tool. When the root `expense_manager_agent` encounters a query requiring external knowledge (e.g., verifying if a specific item is HSA-eligible), it delegates the task to the `web_search_agent`, which performs the search and returns cited findings.

### 3. Session & Memory Management

- We use `InMemorySessionService` to manage active chat sessions, maintaining the immediate conversation state in memory for fast access. 
- `GcsArtifactService` handles the storage of large artifacts like receipt images, keeping the context window lightweight.
- **Long-term Memory**:
    *   **Firestore (Vector DB)**: Stores receipt embeddings and metadata, enabling semantic search and retrieval of past expenses.
    *   **SQLite (Structured DB)**: Acts as the definitive record for approved, structured expense data, ensuring data integrity for reporting.

### 4. Context Engineering

To optimize the context window and improve agent performance, we employ context engineering techniques via callbacks:
*   **Context Compaction**: `modify_image_data_in_history` processes chat history before it reaches the model, managing how image data is represented to prevent context overflow.
*   **Response Enhancement**: `add_inline_citations_callback` post-processes the agent's output to ensure citations from the web search agent are correctly formatted and integrated.

## Backend: Database and Logging

**Observability**: The backend implements comprehensive structured logging using a custom `logger` module. Every request is tracked via `RequestLoggingMiddleware`, capturing inputs, processing times, and errors. The agent's thought process (thinking mode) and final responses are also logged, providing full visibility into the AI's decision-making.

**Deployment**: The system is deployed as decoupled microservices on Google Cloud Run. The frontend and backend are containerized separately, allowing for independent scaling and maintenance. The backend connects to Google Cloud services (Firestore, Vertex AI, Cloud Storage) using application-default credentials.




# Agent Deployment Instructions

## Frontend Setup

### 1. Local Development

To run the frontend application locally on your machine:

**Prerequisites**:
*   Ensure **Node.js** (v18 or higher recommended) is installed on your machine.

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```

4.  **Access the application**:
    Open your browser and visit `http://localhost:3000`.

    > **Note**: Ensure your backend service is running locally. The frontend is configured (via `vite.config.ts`) to proxy `/api` requests to the backend server (default: `http://localhost:8080`).

### 2. Deployment to Google Cloud

We provide an automated shell script to streamline the deployment process to Google Cloud Run.

1.  **Prerequisites**:
    Ensure you have the Google Cloud SDK installed and are authenticated:
    ```bash
    gcloud auth login
    gcloud config set project YOUR_PROJECT_ID
    ```

2.  **Run the deployment script**:
    Execute the following command from the `frontend` directory:
    ```bash
    ./deploy-frontend.sh
    ```
    *This script performs the following actions:*
    *   *Builds a production-ready Docker image for the frontend.*
    *   *Pushes the image to the Google Container Registry (GCR).*
    *   *Deploys the image as a stateless container to Cloud Run.*

3.  **Access the deployed app**:
    Once the script completes successfully, it will output the **Frontend Address** (e.g., `https://hsa-ai-assistant-frontend-xyz.a.run.app`). You can access your live application via this URL.


## Backend

### Local Development
1. In google cloud console, create a Google Cloud Project
2. Create a Firestore Database 
3. Setup Cloud Project in Cloud Shell Terminal:
	1. 	`gcloud services enable aiplatform.googleapis.com \
                       firestore.googleapis.com \
                       run.googleapis.com \
                       cloudbuild.googleapis.com \
                       cloudresourcemanager.googleapis.com`
4. Prepare Google Cloud Storage Bucket
	1. `gsutil mb -l us-central1 gs://personal-expense-{your-project-id}`
5. Create Firestore index for search:
	1. To support compound queries: 
    
        `cloud firestore indexes composite create \
        --collection-group=personal-expense-assistant-receipts \
        --field-config field-path=total_amount,order=ASCENDING \
        --field-config field-path=transaction_time,order=ASCENDING \
        --field-config field-path=__name__,order=ASCENDING \
        --database="(default)"`
    2. To support vector search: 
    
        `gcloud firestore indexes composite create \
        --collection-group="personal-expense-assistant-receipts" \
        --query-scope=COLLECTION \
        --field-config field-path="embedding",vector-config='{"dimension":"768", "flat": "{}"}' \
        --database="(default)"`
6. Install Google Cloud CLI and create a local authentication credential for your account:
	1. `gcloud auth application-default login`
7. Create a virtual environment and set up all dependencies:
	1. `uv sync --fronzen`
8. run backend locally:
	1. `uv run backend.py`
9. Access backend swagger api at: `http://localhost:8080/docs`

	
### Deploy to cloud
To deploy the backend to cloud using CloudRun, use this command:

`gcloud run deploy personal-expense-assistant \
                  --source . \
                  --port=8080 \
                  --allow-unauthenticated \
                  --env-vars-file=settings.yaml \
                  --memory 1024Mi \
                  --region us-central1`