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
COPY db/environment.yml /app/environment.yml

# Create, update, and clean Conda environment
RUN conda env create --solver=libmamba -n py310_env -f /app/environment.yml && \
    conda clean -afy

# Copy service code
COPY db /app/db

# Copy shared libraries
COPY libs /app/libs
COPY configs /app/configs

# Set working directory to service folder
WORKDIR /app/db

# "This container listens on port 20723"
EXPOSE 20723

# Entrypoint
# Run a command inside a named Conda environment
CMD ["conda", "run", "--no-capture-output", "-n", "py310_env", "python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "20723"]