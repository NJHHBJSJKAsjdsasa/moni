FROM python:3.11-slim

# Python env vars
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# env
ENV HOME="/app" \
    XDG_CONFIG_HOME="/app" \
    XDG_DATA_HOME="/app"

# deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# wd
WORKDIR /app

# copy
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# copy to modify on local
COPY . /app_defaults

# encrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# THE EXPOSE!
EXPOSE 42424

# define and command
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "__main__.py"]
