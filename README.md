# HSA/FSA Expense Tracker




## Env Setup

1. Set up the virtual environment

```bash
conda create -n hsa_agent python=3.11 -y
conda activate hsa_agent && pip install -r requirements.txt
python -m ipykernel install --user --name=hsa_agent --display-name "hsa_agent" 
```
2. Run the test agent

```bash
adk run hsa_agent
```