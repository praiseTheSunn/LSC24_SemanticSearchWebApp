FROM continuumio/miniconda3:latest

# Prevent conda from asking questions
ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Copy environment file
COPY environment.yml /app/environment.yml

# Update base environment (since name=base)
RUN conda env update -n base -f environment.yml && \
    conda clean -afy

# Use conda base by default
SHELL ["/bin/bash", "-c"]

# Copy service code
COPY milvus/main.py /app/main.py
COPY milvus/run.sh /app/run.sh

# Make script executable
RUN chmod +x /app/run.sh

# Python path
ENV PYTHONPATH=/app/libs

# Expose internal port (documentation only)
EXPOSE 20725

# Start service
CMD ["/app/run.sh"]
