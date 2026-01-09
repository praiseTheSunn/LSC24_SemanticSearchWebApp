FROM continuumio/miniconda3

WORKDIR /app

# Copy environment file first for better caching
COPY environment.yml /app/environment.yml

# Create conda environment
RUN conda env create -f /app/environment.yml

# Copy application code
COPY . /app
COPY ../dataset /app/dataset

# Make sure the environment is activated
SHELL ["conda", "run", "-n", "llm_agent", "/bin/bash", "-c"]

# Expose port
EXPOSE 8002

# Run the application
CMD ["conda", "run", "-n", "llm_agent", "python", "main.py"]