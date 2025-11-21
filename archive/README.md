# HSA/FSA Expense Tracker




## Env Setup

1. Set up the virtual environment

```bash
conda create -n hsa_agent python=3.11 -y
conda activate hsa_agent && pip install -r requirements.txt
python -m ipykernel install --user --name=hsa_agent --display-name "hsa_agent" 
```

2. Set up API keys

Create a `.env` file in the project root with your API keys:

```bash
# Google AI API Key (required for gemini models)
# Get your API key from: https://aistudio.google.com/apikey
GOOGLE_API_KEY=your_google_api_key_here

# Optional: OpenAI API Key (if using llm_client.py)
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** Make sure `.env` is in your `.gitignore` (already included) to avoid committing your API keys.

3. Run the test agent

```bash
adk run hsa_agent
```

Or run directly:

```bash
python hsa_agent/agent.py
```