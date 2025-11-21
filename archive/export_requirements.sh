#!/bin/bash
# Script to export Python package requirements including Python version

echo "Exporting package requirements..."

# Get Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

# Export all packages with versions (for exact reproducibility)
echo "# Python version: $PYTHON_VERSION" > requirements_full.txt
echo "# Generated on: $(date)" >> requirements_full.txt
echo "# Install with: pip install -r requirements_full.txt" >> requirements_full.txt
echo "" >> requirements_full.txt
pip freeze >> requirements_full.txt

echo "Full requirements exported to: requirements_full.txt"

# Export only top-level packages (user-installed)
echo "# Python version: $PYTHON_VERSION" > requirements_top.txt
echo "# Generated on: $(date)" >> requirements_top.txt
echo "# Install with: pip install -r requirements_top.txt" >> requirements_top.txt
echo "" >> requirements_top.txt
pip list --format=freeze | grep -v -E "^(pkg-resources|distribute|setuptools|pip|wheel)" >> requirements_top.txt

echo "Top-level requirements exported to: requirements_top.txt"

