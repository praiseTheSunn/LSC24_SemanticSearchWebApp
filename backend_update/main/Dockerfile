FROM continuumio/miniconda3

WORKDIR /app
COPY main/ /app
COPY dataset/ /app/dataset

# Create the conda environment
RUN conda env create -f /app/environment.yml

# Make sure the environment is activated:
SHELL ["conda", "run", "-n", "main", "/bin/bash", "-c"]

CMD ["bash", "run.sh"]