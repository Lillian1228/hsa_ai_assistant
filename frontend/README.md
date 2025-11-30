# HSA AI Assistant - Frontend

This directory contains the frontend application for the HSA AI Assistant, a modern web interface designed to help users manage their Health Savings Account expenses with AI-powered receipt analysis.

## User Interaction Flows

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
*   **API Response**:
    *   **Output**: Returns a structured `review_request` object containing AI-extracted data (store name, date, line items, HSA eligibility status).
*   **Frontend Action**: Parses the `review_request` and redirects the user to the **Review & Approve** page.

### 3. Review & Approve (Step 3)
*   **User Action**: User verifies and edits the extracted receipt data (e.g., correcting prices, moving items between "HSA Eligible" and "Non-Eligible" categories) and clicks "Approve".
*   **API Request (`POST /review`)**:
    *   **Input**: `{ receipt_id: string, approved_hsa_eligible_items: Item[], approved_non_hsa_eligible_items: Item[], ... }`
*   **API Response**:
    *   **Output**: `{ items: ItemFull[] }` (Returns the fully processed and stored item records).
*   **Frontend Action**: Displays a success message and automatically navigates the user to the **Expense Summary** page (Step 4).

### 4. Expense Summary (Step 4)
*   **User Action**: User navigates to the Summary page to view their HSA spending report.
*   **API Request**:
    *   *Note: Currently integrated within the chat flow or local state management.*
*   **Frontend Action**: Visualizes the user's total HSA-eligible expenses vs. non-eligible expenses using the data confirmed in Step 3.

## Setup & Deployment

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
