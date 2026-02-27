# Base image with Conda and Linux OS
FROM condaforge/miniforge3:24.9.2-0

# Prevent Conda from activating the base environment by default
ENV CONDA_AUTO_ACTIVATE_BASE=false

# Set PYTHONPATH to include shared libraries
ENV PYTHONPATH=/app/libs

# Set the working directory for all next commands (THIS AFFECTS "RUN", "CMD")
WORKDIR /app

# Copy file (destination still is the same level with /app)
# Due to above WORKDIR, the destination can also be written as just "environment.yml"
COPY main/environment.yml /app/environment.yml

# Create, update, and clean Conda environment
RUN conda env create --solver=libmamba -n py311_env -f /app/environment.yml && \
    conda clean -afy

RUN conda run -n py311_env python -m spacy download en_core_web_sm
    
# Copy service code
COPY main /app/main

# Copy shared libraries (baked for prod)
COPY libs /app/libs
COPY configs /app/configs

# Set working directory to service folder
WORKDIR /app/main

# "This container listens on port 20721"
EXPOSE 20721

# Entrypoint
# Run a command inside a named Conda environment
CMD ["conda", "run", "--no-capture-output", "-n", "py311_env", "python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "20721"]